# Xeno FDE Internship Assignment - Multi-Tenant Shopify Data Ingestion & Insights Service

A professional, production-ready multi-tenant service for ingesting and analyzing Shopify store data. Built with Node.js, Express, Next.js, PostgreSQL, and Prisma ORM.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete tenant isolation with secure data separation
- **Shopify Integration**: Full integration with Shopify Admin API for customers, orders, and products
- **Data Ingestion**: Automated and manual sync capabilities with webhook support
- **Insights Dashboard**: Beautiful, interactive dashboard with multiple charts and metrics
- **Authentication**: Email-based authentication with JWT tokens
- **Scheduled Sync**: Automatic hourly data synchronization
- **Webhook Support**: Real-time updates via Shopify webhooks
- **Production Ready**: Docker support, deployment configurations, and comprehensive documentation

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Assumptions](#assumptions)
- [Next Steps for Production](#next-steps-for-production)

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐
│   Shopify Store │
│   (Tenant 1)    │
└────────┬────────┘
         │
         │ API Calls / Webhooks
         │
┌────────▼─────────────────────────────────────┐
│         Backend API (Express.js)             │
│  ┌──────────────────────────────────────┐   │
│  │  Authentication & Authorization       │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Shopify Service (API Integration)    │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Ingestion Service (Data Sync)        │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Scheduler (Cron Jobs)                │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Webhook Handlers                     │   │
│  └──────────────────────────────────────┘   │
└────────┬─────────────────────────────────────┘
         │
         │ Prisma ORM
         │
┌────────▼────────┐
│   PostgreSQL    │
│  (Multi-Tenant) │
└─────────────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│  Next.js Frontend│
│  (React + Charts)│
└─────────────────┘
```

### Multi-Tenancy Implementation

- **Tenant Isolation**: Each tenant has a unique `tenantId` that is used to filter all database queries
- **Data Separation**: All tables include `tenantId` foreign key with proper indexing
- **Authentication**: JWT tokens include `tenantId` to ensure users can only access their tenant's data
- **API Security**: Middleware ensures all requests are scoped to the authenticated user's tenant

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Scheduling**: node-cron
- **Validation**: express-validator

### Frontend
- **Framework**: Next.js 14
- **UI**: React 18
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Infrastructure
- **Database**: PostgreSQL 15 (local installation)

## 📦 Setup Instructions
### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ installed and running locally

#### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. Database Setup

Make sure PostgreSQL is installed and running on your machine.

**Windows (Command Prompt or PowerShell):**
```powershell
# If PostgreSQL is in your PATH
createdb xeno_shopify

# Or using psql
psql -U postgres -c "CREATE DATABASE xeno_shopify;"
```

**macOS/Linux:**
```bash
createdb xeno_shopify

# Or using psql
psql -U postgres -c "CREATE DATABASE xeno_shopify;"
```

**Note**: Replace `postgres` with your PostgreSQL username if different. You may need to enter your PostgreSQL password.

#### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/xeno_shopify?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
SYNC_INTERVAL_MINUTES=60
```

**Important**: Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual PostgreSQL credentials.
- Username: Usually `postgres` (or your system username)
- Password: The password you set during PostgreSQL installation
- Port: `5432` (default PostgreSQL port)

**Example**:
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/xeno_shopify?schema=public"
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 4. Database Migration

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed  # Optional: Create demo tenant and user
```

#### 5. Start Services

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432 (PostgreSQL)

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "tenantId": "uuid-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Tenant Endpoints (Requires Authentication)

#### Get Current Tenant
```http
GET /api/tenants/me
Authorization: Bearer {token}
```

#### Create Tenant
```http
POST /api/tenants
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Store",
  "shopDomain": "mystore.myshopify.com",
  "accessToken": "shpat_...",
  "apiKey": "optional",
  "apiSecret": "optional"
}
```

### Ingestion Endpoints (Requires Authentication)

#### Sync All Data
```http
POST /api/ingestion/sync/all
Authorization: Bearer {token}
```

#### Sync Customers
```http
POST /api/ingestion/sync/customers
Authorization: Bearer {token}
```

#### Sync Orders
```http
POST /api/ingestion/sync/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "createdAfter": "2024-01-01T00:00:00Z" // Optional
}
```

#### Get Sync Status
```http
GET /api/ingestion/status
Authorization: Bearer {token}
```

### Insights Endpoints (Requires Authentication)

#### Get Overview
```http
GET /api/insights/overview
Authorization: Bearer {token}
```

#### Get Orders by Date
```http
GET /api/insights/orders/by-date?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

#### Get Top Customers
```http
GET /api/insights/customers/top?limit=5
Authorization: Bearer {token}
```

