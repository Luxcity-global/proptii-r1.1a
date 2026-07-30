import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGate
 *
 * Sits just inside the router and watches for authenticated users who
 * have no role assigned yet (user.roleResolved === false).
 *
 * When it detects such a user it redirects to /select-role so they
 * can pick their role before reaching any protected content.
 *
 * Exempted paths (no redirect even without a role):
 *   - /select-role itself (prevents infinite redirect loop)
 *   - /claim (claim flow assigns role itself)
 *   - /login, /register
 *   - /unauthorized
 */
const EXEMPT_PATHS = ['/select-role', '/claim', '/login', '/register', '/unauthorized'];

const RoleGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  // Reset on logout so next login can trigger the gate again
  useEffect(() => {
    if (!isAuthenticated) redirectedRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || redirectedRef.current) return;

    // Skip exempt paths
    const isExempt = EXEMPT_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    );
    if (isExempt) return;

    // If user has no role assigned yet, send to select-role
    if (user && user.roleResolved === false) {
      console.log('[RoleGate] No role resolved — redirecting to /select-role');
      redirectedRef.current = true;
      navigate('/select-role', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, location.pathname]);

  return <>{children}</>;
};

export default RoleGate;
