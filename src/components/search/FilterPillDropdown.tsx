import React, { useEffect, useRef } from 'react';

interface FilterPillDropdownProps {
  label: string;
  badge?: string | number | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export const FilterPillDropdown: React.FC<FilterPillDropdownProps> = ({
  label,
  badge,
  isOpen,
  onToggle,
  onClose,
  isActive = false,
  children,
  ariaLabel,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel || label}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 border shadow-xs ${
          isActive
            ? 'bg-[#136C9E] text-white border-[#0F5A8A] shadow-sm ring-2 ring-[#136C9E]/20'
            : isOpen
            ? 'bg-gray-100 text-gray-900 border-gray-300'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
        }`}
      >
        <span>{label}</span>
        {badge != null && (
          <span
            className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full ${
              isActive ? 'bg-white text-[#136C9E]' : 'bg-[#136C9E]/10 text-[#136C9E]'
            }`}
          >
            {badge}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            isActive ? 'text-white' : 'text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[280px] sm:min-w-[320px] animate-in fade-in zoom-in-95 duration-100"
        >
          {children}
        </div>
      )}
    </div>
  );
};
