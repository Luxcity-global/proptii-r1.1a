/**
 * Development Environment Configuration
 * Generated on: 2025-05-07T22:55:12.165Z
 */

export const developmentConfig = {
  "api": {
    "baseUrl": (import.meta as any)?.env?.VITE_API_BASE_URL || (import.meta as any)?.env?.VITE_API_URL || '',
    "version": "v1"
  },
  "azure": {
    "ad": {
      "clientId": (import.meta as any)?.env?.VITE_AZURE_AD_CLIENT_ID || "",
      "tenantName": (import.meta as any)?.env?.VITE_AZURE_AD_TENANT_NAME || "",
      "policyName": (import.meta as any)?.env?.VITE_AZURE_AD_POLICY_NAME || ""
    },
    "storage": {
      "url": (import.meta as any)?.env?.VITE_AZURE_STORAGE_URL || (import.meta as any)?.env?.VITE_APP_URL || ""
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
