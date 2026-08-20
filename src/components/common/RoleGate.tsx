import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGate — redirects authenticated users with no assigned role to /select-role.
 *
 * A 400 ms settle delay prevents acting on the first render frame when the
 * role may not yet be resolved (e.g. Firestore cold-start).
 *
 * Exempt paths: /select-role, /claim, /login, /register, /unauthorized
 */

const EXEMPT_PATHS = ['/select-role', '/claim', '/login', '/register', '/unauthorized'];
const SETTLE_DELAY_MS = 400;

const RoleGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();
  const redirectedRef = useRef(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setSettled(true), SETTLE_DELAY_MS);
      return () => clearTimeout(t);
    }
    setSettled(false);
  }, [isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      redirectedRef.current = false;
      setSettled(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!settled || isLoading || !isAuthenticated || redirectedRef.current) return;

    const isExempt = EXEMPT_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    );
    if (isExempt) return;

    // Only redirect to /select-role when role resolution has finished (roleResolved === true) AND user has no roles assigned.
    // Do NOT redirect when user.roleResolved === false (still resolving).
    if (user && user.roleResolved === true && (!user.roles || user.roles.length === 0)) {
      console.warn('[Auth] RoleGate: authenticated but no role assigned — redirecting to /select-role');
      redirectedRef.current = true;
      navigate('/select-role', { replace: true });
    }
  }, [settled, isAuthenticated, isLoading, user, navigate, location.pathname]);
  return <>{children}</>;
};

export default RoleGate;
