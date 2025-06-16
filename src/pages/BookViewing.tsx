import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import BookViewingModal from '../components/viewings/BookViewingModal';
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

const BookViewing = () => {
  const { isAuthenticated, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section - always visible regardless of authentication status */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Family enjoying dinner together"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center w-full">
          {/* Main Heading */}
          <h3 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight text-white">
            Skip the Hassle and Book Property<br />
            Viewings with Proptii AI
          </h3>


          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white">
            We make finding and securing your home easy,every step of the way,
          </p>

          <button
            onClick={handleGetStarted}
            className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
          >
            {isAuthenticated ? 'Start booking viewings' : 'Get Started'}
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
              Property viewings made easy.
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              Simply share the listing link and your preferred date and time—our AI takes it from there. We'll contact the agent and confirm your appointment, so you can focus on finding the right home.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-orange-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg">
              {isAuthenticated ? 'Start booking viewings' : 'Get Started'}
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
                      <img src="/images/BV 1.png" alt="icon" className="h-16 w-16 md:h-20 md:w-20" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">01. Input the Property Details</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      Input the details of the property you intend to view as well as the details of the agent.
                    </p>
                  </div>
                </SwiperSlide>

                {/* Slide 2 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img src="/images/BV 3.png" alt="icon" className="h-16 w-16 md:h-20 md:w-20" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">02. Confirm your Booking Details</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      Please go through all the inputed information to ensure their accuracy.
                    </p>
                  </div>
                </SwiperSlide>

                {/* Slide 3 */}
                <SwiperSlide>
                  <div className="bg-[#136C9E] text-white py-8 md:py-10 px-4 md:px-6 rounded-3xl text-center shadow-lg mx-2">
                    <div className="bg-white p-1 rounded-lg inline-block mb-8 md:mb-12">
                      <img src="/images/BV 4.png" alt="icon" className="h-16 w-16 md:h-20 md:w-20" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">03. Await your Booking Summary</h3>
                    <p className="text-gray-100 text-sm md:text-base mb-4 md:mb-6">
                      Summary of the booking will be sent to your email and to the agent who will confirm your appointemnt.
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

      <BookViewingModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default BookViewing;