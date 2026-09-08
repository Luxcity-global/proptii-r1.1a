import { PDFDocument } from 'pdf-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildIntelligenceReportFields,
  downloadIntelligenceReportPdf,
  fillIntelligenceReportPdf,
} from '../intelligenceReportPdf';

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

describe('buildIntelligenceReportFields', () => {
  it('maps live report data onto the template slots without reading the modal', () => {
    document.body.innerHTML = '<div id="proptii-report">live report</div>';
    const fields = buildIntelligenceReportFields(sampleInput);

    expect(fields.street).toBe('Hammerton Street');
    expect(fields.locality).toContain('Pudsey');
    expect(fields.postcode).toBe('LS28 7DD');
    expect(fields.chip).toBe('Renter Report');
    expect(fields.partARows[0].value).toContain('£895 pcm');
    expect(fields.watchBody).toContain('conservation area');
    expect(fields.cards[0].finding).toContain('No significant flood risk');
    expect(fields.steps[0]).toContain('deposit');
    expect(fields.verified).toContain('EPC');
    expect(JSON.stringify(fields)).not.toContain('live report');
  });
});

describe('fillIntelligenceReportPdf', () => {
  it('renders the redesigned multi-page report from live fields', async () => {
    const pdfBytes = await fillIntelligenceReportPdf(sampleInput);
    const pdf = await PDFDocument.load(pdfBytes);

    expect(pdf.getPageCount()).toBe(2);
    expect(new TextDecoder().decode(pdfBytes.slice(0, 5))).toBe('%PDF-');
    expect(pdfBytes.byteLength).toBeGreaterThan(2_000);
  });
});

describe('downloadIntelligenceReportPdf', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="proptii-report">live report</div>';
    vi.restoreAllMocks();
  });

  it('downloads the generated report and does not snapshot the live modal', async () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:report');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          rel: '',
          click,
          remove: vi.fn(),
        } as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    await downloadIntelligenceReportPdf(sampleInput);

    expect(click).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(document.body.innerHTML).toContain('live report');
  });

  it('still exports when the report element is not mounted', async () => {
    document.body.innerHTML = '';
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:report'),
      revokeObjectURL: vi.fn(),
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          rel: '',
          click: vi.fn(),
          remove: vi.fn(),
        } as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    await expect(downloadIntelligenceReportPdf(sampleInput)).resolves.toBeUndefined();
  });
});
