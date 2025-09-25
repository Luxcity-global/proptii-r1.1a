/**
 * Environment Variables Template
 * Copy this file to .env and fill in the values
 */

export const requiredEnvVariables = {
  // Azure AD B2C Configuration
  VITE_AZURE_AD_B2C_CLIENT_ID: '',
  VITE_AZURE_AD_B2C_AUTHORITY: '',
  VITE_AZURE_AD_B2C_KNOWN_AUTHORITY: '',
  VITE_AZURE_AD_B2C_REDIRECT_URI: '',
  VITE_AZURE_AD_B2C_SCOPES: 'openid profile email',

  // Azure Storage Configuration
  VITE_AZURE_STORAGE_ACCOUNT_NAME: '',
  VITE_AZURE_STORAGE_CONTAINER_NAME: 'documents',
  VITE_AZURE_STORAGE_SAS_TOKEN: '',

  // Azure SQL Database Configuration
  VITE_AZURE_SQL_SERVER: '',
  VITE_AZURE_SQL_DATABASE: '',
  VITE_AZURE_SQL_USERNAME: '',
  VITE_AZURE_SQL_PASSWORD: '',

  // Azure OpenAI Configuration
  VITE_AZURE_OPENAI_API_KEY: '',
  VITE_AZURE_OPENAI_ENDPOINT: '',
  VITE_AZURE_OPENAI_DEPLOYMENT_NAME: '',

  // Azure Static Web Apps Configuration (To Be Added)
  VITE_AZURE_STATIC_WEBAPP_URL: '',

  // Azure Functions Configuration (To Be Added)
  VITE_AZURE_FUNCTIONS_URL: '',

  // Azure CDN Configuration (To Be Added)
  VITE_AZURE_CDN_ENDPOINT: '',

  // API Configuration
  VITE_API_BASE_URL: 'http://localhost:3000',

  // App Configuration
  NODE_ENV: 'development'
} as const;

/**
 * Instructions:
 * 1. Copy this template to create your .env file
 * 2. Fill in all required values
 * 3. Never commit the actual .env file to version control
 * 4. Update this template when new environment variables are added
 */

export type EnvVariables = typeof requiredEnvVariables;

// Utility function to validate environment variables
export const validateEnvVariables = (env: Record<string, string | undefined>): boolean => {
  const missingVars = Object.keys(requiredEnvVariables).filter(key => !env[key]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
}; 