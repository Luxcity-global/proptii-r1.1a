import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ReferencingModal from '../components/ReferencingModal';

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
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-archive leading-tight text-white">
            Verify Your Identity,<br />
            Funds, and Rental History
          </h1>
          
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
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#FFF5E1] rounded-full -translate-x-1/2 -translate-y-1/2 z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F6F8FD] rounded-full translate-x-1/3 translate-y-1/3 z-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-archive text-[#333333]">Steps for referencing</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Once successfully verified, users are issued a digital "Rent Passport", a 
              secure badge of trustworthiness. This streamlined process fosters trust 
              and confidence in every property transaction.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">1</div>
              <h3 className="text-2xl font-bold mb-4">Create Account</h3>
              <p className="text-gray-600">
                Sign up using your email or social accounts. Verify your email to activate your account.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">2</div>
              <h3 className="text-2xl font-bold mb-4">Submit Information</h3>
              <p className="text-gray-600">
                Provide your personal details, employment information, and financial status through our secure platform.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">3</div>
              <h3 className="text-2xl font-bold mb-4">Get Verified</h3>
              <p className="text-gray-600">
                Our AI system verifies your information quickly and thoroughly. Receive your digital Rent Passport upon approval.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <button
              onClick={handleGetStarted}
              className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
            >
              {isAuthenticated ? 'Start Referencing' : 'Get Started'}
            </button>
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