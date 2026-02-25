import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PropertySetupStep1Props {
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onSection1: () => void;
  onSection2: () => void;
  onSection3: () => void;
  onSection4: () => void;
  onSaveAndExit: () => void;
}

export function PropertySetupStep1({ onNext, onBack, onHome, onSection1, onSection2, onSection3, onSection4, onSaveAndExit }: PropertySetupStep1Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const slides = [
    {
      image: '/assets/add_prp_slide/chalcot-square-london-uk-march-people-enjoy-sun-gardens-surrounded-colorful-italianate-terraced-houses-greater-area-214905146.png',
      tip: 'Start with property type - it determines your rental strategy and target market'
    },
    {
      image: '/assets/add_prp_slide/fyGslLi6kqhgzXxdxn7fQYSSReDgNPDwHpPeYYsP_1200.png',
      tip: 'Consider location carefully - it affects rental income and tenant quality'
    },
    {
      image: '/assets/add_prp_slide/i.png',
      tip: 'Document everything - photos, floor plans, and condition reports are essential'
    },
    {
      image: '/assets/add_prp_slide/viewSourceImage-39-1-scaled.png',
      tip: 'Set competitive rent - research local market rates for similar properties'
    },
    {
      image: '/assets/add_prp_slide/pexels-heyho-6077368.png',
      tip: 'Maintain good tenant relationships - communication is key to successful property management'
    },
    {
      image: '/assets/add_prp_slide/iStock-1974859701-1-scaled.png',
      tip: 'Regular maintenance prevents costly repairs and keeps tenants happy'
    },
    {
      image: '/assets/add_prp_slide/pexels-lebele-11935244.png',
      tip: 'Keep detailed records - proper documentation protects you legally and financially'
    },
    {
      image: '/assets/add_prp_slide/pexels-naimbic-2030037.png',
      tip: 'Plan for the future - consider long-term property value and market trends'
    }
  ];

  const changeSlide = (newSlide: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(newSlide);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        const nextSlide = (currentSlide + 1) % slides.length;
        changeSlide(nextSlide);
      }
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [currentSlide, slides.length, isTransitioning]);

  return (
    <div className="min-h-screen py-4 px-2" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 py-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/images/proptii-logo.png" 
              alt="Proptii Logo" 
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onHome}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="rounded-full px-4 py-2">
              Questions?
            </Button>
            <Button variant="outline" className="rounded-full px-4 py-2" onClick={onSaveAndExit}>
              Save & exit
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center" style={{ gap: '60px', minHeight: '800px' }} data-demo-add-property-step1>
          {/* Left Section - Text */}
          <div className="flex-1 max-w-md flex flex-col justify-center">
            <header className="mb-1">
              <h1 className="font-bold text-gray-900" style={{ fontSize: '28pt' }}>
                Add new property
              </h1>
            </header>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Where would you like to begin
            </p>
            
            {/* Section Buttons */}
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-20 px-4 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onClick={onSection1}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 248, 220, 0.8), 0 8px 20px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
                  e.currentTarget.style.height = '88px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.height = '80px';
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900">Section 1: Property Type</span>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-20 px-4 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onClick={onSection2}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 248, 220, 0.8), 0 8px 20px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
                  e.currentTarget.style.height = '88px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.height = '80px';
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900">Section 2: Property Details</span>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-20 px-4 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onClick={onSection3}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 248, 220, 0.8), 0 8px 20px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
                  e.currentTarget.style.height = '88px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.height = '80px';
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900">Section 3: Amenities</span>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-20 px-4 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onClick={onSection4}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 248, 220, 0.8), 0 8px 20px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
                  e.currentTarget.style.height = '88px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.height = '80px';
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900">Section 4: Images and Additional Notes</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Right Section - Property Slideshow */}
          <div className="flex-1" style={{ marginRight: '-48px' }}>
            <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg relative">
              {/* Property Image */}
              <img 
                src={slides[currentSlide].image} 
                alt="Beautiful property"
                className={`w-full h-full object-cover rounded-xl transition-all duration-1000 ease-in-out ${
                  isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                onError={(e) => {
                  // Fallback to a different image if the current one fails
                  (e.currentTarget as HTMLImageElement).src = '/assets/add_prp_slide/chalcot-square-london-uk-march-people-enjoy-sun-gardens-surrounded-colorful-italianate-terraced-houses-greater-area-214905146.png';
                }}
              />
              
              {/* Landlord Tips Overlay */}
              <div className={`absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm transition-all duration-800 ease-in-out ${
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFFCF8' }}>
                    <span className="text-blue-600 text-sm font-bold">💡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">Pro Tip</h4>
                    <p className="text-white text-xs leading-relaxed">
                      {slides[currentSlide].tip}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Slideshow Navigation */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => changeSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out ${
                      index === currentSlide ? 'bg-white opacity-80 scale-125' : 'bg-white opacity-40 hover:opacity-60'
                    }`}
                  />
                ))}
              </div>
              
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <div className="flex items-center space-x-4">
            {/* Progress Bar */}
            <div className="flex items-center space-x-2">
              <div className="w-32 h-1 bg-gray-200 rounded-full">
                <div className="w-8 h-1 bg-black rounded-full"></div>
              </div>
            </div>

            <Button 
              onClick={onNext}
              className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-900 transition-colors"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
