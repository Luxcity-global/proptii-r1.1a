import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import { defaultRenterContent } from '../data/renterReportFixtures';
import type { Audience, FactFlag, LocalAreaCheck, ReportLens, RenterReportContent } from '../types/govData';
import { buildIntelligenceReportFilename } from './reportPdfExport';
import { googleMapsStaticAddressUrl } from '../config/googleMaps';

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

/** Kept for callers/tests that still reference the previous static template path. */
export const INTELLIGENCE_REPORT_TEMPLATE_URL = '/templates/proptii-renter-report.pdf';
export const BRAND_ICON_URL = '/images/Proptii-logo-icon.png';
const BRAND_ICON_FILE = 'public/images/Proptii-logo-icon.png';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 48;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const ROLE_CHIP: Record<Audience, string> = {
  tenant: 'Renter Report',
  buyer: 'Buyer Report',
  landlord: 'Landlord Report',
  agent: 'Agent Report',
  homeowner: 'Homeowner Report',
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  tenant: 'Renter / Tenant',
  buyer: 'Buyer',
  landlord: 'Landlord',
  agent: 'Agent',
  homeowner: 'Homeowner',
};

const LENS_SHORT: Record<Audience, string> = {
  tenant: 'RENTER',
  buyer: 'BUYER',
  landlord: 'LANDLORD',
  agent: 'AGENT',
  homeowner: 'HOMEOWNER',
};

const B = {
  blue: rgb(19 / 255, 108 / 255, 158 / 255),
  blueDark: rgb(13 / 255, 82 / 255, 120 / 255),
  orange: rgb(220 / 255, 95 / 255, 18 / 255),
  ice: rgb(238 / 255, 246 / 255, 251 / 255),
  iceDeep: rgb(214 / 255, 235 / 255, 247 / 255),
  ink: rgb(15 / 255, 23 / 255, 42 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  faint: rgb(148 / 255, 163 / 255, 184 / 255),
  line: rgb(226 / 255, 232 / 255, 240 / 255),
  lineSoft: rgb(241 / 255, 245 / 255, 249 / 255),
  slate: rgb(51 / 255, 65 / 255, 85 / 255),
  white: rgb(1, 1, 1),
  panel: rgb(248 / 255, 250 / 255, 252 / 255),
  alertBg: rgb(254 / 255, 242 / 255, 242 / 255),
  alertBorder: rgb(254 / 255, 202 / 255, 202 / 255),
  alertTitle: rgb(185 / 255, 28 / 255, 28 / 255),
  alertBody: rgb(127 / 255, 29 / 255, 29 / 255),
  greenBg: rgb(220 / 255, 252 / 255, 231 / 255),
  greenFg: rgb(22 / 255, 101 / 255, 52 / 255),
  amberBg: rgb(254 / 255, 249 / 255, 195 / 255),
  amberFg: rgb(133 / 255, 77 / 255, 14 / 255),
  grayBg: rgb(241 / 255, 245 / 255, 249 / 255),
  grayFg: rgb(100 / 255, 116 / 255, 139 / 255),
  greenDot: rgb(74 / 255, 222 / 255, 128 / 255),
};

const CARD_ORDER = ['flood-risk', 'crime-safety', 'heritage-conservation'] as const;

const ICON = {
  zap: 'M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z',
  drop: 'M12 2.7 L17.7 8.4 C20.5 11.2 20.5 15.8 17.7 18.6 C14.9 21.4 9.1 21.4 6.3 18.6 C3.5 15.8 3.5 11.2 6.3 8.4 Z',
  shield: 'M12 22 C12 22 20 18 20 12 L20 5 L12 2 L4 5 L4 12 C4 18 12 22 12 22 Z',
  landmark: 'M3 21 L21 21 M6 21 L6 10 L12 4 L18 10 L18 21 M10 21 L10 14 L14 14 L14 21',
  warn: 'M12 3 L22 21 L2 21 Z',
};

type TemplateFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type ReportAssets = {
  brandIcon?: PDFImage;
  mapImage?: PDFImage;
};

export type IntelligenceReportRenderOptions = {
  /** PNG or JPEG bytes of a static map of the property area. */
  mapImageBytes?: Uint8Array | null;
};

const MAP_FETCH_TIMEOUT_MS = 6000;

async function loadStaticMapBytes(query: string): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  if (import.meta.env?.MODE === 'test') return null;
  const url = googleMapsStaticAddressUrl(query);
  if (!url) return null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), MAP_FETCH_TIMEOUT_MS) : null;
  try {
    const response = await fetch(url, { signal: controller?.signal });
    if (!response.ok || !/^image\//.test(response.headers.get('content-type') || '')) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function embedImage(pdf: PDFDocument, bytes: Uint8Array): Promise<PDFImage | undefined> {
  try {
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    return isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  } catch {
    return undefined;
  }
}

async function loadBrandIconBytes(): Promise<Uint8Array | null> {
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      return new Uint8Array(readFileSync(resolve(process.cwd(), BRAND_ICON_FILE)));
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    if (typeof fetch !== 'function') return null;
    const response = await fetch(BRAND_ICON_URL);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function drawBrandMark(
  page: PDFPage,
  assets: ReportAssets,
  fonts: TemplateFonts,
  x: number,
  y: number,
  size = 22,
) {
  if (assets.brandIcon) {
    page.drawImage(assets.brandIcon, { x, y, width: size, height: size });
    return;
  }
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: B.orange,
  });
  page.drawText('P', {
    x: x + size * 0.28,
    y: y + size * 0.28,
    size: size * 0.5,
    font: fonts.bold,
    color: B.white,
  });
}

