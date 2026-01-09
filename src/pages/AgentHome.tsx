import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentNavbar from '../components/AgentNavbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { RoleSelectionPopup } from '../components/RoleSelectionPopup';
import landlordUserService from '../services/landlordUserService';
import { useAuth } from '../contexts/AuthContext';
import { TextAnimate } from '../components/magic-ui/text-animate';

type UserRole = 'landlord' | 'agent';

// Add preload link for the hero image
const heroImageUrl = '/images/hero-agent-happy-couple.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const AgentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showRolePopup, setShowRolePopup] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleRoleSelected = (role: UserRole) => {
    setSelectedRole(role);
    // Don't close popup immediately - let user see the role was selected
    // Popup will close when they click "Continue" button
  };

  const handleRoleContinue = async (role: UserRole) => {
    setSelectedRole(role);
    setShowRolePopup(false);
    
    // Automatically register user if they have email
    const userEmail = user?.email || '';
    const userName = user?.name || '';
    
    if (userEmail && userName) {
      console.log('🔄 Auto-registering user as', role, ':', userEmail);
      
      try {
        // Check if already registered first
        const checkResult = await landlordUserService.isLandlordOrAgent(userEmail);
        
        if (checkResult.isLandlord) {
          console.log('✅ User already registered as', checkResult.user?.role);
          localStorage.setItem('landlordEmail', userEmail);
          return;
        }
        
        // Auto-register
        const result = await landlordUserService.registerLandlordUser({
          email: userEmail,
          name: userName,
          role: role,
          phone: user?.phone,
          // companyName will be omitted if undefined
        });
        
        if (result.success) {
          console.log('✅ Auto-registered successfully:', result.userId);
          localStorage.setItem('landlordEmail', userEmail);
        } else {
          console.error('❌ Auto-registration failed:', result.error);
          // Continue anyway - user can still use the app
        }
      } catch (error) {
        console.error('❌ Error during auto-registration:', error);
        // Continue anyway - user can still use the app
      }
    } else {
      console.log('⚠️ No user email/name available for auto-registration');
    }
  };


  const handleGoToDashboard = () => {
    // Store the selected role in localStorage for the dashboard to use
    localStorage.setItem('userRole', selectedRole);
    // Navigate to the landlord dashboard (served from public/landlord/)
    window.location.href = '/landlord/index.html';
  };

  const handleAddProperty = () => {
    // Pass selected role into landlord app
    if (selectedRole === 'agent') {
      localStorage.setItem('userRole', 'agent');
    }
    // Instruct landlord app to open property setup flow immediately
    localStorage.setItem('startScreen', 'property-setup-step1');
    window.location.href = '/landlord/index.html?start=property-setup-step1';
  };

  const handleSetupProfile = () => {
    // Respect selected role for landlord-agent app
    if (selectedRole === 'agent') {
      localStorage.setItem('userRole', 'agent');
    }
    // Deep link to the company/landlord profile setup flow
    localStorage.setItem('startScreen', 'company-profile-setup');
    window.location.href = '/landlord/index.html?start=company-profile-setup';
  };


  return (
    <div className="min-h-screen font-archivo">
      <AgentNavbar isAgent={true} />

      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Happy couple with agent"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
          {/* Main Heading */}
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight">
            <TextAnimate
              className="text-3xl md:text-6xl font-bold font-archive leading-tight"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              List Your Properties
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
            Streamline your property listings and reach more potential tenants.
          </TextAnimate>

          {/* Go to Dashboard Button */}
          <button
            onClick={handleGoToDashboard}
            className="inline-block px-8 py-4 bg-[#FFEFD4] text-black rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            {selectedRole === 'landlord' ? 'Go to Landlord Dashboard' : 'Go to Agent Dashboard'}
          </button>
        </div>
      </section>


      {/* Next Steps Section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0]">
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
              What would you like to do next?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose how you'd like to continue setting up your property management system. You can always access these options later from your&nbsp;dashboard.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 action-cards-section">
            {/* Go to Dashboard Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 md:p-10 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-8">
                  <div className="w-16 h-16 bg-[#EBF4FF] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#3B82F6]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Go to Dashboard</h3>
                <p className="text-gray-600 mb-8">Explore your property management&nbsp;dashboard</p>
              </div>
              <button
                onClick={handleGoToDashboard}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                View Dashboard
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Add a Property Card (Recommended) */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#136C9E] p-8 md:p-10 text-center hover:shadow-xl transition-shadow relative min-h-[280px] flex flex-col justify-between">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#136C9E] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommended
                </span>
              </div>
              
              <div>
                <div className="mb-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">Add a Property</h3>
                <p className="text-gray-600 mb-8">Get started by adding a property to your&nbsp;portfolio</p>
              </div>
              <button
                onClick={handleAddProperty}
                className="bg-[#DC5F12] hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#f97316] hover:py-4 hover:shadow-2xl hover:shadow-[#DC5F12]/70 text-white px-8 py-3 rounded-full font-medium flex items-center justify-center mx-auto group transition-all duration-300"
              >
                Add Property
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Setup Profile Card (role-aware) */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#D1D5DB] p-8 md:p-10 text-center hover:shadow-xl transition-shadow min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="mb-8">
                  <div className="w-16 h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#374957] mb-4">{selectedRole === 'agent' ? 'Setup Company Profile' : 'Setup Landlord Profile'}</h3>
                <p className="text-gray-600 mb-8">
                  {selectedRole === 'agent'
                    ? 'Add company details, logo, and professional\u00A0settings'
                    : 'Add your landlord details, contact info, and optional branding'}
                </p>
              </div>
              <button
                onClick={handleSetupProfile}
                className="text-[#374957] hover:text-[#DC5F12] hover:border-[#DC5F12] border border-transparent rounded-full px-8 py-3 font-medium flex items-center justify-center mx-auto group transition-all"
              >
                {selectedRole === 'agent' ? 'Setup Company' : 'Setup Landlord'}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Don't worry - you can access all of these features anytime from your&nbsp;dashboard
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />

      {/* Role Selection Popup */}
      <RoleSelectionPopup 
        isOpen={showRolePopup} 
        onRoleSelected={handleRoleSelected}
        onContinue={handleRoleContinue}
      />
    </div>
  );
};

export default AgentHome; 
