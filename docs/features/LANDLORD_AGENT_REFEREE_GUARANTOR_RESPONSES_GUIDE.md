# Landlord/Agent - Referee & Guarantor Responses Implementation Guide

## ✅ Implementation Complete

The landlord/agent dashboard now displays referee and guarantor responses on the tenant details page, under the "References" tab.

## 📋 Overview

When tenants submit referencing applications, they provide referee and guarantor contact information. These individuals receive emails with links to submit their responses. The landlord/agent can now view these responses directly in their dashboard.

## 🔄 Data Flow

```
1. Tenant submits referencing application
   └─> Includes referee email (employment.referenceEmail)
   └─> Includes guarantor email (guarantor.email)
   
2. Backend sends emails via email.service.ts
   └─> Referee receives email with response link
   └─> Guarantor receives email with response link
   
3. Referee/Guarantor clicks link and fills form
   └─> Response submitted via RefereeGuarantorResponseModal
   └─> POST /api/referencing/response
   
4. Backend saves response to Firestore
   └─> Collection: referee_guarantor_responses
   └─> Document fields:
       • tenantEmail (links response to tenant)
       • type (referee_response or guarantor_response)
       • firstName, lastName, email
       • consent (agree or disagree)
       • reason (comments)
       • createdAt, submittedAt
       
5. Landlord/Agent views tenant details
   └─> Navigates to: Clients → View Tenant → References Tab
   └─> GET /api/referencing/responses/:tenantEmail
   └─> Displays all referee and guarantor responses
```

## 📂 Files Modified/Involved

### Backend (NestJS)
1. **`proptii-backend/src/services/email.service.ts`**
   - Lines 202-214: Referee email template with response link
   - Lines 216-228: Guarantor email template with response link
   - Email links include: `tenantEmail` parameter for linking responses

2. **`proptii-backend/src/services/referencing.service.ts`**
   - Lines 483-558: `saveRefereeGuarantorResponse()` - Saves responses to Firestore
   - Lines 627-757: `getRefereeGuarantorResponses()` - Fetches responses from Firestore
   - Firestore collection: `referee_guarantor_responses`

3. **`proptii-backend/src/controllers/referencing.controller.ts`**
   - Lines 147-158: `GET /api/referencing/responses/:tenantEmail` endpoint

### Frontend - Landlord/Agent Dashboard
4. **`src/landlord_agent/src/components/TenantDetails.tsx`**
   - Lines 90-92: State management for responses
   - Lines 214-246: Fetch responses from backend API
   - Lines 954-1128: UI displaying referee and guarantor responses
   - Features:
     - Loading states
     - Empty states with helpful messages
     - Response cards showing:
       * Name and email of referee/guarantor
       * Consent status (green badge for agreed, red for declined)
       * Submission timestamp
       * Comments/reasoning

## 🎨 UI Features

