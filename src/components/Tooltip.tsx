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

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport with extra mobile padding
    const mobilePadding = window.innerWidth < 768 ? 16 : 8;
    if (left < mobilePadding) left = mobilePadding;
    if (left + tooltipRect.width > viewport.width - mobilePadding) {
      left = viewport.width - tooltipRect.width - mobilePadding;
    }
    if (top < mobilePadding) top = mobilePadding;
    if (top + tooltipRect.height > viewport.height - mobilePadding) {
      top = viewport.height - tooltipRect.height - mobilePadding;
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
    const baseArrowClasses = "absolute w-3 h-3 transform rotate-45";
    const arrowStyle = { backgroundColor: '#136C9E' };

    switch (position) {
      case 'top':
        return `${baseArrowClasses} -bottom-1.5 left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrowClasses} -top-1.5 left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseArrowClasses} -right-1.5 top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseArrowClasses} -left-1.5 top-1/2 -translate-y-1/2`;
      default:
        return baseArrowClasses;
    }
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
          className={`fixed z-[9999] ${maxWidth} p-3 text-white text-sm rounded-lg shadow-xl 
            transform transition-all duration-200 ease-out opacity-100 scale-100`}
          style={{
            backgroundColor: '#136C9E',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          onMouseEnter={() => trigger === 'hover' && setIsVisible(true)}
          onMouseLeave={() => trigger === 'hover' && setIsVisible(false)}
        >
          <div className={getArrowClasses()} style={{ backgroundColor: '#136C9E' }}></div>
          <div className="relative z-10">
            {typeof content === 'string' ? (
              <p className="leading-relaxed">{content}</p>
            ) : (
              content
            )}
          </div>
        </div>
      )}
    </>
  );
}; 