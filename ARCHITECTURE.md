# Architecture Documentation

## System Architecture

### Overview

The Xeno Shopify Data Ingestion & Insights Service is a multi-tenant SaaS application that ingests data from Shopify stores and provides analytics dashboards. The system is designed with scalability, security, and maintainability in mind.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (React)                     │  │
│  │  - Dashboard with Charts (Recharts)                      │  │
│  │  - Authentication UI                                      │  │
│  │  - Data Sync Interface                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Express.js Backend API                       │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Auth       │  │  Ingestion   │  │  Insights    │   │  │
│  │  │   Routes     │  │  Routes      │  │  Routes      │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  Shopify     │  │  Ingestion   │  │  Scheduler   │   │  │
│  │  │  Service     │  │  Service     │  │  (Cron)       │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                      │  │
│  │  │  Webhook     │  │  Auth        │                      │  │
│  │  │  Handlers    │  │  Middleware  │                      │  │
│  │  └──────────────┘  └──────────────┘                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Prisma ORM
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                         │  │
│  │                                                            │  │
│  │  Tables:                                                 │  │
│  │  - tenants (multi-tenant isolation)                     │  │
│  │  - users (authentication)                                │  │
│  │  - customers (Shopify data)                              │  │
│  │  - orders (Shopify data)                                 │  │
│  │  - products (Shopify data)                               │  │
│  │  - custom_events (bonus features)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Shopify Admin API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Shopify Stores                              │  │
│  │  - Store 1 (Tenant 1)                                   │  │
│  │  - Store 2 (Tenant 2)                                   │  │
│  │  - Store N (Tenant N)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

The system uses **Row-Level Security (RLS)** through application-level filtering:

1. **Database Level**: Every table includes a `tenantId` foreign key
2. **Application Level**: All queries are automatically filtered by `tenantId` from the authenticated user's token
3. **API Level**: Middleware ensures `tenantId` is extracted from JWT and attached to all requests

### Data Flow

```
User Request
    │
    ├─► Extract JWT Token
    │
    ├─► Verify Token & Extract tenantId
    │
    ├─► Attach tenantId to Request Object
    │
    └─► All Database Queries Filter by tenantId
```

## Component Details

### Backend Components

#### 1. Authentication Service
- **Purpose**: Handle user registration, login, and JWT token management
- **Key Features**:
  - Email/password authentication
  - JWT token generation and validation
  - Password hashing with bcrypt
  - Token expiration handling

#### 2. Shopify Service
- **Purpose**: Interface with Shopify Admin API
- **Key Features**:
  - Paginated data fetching
  - Rate limit handling
  - Error handling and retries
  - Support for customers, orders, products

#### 3. Ingestion Service
- **Purpose**: Sync data from Shopify to database
- **Key Features**:
  - Upsert logic (create or update)
  - Batch processing
  - Incremental sync support
  - Error recovery

#### 4. Scheduler Service
- **Purpose**: Periodic data synchronization
- **Key Features**:
  - Cron-based scheduling (configurable interval)
  - Multi-tenant support
  - Error handling per tenant
  - Logging and monitoring

#### 5. Webhook Handlers
- **Purpose**: Real-time data updates from Shopify
- **Key Features**:
  - HMAC signature verification
  - Event routing
  - Idempotency handling
  - Error recovery

### Frontend Components

#### 1. Authentication Context
- **Purpose**: Global authentication state management
- **Key Features**:
  - User session management
  - Token storage (cookies)
  - Auto-logout on token expiration
  - Protected route handling

#### 2. Dashboard
- **Purpose**: Data visualization and insights
- **Key Features**:
  - Real-time data fetching
  - Multiple chart types (Line, Bar, Pie)
  - Date range filtering
  - Responsive design

#### 3. Data Sync Interface
- **Purpose**: Manual data synchronization control
- **Key Features**:
  - Individual entity sync
  - Full sync option
  - Sync status display
  - Results feedback

## Data Models

