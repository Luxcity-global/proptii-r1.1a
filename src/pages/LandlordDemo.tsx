import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandlordAppBridge from '../components/LandlordAppBridge';
import Footer from '../components/Footer';
import { SignUpPromptModal } from '../components/onboarding/SignUpPromptModal';

const LandlordDemo: React.FC = () => {
  const { isAuthenticated, user, isLoading, login } = useAuth();
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signUpTitle, setSignUpTitle] = useState('Sign up to continue');

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
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
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

export default LandlordDemo;
