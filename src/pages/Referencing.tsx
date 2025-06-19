import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ReferencingModal from '../components/ReferencingModal';
import DocumentChecklistModal from '../components/DocumentChecklistModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Pagination, Navigation } from "swiper/modules";

// Custom styles for Swiper
const swiperStyles = `
  .swiper-container .swiper-pagination-bullet {
    background-color: #58B2E8;
    opacity: 0.5;
  }
  
  .swiper-container .swiper-pagination-bullet-active {
    background-color: #58B2E8;
    opacity: 1;
  }
  
  .swiper-container .swiper-button-next,
  .swiper-container .swiper-button-prev {
    color: #58B2E8;
    width: 24px;
    height: 24px;
  }
  
  .swiper-container .swiper-button-next:after,
  .swiper-container .swiper-button-prev:after {
    font-size: 18px;
  }
  
  @media (max-width: 768px) {
    .swiper-container .swiper-button-next,
    .swiper-container .swiper-button-prev {
      display: none;
    }
  }
`;

// Add preload link for the hero image
const heroImageUrl = '/images/pablo-merchan-montes-wYOPqmtDD0w-unsplash.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const Referencing = () => {
  const { isAuthenticated, login } = useAuth();
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = swiperStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      // Redirect to login or trigger login modal
      login();
      return;
    }

    const shouldSkipChecklist = localStorage.getItem('skipDocumentChecklist') === 'true';
    if (shouldSkipChecklist) {
      setIsReferencingModalOpen(true);
    } else {
      setIsChecklistModalOpen(true);
    }
  };

  const handleChecklistComplete = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsReferencingModalOpen(true);
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section - always visible regardless of authentication status */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Family enjoying dinner together"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 text-center w-full">
          {/* Main Heading */}
          <h3 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight text-white">
            Verify Your Identity,<br />
            Funds, and Rental History
          </h3>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white">
            Ensure peace of mind for both landlords and tenants.
            Our rigorous referencing process verifies renter's
            identity, financial status, and rental history
          </p>

          <button
            onClick={handleGetStarted}
            className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
          >
            {isAuthenticated ? 'Start Referencing' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Steps Section */}
      <section className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24 px-4 md:px-8 min-h-[600px] flex items-center justify-center" style={{ backgroundImage: "url('/images/Referencing.png')" }}>
        {/* Container with spacing */}
        <div className="relative container mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl">
          {/* Left Section - Text Content */}
          <div className="w-full md:w-1/2 space-y-6 md:space-y-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-[#136C9E] leading-tight">
              All your referencing, sorted in one place
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              No more chasing employers or guarantors. Our platform collects your details, reaches out to your referees,
              and shares the full package with agents—fast and securely.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-orange-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg">
              Get started
            </button>
          </div>

          {/* Right Section - Swiper Carousel */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="w-full max-w-sm md:max-w-md">
              <Swiper
                modules={[Pagination, Navigation]}
                pagination={{
                  clickable: true,
                  dynamicBullets: true
                }}
                navigation={!isMobile}
                spaceBetween={20}
                slidesPerView={1}
                className="w-full swiper-container"
              >
                {/* Slide 1 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img
                        src="/images/1-Review.png"
                        alt="icon"
                        className="h-16 w-16 md:h-20 md:w-20"
                        loading="lazy"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">01. Review the Document Checklist</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      Ensure you have all the required documents organized and ready for submission.
                    </p>
                  </div>
                </SwiperSlide>

                {/* Slide 2 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img
                        src="/images/2-Upload.png"
                        alt="icon"
                        className="h-16 w-16 md:h-20 md:w-20"
                        loading="lazy"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">02. Fill the Forms</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      Fill in the forms with your details and upload the required documents.
                    </p>
                  </div>
                </SwiperSlide>

                {/* Slide 3 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img
                        src="/images/3-Respond.png"
                        alt="icon"
                        className="h-16 w-16 md:h-20 md:w-20"
                        loading="lazy"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">03. Respond to Any Follow-Ups</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      After submitting the forms, you will receive a notification on your dashboard.
                    </p>
                  </div>
                </SwiperSlide>

                {/* Slide 4 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img
                        src="/images/4-Receive.png"
                        alt="icon"
                        className="h-16 w-16 md:h-20 md:w-20"
                        loading="lazy"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">04. Receive Feedback</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      The agent or landlord will be in touch with you with feedback and next steps.
                    </p>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <Footer />

      {/* Document Checklist Modal */}
      <DocumentChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onGetStarted={handleChecklistComplete}
      />

      {/* Referencing Modal */}
      <ReferencingModal
        isOpen={isReferencingModalOpen}
        onClose={() => setIsReferencingModalOpen(false)}
      />
    </div>
  );
};

export default Referencing; 
