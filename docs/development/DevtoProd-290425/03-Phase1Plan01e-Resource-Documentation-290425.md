# Azure Static Web App Resource Documentation

## Resource Information

### Static Web App
- **Resource Name**: proptii-static-web-app
- **Resource Group**: proptii-rg-eastus2
- **Region**: East US 2
- **SKU**: Standard
- **Subscription**: [To be filled with actual subscription ID]

## Configuration Details

### Build Configuration
```json
{
  "app_location": "/",
  "api_location": "proptii-backend",
  "output_location": "dist"
}
```

### Environment Settings
- **Development**: [URL to be filled]
- **Staging**: [URL to be filled]
- **Production**: [URL to be filled]

### GitHub Integration
- **Repository**: proptii-r1.1a-2
- **Branch**: main
- **Action**: Azure Static Web Apps CI/CD

## Access Requirements

### Azure Portal Access
- **Required Role**: Contributor or higher
- **Resource Group Access**: proptii-rg-eastus2
- **Subscription Access**: Required

### GitHub Access
- **Repository Access**: Admin or Write permissions
- **GitHub Actions**: Workflow permissions
- **Branch Protection**: Configured for main branch

### Local Development
- **Required Tools**:
  - Node.js (as specified in package.json)
  - Azure CLI
  - Git

## Environment Variables
Required environment variables as documented in `.env` files:
- VITE_API_URL
- VITE_AZURE_AD_CLIENT_ID
- VITE_AZURE_STORAGE_URL

## Monitoring & Metrics
- **Application Insights**: [To be configured]
- **Logs**: Available in Azure Portal
- **Metrics Dashboard**: [To be configured]

## Security Configuration
- **Authentication Provider**: Azure AD B2C
- **SSL/TLS**: Enabled by default
- **Custom Domains**: [To be configured]

## Build Process Integration
The build process is verified using the script at `scripts/verify-build-process.js` which checks:
- Build outputs
- Environment configurations
- Deployment slots

## Additional Notes
1. All configuration changes should be documented and version controlled
2. Environment-specific settings should be updated through Azure Portal
3. Any custom domain configurations should be documented here
4. Performance metrics and monitoring setup should be updated regularly

## Contact Information
- **Azure Support**: [To be filled]
- **DevOps Lead**: [To be filled]
- **Project Manager**: [To be filled] 