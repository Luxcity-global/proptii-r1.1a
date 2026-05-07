import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandlordAppBridge from '../components/LandlordAppBridge';
import Footer from '../components/Footer';
import { SignUpPromptModal } from '../components/onboarding/SignUpPromptModal';
import { MessagingProvider } from '../contexts/MessagingContext';
import { useMessagingPoller } from '../hooks/useMessagingPoller';

/**
 * Inner component that has access to MessagingContext and starts the poller.
 * Renders the landlord app bridge for the base /landlord route, or child
 * routes (e.g. /landlord/messages) via <Outlet />.
 */
const LandlordDemoInner: React.FC = () => {
  const { isLoading, login } = useAuth();
  const { pathname, search } = useLocation();
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signUpTitle, setSignUpTitle] = useState('Sign up to continue');

  // Start the 30-second polling loop for conversations and unread count
  useMessagingPoller();

  // Auto-open sign-in modal when redirected here with ?signin=1
  // (e.g. from the landlord app running in standalone mode)
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('signin') === '1') {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      setSignUpOpen(true);
    }
  }, [pathname, search]);

  // Listen for REQUIRE_AUTH messages from the landlord iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (data?.type === 'REQUIRE_AUTH') {
        const action = data.payload?.action as string | undefined;
        setSignUpTitle(
          action === 'publish'
            ? 'Sign up to publish your property'
            : action === 'add-tenant'
              ? 'Sign up to add a tenant'
              : 'Sign up to continue'
        );
        // Store current path so we can redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        setSignUpOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // While MSAL is resolving auth, show a brief spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E65D24] mx-auto"></div>
          <p className="mt-4 text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-nunito">
      {/* Landlord App (rendered for both authenticated and guest users) */}
      <LandlordAppBridge />

      {/* Child routes (e.g. /landlord/messages) render here */}
      <Outlet />

      <Footer />

      {/* Sign-up gate — appears when the iframe sends REQUIRE_AUTH */}
      <SignUpPromptModal
        isOpen={signUpOpen}
        onClose={() => setSignUpOpen(false)}
        title={signUpTitle}
        reassurance="Create a free account in seconds to save your progress."
        showExploreFeaturesAsSecondary={true}
        onSignUpEmail={async () => {
          setSignUpOpen(false);
          await login();
        }}
        onExploreFeatures={() => setSignUpOpen(false)}
      />
    </div>
  );
};

/**
 * LandlordDemo — the landlord layout component wrapping all /landlord/* routes.
 * Provides MessagingContext and starts the polling loop via LandlordDemoInner.
 */
const LandlordDemo: React.FC = () => (
  <MessagingProvider>
    <LandlordDemoInner />
  </MessagingProvider>
);

export default LandlordDemo;