function drawIconInBox(
  page: PDFPage,
  path: string,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  color: RGB,
  scale = 0.45,
  borderWidth = 1.5,
) {
  // SVG paths are authored on a 24x24 grid with center at (12, 12).
  // pdf-lib's drawSvgPath applies translate(x, y) then scale(s, -s), which draws downwards from y.
  // To strictly center the SVG path within box [boxX, boxY, boxW, boxH]:
  const drawX = boxX + boxW / 2 - 12 * scale;
  const drawY = boxY + boxH / 2 + 12 * scale;
  page.drawSvgPath(path, {
    x: drawX,
    y: drawY,
    scale,
    borderColor: color,
    borderWidth,
  });
}

function drawLineIcon(
  page: PDFPage,
  path: string,
  x: number,
  y: number,
  color: RGB,
  scale = 0.45,
  borderWidth = 1.6,
) {
  page.drawSvgPath(path, {
    x,
    y,
    scale,
    borderColor: color,
    borderWidth,
  });
}

function cardIconSpec(title: string): { path: string; color: RGB; bg: RGB } {
  const key = title.toLowerCase();
  if (key.includes('flood') || key.includes('water')) {
    return { path: ICON.drop, color: rgb(8 / 255, 145 / 255, 178 / 255), bg: rgb(236 / 255, 254 / 255, 255 / 255) };
  }
  if (key.includes('crime') || key.includes('safety') || key.includes('police')) {
    return { path: ICON.shield, color: rgb(217 / 255, 119 / 255, 6 / 255), bg: rgb(255 / 255, 251 / 255, 235 / 255) };
  }
  if (key.includes('heritage') || key.includes('conservation') || key.includes('listed')) {
    return { path: ICON.landmark, color: B.blue, bg: B.ice };
  }
  if (key.includes('epc') || key.includes('energy') || key.includes('utility')) {
    return { path: ICON.zap, color: B.blue, bg: B.ice };
  }
  return { path: ICON.zap, color: B.blue, bg: B.ice };
}

export type IntelligenceReportPdfFields = {
  chip: string;
  lensLabel: string;
  street: string;
  locality: string;
  address: string;
  postcode: string;
  audienceLabel: string;
  regulation: string;
  reference: string;
  headerTrail: string;
  footerTrail: string;
  asOf: string;
  verified: string;
  metaLine: string;
  watchTitle: string;
  watchBody: string;
  mapCaption: string;
  mapSource: string;
  partATitle: string;
  partARows: Array<{ label: string; value: string }>;
  partANote: string;
  partASource: string;
  partBTitle: string;
  partBBody: string;
  partBSource: string;
  partCTitle: string;
  partCStatus: string;
  titleRegister: string;
  covenantText: string;
  partCNote: string;
  partCSource: string;
  paidCopy: string;
  footerAudience: string;
  steps: string[];
  cards: Array<{ title: string; status: string; finding: string; source: string; tone: string }>;
};

function pdfSafe(value: string): string {
  return value
    .replace(/\u2022|\u00B7/g, '·')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2018|\u2019|\u201A/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '');
}

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

function splitAddress(value: string): { street: string; locality: string; postcode: string } {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { street: 'Selected property', locality: '', postcode: '' };
  const postcodeMatch = value.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return {
    street: parts[0],
    locality: parts.slice(1).join(', '),
    postcode: postcodeMatch ? postcodeMatch[1].toUpperCase().replace(/\s+/, ' ') : parts[parts.length - 1],
  };
}

