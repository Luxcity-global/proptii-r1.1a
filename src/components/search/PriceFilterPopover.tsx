import React, { useState, useEffect } from 'react';

interface PriceFilterPopoverProps {
  minPrice: number | null;
  maxPrice: number | null;
  onApply: (min: number | null, max: number | null) => void;
  onClear: () => void;
}

const MIN_PRESETS = [null, 750, 1000, 1250, 1500, 2000, 2500, 3000];
const MAX_PRESETS = [null, 1500, 2000, 2500, 3000, 4000, 5000, 7500];

export const PriceFilterPopover: React.FC<PriceFilterPopoverProps> = ({
  minPrice,
  maxPrice,
  onApply,
  onClear,
}) => {
  const [localMin, setLocalMin] = useState<string>(minPrice != null ? String(minPrice) : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice != null ? String(maxPrice) : '');

  useEffect(() => {
    setLocalMin(minPrice != null ? String(minPrice) : '');
    setLocalMax(maxPrice != null ? String(maxPrice) : '');
  }, [minPrice, maxPrice]);

  const handleApply = () => {
    const minVal = localMin.trim() ? parseInt(localMin.replace(/\D/g, ''), 10) : null;
    const maxVal = localMax.trim() ? parseInt(localMax.replace(/\D/g, ''), 10) : null;
    onApply(
      minVal != null && Number.isFinite(minVal) ? minVal : null,
      maxVal != null && Number.isFinite(maxVal) ? maxVal : null
    );
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900">Price Range (pcm)</h3>
        {(localMin || localMax) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-gray-500 hover:text-[#E65D24] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Input boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Price</label>
          <div className="relative rounded-lg shadow-xs">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-xs">£</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="No min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#136C9E] focus:border-[#136C9E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Max Price</label>
          <div className="relative rounded-lg shadow-xs">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-xs">£</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="No max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#136C9E] focus:border-[#136C9E]"
            />
          </div>
        </div>
      </div>

      {/* Quick preset chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Max Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {MAX_PRESETS.filter(Boolean).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setLocalMax(String(preset));
              }}
              className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                localMax === String(preset)
                  ? 'bg-[#136C9E] text-white border-[#136C9E]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              £{preset?.toLocaleString('en-GB')}
            </button>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={handleApply}
          className="w-full py-2 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-xs"
        >
          Apply Price
        </button>
      </div>
    </div>
  );
};
