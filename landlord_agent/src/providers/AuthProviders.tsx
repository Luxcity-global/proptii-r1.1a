import React from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '../config/azureConfig';
import { AuthProvider } from '../contexts/AuthContext';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProvidersProps {
  children: React.ReactNode;
}

export const AuthProviders: React.FC<AuthProvidersProps> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MsalProvider>
  );
};
