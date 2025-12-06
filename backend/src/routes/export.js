/**
 * Export Routes
 * 
 * CSV export endpoints for orders, customers, and products.
 */

import express from 'express';
import { exportOrders, exportCustomers, exportProducts } from '../controllers/exportController.js';
import { authenticateToken, ensureTenantAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/export/orders
 * Query params: tenantId (required), from (optional), to (optional)
 */
router.get('/orders', authenticateToken, ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    await exportOrders(res, tenantId, req.query.from, req.query.to);
  } catch (error) {
    console.error('Export orders error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to export orders',
        message: error.message 
      });
    }
  }
});

/**
 * GET /api/export/customers
 * Query params: tenantId (required)
 */
router.get('/customers', authenticateToken, ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    await exportCustomers(res, tenantId);
  } catch (error) {
    console.error('Export customers error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to export customers',
        message: error.message 
      });
    }
  }
});

/**
 * GET /api/export/products
 * Query params: tenantId (required)
 */
router.get('/products', authenticateToken, ensureTenantAccess, async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    await exportProducts(res, tenantId);
  } catch (error) {
    console.error('Export products error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to export products',
        message: error.message 
      });
    }
  }
});

export default router;

