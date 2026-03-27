# 📊 Tenant Email Invitation - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LANDLORD AGENT DASHBOARD                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            InviteTenant Component (Fixed)          │    │
│  │                                                     │    │
│  │  User Input:                                       │    │
│  │  • Tenant Email ────────┐                         │    │
│  │  • Property Selection   │                         │    │
│  │  • Custom Message       │                         │    │
│  │                         │                         │    │
│  │  [Send Invitation Button]                         │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  handleSendInvitation  │
              │       (Enhanced)        │
              └────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   [Validate]      [Generate Email]    [Determine URL]
      Form              HTML              Priority:
        │                  │              1. ENV VAR
        │                  │              2. localhost
        │                  │              3. production
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Retry Logic (NEW!)   │
              │   • Max 3 attempts     │
              │   • Exponential backoff│
              │   • Smart error detect │
              └────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   [Attempt 1]        [Attempt 2]        [Attempt 3]
    Wait 0s            Wait 2s            Wait 4s
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │   HTTP POST /api/email/send          │
        │   • timeout: 45s                     │
        │   • headers: Content-Type: json      │
        │   • body: {to, subject, html}        │
        └──────────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────┐
│                    BACKEND SERVER                      │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │        EmailController (/api/email/send)     │    │
│  │         • Validates: to, subject, html       │    │
│  │         • Returns: {success, messageId}      │    │
│  └──────────────────────────────────────────────┘    │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────┐    │
│  │              EmailService                     │    │
│  │                                               │    │
│  │  Priority 1: Resend API ✅ (Primary)         │    │
│  │  • API Key: RESEND_API_KEY                   │    │
│  │  • From: noreply@mail.proptii.co             │    │
│  │  • Fast, reliable, modern                    │    │
│  │                    │                          │    │
│  │                    ▼                          │    │
│  │         [Success?]   [Failed?]               │    │
│  │            │            │                     │    │
│  │            │            ▼                     │    │
│  │            │   Priority 2: SMTP ✅ (Fallback)│    │
│  │            │   • Host: smtp.gmail.com        │    │
│  │            │   • Port: 465                   │    │
│  │            │   • User: contactus@...         │    │
│  │            │                                  │    │
│  │            └───────────┬──────────────────────│    │
│  │                        │                      │    │
│  └────────────────────────┼──────────────────────┘    │
│                           │                            │
└───────────────────────────┼────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   Email Service Provider  │
              │   (Resend / Gmail SMTP)   │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   📧 Tenant's Email Inbox│
              │                           │
              │   Subject: Invitation to  │
              │   join as tenant for...   │
              │                           │
              │   [View Email Content]    │
              └──────────────────────────┘
```

## Request/Response Flow

### Successful Request
```
Frontend                    Backend                 Email Service
   │                           │                          │
   │  POST /api/email/send     │                          │
   ├──────────────────────────>│                          │
   │  {to, subject, html}      │                          │
   │                           │                          │
   │                           │  Send via Resend API     │
   │                           ├─────────────────────────>│
   │                           │                          │
   │                           │  ✅ {id: "re_xxx"}       │
   │                           │<─────────────────────────┤
   │                           │                          │
   │  ✅ {success: true,       │                          │
   │      messageId: "re_xxx"} │                          │
   │<──────────────────────────┤                          │
   │                           │                          │
   ▼                           ▼                          ▼
[Show Success]           [Log Success]              [Deliver Email]
```

### Request with Retry (Network Error)
```
Frontend                    Backend
   │                           │
   │  Attempt 1                │
   ├──────────────────────────>│
   │                           X  [Connection refused]
   │<──────────────────────────┤
   │                           │
   │  [Wait 2s]                │
   │                           │
   │  Attempt 2                │
   ├──────────────────────────>│
   │                           X  [Timeout]
   │<──────────────────────────┤
   │                           │
   │  [Wait 4s]                │
   │                           │
   │  Attempt 3                │
   ├──────────────────────────>│
   │                           │  ✅ Success!
   │  ✅ {success: true}       │
   │<──────────────────────────┤
   │                           │
   ▼                           ▼
[Show Success]           [Log Success]
```

### Error Handling
```
Frontend                    Backend                 Response
   │                           │                          │
   │  POST /api/email/send     │                          │
   ├──────────────────────────>│                          │
   │                           │                          │
   │                           ├─[Validation Error]       │
   │                           │                          │
   │  ❌ {success: false,      │                          │
   │      error: "Invalid..."}│                          │
   │<──────────────────────────┤                          │
   │                           │                          │
   ▼                                                      │
