import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  referencingReportFilename,
  referencingReportPdfBytes,
  type ReferencingReportInput,
} from '../referencingReportPdf';

const sampleReport: ReferencingReportInput = {
  tenantName: 'Amina Okonkwo',
  generatedAt: '12 Oct 2026, 10:00:00',
  overallProgress: 80,
  applicant: [
    { label: 'Name', value: 'Amina Okonkwo' },
    { label: 'Email', value: 'amina@example.com' },
    { label: 'Phone', value: 'Not provided' },
    { label: 'Date of birth', value: '01/01/1994' },
    { label: 'Nationality', value: 'British' },
  ],
  pillars: [
    { title: 'Identity Architecture', complete: true, notes: 'amina@example.com' },
    { title: 'Employment', complete: true, notes: 'Analyst at Northwind' },
    { title: 'Residential History', complete: false, notes: '' },
    { title: 'Financial Integrity', complete: true, notes: 'Monthly income: 3200' },
    { title: 'Guarantor', complete: false, notes: '' },
  ],
  documents: [
    { label: 'Identity', value: 'passport.pdf' },
    { label: 'Employment', value: 'Uploaded' },
    { label: 'Residential', value: 'Not uploaded' },
    { label: 'Financial', value: 'Not uploaded' },
    { label: 'Guarantor', value: 'Not uploaded' },
  ],
  shares: [
    {
      recipientName: 'Jordan Lee',
      recipientEmail: 'jordan@agency.example',
      role: 'Letting Agent',
      shared: '2 Oct 2026',
      status: 'Delivered',
    },
  ],
};

describe('referencingReportPdf', () => {
  it('names the download as a PDF', () => {
    expect(referencingReportFilename(new Date('2026-10-12T09:00:00.000Z'))).toBe(
      'referencing-report-2026-10-12.pdf',
    );
  });

  it('writes a real PDF document', () => {
    const bytes = referencingReportPdfBytes(sampleReport);
    const header = new TextDecoder().decode(new Uint8Array(bytes).slice(0, 5));

    expect(header).toBe('%PDF-');
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it('still writes a PDF when nothing has been shared', async () => {
    const bytes = referencingReportPdfBytes({ ...sampleReport, shares: [] });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  }, 20000);
});
