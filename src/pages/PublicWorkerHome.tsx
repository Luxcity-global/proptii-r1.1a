import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { TextAnimate } from '../components/magic-ui/text-animate';

// Add preload link for the hero image
const heroImageUrl = '/images/01_Lady_Child_Family_BG.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const PublicWorkerHome = () => {
  const navigate = useNavigate();

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleGetStarted = () => {
    // Navigate to services or dashboard when available
    navigate('/public-worker/services');
  };

  const handleViewResources = () => {
    navigate('/public-worker/resources');
  };

  const handleConnectWithAgents = () => {
    // Navigate to agent connection page
    navigate('/public-worker/services');
  };

  const handleViewFeatures = () => {
    // Scroll to features section
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Family finding their home"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="sync"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
          {/* Main Heading */}
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archivo leading-tight">
            <TextAnimate
              className="text-3xl md:text-6xl font-bold font-archivo leading-tight"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              Help Your Clients Find Real Homes
            </TextAnimate>
          </h1>

          {/* Subheading */}
          <TextAnimate
            className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light"
            by="word"
            animation="fadeIn"
            startOnView={true}
            once={true}
          >
            Connect with trusted agents and landlords to help your clients find safe, affordable housing. Less chasing, more results.
          </TextAnimate>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-block px-8 py-4 bg-[#DC5F12] text-white rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Get Started
            </button>
            <button
              onClick={handleViewFeatures}
              className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all"
            >
              Learn More
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
              How Proptii Helps You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Practical tools to connect your clients with real housing opportunities. All in one place.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* Agent & Landlord Network */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#EBF4FF] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#136C9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Agent & Landlord Network</h3>
                <p className="text-gray-600 mb-8">Connect with verified agents and landlords. Find real listings without the usual back-and-forth.</p>
              </div>
              <button
                onClick={handleConnectWithAgents}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                Get Started
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Housing Search Tools */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#FFE5D9] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#DC5F12]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Housing Search Tools</h3>
                <p className="text-gray-600 mb-8">Find real listings that match your clients' needs. No fake ads or wasted time.</p>
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

            {/* Client Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Client Management</h3>
                <p className="text-gray-600 mb-8">Keep track of your clients' applications and housing needs. All in one place.</p>
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

            {/* Resources & Support */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#136C9E] p-8 text-center hover:shadow-xl transition-shadow relative min-h-[280px] flex flex-col justify-between">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#136C9E] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Essential
                </span>
              </div>
              
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Resources & Support</h3>
                <p className="text-gray-600 mb-8">Guides and templates to help you navigate housing assistance. Clear, practical support when you need it.</p>
              </div>
              <button
                onClick={handleViewResources}
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
            {/* Application Assistance */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Application Assistance</h4>
              <p className="text-sm text-gray-600">Help clients complete applications properly. Fewer mistakes, faster results.</p>
            </div>

            {/* Referencing Support */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Referencing Support</h4>
              <p className="text-sm text-gray-600">Help clients show they're serious tenants. Less chasing, more credibility.</p>
            </div>

            {/* Communication Hub */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Communication Hub</h4>
              <p className="text-sm text-gray-600">Coordinate with agents, landlords, and clients. All messages in one place.</p>
            </div>

            {/* Reporting & Analytics */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-bold text-[#374957] mb-2">Reporting & Analytics</h4>
              <p className="text-sm text-gray-600">Track how many clients you've helped find homes. See what's working.</p>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              All tools are designed to help you connect your clients with real housing opportunities
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

export default PublicWorkerHome;

