# Contract Email Service Configuration

This document explains how to configure the email service for sending signed contracts to recipients.

## Required Environment Variables

The following environment variables must be set in your backend environment:

```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=noreply@proptii.com
```

## Email Provider Examples

### Gmail SMTP
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
```

**Note:** For Gmail, you need to use an App Password, not your regular password.

### Outlook/Hotmail SMTP
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

### SendGrid SMTP
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@proptii.com
```

### Mailgun SMTP
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM_EMAIL=noreply@proptii.com
```

## How It Works

1. **Contract Signing**: When a user signs a contract in the DocumentSigningViewer component
2. **PDF Generation**: The signed PDF is generated with embedded signatures
3. **Email Sending**: The system automatically sends the signed contract as a PDF attachment to the recipient
4. **Email Template**: A professional HTML email template is used with contract details and instructions

## Features

- ✅ Professional HTML email templates
- ✅ PDF attachment support
- ✅ Multiple recipient support
- ✅ Error handling and logging
- ✅ SMTP connection verification
- ✅ Branded email design with Proptii colors

## Testing

To test the email functionality:

1. Set up your SMTP credentials in the environment variables
2. Sign a contract in the application
3. Check the recipient's email for the signed contract
4. Monitor the backend logs for email sending status

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Verify your SMTP credentials
   - Check if you need to use an App Password (Gmail)
   - Ensure your email provider allows SMTP access

2. **Connection Timeout**
   - Check your SMTP_HOST and SMTP_PORT settings
   - Verify firewall settings allow outbound SMTP connections

3. **Email Not Received**
   - Check spam/junk folders
   - Verify the recipient email address is correct
   - Check backend logs for error messages

### Debug Mode

Enable debug logging by setting the log level to 'debug' in your backend configuration to see detailed SMTP communication logs.
