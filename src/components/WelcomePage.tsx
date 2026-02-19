import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  onGetStarted: () => void;
  onClose?: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: '/images/feature1.png'
    },
    {
      id: 2,
      image: '/images/feature2.png'
    },
    {
      id: 3,
      image: '/images/feature3.png'
    },
    {
      id: 4,
      image: '/images/feature4.png'
    }
  ];

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
         {/* Close Button */}
         {onClose && (
           <button
             onClick={onClose}
             className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-none cursor-pointer flex items-center justify-center transition-all hover:bg-gray-200 hover:scale-110 z-10"
             aria-label="Close"
           >
             <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </button>
         )}
         {/* Header Section */}
         <div className="text-center mb-4 sm:mb-6 md:mb-8">
           {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#374957] mb-2 sm:mb-3 md:mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
             Welcome to Proptii
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#6B7280] max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2">
            The complete property management solution for modern landlords and agents. 
            Streamline your workflow, stay compliant, and grow your portfolio with confidence.
          </p>
        </div>

         {/* Modern Slideshow */}
         <div className="relative mb-4 sm:mb-6 md:mb-8 rounded-2xl overflow-hidden bg-transparent">
          {/* Carousel Container */}
          <div className="relative h-[180px] sm:h-[220px] md:h-[260px] lg:h-[300px] flex items-center justify-center gap-0 py-2 sm:py-4 md:py-6">
            {/* Left Card (Previous) - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:flex items-center justify-center w-[200px] md:w-[280px] lg:w-[350px] h-[140px] md:h-[200px] lg:h-[260px] opacity-50 scale-75 transition-all duration-500">
              <img
                src={slides[(currentSlide - 1 + slides.length) % slides.length].image}
                alt={`Feature ${slides[(currentSlide - 1 + slides.length) % slides.length].id}`}
                className="w-full h-full object-contain blur-[1px]"
              />
            </div>

            {/* Center Card (Current) */}
            <div className="flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px] h-full max-h-[180px] sm:max-h-[220px] md:max-h-[260px] lg:max-h-[300px] opacity-100 scale-100 transition-all duration-500 z-10">
              <img
                src={slides[currentSlide].image}
                alt={`Feature ${slides[currentSlide].id}`}
                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Right Card (Next) - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:flex items-center justify-center w-[200px] md:w-[280px] lg:w-[350px] h-[140px] md:h-[200px] lg:h-[260px] opacity-50 scale-75 transition-all duration-500">
              <img
                src={slides[(currentSlide + 1) % slides.length].image}
                alt={`Feature ${slides[(currentSlide + 1) % slides.length].id}`}
                className="w-full h-full object-contain blur-[1px]"
              />
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-4 sm:mb-6">
          <button
            onClick={onGetStarted}
            className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem] rounded-full bg-[#DC5F12] text-white border-none cursor-pointer text-sm sm:text-base font-semibold min-w-[120px] sm:min-w-[140px] transition-all duration-300 hover:bg-[#FF6B1A] hover:shadow-lg hover:-translate-y-0.5 inline-block"
          >
            Get Started
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
        </div>
      </div>
    </div>
  );
};

export { WelcomePage };
