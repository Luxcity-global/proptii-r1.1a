import React, { useState } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import TrialExpiredGuard from '../../router/TrialExpiredGuard';

import { signupUrlForAuthRedirect } from '../../utils/pricingRoutes';



interface ProtectedRouteProps {

  children: React.ReactNode;

  requiredRoles?: string[];

}



export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({

  children,

  requiredRoles = []

}) => {

  const { isAuthenticated, user, isLoading } = useAuth();

  const location = useLocation();
  const [switchDismissed, setSwitchDismissed] = useState(false);



  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        fontFamily: 'Archivo, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but role resolution hasn't completed yet
  // (Firestore slow / cold-start), hold on loading instead of redirecting.
  if (isAuthenticated && user && !user.roleResolved) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontFamily: 'Archivo, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }



  const isStripeSuccessReturn =
    location.pathname.startsWith('/billing/confirmed') &&
    location.search.includes('session_id=');

  if (!isAuthenticated && isStripeSuccessReturn) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', fullPath);
    sessionStorage.removeItem('redirect_in_progress');
    sessionStorage.removeItem('last_redirect_path');



    const signupTarget = signupUrlForAuthRedirect(fullPath);

    if (signupTarget) {

      return <Navigate to={signupTarget} replace />;

    }



    const loginPath = `/login?redirect=${encodeURIComponent(fullPath)}`;

    return <Navigate to={loginPath} state={{ from: location }} replace />;

  }



  sessionStorage.removeItem('redirect_in_progress');

  sessionStorage.removeItem('last_redirect_path');



  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      const actualRole = userRoles[0];

      // ── Smart redirects: send users to their correct dashboard ──────────────

      // Landlord/agent trying to access a tenant-only route → go to landlord app
      // but show a "switch to tenant view" banner if they want to browse as tenant
      const isTenantRoute =
        location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/referencing') ||
        location.pathname.startsWith('/contracts') ||
        location.pathname.startsWith('/bookviewing');

      const isLandlordRoute =
        location.pathname.startsWith('/landlord') ||
        location.pathname.startsWith('/agent') ||
        location.pathname.startsWith('/listings/new');

      if (actualRole === 'landlord' || actualRole === 'agent') {
        if (isTenantRoute) {
          // Landlord deliberately navigated to a tenant route.
          // Per Q2: allow with a contextual "switch view" banner.
          if (!switchDismissed) {
            return (
              <>
                {/* Switch-view banner */}
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: 'linear-gradient(90deg, #0F2537, #136C9E)',
                    color: '#fff',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '14px',
                    fontFamily: 'Archivo, sans-serif',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                  role="banner"
                >
                  <span>
                    👋 You're viewing the <strong>tenant</strong> area as a landlord.
                    Some features may behave differently.
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a
                      href="/landlord"
                      style={{
                        background: '#DC5F12',
                        color: '#fff',
                        padding: '5px 14px',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      Go to Landlord Dashboard
                    </a>
                    <button
                      onClick={() => setSwitchDismissed(true)}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Continue browsing
                    </button>
                  </div>
                </div>
                {/* Spacer so content isn't hidden under banner */}
                <div style={{ paddingTop: '48px' }}>
                  <TrialExpiredGuard>{children}</TrialExpiredGuard>
                </div>
              </>
            );
          }
          // Banner dismissed — let them use the tenant view normally
          return <TrialExpiredGuard>{children}</TrialExpiredGuard>;
        }
      }

      if (actualRole === 'tenant') {
        if (isLandlordRoute) {
          // Tenant trying to access landlord routes → redirect to their dashboard
          return <Navigate to="/dashboard" replace />;
        }
      }

      // No role resolved yet → role selection screen
      if (!actualRole) {
        return <Navigate to="/select-role" replace />;
      }

      // Fallback for any other mismatch
      return <Navigate to="/unauthorized" replace />;

    }

  }



  return <TrialExpiredGuard>{children}</TrialExpiredGuard>;

};


