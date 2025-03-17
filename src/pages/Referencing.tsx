import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ReferencingModal from '../components/ReferencingModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Pagination, Navigation } from "swiper/modules";


const Referencing = () => {
  const { isAuthenticated, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setIsModalOpen(true);
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />
      
      {/* Hero Section - always visible regardless of authentication status */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/pablo-merchan-montes-wYOPqmtDD0w-unsplash.jpg" 
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
            Verify Your Identity,<br />
            Funds, and Rental History
          </h3>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white">
            Ensure peace of mind for both landlords and tenants.
            Our rigorous referencing process verifies renter or buyer
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
      <section className="relative bg-cover bg-center bg-no-repeat py-16 px-6 min-h-[500px]" style={{ backgroundImage: "url('/public/images/Referencing.png')" }}>
      {/* Container with spacing */}
      <div className="relative container mx-auto flex flex-col md:flex-row items-center justify-center justify-between gap-10 md:gap-16 lg:px-20 ">
        {/* Left Section - Text Content */}
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-3xl font-bold text-blue-700 leading-tight">
            Steps for referencing
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Once successfully verified, users are issued a digital “Rent Passport,” 
            a secure badge of trustworthiness. This streamlined process fosters trust 
            and confidence in every property transaction.
          </p>
          <button className="bg-orange-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg">
          Get started
          </button>

        </div>

        {/* Right Section - Swiper Carousel */}
        <div className="md:w-1/2">
          <Swiper
            modules={[Pagination, Navigation]}
            pagination={{ clickable: true }}
            navigation
            spaceBetween={30} /* Increase spacing for better layout */
            slidesPerView={1}
            className="w-full max-w-lg"
          >
            {/* Slide 1 */}
            <SwiperSlide>
            <div className="bg-blue-700 text-white p-6 rounded-3xl text-center shadow-lg">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src="/icon.png" alt="icon" className="h-10 w-10"/>
                </div>
                <h3 className="text-lg font-semibold">01. Review the Document Checklist</h3>
                <p className="mt-2 text-gray-100">
                  Ensure you have all the required documents organized and ready for submission.
                </p>
              </div>
            </SwiperSlide>

            {/* Slide 2 */}
            <SwiperSlide>
            <div className="bg-blue-700 text-white p-6 rounded-3xl text-center shadow-lg">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src="/icon.png" alt="icon" className="h-10 w-10"/>
                </div>
                <h3 className="text-lg font-semibold">02. Submit Your Application</h3>
                <p className="mt-2 text-gray-100">
                  Upload and submit your documents securely through our platform.
                </p>
              </div>
            </SwiperSlide>

            {/* Slide 3 */}
            <SwiperSlide>
            <div className="bg-blue-700 text-white p-6 rounded-3xl text-center shadow-lg">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src="/icon.png" alt="icon" className="h-10 w-10"/>
                </div>
                <h3 className="text-lg font-semibold">03. Verification Process</h3>
                <p className="mt-2 text-gray-100">
                  Our team will review and verify your documents promptly.
                </p>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>



      <FAQSection />
      <Footer />
      
      {/* Referencing Modal */}
      <ReferencingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Referencing; 