#### Get Revenue Trends
```http
GET /api/insights/revenue/trends?period=daily&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

### Webhook Endpoints (No Authentication - Uses HMAC)

#### Customer Webhooks
```http
POST /api/webhooks/customers/create
X-Shopify-Shop-Domain: mystore.myshopify.com
X-Shopify-Hmac-Sha256: {hmac}
X-Shopify-Topic: customers/create
```

#### Order Webhooks
```http
POST /api/webhooks/orders/create
X-Shopify-Shop-Domain: mystore.myshopify.com
X-Shopify-Hmac-Sha256: {hmac}
```

## 🗄️ Database Schema

### Core Tables

#### Tenants
- `id` (UUID, PK)
- `name` (String)
- `shopDomain` (String, Unique)
- `accessToken` (String)
- `apiKey` (String, Optional)
- `apiSecret` (String, Optional)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

#### Users
- `id` (UUID, PK)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String, Optional)
- `tenantId` (UUID, FK → Tenants)
- `role` (String: 'user' | 'admin')
- `createdAt`, `updatedAt` (DateTime)

#### Customers
- `id` (UUID, PK)
- `shopifyId` (String)
- `tenantId` (UUID, FK → Tenants)
- `email`, `firstName`, `lastName`, `phone` (String, Optional)
- `totalSpent` (Float)
- `ordersCount` (Int)
- `acceptsMarketing` (Boolean)
- `syncedAt` (DateTime)
- Unique: `(shopifyId, tenantId)`

#### Orders
- `id` (UUID, PK)
- `shopifyId` (String)
- `tenantId` (UUID, FK → Tenants)
- `customerId` (UUID, FK → Customers, Optional)
- `orderNumber` (String)
- `financialStatus`, `fulfillmentStatus` (String, Optional)
- `totalPrice`, `subtotalPrice`, `totalTax` (Float)
- `currency` (String)
- `orderDate` (DateTime)
- `syncedAt` (DateTime)
- Unique: `(shopifyId, tenantId)`

#### Products
- `id` (UUID, PK)
- `shopifyId` (String)
- `tenantId` (UUID, FK → Tenants)
- `title`, `handle`, `vendor`, `productType` (String, Optional)
- `status` (String)
- `price`, `compareAtPrice` (Float, Optional)
- `inventoryQuantity` (Int)
- `syncedAt` (DateTime)
- Unique: `(shopifyId, tenantId)`

#### Custom Events (Bonus)
- `id` (UUID, PK)
- `tenantId` (UUID, FK → Tenants)
- `eventType` (String: 'cart_abandoned', 'checkout_started', etc.)
- `customerId`, `orderId`, `productId` (UUID, Optional)
- `metadata` (String, JSON)
- `createdAt` (DateTime)

## 🚢 Deployment

### Heroku Deployment

#### Backend
```bash
cd backend
heroku create xeno-shopify-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your-secret
heroku config:set FRONTEND_URL=https://your-frontend.herokuapp.com
git push heroku main
heroku run npx prisma migrate deploy
```

#### Frontend
```bash
cd frontend
heroku create xeno-shopify-frontend
heroku config:set NEXT_PUBLIC_API_URL=https://xeno-shopify-backend.herokuapp.com
git push heroku main
```

### Railway Deployment

1. Connect GitHub repository
2. Create PostgreSQL service
3. Set environment variables
4. Deploy backend and frontend as separate services

### Render Deployment

1. Create PostgreSQL database
2. Deploy backend as Web Service
3. Deploy frontend as Static Site (or Web Service)
4. Configure environment variables

## 💡 Assumptions

1. **Shopify Store Setup**: Assumes user has access to a Shopify development store with Admin API access
2. **Access Tokens**: Assumes tenant provides valid Shopify Admin API access tokens
3. **Data Volume**: Designed to handle moderate data volumes; pagination implemented for large datasets
4. **Webhook Security**: HMAC verification implemented but optional in development mode
5. **Multi-Tenancy**: Assumes one user per tenant for simplicity (can be extended to multiple users)
6. **Time Zones**: All dates stored in UTC; frontend displays in user's local timezone
7. **Currency**: Defaults to USD; can be extended to support multiple currencies
8. **Rate Limiting**: Shopify API rate limits handled by pagination; no explicit rate limiting middleware (should be added in production)

## 🎯 Next Steps for Production

### Security Enhancements
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add request validation middleware
- [ ] Implement CORS whitelist
- [ ] Add API key authentication for webhooks
- [ ] Implement password reset functionality
- [ ] Add 2FA support
- [ ] Regular security audits

### Performance Optimizations
- [ ] Add Redis caching for frequently accessed data
- [ ] Implement database connection pooling
- [ ] Add query optimization and indexing review
- [ ] Implement CDN for static assets
- [ ] Add response compression
- [ ] Implement pagination for all list endpoints

### Scalability
- [ ] Implement message queue (RabbitMQ/SQS) for async processing
- [ ] Add horizontal scaling support
- [ ] Implement database read replicas
- [ ] Add load balancing
- [ ] Implement distributed caching

### Monitoring & Observability
- [ ] Add logging service (Winston, Pino)
- [ ] Implement error tracking (Sentry)
- [ ] Add application performance monitoring (APM)
- [ ] Set up health check endpoints
- [ ] Add metrics collection (Prometheus)
- [ ] Implement alerting

### Features
- [ ] Email notifications for sync failures
- [ ] Export data functionality (CSV, PDF)
- [ ] Advanced filtering and search
- [ ] Custom dashboard widgets
- [ ] Scheduled reports
- [ ] Multi-user support per tenant
- [ ] Role-based access control (RBAC)
- [ ] Audit logging

### Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright, Cypress)
- [ ] Load testing
- [ ] Security testing

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Developer guide
- [ ] Deployment runbooks
- [ ] Architecture decision records (ADRs)

## 📝 License

This project is created for the Xeno FDE Internship Assignment.

## 👤 Author
Author: NAGA SEETHA KOTA

Built for Xeno FDE Internship Assignment - 2025

---

**Note**: This is a demonstration project. For production use, implement all security measures, testing, and monitoring as outlined in the "Next Steps for Production" section.


## 🚀 Live Demo & Project Links

- 🌐 **Live Frontend (Vercel):**  
  👉 https://xeno-insights-fde-assignment.vercel.app

- 🎥 **Demo Video:**  
  👉 https://drive.google.com/file/d/1nk3tX6pc8T0xZB7IvBzLJUu8gPxYddTY/view?usp=drivesdk


