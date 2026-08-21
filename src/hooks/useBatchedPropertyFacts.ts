import { useEffect, useMemo, useRef, useState } from 'react';
import type { Property } from '../types/property';
import type { BatchedFactsResponse, FactFlag } from '../types/govData';
import { fetchBatchedPropertyFacts } from '../services/govDataService';
import { resolveListingId } from '../utils/listingId';
import { trackEvent } from '../utils/analytics';

interface UseBatchedPropertyFactsResult {
  factsByListingId: BatchedFactsResponse;
  isFactsLoading: boolean;
  getFlagsFor: (property: Property) => FactFlag[] | null;
  isUnresolved: (property: Property) => boolean;
}

/**
 * Fetches batched facts independently of scrape loading.
 * Absent keys mean unresolved — never treat as clear.
 */
export function useBatchedPropertyFacts(
  enabled: boolean,
  results: Property[],
): UseBatchedPropertyFactsResult {
  const [factsByListingId, setFactsByListingId] = useState<BatchedFactsResponse>({});
  const [isFactsLoading, setIsFactsLoading] = useState(false);
  const lastKeyRef = useRef('');

  const listingPayload = useMemo(() => {
    const listingIds: string[] = [];
    const uprns: string[] = [];
    results.forEach((p) => {
      const id = resolveListingId(p);
      listingIds.push(id);
      if (p.uprn) uprns.push(p.uprn);
    });
    return { listingIds, uprns };
  }, [results]);

  useEffect(() => {
    if (!enabled || listingPayload.listingIds.length === 0) {
      setFactsByListingId({});
      setIsFactsLoading(false);
      return;
    }

    const key = listingPayload.listingIds.join('|');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;
    setIsFactsLoading(true);

    void (async () => {
      const batch = await fetchBatchedPropertyFacts(listingPayload);
      if (cancelled) return;
      setFactsByListingId(batch);
      setIsFactsLoading(false);
      trackEvent('gov_data_facts_batch', {
        requested: listingPayload.listingIds.length,
        resolved: Object.keys(batch).length,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, listingPayload]);

  const getFlagsFor = (property: Property): FactFlag[] | null => {
    const id = resolveListingId(property);
    if (!(id in factsByListingId)) return null;
    return factsByListingId[id];
  };

  const isUnresolved = (property: Property): boolean => {
    if (isFactsLoading) return false;
    const id = resolveListingId(property);
    return !(id in factsByListingId);
  };

  return { factsByListingId, isFactsLoading, getFlagsFor, isUnresolved };
}
