import type { IntelligenceReportPdfFields } from './intelligenceReportPdf';

const B = {
  blue: '#136C9E',
  blueDark: '#0D5278',
  orange: '#DC5F12',
  ice: '#EEF6FB',
  iceDeep: '#D6EBF7',
  ink: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  lineSoft: '#F1F5F9',
  slate: '#334155',
  white: '#FFFFFF',
  panel: '#F8FAFC',
};

const ARCHIVO = "font-family:'Archivo',Arial,Helvetica,sans-serif;";
const NUNITO = "font-family:'Nunito Sans',Arial,Helvetica,sans-serif;";

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tagHtml(text: string, variant: 'gray' | 'green' | 'amber' | 'blue' | 'red' = 'gray'): string {
  const map = {
    gray: { bg: '#F1F5F9', color: '#64748B' },
    green: { bg: '#DCFCE7', color: '#166534' },
    amber: { bg: '#FEF9C3', color: '#854D0E' },
    blue: { bg: B.ice, color: B.blue },
    red: { bg: '#FEE2E2', color: '#991B1B' },
  } as const;
  const { bg, color } = map[variant];
  return `<span class="pdf-tag" style="${NUNITO}display:inline-flex;align-items:center;line-height:1;background:${bg};color:${color};font-size:9px;font-weight:700;letter-spacing:0.06em;padding:4px 8px;border-radius:3px;text-transform:uppercase;white-space:nowrap;">${esc(text)}</span>`;
}

function tagVariant(toneOrStatus: string): 'gray' | 'green' | 'amber' | 'blue' | 'red' {
  const key = toneOrStatus.toLowerCase();
  if (/(clear|resolved|compliant|low|protected)/.test(key)) return 'green';
  if (/(amber|note|average|soon|caution|coming)/.test(key)) return 'amber';
  if (/(alert|flag|high|watch)/.test(key)) return 'red';
  if (/(blue|band|epc)/.test(key)) return 'blue';
  return 'gray';
}

