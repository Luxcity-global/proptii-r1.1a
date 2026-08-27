/**
 * lens-engine.service.ts
 *
 * Sprint 1.2 — Lens Engine.
 *
 * Transforms a raw Flag[] into an audience-specific LensResult[].
 *
 * ─── Design rules (load-bearing, do not relax) ───────────────────────────────
 *
 * 1. PURE READ — getLens() never mutates the input flags array. The caller's
 *    Flag[] is byte-identical before and after. This is tested explicitly in
 *    lens-engine.service.spec.ts (Sprint 3.2 DoD requirement).
 *
 * 2. NO PER-REQUEST FIRESTORE — rules are loaded once at module init via
 *    loadRules() and cached in memory. getLens() is synchronous after init.
 *
 * 3. STUBBED = UNRESOLVED — a flag with stubbed: true is treated as
 *    'unresolved' regardless of its state field value. The lens never
 *    promotes a stubbed flag to 'clear'.
 *
 * 4. ABSENT KEY = UNRESOLVED — if no LensRule exists for a (flagId, audience)
 *    pair, a minimal fallback LensResult is returned so the UI can still show
 *    an 'unresolved' badge. The system never silently drops a flag.
 *
 * ─── Audience enum ───────────────────────────────────────────────────────────
 * buyer | tenant | landlord | agent | homeowner
 * Use 'tenant', never 'renter' — matches AuthContext role enum.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { Flag, Audience } from '../schemas/flag.schema';
import type { LensRule, LensResult } from '../schemas/lens.schema';

export const LENS_RULES_COLLECTION = 'lensRules';

@Injectable()
export class LensEngineService implements OnModuleInit {
  private readonly logger = new Logger(LensEngineService.name);

  /**
   * In-memory rule cache. Keyed as `${flagId}::${audience}` for O(1) lookup.
   * Populated at module init; reloaded manually via reloadRules() if needed.
   */
  private ruleCache = new Map<string, LensRule>();

  async onModuleInit(): Promise<void> {
    await this.loadRules();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Transforms a raw Flag[] into an audience-specific LensResult[].
   *
   * CONTRACT:
   *   - Input `flags` array is NEVER mutated.
   *   - Output is sorted by displayPriority ascending (lower number = first).
   *   - Stubbed flags are treated as 'unresolved' regardless of flag.state.
   *   - If no rule exists for (flagId, audience), a fallback result is emitted
   *     so no flag is silently lost.
   *   - suppressIfState is applied AFTER the stubbed→unresolved override.
   *
   * @param flags    Raw Flag[] from FactsStoreService — NOT mutated.
   * @param audience The audience to render for.
   * @returns        Sorted LensResult[], ready for API response.
   */
  getLens(flags: Flag[], audience: Audience): LensResult[] {
    const results: LensResult[] = [];

    for (const flag of flags) {
      // ── 1. Stubbed override: treat stubbed flags as 'unresolved' ──────────
      const effectiveState = flag.stubbed ? 'unresolved' : flag.state;

      // ── 2. Look up the rule for this (flagId, audience) pair ──────────────
      const rule = this.ruleCache.get(cacheKey(flag.flagId, audience));

      if (!rule) {
        // No rule = fallback: emit a minimal 'unresolved' result so the UI
        // can show a badge rather than silently hiding the flag.
        results.push(this.fallbackResult(flag, audience, effectiveState));
        continue;
      }

      // ── 3. Apply suppressIfState ──────────────────────────────────────────
      if (rule.suppressIfState.includes(effectiveState)) {
        continue; // suppressed — do not include in output
      }

      // ── 4. Build the LensResult ───────────────────────────────────────────
      results.push({
        flagId:          flag.flagId,
        audience,
        displayPriority: rule.displayPriority,
        headline:        rule.headline,
        detail:          rule.detail,
        state:           effectiveState,
        severity:        flag.baseSeverity,
        stubbed:         flag.stubbed ?? false,
      });
    }

    // ── 5. Sort by displayPriority ascending (lower = more important) ───────
    results.sort((a, b) => a.displayPriority - b.displayPriority);

    return results;
  }

  /**
   * Forces a reload of rules from Firestore.
   * Call this after seeding lensRules, or via an admin endpoint in dev.
   */
  async reloadRules(): Promise<void> {
    await this.loadRules();
  }

  /**
   * Returns the number of rules currently cached.
   * Useful for health checks and diagnostics.
   */
  get ruleCount(): number {
    return this.ruleCache.size;
  }

  // ── Rule loading ───────────────────────────────────────────────────────────

  /**
   * Loads all documents from the `lensRules` Firestore collection into memory.
   * Falls back to the hardcoded DEFAULT_RULES if Firestore is unavailable,
   * so the engine works in dev/test without a live Firestore connection.
   */
  private async loadRules(): Promise<void> {
    const db = admin.apps.length
      ? (() => { try { return admin.firestore(); } catch { return null; } })()
      : null;

    if (!db) {
      this.logger.warn(
        '[LensEngine] Firestore unavailable — loading default rules from seed file.',
      );
      this.populateCache(DEFAULT_RULES);
      return;
    }

    try {
      const snap = await db.collection(LENS_RULES_COLLECTION).get();
      if (snap.empty) {
        this.logger.warn(
          '[LensEngine] lensRules collection is empty — loading default rules. ' +
          'Run the lens-rules seed script to populate Firestore.',
        );
        this.populateCache(DEFAULT_RULES);
        return;
      }

      const rules: LensRule[] = snap.docs.map(d => d.data() as LensRule);
      this.populateCache(rules);
      this.logger.log(`[LensEngine] Loaded ${rules.length} lens rules from Firestore.`);
    } catch (err: any) {
      this.logger.error(
        `[LensEngine] Failed to load rules from Firestore: ${err?.message}. ` +
        'Falling back to default rules.',
      );
      this.populateCache(DEFAULT_RULES);
    }
  }

  private populateCache(rules: LensRule[]): void {
    this.ruleCache.clear();
    for (const rule of rules) {
      this.ruleCache.set(cacheKey(rule.flagId, rule.audience), rule);
    }
  }

  // ── Fallback result ────────────────────────────────────────────────────────

  /**
   * Used when no LensRule exists for a (flagId, audience) pair.
   * Returns a low-priority, honest 'unresolved' result so nothing is hidden.
   */
  private fallbackResult(
    flag: Flag,
    audience: Audience,
    effectiveState: Flag['state'],
  ): LensResult {
    return {
      flagId:          flag.flagId,
      audience,
      displayPriority: 999,
      headline:        `${flag.flagId.replace(/_/g, ' ')} — status unknown`,
      detail:          flag.detail ?? 'No additional information available.',
      state:           effectiveState,
      severity:        flag.baseSeverity,
      stubbed:         flag.stubbed ?? false,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cacheKey(flagId: string, audience: Audience): string {
  return `${flagId}::${audience}`;
}

// ── Default rules (seed data) ─────────────────────────────────────────────────
//
// These are the authoritative lens rules for R1.4.
// They are also written to Firestore by src/gov-data/seeds/lens-rules.seed.ts.
// Edit them here; the seed script reads this array directly.
//
// suppressIfState guidance:
//   ['clear']             — show only when flagged or unresolved
//   ['clear', 'unresolved'] — show only when explicitly flagged
//   []                    — always show (e.g. a compliance badge)
//
// displayPriority:
//   1–9:   Critical / safety (gas cert, EICR)
//   10–19: Legal / compliance (covenants, EPC legality)
//   20–29: Financial / valuation signals
//   30–49: Informational
//   50+:   Background / confirmation badges

export const DEFAULT_RULES: LensRule[] = [

  // ── covenant_restriction ─────────────────────────────────────────────────

  {
    flagId: 'covenant_restriction', audience: 'buyer',
    displayPriority: 11,
    headline: 'Restrictive covenant on this property',
    detail:
      'A restrictive covenant limits how this property or land may be used. ' +
      'Examples include restrictions on extensions, business use, or sub-division. ' +
      'Ask your solicitor to review the title register before exchange.',
    suppressIfState: ['clear'],
  },
  {
    flagId: 'covenant_restriction', audience: 'tenant',
    displayPriority: 12,
    headline: 'Restrictive covenant noted',
    detail:
      'This property has a restrictive covenant on its title. ' +
      'This may affect certain alterations or uses. Your tenancy agreement ' +
      'should reflect any relevant restrictions.',
    suppressIfState: ['clear'],
  },
  {
    flagId: 'covenant_restriction', audience: 'landlord',
    displayPriority: 10,
    headline: 'Restrictive covenant on your title',
    detail:
      'Your title register shows a restrictive covenant. Ensure your tenancy ' +
      'agreements and permitted works clauses comply with this restriction. ' +
      'Contact your solicitor if you are unsure of the scope.',
    suppressIfState: ['clear'],
  },
  {
    flagId: 'covenant_restriction', audience: 'agent',
    displayPriority: 11,
    headline: 'Restrictive covenant — solicitor review recommended',
    detail:
      'The HMLR title register shows a restrictive covenant on this property. ' +
      'Advise your client to instruct a solicitor to review the covenant terms ' +
      'before proceeding. This data is updated monthly.',
    suppressIfState: ['clear'],
  },
  {
    flagId: 'covenant_restriction', audience: 'homeowner',
    displayPriority: 11,
    headline: 'Restrictive covenant on your property',
    detail:
      'Your property title carries a restrictive covenant. This may limit ' +
      'what changes you can make to the property or land. Speak to a ' +
      'conveyancer before undertaking any works or sale.',
    suppressIfState: ['clear'],
  },

  // ── epc_rating ───────────────────────────────────────────────────────────

  {
    flagId: 'epc_rating', audience: 'buyer',
    displayPriority: 20,
    headline: 'Energy Performance Certificate (EPC)',
    detail:
      'The EPC rating indicates this property\'s energy efficiency. ' +
      'Ratings D and below may indicate higher running costs. Properties ' +
      'rated below E cannot legally be let in England and Wales.',
    suppressIfState: [],
  },
  {
    flagId: 'epc_rating', audience: 'tenant',
    displayPriority: 15,
    headline: 'EPC rating — energy efficiency',
    detail:
      'This property\'s EPC rating gives you an indication of likely ' +
      'energy bills. A rating of E or below is the minimum legal standard ' +
      'for a rental property in England and Wales.',
    suppressIfState: [],
  },
  {
    flagId: 'epc_rating', audience: 'landlord',
    displayPriority: 10,
    headline: 'EPC compliance — Minimum Energy Efficiency Standard (MEES)',
    detail:
      'Properties rated below E cannot legally be let under the Minimum ' +
      'Energy Efficiency Standards. If your property is rated F or G, you ' +
      'must improve it or apply for a valid exemption before re-letting.',
    suppressIfState: [],
  },
  {
    flagId: 'epc_rating', audience: 'agent',
    displayPriority: 10,
    headline: 'EPC — MEES compliance check',
    detail:
      'Confirm the EPC rating meets the Minimum Energy Efficiency Standard (E or above) ' +
      'before marketing to let. A rating below E is unlettable without a registered exemption. ' +
      'EPC data is updated quarterly.',
    suppressIfState: [],
  },
  {
    flagId: 'epc_rating', audience: 'homeowner',
    displayPriority: 20,
    headline: 'Your EPC rating',
    detail:
      'Your Energy Performance Certificate shows how energy-efficient your ' +
      'home is. Improving your rating can reduce energy bills and increase ' +
      'property value. EPCs are valid for 10 years.',
    suppressIfState: [],
  },

  // ── gas_cert_valid ────────────────────────────────────────────────────────

  {
    flagId: 'gas_cert_valid', audience: 'buyer',
    displayPriority: 30,
    headline: 'Gas safety record',
    detail:
      'A current gas safety certificate has been uploaded by the landlord. ' +
      'All gas appliances must be inspected annually by a Gas Safe registered engineer.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'gas_cert_valid', audience: 'tenant',
    displayPriority: 5,
    headline: 'Gas safety certificate',
    detail:
      'Your landlord has uploaded a gas safety certificate. You are legally ' +
      'entitled to receive a copy within 28 days of moving in, or before ' +
      'your tenancy starts. Ask your landlord or agent if you have not received it.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'gas_cert_valid', audience: 'landlord',
    displayPriority: 2,
    headline: 'Gas safety certificate — annual legal requirement',
    detail:
      'You must have all gas appliances inspected annually by a Gas Safe ' +
      'registered engineer and provide the certificate to your tenant. ' +
      'Failure to do so is a criminal offence.',
    suppressIfState: [],
  },
  {
    flagId: 'gas_cert_valid', audience: 'agent',
    displayPriority: 2,
    headline: 'Gas safety certificate — compliance check',
    detail:
      'Confirm a current gas safety record is on file and has been issued ' +
      'to the tenant. This is a legal requirement under the Gas Safety ' +
      '(Installation and Use) Regulations 1998.',
    suppressIfState: [],
  },
  {
    flagId: 'gas_cert_valid', audience: 'homeowner',
    displayPriority: 30,
    headline: 'Gas safety record',
    detail:
      'A gas safety certificate confirms your appliances have been checked ' +
      'by a Gas Safe registered engineer. Annual checks are recommended for safety.',
    suppressIfState: ['unresolved'],
  },

  // ── electrical_cert_valid ─────────────────────────────────────────────────

  {
    flagId: 'electrical_cert_valid', audience: 'buyer',
    displayPriority: 31,
    headline: 'Electrical Installation Condition Report (EICR)',
    detail:
      'An EICR has been uploaded confirming the electrical installation has ' +
      'been inspected. EICRs are valid for up to 5 years in rental properties.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'electrical_cert_valid', audience: 'tenant',
    displayPriority: 6,
    headline: 'Electrical safety certificate (EICR)',
    detail:
      'Your landlord has provided an Electrical Installation Condition Report. ' +
      'This confirms the property\'s electrics have been inspected and are safe. ' +
      'You should receive a copy before or at the start of your tenancy.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'electrical_cert_valid', audience: 'landlord',
    displayPriority: 3,
    headline: 'EICR — 5-year legal requirement for rentals',
    detail:
      'The Electrical Safety Standards in the Private Rented Sector (England) ' +
      'Regulations 2020 require an EICR every 5 years. The report must be ' +
      'provided to new tenants before they move in, and existing tenants within 28 days.',
    suppressIfState: [],
  },
  {
    flagId: 'electrical_cert_valid', audience: 'agent',
    displayPriority: 3,
    headline: 'EICR — electrical compliance check',
    detail:
      'Confirm a valid EICR (no more than 5 years old) is on file and has ' +
      'been issued to the tenant. A satisfactory EICR is required under the ' +
      'Electrical Safety Standards Regulations 2020 for all private rentals.',
    suppressIfState: [],
  },
  {
    flagId: 'electrical_cert_valid', audience: 'homeowner',
    displayPriority: 31,
    headline: 'Electrical Installation Condition Report',
    detail:
      'An EICR confirms your home\'s electrical installation has been inspected. ' +
      'Recommended every 10 years for owner-occupied homes, every 5 years if letting.',
    suppressIfState: ['unresolved'],
  },

  // ── os_ngd_building_match ─────────────────────────────────────────────────

  {
    flagId: 'os_ngd_building_match', audience: 'buyer',
    displayPriority: 40,
    headline: 'Property confirmed in OS National Geographic Database',
    detail:
      'This property\'s address has been matched to a building record in the ' +
      'Ordnance Survey National Geographic Database, confirming its location ' +
      'and enabling government data checks.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'os_ngd_building_match', audience: 'tenant',
    displayPriority: 40,
    headline: 'Property address verified',
    detail:
      'This property\'s address has been verified against the Ordnance Survey ' +
      'national address database, enabling additional compliance data checks.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'os_ngd_building_match', audience: 'landlord',
    displayPriority: 40,
    headline: 'Property registered in OS NGD',
    detail:
      'Your property address has been matched in the OS National Geographic ' +
      'Database. This enables UPRN-based compliance data checks for your listing.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'os_ngd_building_match', audience: 'agent',
    displayPriority: 40,
    headline: 'UPRN resolved — OS NGD match confirmed',
    detail:
      'This property has a confirmed UPRN match in the OS NGD Buildings dataset. ' +
      'Government data checks (HMLR, EPC) can be associated to this property. ' +
      'OS NGD data is refreshed quarterly.',
    suppressIfState: ['unresolved'],
  },
  {
    flagId: 'os_ngd_building_match', audience: 'homeowner',
    displayPriority: 40,
    headline: 'Your property is in the OS database',
    detail:
      'Your property has been found in the Ordnance Survey national database. ' +
      'This enables government data checks to be linked to your address.',
    suppressIfState: ['unresolved'],
  },
];