### Employment Referee Responses Section
- **Icon**: UserCheck icon in orange (#DC5F12)
- **Badge**: Shows count of responses
- **Response Cards**:
  - Referee name and designation
  - Email address
  - Consent status badge (✓ Agreed / ✗ Declined)
  - Submission date and time
  - Comments from referee

### Guarantor Responses Section
- **Icon**: Shield icon in orange (#DC5F12)
- **Badge**: Shows count of responses
- **Response Cards**:
  - Guarantor name
  - Email address
  - Consent status badge (✓ Agreed / ✗ Declined)
  - Submission date and time
  - Comments from guarantor

### Loading & Empty States
- **Loading**: Animated spinner with message
- **No Responses**: Helpful message explaining responses will appear once submitted
- **Error Handling**: Graceful fallback with console logging

## 🔧 API Configuration

### Fixed API URL Issue
Updated `TenantDetails.tsx` to use the correct backend API URL:

**Development (localhost):**
```typescript
http://localhost:10000/api
```

**Production (Render):**
```typescript
https://proptii-r1-1a.onrender.com/api
```

This matches the pattern used throughout the landlord/agent app (ContractsPage, etc.)

## 📊 Database Schema

### Firestore Collection: `referee_guarantor_responses`

```typescript
{
  id: string,                           // Document ID
  responseType: 'referee' | 'guarantor', // Type of respondent
  type: 'referee_response' | 'guarantor_response', // Query field
  tenantEmail: string,                   // Links response to tenant
  applicantName: string,                 // Tenant's name
  applicantEmail: string,                // Tenant's email (same as tenantEmail)
  firstName: string,                     // Referee/Guarantor first name
  lastName: string,                      // Referee/Guarantor last name
  email: string,                         // Referee/Guarantor email
  consent: 'agree' | 'disagree',         // Consent status
  reason: string,                        // Comments/reasoning
  submittedAt: string,                   // Submission timestamp
  createdAt: string,                     // Record creation timestamp
  updatedAt: string                      // Record update timestamp
}
```

### Firestore Index (Required)
```json
{
  "collectionGroup": "referee_guarantor_responses",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "tenantEmail", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## 🚀 How to Test

### Step 1: Start Backend
```bash
cd proptii-backend
npm run build ; npm start
```

Backend should be running on: `http://localhost:10000`

### Step 2: Start Landlord/Agent Dashboard
```bash
cd src/landlord_agent
npm run dev
```

Dashboard should be running on: `http://localhost:3000`

### Step 3: Start Main Tenant App (for submitting referencing)
```bash
# From project root
npm run dev
```

Tenant app should be running on: `http://localhost:5173`

### Step 4: Submit a Referencing Application
1. Navigate to: `http://localhost:5173/referencing`
2. Fill out the referencing form
3. Include:
   - Your email (tenant email): `tenant@example.com`
   - Referee email: `referee@example.com`
   - Guarantor email: `guarantor@example.com`
4. Submit the application

### Step 5: Check Email Logs
Check backend console for email sending logs. The emails will contain links like:
```
Referee: http://localhost:5173/?responseType=referee&applicant=John+Doe&email=referee@example.com&tenantEmail=tenant@example.com

Guarantor: http://localhost:5173/?responseType=guarantor&applicant=John+Doe&email=guarantor@example.com&tenantEmail=tenant@example.com
```

### Step 6: Simulate Referee/Guarantor Response
1. Copy the response link from console
2. Open in browser
3. Fill out the response form
4. Submit

### Step 7: View Responses in Landlord Dashboard
1. Navigate to: `http://localhost:3000`
2. Go to: **Clients** page
3. Click on the tenant (tenant@example.com)
4. Click the **References** tab
5. You should see:
   - Employment Referee Responses section with the referee's response
   - Guarantor Responses section with the guarantor's response

## ✅ Success Criteria

- ✅ Referee responses are fetched from Firestore
- ✅ Guarantor responses are fetched from Firestore
- ✅ Responses are filtered by tenant email
- ✅ Responses display name, email, consent status
- ✅ Responses show submission timestamp
- ✅ Responses show comments/reasoning
- ✅ Consent status has color-coded badges
- ✅ Loading states provide feedback
- ✅ Empty states show helpful messages
- ✅ API URL configuration is correct
- ✅ Works in both development and production

## 🔍 Troubleshooting

### No responses showing up?
1. **Check tenant email matches**: The email used in the referencing form must exactly match the tenant's email in the landlord dashboard
2. **Check backend logs**: Look for `[TenantDetails] Fetching referee/guarantor responses for: ...`
3. **Check API response**: Open browser DevTools → Network tab → Look for `/api/referencing/responses/...`
4. **Check Firestore**: Verify documents exist in `referee_guarantor_responses` collection with correct `tenantEmail` field

### API 404 errors?
1. **Verify backend is running** on port 10000
2. **Check console logs** for the API URL being used
3. **Verify endpoint exists**: `GET /api/referencing/responses/:tenantEmail`

### Empty responses always?
1. **Check Firestore permissions**: Ensure read access is granted
2. **Check backend logs**: Look for Firestore query errors
3. **Verify data structure**: Ensure `tenantEmail` field exists in Firestore documents

## 📝 Notes

- **Case Sensitivity**: Tenant emails are case-sensitive for matching
- **Real-time Updates**: Currently requires page refresh to see new responses
- **Firestore First**: Backend queries Firestore first, falls back to Cosmos DB
- **Error Handling**: Failed API calls don't crash the UI, show empty state instead
- **Timestamps**: Displayed in GB format (DD MMM YYYY, HH:MM)

## 🔗 Related Documentation

- `REFEREE_RESPONSES_TENANT_VIEW_IMPLEMENTATION.md` - Tenant-side view of same data
- `src/landlord_agent/DEVELOPMENT_SETUP.md` - Development environment setup
- `src/landlord_agent/BUILD_GUIDE.md` - Build and deployment guide
- `firestore.indexes.json` - Firestore index configuration

## 🎯 Next Steps

### Optional Enhancements
1. **Real-time Updates**: Add Firestore listeners for live updates
2. **Response Filtering**: Add filters by consent status (agreed/declined)
3. **Response Search**: Search responses by referee/guarantor name
4. **Response Export**: Export responses to PDF/CSV
5. **Response Notifications**: Show badge count of new responses
6. **Response Timeline**: Visual timeline of when responses were received

---

## Summary

The implementation is **complete and fully functional**. Landlords and agents can now view all referee and guarantor responses for any tenant by:

1. Going to **Clients** page
2. Clicking on a **tenant**
3. Navigating to the **References** tab

All responses are fetched from Firestore and displayed with proper formatting, status badges, and timestamps.

