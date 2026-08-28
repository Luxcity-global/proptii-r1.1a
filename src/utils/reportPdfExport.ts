import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'property';

/** Prepare a cloned report node so the PDF matches the on-screen layout. */
export function prepareReportElementForPdfCapture(root: HTMLElement): void {
  root.style.maxHeight = 'none';
  root.style.overflow = 'visible';
  root.style.height = 'auto';
  root.style.boxShadow = 'none';

  root.querySelectorAll('.no-print').forEach((node) => {
    node.remove();
  });

  root
    .querySelectorAll('[data-testid="report-part-c-pending"] p, [data-testid="report-paid-pending"] p')
    .forEach((node) => {
      const paragraph = node as HTMLElement;
      paragraph.classList.remove('max-h-0', 'overflow-hidden', 'opacity-0');
      paragraph.style.maxHeight = 'none';
      paragraph.style.opacity = '1';
      paragraph.style.marginTop = '0.5rem';
    });

  root
    .querySelectorAll('[data-testid="report-part-c-pending"], [data-testid="report-paid-pending"]')
    .forEach((node) => {
      const section = node as HTMLElement;
      section.style.paddingTop = '1.25rem';
      section.style.paddingBottom = '1.25rem';
    });
}

/**
 * Capture a live report element and save it as a multi-page A4 PDF.
 * Uses the rendered DOM so the download matches the report page.
 */
export async function captureElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const previousScrollTop = element.scrollTop;
  element.scrollTop = 0;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f7f2e8',
      logging: false,
      height: element.scrollHeight,
      width: element.scrollWidth,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (_document, clonedElement) => {
        prepareReportElementForPdfCapture(clonedElement as HTMLElement);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    element.scrollTop = previousScrollTop;
  }
}

export function buildIntelligenceReportFilename(propertyLabel: string): string {
  return `proptii-intelligence-report-${slugify(propertyLabel)}.pdf`;
}

export async function downloadReportFromElement(
  element: HTMLElement,
  propertyLabel: string,
): Promise<void> {
  await captureElementAsPdf(element, buildIntelligenceReportFilename(propertyLabel));
}
