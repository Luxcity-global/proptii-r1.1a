import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import RefereeGuarantorResponseModal from '../components/referencing/RefereeGuarantorResponseModal';
import { useAuth } from '../contexts/AuthContext';
import { hasOnboardingCompleted, HOMEPAGE_ONBOARDING_FLOW_ENABLED } from '../utils/onboardingSession';
import { useState, useEffect } from 'react';

/**
 * Archived original home page. Reachable at /home-legacy and via /?variant=legacy.
 * Kept for rollback; see docs/r1.1-improvement/V201_landingpage-fixes/0123-new-home-screen-design.md
 */
const HomeLegacy = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, login, user } = useAuth();
  const userName = user?.name ?? user?.email ?? undefined;
  // Archived: flip HOMEPAGE_ONBOARDING_FLOW_ENABLED to restore mascot startup
  const showOnboarding =
    HOMEPAGE_ONBOARDING_FLOW_ENABLED && !isAuthenticated && !hasOnboardingCompleted();

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

  const [heroGuideStepIndex, setHeroGuideStepIndex] = useState(0);
  const [, setOnboardingRefresh] = useState(0);

  const tenantSearchDemoActive = searchParams.get('tenantSearchDemo') === '1';
  const showHeroGuide = tenantSearchDemoActive && !showOnboarding && !isAuthenticated;

  const HERO_TENANT_SEARCH_STEPS = [
    {
      id: 1,
      message: "Here's your search box. You can input your search terms here.",
      targetSelector: '[data-demo-hero-search-input]'
    },
    {
      id: 2,
      message: 'Click here to change where Proptii searches.',
      targetSelector: '[data-demo-hero-provider-toggle]'
    },
    {
      id: 3,
      message: 'When you are ready, click here to search.',
      targetSelector: '[data-demo-hero-search-button]'
    }
  ] as const;

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

  const handleAgentToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated. Prompting login...');
      try {
        await login();
        // After successful login, navigate to Agent page
        navigate('/Agent');
      } catch (error) {
        console.error('Login failed:', error);
        // User cancelled or login failed, stay on current page
      }
    } else {
      // User is already authenticated, navigate directly
      navigate('/Agent');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-nunito">
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
            fetchPriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0">
          {/* User Type Selection */}
          <div className="mt-16 md:mt-20 mb-8 md:mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <button className="px-6 md:px-8 py-3 rounded-full bg-primary text-white font-semibold transition-all text-sm md:text-base">
                Tenant
              </button>
              <button
                onClick={handleAgentToggle}
                className="px-6 md:px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all text-sm md:text-base"
              >
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight">
            Find Your Dream Home
          </h3>

          {/* Subheading */}
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4">
            We make finding and securing your home easy, every step of the way.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto px-4 md:px-0">
            <SearchInput
              onHeightChange={handleSearchInputHeightChange}
              value={prefilledSearchQuery}
              initialSearchType={prefilledSearchType}
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

      <FAQSection />
      <Footer />

    </div>
  );
};

export default HomeLegacy;
