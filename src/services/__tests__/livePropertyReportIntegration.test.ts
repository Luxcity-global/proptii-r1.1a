import { describe, it, expect } from 'vitest';
import { parseStreamingReportLine, mergeStreamingReportChunk } from '../propertyReportStreamService';
import { mapStreamingReportToPropertyReport } from '../../utils/streamingReportMapper';

describe('Live Streaming Report Verification', () => {
  it('parses NDJSON stream frames and accurately maps bills, utilities, and local area findings', () => {
    // 1. Initial skeleton frame
    const initialFrameStr = JSON.stringify({
      type: 'initial',
      data: {
        generatedAt: '2026-08-28T19:01:20.000Z',
        audience: 'tenant',
        match: { status: 'postcode', precision: 'postcode', uprn: null, lat: 51.4804, lng: -2.5698 },
        sources: [
          { id: 'postcodes', label: 'Postcode location', state: 'clear' },
          { id: 'epc', label: 'EPC register', state: 'loading' },
          { id: 'flood', label: 'EA flood risk', state: 'loading' },
          { id: 'crime', label: 'police.uk', state: 'loading' },
          { id: 'heritage', label: 'Listed / conservation', state: 'loading' }
        ],
        partA: { listingPrice: 'from listing' },
        partB: { epcBand: null, floorAreaM2: 0, lodged: '', winterNote: '' },
        partC: { status: 'pending_nps', message: 'To come in next release' },
        local: {
          flood: { headline: 'Loading...', groundwater: 'Loading...', caveat: 'loading' },
          crime: { month: 'Loading...', count: 0, topCategories: [] },
          heritage: { listed: false, grade: null, conservationArea: false, name: null, caveat: 'loading' }
        },
        map: { embedQuery: 'Lindsay%20Road%2C%20Bristol%20BS7' },
        steps: []
      }
    });

    const initialFrame = parseStreamingReportLine(initialFrameStr);
    expect(initialFrame).not.toBeNull();
    expect(initialFrame?.type).toBe('initial');
    let reportData = (initialFrame as any).data;

    // 2. EPC Chunk
    const epcChunk = parseStreamingReportLine(JSON.stringify({
      type: 'chunk',
      module: 'epc',
      data: {
        epcBand: 'C',
        floorAreaM2: 75,
        lodged: '2025-11-12',
        winterNote: 'Energy performance certificate on file'
      }
    }));
    reportData = mergeStreamingReportChunk(reportData, epcChunk as any);

    // 3. Flood Chunk
    const floodChunk = parseStreamingReportLine(JSON.stringify({
      type: 'chunk',
      module: 'flood',
      data: {
        headline: 'Very Low',
        groundwater: 'Unlikely',
        caveat: 'postcode centroid'
      }
    }));
    reportData = mergeStreamingReportChunk(reportData, floodChunk as any);

    // 4. Heritage Chunk
    const heritageChunk = parseStreamingReportLine(JSON.stringify({
      type: 'chunk',
      module: 'heritage',
      data: {
        listed: false,
        grade: null,
        conservationArea: true,
        name: 'St Andrews Conservation Area',
        caveat: 'postcode point'
      }
    }));
    reportData = mergeStreamingReportChunk(reportData, heritageChunk as any);

    // 5. Crime Chunk
    const crimeChunk = parseStreamingReportLine(JSON.stringify({
      type: 'chunk',
      module: 'crime',
      data: {
        month: '2026-06',
        count: 14,
        topCategories: ['violent-crime', 'anti-social-behaviour']
      }
    }));
    reportData = mergeStreamingReportChunk(reportData, crimeChunk as any);

    // 6. Map to UI Property Report model
    const mapped = mapStreamingReportToPropertyReport(reportData, 'tenant', {
      listingPrice: '£2,150 pcm',
      addressLabel: 'Lindsay Road, Bristol BS7 9NP'
    });

    // Check Part A: Financial & Bills Breakdown
    expect(mapped.renter?.partARows).toBeDefined();
    const priceRow = mapped.renter?.partARows.find(r => r.label === 'Price / Rent');
    expect(priceRow?.value).toBe('£2,150 pcm');

    const taxRow = mapped.renter?.partARows.find(r => r.label === 'Council Tax Band');
    expect(taxRow?.value).toBe('Band C');

    // Check Part B: Utilities & EPC
    expect(mapped.renter?.partBBody).toContain('Band C (75 m²)');
    expect(mapped.renter?.partBBody).toContain('Lodged 2025-11-12');

    // Check Local Area Intelligence
    const floodCheck = mapped.renter?.localArea.find(c => c.id === 'flood-risk');
    expect(floodCheck?.status).toBe('Clear');
    expect(floodCheck?.finding).toContain('Very Low');

    const crimeCheck = mapped.renter?.localArea.find(c => c.id === 'crime-safety');
    expect(crimeCheck?.status).toBe('Recorded');
    expect(crimeCheck?.finding).toContain('14 incidents in 2026-06');

    const heritageCheck = mapped.renter?.localArea.find(c => c.id === 'heritage-conservation');
    expect(heritageCheck?.finding).toContain('Conservation area: St Andrews Conservation Area');
  });
});
