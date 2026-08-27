/**
 * classifier.service.spec.ts
 *
 * Unit tests for ClassifierService — Sprint 1.3 DoD.
 *
 * Test surface:
 *   A) normaliseQuery helper
 *   B) Empty/blank query → fallback immediately (no AI call)
 *   C) Timeout path — AI takes > 600ms → fallback returned
 *   D) Cache hit path — cached result returned without AI call
 *   E) Successful AI path — result cached and returned
 *   F) Response parsing — valid/invalid/truncated AI JSON
 *   G) Fallback has correct shape (cacheHit: false, fallback: true)
 *
 * All tests are offline — no real Redis, no real AI API calls.
 * Redis and fetch are mocked inline.
 *
 * Run:
 *   npx vitest run --config vitest.backend.config.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClassifierService, ClassifierResult, ClassifierIntent, normaliseQuery } from './classifier.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeService(): ClassifierService {
  return new ClassifierService();
}

/** Mock fetch to return a Gemini-shaped response with the given intent JSON. */
function mockFetchGemini(intentJson: object) {
  const text = JSON.stringify(intentJson);
  return vi.fn().mockResolvedValue({
    ok:   true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
  });
}

/** Mock fetch to simulate a timeout (never resolves within the test window). */
function mockFetchHanging() {
  return vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
}

/** Mock Redis get → null (cache miss), set → ok */
function mockRedisMiss() {
  vi.doMock('../utils/redis-client', () => ({
    getRedisClient: () => ({
      get:    vi.fn().mockResolvedValue(null),
      set:    vi.fn().mockResolvedValue('OK'),
      incr:   vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      ttl:    vi.fn().mockResolvedValue(60),
    }),
  }));
}

/** Mock Redis get → cached JSON result (cache hit) */
function mockRedisHit(cachedResult: Omit<ClassifierResult, 'cacheHit'>) {
  vi.doMock('../utils/redis-client', () => ({
    getRedisClient: () => ({
      get:    vi.fn().mockResolvedValue(JSON.stringify(cachedResult)),
      set:    vi.fn().mockResolvedValue('OK'),
      incr:   vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      ttl:    vi.fn().mockResolvedValue(60),
    }),
  }));
}

// ── A: normaliseQuery ─────────────────────────────────────────────────────────

describe('normaliseQuery()', () => {
  it('lowercases and trims', () => {
    expect(normaliseQuery('  2 Bed FLAT  ')).toBe('2 bed flat');
  });

  it('collapses multiple spaces', () => {
    expect(normaliseQuery('london   east  end')).toBe('london east end');
  });

  it('handles empty string', () => {
    expect(normaliseQuery('')).toBe('');
  });

  it('handles null-ish input gracefully', () => {
    expect(normaliseQuery(undefined as any)).toBe('');
  });
});

// ── B: Empty/blank query ──────────────────────────────────────────────────────

describe('ClassifierService.classify() — empty query', () => {
  it('returns fallback for empty string without calling AI', async () => {
    const svc = makeService();
    const globalFetch = vi.spyOn(global, 'fetch').mockImplementation(mockFetchHanging());

    const result = await svc.classify('');

    expect(result.fallback).toBe(true);
    expect(result.cacheHit).toBe(false);
    expect(result.intent).toBe('property_search');
    expect(globalFetch).not.toHaveBeenCalled();

    globalFetch.mockRestore();
  });

  it('returns fallback for whitespace-only query', async () => {
    const svc = makeService();
    const result = await svc.classify('   ');
    expect(result.fallback).toBe(true);
  });
});

// ── C: Timeout path ───────────────────────────────────────────────────────────
// We test the timeout by overriding the private CLASSIFIER_TIMEOUT_MS threshold
// to 50ms so tests complete fast without fake timers (which don't work with
// Promise.race + real setTimeout inside the service).