function wrapText(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitText(font: PDFFont, text: string, size: number, width: number): string {
  const safe = pdfSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let clipped = safe;
  while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, size) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

function ledgerValue(row?: { value: string; qualifier?: string }): string {
  if (!row?.value) return '-';
  return row.qualifier ? `${row.value}  (${row.qualifier})` : row.value;
}

function findRow(
  rows: Array<{ label: string; value: string; qualifier?: string }>,
  matchers: string[],
) {
  return rows.find((row) => {
    const label = row.label.toLowerCase();
    return matchers.some((matcher) => label.includes(matcher));
  });
}

function findCard(cards: LocalAreaCheck[], id: string): LocalAreaCheck | undefined {
  return cards.find((card) => card.id === id);
}

function tagColors(toneOrStatus: string): { bg: RGB; fg: RGB } {
  const key = toneOrStatus.toLowerCase();
  if (key.includes('clear') || key.includes('resolved') || key.includes('compliant') || key.includes('low')) {
    return { bg: B.greenBg, fg: B.greenFg };
  }
  if (key.includes('amber') || key.includes('note') || key.includes('average') || key.includes('soon') || key.includes('caution')) {
    return { bg: B.amberBg, fg: B.amberFg };
  }
  if (key.includes('alert') || key.includes('flag') || key.includes('high') || key.includes('watch')) {
    return { bg: B.alertBg, fg: B.alertTitle };
  }
  if (key.includes('blue') || key.includes('band')) {
    return { bg: B.ice, fg: B.blue };
  }
  return { bg: B.grayBg, fg: B.grayFg };
}

/**
 * Pure field mapping used by the PDF builder and unit tests.
 * Does not read or mutate the live report modal.
 */
export function buildIntelligenceReportFields(
  input: IntelligenceReportPdfInput,
  now = new Date(),
): IntelligenceReportPdfFields {
  const renter = input.renter ?? defaultRenterContent(input.facts);
  const today = formatAsOf(now);
  const chip = ROLE_CHIP[input.audience] || 'Renter Report';
  const reference = reportReference(input.listingId);
  const address = input.propertyLocation || input.addressLabel || input.propertyTitle;
  const { street, locality, postcode } = splitAddress(address);
  const partBBody = renter.partBBody || input.epcText || '';
  const steps = renter.steps.length > 0 ? renter.steps : (input.lens?.steps ?? []);
  const partARows = renter.partARows.map((row) =>
    row.label === 'Price / Rent' && input.propertyPrice?.trim()
      ? { ...row, value: input.propertyPrice.trim() }
      : row,
  );
  const verified = /epc rating|band [a-g]/i.test(partBBody)
    ? 'OPEN & EPC Verified'
    : renter.precisionLine;
  const pendingC = /to come|pending|not in this report/i.test(
    `${renter.partCStatus} ${renter.partCBody} ${input.covenantText || ''}`,
  );

  const orderedCards = CARD_ORDER.map((id) => findCard(renter.localArea, id)).filter(
    (card): card is LocalAreaCheck => Boolean(card),
  );
  const cards =
    orderedCards.length > 0
      ? orderedCards
      : renter.localArea.slice(0, 3);

  return {
    chip,
    lensLabel: `CHANGE LENS (${LENS_SHORT[input.audience] || 'RENTER'})`,
    street,
    locality,
    address,
    postcode,
    audienceLabel: AUDIENCE_LABEL[input.audience] || 'Renter / Tenant',
    regulation: 'NTSELAT CPR 2008',
    reference,
    headerTrail: `PROPTII REPORT   |   ${street.toUpperCase()}  ·  ${reference}`,
    footerTrail: `PROPTII · ${reference}`,
    asOf: today,
    verified,
    metaLine: `Correct as of ${today}    ·    ${reference}    ·    ${verified}`,
    watchTitle: renter.whatToWatchTitle || 'What to Watch',
    watchBody: renter.whatToWatchBody,
    mapCaption: address,
    mapSource:
      renter.mapSource ||
      'Source: Google Maps / Street Address lookup. Postcode centroid is approximate (100m resolution).',
    partATitle: renter.partATitle || 'Financial & Transactional Terms',
    partARows: [
      { label: 'Price / Rent', value: ledgerValue(findRow(partARows, ['price', 'rent'])) },
      { label: 'Council Tax Band', value: ledgerValue(findRow(partARows, ['council'])) },
      { label: 'Tenure / Term', value: ledgerValue(findRow(partARows, ['tenure', 'term'])) },
      { label: 'Deposit', value: ledgerValue(findRow(partARows, ['deposit', 'exchange'])) },
    ],
    partANote: renter.partANote,
    partASource: renter.partASource || 'Listing Agent',
    partBTitle: renter.partBTitle || 'Utilities & EPC',
    partBBody,
    partBSource: renter.partBSource || 'MHCLG National EPC Register',
    partCTitle: renter.partCTitle || 'Restrictive Covenants & Title',
    partCStatus: (renter.partCStatus || 'To come in next release').toUpperCase(),
    titleRegister: pendingC ? '-' : (input.covenantText || renter.partCBody || '-'),
    covenantText: pendingC ? '-' : (input.covenantText || '-'),
    partCNote: renter.partCStatus || 'To come in next release',
    partCSource: renter.partCSource || '',
    paidCopy: renter.paidCopy,
    footerAudience: renter.footerAudience,
    steps,
    cards: cards.map((card) => ({
      title: card.title,
      status: card.status || 'Unresolved',
      finding: card.finding || 'Data unresolved - register did not return a value for this module.',
      source: card.source || 'Open data',
      tone: card.tone || card.status || 'note',
    })),
  };
}

function drawTextAt(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  const safe = pdfSafe(text);
  if (!safe) return;
  page.drawText(safe, { x, y, size, font, color });
}

function drawFooter(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  assets: ReportAssets,
) {
  const footerH = 42;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: footerH,
    color: B.ice,
  });
  page.drawRectangle({
    x: 0,
    y: footerH - 2,
    width: PAGE_W,
    height: 2,
    color: B.iceDeep,
  });
  drawTextAt(page, fields.footerTrail, MARGIN_X, 24, 8, fonts.bold, B.slate);
  drawTextAt(
    page,
    fitText(fonts.regular, fields.footerAudience || 'Demonstration purposes only. Not a substitute for legal advice.', 7, 360),
    MARGIN_X,
    12,
    7,
    fonts.regular,
    B.faint,
  );
  const site = 'proptii.com';
  const siteW = fonts.bold.widthOfTextAtSize(site, 8);
  drawBrandMark(page, assets, fonts, PAGE_W - MARGIN_X - siteW - 28, 12, 18);
  drawTextAt(page, site, PAGE_W - MARGIN_X - siteW, 16, 8, fonts.bold, B.muted);
}

