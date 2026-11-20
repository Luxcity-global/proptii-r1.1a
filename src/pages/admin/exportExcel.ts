/**
 * Minimal .xlsx download for ProptiiAdmin only.
 * Uses existing jszip — no SheetJS dependency.
 */
import JSZip from 'jszip';

export type ExcelCell = string | number | boolean | null | undefined;
export type ExcelSheet = { name: string; rows: ExcelCell[][] };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\u0000/g, '');
}

function colLetters(index: number): string {
  let n = index;
  let out = '';
  while (n >= 0) {
    out = String.fromCharCode((n % 26) + 65) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

function cellRef(row: number, col: number): string {
  return `${colLetters(col)}${row + 1}`;
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = (name || 'Sheet')
    .replace(/[\\/?*[\]:]/g, '-')
    .slice(0, 31)
    .trim() || 'Sheet';
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i})`;
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    i += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function sheetXml(rows: ExcelCell[][]): string {
  const body = rows
    .map((row, ri) => {
      const cells = row
        .map((val, ci) => {
          if (val === null || val === undefined || val === '') return '';
          const ref = cellRef(ri, ci);
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<c r="${ref}"><v>${val}</v></c>`;
          }
          if (typeof val === 'boolean') {
            return `<c r="${ref}" t="b"><v>${val ? 1 : 0}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(val))}</t></is></c>`;
        })
        .join('');
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${body}</sheetData>` +
    `</worksheet>`
  );
}

function ensureXlsxFilename(filename: string): string {
  const trimmed = (filename || 'export').replace(/\.csv$/i, '').replace(/\.xlsx$/i, '');
  return `${trimmed || 'export'}.xlsx`;
}

/** Build and download a multi-sheet .xlsx workbook. */
export async function downloadXlsx(filename: string, sheets: ExcelSheet[]): Promise<void> {
  if (!sheets.length) return;

  const zip = new JSZip();
  const usedNames = new Set<string>();
  const named = sheets.map((s) => ({
    name: sanitizeSheetName(s.name, usedNames),
    rows: s.rows,
  }));

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      named
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
        )
        .join('') +
      `</Types>`,
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`,
  );

  const xl = zip.folder('xl');
  xl?.file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>` +
      named
        .map(
          (s, i) =>
            `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
        )
        .join('') +
      `</sheets></workbook>`,
  );

  xl?.folder('_rels')?.file(
    'workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      named
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
        )
        .join('') +
      `</Relationships>`,
  );

  const worksheets = xl?.folder('worksheets');
  named.forEach((s, i) => {
    worksheets?.file(`sheet${i + 1}.xml`, sheetXml(s.rows));
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ensureXlsxFilename(filename);
  a.click();
  URL.revokeObjectURL(url);
}
