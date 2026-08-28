/**
 * flag.schema.ts
 *
 * Core types for the Government Data Intelligence Layer (R1.4).
 * These types are shared across ingest services, the facts store,
 * and all controller response shapes.
 *
 * IMPORTANT: Never add a 'clear' state unless the flag was explicitly
 * resolved by an ingest job or a compliance upload. Absent data = 'unresolved'.
 */

// ─── Audience ─────────────────────────────────────────────────────────────────

export type Audience = 'buyer' | 'tenant' | 'landlord' | 'agent' | 'homeowner';

export const AUDIENCES: Audience[] = ['buyer', 'tenant', 'landlord', 'agent', 'homeowner'];

// ─── Flag ─────────────────────────────────────────────────────────────────────

export type FlagSource =
  | 'hmlr'
  | 'os_ngd'
  | 'epc_register'
  | 'compliance_upload'
  | 'ea_flood'
  | 'historic_england'
  | 'police_uk';
export type FlagCadence = 'batch' | 'live';
export type FlagState = 'clear' | 'flagged' | 'unresolved';
export type FlagSeverity = 'high' | 'medium' | 'low' | 'info';

export interface Flag {
  /** e.g. "covenant_restriction", "epc_rating", "gas_cert_valid" */
  flagId: string;

  /** Data origin. Determines staleness cadence and trust level. */
  source: FlagSource;

  /** Whether this flag is updated on every request or via scheduled batch. */
  cadence: FlagCadence;

  /**
   * Resolved state.
   * - 'clear'      — ingest confirmed no issue
   * - 'flagged'    — ingest found a problem requiring attention
   * - 'unresolved' — data not yet ingested or ingest is stubbed
   *
   * NEVER fabricate 'clear' — absent data must always be 'unresolved'.
   */
  state: FlagState;

  /** Audience-blind severity used as a sorting signal before lens is applied. */
  baseSeverity: FlagSeverity;

  /** Human-readable detail string. Must NOT contain audience-specific framing. */
  detail: string | null;

  /** ISO timestamp of when this flag was last written by an ingest job. */
  ingestedAt: string; // ISO-8601, stored as Firestore Timestamp, serialised to string on read

  /**
   * If this flag came from a licensed product, the licence reference.
   * If from a compliance upload, the Firestore document ID of the source file.
   */
  sourceRef: string | null;

  /**
   * Set to true when the underlying licensed data product is not yet in hand.
   * Stubbed flags MUST be treated as 'unresolved' by the lens engine.
   */
  stubbed?: boolean;
}

// ─── Ingest Metadata ──────────────────────────────────────────────────────────

export interface IngestSource {
  cadence: string;      // e.g. "monthly", "quarterly"
  lastIngestAt: string; // ISO-8601
  staleAfterDays: number;
}

export interface IngestMeta {
  hmlr: IngestSource | null;
  os_ngd: IngestSource | null;
  epc: IngestSource | null;
  compliance: { lastUpdatedAt: string } | null;
}

// ─── PropertyFactsDoc ─────────────────────────────────────────────────────────

export type MatchStatus = 'exact' | 'partial' | 'none';

/**
 * Top-level Firestore document in the `propertyFacts` collection.
 * Keyed by `uprn` when matched; falls back to `listing_id` for unmatched.
 */
export interface PropertyFactsDoc {
  /** Unique Property Reference Number — primary key when available. */
  uprn: string | null;

  /** Proptii listing ID — fallback key when UPRN not yet matched. */
  listing_id: string | null;

  /** HMLR title number. Only populated when licensed product is in hand. */
  title_number: string | null;

  /**
   * How well the listing address was matched to a UPRN.
   * - 'exact'   — full PAON + SAON + postcode match
   * - 'partial' — postcode + street match, PAON approximate
   * - 'none'    — no UPRN resolved; facts keyed by listing_id only
   */
  matchStatus: MatchStatus;

  /** Ordered list of all resolved flags from all sources. */
  flags: Flag[];

  /** Per-source ingest metadata for staleness checking. */
  ingestMeta: IngestMeta;

  /** ISO-8601 timestamp of last write to this document. */
  updatedAt: string;
}

// ─── Runtime Flag (Firestore `runtimeFlags` collection) ───────────────────────

/**
 * Allows zero-deploy feature rollback by toggling a Firestore document.
 * Key: `gov_data_layer`
 */
export interface RuntimeFlag {
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}
