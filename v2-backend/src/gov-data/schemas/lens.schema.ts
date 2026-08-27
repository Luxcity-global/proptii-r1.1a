/**
 * lens.schema.ts
 *
 * Types for the Lens Engine (Sprint 1.2).
 * A "lens" is an audience-specific transformation applied to a raw Flag[]
 * to produce human-readable, priority-ordered LensResult[].
 *
 * CRITICAL: The lens layer MUST NOT alter the underlying Flag[] data.
 * It is a read-only projection. The facts payload must be byte-for-byte
 * identical before and after a lens switch — this is an integration test
 * requirement (Sprint 3.2).
 */

import type { Audience, FlagState } from './flag.schema';

// ─── LensRule ─────────────────────────────────────────────────────────────────

/**
 * A single rule stored in the Firestore `lensRules` collection.
 * Rules are loaded at module init and cached in-memory — no per-request
 * Firestore reads.
 */
export interface LensRule {
  /** The flagId this rule applies to (matches Flag.flagId). */
  flagId: string;

  /** Audience this rule is shown to. */
  audience: Audience;

  /** Lower number = higher priority in the rendered list. */
  displayPriority: number;

  /** Short audience-specific headline, e.g. "Restrictive covenant detected". */
  headline: string;

  /** Longer audience-specific explanation. May differ between audiences. */
  detail: string;

  /**
   * States in which this rule is suppressed (not shown).
   * e.g. suppressIfState: ['clear'] means only show when flagged or unresolved.
   * e.g. suppressIfState: ['clear', 'unresolved'] means only show when flagged.
   */
  suppressIfState: FlagState[];
}

// ─── LensResult ───────────────────────────────────────────────────────────────

/**
 * A single rendered item returned by the Lens Engine.
 * This is what the frontend receives — never the raw Flag directly.
 */
export interface LensResult {
  /** The originating flag ID. */
  flagId: string;

  /** Audience this result was generated for. */
  audience: Audience;

  /** Display priority (lower = first). */
  displayPriority: number;

  /** Audience-specific headline. */
  headline: string;

  /** Audience-specific detail. */
  detail: string;

  /** The underlying flag state — preserved for UI badge colouring. */
  state: FlagState;

  /** Echoed from the originating Flag.baseSeverity. */
  severity: string;

  /** True when the originating flag is stubbed (no licensed data yet). */
  stubbed: boolean;
}
