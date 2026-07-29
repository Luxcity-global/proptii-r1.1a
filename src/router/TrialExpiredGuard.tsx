import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBillingStatus } from '../hooks/useBillingStatus';

const EXEMPT_PREFIXES = [
  '/billing/activate',
  '/billing/confirmed',
  '/signup',
  '/login',
  '/pricing',
  '/register',
  '/unauthorized',
];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

interface Props {
  children: React.ReactNode;
}

/** S3-02 — Redirect expired trials to /billing/activate. */
const TrialExpiredGuard: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { status, trialEndsAt, loading } = useBillingStatus();

  if (loading || isExempt(location.pathname)) {
    return <>{children}</>;
  }

  const trialExpired =
    status === 'trialing' &&
    trialEndsAt != null &&
    new Date(trialEndsAt).getTime() < Date.now();

  if (trialExpired) {
    return <Navigate to="/billing/activate" replace />;
  }

  return <>{children}</>;
};

export default TrialExpiredGuard;
