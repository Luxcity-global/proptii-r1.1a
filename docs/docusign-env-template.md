# DocuSign Environment Variables Template

Add these variables to your `.env.local` file:

```env
# DocuSign Configuration
VITE_DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
VITE_DOCUSIGN_USER_ID=your_user_id_here
VITE_DOCUSIGN_ACCOUNT_ID=your_account_id_here
VITE_DOCUSIGN_BASE_URL=https://demo.docusign.net
VITE_DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
VITE_DOCUSIGN_REDIRECT_URI=http://localhost:3000/docusign/callback
```

## How to get these values:

1. **VITE_DOCUSIGN_INTEGRATION_KEY**: Your Integration Key from DocuSign Developer Portal
2. **VITE_DOCUSIGN_USER_ID**: Your User ID from DocuSign Developer Portal
3. **VITE_DOCUSIGN_ACCOUNT_ID**: Your Account ID from DocuSign Developer Portal
4. **VITE_DOCUSIGN_BASE_URL**: Use `https://demo.docusign.net` for testing, `https://www.docusign.net` for production
5. **VITE_DOCUSIGN_RSA_PRIVATE_KEY**: Your RSA private key (the entire key including BEGIN and END markers)
6. **VITE_DOCUSIGN_REDIRECT_URI**: Your callback URL (use localhost for development)

## Important Notes:

- Never commit your actual private key to version control
- Use the demo environment for testing
- Make sure your redirect URI matches what you configured in DocuSign Developer Portal
- The RSA private key should be the complete key including the header and footer 