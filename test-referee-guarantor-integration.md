# Test Checklist: Referee & Guarantor Responses Integration

## 🧪 Complete Test Scenario

### Prerequisites
- [ ] Backend running on port 10000
- [ ] Landlord/Agent dashboard running on port 3000
- [ ] Main tenant app running on port 5173
- [ ] Firestore configured and accessible

### Test 1: Submit Referencing Application

**Steps:**
1. [ ] Navigate to `http://localhost:5173/referencing`
2. [ ] Fill out form with test data:
   ```
   Tenant Email: test.tenant@example.com
   Tenant Name: John Doe
   Referee Email: test.referee@example.com
   Referee Name: Jane Smith
   Guarantor Email: test.guarantor@example.com
   Guarantor Name: Bob Johnson
   ```
3. [ ] Submit the application
4. [ ] Verify backend console shows email sending logs

**Expected Result:**
- ✅ Application submitted successfully
- ✅ Backend logs show emails sent to referee and guarantor
- ✅ Email links include `tenantEmail` parameter

---

### Test 2: Simulate Referee Response

**Steps:**
1. [ ] Copy referee response link from backend logs
2. [ ] Open link in new browser tab
3. [ ] Fill out response form:
   ```
   Consent: Agree
   Comments: "John is an excellent employee with strong work ethic."
   ```
4. [ ] Submit response
5. [ ] Check backend logs for successful save

**Expected Result:**
- ✅ Response modal opens with correct applicant name
- ✅ Form submits successfully
- ✅ Backend saves to Firestore `referee_guarantor_responses` collection
- ✅ Document includes `tenantEmail: test.tenant@example.com`

---

### Test 3: Simulate Guarantor Response

**Steps:**
1. [ ] Copy guarantor response link from backend logs
2. [ ] Open link in new browser tab
3. [ ] Fill out response form:
   ```
   Consent: Agree
   Comments: "I am willing to act as guarantor for John."
   ```
4. [ ] Submit response
5. [ ] Check backend logs for successful save

**Expected Result:**
- ✅ Response modal opens with correct applicant name
- ✅ Form submits successfully
- ✅ Backend saves to Firestore `referee_guarantor_responses` collection
- ✅ Document includes `tenantEmail: test.tenant@example.com`

---

### Test 4: Add Tenant to Landlord Dashboard

**Steps:**
1. [ ] Navigate to `http://localhost:3000`
2. [ ] Go to **Clients** page
3. [ ] Click **Add Tenant** button
4. [ ] Fill in tenant details:
   ```
   Name: John Doe
   Email: test.tenant@example.com
   Phone: 07123456789
   Property: (Select any property)
   ```
5. [ ] Save tenant

**Expected Result:**
- ✅ Tenant added successfully
- ✅ Tenant appears in clients list
- ✅ Email matches referencing application email

---

### Test 5: View Responses in Landlord Dashboard

**Steps:**
1. [ ] In Clients page, find tenant "John Doe"
2. [ ] Click on tenant to view details
3. [ ] Click on **References** tab
4. [ ] Wait for responses to load

**Expected Result:**
- ✅ "Employment Referee Responses" section visible
- ✅ Shows 1 response with referee details:
  - Name: Jane Smith
  - Email: test.referee@example.com
  - Badge: ✓ Agreed (green)
  - Comments: "John is an excellent employee with strong work ethic."
  - Submission timestamp visible
  
- ✅ "Guarantor Responses" section visible
- ✅ Shows 1 response with guarantor details:
  - Name: Bob Johnson
  - Email: test.guarantor@example.com
  - Badge: ✓ Agreed (green)
  - Comments: "I am willing to act as guarantor for John."
  - Submission timestamp visible

---

### Test 6: Test Empty State

**Steps:**
1. [ ] Add a new tenant with different email: `test.tenant2@example.com`
2. [ ] View this tenant's details
3. [ ] Navigate to References tab

**Expected Result:**
- ✅ "No referee responses yet" message displayed
- ✅ "No guarantor responses yet" message displayed
- ✅ Helpful text: "Responses will appear here once submitted"
- ✅ No errors in console

---

### Test 7: Test Declined Response

**Steps:**
1. [ ] Submit another referencing application with different tenant
2. [ ] When simulating referee response, select **Disagree**
3. [ ] Add reason: "Unable to provide reference at this time"
4. [ ] Submit response
5. [ ] View responses in landlord dashboard

**Expected Result:**
- ✅ Response shows red badge: ✗ Declined
- ✅ Reason is displayed correctly
- ✅ Badge color is red/error color

---

