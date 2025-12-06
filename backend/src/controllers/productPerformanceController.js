/**
 * Product Performance Controller
 * 
 * Handles product performance metrics computation and API responses.
 * Computes per-product metrics: units sold, revenue, and order count.
 * 
 * Usage:
 *   GET /api/metrics/product-performance?tenantId=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=10
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get product performance metrics
 * 
 * @param {string} tenantId - Required tenant ID
 * @param {string} from - Optional start date (YYYY-MM-DD)
 * @param {string} to - Optional end date (YYYY-MM-DD)
 * @param {number} limit - Optional limit (default 10)
 * @returns {Promise<Array>} Array of product performance objects
 * 
 * @example
 *   const metrics = await getProductPerformance('tenant-id', '2024-01-01', '2024-12-31', 10);
 */
export async function getProductPerformance(tenantId, from, to, limit = 10) {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  // Default to last 90 days if no date range provided
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 90);
  
  const startDate = from ? new Date(from) : defaultFrom;
  const endDate = to ? new Date(to) : new Date();

  // Query order line items from CustomEvents (stored during seed/ingestion)
  // Event type: 'order_line_item', metadata: {orderId, productId, quantity, price}
  const lineItems = await prisma.customEvent.findMany({
    where: {
      tenantId,
      eventType: 'order_line_item',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      metadata: true,
      orderId: true
    }
  });

  // Aggregate by product
  const productMap = new Map();

  for (const item of lineItems) {
    try {
      const metadata = item.metadata ? JSON.parse(item.metadata) : {};
      const productId = metadata.productId;
      const quantity = parseFloat(metadata.quantity) || 0;
      const price = parseFloat(metadata.price) || 0;
      const orderId = item.orderId;

      if (!productId) continue;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          unitsSold: 0,
          revenue: 0,
          orderIds: new Set()
        });
      }

      const product = productMap.get(productId);
      product.unitsSold += quantity;
      product.revenue += price * quantity;
      if (orderId) {
        product.orderIds.add(orderId);
      }
    } catch (e) {
      // Skip invalid metadata
      continue;
    }
  }

  // Get product details and format results
  const productIds = Array.from(productMap.keys());
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      tenantId
    },
    select: {
      id: true,
      shopifyId: true,
      title: true,
      tenantId: true
    }
  });

  const productLookup = new Map(products.map(p => [p.id, p]));

  const results = Array.from(productMap.entries())
    .map(([productId, metrics]) => {
      const product = productLookup.get(productId);
      if (!product) return null;

      return {
        productId: product.id,
        shopId: product.shopifyId,
        title: product.title,
        unitsSold: Math.round(metrics.unitsSold),
        revenue: Math.round(metrics.revenue * 100) / 100,
        ordersCount: metrics.orderIds.size
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return results;
}

