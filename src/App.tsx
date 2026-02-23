import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { SavedPropertiesProvider } from './contexts/SavedPropertiesContext';
import { SignedContractsProvider } from './contexts/SignedContractsContext';
import { OnboardingSessionProvider } from './contexts/OnboardingSessionContext';
import Home from './pages/Home';
import TenantOnboardingOptions from './pages/TenantOnboardingOptions';
import LandlordOnboardingOptions from './pages/LandlordOnboardingOptions';
import HomeownerOnboardingOptions from './pages/HomeownerOnboardingOptions';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { NotFoundPage } from './pages/NotFound';
import Referencing from './pages/Referencing';
import ContractsPage from './pages/Contracts';
import BookViewing from './pages/BookViewing';
import Dashboard from './components/dashboard/Dashboard';
import { DashboardHome } from './components/dashboard/index';
import SavedProperties from './components/dashboard/sections/SavedProperties-new';
import Viewings from './components/dashboard/sections/Viewings-new';
import TenantContracts from './components/dashboard/sections/TenantContracts-new';
import FileTable from './components/dashboard/sections/YourFiles-new';
import TenantReferencing from './components/dashboard/sections/TenantReferencing-new';
import AgentHome from './pages/AgentHome';
import HomeownerHome from './pages/HomeownerHome';
import HomeownerHomeVariantB from './pages/HomeownerHomeVariantB';
import PublicWorkerHome from './pages/PublicWorkerHome';
import { HomeownerDashboard } from './components/homeowner/HomeownerDashboard';
import Listings from './pages/Listings';
import NewListingPage from './pages/listings/new';
import LandlordDemo from './pages/LandlordDemo';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { UnauthorizedPage } from './pages/Unauthorized';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
// import AgentContractLanding from './pages/AgentContractLanding';
import SearchResults from './pages/SearchResults';
import Tools from './pages/Tools';
import ReadinessChecker from './pages/tools/ReadinessChecker';
import DocumentTracker from './pages/tools/DocumentTracker';
import ViewingTracker from './pages/tools/ViewingTracker';
import ProcessSimulator from './pages/tools/ProcessSimulator';
import TimelineGenerator from './pages/tools/TimelineGenerator';
import KnowYourRights from './pages/tools/KnowYourRights';

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
      <CssBaseline />
      <MSALProviderWrapper>
        <AuthProvider>
          <SavedPropertiesProvider>
            <OnboardingSessionProvider>
              <SignedContractsProvider>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/tenant-onboarding" element={<TenantOnboardingOptions />} />
            <Route path="/landlord-onboarding" element={<LandlordOnboardingOptions />} />
            <Route path="/homeowner-onboarding" element={<HomeownerOnboardingOptions />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Protected Routes */}
            <Route path="/agent" element={<AgentHome />} />
            <Route path="/Agent" element={<AgentHome />} />
            {/* Homeowner landing: use Variant B as default */}
            <Route path="/homeowner" element={<HomeownerHomeVariantB />} />
            <Route path="/Homeowner" element={<HomeownerHomeVariantB />} />
            {/* Keep alternate hero image available under /variant-b */}
            <Route path="/homeowner/variant-b" element={<HomeownerHome />} />
            <Route path="/Homeowner/variant-b" element={<HomeownerHome />} />
            <Route path="/homeowner/dashboard" element={<HomeownerDashboard />} />
            <Route path="/Homeowner/dashboard" element={<HomeownerDashboard />} />
            <Route path="/public-worker" element={<PublicWorkerHome />} />
            <Route path="/Public-worker" element={<PublicWorkerHome />} />
            <Route path="/landlord" element={<LandlordDemo />} />
            <Route path="/landlord-demo" element={<LandlordDemo />} />

            <Route path="/referencing" element={<Referencing />} />

            <Route path="/contracts" element={<ContractsPage />} />

            <Route path="/bookviewing" element={<BookViewing />} />

            {/* Tools routes */}
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/readiness-checker" element={<ReadinessChecker />} />
            <Route path="/tools/document-tracker" element={<DocumentTracker />} />
            <Route path="/tools/viewing-tracker" element={<ViewingTracker />} />
            <Route path="/tools/process-simulator" element={<ProcessSimulator />} />
            <Route path="/tools/timeline-generator" element={<TimelineGenerator />} />
            <Route path="/tools/know-your-rights" element={<KnowYourRights />} />

            {/* Listings routes */}
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={
              <ProtectedRoute requiredRoles={['agent', 'tenant']}>
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

            {/* New agent contract route */}
            {/* <Route path="/agent-contracts" element={<AgentContractLanding />} /> */}

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </SignedContractsProvider>
            </OnboardingSessionProvider>
          </SavedPropertiesProvider>
        </AuthProvider>
      </MSALProviderWrapper>
    </ErrorBoundary>
  );
};