/**
 * Production Environment Configuration
 * Generated on: 2025-05-07T22:55:12.175Z
 */

export const productionConfig = {
  "api": {
    "baseUrl": "https://api.proptii.com",
    "version": "v1"
  },
  "azure": {
    "ad": {
      "clientId": "",
      "tenantName": "proptii.onmicrosoft.com",
      "policyName": "B2C_1_SignUpandSignInProptii"
    },
    "storage": {
      "url": "https://proptii.azurestaticapps.net"
    }
  },
  "features": {
    "debugLogging": false,
    "detailedErrors": false,
    "betaFeatures": false,
    "performanceMonitoring": true,
    "errorReporting": true,
    "maintenanceMode": false,
    "securityHeaders": true,
    "caching": true
  }
} as const;

export type ProductionConfig = typeof productionConfig;
