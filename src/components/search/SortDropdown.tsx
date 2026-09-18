import React, { useState, useRef, useEffect } from 'react';
import type { SortOption } from '../../types/filter';

interface SortDropdownProps {
  sortBy: SortOption;
  onSelect: (sort: SortOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Newest Listed', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Bedrooms', value: 'beds_desc' },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({ sortBy, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const currentLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 border shadow-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      >
        <span className="text-gray-400 font-normal">Sort:</span>
        <span className="font-semibold text-gray-800">{currentLabel}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={sortBy === opt.value}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                sortBy === opt.value
                  ? 'bg-[#136C9E]/10 text-[#136C9E] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              {sortBy === opt.value && (
                <svg className="w-3.5 h-3.5 text-[#136C9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