function drawSectionHead(page: PDFPage, title: string, y: number, fonts: TemplateFonts): number {
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 2,
    width: 3,
    height: 11,
    color: B.blue,
  });
  drawTextAt(page, title.toUpperCase(), MARGIN_X + 10, y, 8, fonts.bold, B.blue);
  const titleW = fonts.bold.widthOfTextAtSize(pdfSafe(title.toUpperCase()), 8);
  page.drawRectangle({
    x: MARGIN_X + 16 + titleW,
    y: y + 3,
    width: Math.max(20, CONTENT_W - titleW - 16),
    height: 0.8,
    color: B.line,
  });
  return y - 22;
}

function drawTag(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  fonts: TemplateFonts,
  tone: string,
): number {
  const label = pdfSafe(text.toUpperCase());
  const size = 7;
  const padX = 6;
  const padY = 3;
  const width = fonts.bold.widthOfTextAtSize(label, size) + padX * 2;
  const height = size + padY * 2;
  const colors = tagColors(tone);
  page.drawRectangle({
    x,
    y: y - padY,
    width,
    height,
    color: colors.bg,
  });
  drawTextAt(page, label, x + padX, y, size, fonts.bold, colors.fg);
  return width;
}

function drawHeader(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  assets: ReportAssets,
): number {
  const headerH = 210;
  page.drawRectangle({
    x: 0,
    y: PAGE_H - headerH,
    width: PAGE_W,
    height: headerH,
    color: B.blue,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 72,
    width: PAGE_W,
    height: 72,
    color: B.blueDark,
  });

  // Brand mark on a white tile so the blue icon reads against the dark band
  const tileSize = 24;
  const tileY = PAGE_H - 48;
  page.drawRectangle({
    x: MARGIN_X,
    y: tileY,
    width: tileSize,
    height: tileSize,
    color: B.white,
  });
  drawBrandMark(page, assets, fonts, MARGIN_X + 2, tileY + 2, tileSize - 4);
  const wordmarkY = tileY + tileSize / 2 - 4;
  drawTextAt(page, 'PROPTII', MARGIN_X + tileSize + 10, wordmarkY, 11, fonts.bold, B.white);
  const wordmarkW = fonts.bold.widthOfTextAtSize('PROPTII', 11);
  drawTextAt(
    page,
    'PROPERTY INTELLIGENCE',
    MARGIN_X + tileSize + 10 + wordmarkW + 10,
    wordmarkY + 1,
    7,
    fonts.regular,
    rgb(0.85, 0.9, 0.95),
  );

  // Role pill
  page.drawRectangle({
    x: MARGIN_X,
    y: PAGE_H - 72,
    width: 96,
    height: 16,
    color: rgb(1, 1, 1),
    opacity: 0.14,
  });
  page.drawCircle({
    x: MARGIN_X + 10,
    y: PAGE_H - 64,
    size: 3,
    color: B.orange,
  });
  drawTextAt(page, fields.chip.toUpperCase(), MARGIN_X + 18, PAGE_H - 67, 7, fonts.bold, B.white);

  // Address
  const addressLines = [
    fields.street,
    ...fields.locality.split(',').map((p) => p.trim()).filter(Boolean),
  ].filter(Boolean);
  addressLines.slice(0, 3).forEach((line, index) => {
    drawTextAt(
      page,
      fitText(fonts.bold, line + (index < Math.min(addressLines.length, 3) - 1 ? ',' : ''), 18, 310),
      MARGIN_X,
      PAGE_H - 100 - index * 22,
      18,
      fonts.bold,
      B.white,
    );
  });

  // Meta panel
  const panelX = PAGE_W - MARGIN_X - 150;
  const panelY = PAGE_H - 168;
  page.drawRectangle({
    x: panelX,
    y: panelY,
    width: 150,
    height: 118,
    color: rgb(0, 0, 0),
    opacity: 0.22,
  });
  drawTextAt(page, 'REPORT ID', panelX + 14, PAGE_H - 68, 7, fonts.bold, rgb(0.85, 0.9, 0.95));
  drawTextAt(page, fields.reference, panelX + 14, PAGE_H - 82, 11, fonts.bold, B.white);
  drawTextAt(page, 'CORRECT AS OF', panelX + 14, PAGE_H - 104, 7, fonts.bold, rgb(0.85, 0.9, 0.95));
  drawTextAt(page, fields.asOf, panelX + 14, PAGE_H - 118, 10, fonts.regular, B.white);
  page.drawCircle({
    x: panelX + 20,
    y: PAGE_H - 142,
    size: 3,
    color: B.greenDot,
  });
  drawTextAt(
    page,
    fitText(fonts.bold, fields.verified.toUpperCase(), 6.5, 120),
    panelX + 28,
    PAGE_H - 145,
    6.5,
    fonts.bold,
    B.white,
  );

  // Bottom meta strip
  const stripY = PAGE_H - headerH + 12;
  const cols = [
    { label: 'POSTCODE', value: fields.postcode || '-' },
    { label: 'AUDIENCE', value: fields.audienceLabel },
    { label: 'REGULATION', value: fields.regulation },
  ];
  cols.forEach((col, index) => {
    const x = MARGIN_X + index * (CONTENT_W / 3);
    if (index > 0) {
      page.drawRectangle({
        x,
        y: stripY,
        width: 0.8,
        height: 28,
        color: rgb(1, 1, 1),
        opacity: 0.18,
      });
    }
    drawTextAt(page, col.label, x + (index > 0 ? 12 : 0), stripY + 22, 7, fonts.bold, rgb(0.8, 0.88, 0.94));
    drawTextAt(
      page,
      fitText(fonts.regular, col.value, 10, CONTENT_W / 3 - 20),
      x + (index > 0 ? 12 : 0),
      stripY + 8,
      10,
      fonts.regular,
      B.white,
    );
  });

  // Orange rule
  page.drawRectangle({
    x: 0,
    y: PAGE_H - headerH - 3,
    width: PAGE_W,
    height: 3,
    color: B.orange,
  });

  return PAGE_H - headerH - 28;
}

