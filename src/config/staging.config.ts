/**
 * Staging Environment Configuration
 * Generated on: 2025-05-07T22:55:12.168Z
 */

export const stagingConfig = {
  "api": {
    "baseUrl": "https://api-staging.proptii.com",
    "version": "v1"
  },
  "azure": {
    "ad": {
      "clientId": "",
      "tenantName": "proptii.onmicrosoft.com",
      "policyName": "B2C_1_SignUpandSignInProptii"
    },
    "storage": {
      "url": "https://proptii-staging.azurestaticapps.net"
    }
  },
  "features": {
    "debugLogging": true,
    "detailedErrors": false,
    "betaFeatures": true,
    "performanceMonitoring": true,
    "errorReporting": true,
    "maintenanceMode": false,
    "securityHeaders": true,
    "caching": true
  }
} as const;

export type StagingConfig = typeof stagingConfig;
