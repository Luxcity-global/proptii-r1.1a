/**
 * Referencing page demo tour entry (e.g. after tenant onboarding with ?startReferencingTour=1).
 * Scrolls to the first available tour anchor so users see where to continue.
 */
export function startReferencingTour(): void {
  if (typeof window === 'undefined') return;

  const scrollTo = (selector: string): boolean => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      if (el instanceof HTMLButtonElement || el.getAttribute('tabindex') !== null) {
        el.focus({ preventScroll: true });
      }
    } catch {
      /* ignore */
    }
    return true;
  };

  requestAnimationFrame(() => {
    if (!scrollTo('[data-demo-referencing-hero-cta="1"]')) {
      scrollTo('[data-demo-referencing-steps="1"]');
    }
  });
}
