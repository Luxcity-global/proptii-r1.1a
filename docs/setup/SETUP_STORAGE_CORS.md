# Firebase Storage CORS Configuration - Complete Guide

## The Problem

Firebase Storage requires **two separate configurations**:
1. **Storage Rules** (controls who can read/write) - You have this configured
2. **CORS Configuration** (controls cross-origin browser requests) - **This is missing**

Even with `allow read: if true` in storage rules, browsers still need CORS headers to fetch files.

## Solution: Configure CORS via Google Cloud

Firebase Storage is backed by Google Cloud Storage, so we need to configure CORS there.

### Method 1: Using gsutil (Command Line) - Recommended

#### Step 1: Install Google Cloud SDK

1. **Download Google Cloud SDK:**
   - Go to: https://cloud.google.com/sdk/docs/install
   - Download the Windows installer
   - Run the installer and follow the prompts

2. **Or use PowerShell to install:**
   ```powershell
   # Download installer
   Invoke-WebRequest -Uri "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -OutFile "$env:TEMP\GoogleCloudSDKInstaller.exe"
   
   # Run installer (opens GUI)
   Start-Process "$env:TEMP\GoogleCloudSDKInstaller.exe"
   ```

#### Step 2: Authenticate

```powershell
# Initialize gcloud
gcloud init

# Or login directly
gcloud auth login
```

#### Step 3: Set Project

```powershell
gcloud config set project proptii-16946
```

#### Step 4: Apply CORS Configuration

I've created a `cors.json` file in your project root. Now apply it:

```powershell
# Navigate to project root
cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a"

# Apply CORS configuration to Firebase Storage bucket
gsutil cors set cors.json gs://proptii-16946.firebasestorage.app
```

You should see:
```
Setting CORS configuration on gs://proptii-16946.firebasestorage.app/...
```

#### Step 5: Verify CORS Configuration

```powershell
gsutil cors get gs://proptii-16946.firebasestorage.app
```

---

### Method 2: Using Google Cloud Console (Web UI)

If you prefer a web interface:

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/storage/browser?project=proptii-16946

2. **Find Your Bucket:**
   - Look for bucket: `proptii-16946.firebasestorage.app`
   - Click on the bucket name

3. **Access CORS Configuration:**
   - Click **"Configuration"** tab
   - Scroll to **"CORS"** section
   - Click **"Edit"**

4. **Paste CORS Configuration:**
   Copy this JSON and paste into the editor:
   ```json
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:5176", "http://localhost:3000"],
       "method": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Content-Length", "Authorization", "x-goog-upload-url", "x-goog-upload-command", "x-goog-upload-header", "x-goog-upload-status"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

5. **Save:**
   - Click **"Save"** button
   - Wait for confirmation

---

### Method 3: Using Firebase CLI (Alternative)

If you have Firebase CLI installed:

```powershell
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Use gsutil through Firebase (if available)
# Note: Firebase CLI doesn't directly support CORS, but you can still use gsutil
gsutil cors set cors.json gs://proptii-16946.firebasestorage.app
```

---

## CORS Configuration Explained

The `cors.json` file allows:

- **Origins**: Your local development ports (5173, 5176, 3000)
- **Methods**: GET, HEAD, POST, PUT, DELETE, OPTIONS (reading and uploading files)
- **Headers**: Content-Type, Content-Length, Authorization, and Google Storage upload headers
- **Max Age**: 1 hour (how long browser caches CORS policy)

---

## After Configuration

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cache** (`Ctrl+F5`)
3. **Test sending a contract** - CORS errors should be gone!

---

## Production CORS Configuration

For production, update `cors.json` to include your production domain:

```json
[
  {
    "origin": [
      "https://your-production-domain.com",
      "http://localhost:5173",
      "http://localhost:5176"
    ],
    "method": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Content-Length", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

Then re-apply:
```powershell
gsutil cors set cors.json gs://proptii-16946.firebasestorage.app
```

---

## Quick Verification

After setting CORS, test if it's working:

```powershell
# Check current CORS config
gsutil cors get gs://proptii-16946.firebasestorage.app
```

You should see your CORS configuration.

---

## Troubleshooting

### Issue: "gsutil: command not found"
**Solution:** Install Google Cloud SDK (see Step 1 above)

### Issue: "Access Denied"
**Solution:** 
1. Make sure you're logged in: `gcloud auth login`
2. Verify project: `gcloud config set project proptii-16946`
3. Check you have Storage Admin role in Google Cloud Console

### Issue: "Bucket not found"
**Solution:** 
- Verify bucket name: `proptii-16946.firebasestorage.app`
- Check Firebase Console → Storage → Files (bucket name shown there)

### Issue: Still getting CORS errors after configuration
**Solutions:**
1. Wait 2-3 minutes for propagation
2. Clear browser cache completely
3. Try in incognito/private window
4. Verify origins match exactly (including http:// vs https://)
5. Check browser console for exact CORS error message

---

## Alternative: Backend Proxy Solution

If CORS continues to be problematic, we can modify the backend to:
1. Fetch files from Firebase Storage server-side (no CORS issues)
2. Attach files to emails from the backend
3. Frontend just sends the file URL, backend does the fetching

This eliminates CORS issues entirely but requires backend code changes.

---

*CORS configuration file: `cors.json` in your project root*

