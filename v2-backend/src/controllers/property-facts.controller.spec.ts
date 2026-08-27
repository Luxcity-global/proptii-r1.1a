/**
 * property-facts.controller.spec.ts
 *
 * Unit tests for PropertyFactsController — Sprint 2.2 + 3.1 DoD.
 *
 * ─── Critical PRD assertions (must all pass before going live) ───────────────
 *
 * 1. ABSENCE = UNRESOLVED, NEVER 'clear'
 *    An absent UPRN/listingId must NOT appear in the response map.
 *    The client is responsible for treating a missing key as 'unresolved'.
 *    This is the most important test in the entire Phase 4 suite.
 *
 * 2. NO NULL ENTRIES in the batched response map.
 *    Absent ids are silently omitted — null entries would be indistinguishable
 *    from documents that explicitly state 'clear' on all flags.
 *
 * 3. matchStatus correctly reflects 'exact' | 'partial' | 'none'.
 *
 * 4. 404 only when the document truly does not exist — NOT when flags: [].
 *    An empty flags array is a valid state (e.g. compliance docs not yet uploaded).
 *
 * Test surface:
 *   A) Batched — basic response map shape
 *   B) Batched — ABSENCE = UNRESOLVED (PRD critical assertion)
 *   C) Batched — no null entries for missing ids
 *   D) Batched — empty body → empty map (not error)
 *   E) Single  — UPRN lookup path
 *   F) Single  — listingId fallback path
 *   G) Single  — 404 when doc does not exist
 *   H) Single  — 200 with empty flags[] (not 404) — valid state
 *   I) Single  — matchStatus echoed correctly (exact / partial / none)
 *   J) Single  — titleNumber returned when available
 *
 * Run:
 *   npx vitest run --config vitest.backend.config.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PropertyFactsController } from './property-facts.controller';
import type { FactsStoreService }  from '../gov-data/services/facts-store.service';
import type { UprnMatchService }   from '../gov-data/services/uprn-match.service';
import type { PropertyFactsDoc, Flag } from '../gov-data/schemas/flag.schema';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeFlag(flagId: string, state: 'clear' | 'flagged' | 'unresolved'): Flag {
  return {
    flagId,
    source:       'compliance_upload',
    cadence:      'live',
    state,
    baseSeverity: 'high',
    detail:       null,
    ingestedAt:   '2026-01-01T00:00:00.000Z',
    sourceRef:    null,
    stubbed:      false,
  };
}

function makeDoc(overrides: Partial<PropertyFactsDoc> = {}): PropertyFactsDoc {
  return {
    uprn:         null,
    listing_id:   'listing-001',
    title_number: null,
    matchStatus:  'none',
    flags:        [],
    ingestMeta:   { hmlr: null, os_ngd: null, epc: null, compliance: null },
    updatedAt:    '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ── Mock factories ────────────────────────────────────────────────────────────

function makeMockFactsStore(
  byUprn: Map<string, PropertyFactsDoc> = new Map(),
  byListingId: Map<string, PropertyFactsDoc> = new Map(),
  batch: Map<string, PropertyFactsDoc> = new Map(),
): FactsStoreService {
  return {
    getByUprn:      vi.fn(async (uprn: string)      => byUprn.get(uprn)      ?? null),
    getByListingId: vi.fn(async (id: string)         => byListingId.get(id)   ?? null),
    getBatch:       vi.fn(async (_ids: string[], _uprns: string[]) => batch),
  } as unknown as FactsStoreService;
}

function makeMockUprnMatch(): UprnMatchService {
  return {
    match: vi.fn().mockResolvedValue({ uprn: null, matchStatus: 'none', score: 0 }),
  } as unknown as UprnMatchService;
}

function makeController(
  factsStore: FactsStoreService,
  uprnMatch?: UprnMatchService,
): PropertyFactsController {
  return new PropertyFactsController(factsStore, uprnMatch ?? makeMockUprnMatch());
}

// ── A: Batched — basic response map ──────────────────────────────────────────

describe('PropertyFactsController.getBatchFacts() — basic', () => {
  it('returns a map keyed by the requested listingId', async () => {
    const doc   = makeDoc({ listing_id: 'listing-001', flags: [makeFlag('gas_cert_valid', 'clear')] });
    const batch = new Map([['listing-001', doc]]);
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ listingIds: ['listing-001'] });

    expect(result['listing-001']).toBeDefined();
    expect(result['listing-001'].flags[0].flagId).toBe('gas_cert_valid');
  });

  it('returns a map keyed by the requested UPRN', async () => {
    const doc   = makeDoc({ uprn: 'UPRN12345', matchStatus: 'exact' });
    const batch = new Map([['UPRN12345', doc]]);
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ uprns: ['UPRN12345'] });

    expect(result['UPRN12345']).toBeDefined();
    expect(result['UPRN12345'].matchStatus).toBe('exact');
  });

  it('returns a plain object (not a Map)', async () => {
    const batch = new Map([['listing-001', makeDoc()]]);
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ listingIds: ['listing-001'] });

    expect(result).not.toBeInstanceOf(Map);
    expect(typeof result).toBe('object');
  });
});

// ── B: ABSENCE = UNRESOLVED — THE CRITICAL PRD TEST ─────────────────────────

describe('PropertyFactsController.getBatchFacts() — ABSENCE = UNRESOLVED (PRD §2.2)', () => {
  it('does NOT include a key for an absent listingId', async () => {
    // getBatch returns a map with only 1 of the 2 requested ids
    const batch = new Map([['listing-001', makeDoc()]]);
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({
      listingIds: ['listing-001', 'listing-MISSING'],
    });

    // listing-001 is present, listing-MISSING must be ABSENT (not null, not undefined entry)
    expect(result['listing-001']).toBeDefined();
    expect('listing-MISSING' in result).toBe(false);
  });

  it('does NOT include a key for an absent UPRN', async () => {
    const batch = new Map<string, PropertyFactsDoc>(); // empty — no matches
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ uprns: ['UPRN_DOES_NOT_EXIST'] });

    expect('UPRN_DOES_NOT_EXIST' in result).toBe(false);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('returns empty map (not error) when NO ids match — caller treats this as all-unresolved', async () => {
    const batch = new Map<string, PropertyFactsDoc>();
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({
      listingIds: ['missing-1', 'missing-2', 'missing-3'],
    });

    expect(result).toEqual({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ── C: No null entries ────────────────────────────────────────────────────────

describe('PropertyFactsController.getBatchFacts() — no null entries', () => {
  it('values in the response are PropertyFactsDocs, never null', async () => {
    const batch = new Map([
      ['listing-001', makeDoc({ flags: [makeFlag('gas_cert_valid', 'clear')] })],
      ['listing-002', makeDoc({ flags: [] })],
    ]);
    const ctrl = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ listingIds: ['listing-001', 'listing-002'] });

    for (const value of Object.values(result)) {
      expect(value).not.toBeNull();
      expect(typeof value).toBe('object');
      expect(Array.isArray(value.flags)).toBe(true);
    }
  });
});

// ── D: Empty body ─────────────────────────────────────────────────────────────

describe('PropertyFactsController.getBatchFacts() — empty body', () => {
  it('returns empty map when both listingIds and uprns are absent', async () => {
    const batch = new Map<string, PropertyFactsDoc>();
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({});

    expect(result).toEqual({});
  });

  it('returns empty map when both arrays are empty', async () => {
    const batch = new Map<string, PropertyFactsDoc>();
    const ctrl  = makeController(makeMockFactsStore(new Map(), new Map(), batch));

    const result = await ctrl.getBatchFacts({ listingIds: [], uprns: [] });

    expect(result).toEqual({});
  });
});

// ── E: Single — UPRN lookup path ──────────────────────────────────────────────

describe('PropertyFactsController.getSingleFacts() — UPRN path', () => {
  it('tries UPRN lookup first when uprn param is provided', async () => {
    const doc        = makeDoc({ uprn: 'UPRN99', matchStatus: 'exact' });
    const byUprn     = new Map([['UPRN99', doc]]);
    const factsStore = makeMockFactsStore(byUprn);
    const ctrl       = makeController(factsStore);

    const result = await ctrl.getSingleFacts('listing-001', 'UPRN99');

    expect(factsStore.getByUprn).toHaveBeenCalledWith('UPRN99');
    expect(result.uprn).toBe('UPRN99');
    expect(result.match).toBe('exact');
  });

  it('skips UPRN lookup when no uprn param provided', async () => {
    const doc           = makeDoc({ listing_id: 'listing-001' });
    const byListingId   = new Map([['listing-001', doc]]);
    const factsStore    = makeMockFactsStore(new Map(), byListingId);
    const ctrl          = makeController(factsStore);

    await ctrl.getSingleFacts('listing-001', undefined);

    expect(factsStore.getByUprn).not.toHaveBeenCalled();
    expect(factsStore.getByListingId).toHaveBeenCalledWith('listing-001');
  });
});

// ── F: Single — listingId fallback ────────────────────────────────────────────

describe('PropertyFactsController.getSingleFacts() — listingId fallback', () => {
  it('falls back to listingId when UPRN lookup returns null', async () => {
    const doc         = makeDoc({ listing_id: 'listing-001' });
    const byListingId = new Map([['listing-001', doc]]);
    // UPRN lookup returns null, listingId lookup returns doc
    const factsStore  = makeMockFactsStore(new Map(), byListingId);
    const ctrl        = makeController(factsStore);

    const result = await ctrl.getSingleFacts('listing-001', 'UPRN_NOT_FOUND');

    expect(factsStore.getByListingId).toHaveBeenCalledWith('listing-001');
    expect(result.listingId).toBe('listing-001');
  });

  it('returns listingId in response echoing the route param', async () => {
    const doc         = makeDoc({ listing_id: 'listing-xyz' });
    const byListingId = new Map([['listing-xyz', doc]]);
    const ctrl        = makeController(makeMockFactsStore(new Map(), byListingId));

    const result = await ctrl.getSingleFacts('listing-xyz');

    expect(result.listingId).toBe('listing-xyz');
  });
});

// ── G: Single — 404 when doc does not exist ───────────────────────────────────

describe('PropertyFactsController.getSingleFacts() — 404', () => {
  it('throws NotFoundException when no doc exists for the listingId', async () => {
    const ctrl = makeController(makeMockFactsStore()); // all lookups return null

    await expect(ctrl.getSingleFacts('unknown-listing')).rejects.toThrow(NotFoundException);
  });

  it('404 error message mentions the listingId', async () => {
    const ctrl = makeController(makeMockFactsStore());

    try {
      await ctrl.getSingleFacts('my-listing-123');
      expect.fail('Should have thrown');
    } catch (e: any) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e.message).toContain('my-listing-123');
    }
  });
});

// ── H: Single — empty flags is valid (not 404) ───────────────────────────────

describe('PropertyFactsController.getSingleFacts() — empty flags (valid, not 404)', () => {
  it('returns 200 with empty flags array when doc exists but has no flags', async () => {
    const doc         = makeDoc({ flags: [], listing_id: 'listing-empty' });
    const byListingId = new Map([['listing-empty', doc]]);
    const ctrl        = makeController(makeMockFactsStore(new Map(), byListingId));

    const result = await ctrl.getSingleFacts('listing-empty');

    expect(result.flags).toEqual([]);
    expect(Array.isArray(result.flags)).toBe(true);
  });
});

// ── I: matchStatus correctly echoed ──────────────────────────────────────────

describe('PropertyFactsController.getSingleFacts() — matchStatus', () => {
  const cases: Array<'exact' | 'partial' | 'none'> = ['exact', 'partial', 'none'];

  for (const status of cases) {
    it(`returns match="${status}" when doc.matchStatus is "${status}"`, async () => {
      const doc         = makeDoc({ matchStatus: status });
      const byListingId = new Map([['listing-001', doc]]);
      const ctrl        = makeController(makeMockFactsStore(new Map(), byListingId));

      const result = await ctrl.getSingleFacts('listing-001');

      expect(result.match).toBe(status);
    });
  }
});

// ── J: titleNumber returned when available ───────────────────────────────────

describe('PropertyFactsController.getSingleFacts() — titleNumber', () => {
  it('returns titleNumber when present in the doc', async () => {
    const doc         = makeDoc({ title_number: 'AGL12345' });
    const byListingId = new Map([['listing-001', doc]]);
    const ctrl        = makeController(makeMockFactsStore(new Map(), byListingId));

    const result = await ctrl.getSingleFacts('listing-001');

    expect(result.titleNumber).toBe('AGL12345');
  });

  it('returns titleNumber: null when not present', async () => {
    const doc         = makeDoc({ title_number: null });
    const byListingId = new Map([['listing-001', doc]]);
    const ctrl        = makeController(makeMockFactsStore(new Map(), byListingId));

    const result = await ctrl.getSingleFacts('listing-001');

    expect(result.titleNumber).toBeNull();
  });
});
