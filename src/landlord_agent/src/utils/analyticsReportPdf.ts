import type { PDFFont, PDFPage, RGB } from 'pdf-lib';

export type AnalyticsReportInput = {
  ownerName: string;
  scopeLabel: string;
  rangeLabel: string;
  generatedAt?: Date;
  kpis: Array<{ label: string; value: string; sub?: string }>;
  summary: Array<{ label: string; value: string }>;
  trend: Array<{ month: string; revenue: string; expenses: string }>;
  yields: Array<{ label: string; value: string }>;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Standard PDF fonts are WinAnsi-only; strip anything they cannot encode. */
function pdfSafe(value: string): string {
  return String(value ?? '')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '');
}

function fit(font: PDFFont, text: string, size: number, width: number): string {
  const safe = pdfSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let clipped = safe;
  while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, size) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

export function buildAnalyticsReportFilename(rangeLabel: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  const range = rangeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `proptii-analytics-report-${range}-${stamp}.pdf`;
}

export async function buildAnalyticsReportPdf(input: AnalyticsReportInput): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const C = {
    blue: rgb(19 / 255, 108 / 255, 158 / 255),
    blueDark: rgb(13 / 255, 82 / 255, 120 / 255),
    orange: rgb(220 / 255, 95 / 255, 18 / 255),
    ink: rgb(15 / 255, 23 / 255, 42 / 255),
    muted: rgb(100 / 255, 116 / 255, 139 / 255),
    faint: rgb(148 / 255, 163 / 255, 184 / 255),
    line: rgb(226 / 255, 232 / 255, 240 / 255),
    panel: rgb(248 / 255, 250 / 255, 252 / 255),
    white: rgb(1, 1, 1),
  };

  const pdf = await PDFDocument.create();
  pdf.setTitle('Proptii Portfolio Analytics Report');
  pdf.setAuthor('Proptii');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const generatedAt = input.generatedAt ?? new Date();

  const text = (p: PDFPage, value: string, x: number, y: number, size: number, font: PDFFont, color: RGB) => {
    const safe = pdfSafe(value);
    if (safe) p.drawText(safe, { x, y, size, font, color });
  };

  const sectionHead = (title: string, y: number): number => {
    page.drawRectangle({ x: MARGIN, y: y - 2, width: 3, height: 11, color: C.blue });
    text(page, title.toUpperCase(), MARGIN + 10, y, 8, bold, C.blue);
    return y - 20;
  };

  const table = (
    y: number,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ): number => {
    const rowH = 20;
    page.drawRectangle({ x: MARGIN, y: y - rowH + 6, width: CONTENT_W, height: rowH, color: C.panel });
    let x = MARGIN + 10;
    headers.forEach((h, i) => {
      text(page, h.toUpperCase(), x, y - 7, 7.5, bold, C.muted);
      x += colWidths[i];
    });
    let cursor = y - rowH;
    rows.forEach((row) => {
      let cx = MARGIN + 10;
      row.forEach((cell, i) => {
        text(page, fit(i === 0 ? bold : regular, cell, 9.5, colWidths[i] - 12), cx, cursor - 7, 9.5, i === 0 ? bold : regular, C.ink);
        cx += colWidths[i];
      });
      page.drawRectangle({ x: MARGIN, y: cursor - 14, width: CONTENT_W, height: 0.6, color: C.line });
      cursor -= rowH;
    });
    return cursor - 14;
  };

  // Header band
  const headerH = 132;
  page.drawRectangle({ x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH, color: C.blue });
  page.drawRectangle({ x: 0, y: PAGE_H - 44, width: PAGE_W, height: 44, color: C.blueDark });
  text(page, 'PROPTII', MARGIN, PAGE_H - 28, 11, bold, C.white);
  text(page, 'PORTFOLIO ANALYTICS', MARGIN + bold.widthOfTextAtSize('PROPTII', 11) + 10, PAGE_H - 27, 7, regular, rgb(0.85, 0.9, 0.95));
  text(page, 'Portfolio Analytics Report', MARGIN, PAGE_H - 78, 20, bold, C.white);
  text(page, fit(regular, `Prepared for ${input.ownerName}`, 10, CONTENT_W), MARGIN, PAGE_H - 96, 10, regular, rgb(0.85, 0.9, 0.95));
  const meta = `${input.scopeLabel}  ·  Range: ${input.rangeLabel}  ·  Generated ${generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  text(page, fit(regular, meta, 9, CONTENT_W), MARGIN, PAGE_H - 116, 9, regular, C.white);
  page.drawRectangle({ x: 0, y: PAGE_H - headerH - 3, width: PAGE_W, height: 3, color: C.orange });

  let y = PAGE_H - headerH - 32;

  // KPI cards
  y = sectionHead('Key Metrics', y);
  const gap = 10;
  const kpis = input.kpis.slice(0, 4);
  const cardW = (CONTENT_W - gap * (kpis.length - 1)) / Math.max(1, kpis.length);
  const cardH = 64;
  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (cardW + gap);
    page.drawRectangle({ x, y: y - cardH, width: cardW, height: cardH, color: C.white, borderColor: C.line, borderWidth: 1 });
    text(page, fit(bold, kpi.label, 8, cardW - 20), x + 10, y - 16, 8, bold, C.muted);
    text(page, fit(bold, kpi.value, 16, cardW - 20), x + 10, y - 38, 16, bold, C.ink);
    if (kpi.sub) text(page, fit(regular, kpi.sub, 7.5, cardW - 20), x + 10, y - 54, 7.5, regular, C.faint);
  });
  y -= cardH + 28;

  if (input.summary.length > 0) {
    y = sectionHead('Portfolio Summary', y);
    y = table(y, ['Measure', 'Value'], input.summary.map((r) => [r.label, r.value]), [CONTENT_W * 0.6, CONTENT_W * 0.4]);
  }

  if (input.trend.length > 0) {
    y = sectionHead('Revenue Trend', y);
    y = table(
      y,
      ['Month', 'Revenue', 'Expenses (est.)'],
      input.trend.map((r) => [r.month, r.revenue, r.expenses]),
      [CONTENT_W * 0.34, CONTENT_W * 0.33, CONTENT_W * 0.33],
    );
  }

  if (input.yields.length > 0 && y > 140) {
    y = sectionHead('Top Property Yields', y);
    table(y, ['Property', 'Gross Yield'], input.yields.map((r) => [r.label, r.value]), [CONTENT_W * 0.7, CONTENT_W * 0.3]);
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 36, color: C.panel });
  text(page, 'Figures are estimates based on your Proptii portfolio data for the selected range.', MARGIN, 15, 7.5, regular, C.faint);
  const site = 'proptii.com';
  text(page, site, PAGE_W - MARGIN - bold.widthOfTextAtSize(site, 8), 15, 8, bold, C.muted);

  return pdf.save();
}

export async function downloadAnalyticsReportPdf(input: AnalyticsReportInput): Promise<void> {
  const bytes = await buildAnalyticsReportPdf(input);
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildAnalyticsReportFilename(input.rangeLabel, input.generatedAt);
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
