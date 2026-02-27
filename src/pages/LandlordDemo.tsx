import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandlordAppBridge from '../components/LandlordAppBridge';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandlordDemo: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E65D24] mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen font-nunito">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access the landlord application.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-nunito">
      {/* Landlord App - full screen, no main nav bar */}
      <LandlordAppBridge />
    </div>
  );
};

export default LandlordDemo;
