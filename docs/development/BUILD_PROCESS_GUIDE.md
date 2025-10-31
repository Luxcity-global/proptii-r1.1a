# Build Process Guide - Proptii Landlord App

## Overview

This document explains the critical build process for the Proptii landlord application and why rebuilding is necessary after each code change.

## Why Rebuilding is Required

### 1. **Static Asset Serving Architecture**
The landlord app uses a **static build process** where:
- Source code is compiled and bundled into static files
- These files are served from the `public/landlord/` directory
- Changes to source code don't automatically reflect without rebuilding

### 2. **Asset Management**
The build process handles:
- **JavaScript bundling**: Multiple `.tsx` files → Single `.js` bundle
- **CSS compilation**: Tailwind classes → Compiled CSS
- **Asset optimization**: Code minification and compression
- **Path resolution**: Relative imports → Absolute paths

### 3. **Development vs Production**
- **Development**: Vite dev server (`npm run dev`) provides hot reloading
- **Production**: Static files served from `public/landlord/index.html`
- **Landlord App**: Uses production build even in development

## Build Process Steps

### Step 1: Make Code Changes
```bash
# Edit files in src/landlord_agent/src/components/
# Example: PropertySetupStep1.tsx, ContractsPage.tsx, etc.
```

### Step 2: Build the Landlord App
```bash
cd src/landlord_agent
npm run build
```

**What this does:**
- Compiles TypeScript to JavaScript
- Bundles all components into `build/assets/index-[hash].js`
- Compiles CSS into `build/assets/index-[hash].css`
- Generates `build/index.html`

### Step 3: Copy Assets to Public Directory
```bash
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\
```

**What this does:**
- Copies the new JavaScript bundle to `public/assets/`
- Copies the new CSS file to `public/assets/`
- Makes assets accessible to the landlord app

### Step 4: Update Asset References
```bash
# Update public/landlord/index.html to reference new files
# Example: index-DAx7rM2b.js → index-NewHash.js
```

## Common Scenarios Requiring Rebuilds

### 1. **Component Changes**
- Modifying React components (`.tsx` files)
- Adding new components
- Updating component logic or styling

### 2. **Asset Path Changes**
- Updating image paths
- Changing file references
- Modifying import statements

### 3. **Styling Updates**
- Tailwind CSS class changes
- Custom CSS modifications
- Layout adjustments

### 4. **New Features**
- Adding new pages/screens
- Implementing new functionality
- Integrating new components

## Troubleshooting Guide

### Issue: Changes Not Reflecting
**Symptoms:**
- Code changes made but not visible in browser
- Old behavior persists after modifications
- Console errors about missing files

**Solution:**
1. Verify you've completed all build steps
2. Check asset file names match in `index.html`
3. Clear browser cache (Ctrl+F5)
4. Restart dev server if needed

### Issue: Asset Loading Errors
**Symptoms:**
- 404 errors for JavaScript/CSS files
- Images not loading
- Broken functionality

**Solution:**
1. Ensure assets are copied to `public/assets/`
2. Verify file paths in `index.html`
3. Check file permissions
4. Confirm file names match exactly

### Issue: Build Failures
**Symptoms:**
- Build process fails with errors
- TypeScript compilation errors
- Missing dependencies

**Solution:**
1. Check for syntax errors in source code
2. Verify all imports are correct
3. Run `npm install` to ensure dependencies
4. Check console for specific error messages

## File Structure Reference

```
proptii-r1.1a/
├── src/landlord_agent/
│   ├── src/components/          # Source components
│   └── build/                   # Build output
│       ├── assets/
│       │   ├── index-[hash].js   # JavaScript bundle
│       │   └── index-[hash].css  # CSS bundle
│       └── index.html           # Build HTML
├── public/
│   ├── assets/                  # Copied build assets
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── landlord/
│       └── index.html           # Landlord app entry point
```

## Best Practices

### 1. **Always Rebuild After Changes**
- Don't assume changes will auto-reflect
- Complete the full build process
- Verify changes in browser

### 2. **Check Asset References**
- Ensure `index.html` references correct files
- Verify file names match exactly
- Update references when files change

### 3. **Test Thoroughly**
- Check functionality after rebuild
- Verify all features work correctly
- Test in different browsers if needed

### 4. **Keep Build Process Consistent**
- Follow the same steps each time
- Document any deviations
- Maintain the established workflow

## Quick Reference Commands

```bash
# Complete rebuild process
cd src/landlord_agent
npm run build
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\

# Update index.html with new asset names
# Then refresh browser: http://localhost:5176/landlord/index.html
```

## Memory Notes

- **User prefers semicolon-separated commands** instead of `&&` chaining
- **Build process is critical** for landlord app changes
- **Asset copying is required** after each build
- **File name updates** are necessary in `index.html`

---

*This guide should be referenced whenever making changes to the landlord application to ensure proper build process execution.*



