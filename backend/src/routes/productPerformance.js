/**
 * Product Performance Routes
 * 
 * API endpoint for product performance metrics.
 * GET /api/metrics/product-performance
 */

import express from 'express';
import { getProductPerformance } from '../controllers/productPerformanceController.js';
import { authenticateToken, ensureTenantAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/metrics/product-performance
 * 
 * Query params:
 *   - tenantId (required): Tenant ID
 *   - from (optional): Start date YYYY-MM-DD (default: 90 days ago)
 *   - to (optional): End date YYYY-MM-DD (default: today)
 *   - limit (optional): Number of results (default: 10)
 * 
 * Response: Array of product performance objects
 *   [{ productId, shopId, title, unitsSold, revenue, ordersCount }]
 * 
 * Example:
 *   GET /api/metrics/product-performance?tenantId=abc123&from=2024-01-01&to=2024-12-31&limit=5
 */
router.get('/product-performance', authenticateToken, ensureTenantAccess, async (req, res, next) => {
  try {
    // Use tenantId from auth middleware (set by authenticateToken)
    // Fallback to query param for backward compatibility
    const tenantId = req.tenantId || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required. Please ensure you are authenticated.' });
    }

    const from = req.query.from;
    const to = req.query.to;
    const limit = parseInt(req.query.limit) || 10;

    const results = await getProductPerformance(tenantId, from, to, limit);

    res.json(results);
  } catch (error) {
    console.error('Product performance error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product performance',
      message: error.message 
    });
  }
});

export default router;