function drawWatchAlert(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  yTop: number,
): number {
  const padX = 14;
  const textX = MARGIN_X + padX;
  const lines = wrapText(fonts.regular, fields.watchBody, 9.5, CONTENT_W - padX * 2).slice(0, 4);
  const boxH = 30 + lines.length * 12;
  const y = yTop - boxH;
  page.drawRectangle({
    x: MARGIN_X,
    y,
    width: CONTENT_W,
    height: boxH,
    color: B.alertBg,
    borderColor: B.alertBorder,
    borderWidth: 1,
  });

  // Warning icon sits inline with the title, matching the on-screen report.
  const titleBaseline = yTop - 17;
  const iconSize = 11;
  const iconX = textX;
  const iconY = titleBaseline - 2;
  // Triangle path spans y 3..21 on the 24 grid; shift so its visual centre sits on the title cap height.
  drawIconInBox(page, ICON.warn, iconX, iconY - 1, iconSize, iconSize, B.alertTitle, iconSize / 24, 1.1);
  const iconCenterX = iconX + iconSize / 2;
  const iconBaseY = iconY - 1 + iconSize / 2 - (21 - 12) * (iconSize / 24);
  page.drawRectangle({
    x: iconCenterX - 0.5,
    y: iconBaseY + 2.8,
    width: 1,
    height: 2.8,
    color: B.alertTitle,
  });
  page.drawCircle({
    x: iconCenterX,
    y: iconBaseY + 1.7,
    size: 0.6,
    color: B.alertTitle,
  });

  drawTextAt(page, fields.watchTitle.toUpperCase(), textX + iconSize + 6, titleBaseline, 8, fonts.bold, B.alertTitle);
  lines.forEach((line, index) => {
    drawTextAt(page, line, textX, titleBaseline - 16 - index * 12, 9.5, fonts.regular, B.alertBody);
  });
  return y - 20;
}

