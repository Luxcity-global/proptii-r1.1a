import React, { useEffect, useState, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignUpPromptModal } from '../components/onboarding/SignUpPromptModal';
import { MessagingProvider } from '../contexts/MessagingContext';
import { useMessagingPoller } from '../hooks/useMessagingPoller';
import EditProfileModal from '../components/profile/EditProfileModal';

// Lazy-load the Landlord App component
const LandlordApp = React.lazy(() => import('../landlord_agent/src/App'));

/**
 * Inner component that has access to MessagingContext and starts the poller.
 * Renders the lazy-loaded landlord App component.
 */
const LandlordDemoInner: React.FC = () => {
  const { isAuthenticated, user, isLoading, login, logout, editProfile, updateUserProfile } = useAuth();
  const { pathname, search } = useLocation();
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signUpTitle, setSignUpTitle] = useState('Sign up to continue');
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Start the 30-second polling loop for conversations and unread count
  useMessagingPoller();

  // Auto-open sign-in modal when redirected here with ?signin=1
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('signin') === '1') {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      setSignUpOpen(true);
    }
  }, [pathname, search]);

  // Listen for messages from the landlord iframe and custom events
  useEffect(() => {
    const triggerAuth = (action?: string) => {
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
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (data?.type === 'REQUIRE_AUTH') {
        triggerAuth(data.payload?.action);
        return;
      }

      if (data?.type === 'AUTH_ACTION' && data.payload?.action) {
        const authAction = data.payload.action as string;
        if (authAction === 'logout') {
          void logout();
        } else if (authAction === 'editProfile') {
          void editProfile();
        }
      }
    };

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      triggerAuth(customEvent.detail?.action);
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('require-auth', handleCustomEvent);
    const handleOpenEdit = () => setEditProfileOpen(true);
    window.addEventListener('open-edit-profile-modal', handleOpenEdit);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('require-auth', handleCustomEvent);
      window.removeEventListener('open-edit-profile-modal', handleOpenEdit);
    };
  }, [logout, editProfile]);

  // While auth is resolving, show a brief spinner
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
      {/* Lazy-loaded Landlord App */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E65D24] mx-auto"></div>
              <p className="mt-4 text-base text-gray-600 font-medium">Loading Landlord Dashboard...</p>
            </div>
          </div>
        }
      >
        <LandlordApp />
      </Suspense>

      {/* Sign-up gate — appears when the landlord app dispatches require-auth */}
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

      {/* Profile Edit Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        initialName={user?.name || user?.givenName || ''}
        initialEmail={user?.email || ''}
        initialPhone={user?.phone || ''}
        onSave={updateUserProfile}
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
