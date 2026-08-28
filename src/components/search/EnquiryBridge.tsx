import React from 'react';
import { Link } from 'react-router-dom';
import type { Audience, SearchIntent } from '../../types/govData';

export type GuidanceTopic = 'pets' | 'epc' | 'generic';

interface EnquiryBridgeProps {
  intent: Extract<SearchIntent, 'general_answerable' | 'general_too_broad' | 'off_topic'>;
  query: string;
  onSearchInstead: () => void;
  /** Optional city chip handler for broad clarifier (fills query under the bar) */
  onCitySelect?: (city: string) => void;
  /** Compact lens on guidance cards — wired to existing audience context */
  audience?: Audience | null;
  onAudienceChange?: (audience: Audience) => void;
}

const BROAD_CITY_CHIPS = ['Leeds', 'Manchester', 'Bristol', 'London'] as const;

const LENS_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Agent' },
];

export function detectGuidanceTopic(query: string): GuidanceTopic {
  const lower = query.trim().toLowerCase();
  if (/\b(epc|mees|energy\s+rating|energy\s+efficiency|minimum\s+energy)\b/.test(lower)) {
    return 'epc';
  }
  if (/\b(pet|pets|pet[- ]friendly|animal|dog|cat)\b/.test(lower)) {
    return 'pets';
  }
  return 'generic';
}

function GuidanceCardShell({
  children,
  testId,
}: {
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      className="mt-4 w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-2xl text-left text-gray-900"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function LensToggle({
  audience,
  onAudienceChange,
}: {
  audience?: Audience | null;
  onAudienceChange?: (audience: Audience) => void;
}) {
  if (!onAudienceChange) return null;
  const active = audience === 'landlord' || audience === 'agent' ? audience : 'tenant';

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs">
      <span className="text-gray-400 font-semibold px-1 text-[10px]">LENS:</span>
      {LENS_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onAudienceChange(option.value)}
          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-colors ${
            active === option.value
              ? 'bg-[#136C9E] text-white'
              : 'text-gray-600 hover:text-gray-900 font-medium'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const EnquiryBridge: React.FC<EnquiryBridgeProps> = ({
  intent,
  query,
  onSearchInstead,
  onCitySelect,
  audience,
  onAudienceChange,
}) => {
  if (intent === 'off_topic') {
    return (
      <GuidanceCardShell testId="enquiry-off-topic">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E] mb-1">
          Outside Proptii Scope
        </div>
        <h2
          className="text-sm font-bold text-gray-900 mb-3"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          That looks off-topic
        </h2>
        <p className="text-xs text-gray-700 leading-relaxed mb-4">
          Proptii helps with UK property search and renter/buyer rights — not “{query}”.
        </p>
        <button
          type="button"
          onClick={onSearchInstead}
          className="rounded-full bg-[#E65D24] px-4 py-2 text-xs font-bold text-white hover:bg-[#D54A1A] transition-all"
        >
          Search for a home instead
        </button>
      </GuidanceCardShell>
    );
  }

  if (intent === 'general_too_broad') {
    return (
      <GuidanceCardShell testId="enquiry-too-broad">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E] mb-1">
          Refine Search Scope
        </div>
        <h2
          className="text-sm font-bold text-gray-900 mb-3"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          Which city or region would you like to search in?
        </h2>
        <div className="flex flex-wrap gap-2">
          {BROAD_CITY_CHIPS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() =>
                onCitySelect ? onCitySelect(city) : onSearchInstead()
              }
              className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white text-xs font-bold transition-all"
            >
              {city}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onSearchInstead}
            className="px-3 py-1.5 rounded-full bg-[#E65D24] text-white font-bold hover:bg-[#D54A1A] transition-all"
          >
            Refine as a property search →
          </button>
          <Link
            to="/tools/know-your-rights"
            className="text-[#136C9E] font-bold hover:underline"
          >
            Know Your Rights →
          </Link>
        </div>
      </GuidanceCardShell>
    );
  }

  const topic = detectGuidanceTopic(query);

  if (topic === 'pets') {
    return (
      <GuidanceCardShell testId="enquiry-answerable">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#E65D24] text-sm">
              ✨
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E]">
              Pet Permissions in Rentals
            </span>
          </div>
          <LensToggle audience={audience} onAudienceChange={onAudienceChange} />
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-3">
          Under the Renters (Reform) Bill guidelines, landlords cannot unreasonably withhold consent
          for pets, but superior title covenants on the building register may impose building-wide
          restrictions.
        </p>

        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onSearchInstead}
            className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white font-bold text-xs transition-all flex items-center gap-1"
          >
            <span>Search pet-friendly flats in Leeds</span> →
          </button>
          <Link to="/tools/know-your-rights" className="text-[#136C9E] font-bold hover:underline">
            Know Your Rights Guide →
          </Link>
        </div>
      </GuidanceCardShell>
    );
  }

  if (topic === 'epc') {
    return (
      <GuidanceCardShell testId="enquiry-answerable">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#E65D24] text-sm">
              ✨
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E]">
              EPC / MEES Requirements
            </span>
          </div>
          <LensToggle audience={audience} onAudienceChange={onAudienceChange} />
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-3">
          England and Wales MEES rules generally require privately rented homes to meet a minimum
          EPC standard before a new tenancy can be granted, with limited exemptions. Proptii does
          not invent legal advice — use Know Your Rights for the official definitions.
        </p>

        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onSearchInstead}
            className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white font-bold text-xs transition-all"
          >
            Search homes instead →
          </button>
          <Link to="/tools/know-your-rights" className="text-[#136C9E] font-bold hover:underline">
            Know Your Rights Guide →
          </Link>
        </div>
      </GuidanceCardShell>
    );
  }

  return (
    <GuidanceCardShell testId="enquiry-answerable">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#E65D24] text-sm">
            ✨
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#136C9E]">
            Guidance
          </span>
        </div>
        <LensToggle audience={audience} onAudienceChange={onAudienceChange} />
      </div>

      <p className="text-xs text-gray-700 leading-relaxed mb-3">
        For questions like “{query}”, Proptii doesn’t invent legal answers. Use Know Your Rights for
        definitional guidance, or continue into property search.
      </p>

      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onSearchInstead}
          className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white font-bold text-xs transition-all"
        >
          Search properties instead →
        </button>
        <Link to="/tools/know-your-rights" className="text-[#136C9E] font-bold hover:underline">
          Know Your Rights Guide →
        </Link>
      </div>
    </GuidanceCardShell>
  );
};
