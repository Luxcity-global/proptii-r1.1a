# ⚠️ CRITICAL: Build Process Required After Every Change

## Why Rebuilding is Required

The landlord_agent application uses a **static build architecture**:
- Source code (`.tsx`, `.ts`) is compiled into static files
- These files are served from `public/landlord/index.html`
- **Changes to source code DO NOT automatically appear without rebuilding**

## Build Process (MUST DO AFTER EVERY CODE CHANGE)

### Step 1: Install Dependencies (if needed)
```bash
cd src/landlord_agent
npm install
```

### Step 2: Build the Application
```bash
npm run build
```

**What this does:**
- Compiles TypeScript → JavaScript
- Bundles all components → `build/assets/index-[hash].js`
- Compiles CSS → `build/assets/index-[hash].css`
- Generates `build/index.html`

### Step 3: Copy Assets to Public Directory
```bash
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\
```

### Step 4: Update Asset References in index.html
**Open:** `public/landlord/index.html`

**Find these lines:**
```html
<script type="module" crossorigin src="/assets/index-DazPO7cj.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-BikFH20E.css">
```

**Update with new file names from `build/assets/`:**
- Check `src/landlord_agent/build/assets/` for new hash filenames
- Update the script and link tags in `index.html`

**Example:**
```html
<script type="module" crossorigin src="/assets/index-[NEW-HASH].js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-[NEW-HASH].css">
```

### Step 5: Clear Browser Cache
- Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Or open DevTools → Network tab → Check "Disable cache"

### Step 6: Test Changes
- Navigate to: `http://localhost:5176/landlord/index.html`
- Verify all functionality works

---

## Quick Build Command Sequence

```bash
# Complete rebuild process (Windows PowerShell)
cd src/landlord_agent ; npm install ; npm run build ; cd ../.. ; copy src\landlord_agent\build\assets\index-*.js public\assets\ ; copy src\landlord_agent\build\assets\index-*.css public\assets\
```

**Then manually update:** `public/landlord/index.html` with new file names

---

## When to Rebuild

**Rebuild is REQUIRED after:**
- ✅ Adding new components
- ✅ Modifying existing components
- ✅ Adding new services
- ✅ Updating configuration files
- ✅ Changing imports or dependencies
- ✅ Any TypeScript/React code changes

**Rebuild is NOT needed for:**
- ❌ Configuration changes only (if using environment variables)
- ❌ Documentation changes

---

## Troubleshooting

### Problem: Changes Not Appearing
**Solution:**
1. Verify you ran `npm run build`
2. Check assets were copied to `public/assets/`
3. Verify `index.html` references correct file names
4. Clear browser cache (Ctrl+F5)

### Problem: 404 Errors for Assets
**Solution:**
1. Check file names match exactly in `index.html`
2. Verify files exist in `public/assets/`
3. Check file paths are correct (should start with `/assets/`)

### Problem: Build Fails
**Solution:**
1. Check for TypeScript errors
2. Verify all imports are correct
3. Run `npm install` to ensure dependencies
4. Check console for specific error messages

---

## Current Asset References

**Current files in `public/landlord/index.html`:**
- JavaScript: `/assets/index-DazPO7cj.js`
- CSS: `/assets/index-BikFH20E.css`

**After rebuild, these will change!**

---

## File Structure

```
proptii-r1.1a/
├── src/landlord_agent/
│   ├── src/                    # Source code (edit here)
│   │   ├── components/
│   │   ├── services/
│   │   └── config/
│   └── build/                  # Build output (generated)
│       ├── assets/
│       │   ├── index-[hash].js  # JavaScript bundle
│       │   └── index-[hash].css # CSS bundle
│       └── index.html
├── public/
│   ├── assets/                 # Copied build assets (served)
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── landlord/
│       └── index.html          # Entry point (update asset refs here)
```

---

## Best Practices

1. **Always rebuild after code changes**
   - Don't assume changes will auto-reflect
   - Complete the full build process
   - Verify changes in browser

2. **Keep asset references updated**
   - Check `build/assets/` after each build
   - Update `index.html` immediately
   - Document file name changes if needed

3. **Test after rebuild**
   - Verify functionality works
   - Check for console errors
   - Test affected features

4. **Version control**
   - Commit both source and build files
   - Or add `build/` to `.gitignore` and rebuild on deploy

---

## Summary

**After making ANY changes to landlord_agent code:**

1. ✅ Run `npm run build` in `src/landlord_agent/`
2. ✅ Copy assets to `public/assets/`
3. ✅ Update `public/landlord/index.html` with new file names
4. ✅ Clear browser cache
5. ✅ Test functionality

**This process is CRITICAL - changes won't appear without it!**

---

*Reference: `docs/development/BUILD_PROCESS_GUIDE.md`*
*Last Updated: [Current Date]*

