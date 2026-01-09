import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  isAgent?: boolean;
}

type UserType = 'Tenant' | 'Agent' | 'Home Owner' | 'Public worker';

interface NavLinkItem {
  label: string;
  path: string;
}

const Navbar: React.FC<NavbarProps> = ({ isAgent = false }) => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Determine initial user type based on current route
  const getInitialUserType = (pathname: string): UserType => {
    const path = pathname.toLowerCase();
    if (path.includes('/agent')) return 'Agent';
    if (path.includes('/homeowner')) return 'Home Owner';
    if (path.includes('/public-worker')) return 'Public worker';
    return 'Tenant';
  };
  
  const [userType, setUserType] = useState<UserType>(getInitialUserType(location.pathname));
  const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
  
  // Update user type when route changes
  useEffect(() => {
    setUserType(getInitialUserType(location.pathname));
  }, [location.pathname]);

  // Navigation links mapping for each user type
  const navLinksMap: Record<UserType, NavLinkItem[]> = {
    'Tenant': [
      { label: 'Book Viewing', path: '/bookviewing' },
      { label: 'Referencing', path: '/referencing' },
      { label: 'Contracts', path: '/contracts' }
    ],
    'Agent': [
      { label: 'Book Viewing', path: '/bookviewing' },
      { label: 'Contracts', path: '/agent-contracts' }
    ],
    'Home Owner': [
      { label: 'Maintenance', path: '/homeowner/maintenance' },
      { label: 'Projects', path: '/homeowner/projects' },
      { label: 'Documents', path: '/homeowner/documents' }
    ],
    'Public worker': [
      { label: 'Services', path: '/public-worker/services' },
      { label: 'Resources', path: '/public-worker/resources' },
      { label: 'Support', path: '/public-worker/support' }
    ]
  };

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
      if (isUserTypeDropdownOpen && !target.closest('.user-type-dropdown')) {
        setIsUserTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen, isUserTypeDropdownOpen]);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setIsUserTypeDropdownOpen(false);
    
    // Navigate based on user type
    if (type === 'Agent') {
      navigate('/Agent');
    } else if (type === 'Home Owner') {
      navigate('/Homeowner');
    } else if (type === 'Tenant') {
      navigate('/');
    } else if (type === 'Public worker') {
      navigate('/public-worker');
    }
  };

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

  const handleEditProfile = async () => {
    console.log('🔄 Edit Profile button clicked');
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    
    try {
      console.log('🔄 Calling editProfile function...');
      await editProfile();
      console.log('✅ Edit profile function completed');
    } catch (error) {
      console.error('❌ Error in handleEditProfile:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigate to the tenant dashboard
  const handleGoToDashboard = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/dashboard');
  };

  const currentNavLinks = navLinksMap[userType];

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
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            {/* User Type Selector - Desktop */}
            <div className="relative user-type-dropdown">
              <button
                onClick={() => setIsUserTypeDropdownOpen(!isUserTypeDropdownOpen)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-white hover:bg-gray-700 transition-colors"
                style={{ border: '2px solid #ffffff', backgroundColor: 'rgba(31, 41, 55, 0.7)' }}
              >
                <span className="text-sm font-semibold">{userType}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${isUserTypeDropdownOpen ? 'rotate-180' : ''}`}
                    style={{ color: '#ffffff' }}
                  />
                </div>
              </button>
              
              {isUserTypeDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg py-1 z-50" style={{ border: '2px solid #ffffff', outline: 'none' }}>
                  <button
                    onClick={() => handleUserTypeSelect('Tenant')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Tenant
                  </button>
                  <button
                    onClick={() => handleUserTypeSelect('Agent')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Agent
                  </button>
                  <button
                    onClick={() => handleUserTypeSelect('Home Owner')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Home Owner
                  </button>
                  <button
                    onClick={() => handleUserTypeSelect('Public worker')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Public worker
                  </button>
                </div>
              )}
            </div>
            {currentNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  isActive
                    ? 'text-[#E76F51] font-bold transition-colors'
                    : 'text-white hover:text-[#E76F51] transition-colors'
                }
              >
                {link.label}
              </NavLink>
            ))}
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
                    <button
                      onClick={handleGoToDashboard}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Dashboard
                    </button>
                    <button
                      onClick={handleEditProfile}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isLoading ? 'Loading...' : 'Edit Profile'}
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
                  className="text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center"
                  style={{ backgroundColor: '#DC5F12' }}
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
                    <button
                      onClick={handleGoToDashboard}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Dashboard
                    </button>
                    <button
                      onClick={handleEditProfile}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isLoading ? 'Loading...' : 'Edit Profile'}
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
              {/* Mobile User Type Selector */}
              <div className="px-3 py-2 border-b border-gray-600 mb-2">
                <div className="relative user-type-dropdown">
                  <button
                    onClick={() => setIsUserTypeDropdownOpen(!isUserTypeDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-full text-white hover:bg-gray-700 transition-colors"
                    style={{ border: '2px solid #ffffff', backgroundColor: 'rgba(31, 41, 55, 0.7)' }}
                  >
                    <span className="text-sm font-semibold">{userType}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${isUserTypeDropdownOpen ? 'rotate-180' : ''}`}
                        style={{ color: '#ffffff' }}
                      />
                    </div>
                  </button>
                  
                  {isUserTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg py-1 z-50" style={{ border: '2px solid #ffffff', outline: 'none' }}>
                      <button
                        onClick={() => {
                          handleUserTypeSelect('Tenant');
                          setIsUserTypeDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Tenant
                      </button>
                      <button
                        onClick={() => {
                          handleUserTypeSelect('Agent');
                          setIsUserTypeDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Agent
                      </button>
                      <button
                        onClick={() => {
                          handleUserTypeSelect('Home Owner');
                          setIsUserTypeDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Home Owner
                      </button>
                      <button
                        onClick={() => {
                          handleUserTypeSelect('Public worker');
                          setIsUserTypeDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Public worker
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Navigation Links */}
              {currentNavLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'block px-3 py-2 text-[#E76F51] font-bold'
                      : 'block px-3 py-2 text-white hover:text-[#E76F51] transition-colors'
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-600">
                  {loginError && (
                    <div className="mx-3 mb-3 bg-red-500 text-white p-2 rounded-md text-sm">
                      {loginError}
                    </div>
                  )}
                  <button
                    onClick={handleLogin}
                    className="mx-3 w-[calc(100%-1.5rem)] text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-all flex items-center justify-center"
                    style={{ backgroundColor: '#DC5F12' }}
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
