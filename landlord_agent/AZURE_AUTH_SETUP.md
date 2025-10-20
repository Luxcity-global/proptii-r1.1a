# Azure AD Authentication Setup Guide

## Overview
Your landlord agent management application now has Azure AD authentication integrated. This allows users to sign in with their Microsoft accounts and seamlessly transfer authentication from external Azure AD environments.

## What's Been Implemented

### 1. Authentication Infrastructure
- **Azure MSAL Integration**: Using Microsoft Authentication Library (MSAL) for React
- **Protected Routes**: All application routes are now protected by authentication
- **User Context**: Azure AD user data is automatically converted to your existing UserProfile format
- **Login/Logout Components**: Clean UI components for authentication flows

### 2. Files Created/Modified
- `src/config/azureConfig.ts` - Azure AD configuration
- `src/contexts/AuthContext.tsx` - Authentication context and user management
- `src/providers/AuthProviders.tsx` - MSAL provider wrapper
- `src/components/auth/LoginScreen.tsx` - Login interface
- `src/components/auth/LogoutButton.tsx` - Logout functionality
- `src/components/auth/ProtectedRoute.tsx` - Route protection
- `src/App.tsx` - Updated to use authentication
- `src/components/MainLayout.tsx` - Added logout button
- `env.example` - Environment configuration template

## Setup Instructions

### 1. Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in:
   - **Name**: "Landlord Agent Management"
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: 
     - Development: `http://localhost:5173`
     - Production: `https://your-domain.com`

### 2. Configure Authentication
1. In your app registration, go to "Authentication"
2. Add platform: "Single-page application (SPA)"
3. Add redirect URIs:
   - `http://localhost:5173` (development)
   - `https://your-production-domain.com` (production)
4. Enable "Access tokens" and "ID tokens"

### 3. API Permissions
1. Go to "API permissions"
2. Add Microsoft Graph permissions:
   - `User.Read` (for basic profile info)
   - `email` (for email address)
   - `profile` (for profile information)
   - `openid` (for OpenID Connect)

### 4. Environment Configuration
1. Copy `env.example` to `.env`
2. Fill in your Azure AD details:

```env
# Development Environment
REACT_APP_AZURE_CLIENT_ID_DEV=your-client-id-from-azure
REACT_APP_AZURE_AUTHORITY_DEV=https://login.microsoftonline.com/your-tenant-id
REACT_APP_AZURE_REDIRECT_URI_DEV=http://localhost:5173

# Production Environment  
REACT_APP_AZURE_CLIENT_ID_PROD=your-production-client-id
REACT_APP_AZURE_AUTHORITY_PROD=https://login.microsoftonline.com/your-tenant-id
REACT_APP_AZURE_REDIRECT_URI_PROD=https://your-production-domain.com

# Fallback Configuration
REACT_APP_AZURE_CLIENT_ID=your-client-id-here
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:5173
REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
```

### 5. Get Your Azure AD Details
From your Azure app registration:
- **Client ID**: Found in "Overview" section
- **Tenant ID**: Found in "Overview" section
- **Authority**: `https://login.microsoftonline.com/{tenant-id}`

## How It Works

### Authentication Flow
1. **User visits app** → Redirected to login screen if not authenticated
2. **User clicks "Sign in with Microsoft"** → Azure AD popup opens
3. **User authenticates** → Azure returns user data and tokens
4. **App converts Azure user** → Maps to your existing UserProfile format
5. **User accesses app** → Full access to landlord management features

### User Data Integration
- Azure AD user data is automatically mapped to your existing `UserProfile` interface
- User name, email, and profile photo are extracted from Microsoft Graph
- Existing app functionality remains unchanged
- User can still set role (landlord/agent) and company profile

### Security Features
- **Protected Routes**: All app screens require authentication
- **Token Management**: Automatic token refresh and management
- **Secure Logout**: Complete session cleanup
- **Environment Separation**: Different configs for dev/prod

## Transferring from External Azure Site

### For Existing Azure AD Users
If you have users already authenticated in another Azure AD application:

1. **Same Tenant**: Users can immediately access your app with their existing credentials
2. **Different Tenant**: You can:
   - Set up B2B collaboration between tenants
   - Use Azure AD External Identities
   - Migrate users to your tenant

### Migration Options
1. **User Migration**: Use Microsoft Graph API to migrate user accounts
2. **Federation**: Set up federation between Azure AD tenants
3. **Guest Users**: Invite external users as guests in your tenant

## Testing

### Development
```bash
npm run dev
```
- Visit `http://localhost:5173`
- Should see login screen
- Click "Sign in with Microsoft"
- Complete authentication flow

### Production
1. Deploy with production environment variables
2. Update Azure AD redirect URIs to match your domain
3. Test authentication flow

## Troubleshooting

### Common Issues
1. **Redirect URI Mismatch**: Ensure URIs in Azure AD match your environment variables
2. **CORS Issues**: Make sure your domain is added to Azure AD redirect URIs
3. **Token Errors**: Check API permissions in Azure AD
4. **User Not Found**: Verify tenant ID and user permissions

### Debug Mode
The app includes detailed logging. Check browser console for authentication flow details.

## Next Steps

1. **Set up Azure AD app registration**
2. **Configure environment variables**
3. **Test authentication flow**
4. **Deploy to production**
5. **Configure user roles and permissions**

Your application now supports Azure AD authentication and can seamlessly transfer users from external Azure AD environments!
