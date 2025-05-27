# Azure Resources Documentation

## Overview
This document tracks all Azure resources, credentials, and configurations used in the Proptii application. Last updated: April 25, 2024

## Active Resources

### 1. Authentication (Azure AD B2C)
- **Status**: Active ✅
- **Configuration**:
  - Tenant Name: [SECURE - Check Azure Portal]
  - Client ID: Uses MSAL configuration
  - Authority: Uses MSAL authority
  - Known Authorities: Configured in Azure AD B2C
  - Redirect URIs:
    - Development: http://localhost:5173, http://localhost:3000/auth/callback
    - Production: [TO BE CONFIGURED]
- **Environment Variables**:
  ```env
  # Frontend
  VITE_AZURE_AD_B2C_CLIENT_ID=your-msal-client-id
  VITE_AZURE_AD_B2C_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
  VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=yourtenant.b2clogin.com
  VITE_AZURE_AD_B2C_REDIRECT_URI=http://localhost:5173
  VITE_AZURE_AD_B2C_SCOPES=openid profile email

  # Backend
  MSAL_CLIENT_ID=your-msal-client-id
  MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
  MSAL_REDIRECT_URI=http://localhost:3000/auth/callback
  ```

### 2. Storage (Azure Blob Storage)
- **Status**: Active ✅
- **Configuration**:
  - Account Name: Configured via environment variables
  - Container Name: 'documents' (default)
  - SAS Token: Required for access
  - Base URL Pattern: `https://{accountName}.blob.core.windows.net/{containerName}`
- **Environment Variables**:
  ```env
  VITE_AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
  VITE_AZURE_STORAGE_CONTAINER_NAME=documents
  VITE_AZURE_STORAGE_SAS_TOKEN=your-sas-token
  ```

### 3. Database (Azure SQL)
- **Status**: Active ✅
- **Configuration**:
  - Server: Configured via environment variables
  - Database Name: Configured via environment variables
  - Connection: Using connection pooling
  - Security: Firewall rules required
- **Environment Variables**:
  ```env
  VITE_AZURE_SQL_SERVER=your-server.database.windows.net
  VITE_AZURE_SQL_DATABASE=your-database
  VITE_AZURE_SQL_USERNAME=your-username
  VITE_AZURE_SQL_PASSWORD=your-password
  ```

### 4. AI Services (Azure OpenAI)
- **Status**: Active ✅
- **Configuration**:
  - API Key: Required for service access
  - Endpoint: Full service endpoint
  - Deployment: Named deployment required
- **Environment Variables**:
  ```env
  VITE_AZURE_OPENAI_API_KEY=your-api-key
  VITE_AZURE_OPENAI_ENDPOINT=your-endpoint
  VITE_AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
  ```

## Required New Resources

### 1. Azure Static Web Apps
- **Status**: To Be Created 🔄
- **Purpose**: Host the React frontend application
- **Required Configuration**:
  - GitHub repository connection
  - Build configuration:
    - App location: "/"
    - API location: "api"
    - Output location: "dist"
  - Custom domain setup
- **Environment Variables**:
  ```env
  VITE_AZURE_STATIC_WEBAPP_URL=
  ```

### 2. Azure Functions
- **Status**: To Be Created 🔄
- **Purpose**: Serverless backend API
- **Required Configuration**:
  - Runtime stack: Node.js 18
  - Function app name: proptii-api
  - Region: Same as other resources
  - Integration with Static Web Apps
- **Environment Variables**:
  ```env
  VITE_AZURE_FUNCTIONS_URL=
  ```

### 3. Azure CDN
- **Status**: To Be Created 🔄
- **Purpose**: Content delivery and optimization
- **Required Configuration**:
  - CDN profile: Standard tier
  - Endpoint configuration: Static Web Apps integration
  - Rules setup: Cache optimization
- **Environment Variables**:
  ```env
  VITE_AZURE_CDN_ENDPOINT=
  ```

## Resource Groups
- Primary: proptii-production-rg [To be created]
- Region: [Based on target market]
- Subscription: [Azure subscription with credits]

## Access Management
- **Admin Access**: [Project Admin Contact]
- **Subscription Admin**: [Azure Subscription Admin]
- **Resource Managers**: [Development Team]

## Verification Checklist

### Immediate Actions
- [ ] Verify Azure AD B2C configuration
- [ ] Test storage access
- [ ] Validate SQL Database connection
- [ ] Check OpenAI service status
- [ ] Document all active resource URLs

### Resource Audit
- [ ] List all active resources in Azure Portal
- [ ] Document resource groups
- [ ] Note any unused resources
- [ ] Check resource locations
- [ ] Verify resource dependencies

### Access Verification
- [ ] Verify admin access to Azure Portal
- [ ] Check subscription status
- [ ] Validate resource permissions
- [ ] Document role assignments
- [ ] Test service principal access

## Security Notes
1. Never commit credentials to version control
2. Use Key Vault for sensitive information
3. Rotate access keys regularly
4. Monitor resource access logs
5. Implement least-privilege access

## Cost Management
- Current Subscription: [Subscription Type]
- Credits Available: [Amount]
- Budget Alerts: [Configured/Not Configured]

## Backup & Recovery
- SQL Database: [Backup Schedule]
- Storage Account: [Redundancy Level]
- Key Vault: [Backup Status]

## Monitoring & Logging
- Application Insights: [Status]
- Log Analytics: [Workspace]
- Alert Rules: [Configured/Not Configured]

## Support & Escalation
- Azure Support Plan: [Plan Level]
- Primary Contact: [Name/Email]
- Escalation Path: [Process]

---

**Note**: This is a living document. Update it whenever resources or configurations change. 