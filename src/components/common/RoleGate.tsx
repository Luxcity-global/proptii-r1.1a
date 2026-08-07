import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGate — redirects authenticated users with no assigned role to /select-role.
 *
 * A 400 ms settle delay prevents acting on the first render frame when the
 * role may not yet be resolved (Firestore cold-start, etc.).
 *
 * Exempt paths: /select-role, /claim, /login, /register, /unauthorized
 */

const EXEMPT_PATHS = ['/select-role', '/claim', '/login', '/register', '/unauthorized'];
const SETTLE_DELAY_MS = 400;

const RoleGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const redirectedRef = useRef(false);
  const [settled, setSettled] = useState(false);

  // Start settle timer once isLoading goes false
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => {
        console.log('[RoleGate] settled — will now evaluate role state');
        setSettled(true);
      }, SETTLE_DELAY_MS);
      return () => clearTimeout(t);
    }
    setSettled(false);
  }, [isLoading]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      redirectedRef.current = false;
      setSettled(false);
      console.log('[RoleGate] reset (user logged out)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!settled || isLoading || !isAuthenticated || redirectedRef.current) return;

    const isExempt = EXEMPT_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    );
    if (isExempt) return;

    console.log('[RoleGate] evaluating — user.roleResolved:', user?.roleResolved, 'roles:', user?.roles, 'path:', location.pathname);

    if (user && user.roleResolved === false) {
      console.warn('[RoleGate] roleResolved=false — redirecting to /select-role');
      redirectedRef.current = true;
      navigate('/select-role', { replace: true });
    } else {
      console.log('[RoleGate] role OK — allowing through');
    }
  }, [settled, isAuthenticated, isLoading, user, navigate, location.pathname]);

  return <>{children}</>;
};

export default RoleGate;
