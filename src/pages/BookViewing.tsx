import React, { useState } from 'react';
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


const BookViewing = () => {
  const { isAuthenticated, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGetStarted = () => {
    // Commenting out authentication check for now
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
      <section className="relative bg-cover bg-center bg-no-repeat py-24 px-8 min-h-[600px] flex items-center justify-center" style={{ backgroundImage: "url('/public/images/Referencing.png')" }}>
      {/* Container with spacing */}
      <div className="relative container mx-auto flex flex-col md:flex-row items-center gap-12 lg:px-32">
        {/* Left Section - Text Content */}
        <div className="md:w-1/2 space-y-10 md:text-left md:mr-12">
          <h2 className="text-3xl font-bold text-[#136C9E] leading-tight">
          Steps to book viewing
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
          Streamline Your Home Search Experience Dive into property details, schedule personalized viewings, and navigate your real estate journey with confidence.
          </p>
          <button className="bg-orange-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg">
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
                <img src="/images/BV 1.png" alt="icon" className="h-20 w-20"/>
              </div>
              <h3 className="text-lg font-semibold mb-4">01. Input Property Details</h3>
              <p className="text-gray-100 mb-6">
              Input your already searched property details.
              </p>
            </div>
          </SwiperSlide>

          {/* Slide 2 */}
          <SwiperSlide>
            <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
              <div className="bg-white p-1 rounded-lg inline-block mb-12">
                <img src="/images/BV 2.png" alt="icon" className="h-20 w-20"/>
              </div>
              <h3 className="text-lg font-semibold mb-4">02. Complete the form</h3>
              <p className="text-gray-100 mb-6">
              To proceed with your booking, fill the forms so we can assist you make the booking.
              </p>
            </div>
          </SwiperSlide>

          {/* Slide 3 */}
          <SwiperSlide>
            <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
              <div className="bg-white p-1 rounded-lg inline-block mb-12">
                <img src="/images/BV 3.png" alt="icon" className="h-20 w-20"/>
              </div>
              <h3 className="text-lg font-semibold mb-4">03. Confirm your Booking Details</h3>
              <p className="text-gray-100 mb-6">
              Proptii can make mistakes, Go through important information's to confirm details.
              </p>
            </div>
          </SwiperSlide>

          {/* Slide 4 */}
          <SwiperSlide>
            <div className="bg-[#136C9E] text-white py-10 px-6 rounded-3xl text-center shadow-lg">
              <div className="bg-white p-1 rounded-lg inline-block mb-12">
                <img src="/images/BV 4.png" alt="icon" className="h-20 w-20"/>
              </div>
              <h3 className="text-lg font-semibold mb-4">04. Await your Booking Confirmation</h3>
              <p className="text-gray-100 mb-6">
              Your booking confirmations and updates would br sent to your mail or as a text message.
              </p>
            </div>
          </SwiperSlide>
        </Swiper>
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