/**
 * Development Environment Configuration
 * Generated on: 2025-05-07T22:55:12.165Z
 */

export const developmentConfig = {
  "api": {
    "baseUrl": "http://localhost:3002",
    "version": "v1"
  },
  "azure": {
    "ad": {
      "clientId": "",
      "tenantName": "proptii.onmicrosoft.com",
      "policyName": "B2C_1_SignUpandSignInProptii"
    },
    "storage": {
      "url": "http://localhost:5173"
    }
  },
  "features": {
    "debugLogging": true,
    "detailedErrors": true,
    "betaFeatures": true,
    "performanceMonitoring": false,
    "errorReporting": false,
    "maintenanceMode": false,
    "securityHeaders": false,
    "caching": false
  }
} as const;

export type DevelopmentConfig = typeof developmentConfig;