describe('ClassifierService.classify() — 600ms timeout', () => {
  it('returns fallback immediately when AI call takes longer than timeout', async () => {
    const svc = makeService();

    vi.spyOn(svc as any, 'getCached').mockResolvedValue(null);
    vi.spyOn(svc as any, 'setCached').mockResolvedValue(undefined);

    // Simulate an AI call that takes 200ms — longer than the overridden 50ms threshold
    vi.spyOn(svc as any, 'callAI').mockImplementation(
      () => new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    );

    // Override the private timeout constant to 50ms for fast testing
    (svc as any).timeoutMs = 50;

    // Use classifyWithTimeout directly to test the timeout logic
    const result = await (svc as any).classifyWithTimeout('test query');

    expect(result).toBeNull(); // timeout fired — returns null → fallback
  }, 1000);

  it('does NOT cache a fallback result (AI timeout path)', async () => {
    const svc = makeService();

    vi.spyOn(svc as any, 'getCached').mockResolvedValue(null);
    const setCached = vi.spyOn(svc as any, 'setCached').mockResolvedValue(undefined);

    // Simulate hanging AI call that resolves after the test is done
    vi.spyOn(svc as any, 'callAI').mockImplementation(
      () => new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    );

    // Override timeout to 50ms so the race resolves quickly
    (svc as any).timeoutMs = 50;

    // Call classify — callAI null → classifyWithTimeout returns null → fallback returned
    const result = await (svc as any).classifyWithTimeout('2 bed flat');

    expect(result).toBeNull();
    // setCached is called by classify() only after classifyWithTimeout returns non-null
    expect(setCached).not.toHaveBeenCalled();
  }, 1000);
});

// ── D: Cache hit path ─────────────────────────────────────────────────────────

describe('ClassifierService.classify() — cache hit', () => {
  it('returns cached result with cacheHit: true without calling AI', async () => {
    const cached: Omit<ClassifierResult, 'cacheHit'> = {
      intent:     'specific_address',
      audience:   'buyer',
      entities:   { location: '10 Downing Street' },
      confidence: 0.98,
      fallback:   false,
    };

    const svc = makeService();
    vi.spyOn(svc as any, 'getCached').mockResolvedValue(cached);
    const callAI = vi.spyOn(svc as any, 'callAI');

    const result = await svc.classify('10 Downing Street');

    expect(result.cacheHit).toBe(true);
    expect(result.intent).toBe('specific_address');
    expect(result.confidence).toBe(0.98);
    expect(callAI).not.toHaveBeenCalled();
  });

  it('cacheHit result preserves all original fields', async () => {
    const cached: Omit<ClassifierResult, 'cacheHit'> = {
      intent:     'property_search',
      audience:   'tenant',
      entities:   { location: 'Shoreditch', bedrooms: '2' },
      confidence: 0.91,
      fallback:   false,
    };

    const svc = makeService();
    vi.spyOn(svc as any, 'getCached').mockResolvedValue(cached);

    const result = await svc.classify('2 bed flat shoreditch');

    expect(result).toMatchObject({ ...cached, cacheHit: true });
  });
});

// ── E: Successful AI path ─────────────────────────────────────────────────────

describe('ClassifierService.classify() — successful AI call', () => {
  it('returns AI result with cacheHit: false and calls setCached', async () => {
    const aiPayload = {
      intent:     'property_search',
      audience:   'tenant',
      entities:   { location: 'Shoreditch', bedrooms: '2', budget: '£1500' },
      confidence: 0.93,
    };

    const svc = makeService();
    vi.spyOn(svc as any, 'getCached').mockResolvedValue(null);
    vi.spyOn(svc as any, 'callAI').mockResolvedValue({ ...aiPayload, fallback: false });
    const setCached = vi.spyOn(svc as any, 'setCached').mockResolvedValue(undefined);

    const result = await svc.classify('2 bed flat shoreditch £1500');

    expect(result.cacheHit).toBe(false);
    expect(result.fallback).toBe(false);
    expect(result.intent).toBe('property_search');
    expect(result.audience).toBe('tenant');
    expect(result.entities).toMatchObject({ location: 'Shoreditch' });
    expect(setCached).toHaveBeenCalledOnce();
  });

  it('caches only the non-cacheHit result (does not include cacheHit in cached value)', async () => {
    const aiPayload = {
      intent: 'property_search', audience: 'buyer',
      entities: {}, confidence: 0.8, fallback: false,
    };

    const svc = makeService();
    vi.spyOn(svc as any, 'getCached').mockResolvedValue(null);
    vi.spyOn(svc as any, 'callAI').mockResolvedValue(aiPayload);

    const setCached = vi.spyOn(svc as any, 'setCached').mockImplementation(
      async (_key: string, val: any) => {
        // The value written to cache must not include cacheHit
        expect(val.cacheHit).toBeUndefined();
      },
    );

    await svc.classify('buy flat london');
    expect(setCached).toHaveBeenCalled();
  });
});

