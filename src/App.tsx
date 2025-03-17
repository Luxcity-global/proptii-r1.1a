import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import Home from './pages/Home';
import Referencing from './pages/Referencing';
import RedirectUriWarning from './components/RedirectUriWarning';
import ReferencingTest from './components/referencing/ReferencingTest';
import TestReferencingPage from './pages/test-referencing';
import BackendIntegrationTest from './pages/BackendIntegrationTest';
import ReferencingModalTest from './pages/ReferencingTest';
import Dashboard from './components/dashboard/Dashboard';
import DashboardHome from './components/dashboard/sections/DashboardHome';
import SavedProperties from './components/dashboard/sections/SavedProperties';
import Viewings from './components/dashboard/sections/Viewings';
import theme from './theme/theme';
import './App.css';

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
              <Route path="referencing" element={<div>Referencing Status</div>} />
              <Route path="contracts" element={<div>Contracts</div>} />
              <Route path="files" element={<div>Files</div>} />
            </Route>
          </Routes>
        </Router>
      </MSALProviderWrapper>
    </ThemeProvider>
  );
}

export default App;