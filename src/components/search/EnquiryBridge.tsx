import React from 'react';
import { Link } from 'react-router-dom';
import type { SearchIntent } from '../../types/govData';

interface EnquiryBridgeProps {
  intent: Extract<SearchIntent, 'general_answerable' | 'general_too_broad' | 'off_topic'>;
  query: string;
  onSearchInstead: () => void;
}

export const EnquiryBridge: React.FC<EnquiryBridgeProps> = ({
  intent,
  query,
  onSearchInstead,
}) => {
  if (intent === 'off_topic') {
    return (
      <div
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="enquiry-off-topic"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-2">That looks off-topic</h2>
        <p className="text-gray-600 mb-4">
          Proptii helps with UK property search and renter/buyer rights — not “{query}”.
        </p>
        <button
          type="button"
          onClick={onSearchInstead}
          className="rounded-lg bg-[#E65D24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D54A1A]"
        >
          Search for a home instead
        </button>
      </div>
    );
  }

  if (intent === 'general_too_broad') {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
        data-testid="enquiry-too-broad"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Can you narrow that down?</h2>
        <p className="text-gray-700 mb-4">
          “{query}” is a bit broad. Try a location, budget, or a specific rights topic — or browse
          Know Your Rights.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSearchInstead}
            className="rounded-lg bg-[#E65D24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D54A1A]"
          >
            Refine as a property search
          </button>
          <Link
            to="/tools/know-your-rights"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Know Your Rights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-[#136C9E]/25 bg-[#F3F9FC] p-6 shadow-sm"
      data-testid="enquiry-answerable"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-2">We can point you to the right place</h2>
      <p className="text-gray-700 mb-4">
        For questions like “{query}”, Proptii doesn’t invent legal answers. Use Know Your Rights for
        definitional guidance, or continue into property search.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/tools/know-your-rights"
          className="rounded-lg bg-[#136C9E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f5a84]"
        >
          Know Your Rights
        </Link>
        <button
          type="button"
          onClick={onSearchInstead}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Search properties instead
        </button>
      </div>
    </div>
  );
};
