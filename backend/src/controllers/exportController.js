/**
 * Export Controller
 * 
 * Handles CSV export functionality for orders, customers, and products.
 * Uses streaming to avoid loading all data into memory.
 */

import { PrismaClient } from '@prisma/client';
import { CsvStreamer } from '../utils/csvStreamer.js';

const prisma = new PrismaClient();
const PAGE_SIZE = 500;

/**
 * Export orders to CSV
 */
export async function exportOrders(res, tenantId, from, to) {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  const streamer = new CsvStreamer(res, `orders_${tenantId}_${Date.now()}.csv`);

  const where = { tenantId };
  if (from || to) {
    where.orderDate = {};
    if (from) where.orderDate.gte = new Date(from);
    if (to) where.orderDate.lte = new Date(to);
  }

  // Write header
  await streamer.writeHeader([
    'id',
    'shopOrderId',
    'customerShopId',
    'createdAt',
    'totalPrice',
    'status',
    'lineItems'
  ]);

  // Stream orders in pages
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        shopifyId: true,
        customerId: true,
        createdAt: true,
        totalPrice: true,
        financialStatus: true,
        fulfillmentStatus: true
      },
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      hasMore = false;
      break;
    }

    // Get line items for these orders from CustomEvents
    const orderIds = orders.map(o => o.id);
    const lineItems = await prisma.customEvent.findMany({
      where: {
        tenantId,
        eventType: 'order_line_item',
        orderId: { in: orderIds }
      },
      select: {
        orderId: true,
        metadata: true
      }
    });

    const lineItemsByOrder = new Map();
    lineItems.forEach(item => {
      if (!lineItemsByOrder.has(item.orderId)) {
        lineItemsByOrder.set(item.orderId, []);
      }
      try {
        const meta = item.metadata ? JSON.parse(item.metadata) : {};
        lineItemsByOrder.get(item.orderId).push(
          `${meta.productId || 'unknown'}:${meta.quantity || 0}`
        );
      } catch (e) {
        // Skip invalid
      }
    });

    // Get customer shopifyIds
    const customerIds = orders.filter(o => o.customerId).map(o => o.customerId);
    const customers = customerIds.length > 0 ? await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, shopifyId: true }
    }) : [];
    const customerMap = new Map(customers.map(c => [c.id, c.shopifyId]));

    // Write rows
    for (const order of orders) {
      const items = lineItemsByOrder.get(order.id) || [];
      const status = `${order.financialStatus || 'unknown'}/${order.fulfillmentStatus || 'unknown'}`;
      
      await streamer.writeRow([
        order.id,
        order.shopifyId,
        order.customerId ? customerMap.get(order.customerId) || '' : '',
        order.createdAt.toISOString(),
        order.totalPrice,
        status,
        items.join(';')
      ]);
    }

    skip += PAGE_SIZE;
    hasMore = orders.length === PAGE_SIZE;
  }

  await streamer.end();
}

/**
 * Export customers to CSV
 */
export async function exportCustomers(res, tenantId) {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  const streamer = new CsvStreamer(res, `customers_${tenantId}_${Date.now()}.csv`);

  await streamer.writeHeader([
    'id',
    'shopId',
    'email',
    'firstName',
    'lastName',
    'totalSpent',
    'createdAt'
  ]);

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        shopifyId: true,
        email: true,
        firstName: true,
        lastName: true,
        totalSpent: true,
        createdAt: true
      },
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' }
    });

    if (customers.length === 0) {
      hasMore = false;
      break;
    }

    for (const customer of customers) {
      await streamer.writeRow([
        customer.id,
        customer.shopifyId,
        customer.email || '',
        customer.firstName || '',
        customer.lastName || '',
        customer.totalSpent,
        customer.createdAt.toISOString()
      ]);
    }

    skip += PAGE_SIZE;
    hasMore = customers.length === PAGE_SIZE;
  }

  await streamer.end();
}

/**
 * Export products to CSV
 */
export async function exportProducts(res, tenantId) {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  const streamer = new CsvStreamer(res, `products_${tenantId}_${Date.now()}.csv`);

  await streamer.writeHeader([
    'id',
    'shopId',
    'title',
    'price',
    'createdAt'
  ]);

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        shopifyId: true,
        title: true,
        price: true,
        createdAt: true
      },
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    for (const product of products) {
      await streamer.writeRow([
        product.id,
        product.shopifyId,
        product.title,
        product.price || 0,
        product.createdAt.toISOString()
      ]);
    }

    skip += PAGE_SIZE;
    hasMore = products.length === PAGE_SIZE;
  }

  await streamer.end();
}

