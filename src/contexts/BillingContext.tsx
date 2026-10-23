/**
 * BillingContext.tsx
 *
 * Single source of truth for user billing, active subscription tier, and Pro entitlements.
 * Backed directly by the server's canonical Firestore subscriptions collection
 * and Firebase Auth custom claims (hasPro).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchBillingStatus, BillingStatus } from '../services/billingService';

export interface BillingContextType {
  billingStatus: BillingStatus | null;
  isLoading: boolean;
  refreshBillingStatus: () => Promise<void>;
  hasPro: boolean;
  planId: string;
}

export const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBillingStatus = useCallback(async () => {
    if (!user?.id) {
      setBillingStatus(null);
      return;
    }
    try {
      setIsLoading(true);
      const status = await fetchBillingStatus();
      setBillingStatus(status);
    } catch (err) {
      console.warn('[BillingContext] Failed to fetch canonical billing status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Clear any legacy duplicated localStorage subscription state so Firestore remains sole authority
    try {
      localStorage.removeItem('proptii_subscription_tier');
      localStorage.removeItem('proptii_has_pro');
    } catch {}

    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const hasPro = Boolean(
    (user as any)?.hasPro ||
    (billingStatus && (billingStatus.status === 'active' || billingStatus.status === 'trialing'))
  );

  const planId = billingStatus?.plan || 'explorer';

  return (
    <BillingContext.Provider value={{ billingStatus, isLoading, refreshBillingStatus, hasPro, planId }}>
      {children}
    </BillingContext.Provider>
  );
};
