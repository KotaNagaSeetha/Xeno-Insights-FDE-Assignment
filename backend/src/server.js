import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import ingestionRoutes from './routes/ingestion.js';
import insightsRoutes from './routes/insights.js';
import webhookRoutes from './routes/webhooks.js';
// ADDED FOR REPORTS FEATURE
import productPerformanceRoutes from './routes/productPerformance.js';
import exportRoutes from './routes/export.js';
import smokeRoutes from './routes/smoke.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

// Import scheduler
import './scheduler/syncScheduler.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));

// Raw body parser for webhooks (must be before json parser)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON and URL encoded parsers for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', authenticateToken, tenantRoutes);
app.use('/api/ingestion', authenticateToken, ingestionRoutes);
app.use('/api/insights', authenticateToken, insightsRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhooks don't require JWT (use HMAC verification)
// ADDED FOR REPORTS FEATURE
app.use('/api/metrics', productPerformanceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api', smokeRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

