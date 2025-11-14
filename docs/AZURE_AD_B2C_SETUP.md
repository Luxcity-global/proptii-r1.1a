# Azure AD B2C Integration Setup Guide

## Overview
This guide explains how to set up Azure AD B2C integration to fetch users from your Azure AD B2C directory for tenant selection.

## Prerequisites
1. Azure AD B2C tenant configured
2. App Registration in Azure AD B2C
3. Access to Azure Portal to configure permissions

## Step 1: Create App Registration (if not exists)

1. Go to Azure Portal → Azure AD B2C → App registrations
2. Create a new app registration (or use existing "Proptii Web Client")
3. Note the **Application (client) ID** and **Directory (tenant) ID**

## Step 2: Create Client Secret

1. In your App Registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Backend API Access")
4. Set expiration (recommend 24 months)
5. **Copy the secret value immediately** (you won't be able to see it again)

## Step 3: Configure API Permissions

1. In your App Registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions** (not Delegated)
5. Add the following permissions:
   - `User.Read.All` - Read all users' full profiles
   - OR `Directory.Read.All` - Read directory data (broader access)
6. Click **Add permissions**
7. **Important**: Click **Grant admin consent** for your organization

## Step 4: Configure Environment Variables

Add the following environment variables to your backend `.env` file (in `proptii-backend/` or `server/`):

```env
# Azure AD B2C Configuration for Backend API
AZURE_AD_B2C_CLIENT_ID=your-client-id-here
AZURE_AD_B2C_CLIENT_SECRET=your-client-secret-here
AZURE_AD_B2C_TENANT_ID=your-tenant-id-here
```

### Where to find these values:

- **AZURE_AD_B2C_CLIENT_ID**: 
  - Azure Portal → Azure AD B2C → App registrations → Your app → Overview → Application (client) ID
  - Example: `49f7bfc0-cab3-4c54-aa25-279cc788551f`

- **AZURE_AD_B2C_TENANT_ID**:
  - Azure Portal → Azure AD B2C → Overview → Tenant ID
  - Example: `12345678-1234-1234-1234-123456789012`

- **AZURE_AD_B2C_CLIENT_SECRET**:
  - Azure Portal → Azure AD B2C → App registrations → Your app → Certificates & secrets → Value (copy immediately)

## Step 5: Verify Configuration

1. Restart your backend server
2. Test the endpoint: `GET http://localhost:10000/api/azure-users`
3. You should receive a list of users from Azure AD B2C

## API Endpoint

### GET /api/azure-users

Fetches all users from Azure AD B2C.

**Query Parameters:**
- `search` (optional): Search term to filter users by name or email

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "givenName": "John",
      "surname": "Doe",
      "azureObjectId": "azure-object-id",
      "userPrincipalName": "john@example.com"
    }
  ],
  "count": 1
}
```

## Troubleshooting

### Error: "Azure AD B2C is not configured"
- Check that all three environment variables are set
- Verify the values are correct (no extra spaces)

### Error: "Failed to acquire access token"
- Verify client secret hasn't expired
- Check that client ID and tenant ID are correct
- Ensure app registration exists in Azure AD B2C (not regular Azure AD)

### Error: "Microsoft Graph API error: 403"
- Verify API permissions are granted
- Ensure **Grant admin consent** was clicked
- Check that `User.Read.All` or `Directory.Read.All` permission is added

### Error: "Insufficient privileges to complete the operation"
- The app registration needs **Application permissions** (not Delegated)
- Admin consent must be granted

## Security Notes

1. **Never commit `.env` files** to version control
2. **Rotate client secrets** regularly (every 6-12 months)
3. **Use environment-specific secrets** for dev/staging/production
4. **Monitor API usage** in Azure Portal for unusual activity

## Next Steps

After configuration:
1. The frontend will automatically fetch users from Azure AD B2C
2. Landlords can select users and assign them as tenants
3. Selected users are synced to Firestore as tenant records

