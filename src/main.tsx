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
    // Ensure MSAL is initialized
    await msalInstance.initialize();
    console.log('MSAL initialized successfully');
    
    // Handle any redirect responses if coming back from login
    await msalInstance.handleRedirectPromise().catch(error => {
      console.error('Error handling redirect:', error);
    });
    
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
    console.error('Failed to initialize MSAL:', error);
    
    // Render the app anyway, but log the error
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
