import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandlordAppBridge from '../components/LandlordAppBridge';
import AuthDebugger from '../components/AuthDebugger';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandlordDemo: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = window.location;

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = location.pathname + location.search;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      const redirectPath = encodeURIComponent(currentPath);
      window.location.href = `/login?redirect=${redirectPath}`;
    }
  }, [isAuthenticated, isLoading, location.pathname, location.search]);

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
    // Show loading state while redirecting
    const currentPath = location.pathname + location.search;
    
    // Show loading state while redirecting
    return (
      <div className="min-h-screen font-nunito">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E65D24] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Redirecting to Sign In
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access the landlord application.
            </p>
            <p className="text-sm text-gray-500">
              If you're not redirected automatically, <a href={`/login?redirect=${encodeURIComponent(currentPath)}`} className="text-[#E65D24] underline">click here</a>.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-nunito">
      <AuthDebugger />
      <Navbar />
      
      {/* Authentication Status Banner */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <strong>Authenticated as:</strong> {user?.name || user?.email} 
              {user?.roles && user.roles.includes('tenant') && (
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Tenant
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Landlord App */}
      <LandlordAppBridge />
      
      <Footer />
    </div>
  );
};

export default LandlordDemo;
