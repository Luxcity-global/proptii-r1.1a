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
  location?: string | null;
  cleanLocation?: string | null;
  radius_hint?: string | null;
  radius?: number | null;
  bedrooms?: number | string | null;
  minBeds?: number | null;
  maxBeds?: number | null;
  tenure?: Tenure | null;
  channel?: 'rent' | 'sale' | null;
  price_max?: number | string | null;
  price_min?: number | string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  propertyType?: string | null;
  property_type?: string | null;
  address_full?: string | null;
  intentSummary?: string | null;
  expandedKeywords?: string[] | null;
  amenities?: string[] | null;
  /** First-class amenity signals extracted by the AI classifier. */
  pet_friendly?: boolean | null;
  bills_included?: boolean | null;
  parking?: boolean | null;
  balcony_or_garden?: boolean | null;
  furnished?: 'furnished' | 'unfurnished' | null;
  [key: string]: any;
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

/** Diagnostic overlay step, driven by backend `sources[]`. */
export interface ReportSource {
  id?: string;
  title: string;
  detail?: string;
  /** Backend streaming report module state. */
  state?: 'loading' | 'clear' | 'unresolved';
}

export interface ReportLedgerRow {
  label: string;
  value: string;
  qualifier?: string;
}

export type ReportEntryTone = 'resolved' | 'note' | 'pending';

export type AreaSurface = 'seal' | 'ink' | 'stamp';

export interface LocalAreaCheck {
  id: string;
  title: string;
  status: string;
  tone: ReportEntryTone;
  surface?: AreaSurface;
  finding: string;
  source: string;
}

/** Structured renter report body (Parts A–C + local area). */
export interface RenterReportContent {
  precisionLine: string;
  whatToWatchTitle: string;
  whatToWatchBody: string;
  partATitle: string;
  partARows: ReportLedgerRow[];
  partANote: string;
  partASource: string;
  partBTitle: string;
  partBBody: string;
  partBSource: string;
  partCTitle: string;
  partCBody: string;
  partCStatus: string;
  partCSource: string;
  localIntro: string;
  localArea: LocalAreaCheck[];
  paidCopy: string;
  mapSource: string;
  steps: string[];
  footerAudience: string;
}

export interface PropertyReportResponse {
  facts: FactFlag[];
  lens: ReportLens;
  generatedFor: string;
  /** Optional diagnostic steps from the backend. */
  sources?: ReportSource[];
  /** Google Maps Embed query. Empty hides the iframe but keeps the reserved map slot. */
  map?: { embedQuery?: string | null };
  /** Optional search-card badge. Absent = no hint chip. */
  reportHint?: string | null;
  renter?: RenterReportContent;
}

export const EMPTY_ENTITIES: ClassifyEntities = {
  location: null,
  radius_hint: null,
  bedrooms: null,
  tenure: null,
  price_max: null,
  address_full: null,
  pet_friendly: null,
  bills_included: null,
  parking: null,
  balcony_or_garden: null,
  furnished: null,
};

export const propertySearchFallback = (): ClassifyResponse => ({
  intent: 'property_search',
  audience: null,
  entities: { ...EMPTY_ENTITIES },
  confidence: 0,
  fallback: true,
  cacheHit: false,
});
