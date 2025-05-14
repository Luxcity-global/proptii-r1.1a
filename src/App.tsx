import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { UnauthorizedPage } from './pages/Unauthorized';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
      <ThemeProvider>
        <CssBaseline />
        <MSALProviderWrapper>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/faq" element={<FAQ />} />

              {/* Protected Routes */}
              <Route path="/agent" element={<AgentHome />} />

              <Route path="/referencing" element={<Referencing />} />

              <Route path="/contracts" element={<ContractsPage />} />

              <Route path="/bookviewing" element={<BookViewing />} />

              {/* Listings routes */}
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/new" element={
                <ProtectedRoute requiredRoles={['agent']}>
                  <NewListingPage />
                </ProtectedRoute>
              } />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="saved-searches" element={<SavedProperties />} />
                <Route path="viewings" element={<Viewings />} />
                <Route path="tenant-contracts" element={<TenantContracts />} />
                <Route path="your-files" element={<FileTable />} />
                <Route path="tenant-referencing" element={<TenantReferencing />} />
              </Route>

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </MSALProviderWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  );
};