import React, { useEffect } from 'react';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalAuthProvider } from './contexts/AuthContext';
import { msalConfig } from './config/authConfig';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Referencing from './pages/Referencing';
import ContractsPage from './pages/Contracts';
import ErrorBoundary from './components/ErrorBoundary';

console.log('App.tsx - Starting initialization with config:', msalConfig);

// Initialize MSAL instance
const pca = new PublicClientApplication(msalConfig);

// Handle the redirect promise when returning from a redirect sign-in
pca.initialize().then(() => {
  console.log('MSAL Initialized successfully');
  // Account selection logic is app dependent. Adjust as needed for your use case
  const accounts = pca.getAllAccounts();
  console.log('Found accounts:', accounts);
  if (accounts.length > 0) {
    pca.setActiveAccount(accounts[0]);
  }
}).catch((error) => {
  console.error("MSAL Initialization Error: ", error);
});

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
                <Route path="/contracts" element={<ContractsPage />} />
              </Routes>
            </div>
          </MsalAuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </ErrorBoundary>
  );
}

export default App;