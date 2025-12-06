# Deployment Guide

This guide covers deploying the Xeno Shopify Data Ingestion & Insights Service to various platforms.

## Prerequisites

- GitHub repository with the code
- Account on deployment platform (Heroku, Railway, Render, Vercel)
- PostgreSQL database (provided by platform or external)

## Platform-Specific Deployment

### Heroku

#### Backend Deployment

1. **Create Heroku App**
```bash
cd backend
heroku create xeno-shopify-backend
```

2. **Add PostgreSQL Addon**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set FRONTEND_URL=https://your-frontend-app.herokuapp.com
heroku config:set NODE_ENV=production
heroku config:set SYNC_INTERVAL_MINUTES=60
```

4. **Deploy**
```bash
git push heroku main
```

5. **Run Migrations**
```bash
heroku run npx prisma migrate deploy
heroku run npx prisma generate
```

#### Frontend Deployment

1. **Create Heroku App**
```bash
cd frontend
heroku create xeno-shopify-frontend
```

2. **Set Buildpacks**
```bash
heroku buildpacks:add heroku/nodejs
```

3. **Set Environment Variables**
```bash
heroku config:set NEXT_PUBLIC_API_URL=https://xeno-shopify-backend.herokuapp.com
```

4. **Deploy**
```bash
git push heroku main
```

### Railway

#### Backend Deployment

1. **Create New Project**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Add PostgreSQL Service**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"

3. **Configure Backend Service**
   - Select backend directory as root
   - Set start command: `npx prisma migrate deploy && npx prisma generate && node src/server.js`

4. **Set Environment Variables**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-frontend.railway.app
   NODE_ENV=production
   PORT=3001
   SYNC_INTERVAL_MINUTES=60
   ```

5. **Deploy**
   - Railway will automatically deploy on git push

#### Frontend Deployment

1. **Create New Service**
   - In the same project, add new service
   - Select frontend directory

2. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

3. **Deploy**
   - Railway will automatically deploy

### Render

#### Backend Deployment

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repository

2. **Configure Service**
   - **Name**: xeno-shopify-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && node src/server.js`

3. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Note the connection string

4. **Set Environment Variables**
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET=<generate secret>
   FRONTEND_URL=https://your-frontend.onrender.com
   NODE_ENV=production
   PORT=3001
   SYNC_INTERVAL_MINUTES=60
   ```

5. **Deploy**
   - Render will deploy automatically

#### Frontend Deployment

1. **Create Static Site or Web Service**
   - For Next.js, use Web Service
   - Connect GitHub repository

2. **Configure Service**
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

### Vercel (Frontend Only)

Vercel is optimized for Next.js frontend deployment.

1. **Import Project**
   - Go to Vercel dashboard
   - Click "Add New" → "Project"
   - Import from GitHub

2. **Configure**
   - **Root Directory**: frontend
   - **Framework Preset**: Next.js

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

4. **Deploy**
   - Vercel will deploy automatically

**Note**: For backend, use Heroku, Railway, or Render as Vercel is primarily for frontend.

## Docker Deployment

### Using Docker Compose

1. **Update Environment Variables**
   - Edit `docker-compose.yml`
   - Set all required environment variables

2. **Build and Start**
```bash
docker-compose up -d
```

3. **Run Migrations**
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma generate
```

### Using Individual Dockerfiles

#### Backend
```bash
cd backend
docker build -t xeno-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  xeno-backend
```

#### Frontend
```bash
cd frontend
docker build -t xeno-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  xeno-frontend
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Health check endpoint working (`/health`)
- [ ] Frontend can connect to backend API
- [ ] Authentication flow working
- [ ] Data sync functionality tested
- [ ] Webhook endpoints accessible (if using webhooks)
- [ ] SSL/HTTPS enabled
- [ ] CORS configured correctly
- [ ] Error logging set up
- [ ] Monitoring configured

## Environment Variables Reference

### Backend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | Yes | production |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | Token expiration | No | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | - |
| `SYNC_INTERVAL_MINUTES` | Scheduler interval | No | 60 |

### Frontend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | - |

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment platform
- Ensure SSL is configured if required

### CORS Errors

- Verify `FRONTEND_URL` matches actual frontend URL
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Migration Failures

- Run `npx prisma migrate deploy` manually
- Check database permissions
- Verify schema is up to date

### Build Failures

- Check Node.js version (requires 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

## Monitoring

After deployment, set up:

1. **Health Checks**: Use `/health` endpoint
2. **Error Tracking**: Integrate Sentry or similar
3. **Logging**: Use platform logging or external service
4. **Uptime Monitoring**: Use UptimeRobot or similar
5. **Performance Monitoring**: Use APM tools

## Scaling

For production scaling:

1. **Horizontal Scaling**: Deploy multiple backend instances
2. **Load Balancer**: Use platform load balancer
3. **Database**: Use managed PostgreSQL with read replicas
4. **Caching**: Add Redis for frequently accessed data
5. **CDN**: Use CDN for static assets

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] HTTPS/SSL enabled
- [ ] CORS configured correctly
- [ ] Environment variables not exposed
- [ ] API rate limiting (recommended)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)

