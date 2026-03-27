# DocuSign Integration Setup Guide

This guide will help you set up real DocuSign integration for the Proptii application.

## Prerequisites

1. A DocuSign Developer Account (free at https://developers.docusign.com/)
2. Node.js and npm installed
3. Access to the project files

## Step 1: Create DocuSign Developer Account

1. Go to https://developers.docusign.com/
2. Sign up for a free developer account
3. Verify your email address

## Step 2: Create an Integration Key

1. Log into your DocuSign Developer Account
2. Go to "Admin" → "Integration" → "Keys"
3. Click "Add Integration Key"
4. Name your integration key (e.g., "Proptii Integration")
5. Select "JWT Grant" as the authentication method
6. Save the Integration Key (you'll need this later)

## Step 3: Generate RSA Key Pair

1. In your DocuSign Developer Account, go to "Admin" → "Integration" → "Keys"
2. Find your integration key and click "Actions" → "Generate RSA Key Pair"
3. Download the private key file (keep this secure!)
4. Copy the public key and add it to your integration key

## Step 4: Get Your Account Information

1. Go to "Admin" → "Account" → "Account Information"
2. Note down:
   - Account ID
   - User ID (your email address)
   - Base URL (use https://demo.docusign.net for testing)

## Step 5: Configure Environment Variables

### Frontend Configuration (.env.local)

Create a `.env.local` file in the project root with the following variables:

```env
# DocuSign Configuration
VITE_DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
VITE_DOCUSIGN_USER_ID=your_user_id_here
VITE_DOCUSIGN_ACCOUNT_ID=your_account_id_here
VITE_DOCUSIGN_BASE_URL=https://demo.docusign.net
VITE_DOCUSIGN_RSA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
VITE_DOCUSIGN_REDIRECT_URI=http://localhost:5173/docusign/callback

# Backend API URL
VITE_API_URL=http://localhost:7071/api
```

### Backend Configuration (api/local.settings.json)

Update the `api/local.settings.json` file:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "DOCUSIGN_INTEGRATION_KEY": "your_integration_key_here",
    "DOCUSIGN_USER_ID": "your_user_id_here",
    "DOCUSIGN_ACCOUNT_ID": "your_account_id_here",
    "DOCUSIGN_BASE_URL": "https://demo.docusign.net",
    "DOCUSIGN_RSA_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
  }
}
```

## Step 6: Format Your Private Key

The private key needs to be properly formatted. Replace the placeholder with your actual private key:

1. Open the private key file you downloaded
2. Copy the entire content including the BEGIN and END lines
3. Replace all newlines with `\n`
4. Paste it into both configuration files

Example:
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----
```

## Step 7: Test the Integration

### Start the Backend Server

```bash
cd api
npm start
```

### Start the Frontend

```bash
npm run dev
```

### Test DocuSign Integration

1. Open the application in your browser
2. Go to the Contract Management section
3. Upload a document (PDF or DOCX)
4. Click "Customize" on a template
5. The DocuSign editor should load with real DocuSign functionality

## Step 8: Verify Integration

### Test Script

Run the test script to verify everything is working:

```bash
node test-docusign-integration.js
```

Expected output:
```
Testing DocuSign Integration...

1. Testing backend connectivity...
✅ Backend is running

2. Testing DocuSign endpoint...
✅ DocuSign endpoint is responding

3. Testing envelope creation...
✅ Envelope creation endpoint is responding
```

## Troubleshooting

### Common Issues

1. **"Missing required DocuSign configuration"**
   - Check that all environment variables are set correctly
   - Verify the private key is properly formatted with `\n` characters

2. **"Failed to get access token"**
   - Verify your Integration Key, User ID, and Account ID are correct
   - Ensure the RSA public key is added to your integration key in DocuSign
   - Check that you're using the correct base URL (demo vs production)

3. **"Failed to create envelope"**
   - Verify your account has the necessary permissions
   - Check that the document format is supported
   - Ensure recipient email addresses are valid

4. **CORS Errors**
   - The backend is configured to handle CORS automatically
   - If you see CORS errors, check that the backend is running on the correct port

### Debug Mode

To enable debug logging, add this to your environment variables:

```env
DEBUG=true
```

### Mock Mode

If you want to test without real DocuSign credentials, the application will automatically fall back to mock mode when configuration is incomplete.

## Production Deployment

For production deployment:

1. Use the production DocuSign base URL: `https://www.docusign.net`
2. Ensure all environment variables are set in your production environment
3. Use a production RSA key pair
4. Update the redirect URI to your production domain
5. Configure proper CORS settings for your production domain

## Security Notes

1. **Never commit your private key to version control**
2. **Use environment variables for all sensitive configuration**
3. **Rotate your RSA key pair regularly**
4. **Monitor your DocuSign API usage**
5. **Implement proper error handling and logging**

## Support

If you encounter issues:

1. Check the DocuSign Developer Documentation: https://developers.docusign.com/
2. Review the application logs for detailed error messages
3. Verify your DocuSign account permissions and settings
4. Test with the DocuSign Postman collection for API validation

## Next Steps

Once the basic integration is working:

1. Implement document templates
2. Add recipient management
3. Configure signature fields
4. Set up webhooks for status updates
5. Add audit logging
6. Implement envelope tracking 