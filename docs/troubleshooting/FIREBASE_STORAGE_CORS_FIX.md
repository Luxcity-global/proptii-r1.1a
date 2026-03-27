# Firebase Storage CORS Fix - Complete Solution

## Current Issue
Contract files can't be fetched from Firebase Storage due to CORS policy errors. This prevents email attachments from being included.

## The Problem
Even though storage rules allow public read access, Firebase Storage **also requires CORS configuration** to allow cross-origin requests from your frontend.

## Solution 1: Deploy Storage Rules First (Required)

### Step 1: Deploy Storage Rules via Firebase Console
1. Go to: https://console.firebase.google.com/project/proptii-16946/storage/rules
2. Copy the contents of `storage.rules` from your project
3. Paste into Firebase Console editor
4. Click **"Publish"** button
5. Wait for "Rules published successfully" message

### Step 2: Configure CORS for Storage Bucket

Firebase Storage requires CORS configuration. You'll need to create a CORS configuration file and deploy it.

**Create `cors.json` file:**

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

**Deploy using gsutil (Google Cloud SDK):**

```bash
# Install gsutil if needed
# Or use Firebase CLI with gcloud

# Set the bucket name
gsutil cors set cors.json gs://proptii-16946.firebasestorage.app
```

**Or use Firebase CLI:**
```bash
firebase deploy --only storage
```

## Solution 2: Alternative - Use Signed URLs

If CORS continues to be an issue, we can modify the code to:
1. Generate signed URLs from the backend
2. Use the backend to fetch and attach files

This is more secure but requires backend changes.

## Solution 3: Temporary Workaround (Current Behavior)

The current code **already sends emails without attachments** if the fetch fails. Check your email - you should have received the contract email, just without the PDF attachment.

### Verify Email Sent:
1. Check the email inbox for `bolu.o@theluxcity.co.uk`
2. You should see an email with the contract title but a note saying the attachment couldn't be included
3. Check backend server logs for: `"Email sent successfully"`

## Quick Fix Priority

**Immediate (5 minutes):**
1. ✅ Deploy storage rules via Firebase Console (see Solution 1)
2. ⏳ Wait 1-2 minutes for propagation
3. 🔄 Clear browser cache (Ctrl+F5)
4. 🧪 Test sending contract again

**If CORS persists after rules deployment:**
- Configure CORS using gsutil (see Solution 1, Step 2)
- Or use the alternative signed URL approach (Solution 2)

## Check Server Logs

The backend server should show:
```
Received email request: { to: 'bolu.o@theluxcity.co.uk', ... }
Email sent successfully: { messageId: '...' }
```

If you see these logs, the email was sent successfully (just without attachment due to CORS).

## Next Steps

1. **Deploy storage rules** (if not already done)
2. **Test sending a contract** - CORS errors should reduce
3. **Check email inbox** - email should be there (with or without attachment)
4. **If still getting CORS**: Configure CORS using gsutil

## Direct Links

- **Storage Rules**: https://console.firebase.google.com/project/proptii-16946/storage/rules
- **Storage Files**: https://console.firebase.google.com/project/proptii-16946/storage/files
- **Google Cloud Console**: https://console.cloud.google.com/storage/browser?project=proptii-16946


