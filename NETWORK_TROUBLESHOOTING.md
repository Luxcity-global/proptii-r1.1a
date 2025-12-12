# Network Tab Troubleshooting Guide

## What to Check in the Network Tab

### 1. **Main Document Request**
- **URL**: `http://localhost:5173/contracts` (or `/`)
- **Status**: Should be `200 OK`
- **Type**: `document`
- **Check**: 
  - If status is `404`, the route doesn't exist
  - If status is `500`, there's a server error
  - If status is `(failed)` or red, the server isn't running

### 2. **main.tsx File**
- **URL**: `http://localhost:5173/src/main.tsx?t=...`
- **Status**: Should be `200 OK`
- **Type**: `script`
- **Check**:
  - Click on it → "Response" tab → Should show TypeScript/React code
  - If `404`, the file path is wrong
  - If blocked, check CSP headers

### 3. **Vite Client Connection**
- **URL**: `http://localhost:5173/@vite/client`
- **Status**: Should be `200 OK`
- **Type**: `script`
- **Check**: This is Vite's HMR (Hot Module Replacement) client - must load for dev mode

### 4. **CSS Files**
- **URL**: `http://localhost:5173/src/index.css?t=...`
- **Status**: Should be `200 OK`
- **Type**: `stylesheet` (or sometimes `script` in Vite dev mode)
- **Check**: If missing, styles won't load

### 5. **JavaScript Chunks**
- **URLs**: Various `chunk-*.js` files
- **Status**: All should be `200 OK`
- **Check**: If any are `404` or blocked, that module won't load

### 6. **Error Indicators**
- **Red entries**: Failed requests
- **Yellow entries**: Warnings (slow requests)
- **Status codes**:
  - `200`: Success
  - `304`: Cached (OK)
  - `404`: Not found
  - `500`: Server error
  - `(blocked)`: Blocked by CSP or CORS
  - `(failed)`: Network error

## Common Issues

### Issue 1: main.tsx Returns 404
**Cause**: File not found or wrong path
**Fix**: Check that `src/main.tsx` exists and Vite is serving from correct directory

### Issue 2: All Requests Blocked
**Cause**: CSP (Content Security Policy) blocking
**Fix**: 
- Check Network tab → Headers → Response Headers → `Content-Security-Policy`
- Should include `'unsafe-eval'` for Vite dev mode
- Check browser console for CSP violation errors

### Issue 3: main.tsx Loads but Doesn't Execute
**Cause**: JavaScript syntax error or import error
**Fix**:
- Check Console tab for errors
- Check main.tsx Response tab - does the code look correct?
- Look for import errors in the console

### Issue 4: Vite Client Not Connecting
**Cause**: WebSocket blocked or server not running
**Fix**:
- Check for `@vite/client` request
- Check for WebSocket connection (type: `websocket`)
- Restart dev server

## Quick Diagnostic Steps

1. **Open Network Tab** (F12 → Network)
2. **Clear network log** (trash icon)
3. **Hard refresh** (Ctrl+Shift+R)
4. **Check first request**:
   - Should be the document (`/contracts` or `/`)
   - Status should be `200`
5. **Check main.tsx**:
   - Should appear in network log
   - Click it → Preview/Response tab
   - Should show React code
6. **Check for errors**:
   - Red entries = failed
   - Look at Status column
   - Check Response tab for error messages

## What to Share

If still having issues, share:
1. Screenshot of Network tab (showing all requests)
2. Status codes of key files:
   - Document request
   - main.tsx
   - @vite/client
   - Any red/failed entries
3. Response content of main.tsx (first few lines)
4. Any console errors (even if blank, confirm it's truly blank)




