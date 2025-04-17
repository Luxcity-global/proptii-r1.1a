import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X, LogIn } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  const mobileMenuRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown when clicking outside
      if (isDropdownOpen && 
          userDropdownRef.current && 
          !userDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      
      // Close mobile menu when clicking outside
      if (isMobileMenuOpen && 
          mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      if (loginInProgress) {
        if (isAuthenticated) {
          // Login succeeded
          setLoginInProgress(false);
          setLoginError(null);
        } else if (!isLoading) {
          // Login failed
          setLoginInProgress(false);
          setLoginError("Login failed. Please try again.");
          // Auto-clear error after 5 seconds
          setTimeout(() => setLoginError(null), 5000);
        }
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [isAuthenticated, isLoading, loginInProgress]);

  // Close mobile menu when window is resized to larger size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      setLoginInProgress(true);
      setIsMobileMenuOpen(false); // Close mobile menu if open
      
      // Inform the user that they might be redirected
      console.log("Starting login process. You may be redirected to the login page.");
      
      await login();
      
      // If we get here, the popup login was successful
      console.log("Login successful via popup");
    } catch (error) {
      console.error("Login error in Navbar:", error);
      setLoginInProgress(false);
      
      // Check if the error is related to popup blocking
      if (error instanceof Error && error.message.includes('popup')) {
        setLoginError("Popup was blocked. Please allow popups for this site or you will be redirected.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    editProfile();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMenuAndNavigate = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/referencing', label: 'Referencing' },
    { path: '/bookviewing', label: 'Book Viewing' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/Dashboard', label: 'Dashboard' },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii"
                className="h-12 w-auto"
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="text-white hover:text-gray-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:block flex-shrink-0 relative ml-4">
            {isAuthenticated ? (
              <div className="relative user-dropdown" ref={userDropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-white focus:outline-none"
                >
                  <UserCircle className="w-6 h-6" />
                  <span>{user?.name || user?.username || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {loginError && (
                  <div className="absolute right-0 -bottom-16 w-64 bg-red-500 text-white p-2 rounded-md text-sm">
                    {loginError}
                    {loginError && loginError.includes && loginError.includes('Popup was blocked') && (
                      <div className="mt-1 text-xs">
                        Please check your browser settings to allow popups for this site.
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleLogin}
                  className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center"
                  disabled={isLoading || loginInProgress}
                >
                  {isLoading || loginInProgress ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center ml-4">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-gray-800 shadow-lg rounded-b-lg mx-4 mt-1 py-2 px-4 animate-slideDown"
        >
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="text-white hover:text-gray-200 py-2 transition-colors"
                onClick={closeMenuAndNavigate}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            {isAuthenticated ? (
              <>
                <div className="py-2 border-t border-gray-700 mt-2"></div>
                <div className="flex items-center py-2 text-white">
                  <UserCircle className="w-5 h-5 mr-2" />
                  <span>{user?.name || user?.username || 'User'}</span>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="flex items-center text-white hover:text-gray-200 py-2 w-full text-left"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white hover:text-gray-200 py-2 w-full text-left"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="py-2 border-t border-gray-700 mt-2"></div>
                <button 
                  onClick={handleLogin}
                  className="flex items-center w-full text-white hover:text-gray-200 py-2"
                  disabled={isLoading || loginInProgress}
                >
                  {isLoading || loginInProgress ? (
                    <>
                      <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </button>
                {loginError && (
                  <div className="mt-2 bg-red-500 text-white p-2 rounded-md text-sm">
                    {loginError}
                    {loginError && loginError.includes && loginError.includes('Popup was blocked') && (
                      <div className="mt-1 text-xs">
                        Please check your browser settings to allow popups for this site.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