function drawMapChip(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB,
  maxW: number,
  align: 'left' | 'right' = 'left',
) {
  const label = fitText(font, text, size, maxW - 12);
  const w = font.widthOfTextAtSize(label, size) + 12;
  const h = size + 7;
  const boxX = align === 'right' ? x - w : x;
  page.drawRectangle({
    x: boxX,
    y,
    width: w,
    height: h,
    color: B.white,
    opacity: 0.94,
    borderColor: B.line,
    borderWidth: 0.6,
  });
  drawTextAt(page, label, boxX + 6, y + 4, size, font, color);
}

function drawPlaceholderMapBody(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, color: B.panel });

  for (let i = 1; i < 10; i += 1) {
    page.drawRectangle({ x: x + i * (w / 10), y, width: 0.5, height: h, color: B.line, opacity: 0.5 });
    page.drawRectangle({ x, y: y + i * (h / 10), width: w, height: 0.5, color: B.line, opacity: 0.5 });
  }

  // Teardrop pin: tip rests on the centroid, head floats above it.
  const tipX = x + w / 2;
  const tipY = y + h / 2 - 6;
  const headR = 8;
  const headY = tipY + 18;
  page.drawCircle({ x: tipX, y: tipY, size: 16, color: B.iceDeep, opacity: 0.45 });
  page.drawSvgPath(`M 0 0 L ${-headR * 0.72} ${-12} L ${headR * 0.72} ${-12} Z`, {
    x: tipX,
    y: tipY,
    scale: 1,
    color: B.blue,
  });
  page.drawCircle({ x: tipX, y: headY, size: headR, color: B.blue });
  page.drawCircle({ x: tipX, y: headY, size: 3.2, color: B.orange });
}

function drawMap(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  assets: ReportAssets,
  yTop: number,
): number {
  const mapH = 140;
  const y = yTop - mapH;

  if (assets.mapImage) {
    page.drawImage(assets.mapImage, { x: MARGIN_X, y, width: CONTENT_W, height: mapH });
  } else {
    drawPlaceholderMapBody(page, MARGIN_X, y, CONTENT_W, mapH);
  }

  page.drawRectangle({
    x: MARGIN_X,
    y,
    width: CONTENT_W,
    height: mapH,
    borderColor: B.line,
    borderWidth: 1,
  });

  // Chips stay along the top edge so the map provider's logo and attribution (bottom) remain visible.
  const inset = 10;
  const chipTop = y + mapH - inset;
  const postcodeText = (fields.postcode || '').toUpperCase();
  const metaLabel = postcodeText ? `CENTROID: ${postcodeText}  ·  100M RESOLUTION` : '100M RESOLUTION';
  const metaW = fonts.bold.widthOfTextAtSize(pdfSafe(metaLabel), 7) + 12;
  drawMapChip(
    page,
    metaLabel,
    MARGIN_X + CONTENT_W - inset,
    chipTop - 14,
    fonts.bold,
    7,
    B.muted,
    metaW,
    'right',
  );
  drawMapChip(
    page,
    fields.mapCaption,
    MARGIN_X + inset,
    chipTop - 15.5,
    fonts.regular,
    8.5,
    B.slate,
    CONTENT_W - inset * 3 - metaW,
  );

  const sourceLines = wrapText(fonts.regular, fields.mapSource, 7.5, CONTENT_W).slice(0, 2);
  sourceLines.forEach((line, index) => {
    drawTextAt(page, line, MARGIN_X, y - 14 - index * 10, 7.5, fonts.regular, B.faint);
  });
  return y - 14 - sourceLines.length * 10 - 14;
}

function drawIntelCards(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  yTop: number,
): number {
  const gap = 10;
  const cardW = (CONTENT_W - gap * 2) / 3;
  const cardH = 118;
  const y = yTop - cardH;
  const cards = fields.cards.slice(0, 3);

  while (cards.length < 3) {
    cards.push({
      title: 'Area Check',
      status: 'Unresolved',
      finding: 'Data unresolved - register did not return a value for this module.',
      source: 'Open data',
      tone: 'note',
    });
  }

  cards.forEach((card, index) => {
    const x = MARGIN_X + index * (cardW + gap);
    const icon = cardIconSpec(card.title);
    page.drawRectangle({
      x,
      y,
      width: cardW,
      height: cardH,
      color: B.white,
      borderColor: B.line,
      borderWidth: 1,
    });
    const boxX = x + 12;
    const boxY = y + cardH - 36;
    const boxSize = 24;
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxSize,
      height: boxSize,
      color: icon.bg,
    });
    drawIconInBox(page, icon.path, boxX, boxY, boxSize, boxSize, icon.color, 0.45, 1.5);
    const tagW = fonts.bold.widthOfTextAtSize(pdfSafe(card.status.toUpperCase()), 7) + 12;
    drawTag(page, card.status, x + cardW - 12 - tagW, y + cardH - 28, fonts, card.tone);
    drawTextAt(page, fitText(fonts.bold, card.title, 10, cardW - 24), x + 12, y + cardH - 52, 10, fonts.bold, B.ink);
    wrapText(fonts.regular, card.finding, 8, cardW - 24)
      .slice(0, 3)
      .forEach((line, lineIndex) => {
        drawTextAt(page, line, x + 12, y + cardH - 68 - lineIndex * 11, 8, fonts.regular, B.muted);
      });
    page.drawRectangle({
      x: x + 12,
      y: y + 22,
      width: cardW - 24,
      height: 0.6,
      color: B.lineSoft,
    });
    drawTextAt(
      page,
      fitText(fonts.bold, card.source.toUpperCase(), 6.5, cardW - 24),
      x + 12,
      y + 10,
      6.5,
      fonts.bold,
      B.faint,
    );
  });

  return y - 24;
}

