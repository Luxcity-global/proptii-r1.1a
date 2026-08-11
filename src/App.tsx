import React, { lazy, Suspense, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { MSALProviderWrapper } from './contexts/AuthContext';
import { SavedPropertiesProvider } from './contexts/SavedPropertiesContext';
import { SignedContractsProvider } from './contexts/SignedContractsContext';
import { OnboardingSessionProvider } from './contexts/OnboardingSessionContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AuthRedirectHandler } from './components/common/AuthRedirectHandler';
import { StripeCheckoutReturnHandler } from './components/common/StripeCheckoutReturnHandler';
import BillingStatusBanner from './components/billing/BillingStatusBanner';
import { AuthAnalyticsBridge } from './components/analytics/AuthAnalyticsBridge';
import DevAuthToolbar from './components/dev/DevAuthToolbar';
import RoleGate from './components/common/RoleGate';

// ─── Eagerly loaded (small, above-the-fold) ────────────────────────────────
import HomeVariant from './pages/HomeVariant';
import { LoginPage } from './pages/Login';
import { NotFoundPage } from './pages/NotFound';
import { UnauthorizedPage } from './pages/Unauthorized';
import { OnboardingOptionsModalRoute } from './pages/OnboardingOptionsModalRoute';
import Dashboard from './components/dashboard/Dashboard';
import { DashboardHome } from './components/dashboard/index';

// ─── Lazily loaded (heavy pages — split into async chunks) ─────────────────
const HomeLegacy          = lazy(() => import('./pages/HomeLegacy'));
const ClaimListing        = lazy(() => import('./pages/ClaimListing'));
const ClaimAccount        = lazy(() => import('./pages/ClaimAccount'));
const Referencing         = lazy(() => import('./pages/Referencing'));
const ContractsPage       = lazy(() => import('./pages/Contracts'));
const BookViewing         = lazy(() => import('./pages/BookViewing'));
const AgentHome           = lazy(() => import('./pages/AgentHome'));
const HomeownerHome       = lazy(() => import('./pages/HomeownerHome'));
const HomeownerHomeVariantB = lazy(() => import('./pages/HomeownerHomeVariantB'));
const PublicWorkerHome    = lazy(() => import('./pages/PublicWorkerHome'));
const HomeownerDashboard  = lazy(() => import('./components/homeowner/HomeownerDashboard').then(m => ({ default: m.HomeownerDashboard })));
const Listings            = lazy(() => import('./pages/Listings'));
const NewListingPage      = lazy(() => import('./pages/listings/new'));
const LandlordDemo        = lazy(() => import('./pages/LandlordDemo'));
const AboutUs             = lazy(() => import('./pages/AboutUs'));
const PrivacyPolicy       = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService      = lazy(() => import('./pages/TermsOfService'));
const FAQ                 = lazy(() => import('./pages/FAQ'));
const SearchResults       = lazy(() => import('./pages/SearchResults'));
const Pricing             = lazy(() => import('./pages/pricing'));
const SignupModalPage     = lazy(() => import('./pages/signup'));
const CreateAccountPage   = lazy(() => import('./pages/signup/create-account'));
const SignupWelcomePage   = lazy(() => import('./pages/signup/welcome'));
const PlanSelected        = lazy(() => import('./pages/pricing/PlanSelected'));
const PayNowPage          = lazy(() => import('./pages/billing/pay-now'));
const BillingConfirmedPage = lazy(() => import('./pages/billing/confirmed'));
const BillingActivatePage = lazy(() => import('./pages/billing/activate'));
const Tools               = lazy(() => import('./pages/Tools'));
const ReadinessChecker    = lazy(() => import('./pages/tools/ReadinessChecker'));
const DocumentTracker     = lazy(() => import('./pages/tools/DocumentTracker'));
const ViewingTracker      = lazy(() => import('./pages/tools/ViewingTracker'));
const ProcessSimulator    = lazy(() => import('./pages/tools/ProcessSimulator'));
const TimelineGenerator   = lazy(() => import('./pages/tools/TimelineGenerator'));
const KnowYourRights      = lazy(() => import('./pages/tools/KnowYourRights'));
const ComingSoon          = lazy(() => import('./pages/ComingSoon'));
const GuestThreadPage     = lazy(() => import('./pages/GuestThreadPage'));
const RoleSelect          = lazy(() => import('./pages/RoleSelect'));
// Dashboard sections
const SavedProperties     = lazy(() => import('./components/dashboard/sections/SavedProperties-new'));
const Viewings            = lazy(() => import('./components/dashboard/sections/Viewings-new'));
const TenantContracts     = lazy(() => import('./components/dashboard/sections/TenantContracts-new'));
const FileTable           = lazy(() => import('./components/dashboard/sections/YourFiles-new'));
const TenantReferencing   = lazy(() => import('./components/dashboard/sections/TenantReferencing-new'));
const TenantMessages      = lazy(() => import('./pages/dashboard/TenantMessages'));
const DashboardSettings   = lazy(() => import('./components/dashboard/sections/DashboardSettings'));

/** Minimal spinner shown while an async route chunk is loading. */
function RouteLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #1776B6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Default landing: onboarding flow first. Home v2 lives at / with /home-v2 as alias. */

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
        <SavedPropertiesProvider>
          <OnboardingSessionProvider>
            <SignedContractsProvider>
              <AuthAnalyticsBridge />
              <StripeCheckoutReturnHandler />
              <AuthRedirectHandler />
              <BillingStatusBanner />
              <ScrollToTop />
              <RoleGate>
                <Suspense fallback={<RouteLoadingFallback />}>
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
                <Route path="/select-role" element={<RoleSelect />} />
                <Route path="/register" element={<Navigate to="/pricing" replace />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/claim-listing" element={<ClaimListing />} />
                <Route path="/claim" element={<ClaimAccount />} />
                <Route path="/thread/:token" element={<GuestThreadPage />} />
                <Route path="/signup" element={<SignupModalPage />} />
                <Route path="/signup/create-account" element={<CreateAccountPage />} />
                <Route path="/signup/welcome" element={<SignupWelcomePage />} />
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
                <Route path="/account/settings" element={<Navigate to="/dashboard/settings" replace />} />
                <Route path="/account/billing" element={<Navigate to="/dashboard/settings" replace />} />
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
                <Route path="/agent" element={
                  <ProtectedRoute requiredRoles={['landlord', 'agent']}>
                    <AgentHome />
                  </ProtectedRoute>
                } />
                <Route path="/Agent" element={
                  <ProtectedRoute requiredRoles={['landlord', 'agent']}>
                    <AgentHome />
                  </ProtectedRoute>
                } />
                <Route path="/landlord/index.html" element={<Navigate to="/landlord" replace />} />
                <Route path="/landlord/*" element={
                  <ProtectedRoute requiredRoles={['landlord', 'agent']}>
                    <LandlordDemo />
                  </ProtectedRoute>
                } />

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
                  <ProtectedRoute requiredRoles={['landlord', 'agent']}>
                    <NewListingPage />
                  </ProtectedRoute>
                } />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRoles={['tenant']}>
                    <Dashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<DashboardHome />} />
                  <Route path="saved-searches" element={<SavedProperties />} />
                  <Route path="viewings" element={<Viewings />} />
                  <Route path="tenant-contracts" element={<TenantContracts />} />
                  <Route path="your-files" element={<FileTable />} />
                  <Route path="tenant-referencing" element={<TenantReferencing />} />
                  <Route path="messages" element={<TenantMessages />} />
                  <Route path="settings" element={<DashboardSettings />} />
                </Route>

                {/* New agent contract route */}
                {/* <Route path="/agent-contracts" element={<AgentContractLanding />} /> */}

                {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
              </RoleGate>
              {/* Dev-only mock auth toolbar — stripped from production builds */}
              {import.meta.env.DEV && <DevAuthToolbar />}
            </SignedContractsProvider>
          </OnboardingSessionProvider>
        </SavedPropertiesProvider>
      </MSALProviderWrapper>
    </ErrorBoundary>
  );
};