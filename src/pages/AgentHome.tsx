import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AgentNavbar from '../components/AgentNavbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import RoleSelectionModal from '../components/RoleSelectionModal';

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
  const [showRoleModal, setShowRoleModal] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'agent' | null>(null);

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleAgentToggle = () => {
    setShowRoleModal(true);
  };

  const handleRoleSelection = (role: 'landlord' | 'agent') => {
    setShowRoleModal(false);
    setSelectedRole(role);
    console.log('Selected role:', role);
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
          {/* User Type Selection */}
          <div className="mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <Link
                to="/"
                className="px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                Tenant
              </Link>
              <button 
                type="button"
                onClick={() => { console.log('Agent toggle clicked'); handleAgentToggle(); }}
                className="px-8 py-3 rounded-full bg-[#FFEFD4] text-black font-semibold transition-all"
              >
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archivo leading-tight">
            List Your Properties
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
            Streamline your property listings and reach more potential tenants.
          </p>

                 {/* View Your Dashboard Button */}
                 <div className="flex flex-col items-center gap-3">
                   <a
                     href={`http://localhost:3000?role=${selectedRole}#dashboard`}
                     className="inline-block px-8 py-4 bg-[#FFEFD4] text-black rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
                   >
                     View Your Dashboard
                   </a>
                   {selectedRole && (
                     <div className="flex items-center gap-2 px-3 py-1 bg-white text-[#136C9E] rounded-full text-sm">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                       <span className="font-medium">
                         {selectedRole === 'landlord' ? 'Landlord' : 'Property Agent'}
                       </span>
                     </div>
                   )}
                 </div>
        </div>
      </section>


      {/* What would you like to do next section */}
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#374957] mb-4">
              What would you like to do next?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose how you'd like to continue setting up your property management system. You can always access these options later from your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Go to Dashboard Card */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10 flex flex-col h-full min-h-[320px] border-2 border-[#D1D5DB] hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#3B82F6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#374957] mb-4 text-center">Go to Dashboard</h3>
              <p className="text-gray-600 mb-8 flex-grow text-center">
                Explore your property management dashboard
              </p>
              <a href="http://localhost:3000#dashboard" className="border-2 border-[#136C9E] text-[#136C9E] bg-transparent px-6 py-4 rounded-lg hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all font-medium flex items-center justify-center">
                View Dashboard
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Add a Property Card (Recommended) */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10 flex flex-col h-full relative border-2 border-[#136C9E] min-h-[320px] hover:shadow-lg transition-shadow duration-300">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#136C9E] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommended
                </span>
              </div>
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#374957] mb-4 text-center">Add a Property</h3>
              <p className="text-gray-600 mb-8 flex-grow text-center">
                Get started by adding a property to your portfolio
              </p>
              <a href="http://localhost:3000#add-property" className="bg-[#DC5F12] text-white px-6 py-4 rounded-lg hover:bg-gradient-to-r hover:from-[#DC5F12] hover:to-[#C95200] hover:shadow-[0_12px_35px_rgba(220,95,18,0.5)] transition-all font-medium flex items-center justify-center">
                Add Property
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Setup Company Profile Card */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10 flex flex-col h-full min-h-[320px] border-2 border-[#D1D5DB] hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#374957] mb-4 text-center">Setup Company Profile</h3>
              <p className="text-gray-600 mb-8 flex-grow text-center">
                Add company details, logo, and professional settings
              </p>
              <button className="border-2 border-[#136C9E] text-[#136C9E] bg-transparent px-6 py-4 rounded-lg hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all font-medium flex items-center justify-center">
                Setup Company
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't worry - you can access all of these features anytime from your dashboard
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleRoleSelection}
      />
    </div>
  );
};

export default AgentHome; 
