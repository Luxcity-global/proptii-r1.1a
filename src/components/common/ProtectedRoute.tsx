import React from 'react';

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

  if (isStripeSuccessReturn) {
    if (isLoading) {
      // Auth is still resolving — show spinner rather than redirect
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontFamily: 'Archivo, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p style={{ color: '#666' }}>Loading...</p>
          </div>
        </div>
      );
    }
    if (!isAuthenticated) {
      // Auth resolved as unauthenticated — redirect to login preserving the session_id
      const fullPath = location.pathname + location.search;
      return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} state={{ from: location }} replace />;
    }
    // Authenticated — fall through to normal ProtectedRoute rendering below
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



  if (isAuthenticated && user) {
    const userRoles = user.roles || [];

    // If user is authenticated but has no role assigned yet, force /select-role prompt
    if (userRoles.length === 0 && location.pathname !== '/select-role') {
      return <Navigate to="/select-role" replace />;
    }

    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        const actualRole = userRoles[0];

        // ── Smart redirects: send users to their correct dashboard ──────────────
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
          const stayOnTenantPassport = location.pathname === '/dashboard/tenant-referencing';
          // If a landlord/agent attempts to navigate to the tenant dashboard, send them to their dashboard
          if (!stayOnTenantPassport && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'))) {
            return <Navigate to="/landlord" replace />;
          }

          if (isTenantRoute) {
            return <Navigate to="/landlord" replace />;
          }
        }

        if (actualRole === 'tenant') {
          if (isLandlordRoute) {
            return <Navigate to="/dashboard" replace />;
          }
        }

        // No role resolved yet → role selection screen
        if (!actualRole) {
          return <Navigate to="/select-role" replace />;
        }

        return <Navigate to="/unauthorized" replace />;
      }
    }
  }



  return <TrialExpiredGuard>{children}</TrialExpiredGuard>;

};


