import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import ingestionService from '../services/ingestionService.js';

const prisma = new PrismaClient();

/**
 * Scheduler to periodically sync Shopify data
 * Runs every hour by default
 */
class SyncScheduler {
  constructor() {
    this.job = null;
    this.intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 60;
  }

  start() {
    // Run every hour (configurable)
    const cronExpression = `0 */${this.intervalMinutes} * * * *`; // Every N minutes
    
    this.job = cron.schedule(cronExpression, async () => {
      console.log(`[Scheduler] Starting scheduled sync at ${new Date().toISOString()}`);
      
      try {
        // Get all active tenants
        const tenants = await prisma.tenant.findMany({
          where: { isActive: true }
        });

        console.log(`[Scheduler] Found ${tenants.length} active tenants`);

        // Sync each tenant
        for (const tenant of tenants) {
          try {
            console.log(`[Scheduler] Syncing tenant: ${tenant.name} (${tenant.shopDomain})`);
            
            const results = await ingestionService.syncAll(tenant.id);
            
            console.log(`[Scheduler] Completed sync for ${tenant.name}:`, {
              customers: results.results.customers,
              orders: results.results.orders,
              products: results.results.products
            });
          } catch (error) {
            console.error(`[Scheduler] Error syncing tenant ${tenant.name}:`, error.message);
            // Continue with other tenants even if one fails
          }
        }

        console.log(`[Scheduler] Scheduled sync completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('[Scheduler] Fatal error in scheduled sync:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log(`[Scheduler] Started - will run every ${this.intervalMinutes} minutes`);
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('[Scheduler] Stopped');
    }
  }
}

// Export singleton instance
const syncScheduler = new SyncScheduler();

// Start scheduler when module is imported (in production)
if (process.env.NODE_ENV !== 'test') {
  syncScheduler.start();
}

export default syncScheduler;

