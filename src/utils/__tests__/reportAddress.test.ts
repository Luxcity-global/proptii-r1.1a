import { describe, expect, it } from 'vitest';
import { buildStreamingReportAddress, resolveReportListingId } from '../reportAddress';

describe('reportAddress', () => {
  it('builds address payload with scraped coordinates', () => {
    const payload = buildStreamingReportAddress({
      display: 'Lindsay Road, Bristol BS7',
      street: 'Lindsay Road',
      latitude: 51.48,
      longitude: -2.57,
    });
    expect(payload.coordinates).toEqual({ lat: 51.48, lng: -2.57 });
    expect(payload.postcode).toBe('');
  });

  it('extracts postcode from display when not provided', () => {
    const payload = buildStreamingReportAddress({
      display: 'Flat 2, Falcon Road, London SW11 2LN',
    });
    expect(payload.postcode).toBe('SW11 2LN');
  });

  it('prefers portal url as report listing id', () => {
    expect(
      resolveReportListingId({
        url: 'https://www.onthemarket.com/details/20223142/',
        listingId: 'habc123',
      }),
    ).toBe('https://www.onthemarket.com/details/20223142/');
  });
});
