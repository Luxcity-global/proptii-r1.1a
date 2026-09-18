import React from 'react';
import type { PropertyTypeCategory } from '../../types/filter';

interface PropertyTypePopoverProps {
  selectedTypes: PropertyTypeCategory[];
  onToggle: (type: PropertyTypeCategory) => void;
  onClear: () => void;
  onClose: () => void;
}

const PROPERTY_TYPES: { label: string; description: string; value: PropertyTypeCategory }[] = [
  { label: 'Flats & Apartments', description: 'Flats, maisonettes, duplexes', value: 'flat' },
  { label: 'Houses', description: 'Terraced, semi-detached, detached', value: 'house' },
  { label: 'Studios', description: 'Open plan studio apartments', value: 'studio' },
  { label: 'Bungalows', description: 'Single-storey dwellings', value: 'bungalow' },
];

export const PropertyTypePopover: React.FC<PropertyTypePopoverProps> = ({
  selectedTypes,
  onToggle,
  onClear,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900">Property Type</h3>
        {selectedTypes.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-500 hover:text-[#E65D24] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {PROPERTY_TYPES.map((type) => {
          const checked = selectedTypes.includes(type.value);
          return (
            <label
              key={type.value}
              className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                checked
                  ? 'bg-[#136C9E]/5 border-[#136C9E]/40'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(type.value)}
                className="mt-0.5 h-4 w-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
              />
              <div className="ml-3">
                <span className="block text-xs font-semibold text-gray-900">{type.label}</span>
                <span className="block text-[11px] text-gray-500">{type.description}</span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};
