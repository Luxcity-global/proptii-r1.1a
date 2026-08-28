import { describe, expect, it } from 'vitest';
import { buildIntelligenceReportFilename } from '../reportPdfExport';

describe('buildIntelligenceReportFilename', () => {
  it('slugifies the property label for the download filename', () => {
    expect(buildIntelligenceReportFilename('Hammerton Street, Pudsey')).toBe(
      'proptii-intelligence-report-hammerton-street-pudsey.pdf',
    );
  });
});
