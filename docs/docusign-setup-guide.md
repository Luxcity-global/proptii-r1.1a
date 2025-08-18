# DocuSign Integration Setup Guide

## Prerequisites
- DocuSign Developer Account (already completed)
- Node.js application with React frontend

## Step 1: Get DocuSign Credentials

### 1.1 Access Your DocuSign Developer Account
1. Go to [DocuSign Developer Portal](https://developers.docusign.com/)
2. Sign in with your developer account
3. Navigate to "My Apps & Keys"

### 1.2 Create a New Integration Key
1. Click "Add App & Integration Key"
2. Choose "Web Application" as the integration type
3. Give it a name (e.g., "Proptii Contract Management")
4. Note down the **Integration Key** (Client ID)

### 1.3 Generate RSA Key Pair
1. In your app settings, go to "Authentication" tab
2. Under "RSA Key Pair", click "Generate RSA Key Pair"
3. Download the private key file
4. Copy the **Public Key** (you'll need this for JWT authentication)

### 1.4 Get Account ID
1. Go to "My Account" in DocuSign Developer Portal
2. Note down your **Account ID** (found in the account information)

### 1.5 Get Base URL
- **Demo Environment**: `https://demo.docusign.net`
- **Production Environment**: `https://www.docusign.net`

## Step 2: Environment Variables

Create a `.env.local` file in the **root directory** of your project and add these variables:

```env
# DocuSign Configuration
VITE_DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
VITE_DOCUSIGN_USER_ID=your_user_id_here
VITE_DOCUSIGN_ACCOUNT_ID=your_account_id_here
VITE_DOCUSIGN_BASE_URL=https://demo.docusign.net
VITE_DOCUSIGN_PRIVATE_KEY_PATH=path_to_your_private_key.pem
VITE_DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

## Step 3: Install Required Packages

```bash
npm install docusign-esign @types/docusign-esign
```

## Step 4: Configure DocuSign App Settings

### 4.1 Add Redirect URIs
1. In your DocuSign app settings, go to "Authentication"
2. Add these redirect URIs:
   - `http://localhost:3000/docusign/callback`
   - `http://localhost:3000/docusign/return`
   - `https://yourdomain.com/docusign/callback` (for production)
   - `https://yourdomain.com/docusign/return` (for production)

### 4.2 Enable Features
1. Enable "Implicit Grant" for embedded signing
2. Enable "Authorization Code Grant" for server-side operations
3. Enable "JWT Grant" for server-to-server authentication

## Step 5: Implementation Steps

1. **Backend Setup**: Create DocuSign service for authentication and envelope creation
2. **Frontend Integration**: Replace current editor with DocuSign embedded signing
3. **Document Processing**: Convert uploaded documents to DocuSign format
4. **Signature Management**: Handle signature placement and completion

## Step 6: Environment File Setup

1. **Copy Template**: Copy `docs/templates/env/docusign.env.template` to `.env.local` in the root directory
2. **Fill Credentials**: Replace placeholder values with your actual DocuSign credentials
3. **Security**: Ensure `.env.local` is in your `.gitignore` file (it should be already)
4. **Restart**: Restart your development server after adding the environment variables

## Step 7: Testing

1. Use DocuSign's demo environment for testing
2. Test with sample documents
3. Verify signature placement and completion
4. Test in production environment

## Security Notes

- Never commit private keys to version control
- Use environment variables for all sensitive data
- Implement proper error handling
- Add logging for debugging
- Follow DocuSign's security best practices

## Next Steps

After completing this setup, proceed to the implementation files:
- `src/services/docusignService.ts` - Backend DocuSign service
- `src/components/contract/DocuSignEditor.tsx` - Frontend DocuSign component
- `src/config/docusign.ts` - DocuSign configuration 