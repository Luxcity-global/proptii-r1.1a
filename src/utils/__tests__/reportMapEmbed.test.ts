import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidCoordinate, mapEmbedUrlFromCoordinates, staticMapImageUrls } from '../reportMapEmbed';

describe('reportMapEmbed', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('validates numeric coordinates', () => {
    expect(isValidCoordinate(51.5)).toBe(true);
    expect(isValidCoordinate(Number.NaN)).toBe(false);
    expect(isValidCoordinate(undefined)).toBe(false);
  });

  it('prefers Wikimedia static map as the primary remote provider', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    const url = mapEmbedUrlFromCoordinates(51.501, -0.141);
    expect(url).toContain('maps.wikimedia.org');
    expect(url).toContain('51.501');
  });

  it('always includes a local SVG fallback as the last URL', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-google-key');
    const urls = staticMapImageUrls(51.501, -0.141);
    expect(urls[urls.length - 1]).toMatch(/^data:image\/svg\+xml/);
    expect(urls.some((url) => url.includes('googleapis.com'))).toBe(false);
  });
});
