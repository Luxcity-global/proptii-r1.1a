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
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  trigger = 'hover',
  showIcon = false,
  iconClassName = '',
  maxWidth = 'max-w-xs'
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

    // Ensure tooltip stays within viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewport.width - 8) {
      left = viewport.width - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewport.height - 8) {
      top = viewport.height - tooltipRect.height - 8;
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute w-3 h-3 bg-gray-900 transform rotate-45";

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

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] ${maxWidth} p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl 
            transform transition-all duration-200 ease-out opacity-100 scale-100`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          onMouseEnter={() => trigger === 'hover' && setIsVisible(true)}
          onMouseLeave={() => trigger === 'hover' && setIsVisible(false)}
        >
          <div className={getArrowClasses()}></div>
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