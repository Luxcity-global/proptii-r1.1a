# Azure AD B2C Authentication Documentation

## Overview
This document provides comprehensive documentation for the Azure AD B2C authentication implementation in the Proptii application.

## Configuration Details

### Tenant Configuration
```
Tenant Details:
├── Name: proptii-identity
├── Resource Group: proptii-identity-rg
├── Location: East US 2
└── Domain: proptii.onmicrosoft.com
```

### User Flows
```
Implemented Flows:
├── Sign-up and Sign-in (B2C_1_SignUpandSignInProptii)
│   ├── Attributes Collected
│   │   ├── Email Address
│   │   ├── Given Name
│   │   └── Surname
│   └── Claims Returned
│       ├── User's Object ID
│       ├── Email Address
│       └── Display Name
│
├── Password Reset (B2C_1_passwordreset)
│   └── Requirements
│       ├── Complexity: Strong
│       ├── Length: 8 characters
│       └── Character types: 3
│
└── Profile Editing (B2C_1_profileediting)
    └── Editable Attributes
        ├── Display Name
        ├── Phone Number
        └── Address
```

### Application Registration
```
Application Details:
├── Name: Proptii Web Client
├── Client ID: 49f7bfc0-cab3-4c54-aa25-279cc788551f
├── Supported Account Types: B2C only
└── Platform Configuration
    ├── Type: Single-page application
    └── Redirect URIs
        ├── Development: http://localhost:5173
        ├── Staging: [staging URL]
        └── Production: https://black-wave-0bb98540f.azurestaticapps.net
```

## Implementation Guide

### Environment Configuration
1. Create appropriate `.env` file for your environment:
   ```env
   VITE_AZURE_AD_CLIENT_ID=49f7bfc0-cab3-4c54-aa25-279cc788551f
   VITE_AZURE_AD_TENANT_NAME=proptii.onmicrosoft.com
   VITE_AZURE_AD_POLICY_NAME=B2C_1_SignUpandSignInProptii
   ```

### Authentication Flow
1. User initiates authentication
2. MSAL handles the authentication flow
3. On success, user data is stored in AuthContext
4. Protected routes are automatically guarded

### Testing Implementation
```
Test Coverage:
├── Tenant Verification
│   ├── Domain setup verification
│   ├── Admin access verification
│   └── Basic operations testing
│
├── User Flow Testing
│   ├── Sign-up flow
│   ├── Password reset flow
│   └── Error handling
│
└── Application Testing
    ├── Token acquisition
    ├── Permission validation
    └── End-to-end flow testing
```

## Security Considerations

### Token Handling
- Tokens are stored in browser's localStorage
- Token refresh is handled automatically by MSAL
- Token validation is performed on both client and server

### Security Policies
```
Implemented Policies:
├── Password Requirements
│   ├── Minimum length: 8 characters
│   ├── Complexity: Required
│   └── History: Prevent reuse
│
├── Session Management
│   ├── Timeout: 60 minutes
│   ├── Refresh tokens: Enabled
│   └── Single sign-on: Enabled
│
└── Access Control
    ├── Role-based access
    ├── Scope validation
    └── API permission checks
```

## Troubleshooting Guide

### Common Issues
1. Redirect URI Mismatch
   - Verify URI in Azure Portal matches application
   - Check for exact match including protocol
   - Use provided script to register URI

2. Token Acquisition Failures
   - Check network connectivity
   - Verify client ID and authority
   - Ensure scopes are properly configured

3. User Flow Errors
   - Verify policy names match configuration
   - Check user attributes are properly mapped
   - Ensure required claims are included

## Monitoring & Maintenance

### Monitoring
```
Monitoring Points:
├── Authentication Metrics
│   ├── Success/failure rates
│   ├── Token acquisition times
│   └── User flow completion rates
│
├── Security Events
│   ├── Failed login attempts
│   ├── Password reset requests
│   └── Suspicious activities
│
└── Performance Metrics
    ├── Response times
    ├── Token refresh rates
    └── Error frequencies
```

### Maintenance Tasks
1. Regular review of security policies
2. Monitor and update dependencies
3. Review and update user flows as needed
4. Maintain documentation accuracy

## Contact Information
- Azure AD B2C Support: [Contact Details]
- Security Team Lead: [Contact Details]
- Project Manager: [Contact Details] 