import { fetchWithApiFallback } from '../utils/apiEndpoints';
import {
  Audience,
  BatchedFactsResponse,
  ClassifyEntities,
  ClassifyResponse,
  EMPTY_ENTITIES,
  FactFlag,
  PropertyFactsResponse,
  PropertyReportResponse,
  ReportLens,
  RuntimeFlags,
  SearchIntent,
  propertySearchFallback,
} from '../types/govData';

const CLASSIFY_TIMEOUT_MS = 2500;
const FLAGS_TIMEOUT_MS = 4000;
const FACTS_TIMEOUT_MS = 5000;

const LOCAL_OVERRIDE_KEY = 'proptii_gov_data_layer';

const shouldUseLocalMocks = () =>
  import.meta.env.DEV || isGovDataLayerEnvOverride();

/** Dev/staging: force the layer on without waiting for Nest. */
export const isGovDataLayerEnvOverride = (): boolean => {
  if (import.meta.env.VITE_GOV_DATA_LAYER === 'true') return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(LOCAL_OVERRIDE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setGovDataLayerLocalOverride = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(LOCAL_OVERRIDE_KEY, 'true');
    } else {
      window.localStorage.removeItem(LOCAL_OVERRIDE_KEY);
    }
  } catch {
    /* ignore */
  }
};

/**
 * Heuristic classify used when the Nest endpoint is unavailable.
 * Lets filter pills render in local/dev; submit still falls back to /search.
 */
