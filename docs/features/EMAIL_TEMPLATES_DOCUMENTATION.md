# Email Templates Documentation

## Overview

This document provides a comprehensive list of all email templates sent by various modals and features in the Proptii application.

---

## Table of Contents

1. [Referencing Modal Emails](#referencing-modal-emails)
   - Agent Email
   - Referee Email
   - Guarantor Email
   - User Confirmation Email
2. [Viewing Booking Emails](#viewing-booking-emails)
   - Viewing Agent Email
   - Viewing User Confirmation Email
3. [Support/Contact Emails](#supportcontact-emails)
   - FAQ Support Form Email
4. [Contract Emails](#contract-emails)
   - Signed Contract Email

---

## Referencing Modal Emails

The Referencing Modal sends up to 4 different emails when a tenant completes their referencing application.

### 1. Agent Email

**Triggered By**: Referencing Modal submission  
**Sent To**: Agent/Landlord email (from `agentDetails.email`)  
**Subject**: `New Referencing Application from {firstName} {lastName}`  
**Has Attachments**: ✅ Yes (ZIP file with all uploaded documents)

**Template Purpose**: Notifies the agent/landlord that a tenant has completed their referencing application and uploaded all required documents.

**Content Includes**:
- Tenant personal information (name, email, phone, DOB, nationality)
- Employment details (status, company, job position, reference contact)
- Residential history (current/previous addresses, duration)
- Financial information (monthly income, proof of income type)
- Guarantor details (if applicable)
- Agent details (agent name and email)

**Visual Style**:
- Proptii branding colors (#136C9E)
- Sectioned layout with background colors
- Professional footer with Proptii logo and description

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateAgentEmailTemplate()`

---

### 2. Referee Email

**Triggered By**: Referencing Modal submission (if employment referee email provided)  
**Sent To**: Employer/Reference email (from `employment.referenceEmail`)  
**Subject**: `Reference Request for {firstName} {lastName}`  
**Has Attachments**: ❌ No

**Template Purpose**: Requests employment verification from the tenant's current employer or professional reference.

**Content Includes**:
- Introduction explaining the reference request
- Tenant's name and basic information
- Employment details to verify:
  - Company name
  - Job position/title
  - Length of employment
  - Reference contact person
- Request for verification and confirmation
- Contact information for questions

**Visual Style**:
- Professional and formal tone
- Clean, simple layout
- Proptii branding

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateRefereeEmailTemplate()`

---

### 3. Guarantor Email

**Triggered By**: Referencing Modal submission (if guarantor information provided)  
**Sent To**: Guarantor email (from `guarantor.email`)  
**Subject**: `You've Been Chosen as a Guarantor by {firstName} {lastName}`  
**Has Attachments**: ❌ No

**Template Purpose**: Notifies the guarantor that they have been named as a guarantor for the tenant's rental application.

**Content Includes**:
- Introduction explaining they've been chosen as a guarantor
- Tenant's information (name)
- Explanation of guarantor responsibilities
- Guarantor's own information for verification:
  - Full name
  - Email address
  - Phone number
  - Address
- Next steps and what to expect
- Contact information

**Visual Style**:
- Friendly but professional tone
- Clear explanation of responsibilities
- Proptii branding

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateGuarantorEmailTemplate()`

---

### 4. User Confirmation Email

**Triggered By**: Referencing Modal submission  
**Sent To**: Tenant email (from `identity.email`)  
**Subject**: `Summary of Referencing Details Submitted`  
**Has Attachments**: ❌ No

**Template Purpose**: Confirms to the tenant that their referencing application has been successfully submitted and provides a summary of what was submitted.

**Content Includes**:
- Confirmation message
- Summary of all submitted information:
  - Personal details
  - Employment information
  - Residential history
  - Financial details
  - Guarantor information (if provided)
- Next steps in the process
- Timeline for review
- Contact information for questions

**Visual Style**:
- User-friendly and reassuring tone
- Organized sections
- Proptii branding

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateUserEmailTemplate()`

---

## Viewing Booking Emails

The Viewing Booking system sends 2 emails when a user requests a property viewing.

### 5. Viewing Agent Email

**Triggered By**: Viewing booking request  
**Sent To**: Estate agent email (from `property.agent.email`)  
**Subject**: `New Viewing Request - {property.street}`  
**Has Attachments**: ❌ No

**Template Purpose**: Notifies the estate agent of a new viewing request for one of their properties.

**Content Includes**:
- New viewing request notification
- Property details:
  - Address (street, city, postcode)
  - Property type
- Requested viewing details:
  - Date and time
  - Viewing type (in-person or virtual)
- User/tenant information:
  - Name
  - Email
  - Phone number
- Instructions to confirm or reschedule
- Direct reply option

**Visual Style**:
- Professional business tone
- Clean layout with sections
- Proptii colors (#136C9E, #FF6B35)
- Action button for easy response

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateViewingAgentEmailTemplate()`

---

### 6. Viewing User Confirmation Email

**Triggered By**: Viewing booking request  
**Sent To**: User/tenant email (from user form)  
**Subject**: `Your Viewing Request Confirmation`  
**Has Attachments**: ❌ No

**Template Purpose**: Confirms to the user that their viewing request has been submitted and provides booking details.

**Content Includes**:
- Thank you and confirmation message
- Property details:
  - Full address
  - Property information
- Requested viewing time:
  - Date
  - Time
  - Type (virtual or in-person)
- Estate agent details:
  - Agent name
  - Agent email
  - Agency contact information
- What to expect next
- Reminder that agent will confirm

**Visual Style**:
- Friendly and informative
- Clear sections with background colors
- Proptii branding
- Professional footer

**Code Location**: `proptii-backend/src/services/emailService.js` → `generateViewingUserEmailTemplate()`

---

## Support/Contact Emails

### 7. FAQ Support Form Email

**Triggered By**: FAQ Contact Support form submission  
**Sent To**: `contactus@theluxcity.co.uk` (support team)  
**Subject**: `[Support Request] {subject} - {heading}`  
**Has Attachments**: ❌ No

**Template Purpose**: Sends support inquiries from the FAQ page contact form to the support team.

**Content Includes**:
- Clear header indicating new support request
- Subject category (General Inquiry, Technical Support, Feedback, Other)
- Heading/brief description
- User's email address (clickable for easy reply)
- Full message body
- Timestamp of submission
- "Reply to User" button

**Visual Style**:
- Professional Proptii branding
- Dark blue header (#0A2342)
- Orange accent color (#FF6B35)
- White content cards with orange left border
- Clean, modern design
- Responsive layout

**Code Location**: 
- Backend: `proptii-backend/src/services/emailService.js` → `generateSupportEmailTemplate()`
- Frontend: `src/components/HelpFormModal.tsx`

---

## Contract Emails

### 8. Signed Contract Email

**Triggered By**: Contract signing in DocumentSigningViewer  
**Sent To**: Recipient email (specified when sending contract)  
**Subject**: `Signed Contract: {contractName}`  
**Has Attachments**: ✅ Yes (Signed PDF contract)

**Template Purpose**: Delivers the signed rental contract to recipients (tenant, landlord, agent).

**Content Includes**:
- Professional greeting
- Notification that contract has been signed
- Contract details:
  - Contract name/title
  - Signing date
  - Sender information
- Instructions for reviewing the attached PDF
- Legal notices and next steps
- Contact information for questions
- Secure attachment notice

**Visual Style**:
- Professional and formal
- Proptii branding
- Legal document styling
- Clear instructions
- Security emphasis

**Code Location**: `proptii-backend/src/services/contract-email.service.ts` → `sendSignedContractEmail()`

**Special Features**:
- Retry mechanism (up to 3 attempts)
- Large file support
- SMTP timeout handling
- Detailed logging

---

## Email Sending Flow

### Referencing Modal Flow

```
User completes referencing form
        ↓
Saves to Firestore + Local Storage
        ↓
Uploads documents to storage
        ↓
Submits form
        ↓
Backend processes submission
        ↓
┌────────────────┬──────────────┬───────────────┬──────────────┐
│                │              │               │              │
Agent Email  Referee Email  Guarantor Email  User Email
(with ZIP)   (if provided)  (if provided)    (confirmation)
```

### Viewing Booking Flow

```
User requests viewing
        ↓
Saves booking to Firestore
        ↓
Backend processes request
        ↓
┌────────────────┬──────────────┐
│                │              │
Agent Email   User Confirmation
(notification)   (booking details)
```

### Support Form Flow

```
User submits support form
        ↓
Saves to Firestore
        ↓
Generates HTML email
        ↓
Sends to support team
(contactus@theluxcity.co.uk)
```

### Contract Signing Flow

```
User signs contract in viewer
        ↓
Generates signed PDF
        ↓
Sends to specified recipients
(with PDF attachment)
```

---

## SMTP Configuration

All emails use the same SMTP configuration defined in environment variables:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=your-from-email
```

**Supported SMTP Providers**:
- Gmail (requires App Password)
- Outlook/Hotmail
- SendGrid
- Mailgun
- Any standard SMTP server

---

## Email Template Common Elements

### All emails include:

1. **Proptii Branding**
   - Logo (where applicable)
   - Brand colors (#136C9E, #FF6B35, #0A2342)
   - Professional typography

2. **Footer Section**
   - Copyright notice
   - Proptii description/tagline
   - Contact information
   - Website link

3. **Responsive Design**
   - Mobile-friendly layout
   - Max-width constraints (600px)
   - Proper padding and spacing

4. **Professional Styling**
   - Clean, modern design
   - Clear information hierarchy
   - Easy-to-read fonts
   - Accessible color contrasts

---

## Template Customization

### Where Templates are Defined

**Backend Templates**:
- `proptii-backend/src/services/emailService.js` - Main email service with all templates
- `proptii-backend/src/services/email.service.ts` - TypeScript version (alternative)
- `proptii-backend/src/services/contract-email.service.ts` - Contract-specific emails
- `proptii-backend/src/routes/supportRoutes.js` - Support form template

**Frontend Templates**:
- `src/components/HelpFormModal.tsx` - Support form HTML generation
- `src/services/emailService.ts` - Frontend email service wrapper

### To Modify a Template:

1. Locate the appropriate `generate*EmailTemplate()` method
2. Update the HTML/CSS within the template literal
3. Test the changes with a real submission
4. Check email rendering in multiple clients (Gmail, Outlook, Apple Mail)

---

## Testing Email Templates

### Test Checklist:

- [ ] Email renders correctly in Gmail
- [ ] Email renders correctly in Outlook
- [ ] Email renders correctly in Apple Mail
- [ ] Mobile responsive design works
- [ ] All links are clickable
- [ ] All dynamic data populates correctly
- [ ] Attachments are included (for agent/contract emails)
- [ ] Reply-to addresses work
- [ ] Email reaches inbox (not spam)
- [ ] Branding and colors are consistent

### Test Email Addresses:

For testing, use these email types:
- Your own email for user confirmations
- Test agent email for agent notifications
- Test support email for support forms
- Test referee email for reference requests

---

## Troubleshooting

### Common Issues:

**Emails not sending**:
- Check SMTP credentials
- Verify SMTP port and host
- Check firewall settings
- Review backend logs

**Emails going to spam**:
- Configure SPF records
- Set up DKIM
- Use professional from-email address
- Avoid spam trigger words

**Attachments not working**:
- Check file size limits
- Verify SMTP supports attachments
- Test with smaller files first
- Check MIME type configuration

**Template rendering issues**:
- Test in multiple email clients
- Use inline CSS
- Avoid complex layouts
- Use email-safe HTML

---

## Email Metrics

### Tracking (To Be Implemented):

- Email delivery rate
- Open rate
- Click-through rate
- Bounce rate
- Spam complaint rate

### Current Status:

✅ **Implemented**:
- Email sending functionality
- Multiple template types
- Attachment support
- Error handling
- Retry mechanism (contracts)

⏳ **Planned**:
- Email delivery tracking
- Read receipts
- Click tracking
- A/B testing
- Template analytics

---

## Email Best Practices

### Content:

1. **Clear Subject Lines** - Descriptive and actionable
2. **Personalization** - Use recipient's name
3. **Concise Content** - Get to the point quickly
4. **Call to Action** - Clear next steps
5. **Professional Tone** - Appropriate for business

### Design:

1. **Mobile-First** - Most emails opened on mobile
2. **Simple Layouts** - Avoid complex designs
3. **Inline CSS** - Better email client support
4. **Alt Text** - For images and buttons
5. **Accessible** - High contrast, readable fonts

### Technical:

1. **Test Thoroughly** - Multiple devices and clients
2. **Monitor Delivery** - Track bounces and failures
3. **Secure SMTP** - Use TLS/SSL
4. **Error Handling** - Graceful failure recovery
5. **Logging** - Track all email events

---

## Summary Table

| Email Type | Recipient | Attachments | Purpose |
|------------|-----------|-------------|---------|
| Agent Email | Agent/Landlord | ✅ ZIP | Referencing application notification |
| Referee Email | Employer Reference | ❌ | Employment verification request |
| Guarantor Email | Guarantor | ❌ | Guarantor notification |
| User Confirmation | Tenant | ❌ | Referencing submission confirmation |
| Viewing Agent | Estate Agent | ❌ | New viewing request notification |
| Viewing User | Tenant | ❌ | Viewing request confirmation |
| Support Form | Support Team | ❌ | FAQ contact form submission |
| Signed Contract | Recipient(s) | ✅ PDF | Signed contract delivery |

---

## Maintenance

### Regular Tasks:

- [ ] Review email templates quarterly
- [ ] Update branding as needed
- [ ] Check SMTP credentials validity
- [ ] Monitor email delivery rates
- [ ] Update legal disclaimers
- [ ] Test with new email clients
- [ ] Review spam complaint rates
- [ ] Update contact information

### Version History:

- **v1.0** (Nov 2025) - Initial documentation
  - All 8 email templates documented
  - SMTP configuration explained
  - Testing procedures outlined

---

**Last Updated**: November 2, 2025  
**Maintained By**: Development Team  
**Contact**: For questions about email templates, contact the development team.

