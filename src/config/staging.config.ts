/**
 * Staging Environment Configuration
 * Generated on: 2025-05-07T22:55:12.168Z
 */

export const stagingConfig = {
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
