import { describe, expect, it } from 'vitest';
import { buildIntelligenceReportFilename, prepareReportElementForPdfCapture } from '../reportPdfExport';

describe('buildIntelligenceReportFilename', () => {
  it('slugifies the property label', () => {
    expect(buildIntelligenceReportFilename('Hammerton Street, Pudsey')).toBe(
      'proptii-intelligence-report-hammerton-street-pudsey.pdf',
    );
  });
});

describe('prepareReportElementForPdfCapture', () => {
  it('strips chrome and expands pending copy on a clone', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <button class="no-print">Export</button>
      <div data-pdf-hide></div>
      <section data-testid="report-part-c-pending">
        <p class="max-h-0 overflow-hidden opacity-0">Title register pending.</p>
      </section>
    `;

    prepareReportElementForPdfCapture(root);

    expect(root.querySelector('.no-print')).toBeNull();
    expect(root.querySelector('[data-pdf-hide]')).toBeNull();
    const pending = root.querySelector('[data-testid="report-part-c-pending"] p') as HTMLElement;
    expect(pending.classList.contains('max-h-0')).toBe(false);
    expect(pending.style.opacity).toBe('1');
  });
});
