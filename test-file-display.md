# File Display Test Instructions

## What I've Changed

I've updated the "Uploaded Files" section on the Dashboard Home page to:

1. **Display Real Files**: The section now shows actual files uploaded during the referencing process
2. **Keep File Type Icons**: The existing file type icons (PDF, image, etc.) are preserved
3. **Add Debug Logging**: Added console logs to help troubleshoot any issues
4. **Add Test Files**: Temporarily added test files to verify the display is working

## How to Test

### Step 1: Clear Browser Cache
1. Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac) to force a hard refresh
2. Or open Developer Tools (F12) → Network tab → check "Disable cache" → refresh

### Step 2: Check Console Logs
1. Open Developer Tools (F12)
2. Go to the Console tab
3. Look for these debug messages:
   - `🏠 DashboardHome - files: [...]`
   - `📁 DashboardHome - files length: X`
   - `🎨 Rendering files section with X files`

### Step 3: Verify File Display
You should see one of these scenarios:

**Scenario A: Real Files (if you've uploaded files in referencing)**
- Files with actual names from your referencing form
- Correct file types and sizes
- Clickable files that open in a new window

**Scenario B: Test Files (if no real files uploaded)**
- "Test Passport.jpg" (image file)
- "Test Bank Statement.pdf" (PDF file)
- These are temporary test files to verify the display works

**Scenario C: No Files Message**
- "No files uploaded yet. Upload files in the referencing form to see them here."
- Debug info showing files array length

### Step 4: Test File Upload
1. Go to the referencing form (`/referencing`)
2. Upload some files in different sections
3. Return to the dashboard
4. Check if your uploaded files now appear in the "Uploaded Files" section

## Expected Console Output

If working correctly, you should see logs like:
```
🏠 DashboardHome - dashboardSummary: {...}
🏠 DashboardHome - referencing data: {...}
📁 DashboardHome - files: [...]
📁 DashboardHome - files length: 2
📁 DashboardHome - files details: [{name: "Test Passport.jpg", type: "image/jpeg", size: 1200000}, ...]
🎨 Rendering files section with 2 files
```

## If You Still Don't See Changes

1. **Check the terminal** - Make sure the dev server is running on the correct port
2. **Check console errors** - Look for any red error messages
3. **Try a different browser** - Sometimes browser extensions interfere
4. **Check the URL** - Make sure you're on `http://localhost:5178` (or whatever port is shown in terminal)

## Next Steps

Once you confirm the file display is working:
1. Upload some real files in the referencing form
2. Verify they appear on the dashboard
3. Test clicking on files to open them
4. Let me know if everything is working correctly
