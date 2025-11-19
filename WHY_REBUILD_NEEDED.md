# Why the Landlord App Needs to be Rebuilt

## Quick Explanation

The landlord app is a **static application** - this means:
- The source code (`.tsx`, `.ts` files) must be **compiled** into JavaScript before it can run in a browser
- Changes to source code **will NOT appear** until you rebuild the app
- The app is served from pre-built static files, not the source code directly

## Why This Matters

When you edit files in `src/landlord_agent/src/`, those are TypeScript/React source files. Browsers can't run these directly - they need to be:
1. **Compiled** from TypeScript to JavaScript
2. **Bundled** into a single file
3. **Optimized** for production

Without rebuilding, your changes won't be visible because the browser is still loading the old compiled files.

---

## How to Rebuild

### Step 1: Navigate to the app directory
```bash
cd src/landlord_agent
```

### Step 2: Run the build command
```bash
npm run build
```

This will:
- Compile all TypeScript/React code
- Bundle everything into optimized JavaScript and CSS files
- Output files to `public/landlord/` directory

### Step 3: Done!
The build process automatically:
- ✅ Creates new JavaScript bundle: `public/landlord/assets/index-[hash].js`
- ✅ Creates new CSS bundle: `public/landlord/assets/index-[hash].css`
- ✅ Updates `public/landlord/index.html` with the new file references

**No manual file copying needed** - the build handles everything automatically!

---

## Which Files Get Replaced

After running `npm run build`, these files are automatically updated:

1. **`public/landlord/index.html`**
   - Automatically updated with new asset file names
   - Contains references to the JavaScript and CSS bundles

2. **`public/landlord/assets/index-[hash].js`**
   - The compiled JavaScript bundle (hash changes with each build)
   - Contains all your React components and logic

3. **`public/landlord/assets/index-[hash].css`**
   - The compiled CSS bundle (hash changes with each build)
   - Contains all styles

**Note:** The `[hash]` in filenames changes each time you build. This ensures browsers load the latest version and don't use cached old files.

---

## When to Rebuild

**You MUST rebuild after:**
- ✅ Editing any `.tsx` or `.ts` files in `src/landlord_agent/src/`
- ✅ Adding new components
- ✅ Modifying existing components
- ✅ Changing imports or dependencies
- ✅ Any code changes to the landlord app

**You DON'T need to rebuild for:**
- ❌ Documentation changes (`.md` files)
- ❌ Configuration changes (if using environment variables)

---

## Quick Reference

**One-line rebuild command:**
```bash
cd src/landlord_agent && npm run build
```

**After rebuilding:**
- Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
- Refresh the page to see changes
- Navigate to: `http://localhost:5176/landlord/index.html`

---

## Summary

**The Rule:** Any code change = Rebuild required

**The Process:**
1. Make your code changes
2. Run `npm run build` in `src/landlord_agent/`
3. Clear browser cache
4. Test your changes

**The Files:** Build automatically updates `public/landlord/` - no manual copying needed!

---

*This is a static build architecture - it's designed this way for performance and optimization in production.*

