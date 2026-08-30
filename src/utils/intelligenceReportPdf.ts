import { jsPDF } from 'jspdf';
import { defaultRenterContent } from '../data/renterReportFixtures';
import type { Audience, FactFlag, ReportEntryTone, ReportLens, RenterReportContent } from '../types/govData';
import { buildIntelligenceReportFilename } from './reportPdfExport';

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

type RGB = [number, number, number];

const INK: RGB = [14, 34, 51];
const SEAL: RGB = [19, 108, 158];
const MUTED: RGB = [58, 74, 87];
const RULE: RGB = [210, 218, 222];
const VERIFIED: RGB = [19, 108, 158];
const STAMP: RGB = [220, 95, 18];
const PENDING: RGB = [92, 107, 118];
const GROUND: RGB = [238, 246, 251];
const WATCH_FILL: RGB = [254, 242, 242];
const WATCH_BAR: RGB = [239, 68, 68];
const PAPER: RGB = [255, 255, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 12;
const MASTHEAD_H = 22;

const ROLE_CHIP: Record<Audience, string> = {
  tenant: 'Renter Report',
  buyer: 'Buyer Report',
  landlord: 'Landlord Report',
  agent: 'Agent Report',
  homeowner: 'Homeowner Report',
};

const TONE_COLOR: Record<ReportEntryTone, RGB> = {
  resolved: VERIFIED,
  note: STAMP,
  pending: PENDING,
};

function formatAsOf(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function reportReference(listingId: string): string {
  const tail = (listingId || '').slice(-6).toUpperCase();
  return `PRP-${tail || '849201'}`;
}

class PdfWriter {
  readonly doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  y = MASTHEAD_H + 10;

  ensure(height: number) {
    if (this.y + height > FOOTER_Y - 8) {
      this.doc.addPage();
      this.y = MARGIN + 6;
    }
  }

  setType(size: number, style: 'normal' | 'bold' = 'normal', color: RGB = INK) {
    this.doc.setFont('helvetica', style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  wrapped(text: string, size: number, width = CONTENT_W): string[] {
    this.doc.setFontSize(size);
    return this.doc.splitTextToSize(text, width) as string[];
  }

  paragraph(
    text: string,
    size: number,
    leading: number,
    color: RGB = INK,
    style: 'normal' | 'bold' = 'normal',
  ) {
    this.setType(size, style, color);
    const lines = this.wrapped(text, size);
    for (const line of lines) {
      this.ensure(leading);
      this.doc.text(line, MARGIN, this.y);
      this.y += leading;
    }
  }

  rule() {
    this.ensure(6);
    this.doc.setDrawColor(...RULE);
    this.doc.setLineWidth(0.35);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 6;
  }

  kicker(label: string) {
    this.ensure(6);
    this.setType(7, 'bold', SEAL);
    this.doc.text(label.toUpperCase(), MARGIN, this.y);
    this.y += 6;
  }

  heading(text: string) {
    this.ensure(10);
    this.setType(13, 'bold', INK);
    this.doc.text(text, MARGIN, this.y);
    this.y += 8;
  }
}

function drawMasthead(doc: jsPDF, today: string, chip: string, reference: string) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, MASTHEAD_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PROPTII', MARGIN, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(reference, PAGE_W - MARGIN, 9, { align: 'right' });

  doc.setFontSize(7.5);
  doc.text('FACTS-ONLY PUBLIC EXPORT', MARGIN, 16);
  doc.text(`${chip}  ·  ${today}`, PAGE_W - MARGIN, 16, { align: 'right' });
}

function drawFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFillColor(...PAPER);
    doc.rect(0, FOOTER_Y - 2, PAGE_W, PAGE_H - (FOOTER_Y - 2), 'F');
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, FOOTER_Y, PAGE_W - MARGIN, FOOTER_Y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text('Proptii · Facts-only public export · Not a substitute for legal advice', MARGIN, FOOTER_Y + 5);
    doc.text(`${i} / ${pages}`, PAGE_W - MARGIN, FOOTER_Y + 5, { align: 'right' });
  }
}

function drawWatchBox(pdf: PdfWriter, title: string, body: string) {
  const { doc } = pdf;
  const titleLines = pdf.wrapped(title.toUpperCase(), 8, CONTENT_W - 10);
  const bodyLines = pdf.wrapped(body, 10, CONTENT_W - 10);
  const boxH = 8 + titleLines.length * 4 + bodyLines.length * 5 + 4;
  pdf.ensure(boxH);

  const top = pdf.y - 2;
  doc.setFillColor(...WATCH_FILL);
  doc.roundedRect(MARGIN, top, CONTENT_W, boxH, 1.5, 1.5, 'F');
  doc.setFillColor(...WATCH_BAR);
  doc.rect(MARGIN, top, 1.6, boxH, 'F');

  pdf.setType(8, 'bold', WATCH_BAR);
  let cursor = top + 6;
  for (const line of titleLines) {
    doc.text(line, MARGIN + 6, cursor);
    cursor += 4;
  }
  pdf.setType(10, 'normal', INK);
  cursor += 1;
  for (const line of bodyLines) {
    doc.text(line, MARGIN + 6, cursor);
    cursor += 5;
  }
  pdf.y = top + boxH + 6;
}

function drawLedgerRow(pdf: PdfWriter, label: string, value: string) {
  const { doc } = pdf;
  pdf.setType(8, 'normal', MUTED);
  const labelLines = pdf.wrapped(label.toUpperCase(), 8, CONTENT_W * 0.42);
  pdf.setType(10, 'bold', INK);
  const valueLines = pdf.wrapped(value, 10, CONTENT_W * 0.52);
  const rowH = Math.max(labelLines.length * 4.5, valueLines.length * 5, 7);
  pdf.ensure(rowH + 3);

  pdf.setType(8, 'normal', MUTED);
  doc.text(labelLines, MARGIN, pdf.y);
  pdf.setType(10, 'bold', INK);
  doc.text(valueLines, PAGE_W - MARGIN, pdf.y, { align: 'right' });
  pdf.y += rowH;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.15);
  doc.line(MARGIN, pdf.y - 2, PAGE_W - MARGIN, pdf.y - 2);
  pdf.y += 2;
}

