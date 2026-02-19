# Viewing Requests Fix - Empty ViewingsPage Issue

## Problem
When tenants submitted viewing requests through `BookViewingModal`, the landlord/agent's `ViewingsPage` remained empty. The viewing data was being saved, but not in a way that the landlord/agent could see it.

## Root Cause
The tenant's viewing submission was only saving to the `viewingBookings` Firestore collection. However, the landlord/agent's `ViewingsPage` expects to see pending requests in the **`bookViewingRequests`** collection in the "Requests" tab.

## Solution Implemented

### Changes Made to `src/components/viewings/BookViewingModal.tsx`:

1. **Added import for `bookViewingRequestService`** (line 28):
   ```typescript
   import { bookViewingRequestService } from '../../services/bookViewingRequestService';
   ```

2. **Added viewing request creation** (lines 399-413):
   When a tenant submits a viewing request, the code now:
   - First saves to `bookViewingRequests` collection (for landlord/agent approval)
   - Then saves to `viewingBookings` collection (for the actual booking record)
   - Then optionally sends emails

3. **Fixed TypeScript type issues**:
   - Added proper validation for viewing details (line 361)
   - Created properly typed viewing object (lines 415-425)
   - Fixed error handling for backend and email services

## How It Works Now

### Tenant Flow:
1. Tenant fills out viewing request in `BookViewingModal`
2. On submission, the system:
   - Looks up landlord/agent ID by email
   - Creates entry in `bookViewingRequests` collection with status: 'requested'
   - Creates entry in `viewingBookings` collection with status: 'pending'
   - Sends confirmation emails

### Landlord/Agent Flow:
1. Landlord/agent opens their ViewingsPage
2. System queries `bookViewingRequests` where `landlordId` or `agentId` matches their ID
3. Requests appear in the "Requests" tab
4. Landlord/agent can:
   - Schedule the viewing (moves to `viewingBookings` and deletes the request)
   - Decline the request (deletes the request)

## Firestore Setup Required

### 1. Deploy Updated Configuration Files

I've updated the following files:
- ✅ `firestore.indexes.json` - Added 2 new composite indexes for `bookViewingRequests`
- ✅ `firestore.rules` - Added security rules for `bookViewingRequests` collection

**To deploy these changes:**

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes  
firebase deploy --only firestore:indexes
```

If you encounter permission errors, follow Option 2 below.

### 2. Composite Indexes Needed

The following composite indexes need to be created in Firebase Console:

**Collection: `bookViewingRequests`**

1. **For landlord queries:**
   - Field 1: `landlordId` (Ascending)
   - Field 2: `createdAt` (Descending)

2. **For agent queries:**
   - Field 1: `agentId` (Ascending)
   - Field 2: `createdAt` (Descending)

3. **For user queries:** *(Already exists in your config)*
   - Field 1: `userId` (Ascending)
   - Field 2: `createdAt` (Descending)

### How to Create Indexes:

**Option 1: Automatic (Recommended)**
- When you first try to load the ViewingsPage, Firestore will show an error in the console
- The error will include a link to automatically create the required index
- Click the link and wait for the index to build (usually 1-2 minutes)
- You may need to do this twice (once for landlordId index, once for agentId index)

**Option 2: Manual Deployment via Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `proptii-16946`
3. Go to **Firestore Database** → **Indexes** tab
4. Click "Create Index"
5. For each index:
   - Collection ID: `bookViewingRequests`
   - Add fields as listed above
   - Query scope: Collection
6. Click "Create Index" and wait for it to build (~1-2 minutes)
7. Repeat for all missing indexes

**Option 3: Using Firebase CLI**
```bash
# Make sure you're logged in
firebase login

# Select the correct project
firebase use proptii-16946

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy rules
firebase deploy --only firestore:rules
```

## Testing Steps

1. **Start the application:**
   ```bash
   cd src
   npm run dev
   ```

2. **As a Tenant:**
   - Go to a property listing
   - Click "Book a Viewing"
   - Fill out all required information
   - Submit the request
   - Verify you receive a confirmation email

3. **As a Landlord/Agent:**
   - Navigate to the Viewings page
   - You should see the request in the "Requests (1)" tab
   - Click "Schedule Viewing" to approve and set a time
   - Or click "Decline" to reject the request

4. **Verify the data flow:**
   - Open Firebase Console → Firestore Database
   - Check `bookViewingRequests` collection - should have the new request
   - Check `viewingBookings` collection - should have the booking
   - After landlord schedules, the request should be removed from `bookViewingRequests`

## Expected Console Logs

### Tenant Side (when submitting):
```
🔍 Looking up landlord/agent by email: [email]
✅ Found landlord/agent ID: [landlordUserId]
Manager info for viewing save: {landlordId: '...', agentId: '...'}
✅ Successfully saved viewing request for landlord/agent approval
✅ Successfully saved to Firestore
✅ Successfully sent emails
✅ All submission steps completed successfully
```

### Landlord/Agent Side (when loading ViewingsPage):
```
🔍 Looking up landlord user by email: [email]
✅ Found landlord user ID: [landlordUserId]
📊 Loading viewings for landlord user ID: [landlordUserId]
📋 Requests result: {success: true, requests: [...]}
📋 Bookings result: {success: true, bookings: [...]}
✅ Set bookings: [count] bookings
📡 Real-time bookings update: [count] bookings
```

## Troubleshooting

### "No pending requests" shown even after tenant submission:

1. **Check Firestore indexes:**
   - Look for errors in the browser console about missing indexes
   - Follow the link in the error to create the index
   - Wait 1-2 minutes for the index to build

2. **Verify landlord/agent registration:**
   - The landlord/agent must be registered in the `landlordUsers` collection
   - Their email must match the property agent email
   - Check console logs for "Found landlord/agent ID"

3. **Check data in Firestore:**
   - Open Firebase Console
   - Go to `bookViewingRequests` collection
   - Verify the request exists with correct `landlordId` and `agentId` fields

4. **Real-time subscription issues:**
   - Check browser console for subscription errors
   - Verify Firebase config is correct
   - Check Firestore security rules allow reads

### "Offline" error when submitting:

- Check internet connection
- Verify Firebase is initialized correctly
- Check browser console for Firebase errors

## Files Modified

1. `src/components/viewings/BookViewingModal.tsx`
   - Added import for `bookViewingRequestService`
   - Added viewing request creation before booking creation
   - Fixed TypeScript type issues
   - Improved error handling

## Benefits of This Fix

1. ✅ Landlords/agents now see viewing requests immediately
2. ✅ Proper workflow: Request → Review → Schedule → Confirm
3. ✅ Real-time updates work correctly
4. ✅ Better separation of concerns (requests vs. bookings)
5. ✅ Maintains backward compatibility with existing code
6. ✅ Proper error handling and logging throughout

## Next Steps

After this fix is deployed and tested:
- Consider adding notifications for new viewing requests
- Add ability for landlords to propose alternative times
- Implement viewing request expiration (auto-delete after X days)
- Add analytics for viewing request conversion rates