function drawPartBlock(
  page: PDFPage,
  fonts: TemplateFonts,
  yTop: number,
  part: string,
  title: string,
  tagLabel: string,
  tagTone: string,
  rows: Array<{ label: string; value: string }>,
  note: string,
  source: string,
  pendingNote?: string,
): number {
  const rowH = 22;
  const headerH = 28;
  const noteLines = note ? wrapText(fonts.regular, note, 8, CONTENT_W - 36).slice(0, 2) : [];
  const pendingLines = pendingNote
    ? wrapText(fonts.regular, pendingNote, 8.5, CONTENT_W - 48).slice(0, 2)
    : [];
  const pendingH = pendingLines.length ? 28 + pendingLines.length * 11 : 0;
  const noteH = noteLines.length ? 8 + noteLines.length * 10 : 0;
  const sourceH = source ? 20 : 0;
  const boxH = headerH + rows.length * rowH + noteH + pendingH + sourceH + 10;
  let y = yTop - boxH;

  page.drawRectangle({
    x: MARGIN_X,
    y,
    width: CONTENT_W,
    height: boxH,
    color: B.white,
    borderColor: B.line,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: yTop - headerH,
    width: CONTENT_W,
    height: headerH,
    color: B.panel,
  });
  drawTextAt(page, `PART ${part}`, MARGIN_X + 14, yTop - 18, 8, fonts.bold, B.blue);
  drawTextAt(page, title, MARGIN_X + 70, yTop - 18, 11, fonts.bold, B.ink);
  const tagW = fonts.bold.widthOfTextAtSize(pdfSafe(tagLabel.toUpperCase()), 7) + 12;
  drawTag(page, tagLabel, MARGIN_X + CONTENT_W - 14 - tagW, yTop - 18, fonts, tagTone);

  rows.forEach((row, index) => {
    const rowY = yTop - headerH - 16 - index * rowH;
    drawTextAt(page, row.label, MARGIN_X + 14, rowY, 9.5, fonts.regular, B.muted);
    const value = fitText(fonts.regular, row.value, 10, 280);
    const valueW = fonts.regular.widthOfTextAtSize(value, 10);
    drawTextAt(page, value, MARGIN_X + CONTENT_W - 14 - valueW, rowY, 10, fonts.regular, B.ink);
    page.drawRectangle({
      x: MARGIN_X + 14,
      y: rowY - 8,
      width: CONTENT_W - 28,
      height: 0.5,
      color: B.lineSoft,
    });
  });

  let cursor = yTop - headerH - rows.length * rowH - 8;
  if (pendingLines.length) {
    cursor -= 8;
    const pendingBoxH = 16 + pendingLines.length * 11;
    page.drawRectangle({
      x: MARGIN_X + 14,
      y: cursor - pendingBoxH,
      width: CONTENT_W - 28,
      height: pendingBoxH,
      color: B.panel,
      borderColor: B.line,
      borderWidth: 0.8,
    });
    pendingLines.forEach((line, index) => {
      drawTextAt(page, line, MARGIN_X + 24, cursor - 14 - index * 11, 8.5, fonts.regular, B.faint);
    });
    cursor -= pendingBoxH + 4;
  }

  noteLines.forEach((line, index) => {
    drawTextAt(page, line, MARGIN_X + 14, cursor - 12 - index * 10, 8, fonts.regular, B.faint);
  });

  if (source) {
    page.drawRectangle({
      x: MARGIN_X,
      y,
      width: CONTENT_W,
      height: sourceH,
      color: B.panel,
    });
    drawTextAt(
      page,
      fitText(fonts.bold, `SOURCE: ${source.toUpperCase()}`, 6.5, CONTENT_W - 28),
      MARGIN_X + 14,
      y + 7,
      6.5,
      fonts.bold,
      B.faint,
    );
  }

  return y - 14;
}

