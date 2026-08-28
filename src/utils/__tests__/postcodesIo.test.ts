import { describe, expect, it } from 'vitest';
import { extractPlaceQuery, extractUkOutcode, extractUkPostcode, openStreetMapEmbedUrl, openStreetMapFrStaticImageUrl, openStreetMapStaticImageUrl, wikimediaStaticMapUrl } from '../postcodesIo';

describe('postcodesIo', () => {
  it('extracts a trailing UK outcode when the inward code is missing', () => {
    expect(extractUkOutcode('UNCLE Leeds, 3 Whitehall, LS12')).toBe('LS12');
    expect(extractUkOutcode('Waincliffe Mount, Leeds LS11')).toBe('LS11');
    expect(extractUkOutcode('Bowman Lane, LEEDS')).toBeNull();
  });

  it('uses the town/city token when no postcode is present', () => {
    expect(extractPlaceQuery('Bowman Lane, LEEDS')).toBe('LEEDS');
    expect(extractPlaceQuery('Cliffside Gardens, Leeds')).toBe('Leeds');
  });

  it('builds Wikimedia and OSM static image URLs around the centroid', () => {
    const wikimedia = wikimediaStaticMapUrl(51.501, -0.141);
    expect(wikimedia).toContain('maps.wikimedia.org');
    expect(wikimedia).toContain('51.501');

    const osmDe = openStreetMapStaticImageUrl(51.501, -0.141);
    expect(osmDe).toContain('staticmap.openstreetmap.de');
    expect(osmDe).toContain('-0.141');

    const osmFr = openStreetMapFrStaticImageUrl(51.501, -0.141);
    expect(osmFr).toContain('static-map.openstreetmap.fr');
  });

  it('builds an OpenStreetMap embed URL around the centroid', () => {
    const url = openStreetMapEmbedUrl(51.501, -0.141);
    expect(url).toContain('openstreetmap.org/export/embed.html');
    expect(url).toContain('51.501');
    expect(url).toContain('-0.141');
  });
});
