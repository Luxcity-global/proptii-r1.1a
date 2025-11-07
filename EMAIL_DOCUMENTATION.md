# Email Documentation

This document outlines all emails sent by the following components:
- `ContractModal.tsx`
- `ReferencingModal.OLD.tsx`
- `BookViewingModal.tsx`

---

## 1. ContractModal.tsx

**Status:** ❌ **NO EMAILS SENT**

The `ContractModal.tsx` component does **NOT** send any emails directly. It only handles contract template upload, management, and preview functionality.

**Note:** Contract email functionality exists in other components (e.g., `SendContract.tsx`), but is not part of `ContractModal.tsx`.

---

## 2. ReferencingModal.OLD.tsx

**Status:** ✅ **SENDS MULTIPLE EMAILS**

When a user submits a referencing application through `ReferencingModal.OLD.tsx`, the `submitApplication()` function is called, which triggers the backend `referencingService.submitApplication()`. This service then calls `emailService.sendMultipleEmails()` to send up to **4 different emails**:

### 2.1. Agent Email

**Recipient:** `formData.agentDetails.email`  
**Subject:** `New Referencing Application from {firstName} {lastName}`  
**Email Type:** `agent`  
**Attachments:** ✅ Yes - All submitted documents (zip file containing all attachments)

**Content:**
- Greeting to agent by first name
- Notification that the applicant has uploaded verification documents
- Complete tenant information section:
  - First Name, Last Name
  - Email Address, Phone Number
  - Date of Birth, Nationality
- Employment Details section:
  - Employment Status
  - Company Details, Job Position
  - Length of Employment (Years)
  - Proof of Employment type
  - Referee details (Full Name, Email, Phone)
- Residential History section:
  - Reason for leaving Previous Address
  - Current Address
  - Previous Address (if applicable)
  - Duration at current address
  - Proof of Address type
  - Duration at previous address (if applicable)
- Financial Information section:
  - Monthly Income (£)
  - Proof of Income Type
- Guarantor Details section (if provided):
  - Guarantor's First Name, Last Name
  - Email Address, Phone Number
  - Address
- Instructions for agent to review documents and verify
- Agent contact information for follow-up
- Proptii branding and footer

**When Sent:** Automatically when referencing application is submitted

---

### 2.2. Referee Email

**Recipient:** `formData.employment.referenceEmail`  
**Subject:** `Reference Request for {firstName} {lastName}`  
**Email Type:** `referee`  
**Attachments:** ❌ No

**Content:**
- Greeting to referee by name
- Notification that the applicant has listed them as a referee
- Request to confirm:
  - Current employment status
  - Brief note on character and reliability
- Link to Google Forms reference form:
  - `https://docs.google.com/forms/d/e/1FAIpQLScPCYOvh4O-RuceRjFc5BTmghho1QmhHlGu9jkEA5uSSGaZ3g/viewform?usp=preview`
- Agent contact information (for reference only)
- Thank you message
- Proptii branding and footer

**When Sent:** Automatically when referencing application is submitted (only if referee email is provided)

---

### 2.3. Guarantor Email

**Recipient:** `formData.guarantor.email`  
**Subject:** `You've Been Chosen as a Guarantor by {firstName} {lastName}`  
**Email Type:** `guarantor`  
**Attachments:** ❌ No

**Content:**
- Greeting to guarantor by first name
- Notification that they've been selected as guarantor
- Request to review guarantor terms and accept responsibility
- Link to Google Forms guarantor form:
  - `https://docs.google.com/forms/d/e/1FAIpQLScZAljnM4q5IcBDmsK3E32MprXfXxgHn62zYUGDyQ8GJFXlNQ/viewform?usp=header`
- Note that signed form will be shared with letting agent
- Agent contact information (for reference only)
- Thank you message
- Proptii branding and footer

**When Sent:** Automatically when referencing application is submitted (only if guarantor email is provided)

---

### 2.4. User Email (Summary)

**Recipient:** `formData.identity.email`  
**Subject:** `Summary of Your Referencing Application`  
**Email Type:** `user`  
**Attachments:** ❌ No

**Content:**
- Greeting to applicant by first name
- Thank you message for completing referencing forms
- Summary of referencing details provided:
  - Current Employer
  - Job Title
  - Monthly Income
  - Referees Listed (name and email)
  - Guarantor (name and email, if provided)
