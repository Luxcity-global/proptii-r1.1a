import { Link } from 'react-router-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AgentNavbar from '../components/AgentNavbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import ErrorBoundary from '../components/ErrorBoundary';
import RefereeGuarantorResponseModal from '../components/referencing/RefereeGuarantorResponseModal';
import { RoleSelectionPopup } from '../components/RoleSelectionPopup';
import landlordUserService from '../services/landlordUserService';
import { useAuth } from '../contexts/AuthContext';

import { useState, useEffect } from 'react';

type UserRole = 'landlord' | 'agent';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, login, user } = useAuth();

  const [searchInputHeight, setSearchInputHeight] = useState(50);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseType, setResponseType] = useState<'referee' | 'guarantor'>('referee');
  const [applicantName, setApplicantName] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  
  // Agent mode state
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');

  // Allow other pages (e.g. Search Results) to send the user back to Home with their query prefilled
  const prefilledSearchQuery = searchParams.get('q') || '';
  const prefilledSearchType: 'onthemarket' | 'proptii' =
    searchParams.get('type') === 'proptii' ? 'proptii' : 'onthemarket';

  // Check for mode parameter (tenant or agent) from URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'agent') {
      setIsAgentMode(true);
      // Check if user is authenticated, if not, trigger login
      if (!isAuthenticated) {
        login().then(() => {
          setShowRolePopup(true);
        }).catch((error) => {
          console.error('Login failed:', error);
          // If login fails, switch back to tenant mode
          setIsAgentMode(false);
          setSearchParams({});
        });
      } else {
        setShowRolePopup(true);
      }
    }
  }, []);

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

  // useEffect(() => {
  //   const checkBackend = async () => {
  //     try {
  //       const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  //       // Remove /api from the end if it exists
  //       const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  //       const response = await fetch(`${baseUrl}/api/health`);
  //       setIsBackendAvailable(response.ok);
  //     } catch (error) {
  //       console.error('Backend health check failed:', error);
  //       setIsBackendAvailable(false);
  //     }
  //   };

  //   checkBackend();
  // }, []);

  // Progress bar component (simplified since loadingProgress is not available)
  // const ProgressBar = () => (
  //   <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-4">
  //     <div className="h-full bg-orange-500 transition-all duration-300 ease-out animate-pulse w-full" />
  //   </div>
  // );



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
        // After successful login, switch to agent mode and show role popup
        setIsAgentMode(true);
        setShowRolePopup(true);
        setSearchParams({ mode: 'agent' });
      } catch (error) {
        console.error('Login failed:', error);
        // User cancelled or login failed, stay on current page
      }
    } else {
      // User is already authenticated, switch to agent mode
      setIsAgentMode(true);
      setShowRolePopup(true);
      setSearchParams({ mode: 'agent' });
    }
  };

  const handleTenantToggle = () => {
    setIsAgentMode(false);
    setShowRolePopup(false);
    setSearchParams({});
  };

  const handleRoleSelected = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleRoleContinue = async (role: UserRole) => {
    setSelectedRole(role);
    setShowRolePopup(false);
    
    // Automatically register user if they have email
    const userEmail = user?.email || '';
    const userName = user?.name || '';
    
    if (userEmail && userName) {
      console.log('🔄 Auto-registering user as', role, ':', userEmail);
      
      try {
        // Check if already registered first
        const checkResult = await landlordUserService.isLandlordOrAgent(userEmail);
        
        if (checkResult.isLandlord) {
          console.log('✅ User already registered as', checkResult.user?.role);
          localStorage.setItem('landlordEmail', userEmail);
          return;
        }
        
        // Auto-register
        const result = await landlordUserService.registerLandlordUser({
          email: userEmail,
          name: userName,
          role: role,
          phone: user?.phone,
        });
        
        if (result.success) {
          console.log('✅ Auto-registered successfully:', result.userId);
          localStorage.setItem('landlordEmail', userEmail);
        } else {
          console.error('❌ Auto-registration failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error during auto-registration:', error);
      }
    } else {
      console.log('⚠️ No user email/name available for auto-registration');
    }
  };

  const handleCloseRolePopup = () => {
    setShowRolePopup(false);
    // Switch back to tenant mode
    setIsAgentMode(false);
    setSearchParams({});
  };

  const handleGoToDashboard = () => {
    localStorage.setItem('userRole', selectedRole);
    window.location.href = '/landlord/index.html';
  };

  const handleAddProperty = () => {
    if (selectedRole === 'agent') {
      localStorage.setItem('userRole', 'agent');
    }
    localStorage.setItem('startScreen', 'property-setup-step1');
    window.location.href = '/landlord/index.html?start=property-setup-step1';
  };

  const handleSetupProfile = () => {
    if (selectedRole === 'agent') {
      localStorage.setItem('userRole', 'agent');
    }
    localStorage.setItem('startScreen', 'company-profile-setup');
    window.location.href = '/landlord/index.html?start=company-profile-setup';
  };

  return (
    <div className="min-h-screen flex flex-col font-nunito">
      {isAgentMode ? <AgentNavbar isAgent={true} /> : <Navbar />}

      {/* Referee/Guarantor Response Modal */}
      <RefereeGuarantorResponseModal
        isOpen={isResponseModalOpen}
        onClose={handleCloseResponseModal}
        responseType={responseType}
        applicantName={applicantName}
        prefilledEmail={prefilledEmail}
        tenantEmail={tenantEmail}
      />

      {/* Role Selection Popup for Agent Mode */}
      {isAgentMode && (
        <RoleSelectionPopup 
          isOpen={showRolePopup} 
          onRoleSelected={handleRoleSelected}
          onContinue={handleRoleContinue}
          onClose={handleCloseRolePopup}
        />
      )}

      {/* Hero Section */}
      <section 
        className={`${isAgentMode ? 'h-[80vh]' : 'h-[95vh] pt-32 md:pt-0'} relative flex items-center z-10`}
        style={!isAgentMode ? { paddingBottom: `${getDynamicPadding()}px` } : {}}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={isAgentMode ? "/images/hero-agent-happy-couple.jpg" : "/images/01_Lady_Child_Family_BG.jpg"}
            alt={isAgentMode ? "Happy couple with agent" : "Hero background"}
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0">
          {/* User Type Selection */}
          <div className={`${isAgentMode ? 'mb-12' : 'mt-16 md:mt-20 mb-8 md:mb-12'}`}>
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <button 
                onClick={handleTenantToggle}
                className={`px-6 md:px-8 py-3 rounded-full font-semibold transition-all text-sm md:text-base ${
                  !isAgentMode 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tenant
              </button>
              <button
                onClick={handleAgentToggle}
                className={`px-6 md:px-8 py-3 rounded-full font-semibold transition-all text-sm md:text-base ${
                  isAgentMode 
                    ? 'bg-[#FFEFD4] text-black' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight">
            {isAgentMode ? 'List Your Properties' : 'Find Your Dream Home'}
          </h3>

          {/* Subheading */}
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4">
            {isAgentMode 
              ? 'Streamline your property listings and reach more potential tenants.' 
              : 'We make finding and securing your home easy, every step of the way.'}
          </p>

          {/* Search Bar (Tenant) or Dashboard Button (Agent) */}
          {!isAgentMode ? (
            <div className="max-w-3xl mx-auto px-4 md:px-0">
              <SearchInput
                onHeightChange={handleSearchInputHeightChange}
                value={prefilledSearchQuery}
                initialSearchType={prefilledSearchType}
              />
            </div>
          ) : (
            <button
              onClick={handleGoToDashboard}
              className="inline-block px-8 py-4 bg-[#FFEFD4] text-black rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              {selectedRole === 'landlord' ? 'Go to Landlord Dashboard' : 'Go to Agent Dashboard'}
            </button>
          )}
        </div>
      </section>



      {/**The services/action section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0] z-20">
        {/* Background Image (Blobs) */}
        <img
          src="/images/middle-section.png"
          alt={isAgentMode ? "Decorative background" : "Background design"}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover ${isAgentMode ? 'opacity-50' : ''}`}
        />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {isAgentMode && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#374957] mb-4">
                What would you like to do next?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose how you'd like to continue setting up your property management system. You can always access these options later from your&nbsp;dashboard.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {!isAgentMode ? (
              <>
                {/* Tenant View - Book Viewing Card */}
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
              </>
            ) : (
              <>
                {/* Agent View - Dashboard Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 md:p-10 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
                  <div>
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-[#EBF4FF] rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-[#3B82F6]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#374957] mb-4">Go to Dashboard</h3>
                    <p className="text-gray-600 mb-8">Explore your property management&nbsp;dashboard</p>
                  </div>
                  <button
                    onClick={handleGoToDashboard}
                    className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
                  >
                    View Dashboard
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Add Property Card (Recommended) */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-[#136C9E] p-8 md:p-10 text-center hover:shadow-xl transition-shadow relative min-h-[280px] flex flex-col justify-between">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#136C9E] text-white px-4 py-1 rounded-full text-sm font-medium">
                      Recommended
                    </span>
                  </div>
                  
                  <div>
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#374957] mb-4">Add a Property</h3>
                    <p className="text-gray-600 mb-8">Get started by adding a property to your&nbsp;portfolio</p>
                  </div>
                  <button
                    onClick={handleAddProperty}
                    className="bg-[#DC5F12] hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#f97316] hover:py-4 hover:shadow-2xl hover:shadow-[#DC5F12]/70 text-white px-8 py-3 rounded-full font-medium flex items-center justify-center mx-auto group transition-all duration-300"
                  >
                    Add Property
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Setup Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 md:p-10 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
                  <div>
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#374957] mb-4">
                      {selectedRole === 'agent' ? 'Setup Company Profile' : 'Setup Landlord Profile'}
                    </h3>
                    <p className="text-gray-600 mb-8">
                      {selectedRole === 'agent'
                        ? 'Add company details, logo, and professional\u00A0settings'
                        : 'Add your landlord details, contact info, and optional branding'}
                    </p>
                  </div>
                  <button
                    onClick={handleSetupProfile}
                    className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
                  >
                    {selectedRole === 'agent' ? 'Setup Company' : 'Setup Landlord'}
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {isAgentMode && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Don't worry - you can access all of these features anytime from your&nbsp;dashboard
              </p>
            </div>
          )}
        </div>
      </section>

      {/**End of the services/action section */}

      <FAQSection />
      <Footer />

    </div>
  );
};

export default Home;