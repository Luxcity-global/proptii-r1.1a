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



  const isStripeSuccessReturn =
    location.pathname.startsWith('/billing/confirmed') &&
    location.search.includes('session_id=');

  if (!isAuthenticated && isStripeSuccessReturn) {
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
          <p style={{ color: '#666' }}>Completing your subscription…</p>
        </div>
      </div>
    );
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

    const userRoles = user.roles || ['tenant'];

    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));



    if (!hasRequiredRole) {

      return <Navigate to="/unauthorized" replace />;

    }

  }



  return <TrialExpiredGuard>{children}</TrialExpiredGuard>;

};


