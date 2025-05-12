import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import { getMsalInstance } from './contexts/AuthContext';
import theme from './theme/theme';
import { ErrorBoundary } from './utils/errorHandler';
import appInsights from './utils/performanceMonitor';
import { Router } from './config/routerConfig';

// Initialize MSAL before rendering the app
const initializeApp = async () => {
  try {
    // Initialize MSAL first
    const msalInstance = getMsalInstance();
    
    // Only proceed with MSAL operations if we have the required environment variables
    if (import.meta.env.VITE_AZURE_AD_CLIENT_ID && import.meta.env.VITE_AZURE_AD_TENANT_NAME) {
      await msalInstance.initialize();
      console.log('MSAL initialized successfully');

      await msalInstance.handleRedirectPromise().catch(error => {
        console.error('Error handling redirect:', error);
      });
    } else {
      console.log('MSAL initialization skipped - missing required environment variables');
    }

    // Initialize performance monitoring only if enabled and not already initialized
    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' && !appInsights.core.isInitialized()) {
      appInsights.loadAppInsights();
    }

    // Render the app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </ThemeProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error during initialization:', error);

    // Render the app anyway
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </ThemeProvider>
      </StrictMode>
    );
  }
};

// Start the initialization process
initializeApp();