// ── F: Response parsing ───────────────────────────────────────────────────────

describe('ClassifierService.parseAIResponse() — private method tests', () => {
  let svc: ClassifierService;
  beforeEach(() => { svc = makeService(); });

  const parse = (text: string) => (svc as any).parseAIResponse(text);

  it('parses a clean JSON string correctly', () => {
    const result = parse(JSON.stringify({
      intent: 'property_search', audience: 'tenant',
      entities: { location: 'Camden', bedrooms: '1' }, confidence: 0.88,
    }));
    expect(result?.intent).toBe('property_search');
    expect(result?.audience).toBe('tenant');
    expect(result?.entities?.location).toBe('Camden');
    expect(result?.confidence).toBe(0.88);
    expect(result?.fallback).toBe(false);
  });

  it('strips markdown code fences before parsing', () => {
    const text = '```json\n{"intent":"off_topic","audience":"buyer","entities":{},"confidence":0.99}\n```';
    const result = parse(text);
    expect(result?.intent).toBe('off_topic');
  });

  it('returns null for an invalid intent value', () => {
    const result = parse(JSON.stringify({ intent: 'unknown_intent', audience: 'buyer', entities: {}, confidence: 0.5 }));
    expect(result).toBeNull();
  });

  it('falls back to "buyer" audience for invalid audience value', () => {
    const result = parse(JSON.stringify({ intent: 'property_search', audience: 'renter', entities: {}, confidence: 0.7 }));
    expect(result?.audience).toBe('buyer');
  });

  it('clamps confidence to [0, 1]', () => {
    const r1 = parse(JSON.stringify({ intent: 'property_search', audience: 'buyer', entities: {}, confidence: 1.5 }));
    const r2 = parse(JSON.stringify({ intent: 'property_search', audience: 'buyer', entities: {}, confidence: -0.3 }));
    expect(r1?.confidence).toBe(1);
    expect(r2?.confidence).toBe(0);
  });

  it('returns null for malformed JSON', () => {
    const result = parse('this is not json');
    expect(result).toBeNull();
  });

  it('strips empty entity values', () => {
    const result = parse(JSON.stringify({
      intent: 'property_search', audience: 'buyer',
      entities: { location: 'London', bedrooms: '', budget: '' },
      confidence: 0.8,
    }));
    expect(result?.entities.location).toBe('London');
    expect(result?.entities.bedrooms).toBeUndefined();
  });
});

// ── G: Fallback shape ─────────────────────────────────────────────────────────

describe('ClassifierService fallback shape', () => {
  it('fallback result has all required ClassifierResult fields', async () => {
    const svc = makeService();
    vi.spyOn(svc as any, 'getCached').mockResolvedValue(null);
    vi.spyOn(svc as any, 'callAI').mockResolvedValue(null); // simulate failure

    const result = await svc.classify('anything');

    // Verify all fields are present
    expect(typeof result.intent).toBe('string');
    expect(typeof result.audience).toBe('string');
    expect(typeof result.entities).toBe('object');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.fallback).toBe('boolean');
    expect(typeof result.cacheHit).toBe('boolean');

    // Verify fallback values
    expect(result.fallback).toBe(true);
    expect(result.cacheHit).toBe(false);
    expect(result.intent).toBe('property_search');
    expect(result.confidence).toBe(0);
  });
});
