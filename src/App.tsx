import React, { useEffect } from 'react';
import { PublicClientApplication } from "@azure/msal-browser";
//import { MsalAuthProvider } from './contexts/AuthContext';
import { msalConfig } from './config/authConfig';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
//import { CssBaseline, Box } from '@mui/material';
import { MSALProviderWrapper } from './contexts/AuthContext';
//import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import { ThemeProvider } from '@mui/material/styles';
//import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
//import { theme } from './theme';
import Home from './pages/Home';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { NotFoundPage } from './pages/NotFound';
import Referencing from './pages/Referencing';
import ContractsPage from './pages/Contracts';
import BookViewing from './pages/BookViewing';
import Dashboard from './components/dashboard/Dashboard';
import { DashboardHome } from './components/dashboard/index';
import SavedProperties from './components/dashboard/sections/SavedProperties';
import Viewings from './components/dashboard/sections/Viewings';
import TenantContracts from './components/dashboard/sections/TenantContracts';
import FileTable from './components/dashboard/sections/YourFiles';
import TenantReferencing from './components/dashboard/sections/TenantReferencing';
import AgentHome from './pages/AgentHome';
import Listings from './pages/Listings';
import NewListingPage from './pages/listings/new';
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

  return (
    <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
    {/*<ThemeProvider theme={theme}>*/}
      <CssBaseline />
      <MSALProviderWrapper>
        {/*<RedirectUriWarning />*/}
        <AuthProvider>
        <Router>
        {/*<Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}>*/}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<AgentHome />} />
            <Route path="/referencing" element={<Referencing />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/bookviewing" element={<BookViewing />} />
            {/*<Route path="/referencing-test" element={<ReferencingTest />} />
            <Route path="/test-referencing" element={<TestReferencingPage />} />
            <Route path="/backend-test" element={<BackendIntegrationTest />} />
  <Route path="/referencing-modal-test" element={<ReferencingModalTest />} />*/}

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Listings routes */}
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/new" element={<NewListingPage />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="saved-searches" element={<SavedProperties />} />
              <Route path="viewings" element={<Viewings />} />
              <Route path="tenant-contracts" element={<TenantContracts/>} />
              <Route path="your-files" element={<FileTable />} />
              <Route path="tenant-referencing" element={<TenantReferencing />} />
            </Route>
          </Routes>
        </Router>
        </AuthProvider>
      </MSALProviderWrapper>
    {/*</ThemeProvider>*/}
    </ErrorBoundary>
  );
}

export default App;