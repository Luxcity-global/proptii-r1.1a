// Accessibility utilities for the Marketing Hub

/**
 * Generate a unique ID for accessibility attributes
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * ARIA live region announcements for screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  /**
   * Restore focus to previously focused element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },
  
  /**
   * Get the currently focused element
   */
  getCurrentFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  }
};

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation for lists
   */
  handleArrowKeys: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number => {
    const isHorizontal = orientation === 'horizontal';
    // const isVertical = orientation === 'vertical';
    
    switch (event.key) {
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        event.preventDefault();
        return currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        event.preventDefault();
        return currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      case 'Home':
        event.preventDefault();
        return 0;
      case 'End':
        event.preventDefault();
        return items.length - 1;
      default:
        return currentIndex;
    }
  },
  
  /**
   * Handle Enter and Space key activation
   */
  handleActivation: (event: KeyboardEvent, callback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  meetsWCAGAA: (color1: [number, number, number], color2: [number, number, number]): boolean => {
    return colorContrast.getContrastRatio(color1, color2) >= 4.5;
  }
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Hide element visually but keep it accessible to screen readers
   */
  srOnly: 'sr-only',
  
  /**
   * Show element only to screen readers
   */
  srOnlyFocus: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-white focus:border focus:rounded',
  
  /**
   * Skip link for keyboard navigation
   */
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg'
};

/**
 * ARIA attributes helpers
 */
export const ariaAttributes = {
  /**
   * Generate ARIA describedby attribute
   */
  describedBy: (id: string): string => `aria-describedby="${id}"`,
  
  /**
   * Generate ARIA labelledby attribute
   */
  labelledBy: (id: string): string => `aria-labelledby="${id}"`,
  
  /**
   * Generate ARIA controls attribute
   */
  controls: (id: string): string => `aria-controls="${id}"`,
  
  /**
   * Generate ARIA expanded attribute
   */
  expanded: (isExpanded: boolean): string => `aria-expanded="${isExpanded}"`,
  
  /**
   * Generate ARIA selected attribute
   */
  selected: (isSelected: boolean): string => `aria-selected="${isSelected}"`,
  
  /**
   * Generate ARIA disabled attribute
   */
  disabled: (isDisabled: boolean): string => `aria-disabled="${isDisabled}"`,
  
  /**
   * Generate ARIA hidden attribute
   */
  hidden: (isHidden: boolean): string => `aria-hidden="${isHidden}"`,
  
  /**
   * Generate ARIA live attribute
   */
  live: (polite: boolean = true): string => `aria-live="${polite ? 'polite' : 'assertive'}"`,
  
  /**
   * Generate ARIA atomic attribute
   */
  atomic: (isAtomic: boolean = true): string => `aria-atomic="${isAtomic}"`
};
