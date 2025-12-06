/**
 * Smoke Check Routes (Dev Only)
 * 
 * Quick end-to-end verification endpoint.
 * Only enabled when NODE_ENV !== 'production' or ENABLE_SMOKE=true
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { getProductPerformance } from '../controllers/productPerformanceController.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/_smoke_check
 * Query params: tenantId (required)
 * 
 * Performs:
 *   - DB connectivity check
 *   - Product performance logic test (limit=1)
 * 
 * Returns: { db: true, productPerfOk: true } or error details
 */
router.get('/_smoke_check', async (req, res) => {
  // Only enable in dev or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SMOKE !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const tenantId = req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const results = {
      db: false,
      productPerfOk: false,
      timestamp: new Date().toISOString()
    };

    // DB connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.db = true;
    } catch (dbError) {
      return res.status(500).json({
        ...results,
        dbError: dbError.message
      });
    }

    // Product performance check
    try {
      await getProductPerformance(tenantId, null, null, 1);
      results.productPerfOk = true;
    } catch (perfError) {
      return res.status(500).json({
        ...results,
        productPerfError: perfError.message
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: 'Smoke check failed',
      message: error.message
    });
  }
});

export default router;

