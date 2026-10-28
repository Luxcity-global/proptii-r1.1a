import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronUp, FileSignature, LayoutDashboard, PlusCircle, Search, UserPlus, type LucideIcon,
} from 'lucide-react';
import { SearchInput } from '../SearchInput';

export type LandlordQuickAction = 'add-property' | 'add-tenant' | 'send-contract';

interface LandlordAgentHeroProps {
  /** Pill rendered above the headline (guest audience toggle). */
  audienceToggle?: ReactNode;
  typingText: string;
  /** Signed-in landlord or agent — primary CTA becomes "Go to dashboard". */
  isSignedIn: boolean;
  isAgent: boolean;
  firstName?: string;
  initialQuery?: string;
  initialSearchType?: 'onthemarket' | 'proptii';
  onQuickAction: (action: LandlordQuickAction) => void;
}

const QUICK_ACTIONS: { action: LandlordQuickAction; label: string; icon: LucideIcon }[] = [
  { action: 'add-property', label: 'Add property', icon: PlusCircle },
  { action: 'add-tenant', label: 'Add tenant', icon: UserPlus },
  { action: 'send-contract', label: 'Send contract', icon: FileSignature },
];

/**
 * Landlord/agent home hero: a primary CTA into the product (dashboard or pricing)
 * and a secondary CTA that shows/hides the property search bar in place.
 */
export const LandlordAgentHero = ({
  audienceToggle,
  typingText,
  isSignedIn,
  isAgent,
  firstName,
  initialQuery = '',
  initialSearchType = 'onthemarket',
  onQuickAction,
}: LandlordAgentHeroProps) => {
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const input = searchContainerRef.current?.querySelector('input, textarea');
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.focus();
    }
  }, [searchOpen]);

  const primaryTarget = isSignedIn ? '/landlord' : `/pricing?audience=${isAgent ? 'agents' : 'landlords'}`;

  return (
    <section className="min-h-[95vh] pt-28 pb-16 md:pt-32 relative flex items-center z-10" data-testid="landlord-agent-hero">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/01_Man_Woman_Office_BG.jpg"
          alt="Hero background"
          loading="eager"
          {...{ fetchpriority: 'high' }}
          className="w-full h-full object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B2338]/75 via-[#0B2338]/55 to-[#0B2338]/80" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white w-full">
        {audienceToggle}

        {isSignedIn ? (
          <p className="text-sm md:text-base font-semibold text-[#F8B08F] mb-3 tracking-wide">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </p>
        ) : (
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6BB2E8] mb-4">
            For landlords &amp; letting agents
          </p>
        )}

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight tracking-tight">
          List. Screen.{' '}
          <span className="text-[#F15A22]">
            {typingText}
            <span className="animate-pulse" aria-hidden="true">|</span>
          </span>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl mb-8 md:mb-10 max-w-3xl mx-auto font-light px-4 text-white/90 leading-relaxed">
          Advertise properties to verified tenants, manage viewing requests, run instant referencing checks, and manage digital AST contracts in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
          <Link
            to={primaryTarget}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base md:text-lg text-white bg-gradient-to-r from-[#DC5F12] to-[#F47A1A] shadow-lg shadow-orange-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {isSignedIn && <LayoutDashboard className="w-5 h-5" aria-hidden />}
            {isSignedIn ? 'Go to dashboard' : 'Get started'}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-expanded={searchOpen}
            aria-controls="landlord-hero-search"
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base md:text-lg border-2 transition-all ${
              searchOpen
                ? 'bg-white text-[#14385C] border-white'
                : 'text-white border-white/80 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-white'
            }`}
          >
            {searchOpen ? <ChevronUp className="w-5 h-5" aria-hidden /> : <Search className="w-5 h-5" aria-hidden />}
            {searchOpen ? 'Hide search' : 'Search properties'}
          </button>
        </div>

        {!isSignedIn && !searchOpen && (
          <p className="mt-5 text-sm text-white/75">1 month free on every plan · No credit card required</p>
        )}

        {searchOpen && (
          <div id="landlord-hero-search" ref={searchContainerRef} className="relative z-10 mt-8 max-w-3xl mx-auto px-4 md:px-0">
            <SearchInput value={initialQuery} initialSearchType={initialSearchType} simplified />
          </div>
        )}

        {isSignedIn && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {QUICK_ACTIONS.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                type="button"
                onClick={() => onQuickAction(action)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <Icon className="w-4 h-4 text-[#F8B08F]" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
