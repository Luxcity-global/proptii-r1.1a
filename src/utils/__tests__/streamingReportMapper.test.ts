import { describe, expect, it } from 'vitest';
import { mapStreamingReportToPropertyReport } from '../streamingReportMapper';
import type { StreamingReportData } from '../../types/streamingReport';

describe('mapStreamingReportToPropertyReport', () => {
  it('maps epc and flood modules into renter report content', () => {
    const data: StreamingReportData = {
      audience: 'tenant',
      sources: [
        { id: 'epc', label: 'EPC register', state: 'clear' },
        { id: 'flood', label: 'EA flood risk', state: 'clear' },
      ],
      partA: { listingPrice: '£895 pcm' },
      partB: { epcBand: 'C', floorAreaM2: 75, lodged: '2024-03-12' },
      partC: { status: 'pending_nps', message: 'To come in next release' },
      local: {
        flood: { headline: 'Low', groundwater: 'Unlikely', caveat: 'area not footprint' },
        crime: { month: 'Unknown', count: 0, topCategories: [] },
        heritage: { listed: false, conservationArea: true, name: 'Latchmere', caveat: '' },
      },
      map: { embedQuery: 'Lindsay Road, Bristol BS7' },
      steps: ['Verify deposit protection'],
    };

    const report = mapStreamingReportToPropertyReport(data, 'tenant', {
      listingPrice: '£895 pcm',
      addressLabel: 'Lindsay Road, Bristol BS7',
    });

    expect(report.renter?.partBBody).toContain('Band C');
    expect(report.renter?.partARows.find((r) => r.label === 'Price / Rent')?.value).toBe('£895 pcm');
    expect(report.renter?.localArea[0].finding).toContain('Low');
    expect(report.renter?.localArea[1].finding).toContain('Data unresolved');
    expect(report.map?.embedQuery).toBe('Lindsay Road, Bristol BS7');
  });
});
