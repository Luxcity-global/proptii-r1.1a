import { useEffect, useRef, useState } from 'react';
import type { Property } from '../types/property';
import type { BatchedFactsResponse, FactFlag } from '../types/govData';
import { fetchBatchedPropertyFacts } from '../services/govDataService';
import { resolveListingId } from '../utils/listingId';
import { reportHintFromFlags } from '../utils/reportHint';
import { trackEvent } from '../utils/analytics';

interface UseBatchedPropertyFactsResult {
  factsByListingId: BatchedFactsResponse;
  isFactsLoading: boolean;
  getFlagsFor: (property: Property) => FactFlag[] | null;
  getHintFor: (property: Property) => string | null;
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
  const requestedListingIdsRef = useRef<Set<string>>(new Set());

  // Reset tracked IDs if results are emptied (fresh search)
  useEffect(() => {
    if (results.length === 0) {
      requestedListingIdsRef.current.clear();
      setFactsByListingId({});
      setIsFactsLoading(false);
    }
  }, [results.length]);

  useEffect(() => {
    if (!enabled || results.length === 0) {
      return;
    }

    // Identify only new listings that haven't been requested yet
    const unrequestedListingIds: string[] = [];
    const unrequestedUprns: string[] = [];

    results.forEach((p) => {
      const id = resolveListingId(p);
      if (!requestedListingIdsRef.current.has(id)) {
        unrequestedListingIds.push(id);
        if (p.uprn) unrequestedUprns.push(p.uprn);
      }
    });

    if (unrequestedListingIds.length === 0) {
      return;
    }

    // Debounce by 400ms to accumulate incoming SSE stream chunks
    setIsFactsLoading(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      // Mark as requested before firing to avoid duplicate requests during transit
      unrequestedListingIds.forEach((id) => requestedListingIdsRef.current.add(id));

      try {
        const batch = await fetchBatchedPropertyFacts({
          listingIds: unrequestedListingIds,
          uprns: unrequestedUprns,
        });

        if (cancelled) return;

        setFactsByListingId((prev) => ({ ...prev, ...batch }));
        trackEvent('gov_data_facts_batch', {
          requested: unrequestedListingIds.length,
          resolved: Object.keys(batch).length,
        });
      } catch (err) {
        console.warn('[useBatchedPropertyFacts] Failed to fetch facts for batch:', err);
      } finally {
        if (!cancelled) {
          setIsFactsLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, results]);

  const getFlagsFor = (property: Property): FactFlag[] | null => {
    const id = resolveListingId(property);
    if (!(id in factsByListingId)) return null;
    return factsByListingId[id];
  };

  const getHintFor = (property: Property): string | null =>
    reportHintFromFlags(getFlagsFor(property), property.reportHint);

  const isUnresolved = (property: Property): boolean => {
    if (isFactsLoading) return false;
    const id = resolveListingId(property);
    return !(id in factsByListingId);
  };

  return { factsByListingId, isFactsLoading, getFlagsFor, getHintFor, isUnresolved };
}
