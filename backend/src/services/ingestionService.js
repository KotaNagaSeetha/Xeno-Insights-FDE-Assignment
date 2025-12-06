import { PrismaClient } from '@prisma/client';
import ShopifyService from './shopifyService.js';

const prisma = new PrismaClient();

/**
 * Data Ingestion Service
 * Handles syncing data from Shopify to database
 */
class IngestionService {
  /**
   * Sync all customers for a tenant
   */
  async syncCustomers(tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const shopify = new ShopifyService(tenant.shopDomain, tenant.accessToken);
      const shopifyCustomers = await shopify.getCustomers();

      let created = 0;
      let updated = 0;

      for (const shopifyCustomer of shopifyCustomers) {
        const customerData = {
          shopifyId: String(shopifyCustomer.id),
          tenantId,
          email: shopifyCustomer.email || null,
          firstName: shopifyCustomer.first_name || null,
          lastName: shopifyCustomer.last_name || null,
          phone: shopifyCustomer.phone || null,
          acceptsMarketing: shopifyCustomer.accepts_marketing || false,
          totalSpent: parseFloat(shopifyCustomer.total_spent || 0),
          ordersCount: parseInt(shopifyCustomer.orders_count || 0)
        };

        const existing = await prisma.customer.findUnique({
          where: {
            shopifyId_tenantId: {
              shopifyId: customerData.shopifyId,
              tenantId
            }
          }
        });

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              ...customerData,
              syncedAt: new Date()
            }
          });
          updated++;
        } else {
          await prisma.customer.create({
            data: customerData
          });
          created++;
        }
      }

      return {
        success: true,
        created,
        updated,
        total: shopifyCustomers.length
      };
    } catch (error) {
      console.error('Error syncing customers:', error);
      throw error;
    }
  }

  /**
   * Sync all orders for a tenant
   */
  async syncOrders(tenantId, createdAfter = null) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const shopify = new ShopifyService(tenant.shopDomain, tenant.accessToken);
      const shopifyOrders = await shopify.getOrders(250, 'any', createdAfter);

      let created = 0;
      let updated = 0;

      for (const shopifyOrder of shopifyOrders) {
        // Find customer if exists
        let customerId = null;
        if (shopifyOrder.customer) {
          const customer = await prisma.customer.findUnique({
            where: {
              shopifyId_tenantId: {
                shopifyId: String(shopifyOrder.customer.id),
                tenantId
              }
            }
          });
          customerId = customer?.id || null;
        }

        const orderData = {
          shopifyId: String(shopifyOrder.id),
          tenantId,
          customerId,
          orderNumber: String(shopifyOrder.order_number || shopifyOrder.number),
          financialStatus: shopifyOrder.financial_status || null,
          fulfillmentStatus: shopifyOrder.fulfillment_status || null,
          totalPrice: parseFloat(shopifyOrder.total_price || 0),
          subtotalPrice: parseFloat(shopifyOrder.subtotal_price || 0),
          totalTax: parseFloat(shopifyOrder.total_tax || 0),
          currency: shopifyOrder.currency || 'USD',
          orderDate: new Date(shopifyOrder.created_at)
        };

        const existing = await prisma.order.findUnique({
          where: {
            shopifyId_tenantId: {
              shopifyId: orderData.shopifyId,
              tenantId
            }
          }
        });

        if (existing) {
          await prisma.order.update({
            where: { id: existing.id },
            data: {
              ...orderData,
              syncedAt: new Date()
            }
          });
          updated++;
        } else {
          await prisma.order.create({
            data: orderData
          });
          created++;
        }
      }

      return {
        success: true,
        created,
        updated,
        total: shopifyOrders.length
      };
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }

  /**
   * Sync all products for a tenant
   */
  async syncProducts(tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const shopify = new ShopifyService(tenant.shopDomain, tenant.accessToken);
      const shopifyProducts = await shopify.getProducts();

      let created = 0;
      let updated = 0;

      for (const shopifyProduct of shopifyProducts) {
        // Get first variant price
        const firstVariant = shopifyProduct.variants?.[0];
        const price = firstVariant ? parseFloat(firstVariant.price || 0) : null;
        const compareAtPrice = firstVariant ? parseFloat(firstVariant.compare_at_price || 0) : null;
        
        // Calculate total inventory
        const inventoryQuantity = shopifyProduct.variants?.reduce(
          (sum, v) => sum + (parseInt(v.inventory_quantity || 0)),
          0
        ) || 0;

        const productData = {
          shopifyId: String(shopifyProduct.id),
          tenantId,
          title: shopifyProduct.title,
          handle: shopifyProduct.handle || null,
          vendor: shopifyProduct.vendor || null,
          productType: shopifyProduct.product_type || null,
          status: shopifyProduct.status || null,
          price,
          compareAtPrice: compareAtPrice || null,
          inventoryQuantity
        };

        const existing = await prisma.product.findUnique({
          where: {
            shopifyId_tenantId: {
              shopifyId: productData.shopifyId,
              tenantId
            }
          }
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              ...productData,
              syncedAt: new Date()
            }
          });
          updated++;
        } else {
          await prisma.product.create({
            data: productData
          });
          created++;
        }
      }

      return {
        success: true,
        created,
        updated,
        total: shopifyProducts.length
      };
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }

  /**
   * Sync all data for a tenant
   */
  async syncAll(tenantId) {
    try {
      const results = {
        customers: await this.syncCustomers(tenantId),
        orders: await this.syncOrders(tenantId),
        products: await this.syncProducts(tenantId)
      };

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  }
}

export default new IngestionService();

