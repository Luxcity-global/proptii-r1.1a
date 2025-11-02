# Fix Property Image Upload CORS Issue

## Problem
Images are not uploading to Firebase Storage due to CORS (Cross-Origin Resource Sharing) errors. The logs show:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

## Root Cause
The Firebase Storage CORS configuration only allows `GET` and `HEAD` methods (for reading files), but uploads require `POST` and `PUT` methods.

## Solution

### Option 1: Update CORS via Google Cloud Console (Easiest)

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/storage/browser?project=proptii-16946
   - Sign in if needed

2. **Find Your Bucket:**
   - Look for bucket: `proptii-16946.firebasestorage.app`
   - Click on the bucket name

3. **Access CORS Configuration:**
   - Click **"Configuration"** tab at the top
   - Scroll to **"CORS"** section
   - Click **"Edit CORS"** button

4. **Paste Updated CORS Configuration:**
   Replace the existing configuration with this:
   ```json
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:5176", "http://localhost:3000"],
       "method": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": [
         "Content-Type", 
         "Content-Length", 
         "Authorization", 
         "x-goog-upload-url", 
         "x-goog-upload-command", 
         "x-goog-upload-header", 
         "x-goog-upload-status"
       ],
       "maxAgeSeconds": 3600
     }
   ]
   ```

5. **Save:**
   - Click **"Save"** button
   - Wait for confirmation (may take 1-2 minutes to propagate)

---

### Option 2: Update CORS via gsutil (Command Line)

If you have Google Cloud SDK installed:

```powershell
# Navigate to project root
cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a"

# Apply updated CORS configuration
gsutil cors set cors.json gs://proptii-16946.firebasestorage.app
```

**Note:** The `cors.json` file has been updated with the new configuration.

---

## Also Update Storage Rules

The storage rules have been updated to allow property image uploads. Deploy them:

1. **Via Firebase Console:**
   - Go to: https://console.firebase.google.com/project/proptii-16946/storage/rules
   - Click **"Edit rules"**
   - Paste the updated rules from `storage.rules` file
   - Click **"Publish"**

2. **Or via Firebase CLI:**
   ```powershell
   firebase deploy --only storage
   ```

---

## Verify Fix

After updating CORS:

1. **Wait 2-3 minutes** for changes to propagate
2. **Clear browser cache** (Ctrl+F5)
3. **Try uploading property images again**
4. **Check console logs** - you should see:
   - ✅ "Uploading image X/4..."
   - ✅ "✅ Image X uploaded successfully"
   - ❌ No more CORS errors

---

## What Changed

1. **cors.json**: Updated to include `POST`, `PUT`, `DELETE`, `OPTIONS` methods
2. **storage.rules**: Added explicit rules for `/properties/**` folder with public read/write (for development)
3. **Response Headers**: Added Google Storage upload-specific headers

---

## Production Notes

For production deployment:
1. Update CORS to include your production domain
2. Update `storage.rules` to require authentication for writes:
   ```javascript
   allow write: if request.auth != null && 
                request.resource.size < 10 * 1024 * 1024;
   ```

---

*Files updated: `cors.json`, `storage.rules`*


