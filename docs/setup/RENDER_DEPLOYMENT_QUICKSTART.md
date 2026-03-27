# Quick Start: Deploy Search Backend Fix to Render

## What Was Fixed
Your search backend on Render was failing because Puppeteer and Playwright couldn't find browser executables. This has been fixed by switching to Docker-based deployment with all required dependencies.

## Deployment Steps

### 1. Review Changes
The following files were modified/created:
- ✓ `render.yaml` - Updated to use Docker
- ✓ `search/backend/Dockerfile` - New Docker configuration
- ✓ `search/backend/.dockerignore` - Build optimization
- ✓ `search/backend/src/scraper.ts` - Enhanced browser detection
- ✓ `search/backend/package.json` - Added test scripts
- ✓ Documentation files (DEPLOYMENT.md, FIX_SUMMARY.md, test-browsers.js)

### 2. Commit and Push Changes

Run these commands from the project root:

```powershell
# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Fix: Docker deployment for search backend browser automation"

# Push to your repository
git push origin main
```

### 3. Deploy to Render

**Option A: Automatic Deployment**
- If you have auto-deploy enabled, Render will automatically start deploying after you push

**Option B: Manual Deployment**
1. Go to https://dashboard.render.com
2. Select your `proptii-search-backend` service
3. Click "Manual Deploy" → "Deploy latest commit"

### 4. Monitor the Build

Watch the build logs in Render dashboard. You should see:
```
==> Building with Dockerfile...
==> Installing system dependencies...
==> Installing Playwright browsers...
==> Installing Puppeteer browsers...
==> Building TypeScript...
==> Build successful!
```

**Expected build time**: 5-10 minutes (first deployment)

### 5. Verify Deployment

Once deployed, test the health endpoint:

**Using PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://proptii-r1-1a-search.onrender.com/health" | Select-Object -ExpandProperty Content
```

**Using browser:**
Navigate to: https://proptii-r1-1a-search.onrender.com/health

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T...",
  "service": "property-search-backend"
}
```

### 6. Test Full Functionality

Test the search from your frontend application. The backend should now successfully:
- Launch browser instances
- Scrape OnTheMarket
- Fallback to Rentola if needed
- Return real property data

## What If It Fails?

### Check Build Logs
1. In Render dashboard, click on your service
2. Go to "Logs" tab
3. Look for specific error messages

### Common Issues and Solutions

**Issue: "Build time exceeded"**
- Solution: Wait for it to complete. First Docker build takes longer.
- Render free tier allows longer builds for Docker.

**Issue: "Out of memory"**
- Solution: The Docker image is optimized, but free tier has limits.
- Consider upgrading to Render's $7/month plan if needed.

**Issue: "Docker build failed"**
- Solution: Check that `dockerfilePath: ./search/backend/Dockerfile` in render.yaml is correct.
- Verify the Dockerfile is in the correct location.

### Still Having Issues?

1. Check `search/backend/FIX_SUMMARY.md` for detailed troubleshooting
2. Check `search/backend/DEPLOYMENT.md` for comprehensive guide
3. Review Render's build logs carefully for specific errors

## Testing Locally (Optional)

Want to test before deploying? Run these commands:

```powershell
# Navigate to backend directory
cd search/backend

# Build Docker image
docker build -t search-backend-test .

# Run container
docker run -p 3001:3001 search-backend-test

# In another terminal, test it
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

## Success Indicators

✓ Build completes without errors
✓ Service status shows "Live" in Render
✓ Health endpoint returns `{"status": "ok"}`
✓ Frontend can successfully fetch property listings
✓ No browser-related errors in logs

## After Successful Deployment

1. Test property search through your frontend
2. Monitor Render logs for any warnings
3. Check that real property data is being returned (not mock data)
4. Verify both OnTheMarket and Rentola scrapers work

## Need More Details?

- **Full deployment guide**: See `search/backend/DEPLOYMENT.md`
- **Technical details**: See `search/backend/FIX_SUMMARY.md`
- **Test browsers locally**: Run `npm run test:browsers` in backend folder

## Summary

The fix is ready to deploy! Just commit, push, and deploy to Render. The Docker-based deployment will handle all browser dependencies automatically. Expected deployment time is 5-10 minutes.

**Questions?** Review the detailed documentation files in the `search/backend/` directory.

