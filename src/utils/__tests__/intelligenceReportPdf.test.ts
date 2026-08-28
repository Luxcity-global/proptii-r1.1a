import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const save = vi.fn();
const addImage = vi.fn();
const addPage = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
    addImage = addImage;
    addPage = addPage;
    getImageProperties() {
      return { width: 800, height: 2400 };
    }
    save = save;
  }

  return { default: MockJsPDF };
});

const html2canvas = vi.fn(async () => ({
  toDataURL: () => 'data:image/jpeg;base64,abc',
}));

vi.mock('html2canvas', () => ({
  default: html2canvas,
}));

describe('reportPdfExport', () => {
  beforeEach(() => {
    save.mockClear();
    addImage.mockClear();
    addPage.mockClear();
    html2canvas.mockClear();
  });

  it('prepares cloned report nodes for PDF capture', async () => {
    const { prepareReportElementForPdfCapture } = await import('../reportPdfExport');
    const root = document.createElement('div');
    root.innerHTML = `
      <button class="no-print">Download</button>
      <section data-testid="report-part-c-pending">
        <p class="max-h-0 overflow-hidden opacity-0">Part C body</p>
      </section>
      <section data-testid="report-paid-pending">
        <p class="max-h-0 overflow-hidden opacity-0">Paid body</p>
      </section>
    `;

    prepareReportElementForPdfCapture(root);

    expect(root.querySelector('.no-print')).toBeNull();
    expect(root.querySelector('[data-testid="report-part-c-pending"] p')?.textContent).toBe(
      'Part C body',
    );
    expect(
      (root.querySelector('[data-testid="report-part-c-pending"] p') as HTMLElement).style.opacity,
    ).toBe('1');
  });

  it('captures the report element and saves a multi-page PDF', async () => {
    const { captureElementAsPdf } = await import('../reportPdfExport');
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 1800, configurable: true });
    Object.defineProperty(element, 'scrollWidth', { value: 960, configurable: true });

    await captureElementAsPdf(element, 'proptii-intelligence-report-leeds.pdf');

    expect(html2canvas).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        height: 1800,
        width: 960,
      }),
    );
    expect(addImage).toHaveBeenCalled();
    expect(addPage).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith('proptii-intelligence-report-leeds.pdf');
  });
});

describe('downloadIntelligenceReportPdf', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('captures the mounted report element', async () => {
    save.mockClear();
    html2canvas.mockClear();

    const report = document.createElement('div');
    report.id = 'proptii-report';
    Object.defineProperty(report, 'scrollHeight', { value: 1200, configurable: true });
    Object.defineProperty(report, 'scrollWidth', { value: 900, configurable: true });
    report.textContent = 'Your Proptii Report';
    document.body.appendChild(report);

    const { downloadIntelligenceReportPdf } = await import('../intelligenceReportPdf');

    await downloadIntelligenceReportPdf({
      listingId: 'listing-abc123',
      audience: 'tenant',
      propertyTitle: '2 Bedroom Flat',
      propertyLocation: 'Hammerton Street, Pudsey',
      propertyPrice: '£895 pcm',
      addressLabel: '2 Bedroom Terraced, Hammerton Street, Pudsey',
      facts: [],
      lens: null,
    });

    expect(html2canvas).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith('proptii-intelligence-report-hammerton-street-pudsey.pdf');
  });

  it('throws when the report element is not mounted', async () => {
    const { downloadIntelligenceReportPdf } = await import('../intelligenceReportPdf');

    await expect(
      downloadIntelligenceReportPdf({
        listingId: 'listing-abc123',
        audience: 'tenant',
        propertyTitle: '2 Bedroom Flat',
        propertyLocation: 'Hammerton Street, Pudsey',
        addressLabel: 'Hammerton Street, Pudsey',
        facts: [],
        lens: null,
      }),
    ).rejects.toThrow(/not mounted/i);
  });
});
