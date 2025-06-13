import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  isAgent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isAgent = false }) => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
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

  const handleLogin = async () => {
    try {
      setLoginError(null);
      setLoginInProgress(true);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-20">
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
              to={isAgent ? "/agent-contracts" : "/contracts"}
              className={({ isActive }) =>
                isActive
                  ? 'text-[#E76F51] font-bold transition-colors'
                  : 'text-white hover:text-[#E76F51] transition-colors'
              }
            >
              Contracts
            </NavLink>
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:block flex-shrink-0 relative">
            {isAuthenticated ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-white focus:outline-none"
                >
                  <UserCircle className="w-6 h-6" />
                  <span>{user?.name || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Dashboard
                    </Link>
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
                    {loginError.includes && loginError.includes('Popup was blocked') && (
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-white focus:outline-none"
                >
                  <UserCircle className="w-6 h-6" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Dashboard
                    </Link>
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
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black bg-opacity-90 rounded-lg mt-2">
              <NavLink
                to="/bookviewing"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'block px-3 py-2 text-[#E76F51] font-bold'
                    : 'block px-3 py-2 text-white hover:text-[#E76F51] transition-colors'
                }
              >
                Book Viewing
              </NavLink>
              <NavLink
                to="/referencing"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'block px-3 py-2 text-[#E76F51] font-bold'
                    : 'block px-3 py-2 text-white hover:text-[#E76F51] transition-colors'
                }
              >
                Referencing
              </NavLink>
              <NavLink
                to={isAgent ? "/agent-contracts" : "/contracts"}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'block px-3 py-2 text-[#E76F51] font-bold'
                    : 'block px-3 py-2 text-white hover:text-[#E76F51] transition-colors'
                }
              >
                Contracts
              </NavLink>

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-600">
                  {loginError && (
                    <div className="mx-3 mb-3 bg-red-500 text-white p-2 rounded-md text-sm">
                      {loginError}
                    </div>
                  )}
                  <button
                    onClick={handleLogin}
                    className="mx-3 w-[calc(100%-1.5rem)] bg-primary text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center justify-center"
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
        )}
      </div>
    </nav>
  );
};

export default Navbar;
