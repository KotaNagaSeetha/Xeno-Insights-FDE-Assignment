import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import ingestionService from '../services/ingestionService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Verify Shopify webhook HMAC
function verifyShopifyWebhook(body, hmacHeader, secret) {
  if (!secret) {
    console.warn('Webhook secret not configured, skipping verification');
    return true; // In development, allow without secret
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}

// Middleware to verify webhook
const verifyWebhook = (req, res, next) => {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const topic = req.get('X-Shopify-Topic');

  if (!shopDomain) {
    return res.status(400).json({ error: 'Shop domain header missing' });
  }

  // Get tenant by shop domain
  prisma.tenant.findUnique({
    where: { shopDomain }
  }).then(tenant => {
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify HMAC if secret is available
    // req.body is already raw buffer from express.raw()
    if (tenant.apiSecret) {
      const rawBody = req.body.toString('utf8');
      if (!verifyShopifyWebhook(rawBody, hmacHeader, tenant.apiSecret)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      // Parse JSON after verification
      try {
        req.body = JSON.parse(rawBody);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in webhook body' });
      }
    } else {
      // If no secret, try to parse JSON
      try {
        req.body = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(req.body.toString('utf8'));
      } catch (e) {
        // Body might already be parsed
      }
    }

    req.tenant = tenant;
    req.webhookTopic = topic;
    next();
  }).catch(next);
};

// Handle customer webhooks
router.post('/customers/create', verifyWebhook, async (req, res) => {
  try {
    // Sync the specific customer or trigger full sync
    await ingestionService.syncCustomers(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/customers/update', verifyWebhook, async (req, res) => {
  try {
    await ingestionService.syncCustomers(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle order webhooks
router.post('/orders/create', verifyWebhook, async (req, res) => {
  try {
    await ingestionService.syncOrders(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/orders/update', verifyWebhook, async (req, res) => {
  try {
    await ingestionService.syncOrders(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle product webhooks
router.post('/products/create', verifyWebhook, async (req, res) => {
  try {
    await ingestionService.syncProducts(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/products/update', verifyWebhook, async (req, res) => {
  try {
    await ingestionService.syncProducts(req.tenant.id);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle cart abandoned events (bonus)
router.post('/events/cart/abandoned', verifyWebhook, async (req, res) => {
  try {
    const event = req.body;
    await prisma.customEvent.create({
      data: {
        tenantId: req.tenant.id,
        eventType: 'cart_abandoned',
        customerId: event.customer_id ? await getCustomerIdByShopifyId(req.tenant.id, event.customer_id) : null,
        metadata: JSON.stringify(event)
      }
    });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function
async function getCustomerIdByShopifyId(tenantId, shopifyCustomerId) {
  const customer = await prisma.customer.findUnique({
    where: {
      shopifyId_tenantId: {
        shopifyId: String(shopifyCustomerId),
        tenantId
      }
    }
  });
  return customer?.id || null;
}

export default router;

