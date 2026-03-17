import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { GettingStartedHub } from '../components/getting-started';
import RefereeGuarantorResponseModal from '../components/referencing/RefereeGuarantorResponseModal';
import { useAuth } from '../contexts/AuthContext';
import { hasOnboardingCompleted } from '../utils/onboardingSession';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import {
  Search, Home, CalendarCheck, FileCheck, FileSignature,
  Building2, Users, BarChart3, Shield, ChevronDown, Sparkles, Wrench,
} from 'lucide-react';

import { useState, useEffect, useRef } from 'react';

interface HomeVariantProps {
  /** When true, hide the initial onboarding flow modal (e.g. when showing tenant/landlord options as modal) */
  hideOnboardingModal?: boolean;
}

const TYPING_PHRASES = ['Move in.', 'One platform.', 'Zero hassle.'] as const;
const TYPING_SPEED_MS = 80;
const DELETE_SPEED_MS = 50;
const PAUSE_AFTER_TYPING_MS = 1800;
const PAUSE_AFTER_DELETING_MS = 400;

const HomeVariant = ({ hideOnboardingModal = false }: HomeVariantProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [, forceOnboardingRefresh] = useState(0);

  // Typing/deleting animation for hero headline
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = TYPING_PHRASES[typingIndex];
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
          setTypingIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
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
  }, [typingIndex, typingText, isDeleting]);
  const showOnboarding = !hideOnboardingModal && !isAuthenticated && !hasOnboardingCompleted();
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

  const handleAgentCta = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isAuthenticated) {
      navigate('/Agent');
      return;
    }

    // For anonymous users, send to registration and preserve destination.
    navigate('/register?role=agent&redirect=%2FAgent');
  };

  // --- Pillbox toggle state ---
  const [activeMode, setActiveMode] = useState<'search' | 'list'>('search');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        toggleRef.current && !toggleRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToAgent = () => {
    if (isAuthenticated) {
      navigate('/Agent');
    } else {
      navigate('/register?role=agent&redirect=%2FAgent');
    }
  };

  function handleModeSwitch(mode: 'search' | 'list') {
    if (mode === activeMode) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setActiveMode(mode);
      setIsDropdownOpen(true);
    }
    setHoveredItem(null);
  }

  const searchMenuItems = [
    { icon: <Search className="h-4 w-4" />, label: 'Search Properties', description: 'AI-powered property search across multiple platforms', action: () => { setIsDropdownOpen(false); handleSearchCta(); } },
    { icon: <CalendarCheck className="h-4 w-4" />, label: 'Book Viewings', description: 'Schedule and manage property viewings instantly', action: () => { setIsDropdownOpen(false); navigate('/bookviewing'); } },
    { icon: <FileCheck className="h-4 w-4" />, label: 'Referencing', description: 'Complete tenant referencing online, hassle-free', action: () => { setIsDropdownOpen(false); navigate('/referencing'); } },
    { icon: <FileSignature className="h-4 w-4" />, label: 'Sign Contracts', description: 'Digital contract signing, legally binding', action: () => { setIsDropdownOpen(false); navigate('/contracts'); } },
  ];

  const listMenuItems = [
    { icon: <Building2 className="h-4 w-4" />, label: 'List Property', description: 'Advertise your property to verified tenants', action: () => { setIsDropdownOpen(false); navigateToAgent(); } },
    { icon: <Users className="h-4 w-4" />, label: 'Manage Tenants', description: 'Tenant communication and management tools', action: () => { setIsDropdownOpen(false); navigateToAgent(); } },
    { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytics', description: 'Track listing performance and enquiries', action: () => { setIsDropdownOpen(false); navigateToAgent(); } },
    { icon: <Shield className="h-4 w-4" />, label: 'Verify Tenants', description: 'Run background and credit checks securely', action: () => { setIsDropdownOpen(false); navigateToAgent(); } },
    { icon: <Wrench className="h-4 w-4" />, label: 'Tools', description: 'Free rental tools and official documents for landlords and tenants', action: () => { setIsDropdownOpen(false); navigate('/tools'); } },
  ];

  const menuItems = activeMode === 'search' ? searchMenuItems : listMenuItems;

  return (
    <div className="min-h-screen flex flex-col font-nunito">
      {showOnboarding && (
        <OnboardingFlow
          asModal
          onDismiss={() => forceOnboardingRefresh((k) => k + 1)}
        />
      )}

      <Navbar hideServiceLinks />

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
            fetchPriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0">
          {/* Primary CTAs – HeroToggle horizontal pill with dropdown (fixed vertical position) */}
          <div className="absolute left-1/2 top-[5rem] w-full max-w-2xl -translate-x-1/2 -translate-y-[192px] flex justify-center px-4 md:top-[6rem]">
            <div className="relative inline-flex flex-col items-center">
              {/* Toggle Pill Container */}
              <div ref={toggleRef} className="relative">
                {/* Outer glow */}
                <div
                  className="absolute -inset-1 rounded-full opacity-40 blur-lg transition-all duration-700 pointer-events-none"
                  style={{
                    background:
                      activeMode === 'search'
                        ? 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 100%)'
                        : 'linear-gradient(135deg, #E8D5B0 0%, #D4C4A0 100%)',
                  }}
                />

                {/* Glass container */}
                <div
                  className="relative flex items-stretch rounded-full border border-white/[0.12] p-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    boxShadow:
                      '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Search / Renters Button */}
                  <button
                    onClick={() => handleModeSwitch('search')}
                    className="group relative flex items-center gap-1.5 sm:gap-2.5 rounded-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={
                      activeMode === 'search'
                        ? {
                            background: 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 80%, #357FB7 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 16px rgba(107, 178, 232, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.15)',
                            transform: 'translateY(-1px)',
                          }
                        : {
                            background: 'transparent',
                            color: 'rgba(255, 255, 255, 0.55)',
                          }
                    }
                    aria-pressed={activeMode === 'search'}
                    aria-label="Search Properties Free"
                  >
                    <Home className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    <span className="whitespace-nowrap tracking-wide">Search Properties Free</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-all duration-300 ${
                        activeMode === 'search' && isDropdownOpen
                          ? 'rotate-180 opacity-100'
                          : activeMode === 'search'
                            ? 'rotate-0 opacity-70'
                            : 'rotate-0 opacity-0'
                      }`}
                      strokeWidth={2.5}
                    />
                    {activeMode === 'search' && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }}
                      />
                    )}
                  </button>

                  {/* Divider */}
                  <div className="my-2.5 w-px bg-white/10" />

                  {/* List / Landlords Button */}
                  <button
                    onClick={() => handleModeSwitch('list')}
                    className="group relative flex items-center gap-1.5 sm:gap-2.5 rounded-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={
                      activeMode === 'list'
                        ? {
                            background: 'linear-gradient(135deg, #F5E6CC 0%, #E8D5B0 80%, #DBC8A0 100%)',
                            color: '#3D2E1A',
                            boxShadow: '0 4px 16px rgba(232, 213, 176, 0.35), 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-1px)',
                          }
                        : {
                            background: 'transparent',
                            color: 'rgba(255, 255, 255, 0.55)',
                          }
                    }
                    aria-pressed={activeMode === 'list'}
                    aria-label="List & Manage Properties"
                  >
                    <Building2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    <span className="whitespace-nowrap tracking-wide">List &amp; Manage Properties</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-all duration-300 ${
                        activeMode === 'list' && isDropdownOpen
                          ? 'rotate-180 opacity-100'
                          : activeMode === 'list'
                            ? 'rotate-0 opacity-70'
                            : 'rotate-0 opacity-0'
                      }`}
                      strokeWidth={2.5}
                    />
                    {activeMode === 'list' && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Contextual Dropdown */}
              <div
                ref={dropdownRef}
                className="absolute top-full z-50 mt-3 w-[calc(100vw-2rem)] sm:w-[420px] overflow-hidden"
                style={{
                  left: '50%',
                  opacity: isDropdownOpen ? 1 : 0,
                  transform: isDropdownOpen
                    ? 'translateX(-50%) translateY(0) scale(1)'
                    : 'translateX(-50%) translateY(-8px) scale(0.97)',
                  pointerEvents: isDropdownOpen ? 'auto' as const : 'none' as const,
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                }}
              >
                {/* Dropdown glass container */}
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/[0.1]"
                  style={{
                    background: 'rgba(15, 15, 20, 0.75)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="h-[2px] w-full transition-all duration-700"
                    style={{
                      background:
                        activeMode === 'search'
                          ? 'linear-gradient(90deg, transparent, #6BB2E8, transparent)'
                          : 'linear-gradient(90deg, transparent, #E8D5B0, transparent)',
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                    <Sparkles
                      className="h-3.5 w-3.5 transition-colors duration-500"
                      style={{ color: activeMode === 'search' ? '#6BB2E8' : '#D4C090' }}
                    />
                    <p
                      className="text-xs font-medium uppercase tracking-widest transition-colors duration-500"
                      style={{ color: activeMode === 'search' ? 'rgba(107, 178, 232, 0.92)' : 'rgba(212, 192, 144, 0.8)' }}
                    >
                      {activeMode === 'search' ? 'For Renters & Buyers' : 'For Landlords & Agents'}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {menuItems.map((item, index) => (
                      <button
                        key={`${activeMode}-${index}`}
                        onClick={item.action}
                        className="group relative flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all duration-200"
                        style={{
                          background:
                            hoveredItem === index
                              ? activeMode === 'search'
                                ? 'rgba(33, 71, 102, 0.12)'
                                : 'rgba(232, 213, 176, 0.08)'
                              : 'transparent',
                        }}
                        onMouseEnter={() => setHoveredItem(index)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Icon container */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
                          style={{
                            borderColor:
                              hoveredItem === index
                                ? activeMode === 'search' ? 'rgba(33, 71, 102, 0.35)' : 'rgba(232, 213, 176, 0.2)'
                                : 'rgba(255, 255, 255, 0.08)',
                            background:
                              hoveredItem === index
                                ? activeMode === 'search' ? 'rgba(33, 71, 102, 0.18)' : 'rgba(232, 213, 176, 0.1)'
                                : 'rgba(255, 255, 255, 0.04)',
                            color:
                              hoveredItem === index
                                ? activeMode === 'search' ? '#6BB2E8' : '#E8D5B0'
                                : 'rgba(255, 255, 255, 0.5)',
                            boxShadow:
                              hoveredItem === index
                                ? activeMode === 'search' ? '0 0 20px rgba(33, 71, 102, 0.2)' : '0 0 20px rgba(232, 213, 176, 0.1)'
                                : 'none',
                          }}
                        >
                          {item.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium transition-colors duration-200"
                            style={{ color: hoveredItem === index ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)' }}
                          >
                            {item.label}
                          </p>
                          <p
                            className="mt-0.5 text-xs leading-relaxed transition-colors duration-200"
                            style={{ color: hoveredItem === index ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.35)' }}
                          >
                            {item.description}
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                          style={{
                            opacity: hoveredItem === index ? 1 : 0,
                            transform: hoveredItem === index ? 'translateX(0)' : 'translateX(-4px)',
                            background: activeMode === 'search' ? 'rgba(33, 71, 102, 0.25)' : 'rgba(232, 213, 176, 0.12)',
                            color: activeMode === 'search' ? '#6BB2E8' : '#E8D5B0',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4.5 2.5L8 6L4.5 9.5" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Footer CTA */}
                  <div className="border-t border-white/[0.06] px-5 py-3.5">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (activeMode === 'search') {
                          handleSearchCta();
                        } else {
                          navigateToAgent();
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300"
                      style={{
                        background: activeMode === 'search' ? 'rgba(33, 71, 102, 0.15)' : 'rgba(232, 213, 176, 0.08)',
                        color: activeMode === 'search' ? '#6BB2E8' : '#E8D5B0',
                        border: activeMode === 'search' ? '1px solid rgba(33, 71, 102, 0.3)' : '1px solid rgba(232, 213, 176, 0.12)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = activeMode === 'search' ? 'rgba(33, 71, 102, 0.25)' : 'rgba(232, 213, 176, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = activeMode === 'search' ? 'rgba(33, 71, 102, 0.15)' : 'rgba(232, 213, 176, 0.08)';
                      }}
                    >
                      {activeMode === 'search' ? 'Get Started Free' : 'Start Listing Today'}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 3L10 7L5 11" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer so heading/content start below the fixed pillbox */}
          <div className="h-36 md:h-40 shrink-0" aria-hidden="true" />

          {/* Main Heading */}
          <h3 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight">
            Search. Verify.{' '}
            <span className="text-[#F15A22]">
              {typingText}
              <span className="animate-pulse" aria-hidden="true">|</span>
            </span>
          </h3>

          {/* Subheading */}
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4">
            Search properties, book viewings, complete referencing and sign contracts in one place. Free for tenants.
          </p>

          {/* Search Bar */}
          <div ref={searchBarRef} className="max-w-3xl mx-auto px-4 md:px-0">
            <SearchInput
              onHeightChange={handleSearchInputHeightChange}
              value={prefilledSearchQuery}
              initialSearchType={prefilledSearchType}
              simplified
            />
          </div>
        </div>
      </section>

      {/**The new services section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0] z-20">
        {/* Background Image (Blobs) */}
        <img
          src="/images/middle-section.png"
          alt="Background design"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Book Viewing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/viewing-room.jpg"
                  alt="Viewing room"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Book Viewing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
              </p>
              <button
                onClick={() => navigate('/bookviewing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Referencing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/referencing-person.jpg"
                  alt="Referencing process"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Referencing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
              </p>
              <button
                onClick={() => navigate('/referencing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Contract Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/modern-building.jpg"
                  alt="Modern building"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Contract</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
              </p>
              <button
                onClick={() => navigate('/contracts')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/**End of the new services section */}

      {/* Trial CTA section – Workstream 3 */}
      <section className="relative py-16 md:py-20 bg-[#002B49] z-20">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-4xl font-bold font-archive mb-4 md:mb-6">
            Start free. No credit card. No commitment.
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-8 md:mb-10 leading-relaxed">
            Every new user gets <strong>3 months of full access</strong> to Proptii — search, viewings, referencing, and contracts. Tenants and buyers: free forever for core search. Landlords and agents: try the full toolkit before you decide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 md:mb-8">
            <Link
              to="/register?role=tenant"
              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 rounded-full bg-[#F15A22] text-white font-semibold text-base md:text-lg hover:opacity-90 transition-opacity"
            >
              Join as a Tenant / Buyer
            </Link>
            <Link
              to="/register?role=agent"
              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 rounded-full border-2 border-white/80 text-white font-semibold text-base md:text-lg hover:bg-white/10 transition-colors"
            >
              Join as a Landlord / Agent
            </Link>
          </div>
          <p className="text-sm md:text-base text-white/70">
            After your trial, plans start from [price TBD]/month. We'll notify you before any charges.
          </p>
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

