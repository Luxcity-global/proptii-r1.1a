import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  trigger?: 'hover' | 'click' | 'auto-mobile';
  showIcon?: boolean;
  iconClassName?: string;
  maxWidth?: string;
  disabled?: boolean;
  autoShowDelay?: number; // Time in ms before auto-showing on mobile
  autoHideDelay?: number; // Time in ms before auto-hiding on mobile
  forcePosition?: boolean; // New prop to force position for form inputs
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  trigger = 'hover',
  showIcon = false,
  iconClassName = '',
  maxWidth = 'max-w-xs',
  disabled = false,
  autoShowDelay = 2000,
  autoHideDelay = 5000,
  forcePosition = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const autoShowTimeoutRef = useRef<NodeJS.Timeout>();
  const autoHideTimeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = 0;
    let left = 0;
    const isMobile = window.innerWidth < 768;
    const isFormInput = triggerRef.current.querySelector('input, textarea, select') !== null;

    // Find the closest modal or dialog container
    const modalContainer = triggerRef.current.closest('[role="dialog"], .MuiDialog-paper, .modal, .MuiDialog-container');

    // Special positioning for form inputs or when position is forced
    if (isFormInput || forcePosition) {
      // Calculate basic position above the input
      top = triggerRect.top - tooltipRect.height - 12;

      // For modal containers, use a more conservative positioning approach
      if (modalContainer) {
        const modalRect = modalContainer.getBoundingClientRect();

        // Calculate responsive tooltip width
        const tooltipWidth = Math.min(300, modalRect.width - 32);

        // Position tooltip centered above the input, but constrained within modal
        const modalPadding = isMobile ? 8 : 16;
        const availableWidth = modalRect.width - (modalPadding * 2);
        const maxTooltipWidth = Math.min(tooltipWidth, availableWidth);

        // Center the tooltip above the input field
        const inputCenter = triggerRect.left + triggerRect.width / 2;
        const idealLeft = inputCenter - maxTooltipWidth / 2;

        // Ensure tooltip stays within modal bounds
        const modalLeft = modalRect.left + modalPadding;
        const modalRight = modalRect.right - modalPadding;

        left = Math.max(modalLeft, Math.min(idealLeft, modalRight - maxTooltipWidth));

        // Debug logging (remove after testing)
        console.log('Tooltip positioning:', {
          modalRect: { left: modalRect.left, right: modalRect.right, width: modalRect.width },
          inputCenter,
          tooltipWidth: maxTooltipWidth,
          idealLeft,
          finalLeft: left,
          constraints: { modalLeft, modalRight }
        });

        // Ensure tooltip doesn't go above modal or below the modal header
        const modalHeaderHeight = isMobile ? 56 : 64; // Smaller header on mobile
        const minTopPosition = modalRect.top + modalHeaderHeight + 8;

        if (top < minTopPosition) {
          // If there's not enough space above, position below the input
          top = triggerRect.bottom + 8;

          // If positioning below would go outside modal, force it above with minimum spacing
          if (top + tooltipRect.height > modalRect.bottom - 16) {
            top = Math.max(minTopPosition, triggerRect.top - tooltipRect.height - 8);
          }
        }

        // Ensure tooltip doesn't go below modal bottom
        if (top + tooltipRect.height > modalRect.bottom - 16) {
          top = modalRect.bottom - tooltipRect.height - 16;
        }
      } else {
        // Fallback positioning for non-modal contexts
        left = triggerRect.left + (triggerRect.width - 300) / 2;

        // Viewport constraints
        if (left < 16) left = 16;
        if (left + 300 > viewport.width - 16) {
          left = viewport.width - 316; // 300 + 16
        }
        if (top < 16) {
          top = triggerRect.bottom + 8;
        }
      }
    }
    // Special positioning for mobile search tooltips
    else if (isMobile && position === 'top') {
      top = triggerRect.top - tooltipRect.height - 20;
      left = (viewport.width - tooltipRect.width) / 2;

      const navbarHeight = 80;
      if (top < navbarHeight) {
        top = navbarHeight + 8;
      }
    }
    // Default positioning logic for other tooltips
    else {
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 16;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 16;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 16;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 16;
          break;
      }

      // Viewport constraints for default positioning
      const padding = isMobile ? 20 : 12;
      if (left < padding) left = padding;
      if (left + tooltipRect.width > viewport.width - padding) {
        left = viewport.width - tooltipRect.width - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipRect.height > viewport.height - padding) {
        top = viewport.height - tooltipRect.height - padding;
      }
    }

    setTooltipPosition({ top, left });
  };

  // Auto-show/hide functionality for mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (trigger === 'auto-mobile' && isMobile && !disabled) {
      autoShowTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);

        autoHideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
      }, autoShowDelay);
    }

    return () => {
      if (autoShowTimeoutRef.current) {
        clearTimeout(autoShowTimeoutRef.current);
      }
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [trigger, autoShowDelay, autoHideDelay, disabled]);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      // Recalculate position on scroll and resize
      const handleUpdate = () => calculatePosition();

      // Listen for scroll events on both window and modal containers
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      // Find modal container and listen for its scroll events too
      const modalContainer = triggerRef.current?.closest('[role="dialog"], .MuiDialog-paper, .modal, .MuiDialog-container');
      const scrollableContent = triggerRef.current?.closest('[class*="ScrollableContent"], [class*="scrollable"]');

      if (modalContainer) {
        modalContainer.addEventListener('scroll', handleUpdate, true);
      }
      if (scrollableContent && scrollableContent !== modalContainer) {
        scrollableContent.addEventListener('scroll', handleUpdate, true);
      }

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
        if (modalContainer) {
          modalContainer.removeEventListener('scroll', handleUpdate, true);
        }
        if (scrollableContent && scrollableContent !== modalContainer) {
          scrollableContent.removeEventListener('scroll', handleUpdate, true);
        }
      };
    }
  }, [isVisible, position]);

  // Add event listeners for input field interactions
  useEffect(() => {
    if (triggerRef.current) {
      const inputElement = triggerRef.current.querySelector('input, textarea, select');
      if (inputElement) {
        inputElement.addEventListener('focus', handleInputFocus);
        inputElement.addEventListener('input', handleInputChange);
        inputElement.addEventListener('change', handleInputChange);

        return () => {
          inputElement.removeEventListener('focus', handleInputFocus);
          inputElement.removeEventListener('input', handleInputChange);
          inputElement.removeEventListener('change', handleInputChange);
        };
      }
    }
  }, [trigger, disabled]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !disabled) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !disabled) {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && !disabled) {
      setIsVisible(!isVisible);
    }
  };

  // Handle focus events on input fields to hide tooltips
  const handleInputFocus = () => {
    if (trigger === 'hover' && !disabled) {
      setIsVisible(false);
    }
  };

  const handleInputBlur = () => {
    // Optional: Could show tooltip again on blur if needed
  };

  const handleInputChange = () => {
    if (trigger === 'hover' && !disabled) {
      setIsVisible(false);
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute";
    const isMobile = window.innerWidth < 768;

    switch (position) {
      case 'top':
        if (isMobile && triggerRef.current) {
          return `${baseArrowClasses} -bottom-3 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white`;
        }
        return `${baseArrowClasses} -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white`;
      case 'bottom':
        return `${baseArrowClasses} -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white`;
      case 'left':
        return `${baseArrowClasses} -right-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-white`;
      case 'right':
        return `${baseArrowClasses} -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-r-[12px] border-t-transparent border-b-transparent border-r-white`;
      default:
        return baseArrowClasses;
    }
  };

  const getArrowPosition = () => {
    const isMobile = window.innerWidth < 768;

    // Special handling for mobile search tooltips
    if (isMobile && position === 'top' && triggerRef.current && !forcePosition) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipLeft = (window.innerWidth - (tooltipRef.current?.getBoundingClientRect().width || 320)) / 2;
      const arrowOffset = triggerCenter - tooltipLeft - 12;
      return { left: `${Math.max(12, Math.min(arrowOffset, (tooltipRef.current?.getBoundingClientRect().width || 320) - 24))}px` };
    }

    // For form inputs and modal tooltips, center the arrow relative to the trigger element
    if (triggerRef.current && (forcePosition || triggerRef.current.querySelector('input, textarea, select'))) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipLeft = tooltipPosition.left;
      const arrowOffset = triggerCenter - tooltipLeft - 12; // 12px is half the arrow width

      // Get actual tooltip width (could be smaller in modals)
      const modalContainer = triggerRef.current.closest('[role="dialog"], .MuiDialog-paper, .modal, .MuiDialog-container');
      let tooltipWidth = 300;
      if (modalContainer) {
        const modalRect = modalContainer.getBoundingClientRect();
        const modalPadding = window.innerWidth < 768 ? 16 : 32;
        tooltipWidth = Math.min(300, modalRect.width - modalPadding);
      }

      const minArrowPos = 24; // Minimum distance from tooltip edge to keep arrow visible
      const maxArrowPos = tooltipWidth - 36; // Maximum distance (accounting for arrow width and padding)

      return {
        left: `${Math.max(minArrowPos, Math.min(arrowOffset, maxArrowPos))}px`
      };
    }

    return {};
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`relative ${className}`}
        style={{ display: 'block', width: '100%' }}
      >
        {children}
        {showIcon && (
          <Info className={`w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 transition-colors ${iconClassName}`} />
        )}
      </div>

      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          className={`fixed text-black pointer-events-none
            transform transition-all duration-300 ease-out opacity-100 scale-100`}
          style={{
            backgroundColor: '#ffffff',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            borderRadius: '12px',
            width: (() => {
              const modalContainer = triggerRef.current?.closest('[role="dialog"], .MuiDialog-paper, .modal, .MuiDialog-container');
              if (modalContainer) {
                const modalRect = modalContainer.getBoundingClientRect();
                const modalPadding = window.innerWidth < 768 ? 16 : 32;
                return `${Math.min(300, modalRect.width - modalPadding)}px`;
              }
              return window.innerWidth < 768 ? `${Math.min(300, window.innerWidth - 32)}px` : '300px';
            })(),
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 10000, // Ensure it appears above modal content
          }}
          onMouseEnter={() => {
            if (trigger === 'hover') {
              setIsVisible(true);
            }
          }}
          onMouseLeave={() => {
            if (trigger === 'hover') {
              setIsVisible(false);
            }
          }}
        >
          <div
            className={getArrowClasses()}
            style={getArrowPosition()}
          ></div>

          <div className="relative z-10 p-3 text-left pointer-events-auto">
            {typeof content === 'string' ? (
              <p className="leading-relaxed text-sm font-medium text-left text-gray-900 m-0">{content}</p>
            ) : (
              <div className="leading-relaxed text-sm font-medium text-left text-gray-900">
                {content}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 