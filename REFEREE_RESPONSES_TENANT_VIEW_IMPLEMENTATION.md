# Referee & Guarantor Responses - Tenant View Implementation

## Overview
This implementation adds a "Reference Responses" section to the tenant's referencing page, allowing tenants to see the responses submitted by their referees and guarantors.

## Changes Made

### 1. Frontend - Tenant Referencing Page
**File:** `src/components/dashboard/sections/TenantReferencing.tsx`

#### Added:
- **State Management:** Added `refereeResponses`, `guarantorResponses`, and `isLoadingResponses` states
- **Auth Integration:** Imported and used `useAuth` to get the current user's email
- **Data Fetching:** Added `useEffect` hook to fetch responses from backend API
- **UI Section:** Added "Reference Responses" section displaying:
  - Employment referee responses
  - Guarantor responses
  - Loading states
  - Empty states with helpful messages
  - Response details: name, email, consent status, submission date, comments
  - Color-coded status badges (green for agreed, red for declined)

### 2. Backend - Firestore Query Support
**File:** `proptii-backend/src/services/referencing.service.ts`

#### Updated: `getRefereeGuarantorResponses()` method
- **Firestore First:** Now queries Firestore first (preferred database)
- **Fallback:** Falls back to Cosmos DB if Firestore is unavailable
- **Queries:** Separate queries for referee and guarantor responses
- **Filtering:** Filters by `type` and `tenantEmail`
- **Sorting:** Results ordered by `createdAt` descending (newest first)

### 3. Firestore Index Configuration
**File:** `firestore.indexes.json`

#### Added Index:
- Collection: `referee_guarantor_responses`
- Fields:
  - `type` (ASCENDING)
  - `tenantEmail` (ASCENDING)
  - `createdAt` (DESCENDING)

This composite index is required for the Firestore queries to work efficiently.

## Data Flow

```
1. Referee/Guarantor fills form → RefereeGuarantorResponseModal
2. Form submission → POST /api/referencing/response
3. Backend saves to Firestore → referee_guarantor_responses collection
4. Tenant visits referencing page → TenantReferencing.tsx
5. Page fetches responses → GET /api/referencing/responses/:tenantEmail
6. Backend queries Firestore (or Cosmos DB fallback)
7. Responses displayed in UI with status badges and comments
```

## Response Data Structure

```typescript
{
  id: string,
  responseType: 'referee' | 'guarantor',
  type: 'referee_response' | 'guarantor_response',
  tenantEmail: string,           // Used to link responses to tenant
  applicantName: string,
  applicantEmail: string,
  firstName: string,
  lastName: string,
  email: string,
  consent: 'agree' | 'disagree',
  reason: string,
  submittedAt: string,
  createdAt: string,
  updatedAt: string
}
```

## UI Features

### Employment References Section
- Shows all referee responses
- Displays referee name and contact email
- Shows consent status with color-coded badge
- Displays submission timestamp
- Shows referee's comments/reasoning

### Guarantor Responses Section
- Shows all guarantor responses
- Displays guarantor name and contact email
- Shows consent status with color-coded badge
- Displays submission timestamp
- Shows guarantor's comments/reasoning

### Loading & Empty States
- Loading spinner while fetching data
- Helpful empty state messages when no responses exist yet
- Appropriate icons for visual feedback

## Deployment Steps

### 1. Deploy Firestore Index
```bash
firebase deploy --only firestore:indexes
```

### 2. Build and Deploy Backend
```bash
cd proptii-backend
npm run build
npm start
```

### 3. Build and Deploy Frontend
```bash
npm run build
npm run dev
```

## Testing

### Test Scenario 1: Referee Response Submission
1. Tenant submits referencing application with referee email
2. Referee receives email and clicks link
3. Referee fills out response form and submits
4. Response is saved to Firestore
5. Tenant navigates to referencing page
6. Tenant sees referee response in "Employment References" section

### Test Scenario 2: Guarantor Response Submission
1. Tenant submits referencing application with guarantor email
2. Guarantor receives email and clicks link
3. Guarantor fills out response form and submits
4. Response is saved to Firestore
5. Tenant navigates to referencing page
6. Tenant sees guarantor response in "Guarantor Responses" section

### Test Scenario 3: Multiple Responses
1. Submit multiple referee/guarantor responses for same tenant
2. All responses should appear in respective sections
3. Responses should be sorted by submission date (newest first)

### Test Scenario 4: No Responses
1. Tenant with no submitted responses
2. Should see empty state messages with helpful text
3. No errors should occur

## API Endpoints Used

### Existing Endpoints
- `POST /api/referencing/response` - Save referee/guarantor response
- `GET /api/referencing/responses/:tenantEmail` - Fetch all responses for a tenant

## Database Collections

### Firestore
- Collection: `referee_guarantor_responses`
- Documents contain all response data
- Indexed on: `type`, `tenantEmail`, `createdAt`

### Cosmos DB (Fallback)
- Container: Same as Firestore collection
- Used if Firestore is unavailable

## Success Criteria

✅ Tenants can view referee responses on their referencing page
✅ Tenants can view guarantor responses on their referencing page
✅ Responses show consent status (agreed/declined) with color coding
✅ Responses show submission timestamps
✅ Responses show comments from referee/guarantor
✅ Empty states display helpful messages
✅ Loading states provide visual feedback
✅ Backend queries Firestore first, falls back to Cosmos DB
✅ Firestore index configured for efficient queries

## Notes

- The tenant email is used as the key to link responses
- Responses are saved when referees/guarantors submit the form via email link
- The same view is also available in the landlord/agent dashboard
- Both Firestore and Cosmos DB are supported for storage/retrieval
- The UI matches the existing design patterns in the application

