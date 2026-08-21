/** Government-data intelligence layer (r1.4) — shared contracts. */

export type SearchIntent =
  | 'property_search'
  | 'specific_address'
  | 'general_answerable'
  | 'general_too_broad'
  | 'off_topic';

/** Data enum — UI copy may say "renter" but code always uses tenant. */
export type Audience =
  | 'buyer'
  | 'tenant'
  | 'landlord'
  | 'agent'
  | 'homeowner';

export type Tenure = 'rent' | 'buy';

export type FlagState = 'clear' | 'flagged' | 'unresolved';

export type MatchStatus = 'exact' | 'partial' | 'none';

export type LensSeverity = 'info' | 'caution' | 'alert';

export interface ClassifyEntities {
  location: string | null;
  radius_hint: string | null;
  bedrooms: number | null;
  tenure: Tenure | null;
  price_max: number | null;
  address_full: string | null;
}

export interface ClassifyResponse {
  intent: SearchIntent;
  audience: Audience | null;
  entities: ClassifyEntities;
  confidence: number;
  fallback: boolean;
  cacheHit: boolean;
}

export interface RuntimeFlags {
  gov_data_layer: boolean;
}

export interface FactFlag {
  id: string;
  label: string;
  state: FlagState;
  detail?: string;
}

/** Batched facts: absent key = unresolved, not clear. */
export type BatchedFactsResponse = Record<string, FactFlag[]>;

export interface PropertyFactsResponse {
  listingId: string;
  uprn: string | null;
  titleNumber: string | null;
  flags: FactFlag[];
  match: MatchStatus;
}

export interface ReportLens {
  severity: LensSeverity;
  verdictText: string;
  steps: string[];
}

export interface PropertyReportResponse {
  facts: FactFlag[];
  lens: ReportLens;
  generatedFor: string;
}

export const EMPTY_ENTITIES: ClassifyEntities = {
  location: null,
  radius_hint: null,
  bedrooms: null,
  tenure: null,
  price_max: null,
  address_full: null,
};

export const propertySearchFallback = (): ClassifyResponse => ({
  intent: 'property_search',
  audience: null,
  entities: { ...EMPTY_ENTITIES },
  confidence: 0,
  fallback: true,
  cacheHit: false,
});
