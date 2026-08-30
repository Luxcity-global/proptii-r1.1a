import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { GettingStartedHub } from '../components/getting-started';
import RefereeGuarantorResponseModal from '../components/referencing/RefereeGuarantorResponseModal';
import { ServicesSection } from '../components/home/ServicesSection';
import { useAuth } from '../contexts/AuthContext';
import { hasOnboardingCompleted, HOMEPAGE_ONBOARDING_FLOW_ENABLED } from '../utils/onboardingSession';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import {
  CalendarCheck, FileCheck, FileSignature, Building2,
} from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { getPlanById } from '../config/plans';

interface HomeVariantProps {
  /** When true, hide the initial onboarding flow modal (e.g. when showing tenant/landlord options as modal) */
  hideOnboardingModal?: boolean;
}

const TENANT_TYPING_PHRASES = ['Zero hassle.', 'Move in fast.', 'One platform.'] as const;
const LANDLORD_TYPING_PHRASES = ['Zero vacancy.', 'Verified tenants.', 'Digital contracts.'] as const;
const TYPING_SPEED_MS = 80;
const DELETE_SPEED_MS = 50;
const PAUSE_AFTER_TYPING_MS = 1800;
const PAUSE_AFTER_DELETING_MS = 400;

const HomeVariant = ({ hideOnboardingModal = false }: HomeVariantProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [, forceOnboardingRefresh] = useState(0);

  const isLandlordPersona = isAuthenticated && Boolean(user?.roles?.includes('landlord') || user?.roles?.includes('agent'));

  const activePhrases = isLandlordPersona ? LANDLORD_TYPING_PHRASES : TENANT_TYPING_PHRASES;

  // Typing/deleting animation for hero headline
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = activePhrases[typingIndex % activePhrases.length];
    const fullPhraseTyped = !isDeleting && typingText.length === phrase.length;
    const fullyDeleted = isDeleting && typingText.length === 0;

    let delay: number;
    if (fullPhraseTyped) {
      delay = PAUSE_AFTER_TYPING_MS;
    } else if (fullyDeleted) {
      delay = PAUSE_AFTER_DELETING_MS;
    } else {
      delay = isDeleting ? DELETE_SPEED_MS : TYPING_SPEED_MS;
    }

    const timer = setTimeout(() => {
      if (isDeleting) {
        if (typingText.length > 0) {
          setTypingText(phrase.slice(0, typingText.length - 1));
        } else {
          setIsDeleting(false);
          setTypingIndex((prev) => (prev + 1) % activePhrases.length);
        }
      } else {
        if (typingText.length < phrase.length) {
          setTypingText(phrase.slice(0, typingText.length + 1));
        } else {
          setIsDeleting(true);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [typingIndex, typingText, isDeleting, activePhrases]);
  // Archived: flip HOMEPAGE_ONBOARDING_FLOW_ENABLED to restore mascot startup
  const showOnboarding =
    HOMEPAGE_ONBOARDING_FLOW_ENABLED &&
    !hideOnboardingModal &&
    !isAuthenticated &&
    !hasOnboardingCompleted();
  const searchBarRef = useRef<HTMLDivElement>(null);

  const [searchInputHeight, setSearchInputHeight] = useState(50);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseType, setResponseType] = useState<'referee' | 'guarantor'>('referee');
  const [applicantName, setApplicantName] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');

  // Allow other pages (e.g. Search Results) to send the user back to Home with their query prefilled
  const prefilledSearchQuery = searchParams.get('q') || '';
  const prefilledSearchType: 'onthemarket' | 'proptii' =
    searchParams.get('type') === 'proptii' ? 'proptii' : 'onthemarket';

  // Check for query parameters to open the response modal
  useEffect(() => {
    const responseTypeParam = searchParams.get('responseType');
    const applicantParam = searchParams.get('applicant');
    const emailParam = searchParams.get('email');
    const tenantEmailParam = searchParams.get('tenantEmail');

    if (responseTypeParam && (responseTypeParam === 'referee' || responseTypeParam === 'guarantor')) {
      setResponseType(responseTypeParam);
      setApplicantName(applicantParam || '');
      setPrefilledEmail(emailParam || '');
      setTenantEmail(tenantEmailParam || '');
      setIsResponseModalOpen(true);
      
      // Clear query parameters from URL without reloading
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSearchInputHeightChange = (height: number) => {
    setSearchInputHeight(height);
  };

  // Calculate dynamic padding based on search input height
  const getDynamicPadding = () => {
    const baseHeight = 50;
    const extraHeight = Math.max(0, searchInputHeight - baseHeight);
    return extraHeight * 0.5; // Adjust multiplier as needed
  };

  const handleCloseResponseModal = () => {
    setIsResponseModalOpen(false);
  };

  const handleSearchCta = () => {
    const searchContainer = searchBarRef.current;
    if (!searchContainer) return;

    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = searchContainer.querySelector('textarea, input');
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      input.focus();
    }
  };

  const [ctaHover, setCtaHover] = useState<'tenant' | 'agent' | null>('tenant');

  const navigateToLandlordAction = (action: 'add-property' | 'clients' | 'analytics' | 'coming-soon') => {
    if (action === 'add-property') {
      navigate('/landlord?start=property-setup-step1');
      return;
    }
    if (action === 'clients') {
      navigate('/landlord/clients');
      return;
    }
    if (action === 'analytics') {
      navigate('/landlord/insights');
      return;
    }
    navigate('/coming-soon');
  };

  return (
    <div className="min-h-screen flex flex-col font-nunito">
      {showOnboarding && (
        <OnboardingFlow
          asModal
          onDismiss={() => forceOnboardingRefresh((k) => k + 1)}
        />
      )}

      <Navbar />

      {/* Referee/Guarantor Response Modal */}
      <RefereeGuarantorResponseModal
        isOpen={isResponseModalOpen}
        onClose={handleCloseResponseModal}
        responseType={responseType}
        applicantName={applicantName}
        prefilledEmail={prefilledEmail}
        tenantEmail={tenantEmail}
      />

      {/* Hero Section */}
      <section 
        className={`h-[95vh] pt-32 relative flex items-center md:pt-0 z-10`}
        style={{ paddingBottom: `${getDynamicPadding()}px` }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Hero background"
            loading="eager"
            fetchpriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0 pt-20 md:pt-16">
          {/* Main Role-Tailored Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight tracking-tight">
            {isLandlordPersona ? 'List. Screen. ' : 'Search. Verify. '}
            <span className="text-[#F15A22]">
              {typingText}
              <span className="animate-pulse" aria-hidden="true">|</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl md:text-2xl mb-8 md:mb-10 max-w-3xl mx-auto font-light px-4 text-white/90 leading-relaxed">
            {isLandlordPersona
              ? 'Advertise properties to verified tenants, manage viewing requests, run instant referencing checks, and manage digital AST contracts in one place.'
              : 'Search verified properties, book viewings in seconds, complete instant referencing, and sign contracts online. Free for tenants.'}
          </p>

          {/* AI Search Bar for Both Personas */}
          <div ref={searchBarRef} className="relative z-10 max-w-3xl mx-auto px-4 md:px-0">
            <SearchInput
              onHeightChange={handleSearchInputHeightChange}
              value={prefilledSearchQuery}
              initialSearchType={prefilledSearchType}
              simplified
            />
          </div>
        </div>
      </section>

      <section className="mt-6 md:mt-8">
        <ServicesSection variant="v1" />
      </section>

      {/* Trial CTA section – Workstream 3 */}
      <section className="relative py-10 md:py-14 bg-[#f2f2f2] z-20 overflow-hidden">
        {/* Single content container with background figures */}
        <div className="relative max-w-6xl mx-auto px-2 md:px-4 text-left text-[#374957]">
          {/* Text / CTAs */}
          <div className="relative z-10 max-w-xl md:-translate-x-4">
            <h2 className="text-2xl md:text-4xl font-bold font-archive mb-4 md:mb-6 text-[#136C9E]">
            Start free. No credit card. No commitment.
            </h2>
            <p className="text-base md:text-lg mb-8 md:mb-10 leading-relaxed">
              Every new user gets <strong>1 month completely free</strong> on paid plans — search, viewings, referencing, and contracts. Tenants and buyers: Explorer is free forever for core search. Landlords and agents: try the full toolkit before you decide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-start items-center mb-6 md:mb-8">
              <Link
                to="/pricing?segment=renters"
                onMouseEnter={() => setCtaHover('tenant')}
                onMouseLeave={() => setCtaHover('tenant')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 rounded-full font-semibold text-base md:text-lg transition-all duration-200 focus:outline-none focus-visible:outline-none text-white border-2 border-transparent bg-gradient-to-r from-[#DC5F12] to-[#F47A1A] shadow-md -translate-y-0.5 hover:shadow-lg hover:-translate-y-1"
              >
                Join as a Tenant / Buyer
              </Link>
              <Link
                to="/pricing?segment=agents"
                onMouseEnter={() => setCtaHover('agent')}
                onMouseLeave={() => setCtaHover('tenant')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 rounded-full border-2 border-[#136C9E] text-[#136C9E] font-semibold text-base md:text-lg bg-transparent transition-all duration-200 hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#F47A1A] hover:shadow-lg hover:-translate-y-1 focus:outline-none focus-visible:outline-none"
              >
                Join as a Landlord / Agent
              </Link>
            </div>
            <p className="text-sm md:text-base">
              After your free month, paid plans start from £
              {getPlanById('renter_pro')?.monthlyPrice ?? 12}/month. We&apos;ll
              notify you before any charges.
            </p>
          </div>

          {/* Layered images acting as background on right (desktop only) */}
          <img
            src={
              ctaHover === 'tenant'
                ? '/images/home page join us/tenant colourful.png'
                : '/images/home page join us/tenant bw.png'
            }
            alt=""
            className={`pointer-events-none select-none hidden md:block absolute bottom-0 right-20 max-h-[28rem] lg:max-h-[32rem] w-auto object-contain transition-transform duration-200 ${
              ctaHover === 'tenant' ? 'translate-y-16' : 'translate-y-24'
            } ${
              ctaHover === 'tenant' ? 'scale-110 opacity-100' : 'scale-100 opacity-50'
            } ${ctaHover === 'agent' ? 'z-0' : 'z-10'}`}
            loading="lazy"
          />
          <img
            src={
              ctaHover === 'agent'
                ? '/images/home page join us/agent colourful.png'
                : '/images/home page join us/agent bw.png'
            }
            alt=""
            className={`pointer-events-none select-none hidden md:block absolute bottom-0 right-[-320px] max-h-[24rem] lg:max-h-[30rem] w-auto object-contain translate-y-24 transition-transform duration-200 ${
              ctaHover === 'agent' ? 'scale-110 opacity-100' : 'scale-100 opacity-50'
            } ${ctaHover === 'agent' ? 'z-10' : 'z-0'}`}
            loading="lazy"
          />
        </div>
      </section>

      <FAQSection />
      <Footer />

      {/* Getting Started hub – lower-left FAB for resuming onboarding */}
      <GettingStartedHub app="home" />

    </div>
  );
};

export default HomeVariant;

