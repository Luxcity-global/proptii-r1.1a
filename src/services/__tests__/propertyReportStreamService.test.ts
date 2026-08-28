import { describe, expect, it } from 'vitest';
import { mergeStreamingReportChunk } from '../propertyReportStreamService';
import type { StreamingReportData } from '../../types/streamingReport';

const skeleton: StreamingReportData = {
  sources: [
    { id: 'flood', label: 'EA flood risk', state: 'loading' },
    { id: 'epc', label: 'EPC register', state: 'loading' },
  ],
  local: {
    flood: { headline: 'Loading...', groundwater: 'Loading...', caveat: 'loading' },
  },
  partB: { epcBand: null },
};

describe('mergeStreamingReportChunk', () => {
  it('merges flood chunk and marks source clear', () => {
    const next = mergeStreamingReportChunk(skeleton, {
      type: 'chunk',
      module: 'flood',
      data: { headline: 'Low', groundwater: 'Unlikely', caveat: 'area not footprint' },
    });
    expect(next.local?.flood?.headline).toBe('Low');
    expect(next.sources?.find((s) => s.id === 'flood')?.state).toBe('clear');
  });

  it('merges epc chunk into partB', () => {
    const next = mergeStreamingReportChunk(skeleton, {
      type: 'chunk',
      module: 'epc',
      data: { epcBand: 'C', floorAreaM2: 75, lodged: '2024-03-12' },
    });
    expect(next.partB?.epcBand).toBe('C');
    expect(next.sources?.find((s) => s.id === 'epc')?.state).toBe('clear');
  });
});
