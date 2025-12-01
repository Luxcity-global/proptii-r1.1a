# Search Backend Deployment Guide

## Overview
This backend service provides property scraping functionality using Puppeteer and Playwright for browser automation.

## Deployment to Render

### Option 1: Docker Deployment (Recommended)

The backend is now configured to deploy using Docker, which ensures all browser dependencies are properly installed.

#### Configuration in render.yaml:
```yaml
- type: web
  name: proptii-search-backend
  env: docker
  dockerfilePath: ./search/backend/Dockerfile
  healthCheckPath: /health
  envVars:
    - key: NODE_VERSION
      value: 20.11.1
    - key: NODE_ENV
      value: production
    - key: PORT
      value: 3001
```

#### Deploy Steps:
1. Commit the changes to your repository:
   ```bash
   git add render.yaml search/backend/Dockerfile search/backend/.dockerignore
   git commit -m "Configure Docker deployment for search backend"
   git push
   ```

2. In Render dashboard:
   - Go to your search backend service
   - It should automatically detect the Docker configuration
   - Trigger a manual deploy or wait for auto-deploy

### Option 2: Native Build (Alternative)

If you prefer not to use Docker, you can use Render's native Node environment with custom build commands:

```yaml
- type: web
  name: proptii-search-backend
  env: node
  plan: free
  buildCommand: cd search/backend && npm install && npx playwright install --with-deps chromium && npm run build
  startCommand: cd search/backend && npm start
  healthCheckPath: /health
```

⚠️ **Note**: Native build may have limitations on Render's free tier due to missing system dependencies.

## Environment Variables

The following environment variables are automatically configured in the Dockerfile:

- `NODE_ENV`: production
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: false
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`: false
- `PUPPETEER_CACHE_DIR`: /root/.cache/puppeteer
- `PLAYWRIGHT_BROWSERS_PATH`: /root/.cache/ms-playwright
- `PORT`: 3001 (configurable via Render)

## Troubleshooting

### Browser Not Found Errors

If you see errors like:
- "Could not find Chrome (ver. X.X.X)"
- "Executable doesn't exist at /path/to/browser"

**Solutions**:
1. Ensure you're using the Docker deployment method
2. Check that the Dockerfile properly installs browsers in the build step
3. Verify environment variables are set correctly
4. Check Render build logs for any installation errors

### Memory Issues

If the service crashes due to memory limits:
1. Consider upgrading from Render's free tier
2. Optimize scraping to process fewer properties at once
3. Add resource limits to the Dockerfile

### Build Timeouts

If the build times out:
1. The Docker image build includes browser downloads which can take time
2. Subsequent builds should be faster due to layer caching
3. Consider using Render's paid plans for longer build times

## Health Check

The service includes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2025-12-01T10:00:00.000Z",
  "service": "property-search-backend"
}
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /scrape` - Main scraping endpoint (requires browser automation)
- `POST /scrape-fallback` - Fallback endpoint with mock data
- `POST /scrape-api` - API-based search (limited functionality)

## Local Development

To run locally with Docker:
```bash
cd search/backend
docker build -t search-backend .
docker run -p 3001:3001 search-backend
```

To run locally without Docker:
```bash
cd search/backend
npm install
npx playwright install --with-deps chromium
npx puppeteer browsers install chrome
npm run build
npm start
```

## Monitoring

Monitor your deployment:
1. Check Render dashboard for service health
2. Monitor logs for scraping errors
3. Watch for browser launch failures
4. Check memory and CPU usage

## Support

For issues specific to:
- **Render deployment**: Check Render documentation
- **Puppeteer**: https://pptr.dev/
- **Playwright**: https://playwright.dev/