- List of documents uploaded:
  - Proof of ID (if provided)
  - Proof of Address (if provided)
  - Employment Document (if provided)
  - Financial Document (if provided)
  - Guarantor Document (if provided)
- "What Happens Next?" section:
  - Referees and guarantor will be contacted
  - Letting agent will review submission
  - Notification when application is reviewed and accepted
- Contact information for questions
- Proptii branding and footer

**When Sent:** Automatically when referencing application is submitted

---

## 3. BookViewingModal.tsx

**Status:** ✅ **SENDS 2 EMAILS**

When a user submits a viewing request through `BookViewingModal.tsx`, the `handleNext()` function calls `viewingEmailService.sendViewingEmails()`, which sends **2 emails**:

### 3.1. Viewing Agent Email

**Recipient:** `property.agent.email`  
**Subject:** `New Viewing Request - {property.street}`  
**Email Type:** `viewing-agent`  
**Attachments:** ❌ No

**Content:**
- Header: "New Viewing Request"
- Greeting to agent by name
- Notification of new viewing request
- Property Details section:
  - Full property address (street, city, postcode)
- Viewing Details section:
  - Date (formatted as: "Monday, 1 January 2024")
  - Time (formatted as: "10:00 AM")
  - Type (Virtual Viewing or In-Person Viewing)
- Viewer Details section:
  - Name
  - Email
  - Phone Number
- Instructions for agent to:
  - Review the request
  - Confirm the appointment
  - Propose alternative time if needed
- Request to send response to viewer's email
- Proptii branding and footer

**When Sent:** Automatically when viewing request is submitted

---

### 3.2. Viewing User Confirmation Email

**Recipient:** `user.email` or `viewing.userDetails.email`  
**Subject:** `Your Viewing Request Confirmation`  
**Email Type:** `viewing-user`  
**Attachments:** ❌ No

**Content:**
- Header: "Viewing Request Confirmation"
- Greeting to user by first name
- Confirmation that viewing request has been sent to agent
- Property Details section:
  - Full property address (street, city, postcode)
  - Agent name
  - Agent email
- Viewing Details section:
  - Date (formatted as: "Monday, 1 January 2024")
  - Time (formatted as: "10:00 AM")
  - Type (Virtual Viewing or In-Person Viewing)
- Note that agent will contact them shortly to confirm
- Proptii branding and footer

**When Sent:** Automatically when viewing request is submitted

---

## Email Sending Flow Summary

### ReferencingModal.OLD.tsx Flow:
```
User submits form
  ↓
submitApplication() called
  ↓
referencingService.submitApplication()
  ↓
emailService.sendMultipleEmails()
  ↓
Sends 4 emails in parallel:
  1. Agent Email (with attachments)
  2. Referee Email (no attachments)
  3. Guarantor Email (no attachments)
  4. User Email (no attachments)
```

### BookViewingModal.tsx Flow:
```
User submits viewing request
  ↓
handleNext() called
  ↓
viewingEmailService.sendViewingEmails()
  ↓
Sends 2 emails in parallel:
  1. Viewing Agent Email
  2. Viewing User Confirmation Email
```

---

## Technical Details

### Email Service Locations:
- **Frontend:** `src/services/emailService.ts`
- **Backend:** `proptii-backend/src/services/email.service.ts`
- **Viewing Service:** `src/components/viewings/services/viewingEmailService.ts`
- **Contract Service:** `src/services/contractEmailService.ts`

### Email Templates:
All email templates are generated server-side using HTML templates with inline CSS styling. Templates include:
- Proptii branding and logo
- Consistent color scheme (#136C9E for primary, #DC5F12 for accent)
- Responsive design considerations
- Footer with Proptii description and link

### Error Handling:
- Email sending failures are logged but do not block the main submission process
- Users receive success notifications even if some emails fail
- Email service is optional - application submission succeeds even if emails fail

---

## Notes

1. **ContractModal.tsx** does not send emails - this is intentional as it only handles template management
2. All emails are sent asynchronously and in parallel where possible
3. Email sending is optional - the main operations (submission, booking) succeed even if email service is unavailable
4. All email templates include Proptii branding and footer information
5. Agent emails include attachments (zip files) while other recipient emails do not for privacy/security reasons







