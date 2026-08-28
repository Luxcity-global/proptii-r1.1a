import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mapsEmbedSrc, resolveMapQuery, warmupReportMap } from '../mapsEmbed';

vi.mock('../reportMapCoords', () => ({
  resolveMapCoordinates: vi.fn(async () => ({ lat: 51.5, lng: -0.14, source: 'postcodes.io' as const })),
}));

describe('mapsEmbedSrc', () => {
  it('returns null when the query is empty so the iframe can be hidden', () => {
    expect(mapsEmbedSrc('')).toBeNull();
    expect(mapsEmbedSrc('   ')).toBeNull();
    expect(mapsEmbedSrc(null)).toBeNull();
    expect(mapsEmbedSrc(undefined)).toBeNull();
  });

  it('prefers embedQuery then falls back to the listing address', () => {
    expect(resolveMapQuery('  Falcon Road  ', 'Other')).toBe('Falcon Road');
    expect(resolveMapQuery('', 'Hammerton Street, Pudsey')).toBe('Hammerton Street, Pudsey');
    expect(resolveMapQuery(null, '  ')).toBe('');
  });

  it('builds an official Google Maps Embed place URL that includes the address', () => {
    const query = 'Falcon Road, Clapham Junction, London SW11 2LN';
    const src = mapsEmbedSrc(query);
    expect(src).toContain('google.com/maps/embed/v1/place');
    expect(src).toContain(`q=${encodeURIComponent(query)}`);
  });
});

describe('warmupReportMap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      referrerPolicy = '';
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('waits at least minMs before resolving', async () => {
    const promise = warmupReportMap('SW11 2LN', { minMs: 1500, maxMs: 4000 });
    await vi.advanceTimersByTimeAsync(1499);
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(settled).toBe(true);
  });
});