### Tenant Model
```typescript
{
  id: UUID
  name: string
  shopDomain: string (unique)
  accessToken: string (encrypted in production)
  apiKey?: string
  apiSecret?: string (encrypted in production)
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### User Model
```typescript
{
  id: UUID
  email: string (unique)
  password: string (hashed)
  name?: string
  tenantId: UUID (FK → Tenant)
  role: 'user' | 'admin'
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Customer Model
```typescript
{
  id: UUID
  shopifyId: string
  tenantId: UUID (FK → Tenant)
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  totalSpent: number
  ordersCount: number
  acceptsMarketing: boolean
  syncedAt: DateTime
}
```

### Order Model
```typescript
{
  id: UUID
  shopifyId: string
  tenantId: UUID (FK → Tenant)
  customerId?: UUID (FK → Customer)
  orderNumber: string
  financialStatus?: string
  fulfillmentStatus?: string
  totalPrice: number
  subtotalPrice: number
  totalTax: number
  currency: string
  orderDate: DateTime
  syncedAt: DateTime
}
```

### Product Model
```typescript
{
  id: UUID
  shopifyId: string
  tenantId: UUID (FK → Tenant)
  title: string
  handle?: string
  vendor?: string
  productType?: string
  status?: string
  price?: number
  compareAtPrice?: number
  inventoryQuantity: number
  syncedAt: DateTime
}
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   │
   ├─► Backend validates credentials
   │
   ├─► Generate JWT with userId, tenantId, email
   │
   ├─► Return token to frontend
   │
   └─► Frontend stores token in HTTP-only cookie (recommended) or localStorage
```

### Authorization Flow

```
1. Client sends request with JWT token
   │
   ├─► Middleware extracts and verifies token
   │
   ├─► Extract tenantId from token
   │
   ├─► Attach tenantId to request object
   │
   └─► All database queries automatically filter by tenantId
```

### Webhook Security

```
1. Shopify sends webhook with HMAC signature
   │
   ├─► Extract shop domain from header
   │
   ├─► Find tenant by shop domain
   │
   ├─► Verify HMAC using tenant's apiSecret
   │
   └─► Process webhook if valid
```

## API Design Patterns

### RESTful Endpoints

- **Authentication**: `/api/auth/*`
- **Tenants**: `/api/tenants/*`
- **Ingestion**: `/api/ingestion/*`
- **Insights**: `/api/insights/*`
- **Webhooks**: `/api/webhooks/*`

### Error Handling

- Consistent error response format
- HTTP status codes
- Error messages for debugging (development only)
- Logging for production debugging

### Response Format

```json
{
  "data": { ... },
  "message": "Success message",
  "error": null
}
```

## Scalability Considerations

### Current Limitations

1. **Single Database**: All tenants share one database (separated by tenantId)
2. **Synchronous Processing**: Data sync happens synchronously
3. **No Caching**: All queries hit the database directly
4. **Single Instance**: No horizontal scaling support

### Future Scalability Paths

1. **Database Sharding**: Partition tenants across multiple databases
2. **Message Queue**: Use RabbitMQ/SQS for async processing
3. **Caching Layer**: Redis for frequently accessed data
4. **Load Balancing**: Multiple backend instances
5. **CDN**: Static asset delivery
6. **Read Replicas**: Separate read/write databases

## Deployment Architecture

### Development
```
Local Machine
├── PostgreSQL (Docker or Local)
├── Backend (Node.js - nodemon)
└── Frontend (Next.js - dev server)
```

### Production (Recommended)
```
┌─────────────────┐
│   Load Balancer │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│Backend│ │Backend│ (Multiple instances)
└───┬───┘ └──┬───┘
    │        │
    └───┬────┘
        │
┌───────▼────────┐
│  PostgreSQL    │
│  (Primary)     │
└───────┬────────┘
        │
┌───────▼────────┐
│  PostgreSQL    │
│  (Read Replica)│
└────────────────┘
```

## Monitoring & Observability

### Current Implementation
- Console logging
- Error tracking in catch blocks
- Health check endpoint

### Recommended Additions
- Structured logging (Winston/Pino)
- Error tracking (Sentry)
- APM (New Relic/Datadog)
- Metrics collection (Prometheus)
- Distributed tracing

## Conclusion

This architecture provides a solid foundation for a multi-tenant SaaS application. The design prioritizes:

1. **Security**: Multi-tenant isolation, authentication, authorization
2. **Maintainability**: Clean code structure, ORM usage, separation of concerns
3. **Scalability**: Foundation for future growth
4. **Developer Experience**: Clear patterns, good documentation

The system is production-ready with the recommended enhancements outlined in the README.

