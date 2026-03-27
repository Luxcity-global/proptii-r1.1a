# Referee & Guarantor Response Tracking System

## Overview
This implementation allows agents/landlords to track referee and guarantor responses submitted through the email links. All responses are automatically stored and displayed in the **References tab** when viewing a tenant's details in the landlord/agent portal.

## Features Implemented

### 1. Email Links with Tenant Tracking
Updated email templates to include `tenantEmail` parameter:

**Referee Email Link:**
```
/?responseType=referee&applicant=John+Doe&email=referee@email.com&tenantEmail=tenant@email.com
```

**Guarantor Email Link:**
```
/?responseType=guarantor&applicant=John+Doe&email=guarantor@email.com&tenantEmail=tenant@email.com
```

### 2. Backend Storage & Retrieval

#### New Endpoint
- **GET** `/api/referencing/responses/:tenantEmail`
  - Fetches all referee and guarantor responses for a specific tenant
  - Returns separate arrays for referee and guarantor responses
  - Gracefully handles database unavailability

#### Enhanced Response Storage
- Responses now include `tenantEmail` field for linking to tenants
- Stored with type: `referee_response` or `guarantor_response`
- Includes all form data: name, email, consent status, reason, timestamp

### 3. Frontend Display - Landlord/Agent Portal

#### Location
`src/landlord_agent/src/components/TenantDetails.tsx` → **References Tab**

#### What's Displayed

**Employment Referee Responses:**
- Referee's full name
- Contact email
- Consent status (✓ Agreed / ✗ Declined)
- Submission date & time
- Comments/reason for decision
- Color-coded badges (green for agreed, red for declined)

**Guarantor Responses:**
- Guarantor's full name
- Contact email
- Consent status (✓ Agreed / ✗ Declined)
- Submission date & time
- Comments/reason for decision
- Color-coded badges (green for agreed, red for declined)

#### Loading States
- Shows loading spinner while fetching responses
- Empty state message when no responses exist yet
- Real-time data fetching when tenant details are opened

### 4. Response Modal Enhancement

The `RefereeGuarantorResponseModal` now:
- Captures the tenant's email from URL parameters
- Sends `applicantEmail` field with submission
- Links responses to the correct tenant automatically

## User Flow

### For Referee/Guarantor:
1. Receives email with CTA button
2. Clicks "Provide Reference Response" or "Provide Guarantor Response"
3. Homepage opens with modal pre-filled with their email
4. Fills in name, selects agree/disagree, provides comments
5. Submits response

### For Agent/Landlord:
1. Opens Clients/Tenants page
2. Clicks on a tenant to view details
3. Navigates to "References" tab
4. Sees all submitted responses organized by type:
   - Employment Referee Responses
   - Guarantor Responses
5. Reviews consent status and comments
6. Can see submission timestamps

## Data Structure

### Referee Response Object
```json
{
  "id": "referee_response_email_timestamp",
  "type": "referee_response",
  "responseType": "referee",
  "applicantName": "John Doe",
  "applicantEmail": "tenant@email.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "referee@email.com",
  "consent": "agree",
  "reason": "John is an excellent employee...",
  "submittedAt": "2024-12-15T10:30:00Z",
  "createdAt": "2024-12-15T10:30:00Z"
}
```

### Guarantor Response Object
```json
{
  "id": "guarantor_response_email_timestamp",
  "type": "guarantor_response",
  "responseType": "guarantor",
  "applicantName": "John Doe",
  "applicantEmail": "tenant@email.com",
  "firstName": "Robert",
  "lastName": "Johnson",
  "email": "guarantor@email.com",
  "consent": "agree",
  "reason": "I am happy to act as guarantor...",
  "submittedAt": "2024-12-15T11:45:00Z",
  "createdAt": "2024-12-15T11:45:00Z"
}
```

## Files Modified

### Backend
1. `proptii-backend/src/services/email.service.ts`
   - Added `tenantEmail` parameter to email links

2. `proptii-backend/src/controllers/referencing.controller.ts`
   - Added `GET /responses/:tenantEmail` endpoint

3. `proptii-backend/src/services/referencing.service.ts`
   - Added `getRefereeGuarantorResponses()` method
   - Enhanced `saveRefereeGuarantorResponse()` to store `tenantEmail`

### Frontend
1. `src/pages/Home.tsx`
   - Added `tenantEmail` state and query parameter handling

2. `src/components/referencing/RefereeGuarantorResponseModal.tsx`
   - Added `tenantEmail` prop
   - Sends `applicantEmail` with submission

3. `src/landlord_agent/src/components/TenantDetails.tsx`
   - Added referee/guarantor response fetching
   - Enhanced References tab with response display
   - Added loading and empty states

## Benefits

✅ **Complete Tracking**: Every response is automatically captured and stored
✅ **Easy Access**: View all responses in one place within tenant details
✅ **Real-time Updates**: Fresh data loaded each time tenant details are opened
✅ **Visual Clarity**: Color-coded badges for quick consent status identification
✅ **Detailed Information**: Full comments/reasons visible for context
✅ **Professional Display**: Clean, organized card layout
✅ **Responsive Design**: Works on all screen sizes

## Testing the System

1. **Submit a Referee Response:**
   - Navigate to `/?responseType=referee&applicant=Test+Tenant&email=referee@test.com&tenantEmail=tenant@test.com`
   - Fill out the form and submit

2. **Submit a Guarantor Response:**
   - Navigate to `/?responseType=guarantor&applicant=Test+Tenant&email=guarantor@test.com&tenantEmail=tenant@test.com`
   - Fill out the form and submit

3. **View Responses:**
   - Log into landlord/agent portal
   - Go to Clients page
   - Click on tenant with email `tenant@test.com`
   - Navigate to "References" tab
   - See submitted responses

## Future Enhancements (Optional)

- Email notifications to agents when new responses arrive
- Export referee/guarantor responses to PDF
- Response analytics dashboard
- Auto-matching responses with referencing form data
- Response reminders for pending referees/guarantors
- Response verification status (verified/unverified)

## Notes

- System works with or without Cosmos DB (graceful degradation)
- Empty states clearly indicate when no responses exist
- Old mock reference data preserved for backwards compatibility
- All timestamps formatted in UK locale (DD MMM YYYY, HH:MM)

