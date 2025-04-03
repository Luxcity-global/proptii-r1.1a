import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import Home from './pages/Home';
import Referencing from './pages/Referencing';
import ContractsPage from './pages/Contracts';
import BookViewing from './pages/BookViewing';
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MSALProviderWrapper>
        <RedirectUriWarning />
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/referencing" element={<Referencing />} />
            <Route path="/referencing-test" element={<ReferencingTest />} />
            <Route path="/test-referencing" element={<TestReferencingPage />} />
            <Route path="/backend-test" element={<BackendIntegrationTest />} />
            <Route path="/referencing-modal-test" element={<ReferencingModalTest />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="saved-searches" element={<SavedProperties />} />
              <Route path="viewings" element={<Viewings />} />
              <Route path="tenant-contracts" element={<TenantContracts/>} />
              <Route path="your-files" element={<FileDashboard />} />
              <Route path="tenant-referencing" element={<TenantReferencing />} />
            </Route>
          </Routes>
        </Router>
      </MSALProviderWrapper>
    </ThemeProvider>
  );
}

export default App;