function drawAreaCheck(
  pdf: PdfWriter,
  title: string,
  status: string,
  finding: string,
  source: string,
  tone: ReportEntryTone,
) {
  const { doc } = pdf;
  const findingLines = pdf.wrapped(finding, 9, CONTENT_W);
  const blockH = 8 + findingLines.length * 4.5 + 10;
  pdf.ensure(blockH);

  const top = pdf.y - 3;
  doc.setFillColor(...GROUND);
  doc.roundedRect(MARGIN, top, CONTENT_W, blockH, 1.2, 1.2, 'F');

  pdf.setType(11, 'bold', INK);
  doc.text(title, MARGIN + 3, pdf.y);
  pdf.setType(8, 'bold', TONE_COLOR[tone] || PENDING);
  doc.text(status.toUpperCase(), PAGE_W - MARGIN - 3, pdf.y, { align: 'right' });
  pdf.y += 6;
  pdf.paragraph(finding, 9, 4.5, MUTED);
  pdf.paragraph(`Source: ${source}`, 8, 4.2, MUTED);
  pdf.y = Math.max(pdf.y, top + blockH + 4);
}

/**
 * Typeset a facts-only A4 PDF from report data.
 * Does not capture or mutate the live modal — export stays instant and the screen does not freeze.
 */
