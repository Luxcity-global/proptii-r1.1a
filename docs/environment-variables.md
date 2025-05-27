# Environment Variables Documentation

## Required Environment Variables

### API Configuration
- `VITE_API_URL`
  - Development: http://localhost:3002
  - Staging: https://api-staging.proptii.com
  - Production: https://api.proptii.com
  - Description: Base URL for API endpoints

### Authentication
- `VITE_AZURE_AD_CLIENT_ID`
  - Format: UUID string
  - Description: Azure AD B2C client identifier
  - Required for: All environments

### Storage
- `VITE_AZURE_STORAGE_URL`
  - Format: URL string
  - Development: https://black-wave-0bb98540f.azurestaticapps.net
  - Staging: [Staging URL]
  - Production: [Production URL]
  - Description: Azure Storage account URL for static assets

## Environment Setup

### Development
```env
VITE_API_URL=http://localhost:3002
VITE_AZURE_AD_CLIENT_ID=e221eddb-ad9f-47d3-9b64-c4b2ed273aaf
VITE_AZURE_STORAGE_URL=https://black-wave-0bb98540f.azurestaticapps.net
```

### Staging
```env
VITE_API_URL=https://api-staging.proptii.com
VITE_AZURE_AD_CLIENT_ID=[STAGING_CLIENT_ID]
VITE_AZURE_STORAGE_URL=[STAGING_STORAGE_URL]
```

### Production
```env
VITE_API_URL=https://api.proptii.com
VITE_AZURE_AD_CLIENT_ID=[PRODUCTION_CLIENT_ID]
VITE_AZURE_STORAGE_URL=[PRODUCTION_STORAGE_URL]
```

## Environment Variable Validation

The application validates environment variables in the following ways:

1. During build time through Vite's `loadEnv` utility
2. Through TypeScript type checking for environment variables
3. Through runtime validation when the application starts

## Adding New Environment Variables

When adding new environment variables:

1. Add the variable to all relevant .env files
2. Update the environment variable documentation
3. Update the TypeScript types in `src/types/env.d.ts`
4. Add validation in the application startup 