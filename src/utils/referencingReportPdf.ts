import jsPDF from 'jspdf';

export interface ReferencingReportRow {
  label: string;
  value: string;
}

export interface ReferencingReportPillar {
  title: string;
  complete: boolean;
  notes: string;
}

export interface ReferencingReportShare {
  recipientName: string;
  recipientEmail: string;
  role: string;
  shared: string;
  status: string;
}

export interface ReferencingReportInput {
  tenantName: string;
  generatedAt: string;
  overallProgress: number;
  applicant: ReferencingReportRow[];
  pillars: ReferencingReportPillar[];
  documents: ReferencingReportRow[];
  shares: ReferencingReportShare[];
}

export function referencingReportFilename(date = new Date()): string {
  return `referencing-report-${date.toISOString().slice(0, 10)}.pdf`;
}

export function buildReferencingReportPdf(input: ReferencingReportInput): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - margin) return;
    doc.addPage();
    y = 20;
  };

  const section = (title: string) => {
    ensureSpace(16);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 2.5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const labeledRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const valueLines: string[] = doc.splitTextToSize(value || '—', contentWidth - 46);
    const rowHeight = Math.max(valueLines.length, 1) * 5 + 2;
    ensureSpace(rowHeight);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(valueLines, margin + 46, y);
    y += rowHeight;
  };

  const pillarBlock = (pillar: ReferencingReportPillar) => {
    const status = pillar.complete ? 'Verified' : 'Incomplete';
    const detail = pillar.notes ? `${status} — ${pillar.notes}` : status;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const titleLines: string[] = doc.splitTextToSize(pillar.title, contentWidth);
    doc.setFont('helvetica', 'normal');
    const detailLines: string[] = doc.splitTextToSize(detail, contentWidth);
    const blockHeight = titleLines.length * 5 + detailLines.length * 5 + 3;
    ensureSpace(blockHeight);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 5;

    doc.setFont('helvetica', 'normal');
    if (pillar.complete) doc.setTextColor(5, 150, 105);
    else doc.setTextColor(217, 119, 6);
    doc.text(detailLines, margin, y);
    y += detailLines.length * 5 + 3;
  };

  doc.setFillColor(19, 108, 158);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Referencing Report', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Proptii tenant passport', margin, 21);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const intro = `Generated ${input.generatedAt}  ·  Overall progress ${input.overallProgress}%`;
  const introLines: string[] = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 5 + 4;

  section('Applicant');
  input.applicant.forEach((row) => labeledRow(row.label, row.value));

  section('Verification pillars');
  input.pillars.forEach(pillarBlock);

  section('Supporting documents');
  input.documents.forEach((row) => labeledRow(row.label, row.value));

  section('Shared access');
  if (input.shares.length === 0) {
    ensureSpace(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No passports shared yet.', margin, y);
  } else {
    input.shares.forEach((share) => {
      const detail = [
        share.recipientEmail,
        share.role,
        `Shared ${share.shared}`,
        share.status || 'Delivered',
      ].filter(Boolean).join(' · ');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const titleLines: string[] = doc.splitTextToSize(share.recipientName || 'Recipient', contentWidth);
      doc.setFont('helvetica', 'normal');
      const detailLines: string[] = doc.splitTextToSize(detail, contentWidth);
      ensureSpace(titleLines.length * 5 + detailLines.length * 5 + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(detailLines, margin, y);
      y += detailLines.length * 5 + 3;
    });
  }

  return doc;
}

export function referencingReportPdfBytes(input: ReferencingReportInput): ArrayBuffer {
  return buildReferencingReportPdf(input).output('arraybuffer');
}

export function downloadReferencingReportPdf(
  input: ReferencingReportInput,
  filename = referencingReportFilename(),
) {
  buildReferencingReportPdf(input).save(filename);
}