[Show Error Message]                                     │
[Show Troubleshooting]                                   │
```

## Component State Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Component State                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Initial State:                                         │
│  • isLoading: false                                     │
│  • isSuccess: false                                     │
│  • errors: {}                                           │
│  • formData: {email, propertyId, customMessage}        │
│                                                          │
│                           │                              │
│                           ▼                              │
│                  [User clicks "Send"]                   │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────┐        │
│  │   Validation                                │        │
│  │   • Email format                            │        │
│  │   • Property selected                       │        │
│  └────────────────────────────────────────────┘        │
│                           │                              │
│           ┌───────────────┴───────────────┐             │
│           │                               │             │
│           ▼                               ▼             │
│      [Invalid]                       [Valid]            │
│       • Show errors                  • setIsLoading(true)│
│       • Keep form open               • setErrors({})    │
│                                      • Send request     │
│                                           │             │
│                       ┌───────────────────┴─────────┐   │
│                       │                             │   │
│                       ▼                             ▼   │
│                  [Success]                      [Error] │
│                       │                             │   │
│                       ▼                             ▼   │
│              • setIsSuccess(true)         • setErrors()│
│              • setIsLoading(false)        • setIsLoading│
│              • Show success screen         (false)     │
│              • Auto-redirect (3s)         • Show error │
│                                           • Keep form   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Error Types & Handling

```
┌────────────────────────────────────────────────────────┐
│                    Error Categories                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Network Errors (Retryable):                           │
│  • ECONNREFUSED → Retry with backoff                   │
│  • ETIMEDOUT → Retry with backoff                      │
│  • ECONNRESET → Retry with backoff                     │
│  • No response → Retry with backoff                    │
│                                                         │
│  Validation Errors (Not Retryable):                    │
│  • 400 Bad Request → Show error, don't retry           │
│  • Invalid email format → Form validation              │
│  • Missing fields → Form validation                    │
│                                                         │
│  Server Errors (Not Retryable):                        │
│  • 500 Internal Server Error → Show error              │
│  • Email service not configured → Show error           │
│  • SMTP authentication failed → Show error             │
│                                                         │
│  Success:                                               │
│  • 200 OK + success: true → Show success screen        │
│  • Message ID returned → Log to console                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Email Template Structure

```
┌─────────────────────────────────────────────────────────┐
│                    EMAIL TEMPLATE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              HEADER                             │    │
│  │  Background: #E6F2F8                           │    │
│  │  Color: #136C9E                                │    │
│  │  Text: "Tenant Invitation"                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              CONTENT                            │    │
│  │  • Greeting: "Hello,"                          │    │
│  │  • Invitation text                             │    │
│  │  • Property details card                       │    │
│  │    - Property address                          │    │
│  │  • Custom message (if provided)                │    │
│  │  • Call-to-action text                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          CALL-TO-ACTION BUTTON                  │    │
│  │  Background: Linear gradient                    │    │
│  │  Color: #DC5F12 → #FF6B1A                      │    │
│  │  Text: "Create Account & Complete Profile"     │    │
│  │  Link: https://proptii-frontend.onrender.com/  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              FOOTER                             │    │
│  │  • Proptii logo                                │    │
│  │  • Company description                         │    │
│  │  • "Best regards, The Proptii Team"           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Console Logging Timeline

```
Time    Log
──────────────────────────────────────────────────────────
0ms     🔍 Starting email send process...
        📧 Recipient: tenant@example.com
        🏠 Property: 123 Main Street
        ✅ Using VITE_API_URL: http://localhost:3000
        📡 API Endpoint: http://localhost:3000/api/email/send
        📝 Email generated successfully
        📨 Sending email request...

10ms    🔄 Attempt 1/3...

2000ms  [If failed] ❌ Attempt 1 failed: ECONNREFUSED
        ⏳ Waiting 2000ms before retry...

4000ms  🔄 Attempt 2/3...

6000ms  [If failed] ❌ Attempt 2 failed: ETIMEDOUT
        ⏳ Waiting 4000ms before retry...

10000ms 🔄 Attempt 3/3...

11000ms ✅ Email sent successfully!
        📬 Message ID: re_xxxxx...
        🎉 Invitation email sent successfully!
```

## Success Metrics

```
┌─────────────────────────────────────────────────────────┐
│                    Success Indicators                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User Experience:                                       │
│  ✅ Form validation prevents invalid submissions        │
│  ✅ Loading state shows during email sending            │
│  ✅ Success screen appears after sending                │
│  ✅ Auto-redirect after 3 seconds                       │
│  ✅ Clear error messages with troubleshooting           │
│                                                          │
│  Technical:                                              │
│  ✅ API request reaches backend successfully            │
│  ✅ Backend returns 200 OK status                       │
│  ✅ Message ID returned from email service              │
│  ✅ Console logs show success messages                  │
│  ✅ No console errors                                   │
│                                                          │
│  Email Delivery:                                         │
│  ✅ Email arrives in recipient's inbox                  │
│  ✅ Email contains all expected content                 │
│  ✅ Links work correctly                                │
│  ✅ Email is properly formatted                         │
│  ✅ Sender address is correct                           │
│                                                          │
│  Reliability:                                            │
│  ✅ Retry logic handles transient failures              │
│  ✅ Fallback to SMTP if Resend fails                    │
│  ✅ Timeout protection (45s)                            │
│  ✅ Graceful error handling                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated:** February 14, 2026
**Status:** ✅ Complete & Production-Ready
