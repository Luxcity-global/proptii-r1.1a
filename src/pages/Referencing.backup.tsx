import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ReferencingModal from '../components/ReferencingModal';

const Referencing = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      // If authentication succeeded, open the modal
      if (isAuthenticated && loginInProgress) {
        setLoginInProgress(false);
        setLoginError(null);
        setIsModalOpen(true);
      } 
      // If authentication failed but was in progress, show error
      else if (!isAuthenticated && loginInProgress && !isLoading) {
        setLoginInProgress(false);
        setLoginError("Authentication failed. Please try again.");
        // Auto-clear error after 5 seconds
        setTimeout(() => setLoginError(null), 5000);
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    // Check if user is already authenticated after loading
    if (!isLoading) {
      if (isAuthenticated && loginInProgress) {
        setLoginInProgress(false);
        setIsModalOpen(true);
      } else if (!isAuthenticated && loginInProgress) {
        setLoginInProgress(false);
        setLoginError("Authentication failed. Please try again.");
        // Auto-clear error after 5 seconds
        setTimeout(() => setLoginError(null), 5000);
      }
    }
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [isAuthenticated, loginInProgress, isLoading]);

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      setIsModalOpen(true);
    } else {
      try {
        setLoginError(null);
        setLoginInProgress(true);
        
        // Inform the user that they might be redirected
        console.log("Starting login process. You may be redirected to the login page.");
        
        await login();
        
        // If we get here, the popup login was successful
        console.log("Login successful via popup");
      } catch (error) {
        console.error("Login error in Referencing page:", error);
        setLoginInProgress(false);
        
        // Check if the error is related to popup blocking
        if (error instanceof Error && error.message.includes('popup')) {
          setLoginError("Popup was blocked. Please allow popups for this site or you will be redirected.");
        } else {
          setLoginError("Authentication failed. Please try again.");
        }
        
        // Auto-clear error after 5 seconds
        setTimeout(() => setLoginError(null), 5000);
      }
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

          {/* Display login error if any */}
          {loginError && (
            <div className="bg-red-500 bg-opacity-80 text-white p-4 rounded-lg mb-6 max-w-md mx-auto">
              <p>{loginError}</p>
              {loginError.includes('Popup was blocked') && (
                <p className="mt-2 text-sm">
                  Please check your browser settings to allow popups for this site. 
                  You may need to click the popup blocker icon in your browser's address bar.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleGetStarted}
            className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
            disabled={isLoading || loginInProgress}
          >
            {isLoading || loginInProgress ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : isAuthenticated ? 'Start Referencing' : 'Get Started'}
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
              disabled={isLoading || loginInProgress}
            >
              {isLoading ? 'Loading...' : isAuthenticated ? 'Start Referencing' : 'Get Started'}
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