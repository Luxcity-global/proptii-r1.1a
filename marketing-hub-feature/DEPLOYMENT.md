# Marketing Hub - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Marketing Hub application to production environments.

## Prerequisites

- Node.js 18+ and npm
- Docker (optional, for containerized deployment)
- Access to deployment platform (Vercel, Netlify, AWS, etc.)

## Environment Setup

### 1. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_APP_ENV=production

# Analytics (optional)
VITE_GA_TRACKING_ID=your-google-analytics-id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

### 2. Backend Environment Variables

For the backend server, create a `.env` file:

```bash
# Server Configuration
PORT=8001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Database (when implemented)
DATABASE_URL=your-database-connection-string

# External Services
REDIS_URL=your-redis-connection-string
```

## Build Process

### Frontend Build

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test:run

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Backend Build

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm run test

# Build TypeScript
npm run build

# Start production server
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**

   - Add environment variables in Vercel dashboard
   - Set `VITE_API_BASE_URL` to your backend URL

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Deploy via Git**

   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Add in Netlify dashboard under Site Settings > Environment Variables

### Option 3: Docker Deployment

1. **Create Dockerfile**

   ```dockerfile
   # Frontend Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and Deploy**

   ```bash
   # Build Docker image
   docker build -t marketing-hub-frontend .

   # Run container
   docker run -p 80:80 marketing-hub-frontend
   ```

### Option 4: AWS S3 + CloudFront

1. **Build and Upload**

   ```bash
   # Build the application
   npm run build

   # Upload to S3
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

2. **CloudFront Configuration**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom error pages for SPA routing

## Backend Deployment

### Option 1: Railway

1. **Connect Repository**
   - Connect your backend repository to Railway
   - Set environment variables
   - Deploy automatically on push

### Option 2: Heroku

1. **Prepare for Heroku**

   ```bash
   # Add Procfile
   echo "web: npm start" > Procfile

   # Deploy
   git push heroku main
   ```

### Option 3: AWS EC2

1. **Server Setup**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2

   # Start application
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Performance Optimization

### Frontend Optimizations

1. **Bundle Analysis**

   ```bash
   # Analyze bundle size
   npm run build
   # Check dist/stats.html for bundle analysis
   ```

2. **Image Optimization**

   - Use WebP format for images
   - Implement lazy loading
   - Optimize image sizes

3. **Caching Strategy**
   - Set appropriate cache headers
   - Use service workers for offline support
   - Implement CDN caching

### Backend Optimizations

1. **Compression**

   ```javascript
   // Enable gzip compression
   app.use(compression());
   ```

2. **Rate Limiting**
   ```javascript
   // Implement rate limiting
   const rateLimit = require("express-rate-limit");
   app.use(
     rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 100, // limit each IP to 100 requests per windowMs
     })
   );
   ```

## Monitoring and Logging

### Frontend Monitoring

1. **Error Tracking**

   - Integrate Sentry for error tracking
   - Set up performance monitoring

2. **Analytics**
   - Google Analytics 4
   - Custom event tracking

### Backend Monitoring

1. **Logging**

   ```javascript
   // Use structured logging
   const winston = require("winston");
   const logger = winston.createLogger({
     level: "info",
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: "error.log", level: "error" }),
       new winston.transports.File({ filename: "combined.log" }),
     ],
   });
   ```

2. **Health Checks**
   - Implement health check endpoints
   - Set up uptime monitoring

## Security Considerations

### Frontend Security

1. **Content Security Policy**

   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline';"
   />
   ```

2. **HTTPS**
   - Ensure all traffic uses HTTPS
   - Set up HSTS headers

### Backend Security

1. **Security Headers**

   ```javascript
   // Use helmet for security headers
   app.use(
     helmet({
       contentSecurityPolicy: false,
       crossOriginEmbedderPolicy: false,
     })
   );
   ```

2. **Input Validation**
   - Validate all input data
   - Sanitize user inputs
   - Use parameterized queries

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test all API endpoints
- [ ] Check error handling and logging
- [ ] Verify HTTPS is working
- [ ] Test responsive design on mobile devices
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test error boundaries
- [ ] Check accessibility compliance
- [ ] Verify SEO meta tags

## Rollback Strategy

1. **Database Rollback**

   - Keep database migration scripts
   - Test rollback procedures

2. **Application Rollback**
   - Use blue-green deployment
   - Keep previous version ready for quick rollback

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**

   - Check environment variables
   - Verify API endpoints are accessible
   - Check browser console for errors

3. **Performance Issues**
   - Analyze bundle size
   - Check for memory leaks
   - Optimize database queries

### Support

For deployment issues, check:

- Application logs
- Server logs
- Browser developer tools
- Network tab for API calls

## Maintenance

### Regular Tasks

1. **Security Updates**

   - Keep dependencies updated
   - Monitor security advisories
   - Apply security patches promptly

2. **Performance Monitoring**

   - Monitor Core Web Vitals
   - Check bundle size regularly
   - Optimize based on usage patterns

3. **Backup Strategy**
   - Regular database backups
   - Code repository backups
   - Configuration backups
