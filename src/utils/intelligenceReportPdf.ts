import type { Audience, FactFlag, ReportLens, RenterReportContent } from '../types/govData';
import { downloadReportFromElement } from './reportPdfExport';

export type IntelligenceReportPdfInput = {
  listingId: string;
  audience: Audience;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  addressLabel: string;
  listingDescription?: string;
  covenantText?: string;
  epcText?: string;
  facts: FactFlag[] | null;
  lens: ReportLens | null;
  renter?: RenterReportContent | null;
};

/**
 * Downloads a PDF snapshot of the live `#proptii-report` element so it matches the on-screen report.
 */
export async function downloadIntelligenceReportPdf(
  input: IntelligenceReportPdfInput,
): Promise<void> {
  const reportEl = document.getElementById('proptii-report');
  if (!reportEl) {
    throw new Error('Report element is not mounted');
  }

  const propertyLabel = input.propertyLocation || input.propertyTitle || input.addressLabel;
  await downloadReportFromElement(reportEl, propertyLabel);
}
