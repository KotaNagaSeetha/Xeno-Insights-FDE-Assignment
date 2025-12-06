import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { ensureTenantAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current tenant info
router.get('/me', ensureTenantAccess, async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: {
        id: true,
        name: true,
        shopDomain: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error) {
    next(error);
  }
});

// Create new tenant (for onboarding)
router.post('/',
  [
    body('name').trim().notEmpty(),
    body('shopDomain').trim().notEmpty(),
    body('accessToken').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, shopDomain, accessToken, apiKey, apiSecret } = req.body;

      // Check if tenant already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { shopDomain }
      });

      if (existingTenant) {
        return res.status(409).json({ error: 'Tenant with this shop domain already exists' });
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name,
          shopDomain,
          accessToken,
          apiKey: apiKey || null,
          apiSecret: apiSecret || null
        },
        select: {
          id: true,
          name: true,
          shopDomain: true,
          isActive: true,
          createdAt: true
        }
      });

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update tenant configuration
router.put('/me', ensureTenantAccess,
  [
    body('name').optional().trim().notEmpty(),
    body('accessToken').optional().notEmpty(),
    body('isActive').optional().isBoolean()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, accessToken, apiKey, apiSecret, isActive } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (accessToken) updateData.accessToken = accessToken;
      if (apiKey !== undefined) updateData.apiKey = apiKey;
      if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
      if (isActive !== undefined) updateData.isActive = isActive;

      const tenant = await prisma.tenant.update({
        where: { id: req.tenantId },
        data: updateData,
        select: {
          id: true,
          name: true,
          shopDomain: true,
          isActive: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Tenant updated successfully',
        tenant
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

