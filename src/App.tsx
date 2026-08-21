import React, { useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import { GovDataLayerProvider } from './contexts/GovDataLayerContext';
import { SavedPropertiesProvider } from './contexts/SavedPropertiesContext';
import { SignedContractsProvider } from './contexts/SignedContractsContext';
import { OnboardingSessionProvider } from './contexts/OnboardingSessionContext';
import { OnboardingOptionsModalRoute } from './pages/OnboardingOptionsModalRoute';
import HomeLegacy from './pages/HomeLegacy';
import { LoginPage } from './pages/Login';
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
import DashboardSettings from './components/dashboard/sections/DashboardSettings';
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
import { AuthRedirectHandler } from './components/common/AuthRedirectHandler';
import { PostAuthAccountGate } from './components/common/PostAuthAccountGate';
import { StripeCheckoutReturnHandler } from './components/common/StripeCheckoutReturnHandler';
import SearchResults from './pages/SearchResults';
import HomeVariant from './pages/HomeVariant';
import Pricing from './pages/pricing';
import SignupModalPage from './pages/signup';
import CreateAccountPage from './pages/signup/create-account';
import SignupWelcomePage from './pages/signup/welcome';
import PlanSelected from './pages/pricing/PlanSelected';
import PricingArrival from './pages/pricing/PricingArrival';
import PayNowPage from './pages/billing/pay-now';
import BillingConfirmedPage from './pages/billing/confirmed';
import BillingActivatePage from './pages/billing/activate';
import BillingStatusBanner from './components/billing/BillingStatusBanner';
import Tools from './pages/Tools';
import ReadinessChecker from './pages/tools/ReadinessChecker';
import DocumentTracker from './pages/tools/DocumentTracker';
import ViewingTracker from './pages/tools/ViewingTracker';
import ProcessSimulator from './pages/tools/ProcessSimulator';
import TimelineGenerator from './pages/tools/TimelineGenerator';
import KnowYourRights from './pages/tools/KnowYourRights';
import { AuthAnalyticsBridge } from './components/analytics/AuthAnalyticsBridge';
import ComingSoon from './pages/ComingSoon';

/** Default landing: homepage (mascot onboarding archived; see HOMEPAGE_ONBOARDING_FLOW_ENABLED). */

/** Reset window scroll on route change (SPA navigation does not scroll to top by default). */
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    if (previous) {
      html.style.scrollBehavior = previous;
    } else {
      html.style.removeProperty('scroll-behavior');
    }
  }, [pathname]);

  return null;
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
      <CssBaseline />
      <MSALProviderWrapper>
        <GovDataLayerProvider>
        <SavedPropertiesProvider>
          <OnboardingSessionProvider>
          <SignedContractsProvider>
              <AuthAnalyticsBridge />
              <StripeCheckoutReturnHandler />
              <AuthRedirectHandler />
              <PostAuthAccountGate />
              <BillingStatusBanner />
              <ScrollToTop />
              <Routes>
            {/* Public Routes - / is default landing; onboarding shows as modal overlay */}
            <Route path="/" element={<HomeVariant />} />
            <Route path="/home-v2" element={<Navigate to="/" replace />} />
            <Route path="/home-legacy" element={<HomeLegacy />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/tenant-onboarding" element={<OnboardingOptionsModalRoute type="tenant" />} />
            <Route path="/landlord-onboarding" element={<OnboardingOptionsModalRoute type="landlord" />} />
            <Route path="/homeowner-onboarding" element={<OnboardingOptionsModalRoute type="homeowner" />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/pricing" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/signup" element={<SignupModalPage />} />
            <Route path="/signup/create-account" element={<CreateAccountPage />} />
            <Route
              path="/signup/welcome"
              element={<SignupWelcomePage />}
            />
            <Route
              path="/signup/pay-now"
              element={
                <ProtectedRoute>
                  <PayNowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/confirmed"
              element={
                <ProtectedRoute>
                  <BillingConfirmedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/activate"
              element={
                <ProtectedRoute>
                  <BillingActivatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/settings"
              element={<Navigate to="/dashboard/settings" replace />}
            />
            <Route
              path="/account/billing"
              element={<Navigate to="/dashboard/settings" replace />}
            />
            <Route path="/pricing/plan-selected" element={<PlanSelected />} />
            <Route path="/pricing/arrival" element={<Navigate to="/signup/welcome" replace />} />
            <Route path="/pricing/pay-now" element={<Navigate to="/signup/pay-now" replace />} />
            <Route path="/pricing/billing" element={<Navigate to="/billing/activate" replace />} />
            <Route path="/pricing/confirmed" element={<Navigate to="/billing/confirmed" replace />} />

            {/* Legacy / marketing URL redirects */}
            <Route path="/about" element={<Navigate to="/about-us" replace />} />
            <Route path="/contract" element={<Navigate to="/contracts" replace />} />
            <Route path="/booking" element={<Navigate to="/bookviewing" replace />} />
            <Route path="/book-viewing" element={<Navigate to="/bookviewing" replace />} />

            {/* Protected Routes */}
            <Route path="/agent" element={<AgentHome />} />
            <Route path="/Agent" element={<AgentHome />} />
            <Route path="/landlord" element={<LandlordDemo />} />
            <Route path="/landlord/*" element={<LandlordDemo />} />

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
            <Route path="/coming-soon" element={<ComingSoon />} />

            {/* Listings routes */}
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={
              <ProtectedRoute requiredRoles={['agent', 'tenant']}>
                <NewListingPage />
              </ProtectedRoute>
            } />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="saved-searches" element={<SavedProperties />} />
              <Route path="viewings" element={<Viewings />} />
              <Route path="tenant-contracts" element={<TenantContracts />} />
              <Route path="your-files" element={<FileTable />} />
              <Route path="tenant-referencing" element={<TenantReferencing />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Route>

            {/* New agent contract route */}
            {/* <Route path="/agent-contracts" element={<AgentContractLanding />} /> */}

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SignedContractsProvider>
            </OnboardingSessionProvider>
          </SavedPropertiesProvider>
        </GovDataLayerProvider>
      </MSALProviderWrapper>
    </ErrorBoundary>
  );
};