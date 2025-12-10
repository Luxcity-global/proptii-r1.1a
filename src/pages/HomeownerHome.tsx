import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeownerNavbar from '../components/HomeownerNavbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { RoleSelectionPopup } from '../components/RoleSelectionPopup';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'homeowner';

// Add preload link for the hero image
const heroImageUrl = '/images/cheerful-kids-their-parents-casualwear-relaxing-couch-living-room 1.png';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const HomeownerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('homeowner');
  const [userType, setUserType] = useState('Homeowner');
  const [isExpanded, setIsExpanded] = useState(false);

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleGoToDashboard = () => {
    localStorage.setItem('userRole', 'homeowner');
    navigate('/homeowner/dashboard');
  };

  const handleGetStarted = () => {
    localStorage.setItem('userRole', 'homeowner');
    navigate('/homeowner/dashboard');
  };

  const handleGoToMaintenance = () => {
    localStorage.setItem('userRole', 'homeowner');
    navigate('/homeowner/dashboard');
    // The dashboard will handle navigation to maintenance screen
    localStorage.setItem('homeownerInitialScreen', 'maintenance');
  };

  const handleGoToDocuments = () => {
    localStorage.setItem('userRole', 'homeowner');
    navigate('/homeowner/dashboard');
    // The dashboard will handle navigation to documents screen
    localStorage.setItem('homeownerInitialScreen', 'documents');
  };

  const handleViewFeatures = () => {
    // Scroll to features section or navigate to features page
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionClick = (option: string) => {
    setUserType(option);
    setIsExpanded(false);
    
    if (option === 'Tenant') {
      navigate('/');
    } else if (option === 'Agent') {
      navigate('/Agent');
    }
    // Homeowner stays on homeowner page, no navigation needed
  };

  return (
    <div className="min-h-screen font-archivo">
      <HomeownerNavbar isHomeowner={true} />

      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Cheerful family relaxing in living room"
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: 'center 20%' }}
            loading="eager"
            decoding="sync"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
          {/* User Type Selection */}
          <div className="mb-12 flex justify-center">
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
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight">
            Manage Your Home
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
            Everything you need to maintain, improve, and protect your home in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-block px-8 py-4 bg-[#DC5F12] text-white rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0] features-section">
        {/* Background Image (Blobs) */}
        <img
          src="/images/middle-section.png"
          alt="Decorative background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          loading="lazy"
          sizes="100vw"
        />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#374957] mb-4">
              Homeowner Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to help you manage every aspect of your home.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* Maintenance Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#FFE5D9] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#DC5F12]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Maintenance Management</h3>
                <p className="text-gray-600 mb-8">Track repairs, schedule maintenance, and manage service history</p>
              </div>
              <button
                onClick={handleGoToMaintenance}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                Get Started
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Home Improvement Projects */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#EBF4FF] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Home Improvement</h3>
                <p className="text-gray-600 mb-8">Plan projects, track progress, and calculate ROI on renovations</p>
              </div>
              <button
                onClick={handleViewFeatures}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                Learn More
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Home Value Tracking */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Home Value & Equity</h3>
                <p className="text-gray-600 mb-8">Track your home's value and monitor equity growth over time</p>
              </div>
              <button
                onClick={handleViewFeatures}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                Learn More
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Documentation Hub */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#136C9E] p-8 text-center hover:shadow-xl transition-shadow relative min-h-[280px] flex flex-col justify-between">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#136C9E] text-white px-4 py-1 rounded-full text-sm font-medium">
                  MVP
                </span>
              </div>
              
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Documentation Hub</h3>
                <p className="text-gray-600 mb-8">Store warranties, manuals, receipts, and all home documents</p>
              </div>
              <button
                onClick={handleGoToDocuments}
                className="bg-[#DC5F12] hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#f97316] hover:py-4 hover:shadow-2xl hover:shadow-[#DC5F12]/70 text-white px-8 py-3 rounded-full font-medium flex items-center justify-center mx-auto group transition-all duration-300"
              >
                Get Started
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Energy Efficiency */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Energy Efficiency</h4>
              <p className="text-sm text-gray-600">Track utilities and optimize consumption</p>
            </div>

            {/* Insurance & Protection */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Insurance & Protection</h4>
              <p className="text-sm text-gray-600">Manage policies and track claims</p>
            </div>

            {/* Neighborhood Insights */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Neighborhood Insights</h4>
              <p className="text-sm text-gray-600">Local amenities and market trends</p>
            </div>

            {/* Property Tax & Finance */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Tax & Finance</h4>
              <p className="text-sm text-gray-600">Track taxes and financial planning</p>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              All features are accessible from your homeowner dashboard
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomeownerHome;

