import React, { useEffect } from 'react';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalAuthProvider } from './contexts/AuthContext';
import { msalConfig } from './config/authConfig';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Referencing from './pages/Referencing';
import ErrorBoundary from './components/ErrorBoundary';
import { DEV_MODE } from './config/devConfig';

console.log('App.tsx - Starting initialization with config:', msalConfig);

// Initialize MSAL instance
const pca = new PublicClientApplication(msalConfig);

// Handle the redirect promise when returning from a redirect sign-in
if (!DEV_MODE) {
  pca.initialize().then(() => {
    console.log('MSAL Initialized successfully');
    const accounts = pca.getAllAccounts();
    console.log('Found accounts:', accounts);
    if (accounts.length > 0) {
      pca.setActiveAccount(accounts[0]);
    }
  }).catch((error) => {
    console.error("MSAL Initialization Error: ", error);
  });
} else {
  console.log('Development mode: Skipping MSAL initialization');
}

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <ErrorBoundary>
      <React.StrictMode>
        <BrowserRouter>
          <MsalAuthProvider instance={pca}>
            <div className="app-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/referencing" element={<Referencing />} />
              </Routes>
            </div>
          </MsalAuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </ErrorBoundary>
  );
}

export default App;