export async function downloadIntelligenceReportPdf(
  input: IntelligenceReportPdfInput,
): Promise<void> {
  const renter = input.renter ?? defaultRenterContent(input.facts);
  const today = formatAsOf(new Date());
  const chip = ROLE_CHIP[input.audience] || 'Renter Report';
  const reference = reportReference(input.listingId);
  const address = input.propertyLocation || input.addressLabel || input.propertyTitle;
  const partBBody = renter.partBBody || input.epcText || '';
  const steps = renter.steps.length > 0 ? renter.steps : (input.lens?.steps ?? []);
  const partARows = renter.partARows.map((row) =>
    row.label === 'Price / Rent' && input.propertyPrice?.trim()
      ? { ...row, value: input.propertyPrice.trim() }
      : row,
  );

  const pdf = new PdfWriter();
  const { doc } = pdf;

  drawMasthead(doc, today, chip, reference);

  pdf.setType(18, 'bold', INK);
  const titleLines = pdf.wrapped(address, 18);
  for (const line of titleLines) {
    pdf.ensure(8);
    doc.text(line, MARGIN, pdf.y);
    pdf.y += 8;
  }

  pdf.y += 1;
  pdf.paragraph(`Correct as of ${today}  ·  ${reference}`, 8, 4.5, MUTED);
  pdf.paragraph(renter.precisionLine, 8, 4.2, MUTED);
  pdf.y += 2;

  pdf.rule();
  pdf.kicker('Summary');
  drawWatchBox(pdf, renter.whatToWatchTitle, renter.whatToWatchBody);

  pdf.kicker('Approximate location');
  pdf.paragraph('Postcode centroid, not the exact plot.', 9, 4.5, MUTED);
  pdf.paragraph(
    renter.mapSource?.trim() ||
      'Source: Google Maps Embed (address string) · Postcode centroid via postcodes.io',
    8,
    4.2,
    MUTED,
  );
  pdf.y += 3;

  if (renter.localArea.length > 0) {
    pdf.kicker('Local open intelligence');
    pdf.heading('Local Area Intelligence');
    pdf.paragraph(renter.localIntro, 9, 4.5, MUTED);
    pdf.y += 2;

    for (const check of renter.localArea) {
      drawAreaCheck(pdf, check.title, check.status, check.finding, check.source, check.tone);
    }
  }

  pdf.kicker('Statutory record · Parts A–C');
  pdf.heading('Full Report Breakdown');

  pdf.ensure(8);
  pdf.setType(8, 'bold', SEAL);
  doc.text('PART A', MARGIN, pdf.y);
  pdf.y += 5;
  pdf.setType(12, 'bold', INK);
  doc.text(renter.partATitle, MARGIN, pdf.y);
  pdf.y += 7;

  for (const row of partARows) {
    const value = row.qualifier ? `${row.value}  (${row.qualifier})` : row.value;
    drawLedgerRow(pdf, row.label, value);
  }

  if (renter.partANote) {
    pdf.y += 1;
    pdf.paragraph(renter.partANote, 8, 4.2, MUTED);
  }
  pdf.paragraph(`Source: ${renter.partASource}`, 8, 4.2, MUTED);
  pdf.y += 4;

  pdf.setType(8, 'bold', SEAL);
  doc.text('PART B', MARGIN, pdf.y);
  pdf.y += 5;
  pdf.setType(12, 'bold', INK);
  doc.text(renter.partBTitle, MARGIN, pdf.y);
  pdf.y += 7;
  if (partBBody) {
    pdf.paragraph(partBBody, 10, 5, INK);
  }
  pdf.paragraph(`Source: ${renter.partBSource}`, 8, 4.2, MUTED);
  pdf.y += 4;

  pdf.setType(8, 'bold', SEAL);
  doc.text(`PART C · ${renter.partCStatus.toUpperCase()}`, MARGIN, pdf.y);
  pdf.y += 5;
  pdf.setType(12, 'bold', INK);
  doc.text(renter.partCTitle, MARGIN, pdf.y);
  pdf.y += 7;
  pdf.paragraph(renter.partCBody || input.covenantText || '', 9, 4.5, MUTED);
  if (renter.paidCopy) {
    pdf.paragraph(renter.paidCopy, 8, 4.2, MUTED);
  }
  pdf.paragraph(`Source: ${renter.partCSource}`, 8, 4.2, MUTED);

  if (steps.length > 0) {
    pdf.y += 3;
    pdf.kicker('What to do next');
    pdf.heading('Recommended Action Steps');
    steps.forEach((step, index) => {
      const n = String(index + 1).padStart(2, '0');
      const lines = pdf.wrapped(step, 10, CONTENT_W - 10);
      const blockH = Math.max(8, lines.length * 5);
      pdf.ensure(blockH);
      pdf.setType(9, 'bold', INK);
      doc.text(n, MARGIN, pdf.y);
      pdf.setType(10, 'normal', MUTED);
      for (const line of lines) {
        pdf.ensure(5);
        doc.text(line, MARGIN + 10, pdf.y);
        pdf.y += 5;
      }
      pdf.y += 2.5;
    });
  }

  pdf.y += 4;
  pdf.rule();
  pdf.paragraph(renter.footerAudience, 8, 4.2, MUTED);

  drawFooters(doc);
  const propertyLabel = input.propertyLocation || input.propertyTitle || input.addressLabel;
  doc.save(buildIntelligenceReportFilename(propertyLabel));
}
