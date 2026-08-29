import { useEffect, useRef, useState } from 'react';
import type { ClassifyResponse } from '../types/govData';
import { propertySearchFallback } from '../types/govData';
import { classifySearchQuery } from '../services/govDataService';
import { trackEvent } from '../utils/analytics';

const DEBOUNCE_MS = 350;

interface UseClassifyQueryOptions {
  enabled: boolean;
  query: string;
}

interface UseClassifyQueryResult {
  classification: ClassifyResponse | null;
  isClassifying: boolean;
}

/**
 * Debounced classify call. Independent of scrape/search — pills can render first.
 */
export function useClassifyQuery({
  enabled,
  query,
}: UseClassifyQueryOptions): UseClassifyQueryResult {
  const [classification, setClassification] = useState<ClassifyResponse | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setClassification(null);
      setIsClassifying(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setClassification(null);
      setIsClassifying(false);
      return;
    }

    setIsClassifying(true);
    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(async () => {
      try {
        const result = await classifySearchQuery(trimmed);
        if (requestId !== requestIdRef.current) return;

        setClassification(result);
        trackEvent('gov_data_classify', {
          intent: result.intent,
          fallback: result.fallback,
          cacheHit: result.cacheHit,
          confidence: result.confidence,
        });
      } catch {
        if (requestId !== requestIdRef.current) return;
        setClassification(propertySearchFallback());
        trackEvent('gov_data_classify_fallback', { reason: 'error' });
      } finally {
        if (requestId === requestIdRef.current) {
          setIsClassifying(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, query]);

  return { classification, isClassifying };
}
