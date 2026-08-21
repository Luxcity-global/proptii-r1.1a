import { describe, it, expect } from 'vitest';
import { mockBatchedFacts, mockPropertyReport, mockReportLens } from '../govDataService';

describe('gov data facts + lens mocks', () => {
  it('omits every third listing so absent key means unresolved (not clear)', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const batch = mockBatchedFacts(ids);

    expect(batch.a).toBeTruthy();
    expect(batch.b).toBeTruthy();
    expect(batch.c).toBeUndefined();
    expect(batch.d).toBeTruthy();
  });

  it('keeps facts stable when only the lens audience changes', () => {
    const reportTenant = mockPropertyReport('listing-1', 'tenant');
    const reportBuyer = mockPropertyReport('listing-1', 'buyer');
    const lensBuyer = mockReportLens('buyer');

    expect(reportTenant.facts).toEqual(reportBuyer.facts);
    expect(lensBuyer.verdictText).not.toEqual(reportTenant.lens.verdictText);
  });
});
