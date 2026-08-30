const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'property';

/**
 * Expand pending copy and strip chrome on a cloned report node.
 * Used only on clones — never mutate the live modal.
 */
export function prepareReportElementForPdfCapture(root: HTMLElement): void {
  root.querySelectorAll('.no-print, [data-pdf-hide]').forEach((node) => {
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

export function buildIntelligenceReportFilename(propertyLabel: string): string {
  return `proptii-intelligence-report-${slugify(propertyLabel)}.pdf`;
}
