export interface DocuSignConfig {
  integrationKey: string;
  userId: string;
  accountId: string;
  baseUrl: string;
  privateKey: string;
  redirectUri: string;
}

export const docusignConfig: DocuSignConfig = {
  integrationKey: import.meta.env.VITE_DOCUSIGN_INTEGRATION_KEY || '',
  userId: import.meta.env.VITE_DOCUSIGN_USER_ID || '',
  accountId: import.meta.env.VITE_DOCUSIGN_ACCOUNT_ID || '',
  baseUrl: import.meta.env.VITE_DOCUSIGN_BASE_URL || 'https://demo.docusign.net',
  privateKey: import.meta.env.VITE_DOCUSIGN_RSA_PRIVATE_KEY || '',
  redirectUri: import.meta.env.VITE_DOCUSIGN_REDIRECT_URI || 'http://localhost:3000/docusign/callback'
};

export const DOCUSIGN_SCOPES = [
  'signature',
  'extended',
  'impersonation'
];

export const DOCUSIGN_AUTH_URL = `${docusignConfig.baseUrl}/oauth/auth`;
export const DOCUSIGN_TOKEN_URL = `${docusignConfig.baseUrl}/oauth/token`;
export const DOCUSIGN_REST_URL = `${docusignConfig.baseUrl}/restapi`;

// Validation function
export const validateDocuSignConfig = (): boolean => {
  const requiredFields = [
    'integrationKey',
    'userId', 
    'accountId',
    'baseUrl',
    'privateKey'
  ];
  
  return requiredFields.every(field => 
    docusignConfig[field as keyof DocuSignConfig] && 
    docusignConfig[field as keyof DocuSignConfig].length > 0
  );
};

// Get configuration for different environments
export const getDocuSignConfig = (environment: 'demo' | 'production' = 'demo') => {
  const baseUrl = environment === 'production' 
    ? 'https://www.docusign.net' 
    : 'https://demo.docusign.net';
    
  return {
    ...docusignConfig,
    baseUrl
  };
}; 