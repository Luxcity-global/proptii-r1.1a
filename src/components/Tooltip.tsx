import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  trigger?: 'hover' | 'click';
  showIcon?: boolean;
  iconClassName?: string;
  maxWidth?: string;
  disabled?: boolean;
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
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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

    // Special positioning for mobile to keep tooltip above search bar
    if (isMobile && position === 'top') {
      // Position tooltip fixed above the search bar, centered horizontally
      top = triggerRect.top - tooltipRect.height - 20;
      left = (viewport.width - tooltipRect.width) / 2; // Center horizontally

      // Ensure it doesn't go above navbar (minimum top position)
      const navbarHeight = 80; // Adjust based on your navbar height
      if (top < navbarHeight) {
        top = navbarHeight + 8;
      }
    } else {
      // Original positioning logic for desktop and other positions
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

      // Ensure tooltip stays within viewport with extra mobile padding
      const mobilePadding = isMobile ? 20 : 12;
      if (left < mobilePadding) left = mobilePadding;
      if (left + tooltipRect.width > viewport.width - mobilePadding) {
        left = viewport.width - tooltipRect.width - mobilePadding;
      }
      if (top < mobilePadding) top = mobilePadding;
      if (top + tooltipRect.height > viewport.height - mobilePadding) {
        top = viewport.height - tooltipRect.height - mobilePadding;
      }
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
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
        // For mobile, we need to calculate the arrow position relative to the search bar
        if (isMobile && triggerRef.current) {
          return `${baseArrowClasses} -bottom-3 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#136C9D]`;
        }
        return `${baseArrowClasses} -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#136C9D]`;
      case 'bottom':
        return `${baseArrowClasses} -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#136C9D]`;
      case 'left':
        return `${baseArrowClasses} -right-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-[#136C9D]`;
      case 'right':
        return `${baseArrowClasses} -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-r-[12px] border-t-transparent border-b-transparent border-r-[#136C9D]`;
      default:
        return baseArrowClasses;
    }
  };

  const getArrowPosition = () => {
    const isMobile = window.innerWidth < 768;

    if (isMobile && position === 'top' && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipLeft = (window.innerWidth - (tooltipRef.current?.getBoundingClientRect().width || 320)) / 2;
      const arrowOffset = triggerCenter - tooltipLeft - 12; // 12px is half the arrow width
      return { left: `${Math.max(12, Math.min(arrowOffset, (tooltipRef.current?.getBoundingClientRect().width || 320) - 24))}px` };
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
        className={`relative inline-flex items-center ${className}`}
      >
        {children}
        {showIcon && (
          <Info className={`w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 transition-colors ${iconClassName}`} />
        )}
      </div>

      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] text-white shadow-2xl 
            transform transition-all duration-300 ease-out opacity-100 scale-100`}
          style={{
            backgroundColor: '#136C9D',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            borderRadius: '20px',
            minWidth: '280px',
            maxWidth: window.innerWidth < 768 ? '320px' : '380px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          onMouseEnter={() => trigger === 'hover' && setIsVisible(true)}
          onMouseLeave={() => trigger === 'hover' && setIsVisible(false)}
        >
          {/* Speech bubble arrow using CSS borders */}
          <div
            className={getArrowClasses()}
            style={getArrowPosition()}
          ></div>

          {/* Chat bubble content with left-aligned text */}
          <div className="relative z-10 p-4 md:p-5 text-left">
            {typeof content === 'string' ? (
              <p className="leading-relaxed text-sm md:text-base font-medium text-left">{content}</p>
            ) : (
              <div className="leading-relaxed text-sm md:text-base font-medium text-left">
                {content}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 