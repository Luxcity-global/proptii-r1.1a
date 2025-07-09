# Environment Setup Guide

This guide provides instructions for setting up the environment variables required for the application to connect to Azure services.

## Overview

The application uses environment variables to configure connections to:
- Azure SQL Database
- Azure Storage Account
- Azure API
- Azure AD B2C (for authentication)

## Setting Up Environment Variables

### 1. Create Environment File

1. Copy the template file to create your local environment file:
   ```bash
   cp .env.template .env.local
   ```

2. Open the `.env.local` file in your editor.

### 2. Configure API URL

Set the API base URL:
```
VITE_API_BASE_URL=https://your-api-url.azurewebsites.net/api
```

### 3. Configure Azure Storage

To configure Azure Storage for document uploads:

1. In the Azure Portal, navigate to your Storage Account
2. Get the Storage Account name
3. Create a container named "documents" (or your preferred name)
4. Generate a SAS token with read, write, delete, and list permissions

Then update the following variables:
```
VITE_AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
VITE_AZURE_STORAGE_CONTAINER_NAME=documents
VITE_AZURE_STORAGE_SAS_TOKEN=?sv=2020-08-04&ss=...
```

### 4. Configure Azure AD B2C (Optional)

If you're using Azure AD B2C for authentication:

1. In the Azure Portal, navigate to your Azure AD B2C tenant
2. Register your application
3. Configure user flows for sign-up and sign-in
4. Get the client ID and authority URLs

Then update the following variables:
```
VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
VITE_AZURE_AD_B2C_AUTHORITY=https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signin
VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=yourtenant.b2clogin.com
VITE_AZURE_AD_B2C_REDIRECT_URI=http://localhost:5173
VITE_AZURE_AD_B2C_SCOPES="openid profile email"
```

## Environment Variables for Different Environments

### Development Environment

For local development, you can use the `.env.local` file as described above.

### Production Environment

For production deployment, you should set these environment variables in your hosting platform:

- If using Azure App Service:
  1. Go to your App Service in the Azure Portal
  2. Navigate to "Configuration" > "Application settings"
  3. Add each environment variable as a new application setting

- If using other hosting platforms:
  Follow their documentation for setting environment variables.

## Testing Your Configuration

After setting up the environment variables:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test the following functionality:
   - File uploads (to verify Azure Storage connection)
   - Form submissions (to verify API connection)
   - Authentication (if configured)

## Troubleshooting

### Storage Issues

If you encounter issues with file uploads:
- Verify your Storage Account name is correct
- Check that your SAS token has the necessary permissions
- Ensure the container exists in your Storage Account
- Check for CORS issues in browser developer tools

### API Connection Issues

If you encounter issues connecting to the API:
- Verify the API URL is correct
- Check that the API is running and accessible
- Verify network connectivity between your application and the API

### Authentication Issues

If you encounter authentication issues:
- Verify your Azure AD B2C configuration
- Check that the redirect URI matches your application URL
- Ensure the scopes are configured correctly 