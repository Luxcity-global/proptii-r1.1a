import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';
import './index.css';
import { msalInstance } from './contexts/AuthContext';
import theme from './theme/theme';

// Initialize MSAL before rendering the app
const initializeApp = async () => {
  try {
    // Only initialize MSAL if we have the required environment variables
    if (import.meta.env.VITE_MSAL_CLIENT_ID && import.meta.env.VITE_MSAL_AUTHORITY) {
      await msalInstance.initialize();
      console.log('MSAL initialized successfully');
      
      await msalInstance.handleRedirectPromise().catch(error => {
        console.error('Error handling redirect:', error);
      });
    } else {
      console.log('MSAL initialization skipped - running in local development mode');
    }
    
    // Render the app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
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
          <App />
        </ThemeProvider>
      </StrictMode>
    );
  }
};

// Start the initialization process
initializeApp();
