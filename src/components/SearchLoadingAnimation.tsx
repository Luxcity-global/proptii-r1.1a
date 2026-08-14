import { useEffect, useState } from 'react';
import '../styles/search-loading.css';

const STATUS_MESSAGES = [
  'Scout is sniffing out homes for you',
  'Checking listings across the UK',
  'Matching places to your brief',
  'Hunting for the best-value homes',
  'Lining up your top matches',
];

const TIPS = [
  'Save listings with the heart so you can compare them later.',
  'You can book a viewing straight from a property card.',
  'Try must-haves like “pet-friendly” or “near a station”.',
  'We’re matching your brief, not just keywords.',
];

const STAGES = ['Understanding your search', 'Scanning live listings', 'Ranking the best matches'];
const SCOUT_IMAGE = '/images/scout1.png';

interface SearchLoadingAnimationProps {
  query?: string;
}

function House({
  roof,
  wall,
  door,
  delay,
}: {
  roof: string;
  wall: string;
  door: string;
  delay: string;
}) {
  return (
    <svg viewBox="0 0 88 92" className="h-[5.75rem] w-[5.5rem] shrink-0" aria-hidden>
      <rect x="38" y="10" width="10" height="18" rx="1.5" fill="#7a4a32" />
      <path d="M8 38 L44 8 L80 38 Z" fill={roof} />
      <rect x="14" y="36" width="60" height="50" rx="3" fill={wall} />
      <rect x="36" y="58" width="16" height="28" rx="1.5" fill={door} />
      <circle cx="49" cy="73" r="1.4" fill="#f4d7b0" />
      <rect
        className="search-load-window-lit"
        x="20"
        y="46"
        width="12"
        height="12"
        rx="1.5"
        fill="#ffe8c7"
        style={{ animationDelay: delay }}
      />
      <rect
        className="search-load-window-lit"
        x="56"
        y="46"
        width="12"
        height="12"
        rx="1.5"
        fill="#ffe8c7"
        style={{ animationDelay: delay }}
      />
    </svg>
  );
}

function MagnifyingGlass() {
  return (
    <svg className="search-load-glass h-12 w-12" viewBox="0 0 48 48" aria-hidden>
      <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.55)" stroke="#F15A22" strokeWidth="3.5" />
      <circle cx="20" cy="20" r="6" fill="none" stroke="#136C9E" strokeWidth="1.5" opacity="0.5" />
      <path d="M29 29 L40 40" stroke="#002B49" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function Pin({ className }: { className: string }) {
  return (
    <svg className={`search-load-pin h-7 w-7 ${className}`} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 22s7-7.2 7-12.2A7 7 0 0 0 5 9.8C5 14.8 12 22 12 22z"
        fill="#F15A22"
      />
      <circle cx="12" cy="9.5" r="2.6" fill="#fff" />
    </svg>
  );
}

export const SearchLoadingAnimation = ({ query = '' }: SearchLoadingAnimationProps) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, 2400);
    const tipTimer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 4200);
    const stageTimer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % STAGES.length);
    }, 2800);

    return () => {
      window.clearInterval(statusTimer);
      window.clearInterval(tipTimer);
      window.clearInterval(stageTimer);
    };
  }, []);

  const houses = (
    <>
      <House roof="#F15A22" wall="#fff" door="#002B49" delay="0s" />
      <House roof="#136C9E" wall="#f7fbff" door="#7a4a32" delay="0.4s" />
      <House roof="#E65D24" wall="#fff8f4" door="#002B49" delay="0.8s" />
      <House roof="#002B49" wall="#fff" door="#F15A22" delay="1.2s" />
    </>
  );

  return (
    <div
      className="search-load-root mx-auto text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Searching for properties"
    >
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-orange-100/70 ring-1 ring-orange-100">
        <div className="search-load-scene">
          <div className="search-load-cloud search-load-cloud-a" />
          <div className="search-load-cloud search-load-cloud-b" />
          <div className="search-load-street">
            <div className="search-load-house-row">{houses}</div>
            <div className="search-load-house-row" aria-hidden>
              {houses}
            </div>
          </div>
          <Pin className="search-load-pin-a" />
          <Pin className="search-load-pin-b" />
          <div className="search-load-ring" />
          <MagnifyingGlass />
          <div className="search-load-scout-wrap">
            <img
              src={SCOUT_IMAGE}
              alt="Scout"
              className="search-load-scout"
            />
          </div>
        </div>

        <div className="px-6 pb-7 pt-5">
          <p key={statusIndex} className="search-load-copy text-lg font-semibold text-[#002B49]">
            {STATUS_MESSAGES[statusIndex]}
          </p>
          {query ? (
            <p className="mt-1 truncate text-sm text-gray-500">
              Looking for “<span className="font-medium text-gray-700">{query}</span>”
            </p>
          ) : null}

          <div className="search-load-bar mx-auto mt-5 max-w-xs" aria-hidden>
            <div className="search-load-bar-fill" />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {STAGES.map((stage, index) => (
              <span
                key={stage}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-500 ${
                  index === stageIndex
                    ? 'bg-[#F15A22] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {stage}
              </span>
            ))}
          </div>

          <p key={tipIndex} className="search-load-tip mx-auto mt-5 max-w-sm text-sm leading-relaxed text-gray-500">
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
      <span className="sr-only">Searching for properties...</span>
    </div>
  );
};

export default SearchLoadingAnimation;
