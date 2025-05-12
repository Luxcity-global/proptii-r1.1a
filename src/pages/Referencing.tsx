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
    //if (isAuthenticated) {
      setIsModalOpen(true);
    //} else {
    //  login();
    //}
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
      <section className="relative bg-cover bg-center bg-no-repeat py-24 px-8 min-h-[600px] flex items-center justify-center" style={{ backgroundImage: "url('/public/images/Referencing.png')" }}>
      {/* Container with spacing */}
      <div className="relative container mx-auto flex flex-col md:flex-row items-center gap-12 lg:px-32">
        {/* Left Section - Text Content */}
        <div className="md:w-1/2 space-y-10 md:text-left md:mr-12">
          <h2 className="text-3xl font-bold text-[#136C9E] leading-tight">
            Steps for referencing
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Once successfully verified, users are issued a digital “Rent Passport,” 
            a secure badge of trustworthiness. This streamlined process fosters trust 
            and confidence in every property transaction.
          </p>
          <button 
          onClick={handleGetStarted}
          className="bg-orange-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg">
          Get started
          </button>

        </div>

        {/* Right Section - Swiper Carousel */}
<div className="md:w-2/5 flex justify-center">
  <Swiper
    modules={[Pagination, Navigation]}
    pagination={{ clickable: true }}
    navigation
    spaceBetween={20} /* Increase spacing for better layout */
    slidesPerView={1}
    className="w-full max-w-md"
    style={{
      "--swiper-navigation-color": "#58B2E8", // Lighter color for better contrast
      "--swiper-pagination-color": "#58B2E8",
      "--swiper-navigation-size": "24px" // Reduce navigation icon size
    }}
  >
    {/* Slide 1 */}
    <SwiperSlide>
      <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
        <div className="bg-white p-1 rounded-lg inline-block mb-12">
          <img src="/images/1-Review.png" alt="icon" className="h-20 w-20"/>
        </div>
        <h3 className="text-lg font-semibold mb-4">01. Review the Document Checklist</h3>
        <p className="text-gray-100 mb-6">
          Ensure you have all the required documents organized and ready for submission.
        </p>
      </div>
    </SwiperSlide>

    {/* Slide 2 */}
    <SwiperSlide>
      <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
        <div className="bg-white p-1 rounded-lg inline-block mb-12">
          <img src="/images/2-Upload.png" alt="icon" className="h-20 w-20"/>
        </div>
        <h3 className="text-lg font-semibold mb-4">02. Upload Your Documents</h3>
        <p className="text-gray-100 mb-6">
          Ensure you have all the required documents organized and ready for submission.
        </p>
      </div>
    </SwiperSlide>

    {/* Slide 3 */}
    <SwiperSlide>
      <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
        <div className="bg-white p-1 rounded-lg inline-block mb-12">
          <img src="/images/3-Respond.png" alt="icon" className="h-20 w-20"/>
        </div>
        <h3 className="text-lg font-semibold mb-4">03. Respond to Any Follow-Ups</h3>
        <p className="text-gray-100 mb-6">
          Ensure you have all the required documents organized and ready for submission.
        </p>
      </div>
    </SwiperSlide>

    {/* Slide 4 */}
    <SwiperSlide>
      <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
        <div className="bg-white p-1 rounded-lg inline-block mb-12">
          <img src="/images/4-Receive.png" alt="icon" className="h-20 w-20"/>
        </div>
        <h3 className="text-lg font-semibold mb-4">04. Receive Feedback</h3>
        <p className="text-gray-100 mb-6">
          Ensure you have all the required documents organized and ready for submission.
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