function iconSvg(kind: 'zap' | 'drop' | 'shield' | 'heritage' | 'warn', color: string): string {
  const common = `width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'zap':
      return `<svg ${common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'drop':
      return `<svg ${common}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'shield':
      return `<svg ${common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    case 'heritage':
      return `<svg ${common}><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>`;
    case 'warn':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }
}

function cardIcon(title: string): { svg: string; bg: string } {
  const key = title.toLowerCase();
  if (key.includes('flood')) return { svg: iconSvg('drop', '#0891B2'), bg: '#ECFEFF' };
  if (key.includes('crime') || key.includes('safety')) return { svg: iconSvg('shield', '#D97706'), bg: '#FFFBEB' };
  if (key.includes('heritage') || key.includes('conservation')) {
    return { svg: iconSvg('heritage', '#B45309'), bg: '#FFFBEB' };
  }
  return { svg: iconSvg('zap', B.blue), bg: B.ice };
}

function sectionHead(title: string): string {
  return `<div class="pdf-section-head" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <div class="pdf-section-marker" style="width:3px;height:14px;border-radius:2px;background:${B.blue};flex-shrink:0;"></div>
    <span class="pdf-section-head-title" style="${ARCHIVO}font-size:9.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${B.blue};line-height:1;">${esc(title)}</span>
    <div style="flex:1;height:1px;background:${B.line};"></div>
  </div>`;
}

function dataRow(label: string, value: string): string {
  return `<div style="display:flex;align-items:baseline;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${B.lineSoft};gap:16px;">
    <span style="${NUNITO}font-size:12px;color:${B.muted};flex-shrink:0;">${esc(label)}</span>
    <span style="${NUNITO}font-size:12.5px;color:${B.ink};font-weight:500;text-align:right;">${esc(value)}</span>
  </div>`;
}

function partBlock(
  part: string,
  title: string,
  tag: string,
  tagTone: string,
  rowsHtml: string,
  source: string,
  note = '',
  pending = '',
): string {
  const pendingHtml = pending
    ? `<div style="border:1.5px dashed ${B.line};border-radius:6px;background:${B.panel};padding:12px 16px;text-align:center;margin:12px 0 4px;">
        <p style="${NUNITO}margin:0;font-size:11px;color:${B.faint};">${esc(pending)}</p>
      </div>`
    : '';
  const noteHtml = note
    ? `<p style="${NUNITO}font-size:10.5px;color:${B.faint};line-height:1.6;padding-top:10px;margin:0;">${esc(note)}</p>`
    : '';
  const sourceHtml = source
    ? `<div style="padding:8px 18px;background:${B.panel};border-top:1px solid ${B.lineSoft};">
        <span style="${ARCHIVO}font-size:8.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${B.faint};">Source: ${esc(source)}</span>
      </div>`
    : '';

  return `<div class="pdf-part-block" style="border:1px solid ${B.line};border-radius:8px;overflow:hidden;margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px;background:${B.panel};border-bottom:1px solid ${B.line};">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="pdf-part-label" style="${ARCHIVO}font-size:9.5px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${B.blue};line-height:1;">Part ${esc(part)}</span>
        <span style="width:1px;height:12px;background:#CBD5E1;"></span>
        <span style="${ARCHIVO}font-size:13px;font-weight:600;color:${B.ink};">${esc(title)}</span>
      </div>
      ${tagHtml(tag, tagVariant(tagTone))}
    </div>
    <div style="padding:4px 18px 14px;">${rowsHtml}${pendingHtml}${noteHtml}</div>
    ${sourceHtml}
  </div>`;
}

function addressLines(fields: IntelligenceReportPdfFields): string {
  const parts = [fields.street, ...fields.locality.split(',').map((p) => p.trim()).filter(Boolean)];
  return parts.map((line, index) => `${esc(line)}${index < parts.length - 1 ? ',' : ''}`).join('<br/>');
}

function partBRows(fields: IntelligenceReportPdfFields): string {
  const body = fields.partBBody || '-';
  const band = body.match(/band\s*[a-g]\s*(?:\(?\d+\)?)?/i)?.[0];
  const bills = body.match(/£[\d,.]+(?:\s*\/?\s*(?:mo|month|pcm))?/i)?.[0];
  const compliant = /compliant/i.test(body) ? 'Compliant' : /non[- ]?compliant/i.test(body) ? 'Non-compliant' : '';

  if (band || bills || compliant) {
    return [
      dataRow('EPC Rating', band || body),
      compliant ? dataRow('MEES Compliance', compliant) : '',
      bills ? dataRow('Estimated Energy Bills', bills.includes('/') || /mo/i.test(bills) ? bills : `~${bills} / month`) : '',
    ]
      .filter(Boolean)
      .join('');
  }
  return dataRow('EPC Summary', body);
}

/**
 * Builds the designed report HTML used by the browser PDF exporter.
 * Mirrors the layout/icons from the PDF Report Template prototype.
 */
export function buildIntelligenceReportHtml(fields: IntelligenceReportPdfFields): string {
  const cards = [...fields.cards];
  while (cards.length < 3) {
    cards.push({
      title: 'Area Check',
      status: 'Unresolved',
      finding: 'Data unresolved - register did not return a value for this module.',
      source: 'Open data',
      tone: 'note',
    });
  }

  const cardsHtml = cards
    .slice(0, 3)
    .map((card) => {
      const icon = cardIcon(card.title);
      return `<div style="border:1px solid ${B.line};border-radius:8px;background:white;padding:16px;display:flex;flex-direction:column;justify-content:space-between;min-height:150px;">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="width:30px;height:30px;border-radius:6px;background:${icon.bg};display:flex;align-items:center;justify-content:center;">${icon.svg}</div>
            ${tagHtml(card.status, tagVariant(card.tone || card.status))}
          </div>
          <div style="${ARCHIVO}font-size:13px;font-weight:600;color:${B.ink};margin-bottom:5px;">${esc(card.title)}</div>
          <p style="${NUNITO}margin:0;font-size:11px;color:${B.muted};line-height:1.6;">${esc(card.finding)}</p>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid ${B.lineSoft};">
          <span style="${ARCHIVO}font-size:8.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${B.faint};">${esc(card.source)}</span>
        </div>
      </div>`;
    })
    .join('');

  const stepsHtml = fields.steps
    .map((step, index) => {
      const n = String(index + 1).padStart(2, '0');
      return `<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 16px;border:1px solid ${B.line};border-radius:7px;background:white;margin-bottom:8px;">
        <span style="${ARCHIVO}font-size:12px;font-weight:700;color:${B.blue};flex-shrink:0;margin-top:1px;min-width:22px;">${n}.</span>
        <span style="${NUNITO}font-size:12.5px;color:${B.slate};line-height:1.6;">${esc(step)}</span>
      </div>`;
    })
    .join('');

  const pendingC = /to come|pending|not in this report|^-$/i.test(
    `${fields.partCStatus} ${fields.titleRegister} ${fields.covenantText}`,
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .pdf-wrap { width: 794px; background: white; color: ${B.ink}; }
    .pdf-page { width: 794px; background: white; }
    .pdf-section-head, .pdf-part-block, .pdf-intel-grid { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="pdf-wrap">
    <div class="pdf-page pdf-page-1">
      <div style="background:linear-gradient(135deg, ${B.blueDark} 0%, ${B.blue} 100%);padding:40px 48px 0;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;position:relative;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
              <div class="pdf-brand-mark" style="width:28px;height:28px;border-radius:5px;background:${B.orange};display:flex;align-items:center;justify-content:center;">
                <span class="pdf-brand-letter" style="${ARCHIVO}color:white;font-weight:800;font-size:15px;line-height:1;">P</span>
              </div>
              <span class="pdf-brand-wordmark" style="${ARCHIVO}color:white;font-weight:700;font-size:13px;letter-spacing:0.22em;line-height:1;">PROPTII</span>
              <span style="width:1px;height:14px;background:rgba(255,255,255,0.25);"></span>
              <span class="pdf-brand-wordmark" style="${ARCHIVO}color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;line-height:1;">Property Intelligence</span>
            </div>
            <div class="pdf-pill" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border-radius:4px;padding:5px 10px;margin-bottom:14px;">
              <div style="width:6px;height:6px;border-radius:50%;background:${B.orange};flex-shrink:0;"></div>
              <span class="pdf-pill-text" style="${NUNITO}display:inline-flex;align-items:center;line-height:1;color:rgba(255,255,255,0.9);font-size:9.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${esc(fields.chip)}</span>
            </div>
            <h1 style="${ARCHIVO}color:white;font-size:28px;font-weight:600;line-height:1.22;letter-spacing:-0.01em;margin:0;">${addressLines(fields)}</h1>
          </div>
          <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:18px 20px;min-width:170px;">
            <div style="margin-bottom:14px;">
              <div class="pdf-meta-label" style="${ARCHIVO}color:rgba(255,255,255,0.45);font-size:8.5px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:3px;line-height:1;">Report ID</div>
              <div style="font-family:ui-monospace,monospace;color:white;font-size:13px;font-weight:600;">${esc(fields.reference)}</div>
            </div>
            <div style="margin-bottom:14px;">
              <div class="pdf-meta-label" style="${ARCHIVO}color:rgba(255,255,255,0.45);font-size:8.5px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:3px;line-height:1;">Correct As Of</div>
              <div style="${NUNITO}color:white;font-size:12px;">${esc(fields.asOf)}</div>
            </div>
            <div class="pdf-pill" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border-radius:4px;padding:5px 8px;">
              <div style="width:6px;height:6px;border-radius:50%;background:#4ADE80;flex-shrink:0;"></div>
              <span class="pdf-pill-text" style="${NUNITO}display:inline-flex;align-items:center;line-height:1;color:rgba(255,255,255,0.8);font-size:9px;letter-spacing:0.06em;text-transform:uppercase;">${esc(fields.verified)}</span>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;padding-bottom:18px;display:grid;grid-template-columns:1fr 1fr 1fr;">
          ${[
            { label: 'Postcode', value: fields.postcode || '-' },
            { label: 'Audience', value: fields.audienceLabel },
            { label: 'Regulation', value: fields.regulation },
          ]
            .map(
              ({ label, value }, i) => `<div style="padding-left:${i > 0 ? 24 : 0}px;border-left:${i > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none'};">
                <div class="pdf-meta-label" style="${ARCHIVO}color:rgba(255,255,255,0.4);font-size:8.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:4px;line-height:1;">${esc(label)}</div>
                <div style="${NUNITO}color:rgba(255,255,255,0.9);font-size:12.5px;font-weight:500;">${esc(value)}</div>
              </div>`,
            )
            .join('')}
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg, ${B.orange}, #F28A3C);"></div>

      <div style="padding:36px 48px 48px;">
        <div style="display:flex;gap:14px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 18px;margin-bottom:32px;">
          <div style="flex-shrink:0;margin-top:1px;">${iconSvg('warn', '#B91C1C')}</div>
          <div>
            <div class="pdf-alert-title" style="${ARCHIVO}font-size:9.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#B91C1C;margin-bottom:5px;line-height:1;">${esc(fields.watchTitle)}</div>
            <p style="${NUNITO}margin:0;font-size:12px;color:#7F1D1D;line-height:1.65;">${esc(fields.watchBody)}</p>
          </div>
        </div>

        <div class="pdf-area-section">
          ${sectionHead('Area Intelligence — Postcode Centroid, 100m Resolution')}
          <div class="pdf-map" style="height:220px;border-radius:8px;border:1px solid ${B.line};background:#F1F6FA;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
            <div style="position:absolute;inset:0;background-image:linear-gradient(to right,rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,0.04) 1px,transparent 1px);background-size:22px 22px;"></div>
            <div style="position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:6px;">
              <div style="width:20px;height:20px;border-radius:50%;background:${B.blue};border:2.5px solid white;box-shadow:0 2px 8px rgba(19,108,158,0.4);display:flex;align-items:center;justify-content:center;">
                <div style="width:7px;height:7px;border-radius:50%;background:${B.orange};"></div>
              </div>
              <div class="pdf-map-caption" style="${NUNITO}background:rgba(255,255,255,0.96);border:1px solid ${B.line};border-radius:4px;padding:3px 10px;font-size:10.5px;color:${B.slate};box-shadow:0 1px 4px rgba(0,0,0,0.08);line-height:1;">
                ${esc(fields.mapCaption)}
              </div>
            </div>
            <div class="pdf-map-meta" style="position:absolute;bottom:8px;left:10px;${ARCHIVO}font-size:9px;color:${B.faint};letter-spacing:0.12em;text-transform:uppercase;line-height:1;">
              ${esc(fields.postcode || '')}
            </div>
          </div>
          <p class="pdf-map-source" style="${NUNITO}font-size:9.5px;color:${B.faint};margin:0 0 22px;line-height:1.4;">${esc(fields.mapSource)}</p>
          <div class="pdf-intel-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            ${cardsHtml}
          </div>
        </div>
      </div>
    </div>

    <div class="pdf-page pdf-page-2">
      <div style="padding:36px 48px 48px;">
        ${sectionHead('Full Report Breakdown — NTSELAT CPR 2008 Parts A–C')}
        ${partBlock('A', fields.partATitle, 'Required', 'gray', fields.partARows.map((r) => dataRow(r.label, r.value)).join(''), fields.partASource, fields.partANote)}
        ${partBlock('B', fields.partBTitle, 'Required', 'gray', partBRows(fields), fields.partBSource)}
        ${partBlock(
          'C',
          fields.partCTitle,
          pendingC ? 'Coming Soon' : 'Available',
          pendingC ? 'amber' : 'green',
          dataRow('Title Register & Covenant Text', pendingC ? '—' : fields.titleRegister),
          fields.partCSource,
          '',
          pendingC ? fields.paidCopy : '',
        )}
        ${sectionHead('Recommended Action Steps')}
        <div style="display:flex;flex-direction:column;gap:0;">${stepsHtml}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
