/**
 * Azure Configuration
 * 
 * This file contains configuration settings for connecting to Azure services.
 * The values are loaded from environment variables.
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

// Check if we're in development mode
export const isDevelopment = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Azure Storage Account configuration
export const AZURE_STORAGE = {
  accountName: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || '',
  containerName: import.meta.env.VITE_AZURE_STORAGE_CONTAINER_NAME || 'documents',
  sasToken: import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN || '',
};

// Azure SQL Database configuration
export const AZURE_SQL = {
  server: import.meta.env.VITE_AZURE_SQL_SERVER || '',
  database: import.meta.env.VITE_AZURE_SQL_DATABASE || '',
  // Note: These credentials should only be used in a secure backend environment
  // and never exposed to the client
  username: import.meta.env.VITE_AZURE_SQL_USERNAME || '',
  password: import.meta.env.VITE_AZURE_SQL_PASSWORD || '',
};

// Azure AD B2C configuration for authentication
export const AZURE_AD_B2C = {
  clientId: import.meta.env.VITE_AZURE_AD_B2C_CLIENT_ID || '',
  authority: import.meta.env.VITE_AZURE_AD_B2C_AUTHORITY || '',
  knownAuthorities: [import.meta.env.VITE_AZURE_AD_B2C_KNOWN_AUTHORITY || ''],
  redirectUri: import.meta.env.VITE_AZURE_AD_B2C_REDIRECT_URI || window.location.origin,
  scopes: (import.meta.env.VITE_AZURE_AD_B2C_SCOPES || 'openid profile email').split(' '),
};

// Function to check if Azure configuration is complete
export const isAzureConfigured = (): boolean => {
  // Check if essential Azure configuration is available
  return (
    !!AZURE_STORAGE.accountName &&
    !!AZURE_STORAGE.sasToken &&
    !!AZURE_AD_B2C.clientId &&
    !!AZURE_AD_B2C.authority
  );
};

// Function to get Azure Storage blob URL
export const getAzureStorageBlobUrl = (blobName: string): string => {
  if (!AZURE_STORAGE.accountName || !AZURE_STORAGE.containerName) {
    throw new Error('Azure Storage configuration is incomplete');
  }

  return `https://${AZURE_STORAGE.accountName}.blob.core.windows.net/${AZURE_STORAGE.containerName}/${blobName}`;
};

// Function to get Azure Storage SAS URL for uploading
export const getAzureStorageSasUrl = (blobName: string): string => {
  if (!AZURE_STORAGE.accountName || !AZURE_STORAGE.containerName || !AZURE_STORAGE.sasToken) {
    throw new Error('Azure Storage configuration is incomplete');
  }

  return `https://${AZURE_STORAGE.accountName}.blob.core.windows.net/${AZURE_STORAGE.containerName}/${blobName}${AZURE_STORAGE.sasToken}`;
}; 