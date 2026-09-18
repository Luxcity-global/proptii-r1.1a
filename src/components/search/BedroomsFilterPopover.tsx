import React from 'react';

interface BedroomsFilterPopoverProps {
  bedrooms: number[] | 'any';
  onToggle: (bed: number) => void;
  onSetAny: () => void;
  onClose: () => void;
}

const BEDROOM_OPTIONS = [
  { label: 'Studio', value: 0 },
  { label: '1 Bed', value: 1 },
  { label: '2 Beds', value: 2 },
  { label: '3 Beds', value: 3 },
  { label: '4+ Beds', value: 4 },
];

export const BedroomsFilterPopover: React.FC<BedroomsFilterPopoverProps> = ({
  bedrooms,
  onToggle,
  onSetAny,
  onClose,
}) => {
  const isAny = bedrooms === 'any' || (Array.isArray(bedrooms) && bedrooms.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900">Bedrooms</h3>
        {!isAny && (
          <button
            type="button"
            onClick={onSetAny}
            className="text-xs font-medium text-gray-500 hover:text-[#E65D24] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onSetAny}
          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
            isAny
              ? 'bg-[#136C9E] text-white border-[#136C9E] shadow-xs'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Any
        </button>

        {BEDROOM_OPTIONS.map((opt) => {
          const isSelected = !isAny && Array.isArray(bedrooms) && bedrooms.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                isSelected
                  ? 'bg-[#136C9E] text-white border-[#136C9E] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
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