### Test 8: Test Loading State

**Steps:**
1. [ ] View a tenant's References tab
2. [ ] Observe the initial loading state before data loads
3. [ ] Check DevTools Network tab for API call

**Expected Result:**
- ✅ Loading spinner visible while fetching
- ✅ "Loading referee responses..." message shown
- ✅ Network request to `/api/referencing/responses/:tenantEmail`
- ✅ Loading state disappears after data loads

---

### Test 9: Test API Error Handling

**Steps:**
1. [ ] Stop the backend server
2. [ ] View a tenant's References tab in landlord dashboard
3. [ ] Check console for errors

**Expected Result:**
- ✅ No UI crash/white screen
- ✅ Shows empty state (no responses)
- ✅ Console logs error message
- ✅ User can still navigate the app

---

### Test 10: Test Multiple Responses

**Steps:**
1. [ ] Create 3 different referee response submissions for same tenant
2. [ ] Create 2 different guarantor response submissions for same tenant
3. [ ] View tenant's References tab

**Expected Result:**
- ✅ Employment Referee Responses shows "3 responses"
- ✅ All 3 referee responses displayed
- ✅ Guarantor Responses shows "2 responses"
- ✅ All 2 guarantor responses displayed
- ✅ Responses sorted by date (newest first)

---

## 🔍 Manual Inspection Checklist

### Firestore Console
- [ ] Open Firebase Console
- [ ] Navigate to Firestore Database
- [ ] Find `referee_guarantor_responses` collection
- [ ] Verify documents have correct structure:
  - `tenantEmail` field exists
  - `type` field is either "referee_response" or "guarantor_response"
  - `consent` field is either "agree" or "disagree"
  - `createdAt` timestamp exists

### Browser DevTools
- [ ] Open Network tab
- [ ] Filter by "referencing/responses"
- [ ] Verify API call returns expected data
- [ ] Check response structure matches expected schema
- [ ] Verify 200 status code

### Backend Logs
- [ ] Check logs for successful Firestore queries
- [ ] Look for: "Fetching referee/guarantor responses for tenant:"
- [ ] Look for: "Found X referee and X guarantor responses"
- [ ] No error messages related to Firestore

---

## 🐛 Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| No responses showing | Email mismatch | Ensure tenant email in dashboard exactly matches referencing form |
| 404 API error | Wrong API URL | Verify backend running on port 10000 |
| Empty responses always | Firestore permissions | Check Firestore security rules |
| Loading forever | Backend not responding | Check backend console for errors |
| Wrong tenant's responses | Query filter issue | Check `tenantEmail` parameter in API call |

---

## ✅ Test Summary Template

```
Date: _______________
Tester: _______________

Test Results:
- Test 1 (Submit Referencing): [ ] Pass  [ ] Fail
- Test 2 (Referee Response):   [ ] Pass  [ ] Fail
- Test 3 (Guarantor Response): [ ] Pass  [ ] Fail
- Test 4 (Add Tenant):         [ ] Pass  [ ] Fail
- Test 5 (View Responses):     [ ] Pass  [ ] Fail
- Test 6 (Empty State):        [ ] Pass  [ ] Fail
- Test 7 (Declined Response):  [ ] Pass  [ ] Fail
- Test 8 (Loading State):      [ ] Pass  [ ] Fail
- Test 9 (Error Handling):     [ ] Pass  [ ] Fail
- Test 10 (Multiple Responses):[ ] Pass  [ ] Fail

Overall Status: [ ] All Pass  [ ] Some Failures

Notes:
_______________________________________
_______________________________________
_______________________________________
```

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd proptii-backend
npm run build ; npm start

# Terminal 2: Start Landlord Dashboard
cd src/landlord_agent
npm run dev

# Terminal 3: Start Main Tenant App
npm run dev
```

**Access URLs:**
- Backend API: http://localhost:10000
- Landlord Dashboard: http://localhost:3000
- Tenant App: http://localhost:5173
- Referencing Form: http://localhost:5173/referencing

---

## 📊 Expected Console Logs

### Backend Console (when response submitted)
```
💾 Preparing to save response with data: { ... }
✅ referee response saved to Firestore: referee_response_test.referee@example.com_1234567890
📧 Stored with tenantEmail: test.tenant@example.com
```

### Frontend Console (when viewing responses)
```
[TenantDetails] Fetching referee/guarantor responses for: test.tenant@example.com
[TenantDetails] Referee/Guarantor responses: { 
  success: true, 
  data: { 
    refereeResponses: [{ ... }],
    guarantorResponses: [{ ... }]
  }
}
```

