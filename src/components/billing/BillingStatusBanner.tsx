import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { createBillingPortalSession } from '../../services/billingService';

/** S3-16 — In-app banner when subscription is past_due. */
const BillingStatusBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { status, trialEndsAt, loading } = useBillingStatus();
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated || loading) {
    return null;
  }

  const trialEndingSoon =
    status === 'trialing' &&
    trialEndsAt != null &&
    new Date(trialEndsAt).getTime() - Date.now() < 4 * 24 * 60 * 60 * 1000;

  if (status !== 'past_due' && !trialEndingSoon) {
    return null;
  }

  const handleFix = async () => {
    if (status === 'trialing') {
      navigate('/billing/activate');
      return;
    }
    setBusy(true);
    try {
      const { portalUrl } = await createBillingPortalSession();
      window.location.href = portalUrl;
    } catch {
      setBusy(false);
    }
  };

  return (
    <div
      role="alert"
      style={{
        background: '#FAEEDA',
        borderBottom: '1px solid #BA7517',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 15,
        color: '#14385C',
        zIndex: 60,
        position: 'relative',
      }}
    >
      <span>
        {status === 'past_due'
          ? 'Your payment failed — update your payment method to keep access.'
          : 'Your free month ends soon — review your plan before billing starts.'}
      </span>
      <button
        type="button"
        onClick={handleFix}
        disabled={busy}
        className="pr-btn pr-btn-primary"
        style={{ padding: '8px 20px', fontSize: 14 }}
      >
        {busy
          ? 'Opening…'
          : status === 'past_due'
            ? 'Update payment method'
            : 'Review your plan'}
      </button>
    </div>
  );
};

export default BillingStatusBanner;
