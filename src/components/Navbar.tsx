import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (isDropdownOpen && !target.closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close mobile menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      if (loginInProgress) {
        if (isAuthenticated) {
          setLoginInProgress(false);
          setLoginError(null);
        } else if (!isLoading) {
          setLoginInProgress(false);
          setLoginError("Login failed. Please try again.");
          setTimeout(() => setLoginError(null), 5000);
        }
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [isAuthenticated, isLoading, loginInProgress]);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      setLoginInProgress(true);
      console.log("Starting login process. You may be redirected to the login page.");
      await login();
      console.log("Login successful via popup");
    } catch (error) {
      console.error("Login error in Navbar:", error);
      setLoginInProgress(false);
      if (error instanceof Error && error.message.includes('popup')) {
        setLoginError("Popup was blocked. Please allow popups for this site or you will be redirected.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    editProfile();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  return (
    <nav className="md:absolute fixed top-0 left-0 right-0 z-50 md:bg-transparent bg-[#0F2537] shadow-lg md:shadow-none">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white p-2 rounded-md hover:bg-[#1a3c5c] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center space-x-8">
            <NavLink
              to="/bookviewing"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#E76F51] font-bold transition-colors'
                  : 'text-white hover:text-[#E76F51] transition-colors'
              }
            >
              Book Viewing
            </NavLink>
            <NavLink
              to="/referencing"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#E76F51] font-bold transition-colors'
                  : 'text-white hover:text-[#E76F51] transition-colors'
              }
            >
              Referencing
            </NavLink>
            <NavLink
              to="/contracts"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#E76F51] font-bold transition-colors'
                  : 'text-white hover:text-[#E76F51] transition-colors'
              }
            >
              Contracts
            </NavLink>
            <NavLink
              to="/Dashboard"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#E76F51] font-bold transition-colors'
                  : 'text-white hover:text-[#E76F51] transition-colors'
              }
            >
              Dashboard
            </NavLink>
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-white focus:outline-none"
                >
                  <UserCircle className="w-6 h-6" />
                  <span>{user?.name || `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'User'}</span>
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
                  ) : 'Sign In'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out bg-[#0F2537] ${
            isMobileMenuOpen
              ? 'max-h-[400px] opacity-100'
              : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="flex flex-col space-y-4 py-4">
            <NavLink
              to="/bookviewing"
              className={({ isActive }) =>
                `text-white hover:text-[#E76F51] transition-colors px-4 py-2 rounded-md ${
                  isActive ? 'text-[#E76F51] bg-[#1a3c5c]' : ''
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Book Viewing
            </NavLink>
            <NavLink
              to="/referencing"
              className={({ isActive }) =>
                `text-white hover:text-[#E76F51] transition-colors px-4 py-2 rounded-md ${
                  isActive ? 'text-[#E76F51] bg-[#1a3c5c]' : ''
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Referencing
            </NavLink>
            <NavLink
              to="/contracts"
              className={({ isActive }) =>
                `text-white hover:text-[#E76F51] transition-colors px-4 py-2 rounded-md ${
                  isActive ? 'text-[#E76F51] bg-[#1a3c5c]' : ''
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contracts
            </NavLink>
            <NavLink
              to="/Dashboard"
              className={({ isActive }) =>
                `text-white hover:text-[#E76F51] transition-colors px-4 py-2 rounded-md ${
                  isActive ? 'text-[#E76F51] bg-[#1a3c5c]' : ''
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>

            {/* Mobile Auth Button */}
            {isAuthenticated ? (
              <div className="px-4 py-2">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 text-white">
                    <UserCircle className="w-6 h-6" />
                    <span>{user?.name || `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'User'}</span>
                  </div>
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center text-white hover:text-[#E76F51] transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-white hover:text-[#E76F51] transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2">
                <button
                  onClick={handleLogin}
                  className="w-full bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center justify-center"
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
                  ) : 'Sign In'}
                </button>
                {loginError && (
                  <div className="mt-2 bg-red-500 text-white p-2 rounded-md text-sm">
                    {loginError}
                    {loginError.includes('Popup was blocked') && (
                      <div className="mt-1 text-xs">
                        Please check your browser settings to allow popups for this site.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
