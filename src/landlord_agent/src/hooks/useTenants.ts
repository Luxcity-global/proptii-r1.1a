/**
 * useTenants — single source of truth for the authenticated landlord's tenant list.
 *
 * Design rules:
 *  - Fetches once on mount (when userId is ready) and on explicit `invalidate()` calls.
 *  - No polling interval — data is refreshed only after a write operation.
 *  - Owned property IDs are passed in so the backend can widen the query (tenants
 *    matched by propertyId even if stored under a different userId).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { tenantService } from '../services/tenantService';
import { getAgentDummyTenants, isAgentTestAccount, mergeById } from '../data/agentTestPersona';
import type { Tenant } from '../App';

interface UseTenantsOptions {
  /** Firebase UID (or email) of the authenticated landlord/agent. */
  userId: string | null;
  /** IDs of properties owned by this user — broadens the Firestore query. */
  propertyIds?: string[];
}

interface UseTenantsResult {
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  /** Call after any write (add, update, delete) to trigger a fresh fetch. */
  invalidate: () => void;
}

export function useTenants({ userId, propertyIds = [] }: UseTenantsOptions): UseTenantsResult {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const { user } = useAuth();

  // Stable ref so the effect closure always reads the latest propertyIds without
  // triggering a re-fetch on every render when the array reference changes.
  const propertyIdsRef = useRef<string[]>(propertyIds);
  useEffect(() => { propertyIdsRef.current = propertyIds; }, [propertyIds]);

  const invalidate = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) {
      setTenants([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const ownedPropertyIds = propertyIdsRef.current.length > 0
          ? new Set(propertyIdsRef.current)
          : undefined;

        let list = await tenantService.getTenants(userId, ownedPropertyIds);

        // Merge demo data for agent test accounts without replacing real records.
        if (isAgentTestAccount(userId, user?.email)) {
          list = mergeById(getAgentDummyTenants(), list) as Tenant[];
        }

        if (!cancelled) {
          setTenants(list);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useTenants] fetch error:', err?.message || err);
          setError(err?.message || 'Failed to load tenants');
          // Keep existing tenants on error rather than wiping the list.
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();

    return () => { cancelled = true; };
  // fetchKey bumps trigger a re-fetch; propertyIds are read via ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchKey]);

  return { tenants, isLoading, error, invalidate };
}
