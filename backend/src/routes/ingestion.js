import express from 'express';
import { ensureTenantAccess } from '../middleware/auth.js';
import ingestionService from '../services/ingestionService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Sync all data
router.post('/sync/all', ensureTenantAccess, async (req, res, next) => {
  try {
    const results = await ingestionService.syncAll(req.tenantId);
    res.json({
      message: 'Sync completed',
      ...results
    });
  } catch (error) {
    next(error);
  }
});

// Sync customers only
router.post('/sync/customers', ensureTenantAccess, async (req, res, next) => {
  try {
    const results = await ingestionService.syncCustomers(req.tenantId);
    res.json({
      message: 'Customers synced successfully',
      ...results
    });
  } catch (error) {
    next(error);
  }
});

// Sync orders only
router.post('/sync/orders', ensureTenantAccess, async (req, res, next) => {
  try {
    const { createdAfter } = req.body;
    const results = await ingestionService.syncOrders(req.tenantId, createdAfter);
    res.json({
      message: 'Orders synced successfully',
      ...results
    });
  } catch (error) {
    next(error);
  }
});

// Sync products only
router.post('/sync/products', ensureTenantAccess, async (req, res, next) => {
  try {
    const results = await ingestionService.syncProducts(req.tenantId);
    res.json({
      message: 'Products synced successfully',
      ...results
    });
  } catch (error) {
    next(error);
  }
});

// Get sync status
router.get('/status', ensureTenantAccess, async (req, res, next) => {
  try {
    const [customers, orders, products] = await Promise.all([
      prisma.customer.findFirst({
        where: { tenantId: req.tenantId },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true }
      }),
      prisma.order.findFirst({
        where: { tenantId: req.tenantId },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true }
      }),
      prisma.product.findFirst({
        where: { tenantId: req.tenantId },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true }
      })
    ]);

    res.json({
      customers: {
        lastSynced: customers?.syncedAt || null
      },
      orders: {
        lastSynced: orders?.syncedAt || null
      },
      products: {
        lastSynced: products?.syncedAt || null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

