import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import ErrorBoundary from '../components/ErrorBoundary';
import RefereeGuarantorResponseModal from '../components/referencing/RefereeGuarantorResponseModal';
import { Marquee } from '../components/magic-ui/marquee';
import { MagicCard } from '../components/magic-ui/magic-card';
import { TextAnimate } from '../components/magic-ui/text-animate';

import { useState, useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInputHeight, setSearchInputHeight] = useState(50);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseType, setResponseType] = useState<'referee' | 'guarantor'>('referee');
  const [applicantName, setApplicantName] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [userType, setUserType] = useState('Tenant');
  const [isExpanded, setIsExpanded] = useState(false);

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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionClick = (option: string) => {
    setUserType(option);
    setIsExpanded(false);
    
    if (option === 'Agent') {
      navigate('/Agent');
    } else if (option === 'Homeowner') {
      navigate('/Homeowner');
    }
    // Tenant stays on home page, no navigation needed
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
            fetchpriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0">
          {/* User Type Selection */}
          <div className="mt-16 md:mt-20 mb-8 md:mb-12 flex justify-center">
            <div className="group relative inline-block">
              {/* Main container - expands symmetrically */}
              <div 
                className={`relative rounded-full border-2 border-white bg-black/40 text-white font-semibold text-sm md:text-base cursor-pointer outline-none focus:ring-2 focus:ring-[#8FCDFF] focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-500 ease-out flex items-center ${
                  isExpanded ? 'px-4 md:px-3' : 'pl-6 pr-4 md:pl-8 md:pr-6'
                } py-3`}
                style={{
                  width: isExpanded ? 'auto' : 'auto',
                  minWidth: isExpanded ? '400px' : 'auto',
                  transformOrigin: 'center'
                }}
                onClick={toggleExpanded}
              >
                {isExpanded ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionClick('Tenant');
                      }}
                      className={`px-4 md:px-6 py-2 transition-colors duration-300 ease-out h-full flex items-center ${
                        userType === 'Tenant' 
                          ? 'bg-[#DC5F12] text-white rounded-full' 
                          : 'hover:text-[#DC5F12] rounded-l-full'
                      }`}
                    >
                      Tenant
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionClick('Agent');
                      }}
                      className={`px-4 md:px-6 py-2 transition-colors duration-300 ease-out h-full flex items-center ${
                        userType === 'Agent' 
                          ? 'bg-[#DC5F12] text-white rounded-full' 
                          : 'hover:text-[#DC5F12]'
                      }`}
                    >
                      Agent/Landlord
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionClick('Homeowner');
                      }}
                      className={`px-4 md:px-6 py-2 transition-colors duration-300 ease-out h-full flex items-center ${
                        userType === 'Homeowner' 
                          ? 'bg-[#DC5F12] text-white rounded-full' 
                          : 'hover:text-[#DC5F12] rounded-r-full'
                      }`}
                    >
                      Home Owner
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                      }}
                      className="ml-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-500 ease-out flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4 text-white transition-all duration-500 ease-out"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: 'scaleX(-1)' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="hover:text-[#DC5F12] transition-colors duration-300 ease-out">{userType}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                      }}
                      className="ml-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-500 ease-out flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4 text-white transition-all duration-500 ease-out"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight">
            Find Your Dream Home
          </h3>

          {/* Subheading */}
          <TextAnimate
            className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4"
            by="word"
            animation="fadeIn"
            startOnView={true}
            once={true}
          >
            We make finding and securing your home easy, every step of the way.
          </TextAnimate>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto px-4 md:px-0">
            <SearchInput
              onHeightChange={handleSearchInputHeightChange}
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
            <MagicCard className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
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
            </MagicCard>

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

      {/* Marquee Section - Testimonials */}
      <section className="py-16 bg-white overflow-hidden">
        {/* First Marquee - Moving Left */}
        <Marquee pauseOnHover className="[--duration:40s] mb-4">
          {[
            { name: "Jill", handle: "@jill", text: "I don't know what to say. I'm speechless. This is amazing.", gradient: "from-purple-500 to-blue-600" },
            { name: "John", handle: "@john", text: "I'm at a loss for words. This is amazing. I love it.", gradient: "from-yellow-400 to-green-500" },
            { name: "Jane", handle: "@jane", text: "I'm at a loss for words. This is amazing. I love it.", gradient: "from-pink-400 to-orange-400" },
            { name: "Jenny", handle: "@jenny", text: "I'm at a loss for words. This is amazing. I love it.", gradient: "from-orange-500 to-green-500" },
            { name: "James", handle: "@james", text: "I'm at a loss for words. This is amazing. I love it.", gradient: "from-blue-400 to-green-400" },
            { name: "Sarah", handle: "@sarah", text: "This platform has made finding a home so much easier!", gradient: "from-purple-400 to-pink-500" },
            { name: "Mike", handle: "@mike", text: "The referencing process was smooth and quick. Highly recommend!", gradient: "from-blue-500 to-cyan-500" },
          ].map((testimonial, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[350px] mx-3 bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.gradient} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{testimonial.name}</h4>
                    <span className="text-gray-500 text-sm">{testimonial.handle}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{testimonial.text}</p>
                </div>
              </div>
            </div>
          ))}
        </Marquee>

        {/* Second Marquee - Moving Right (Reversed) */}
        <Marquee pauseOnHover reverse className="[--duration:35s]">
          {[
            { name: "Emma", handle: "@emma", text: "The contract signing was seamless. Great experience!", gradient: "from-indigo-500 to-purple-600" },
            { name: "David", handle: "@david", text: "Best property platform I've used. Everything in one place!", gradient: "from-red-400 to-pink-500" },
            { name: "Lisa", handle: "@lisa", text: "Found my perfect home in just a week. Amazing service!", gradient: "from-teal-400 to-blue-500" },
            { name: "Tom", handle: "@tom", text: "The booking system is so convenient. Love it!", gradient: "from-amber-400 to-orange-500" },
            { name: "Anna", handle: "@anna", text: "Professional, fast, and reliable. Couldn't ask for more!", gradient: "from-violet-500 to-purple-600" },
            { name: "Chris", handle: "@chris", text: "Made my move so much easier. Thank you Proptii!", gradient: "from-emerald-400 to-teal-500" },
            { name: "Maria", handle: "@maria", text: "The referencing was quick and the team was helpful.", gradient: "from-rose-400 to-pink-500" },
          ].map((testimonial, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[350px] mx-3 bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.gradient} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{testimonial.name}</h4>
                    <span className="text-gray-500 text-sm">{testimonial.handle}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{testimonial.text}</p>
                </div>
              </div>
            </div>
          ))}
        </Marquee>
      </section>

      <FAQSection />
      <Footer />

    </div>
  );
};

export default Home;