function drawSteps(
  page: PDFPage,
  fields: IntelligenceReportPdfFields,
  fonts: TemplateFonts,
  yTop: number,
): number {
  let y = yTop;
  fields.steps.slice(0, 6).forEach((step, index) => {
    const n = String(index + 1).padStart(2, '0');
    const lines = wrapText(fonts.regular, step, 9.5, CONTENT_W - 56).slice(0, 2);
    const boxH = 16 + lines.length * 12;
    y -= boxH;
    page.drawRectangle({
      x: MARGIN_X,
      y,
      width: CONTENT_W,
      height: boxH,
      color: B.white,
      borderColor: B.line,
      borderWidth: 1,
    });
    drawTextAt(page, `${n}.`, MARGIN_X + 12, y + boxH - 14, 10, fonts.bold, B.blue);
    lines.forEach((line, lineIndex) => {
      drawTextAt(page, line, MARGIN_X + 40, y + boxH - 14 - lineIndex * 12, 9.5, fonts.regular, B.slate);
    });
    y -= 8;
  });
  return y;
}

async function renderReportPdf(
  fields: IntelligenceReportPdfFields,
  options: IntelligenceReportRenderOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: TemplateFonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const assets: ReportAssets = {};
  const brandBytes = await loadBrandIconBytes();
  if (brandBytes) {
    assets.brandIcon = await pdf.embedPng(brandBytes);
  }
  if (options.mapImageBytes?.length) {
    assets.mapImage = await embedImage(pdf, options.mapImageBytes);
  }

  const page1 = pdf.addPage([PAGE_W, PAGE_H]);
  const page2 = pdf.addPage([PAGE_W, PAGE_H]);

  let y = drawHeader(page1, fields, fonts, assets);
  y = drawWatchAlert(page1, fields, fonts, y);
  y = drawSectionHead(page1, 'Area Intelligence — Postcode Centroid, 100m Resolution', y, fonts);
  y = drawMap(page1, fields, fonts, assets, y);
  drawIntelCards(page1, fields, fonts, y);
  drawFooter(page1, fields, fonts, assets);

  y = PAGE_H - 48;
  y = drawSectionHead(page2, 'Full Report Breakdown — NTSELAT CPR 2008 Parts A–C', y, fonts);
  y = drawPartBlock(
    page2,
    fonts,
    y,
    'A',
    fields.partATitle,
    'Required',
    'gray',
    fields.partARows,
    fields.partANote,
    fields.partASource,
  );
  y = drawPartBlock(
    page2,
    fonts,
    y,
    'B',
    fields.partBTitle,
    'Required',
    'gray',
    [{ label: 'EPC Summary', value: fields.partBBody || '-' }],
    '',
    fields.partBSource,
  );
  const pendingC = /to come|pending|not in this report|-/i.test(
    `${fields.partCStatus} ${fields.titleRegister} ${fields.covenantText}`,
  );
  y = drawPartBlock(
    page2,
    fonts,
    y,
    'C',
    fields.partCTitle,
    pendingC ? 'Coming Soon' : 'Available',
    pendingC ? 'amber' : 'green',
    [
      { label: 'Title Register & Covenant Text', value: fields.titleRegister },
    ],
    '',
    fields.partCSource,
    pendingC ? fields.paidCopy : undefined,
  );
  y = drawSectionHead(page2, 'Recommended Action Steps', y, fonts);
  drawSteps(page2, fields, fonts, y);
  drawFooter(page2, fields, fonts, assets);

  return pdf.save();
}

/**
 * Build the redesigned A4 intelligence report PDF.
 * `templateBytes` is accepted for API compatibility but ignored — layout is drawn in code.
 */
export async function fillIntelligenceReportPdf(
  input: IntelligenceReportPdfInput,
  _templateBytes?: Uint8Array,
  options?: IntelligenceReportRenderOptions,
): Promise<Uint8Array> {
  return renderReportPdf(buildIntelligenceReportFields(input), options);
}

function triggerBrowserDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Generate the designed A4 report with live report data and download it.
 * Does not capture or mutate the live modal.
 */
export async function downloadIntelligenceReportPdf(
  input: IntelligenceReportPdfInput,
): Promise<void> {
  const mapQuery = input.propertyLocation || input.addressLabel || input.propertyTitle;
  const mapImageBytes = await loadStaticMapBytes(mapQuery);
  const pdfBytes = await fillIntelligenceReportPdf(input, undefined, { mapImageBytes });
  const propertyLabel = input.propertyLocation || input.propertyTitle || input.addressLabel;
  triggerBrowserDownload(pdfBytes, buildIntelligenceReportFilename(propertyLabel));
}
