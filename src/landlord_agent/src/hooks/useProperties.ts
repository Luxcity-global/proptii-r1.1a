/**
 * useProperties — single source of truth for the authenticated landlord's property list.
 *
 * Same event-driven pattern as useTenants: fetch on mount, re-fetch on invalidate().
 * No polling.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { getAgentDummyProperties, isAgentTestAccount, mergeAgentDemoProperties } from '../data/agentTestPersona';
import type { Property } from '../App';

interface UsePropertiesOptions {
  userId: string | null;
  userEmail?: string | null;
}

interface UsePropertiesResult {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  invalidate: () => void;
}

export function useProperties({ userId, userEmail }: UsePropertiesOptions): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const { user } = useAuth();

  const invalidate = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId && !userEmail) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let list = await propertyService.getProperties({
          userId: userId || undefined,
          email: userEmail || undefined,
        });

        if (isAgentTestAccount(userId, user?.email || userEmail)) {
          list = mergeAgentDemoProperties(getAgentDummyProperties(), list);
        }

        if (!cancelled) {
          setProperties(list);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useProperties] fetch error:', err?.message || err);
          setError(err?.message || 'Failed to load properties');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail, fetchKey]);

  return { properties, isLoading, error, invalidate };
}
