# Quick Start Guide - Viewing Requests Fix

## ✅ What Was Fixed

Your ViewingsPage was empty because tenant viewing requests weren't being saved to the right Firestore collection. Now they are saved correctly and will appear for landlords/agents to approve.

## 🚀 Quick Setup (3 Steps)

### Step 1: Deploy Firestore Configuration

Run these commands in your terminal:

```bash
firebase login
firebase use proptii-16946
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

**If you get permission errors**, don't worry - the indexes will be created automatically when you first use the app (see Step 3).

### Step 2: Start the Application

```bash
cd src
npm run dev
```

### Step 3: Test the Fix

1. **As a Tenant:**
   - Go to a property listing
   - Click "Book a Viewing"
   - Fill out the form and submit

2. **As a Landlord/Agent:**
   - Log in with: `aisha.d@theluxcity.co.uk`
   - Navigate to the Viewings page
   - You should see the request in the "Requests" tab! 🎉

3. **If you see a Firestore index error:**
   - Check the browser console for an error about missing indexes
   - Click the link in the error to auto-create the index
   - Wait 1-2 minutes for it to build
   - Refresh the page

## 📋 What Happens Now

```
┌─────────────┐
│   Tenant    │
│ Books       │
│ Viewing     │
└─────┬───────┘
      │
      ├─→ Creates "Request" in Firestore
      │   (appears in landlord's Requests tab)
      │
      ├─→ Creates "Booking" in Firestore  
      │   (tracking record)
      │
      └─→ Sends confirmation emails
          (to both tenant and landlord)

┌─────────────┐
│ Landlord/   │
│ Agent       │
│ Reviews     │
│ Request     │
└─────┬───────┘
      │
      ├─→ Schedule → Confirms time
      │            → Deletes request
      │            → Updates booking
      │            → Sends emails
      │
      └─→ Decline  → Deletes request
```

## 🔍 Verifying It Works

### Check the Browser Console:

**Tenant side should show:**
```
✅ Found landlord/agent ID: landlord_xxxxx
✅ Successfully saved viewing request for landlord/agent approval
✅ Successfully saved to Firestore
✅ Successfully sent emails
```

**Landlord side should show:**
```
✅ Found landlord user ID: landlord_xxxxx
📊 Loading viewings for landlord user ID: landlord_xxxxx
📋 Requests result: {success: true, requests: [1]}
```

### Check Firestore Database:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project: `proptii-16946`
3. Go to Firestore Database
4. Look for these collections:
   - `bookViewingRequests` - should have the new request
   - `viewingBookings` - should have the booking record

## 🐛 Troubleshooting

### "No pending requests" still showing

**Cause:** Firestore indexes not built yet

**Fix:** 
1. Open browser console
2. Look for error with link to create index
3. Click the link
4. Wait 2 minutes
5. Refresh page

### "Unable to find your landlord/agent profile"

**Cause:** Landlord/agent not registered in system

**Fix:**
1. Make sure the landlord/agent email matches the property agent email
2. They need to be in the `landlordUsers` collection in Firestore
3. Check console for "Found landlord/agent ID" message

### Request appears but then disappears

**Cause:** This is normal! When a landlord schedules a viewing, the request is deleted and moved to the bookings list

**Fix:** Check the "Scheduled" tab to see the confirmed booking

## 📁 Files Modified

- ✅ `src/components/viewings/BookViewingModal.tsx`
- ✅ `firestore.indexes.json` 
- ✅ `firestore.rules`

## 📚 Full Documentation

For complete details, see: `VIEWING_REQUESTS_FIX.md`

## ✨ That's it!

You should now see viewing requests appearing in the landlord/agent's ViewingsPage. If you have any issues, check the troubleshooting section above or review the console logs.



