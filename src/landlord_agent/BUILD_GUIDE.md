# Landlord Dashboard - Build & Deploy Guide

## ✅ Correct Setup

The landlord dashboard is now configured to build into `public/landlord/` and be served at:

**URL:** `http://localhost:5173/landlord/index.html`

## How to Build the Landlord Dashboard

### Step 1: Build the App
```bash
cd src/landlord_agent
npm run build
```

This will:
- Build the React app
- Output to `../../public/landlord/` (which is `public/landlord/` from project root)
- Set the base path to `/landlord/` for all assets

### Step 2: Verify Build Output
Check that these files exist:
```
public/landlord/
├── index.html
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

### Step 3: Start Main Dev Server
```bash
# From project root
npm run dev
```

### Step 4: Access the Dashboard
Navigate to: `http://localhost:5173/landlord/index.html`

## Development Workflow

### When making changes to the landlord dashboard:

1. **Edit files in:** `src/landlord_agent/src/`
2. **Rebuild:**
   ```bash
   cd src/landlord_agent
   npm run build
   ```
3. **Refresh browser:** `http://localhost:5173/landlord/index.html`

### For faster development with hot reload:

You can run the landlord app separately on port 3000:
```bash
cd src/landlord_agent
npm run dev
```
Then access at `http://localhost:3000` for hot reload during development.

When ready, rebuild and deploy to `public/landlord/`.

## Navigation Flow

1. User visits `http://localhost:5173` (main tenant app)
2. Clicks "Agent" → "Go to Landlord Dashboard"
3. Redirected to `http://localhost:5173/landlord/index.html`
4. Landlord dashboard loads with referencing integration ✅

## Configuration Details

### Vite Config (`src/landlord_agent/vite.config.ts`)
```typescript
{
  base: '/landlord/',              // Assets served from /landlord/*
  build: {
    outDir: '../../public/landlord', // Output to public/landlord/
    emptyOutDir: true,               // Clear old builds
  }
}
```

### Navigation (`src/pages/AgentHome.tsx`)
```typescript
window.location.href = '/landlord/index.html';
```

## Deployment

For production, include the `public/landlord/` folder in your deployment.

The main app and landlord dashboard will be served from the same domain:
- Main app: `https://yourdomain.com/`
- Landlord: `https://yourdomain.com/landlord/index.html`

## Common Issues

### ❌ 404 on `/landlord/index.html`
**Solution:** Rebuild the landlord app:
```bash
cd src/landlord_agent && npm run build
```

### ❌ Assets loading from wrong path
**Issue:** Missing `base: '/landlord/'` in vite.config.ts  
**Solution:** Already configured correctly ✅

### ❌ "Referencing: Complete" for all tenants
**Issue:** Using mock data or tenant emails don't match referencing forms  
**Solution:** See `TESTING_GUIDE.md`

## Quick Commands

```bash
# Build landlord dashboard
cd src/landlord_agent && npm run build

# Start main dev server (serves both apps)
npm run dev

# Access landlord dashboard
# Open: http://localhost:5173/landlord/index.html
```

## Summary

✅ Landlord dashboard builds to `public/landlord/`  
✅ Served at `http://localhost:5173/landlord/index.html`  
✅ Referencing integration working  
✅ Single dev server for both apps  

**Correct URL:** `http://localhost:5173/landlord/index.html` ✅


