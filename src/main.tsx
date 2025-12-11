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

// Render the app immediately - don't wait for async initialization
try {
  console.log('🚀 Starting app initialization...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('✅ Root element found, creating root...');
  const root = createRoot(rootElement);

  console.log('✅ Rendering app...');
  root.render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>
  );
  console.log('✅ App rendered to DOM');
} catch (error) {
  console.error('❌ CRITICAL ERROR during app initialization:', error);
  // Try to render a basic error message
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Application Error</h1>
        <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <p>Check the browser console for more details.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">Reload Page</button>
      </div>
    `;
  }
}

// Initialize MSAL and other services asynchronously (non-blocking)
(async () => {
  try {
    // Initialize MSAL in the background
    const msalInstance = getMsalInstance();
    
    // Only proceed with MSAL operations if we have the required environment variables
    if (import.meta.env.VITE_AZURE_AD_CLIENT_ID && import.meta.env.VITE_AZURE_AD_TENANT_NAME) {
      // Add timeout to prevent hanging
      const initPromise = msalInstance.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MSAL initialization timeout')), 5000)
      );
      
      try {
        await Promise.race([initPromise, timeoutPromise]);
        console.log('MSAL initialized successfully');

        await msalInstance.handleRedirectPromise().catch(error => {
          console.error('Error handling redirect:', error);
        });
      } catch (error) {
        console.warn('MSAL initialization warning:', error);
        // Continue anyway - app should work without MSAL if not configured
      }
    } else {
      console.log('MSAL initialization skipped - missing required environment variables');
    }

    // Initialize performance monitoring only if enabled
    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' && appInsights) {
      try {
        // Check if already initialized (safe check)
        const isInitialized = appInsights.core?.isInitialized?.() ?? false;
        if (!isInitialized && typeof appInsights.loadAppInsights === 'function') {
          appInsights.loadAppInsights();
        }
      } catch (error) {
        console.warn('Error initializing performance monitoring:', error);
      }
    }
  } catch (error) {
    console.error('Error during background initialization:', error);
    // Don't block the app - just log the error
  }
})();
