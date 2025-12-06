import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureTenantAccess } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview
router.get('/overview', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [totalCustomers, totalOrders, totalRevenue, totalProducts] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalPrice: true }
      }),
      prisma.product.count({ where: { tenantId } })
    ]);

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      totalProducts
    });
  } catch (error) {
    next(error);
  }
});

// Get orders by date (with date range filtering)
router.get('/orders/by-date', ensureTenantAccess, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      const where = { tenantId };
      if (startDate || endDate) {
        where.orderDate = {};
        if (startDate) where.orderDate.gte = new Date(startDate);
        if (endDate) where.orderDate.lte = new Date(endDate);
      }

      // Group orders by date
      const orders = await prisma.order.findMany({
        where,
        select: {
          orderDate: true,
          totalPrice: true
        },
        orderBy: { orderDate: 'asc' }
      });

      // Aggregate by date
      const ordersByDate = orders.reduce((acc, order) => {
        const date = order.orderDate.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, revenue: 0 };
        }
        acc[date].count += 1;
        acc[date].revenue += order.totalPrice;
        return acc;
      }, {});

      const result = Object.values(ordersByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      res.json({ ordersByDate: result });
    } catch (error) {
      next(error);
    }
  }
);

// Get top customers by spend
router.get('/customers/top', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 5;

    const topCustomers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totalSpent: true,
        ordersCount: true
      }
    });

    res.json({ topCustomers });
  } catch (error) {
    next(error);
  }
});

// Get revenue trends (daily, weekly, monthly)
router.get('/revenue/trends', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { period = 'daily', startDate, endDate } = req.query;

    const where = { tenantId };
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        orderDate: true,
        totalPrice: true
      },
      orderBy: { orderDate: 'asc' }
    });

    // Group by period
    const trends = {};
    orders.forEach(order => {
      let key;
      const date = new Date(order.orderDate);

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = { period: key, revenue: 0, orders: 0 };
      }
      trends[key].revenue += order.totalPrice;
      trends[key].orders += 1;
    });

    const result = Object.values(trends).sort((a, b) => 
      a.period.localeCompare(b.period)
    );

    res.json({ trends: result, period });
  } catch (error) {
    next(error);
  }
});

// Get product performance
router.get('/products/performance', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 10;

    // This is a simplified version - in production, you'd track product sales
    const products = await prisma.product.findMany({
      where: { tenantId, status: 'active' },
      orderBy: { inventoryQuantity: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        inventoryQuantity: true,
        vendor: true
      }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// Get order status breakdown
router.get('/orders/status', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const orders = await prisma.order.findMany({
      where: { tenantId },
      select: {
        financialStatus: true,
        fulfillmentStatus: true
      }
    });

    const financialStatus = {};
    const fulfillmentStatus = {};

    orders.forEach(order => {
      const finStatus = order.financialStatus || 'unknown';
      const fulStatus = order.fulfillmentStatus || 'unknown';

      financialStatus[finStatus] = (financialStatus[finStatus] || 0) + 1;
      fulfillmentStatus[fulStatus] = (fulfillmentStatus[fulStatus] || 0) + 1;
    });

    res.json({
      financialStatus,
      fulfillmentStatus
    });
  } catch (error) {
    next(error);
  }
});

// Get customer acquisition trends
router.get('/customers/acquisition', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { period = 'monthly' } = req.query;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { createdAt: true }
    });

    const trends = {};
    customers.forEach(customer => {
      const date = new Date(customer.createdAt);
      let key;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = { period: key, count: 0 };
      }
      trends[key].count += 1;
    });

    const result = Object.values(trends).sort((a, b) => 
      a.period.localeCompare(b.period)
    );

    res.json({ trends: result, period });
  } catch (error) {
    next(error);
  }
});

export default router;

