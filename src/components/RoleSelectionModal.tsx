import React, { useState, useEffect } from 'react';
import { X, Building2, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'landlord' | 'agent') => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, onSelectRole }) => {
  if (!isOpen) return null;
  
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'agent'>('landlord');
  const [currentStep, setCurrentStep] = useState<'landing' | 'role-selection'>('landing');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/images/feature1.png',
    '/images/feature2.png',
    '/images/feature3.png',
    '/images/feature4.png'
  ];

  // Auto-advance slideshow
  useEffect(() => {
    if (currentStep === 'landing') {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3000); // Change slide every 3 seconds

      return () => clearInterval(interval);
    }
  }, [currentStep, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleGetStarted = () => {
    setCurrentStep('role-selection');
  };

  const handleBackToLanding = () => {
    setCurrentStep('landing');
  };

  const handleRoleSelection = () => {
    onSelectRole(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] px-4 py-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {currentStep === 'role-selection' && (
              <button
                onClick={handleBackToLanding}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1"></div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {currentStep === 'landing' ? (
          /* Landing Page Step */
          <div className="p-8">
            <div className="text-center mb-8">
              {/* Main Title */}
              <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                Welcome to Proptii
              </h2>
              
              {/* Introductory Paragraph */}
              <p className="text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                The complete property management solution for modern landlords and agents. Streamline your workflow, stay compliant, and grow your portfolio with confidence.
              </p>
            </div>

            {/* Slideshow */}
            <div className="relative max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-center space-x-1">
                {/* Left slide (fading out) */}
                <div className="flex-shrink-0 w-1/4 opacity-50 transform scale-90 transition-all duration-500">
                  <img
                    src={slides[(currentSlide - 1 + slides.length) % slides.length]}
                    alt={`Feature ${((currentSlide - 1 + slides.length) % slides.length) + 1}`}
                    className="w-full h-auto object-contain max-h-60 rounded-lg"
                  />
                </div>
                
                {/* Center slide (prominent) */}
                <div className="flex-shrink-0 w-1/2 opacity-100 transform scale-100 transition-all duration-500">
                  <img
                    src={slides[currentSlide]}
                    alt={`Feature ${currentSlide + 1}`}
                    className="w-full h-auto object-contain max-h-80 rounded-lg"
                  />
                </div>
                
                {/* Right slide (fading in) */}
                <div className="flex-shrink-0 w-1/4 opacity-50 transform scale-90 transition-all duration-500">
                  <img
                    src={slides[(currentSlide + 1) % slides.length]}
                    alt={`Feature ${((currentSlide + 1) % slides.length) + 1}`}
                    className="w-full h-auto object-contain max-h-60 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Get Started Button */}
            <div className="text-center">
              <button 
                onClick={handleGetStarted}
                className="text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center space-x-2 mx-auto"
                style={{ fontFamily: 'Archivo, sans-serif', backgroundColor: '#DC5F12' }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Role Selection Step */
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                What best describes you?
              </h2>
              <p className="text-lg text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Help us customize your experience by selecting your role
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
              {/* Landlord Card */}
              <div 
                className={`border-2 rounded-xl p-6 relative cursor-pointer hover:shadow-lg transition-all ${
                  selectedRole === 'landlord' ? 'border-[#136C9E]' : 'border-gray-200'
                }`}
                onClick={() => setSelectedRole('landlord')}
              >
                {selectedRole === 'landlord' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[#136C9E] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        Landlord
                      </h3>
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                        Popular
                      </span>
                    </div>
                    <p className="text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      I own and manage my own properties
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#374957] mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    Key features:
                  </h4>
                  <ul className="space-y-2">
                    {[
                      'Personal property portfolio',
                      'Direct tenant management',
                      'Individual compliance tracking',
                      'Simple financial reporting'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        <div className="w-2 h-2 bg-[#374957] rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Property Agent Card */}
              <div 
                className={`border-2 rounded-xl p-6 relative cursor-pointer hover:shadow-lg transition-all ${
                  selectedRole === 'agent' ? 'border-[#136C9E]' : 'border-gray-200'
                }`}
                onClick={() => setSelectedRole('agent')}
              >
                {selectedRole === 'agent' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[#136C9E] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        Property Agent
                      </h3>
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                        Professional
                      </span>
                    </div>
                    <p className="text-[#374957] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      I manage properties for multiple clients
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#374957] mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    Key features:
                  </h4>
                  <ul className="space-y-2">
                    {[
                      'Multi-client property management',
                      'Advanced reporting tools',
                      'Team collaboration features',
                      'White-label options'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-[#374957]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        <div className="w-2 h-2 bg-[#374957] rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <button
                onClick={handleRoleSelection}
                className="bg-[#DC5F12] text-white px-8 py-4 rounded-full hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#C95200] hover:shadow-[0_12px_35px_rgba(220,95,18,0.5)] transition-all font-medium flex items-center justify-center mx-auto"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Continue as {selectedRole === 'landlord' ? 'Landlord' : 'Property Agent'}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionModal;