import { beforeEach, describe, expect, it, vi } from 'vitest';

const save = vi.fn();
const text = vi.fn();
const splitTextToSize = vi.fn((value: string) => [value]);

vi.mock('jspdf', () => {
  const jsPDF = vi.fn().mockImplementation(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    text,
    splitTextToSize,
    addPage: vi.fn(),
    setPage: vi.fn(),
    getNumberOfPages: () => 1,
    save,
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
  }));
  return { jsPDF, default: jsPDF };
});

const sampleInput = {
  listingId: 'listing-TB0DF0',
  audience: 'tenant' as const,
  propertyTitle: 'Hammerton Street',
  propertyLocation: 'Hammerton Street, Pudsey, Leeds, LS28 7DD',
  propertyPrice: '£895 pcm',
  addressLabel: 'Hammerton Street, Pudsey, Leeds, LS28 7DD',
  facts: null,
  lens: null,
  renter: {
    precisionLine: 'Location checks use the postcode area, not the building footprint.',
    whatToWatchTitle: 'What to watch',
    whatToWatchBody: 'A conservation area designation applies near this postcode.',
    partATitle: 'Financial & Transactional Terms',
    partARows: [
      { label: 'Price / Rent', value: '£800 pcm' },
      { label: 'Council Tax Band', value: 'Band C' },
    ],
    partANote: 'Asking rent and terms from the listing.',
    partASource: 'Listing agent',
    partBTitle: 'Utilities & EPC',
    partBBody: 'Current EPC rating is Band B (81).',
    partBSource: 'MHCLG National EPC Register',
    partCTitle: 'Restrictive Covenants & Title',
    partCBody: 'Title register and covenant text are not in this report.',
    partCStatus: 'To come in next release',
    partCSource: 'pending — HM Land Registry title register (not yet accessible)',
    localIntro: 'All three checks below are evaluated at the postcode centroid.',
    localArea: [
      {
        id: 'flood-risk',
        title: 'Flood Risk',
        status: 'Clear',
        tone: 'resolved' as const,
        finding: 'No significant flood risk recorded',
        source: 'EA flood CSV (OGL)',
      },
    ],
    paidCopy: 'Deeper legal, compliance & professional checks — paid, coming later in this journey',
    mapSource: '',
    steps: ['Verify the deposit will be protected in an approved scheme within 30 days'],
    footerAudience: 'Generated for a prospective renter. Not a substitute for legal advice.',
  },
};

describe('downloadIntelligenceReportPdf', () => {
  beforeEach(() => {
    save.mockClear();
    text.mockClear();
    splitTextToSize.mockClear();
    document.body.innerHTML = '<div id="proptii-report">live report</div>';
  });

  it('typesets from report data and does not snapshot the live modal', async () => {
    const { downloadIntelligenceReportPdf } = await import('../intelligenceReportPdf');

    await downloadIntelligenceReportPdf(sampleInput);

    expect(save).toHaveBeenCalledWith(
      'proptii-intelligence-report-hammerton-street-pudsey-leeds-ls28-7dd.pdf',
    );

    const written = text.mock.calls.map((args) => String(args[0])).join('\n');
    expect(written).toContain('Hammerton Street, Pudsey, Leeds, LS28 7DD');
    expect(written).toContain('WHAT TO WATCH');
    expect(written).toContain('£895 pcm');
    expect(written).toContain('Flood Risk');
    expect(written).toContain('PART A');
    expect(written).toContain('Recommended Action Steps');
    expect(written).not.toContain('live report');
  });

  it('still exports when the report element is not mounted', async () => {
    document.body.innerHTML = '';
    const { downloadIntelligenceReportPdf } = await import('../intelligenceReportPdf');

    await expect(downloadIntelligenceReportPdf(sampleInput)).resolves.toBeUndefined();
    expect(save).toHaveBeenCalled();
  });
});
