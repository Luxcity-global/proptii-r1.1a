import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SearchInput } from '../components/SearchInput';
import { RiskBadge } from '../components/badges/RiskBadge';
import { ProptiiModule } from '../components/proptii/ProptiiModule';
import { ReportDiagnostic } from '../components/report/ReportDiagnostic';
import { ProptiiReportModal } from '../components/report/ProptiiReportModal';
import { AudienceSelectorModal } from '../components/report/AudienceSelectorModal';
import { AuthPromptModal } from '../components/auth/AuthPromptModal';
import { FactsOnlyExportModal } from '../components/export/FactsOnlyExportModal';
import { DisclosureRecordModal } from '../components/export/DisclosureRecordModal';
import { AudienceLens } from '../data/audienceLensCopy';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  BedDouble,
  Building2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Bath,
  ChevronRight,
  X
} from 'lucide-react';

interface MockProperty {
  id: string;
  title: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  type: string;
  image: string;
  images: string[];
  isFlagged: boolean;
  isUnresolved: boolean;
  isUnmatched?: boolean;
  description: string;
  features: string[];
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
}

export const SearchResults: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawQuery = searchParams.get('q') || '2-bed flat near Clapham Junction';

  const [searchQuery, setSearchQuery] = useState(rawQuery);
  const [activeAudience, setActiveAudience] = useState<AudienceLens>('tenant');
  
  // Modals & Gated Intelligence States
  const [selectedProperty, setSelectedProperty] = useState<MockProperty | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFactsExportOpen, setIsFactsExportOpen] = useState(false);
  const [isDisclosureExportOpen, setIsDisclosureExportOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Comprehensive mock listing dataset demonstrating all 3 flag states
  const allProperties: MockProperty[] = [
    {
      id: 'prop-1',
      title: 'Modern 2-Bed Luxury Apartment with Balcony',
      address: 'Falcon Road, Clapham Junction, London SW11 2LN',
      price: '£2,150 pcm',
      bedrooms: 2,
      bathrooms: 2,
      type: 'Flat / Apartment',
      image: '/images/viewing-room.jpg',
      images: ['/images/viewing-room.jpg', '/images/modern-building.jpg', '/images/listings/property-main.jpg'],
      isFlagged: false,
      isUnresolved: false,
      description: 'A stunning two-bedroom modern apartment located moments from Clapham Junction station. Features open plan living, high spec kitchen, and private balcony.',
      features: ['Private Balcony', '24/7 Concierge', 'Moments from Station', 'Lift Access', 'Fibre Broadband'],
      agent: {
        name: 'Sarah Jenkins',
        company: 'Proptii Premier Lettings',
        phone: '020 7946 0192',
        email: 'sarah.jenkins@proptii.com'
      }
    },
    {
      id: 'prop-2',
      title: 'Spacious Victorian Conversion Flat',
      address: 'Lavender Hill, Battersea / Clapham, London SW11 5QW',
      price: '£1,950 pcm',
      bedrooms: 2,
      bathrooms: 1,
      type: 'Converted Flat',
      image: '/images/modern-building.jpg',
      images: ['/images/modern-building.jpg', '/images/viewing-room.jpg', '/images/listings/property-main.jpg'],
      isFlagged: true, // Demonstrates Flagged Covenant & EPC Advisory
      isUnresolved: false,
      description: 'Charming Victorian conversion flat with high ceilings and sash windows. Note: HM Land Registry records historic pet and exterior modification covenants.',
      features: ['Period Features', 'High Ceilings', 'Close to Northcote Road', 'Shared Garden'],
      agent: {
        name: 'David Miller',
        company: 'Battersea Property Partners',
        phone: '020 7946 0481',
        email: 'david@batterseapartners.co.uk'
      }
    },
    {
      id: 'prop-3',
      title: 'Contemporary Studio Apartment',
      address: 'St Johns Hill, Clapham Junction, London SW11 1TY',
      price: '£1,450 pcm',
      bedrooms: 1,
      bathrooms: 1,
      type: 'Studio Apartment',
      image: '/images/listings/property-main.jpg',
      images: ['/images/listings/property-main.jpg', '/images/viewing-room.jpg'],
      isFlagged: false,
      isUnresolved: true, // Demonstrates Unresolved Plain Truth state
      description: 'Bright and airy contemporary studio flat ideal for single professionals. Digital title deed lookup is currently pending manual extraction.',
      features: ['Modern Fitted Kitchen', 'Wood Flooring', 'Close to Amenities', 'Secure Entry'],
      agent: {
        name: 'Emma Watson',
        company: 'Junction Estates',
        phone: '020 7946 0839',
        email: 'emma@junctionestates.com'
      }
    },
    {
      id: 'prop-4',
      title: '3-Bedroom Townhouse with Garden',
      address: 'Battersea Rise, Clapham, London SW11 1HG',
      price: '£2,850 pcm',
      bedrooms: 3,
      bathrooms: 2,
      type: 'Terraced House',
      image: '/images/referencing-person.jpg',
      images: ['/images/referencing-person.jpg', '/images/viewing-room.jpg'],
      isFlagged: false,
      isUnresolved: false,
      isUnmatched: false,
      description: 'Superb 3-bedroom family townhouse with private landscaped garden and off-street parking. Fully verified title and EPC Band B.',
      features: ['Private Landscaped Garden', 'Off-Street Parking', 'Modern Energy Efficient Heating', 'Near Good Schools'],
      agent: {
        name: 'Marcus Thorne',
        company: 'Clapham Prime Properties',
        phone: '020 7946 0372',
        email: 'marcus@claphamprime.com'
      }
    }
  ];

  // Gated Report Generation Flow
  const handleInitiateReportGeneration = (property: MockProperty) => {
    setSelectedProperty(property);
    if (!isAuthenticated) {
      // Step 1: Prompt Sign in / Sign up
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

  const handleSearchSubmit = (newQuery: string) => {
    setSearchQuery(newQuery);
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-nunito flex flex-col justify-between">
      <Navbar />

      {/* Top Banner Search Area */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-28 pb-10 px-4 text-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-white/70">
            <Link to="/" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span>/</span>
            <span className="text-[#F15A22]">Search Properties</span>
          </div>

          <div className="mb-4">
            <SearchInput
              value={searchQuery}
              onSearch={handleSearchSubmit}
              onChange={(q) => setSearchQuery(q)}
            />
          </div>

        </div>
      </section>

      {/* Main Results View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-archivo">
              Search Results
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Showing {allProperties.length} verified listings matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
              onClick={() => {
                setSelectedProperty(property);
                setIsDetailModalOpen(true);
              }}
            >
              <div>
                {/* Property Image & Price */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-[#F15A22] text-white px-3.5 py-1 rounded-full font-bold text-xs shadow-md">
                    {property.price}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                    {property.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-base mb-1.5 font-archivo line-clamp-1 group-hover:text-[#136C9E] transition-colors">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{property.address}</span>
                  </div>

                  {/* Sprint 2.2: 3-State Risk Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <RiskBadge
                      flagType="restrictive_covenant"
                      state={property.isUnresolved ? 'unresolved' : property.isFlagged ? 'flagged' : 'clear'}
                      audienceLens={activeAudience}
                      size="sm"
                      onOpenReport={() => handleInitiateReportGeneration(property)}
                    />
                    <RiskBadge
                      flagType="epc_context"
                      state={property.isUnresolved ? 'unresolved' : property.isFlagged ? 'flagged' : 'clear'}
                      audienceLens={activeAudience}
                      size="sm"
                      onOpenReport={() => handleInitiateReportGeneration(property)}
                    />
                  </div>

                  {/* Meta Specs */}
                  <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                        {property.bedrooms} Beds
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-gray-400" />
                        {property.bathrooms} Bath
                      </span>
                    </div>
                    <span className="text-[#136C9E] font-bold group-hover:underline flex items-center gap-0.5">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="px-6 pb-6 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInitiateReportGeneration(property);
                  }}
                  className="w-full py-2 rounded-full bg-blue-50 hover:bg-[#136C9E] text-[#136C9E] hover:text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Proptii Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Property Details Modal with Embedded Sprint 3.1 Proptii Module */}
      {isDetailModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={selectedProperty.image}
              alt={selectedProperty.title}
              className="w-full h-64 object-cover rounded-2xl mb-6"
            />

            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold font-archivo text-gray-900">{selectedProperty.title}</h3>
                <p className="text-xs text-gray-500">{selectedProperty.address}</p>
              </div>
              <div className="text-2xl font-bold text-[#F15A22]">{selectedProperty.price}</div>
            </div>

            {/* Sprint 3.1: Promoted Proptii Module */}
            <div className="my-6">
              <ProptiiModule
                propertyTitle={selectedProperty.title}
                propertyAddress={selectedProperty.address}
                isFlagged={selectedProperty.isFlagged}
                isUnresolved={selectedProperty.isUnresolved}
                currentAudience={activeAudience}
                onOpenReport={() => {
                  setIsDetailModalOpen(false);
                  handleInitiateReportGeneration(selectedProperty);
                }}
              />
            </div>

            {/* Description & Features */}
            <div className="space-y-4 text-xs text-gray-700">
              <p className="leading-relaxed">{selectedProperty.description}</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="font-bold text-gray-900 mb-2">Key Features:</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProperty.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
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
        propertyTitle={selectedProperty?.title}
      />

      {/* Sprint 3.2: Report Diagnostic Screen */}
      {isDiagnosticRunning && selectedProperty && (
        <ReportDiagnostic
          propertyTitle={selectedProperty.title}
          audienceLens={activeAudience}
          onComplete={() => {
            setIsDiagnosticRunning(false);
            setIsReportModalOpen(true);
          }}
          onCancel={() => setIsDiagnosticRunning(false)}
        />
      )}

      {/* Sprint 3.2: Proptii Report Modal */}
      {isReportModalOpen && selectedProperty && (
        <ProptiiReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          propertyTitle={selectedProperty.title}
          propertyAddress={selectedProperty.address}
          price={selectedProperty.price}
          initialAudience={activeAudience}
          isFlagged={selectedProperty.isFlagged}
          isUnresolved={selectedProperty.isUnresolved}
          onOpenFactsExport={() => setIsFactsExportOpen(true)}
          onOpenDisclosureExport={() => setIsDisclosureExportOpen(true)}
        />
      )}

      {/* Sprint 3.3: Facts-Only Export Modal */}
      {isFactsExportOpen && selectedProperty && (
        <FactsOnlyExportModal
          isOpen={isFactsExportOpen}
          onClose={() => setIsFactsExportOpen(false)}
          propertyTitle={selectedProperty.title}
          propertyAddress={selectedProperty.address}
          price={selectedProperty.price}
          isFlagged={selectedProperty.isFlagged}
          isUnresolved={selectedProperty.isUnresolved}
        />
      )}

      {/* Sprint 3.3: Disclosure Record Modal */}
      {isDisclosureExportOpen && selectedProperty && (
        <DisclosureRecordModal
          isOpen={isDisclosureExportOpen}
          onClose={() => setIsDisclosureExportOpen(false)}
          propertyTitle={selectedProperty.title}
          propertyAddress={selectedProperty.address}
          price={selectedProperty.price}
          isFlagged={selectedProperty.isFlagged}
          isUnresolved={selectedProperty.isUnresolved}
        />
      )}

      <Footer />
    </div>
  );
};

export default SearchResults;
