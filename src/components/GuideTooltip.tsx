import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface GuideTooltipProps {
    children: React.ReactNode;
    content: string;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    iconClassName?: string;
    showIcon?: boolean;
    delay?: number;
    maxWidth?: string;
}

export const GuideTooltip: React.FC<GuideTooltipProps> = ({
    children,
    content,
    title,
    position = 'top',
    className = '',
    iconClassName = '',
    showIcon = true,
    delay = 300,
    maxWidth = '320px'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            setTimeout(() => setShowTooltip(true), 10);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setShowTooltip(false);
        setTimeout(() => setIsVisible(false), 200);
    };

    const handleClose = () => {
        setShowTooltip(false);
        setTimeout(() => setIsVisible(false), 200);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            case 'bottom':
                return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
            default:
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case 'top':
                return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
            case 'bottom':
                return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
            case 'left':
                return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
            case 'right':
                return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
            default:
                return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
        }
    };

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Trigger element with optional info icon */}
            <div className="flex items-center gap-1">
                {children}
                {showIcon && (
                    <Info
                        className={`w-4 h-4 text-gray-400 hover:text-primary transition-colors cursor-help ${iconClassName}`}
                    />
                )}
            </div>

            {/* Tooltip */}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-[9999] ${getPositionClasses()} transition-all duration-200 ease-in-out ${showTooltip
                            ? 'opacity-100 transform scale-100'
                            : 'opacity-0 transform scale-95'
                        }`}
                    style={{ maxWidth }}
                >
                    {/* Arrow */}
                    <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />

                    {/* Tooltip content */}
                    <div className="bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                        {/* Header with close button */}
                        {title && (
                            <div className="bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-600">
                                <h4 className="font-semibold text-sm text-white">{title}</h4>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    aria-label="Close tooltip"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="px-4 py-3">
                            <p className="text-sm leading-relaxed text-gray-100">
                                {content}
                            </p>
                        </div>

                        {/* Gradient accent */}
                        <div className="h-1 bg-gradient-to-r from-primary to-orange-500" />
                    </div>
                </div>
            )}
        </div>
    );
}; 