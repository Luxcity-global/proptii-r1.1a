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
    const modalContainer = triggerRef.current.closest('[role="dialog"], .MuiDialog-paper, .modal, .MuiDialog-container, .MuiDialog-root');

    // Special positioning for form inputs or when position is forced
    if (isFormInput || forcePosition) {
      const tooltipWidth = 300;

      // Always center the tooltip above the input field first
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      left = triggerCenter - tooltipWidth / 2;
      top = triggerRect.top - tooltipRect.height - 8;

      // Then check modal constraints if we're in a modal
      if (modalContainer) {
        const modalRect = modalContainer.getBoundingClientRect();
        const modalPadding = 20;

        // Ensure tooltip stays within modal horizontal bounds
        const modalLeft = modalRect.left + modalPadding;
        const modalRight = modalRect.right - modalPadding;

        if (left < modalLeft) {
          left = modalLeft;
        } else if (left + tooltipWidth > modalRight) {
          left = modalRight - tooltipWidth;
        }

        // Ensure tooltip doesn't go above modal
        if (top < modalRect.top + 10) {
          top = triggerRect.bottom + 8; // Show below if no space above
        }
      } else {
        // Viewport constraints for non-modal contexts
        if (left < 16) {
          left = 16;
        } else if (left + tooltipWidth > viewport.width - 16) {
          left = viewport.width - tooltipWidth - 16;
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
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible, position]);

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

      // Constrain arrow position within tooltip bounds (300px width)
      const tooltipWidth = 300;
      const minArrowPos = 16; // Minimum distance from tooltip edge
      const maxArrowPos = tooltipWidth - 28; // Maximum distance (accounting for arrow width)

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
          className={`fixed z-[9999] text-black pointer-events-none
            transform transition-all duration-300 ease-out opacity-100 scale-100`}
          style={{
            backgroundColor: '#ffffff',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            borderRadius: '12px',
            width: '300px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
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