export function mockClassifyQuery(query: string): ClassifyResponse {
  const trimmed = query.trim();
  if (!trimmed) {
    return propertySearchFallback();
  }

  const lower = trimmed.toLowerCase();
  const entities: ClassifyEntities = { ...EMPTY_ENTITIES };

  const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|beds|br)\b/);
  if (bedMatch) {
    entities.bedrooms = parseInt(bedMatch[1], 10);
  } else if (/\bstudio\b/.test(lower)) {
    entities.bedrooms = 0;
  }

  const priceMatch =
    lower.match(/(?:under|below|max|up\s+to|less\s+than)\s*£?\s*([\d,]+)/i) ||
    lower.match(/£\s*([\d,]+)\s*(?:pcm|pw|per\s+month)?/i) ||
    lower.match(/([\d,]+)\s*(?:pcm|per\s+month)/i);
  if (priceMatch) {
    entities.price_max = parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }

  if (/\b(buy|buying|purchase|for\s+sale)\b/.test(lower)) {
    entities.tenure = 'buy';
  } else if (
    /\b(rent|renting|to\s+let|tenant)\b/.test(lower) ||
    /(?:^|[^a-z])pcm\b/.test(lower)
  ) {
    entities.tenure = 'rent';
  }

  const locationMatch = lower.match(
    /(?:in|near|around|at)\s+([a-z][a-z\s'-]{1,40}?)(?:\s+(?:under|below|for|with|near|within|£|\d)|$)/i,
  );
  if (locationMatch) {
    entities.location = locationMatch[1].trim().replace(/\s+/g, ' ');
  }

  const postcodeMatch = trimmed.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  const streetAddress = /^\d+\s+[A-Za-z]/.test(trimmed) && postcodeMatch;
  if (streetAddress || (postcodeMatch && /\d+\s+\w+/.test(trimmed))) {
    entities.address_full = trimmed;
  }

  let intent: SearchIntent = 'property_search';
  if (entities.address_full) {
    intent = 'specific_address';
  } else if (
    /^(what|how|when|why|can|do|does|is|are|should)\b/.test(lower) ||
    /\b(rights?|deposit|section\s*21|evict|notice)\b/.test(lower)
  ) {
    intent = lower.length > 80 ? 'general_too_broad' : 'general_answerable';
  } else if (/\b(weather|recipe|football|stock|crypto)\b/.test(lower)) {
    intent = 'off_topic';
  }

  let audience: Audience | null = null;
  if (/\b(landlord|letting\s+agent)\b/.test(lower)) audience = 'landlord';
  else if (/\bagent\b/.test(lower)) audience = 'agent';
  else if (/\b(buy|buyer|buying)\b/.test(lower)) audience = 'buyer';
  else if (/\b(homeowner|owner[- ]occupier)\b/.test(lower)) audience = 'homeowner';
  else if (entities.tenure === 'rent' || /\b(tenant|renter|renting)\b/.test(lower)) {
    audience = 'tenant';
  }

  const hasEntity = Object.values(entities).some((v) => v !== null);

  return {
    intent,
    audience,
    entities,
    confidence: hasEntity ? 0.55 : 0.35,
    fallback: false,
    cacheHit: false,
  };
}

/** Deterministic mock facts — every 3rd listing omitted (= unresolved). */
export function mockBatchedFacts(listingIds: string[]): BatchedFactsResponse {
  const out: BatchedFactsResponse = {};
  listingIds.forEach((id, index) => {
    if (index % 3 === 2) return;
    const flagged = index % 2 === 1;
    out[id] = [
      {
        id: 'flood',
        label: 'Flood risk',
        state: flagged ? 'flagged' : 'clear',
        detail: flagged ? 'Medium risk band in area' : 'No significant flood risk recorded',
      },
      {
        id: 'epc',
        label: 'EPC',
        state: 'clear',
        detail: 'Band C or better (mock)',
      },
      {
        id: 'title',
        label: 'Title match',
        state: flagged ? 'unresolved' : 'clear',
      },
    ];
  });
  return out;
}

export function mockPropertyFacts(
  listingId: string,
  uprn?: string | null,
): PropertyFactsResponse {
  const batch = mockBatchedFacts([listingId]);
  const flags = batch[listingId];
  if (!flags) {
    return {
      listingId,
      uprn: uprn ?? null,
      titleNumber: null,
      flags: [],
      match: 'none',
    };
  }
  return {
    listingId,
    uprn: uprn ?? null,
    titleNumber: null,
    flags,
    match: uprn ? 'exact' : 'partial',
  };
}

export function mockReportLens(audience: Audience | null): ReportLens {
  const role = audience || 'tenant';
  const copy: Record<Audience, ReportLens> = {
    tenant: {
      severity: 'caution',
      verdictText: 'As a renter, check deposit protection and repair obligations before you proceed.',
      steps: [
        'Confirm the deposit is protected in an approved scheme',
        'Ask for the latest EPC and gas safety certificate',
        'Note any flagged flood or title items with your agent',
      ],
    },
    buyer: {
      severity: 'info',
      verdictText: 'As a buyer, treat flagged items as conveyancing follow-ups, not deal-breakers by default.',
      steps: [
        'Share flagged facts with your solicitor',
        'Request title plan and covenants',
        'Budget for any remedial work hinted by EPC',
      ],
    },
    landlord: {
      severity: 'alert',
      verdictText: 'As a landlord, flagged compliance items may block a compliant let.',
      steps: [
        'Resolve unresolved title or safety flags before marketing',
        'Update EPC if below legal minimum',
        'Document flood disclosures for applicants',
      ],
    },
    agent: {
      severity: 'info',
      verdictText: 'As an agent, surface unresolved facts honestly — never present missing data as clear.',
      steps: [
        'Disclose flagged and unresolved items in particulars',
        'Chase landlord for missing certificates',
        'Keep the facts row unchanged when switching audience lens',
      ],
    },
    homeowner: {
      severity: 'info',
      verdictText: 'As a homeowner, use this lens to prioritise maintenance and insurance follow-ups.',
      steps: [
        'Review flood and title flags with your insurer',
        'Plan EPC improvements if selling or remortgaging',
        'Keep records of any remedial works',
      ],
    },
  };
  return copy[role];
}

export function mockPropertyReport(
  listingId: string,
  audience: Audience | null,
): PropertyReportResponse {
  const facts = mockPropertyFacts(listingId).flags;
  const stableFacts =
    facts.length > 0
      ? facts
      : ([
          { id: 'flood', label: 'Flood risk', state: 'unresolved' },
          { id: 'epc', label: 'EPC', state: 'unresolved' },
        ] as FactFlag[]);

  return {
    facts: stableFacts,
    lens: mockReportLens(audience),
    generatedFor: audience || 'tenant',
  };
}

export async function fetchRuntimeFlags(): Promise<RuntimeFlags> {
  if (isGovDataLayerEnvOverride()) {
    return { gov_data_layer: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FLAGS_TIMEOUT_MS);

  try {
    const { response } = await fetchWithApiFallback(
      '/flags',
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
      { retryOnNotFound: true },
    );

    if (response.ok) {
      const data = (await response.json()) as Partial<RuntimeFlags>;
      return { gov_data_layer: Boolean(data.gov_data_layer) };
    }
  } catch {
    /* fall through */
  } finally {
    clearTimeout(timeoutId);
  }

  if (import.meta.env.DEV) {
    return { gov_data_layer: true };
  }

  return { gov_data_layer: false };
}

export async function classifySearchQuery(query: string): Promise<ClassifyResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return propertySearchFallback();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);

  try {
    const { response } = await fetchWithApiFallback(
      '/search/classify',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmed }),
      },
      { retryOnNotFound: true },
    );

    if (!response.ok) {
      throw new Error(`classify HTTP ${response.status}`);
    }

    const data = (await response.json()) as ClassifyResponse;
    if (!data?.intent || data.fallback) {
      return propertySearchFallback();
    }

    return {
      intent: data.intent,
      audience: data.audience ?? null,
      entities: { ...EMPTY_ENTITIES, ...(data.entities || {}) },
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      fallback: Boolean(data.fallback),
      cacheHit: Boolean(data.cacheHit),
    };
  } catch {
    if (shouldUseLocalMocks()) {
      return mockClassifyQuery(trimmed);
    }
    return propertySearchFallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchBatchedPropertyFacts(input: {
  listingIds: string[];
  uprns?: string[];
}): Promise<BatchedFactsResponse> {
  const listingIds = input.listingIds.filter(Boolean);
  if (listingIds.length === 0) return {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACTS_TIMEOUT_MS);

  try {
    const { response } = await fetchWithApiFallback(
      '/properties/facts',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingIds,
          uprns: input.uprns?.filter(Boolean) ?? [],
        }),
      },
      { retryOnNotFound: true },
    );

    if (!response.ok) {
      throw new Error(`facts HTTP ${response.status}`);
    }

    return (await response.json()) as BatchedFactsResponse;
  } catch {
    if (shouldUseLocalMocks()) {
      return mockBatchedFacts(listingIds);
    }
    return {};
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPropertyFacts(
  listingId: string,
  uprn?: string | null,
): Promise<PropertyFactsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACTS_TIMEOUT_MS);
  const qs = uprn ? `?uprn=${encodeURIComponent(uprn)}` : '';

  try {
    const { response } = await fetchWithApiFallback(
      `/properties/${encodeURIComponent(listingId)}/facts${qs}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
      { retryOnNotFound: true },
    );

    if (!response.ok) {
      throw new Error(`property facts HTTP ${response.status}`);
    }

    return (await response.json()) as PropertyFactsResponse;
  } catch {
    if (shouldUseLocalMocks()) {
      return mockPropertyFacts(listingId, uprn);
    }
    return {
      listingId,
      uprn: uprn ?? null,
      titleNumber: null,
      flags: [],
      match: 'none',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPropertyReport(
  listingId: string,
  audience: Audience | null,
): Promise<PropertyReportResponse> {
  const qs = audience ? `?audience=${encodeURIComponent(audience)}` : '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACTS_TIMEOUT_MS);

  try {
    const { response } = await fetchWithApiFallback(
      `/properties/${encodeURIComponent(listingId)}/report${qs}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
      { retryOnNotFound: true },
    );

    if (!response.ok) {
      throw new Error(`report HTTP ${response.status}`);
    }

    return (await response.json()) as PropertyReportResponse;
  } catch {
    if (shouldUseLocalMocks()) {
      return mockPropertyReport(listingId, audience);
    }
    return {
      facts: [],
      lens: mockReportLens(audience),
      generatedFor: audience || 'tenant',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Lens-only fetch — must not be paired with a facts remount in the UI. */
export async function fetchPropertyLens(
  listingId: string,
  audience: Audience | null,
): Promise<ReportLens> {
  const qs = audience ? `?audience=${encodeURIComponent(audience)}` : '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACTS_TIMEOUT_MS);

  try {
    const { response } = await fetchWithApiFallback(
      `/properties/${encodeURIComponent(listingId)}/lens${qs}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
      { retryOnNotFound: true },
    );

    if (!response.ok) {
      throw new Error(`lens HTTP ${response.status}`);
    }

    const data = (await response.json()) as { lens?: ReportLens } | ReportLens;
    if ('lens' in data && data.lens) return data.lens;
    return data as ReportLens;
  } catch {
    return mockReportLens(audience);
  } finally {
    clearTimeout(timeoutId);
  }
}
