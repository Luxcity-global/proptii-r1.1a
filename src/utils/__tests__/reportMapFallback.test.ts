import { describe, expect, it } from 'vitest';
import { centroidMapSvgDataUrl, isLocalMapFallback } from '../reportMapFallback';
import { staticMapImageUrls } from '../reportMapEmbed';

describe('reportMapFallback', () => {
  it('builds an SVG data URL for centroid coordinates', () => {
    const url = centroidMapSvgDataUrl(53.8007, -1.5503);
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(url)).toContain('53.8007');
    expect(decodeURIComponent(url)).toContain('-1.5503');
  });

  it('detects local SVG fallback URLs', () => {
    expect(isLocalMapFallback('data:image/svg+xml,test')).toBe(true);
    expect(isLocalMapFallback('https://example.com/map.png')).toBe(false);
  });
});

describe('staticMapImageUrls', () => {
  it('lists remote providers then a guaranteed local SVG fallback', () => {
    const urls = staticMapImageUrls(51.501, -0.141);
    expect(urls[0]).toContain('maps.wikimedia.org');
    expect(urls[1]).toContain('staticmap.openstreetmap.de');
    expect(urls[2]).toContain('static-map.openstreetmap.fr');
    expect(urls[urls.length - 1]).toMatch(/^data:image\/svg\+xml/);
    expect(urls.some((url) => url.includes('googleapis.com'))).toBe(false);
  });
});
