import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { RiskBadge } from '../components/badges/RiskBadge';
import { ProptiiModule } from '../components/proptii/ProptiiModule';
import { ReportDiagnostic } from '../components/report/ReportDiagnostic';
import { ProptiiReportModal } from '../components/report/ProptiiReportModal';
import { AudienceSelectorModal } from '../components/report/AudienceSelectorModal';
import { AuthPromptModal } from '../components/auth/AuthPromptModal';
import { FactsOnlyExportModal } from '../components/export/FactsOnlyExportModal';
import { DisclosureRecordModal } from '../components/export/DisclosureRecordModal';
import { GeneralEnquiryBridge } from '../components/search/GeneralEnquiryBridge';
import { AudienceLens, GENERAL_ENQUIRY_DATABASE } from '../data/audienceLensCopy';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  MapPin,
  BedDouble,
  Building2,
  Calendar,
  FileCheck2,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Search,
  ExternalLink,
  X
} from 'lucide-react';

// Dynamic Typewriter Headline Component
const DynamicHeroWord = () => {
  const words = ['Rent.', 'Buy.', 'Move.', 'Decide.', 'Verify.'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = words[currentWordIndex];
    const typingSpeed = isDeleting ? 70 : 130;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        if (displayedText === fullText) {
          setTimeout(() => setIsDeleting(true), 1600);
        }
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        if (displayedText === '') {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);

  return (
    <span className="inline-flex items-center text-white">
      <span>{displayedText}</span>
      <span className="inline-block w-2.5 h-8 md:h-12 bg-[#F15A22] ml-1 animate-pulse" />
    </span>
  );
};

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAudience, setActiveAudience] = useState<AudienceLens>('tenant');
  
  // Modals & Gated Intelligence States
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFactsExportOpen, setIsFactsExportOpen] = useState(false);
  const [isDisclosureExportOpen, setIsDisclosureExportOpen] = useState(false);
  const [matchedEnquiry, setMatchedEnquiry] = useState<any | null>(null);

  // Suggested search prompts for the idle state (Cleanly underneath the search bar)
  const tryChips = [
    '2 bedroom flat in Leeds under 1200pcm',
    'Pet-friendly studios in Manchester',
    '3 bed house near good schools in Bristol',
  ];

  // Sample curated properties for instant demonstration of 3 flag states
  const sampleListings = [
    {
      id: 'prop-1',
      title: 'Modern 2-Bed Luxury Apartment',
      address: 'Park Row, City Centre, Leeds LS1 5HD',
      price: '£1,150 pcm',
      bedrooms: 2,
      bathrooms: 2,
      type: 'Flat / Apartment',
      image: '/images/viewing-room.jpg',
      isFlagged: false,
      isUnresolved: false,
    },
    {
      id: 'prop-2',
      title: 'Spacious Victorian Terraced Home',
      address: 'Headingley Lane, Headingley, Leeds LS6 2BS',
      price: '£1,400 pcm',
      bedrooms: 3,
      bathrooms: 1,
      type: 'Terraced House',
      image: '/images/modern-building.jpg',
      isFlagged: true, // Demonstrates flagged covenant & EPC context
      isUnresolved: false,
    },
    {
      id: 'prop-3',
      title: 'Contemporary Studio Apartment',
      address: 'Deansgate, Central Manchester M3 4EN',
      price: '£875 pcm',
      bedrooms: 1,
      bathrooms: 1,
      type: 'Studio Apartment',
      image: '/images/listings/property-main.jpg',
      isFlagged: false,
      isUnresolved: true, // Demonstrates unresolved plain-truth state
    },
  ];

  // Handle suggested chip click
  const handleChipClick = (prompt: string) => {
    setSearchQuery(prompt);
    checkGeneralEnquiry(prompt);
  };

  const checkGeneralEnquiry = (text: string) => {
    const lower = text.toLowerCase().trim();
    if (!lower) {
      setMatchedEnquiry(null);
      return;
    }
    if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat') || lower.includes('animal')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.pets);
    } else if (lower.includes('epc') || lower.includes('energy') || lower.includes('mees') || lower.includes('rating') || lower.includes('heating')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.epc);
    } else if (lower.includes('covenant') || lower.includes('restriction') || lower.includes('deed') || lower.includes('charges register')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.covenants);
    } else if (lower.includes('hmo') || lower.includes('sharer') || lower.includes('license') || lower.includes('house share')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.hmo);
    } else if (lower.includes('deposit') || lower.includes('fee') || lower.includes('holding') || lower.includes('tenant fee')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.deposits);
    } else if (lower.includes('cladding') || lower.includes('ews1') || lower.includes('building safety')) {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.building_safety);
    } else if (lower === 'uk' || lower === 'england' || lower.includes('cheap') || lower === 'flat' || lower === 'house') {
      setMatchedEnquiry(GENERAL_ENQUIRY_DATABASE.broad_search);
    } else {
      setMatchedEnquiry(null);
    }
  };

  // Gated Report Generation Flow
  const handleInitiateReportGeneration = (listing?: any) => {
    if (listing) setSelectedListing(listing);
    if (!isAuthenticated) {
      // Step 1: Unauthenticated -> Prompt Sign in / Sign up
      setIsAuthModalOpen(true);
    } else {
      // Step 1: Already Authenticated -> Open Perspective Modal
      setIsAudienceModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setIsAudienceModalOpen(true);
  };

  const handleAudienceChosen = (lens: AudienceLens) => {
    setActiveAudience(lens);
    setIsAudienceModalOpen(false);
    setIsDiagnosticRunning(true);
  };

  const handleDiagnosticComplete = () => {
    setIsDiagnosticRunning(false);
    setIsReportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-nunito flex flex-col justify-between">
      <Navbar />

      {/* Hero Section (Matches Reference UI Screenshot) */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        
        {/* Background Image with Warm Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Family smiling at home"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white w-full">
          
          {/* Main Headline with Dynamic Cycling Typewriter */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 font-archivo tracking-tight">
            Search. Verify. <DynamicHeroWord />
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 max-w-2xl mx-auto text-white/90 font-medium leading-relaxed">
            Search properties, book viewings, complete referencing and sign contracts in one place. Free for tenants.
          </p>

          {/* Search Bar (Sprint 2.1: Multi-State Capsule) */}
          <div className="mb-4">
            <SearchInput
              value={searchQuery}
              onChange={(q) => {
                setSearchQuery(q);
                checkGeneralEnquiry(q);
              }}
            />
          </div>

          {/* Suggested Search Prompts (Idle State - Only shown when search query is empty) */}
          {!searchQuery.trim() && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mt-3 mb-6 animate-in fade-in duration-150">
              <span className="text-xs text-white/75 font-semibold">Try:</span>
              {tryChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/95 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all transform hover:scale-105"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Sprint 4.1: General Enquiry Bridge Display */}
          {matchedEnquiry && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <GeneralEnquiryBridge
                enquiryData={matchedEnquiry}
                onSelectActionChip={(targetQuery) => {
                  setSearchQuery(targetQuery);
                  checkGeneralEnquiry(targetQuery);
                }}
                onSelectQuickReply={(loc) => {
                  const q = `Flats in ${loc}`;
                  setSearchQuery(q);
                  checkGeneralEnquiry(q);
                }}
              />
            </div>
          )}

        </div>

        {/* Scout Dog Mascot (Bottom Right Corner) */}
        <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/30 shadow-2xl animate-bounce duration-1000">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-[#F15A22]" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Scout is checking registers
          </span>
        </div>
      </section>

      {/* Featured Verified Listings Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10">
            <div className="flex items-center gap-2 text-[#136C9E] mb-1">
              <ShieldCheck className="w-5 h-5 text-[#136C9E]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Independent Verification
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-archivo">
              Pre-Checked Properties with Live Register Readouts
            </h2>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Price */}
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-[#F15A22] text-white px-3.5 py-1 rounded-full font-bold text-xs shadow-md">
                      {listing.price}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 font-archivo line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{listing.address}</span>
                    </div>

                    {/* Sprint 2.2: Risk Badges on Card */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <RiskBadge
                        flagType="restrictive_covenant"
                        state={listing.isUnresolved ? 'unresolved' : listing.isFlagged ? 'flagged' : 'clear'}
                        audienceLens={activeAudience}
                        size="sm"
                        onOpenReport={() => handleInitiateReportGeneration(listing)}
                      />
                      <RiskBadge
                        flagType="epc_context"
                        state={listing.isUnresolved ? 'unresolved' : listing.isFlagged ? 'flagged' : 'clear'}
                        audienceLens={activeAudience}
                        size="sm"
                        onOpenReport={() => handleInitiateReportGeneration(listing)}
                      />
                    </div>

                    {/* Meta information */}
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 font-semibold">
                        <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                        <span>{listing.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>{listing.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action: View Full Details / Intelligence */}
                <div className="px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedListing(listing);
                      setIsDetailModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    View Property & Proptii Report →
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Three Pillar Services Section */}
      <section className="py-20 bg-slate-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Book Viewing */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col justify-between border border-gray-100">
              <div>
                <img
                  src="/images/viewing-room.jpg"
                  alt="Viewing"
                  className="w-full h-56 object-cover rounded-2xl mb-6"
                />
                <div className="flex items-center gap-2 text-[#F15A22] mb-2">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-xl font-bold font-archivo">Book Viewing</h3>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Book viewings directly with vetted estate agents and private landlords with verified property titles.
                </p>
              </div>
              <button className="mt-6 bg-[#F15A22] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#D54A1A] transition-all">
                Book a Viewing
              </button>
            </div>

            {/* Referencing */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col justify-between border border-gray-100">
              <div>
                <img
                  src="/images/referencing-person.jpg"
                  alt="Referencing"
                  className="w-full h-56 object-cover rounded-2xl mb-6"
                />
                <div className="flex items-center gap-2 text-[#136C9E] mb-2">
                  <FileCheck2 className="w-5 h-5" />
                  <h3 className="text-xl font-bold font-archivo">Fast Referencing</h3>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Fast identity, employment, and income referencing passport for tenants with Open Banking support.
                </p>
              </div>
              <button className="mt-6 bg-[#136C9E] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#0d4f74] transition-all">
                Start Referencing
              </button>
            </div>

            {/* Contract Management */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col justify-between border border-gray-100">
              <div>
                <img
                  src="/images/modern-building.jpg"
                  alt="Contracts"
                  className="w-full h-56 object-cover rounded-2xl mb-6"
                />
                <div className="flex items-center gap-2 text-slate-800 mb-2">
                  <FileSignature className="w-5 h-5" />
                  <h3 className="text-xl font-bold font-archivo">Digital Contracts</h3>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Legally vetted Assured Shorthold Tenancy agreements customized to title terms with e-signatures.
                </p>
              </div>
              <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-black transition-all">
                Create Agreement
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Property Details Modal with Embedded Sprint 3.1 Proptii Module */}
      {isDetailModalOpen && selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={selectedListing.image}
              alt={selectedListing.title}
              className="w-full h-64 object-cover rounded-2xl mb-6"
            />

            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold font-archivo text-gray-900">{selectedListing.title}</h3>
                <p className="text-xs text-gray-500">{selectedListing.address}</p>
              </div>
              <div className="text-2xl font-bold text-[#F15A22]">{selectedListing.price}</div>
            </div>

            {/* Sprint 3.1: Promoted Proptii Module */}
            <div className="my-6">
              <ProptiiModule
                propertyTitle={selectedListing.title}
                propertyAddress={selectedListing.address}
                isFlagged={selectedListing.isFlagged}
                isUnresolved={selectedListing.isUnresolved}
                currentAudience={activeAudience}
                onOpenReport={() => {
                  setIsDetailModalOpen(false);
                  handleInitiateReportGeneration(selectedListing);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Auth Gating Modal (If user is not signed in) */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Audience Perspective Selector Modal */}
      <AudienceSelectorModal
        isOpen={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        onSelectAudience={handleAudienceChosen}
        propertyTitle={selectedListing?.title}
      />

      {/* Sprint 3.2: Report Diagnostic Screen */}
      {isDiagnosticRunning && selectedListing && (
        <ReportDiagnostic
          propertyTitle={selectedListing.title}
          audienceLens={activeAudience}
          onComplete={handleDiagnosticComplete}
          onCancel={() => setIsDiagnosticRunning(false)}
        />
      )}

      {/* Sprint 3.2: Proptii Report Modal */}
      {isReportModalOpen && selectedListing && (
        <ProptiiReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          propertyTitle={selectedListing.title}
          propertyAddress={selectedListing.address}
          price={selectedListing.price}
          initialAudience={activeAudience}
          isFlagged={selectedListing.isFlagged}
          isUnresolved={selectedListing.isUnresolved}
          onOpenFactsExport={() => setIsFactsExportOpen(true)}
          onOpenDisclosureExport={() => setIsDisclosureExportOpen(true)}
        />
      )}

      {/* Sprint 3.3: Facts-Only Export Modal */}
      {isFactsExportOpen && selectedListing && (
        <FactsOnlyExportModal
          isOpen={isFactsExportOpen}
          onClose={() => setIsFactsExportOpen(false)}
          propertyTitle={selectedListing.title}
          propertyAddress={selectedListing.address}
          price={selectedListing.price}
          isFlagged={selectedListing.isFlagged}
          isUnresolved={selectedListing.isUnresolved}
        />
      )}

      {/* Sprint 3.3: Disclosure Record Modal */}
      {isDisclosureExportOpen && selectedListing && (
        <DisclosureRecordModal
          isOpen={isDisclosureExportOpen}
          onClose={() => setIsDisclosureExportOpen(false)}
          propertyTitle={selectedListing.title}
          propertyAddress={selectedListing.address}
          price={selectedListing.price}
          isFlagged={selectedListing.isFlagged}
          isUnresolved={selectedListing.isUnresolved}
        />
      )}

      <FAQSection />
      <Footer />
    </div>
  );
};

export default Home;