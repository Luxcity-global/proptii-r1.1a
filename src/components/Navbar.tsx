import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  isAgent?: boolean;
  hideServiceLinks?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

const Navbar: React.FC<NavbarProps> = ({ isAgent = false, hideServiceLinks = false, theme = 'auto' }) => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const pathname = location.pathname;
  const isLandlordUser = isAgent || (isAuthenticated && (user?.roles?.includes('landlord') || user?.roles?.includes('agent')));

  const isLight =
    theme === 'light' ||
    (theme !== 'dark' && (
      pathname.startsWith('/pricing') ||
      pathname.startsWith('/billing') ||
      pathname.startsWith('/account')
    ));

  // Compute 2-letter initials for polished avatar fallback
  const getInitials = (name?: string, email?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Render high-quality user avatar (photo if available, vibrant initial badge otherwise)
  const renderAvatar = (size: 'sm' | 'md' = 'sm') => {
    const isSm = size === 'sm';
    const sizeClasses = isSm ? 'w-7 h-7 text-[11px]' : 'w-10 h-10 text-sm';
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt={user.name || 'User'}
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-[#F15A22]/30 shadow-xs flex-shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#E8622A] via-[#F15A22] to-[#FF8A50] text-white flex items-center justify-center font-bold tracking-wider shadow-xs ring-2 ${
          isLight ? 'ring-white/90' : 'ring-white/30'
        } flex-shrink-0`}
      >
        {getInitials(user?.name, user?.email)}
      </div>
    );
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  // Reset login state whenever authentication completes
  useEffect(() => {
    if (isAuthenticated) {
      setLoginInProgress(false);
      setLoginError(null);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    let redirectUrl = '/login';
    if (pathname === '/' || pathname === '/home-v2' || pathname === '/home-legacy' || pathname === '/home') {
      redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
    navigate(redirectUrl);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    void editProfile();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigate to the correct dashboard based on user roles
  const handleGoToDashboard = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);

    if (user?.roles?.includes('landlord') || user?.roles?.includes('agent')) {
      navigate('/landlord');
    } else if (user?.roles?.includes('homeowner')) {
      navigate('/homeowner/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const dashboardRoute = isLandlordUser ? '/landlord' : '/dashboard';

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

          {/* Desktop Navigation: Direct functional links + Dashboard route (only when authenticated) */}
          {!hideServiceLinks && (
            <div className="hidden md:flex flex-1 justify-center items-center space-x-7">
              {isLandlordUser ? (
                <>
                  <NavLink
                    to="/landlord?start=property-setup-step1"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    List Property
                  </NavLink>
                  <NavLink
                    to="/bookviewing"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Book Viewing
                  </NavLink>

                  <NavLink
                    to="/contracts"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Contracts
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      isActive && pathname === '/'
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Search Properties
                  </NavLink>
                  <NavLink
                    to="/bookviewing"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Book Viewing
                  </NavLink>
                  <NavLink
                    to="/referencing"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Referencing
                  </NavLink>
                  <NavLink
                    to="/contracts"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-[#F15A22] font-bold text-sm tracking-wide transition-colors'
                        : isLight
                          ? 'text-[#14385C]/80 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                          : 'text-white/90 hover:text-[#F15A22] text-sm tracking-wide transition-colors'
                    }
                  >
                    Contracts
                  </NavLink>
                </>
              )}

              {/* Dashboard Route in the Navbar for authenticated users */}
              {isAuthenticated && (
                <NavLink
                  to={dashboardRoute}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-1.5 text-[#F15A22] font-bold text-sm tracking-wide px-3 py-1.5 rounded-full bg-[#F15A22]/10 border border-[#F15A22]/20 transition-colors'
                      : isLight
                        ? 'flex items-center gap-1.5 text-[#14385C] hover:text-[#F15A22] text-sm tracking-wide px-3 py-1.5 rounded-full bg-[#14385C]/5 border border-[#14385C]/10 hover:bg-[#14385C]/10 transition-all'
                        : 'flex items-center gap-1.5 text-white hover:text-[#F15A22] text-sm tracking-wide px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all'
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </NavLink>
              )}
            </div>
          )}

          {/* Desktop User Section */}
          <div className="hidden md:flex flex-shrink-0 items-center relative">
            {isAuthenticated ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2.5 focus:outline-none pl-1.5 pr-3.5 py-1.5 rounded-full transition-all group ${
                    isLight
                      ? 'bg-white/90 hover:bg-white text-[#14385C] hover:text-[#0E2B47] border border-[#14385C]/15 hover:border-[#14385C]/30 shadow-xs hover:shadow-sm backdrop-blur-md'
                      : 'bg-white/10 hover:bg-white/15 text-white hover:text-white/95 border border-white/20 hover:border-white/30 backdrop-blur-md'
                  }`}
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                >
                  {renderAvatar('sm')}
                  <span className="font-semibold text-sm max-w-[130px] truncate tracking-tight">
                    {user?.name || user?.givenName || 'User'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    } ${
                      isLight
                        ? 'text-[#14385C]/60 group-hover:text-[#14385C]'
                        : 'text-white/70 group-hover:text-white'
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl py-1.5 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center space-x-3">
                      {renderAvatar('md')}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.name || user?.givenName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleGoToDashboard}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#136C9E]" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleEditProfile}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors disabled:opacity-50"
                      >
                        <Settings className="w-4 h-4 mr-2.5 text-gray-500" />
                        {isLoading ? 'Loading...' : 'Edit Profile'}
                      </button>
                    </div>

                    <div className="h-px bg-gray-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {loginError && (
                  <div className="absolute right-0 -bottom-16 w-64 bg-red-500 text-white p-2 rounded-md text-sm shadow-lg">
                    {loginError}
                  </div>
                )}
                {/* Secondary CTA: Sign In */}
                <button
                  onClick={handleLogin}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center ${
                    isLight
                      ? 'text-[#14385C] hover:text-[#0E2B47] hover:bg-[#14385C]/5'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  disabled={isLoading || loginInProgress}
                >
                  {isLoading || loginInProgress ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Primary CTA: Sign Up */}
                <Link
                  to="/signup"
                  className="bg-[#F15A22] hover:bg-[#d94e1c] text-white px-5 py-2 rounded-full font-semibold text-sm transition-all flex items-center shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`focus:outline-none p-1 rounded-full transition-all ${
                    isLight
                      ? 'bg-white/80 border border-[#14385C]/15 shadow-xs'
                      : 'bg-white/10 border border-white/20'
                  }`}
                  aria-label="User menu"
                >
                  {renderAvatar('sm')}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-1.5 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center space-x-3">
                      {renderAvatar('md')}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.name || user?.givenName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleGoToDashboard}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#136C9E]" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleEditProfile}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors disabled:opacity-50"
                      >
                        <Settings className="w-4 h-4 mr-2.5 text-gray-500" />
                        {isLoading ? 'Loading...' : 'Edit Profile'}
                      </button>
                    </div>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`mobile-menu-button focus:outline-none p-2 rounded-xl transition-all ${
                isLight
                  ? 'text-[#14385C] bg-white/80 border border-[#14385C]/15 hover:bg-white shadow-xs'
                  : 'text-white bg-white/10 hover:bg-white/15'
              }`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu">
            <div className="px-3 pt-3 pb-4 space-y-1.5 bg-black/90 backdrop-blur-md rounded-2xl mt-2 border border-white/10 shadow-2xl">
              {!hideServiceLinks && (
                <>
                  {isLandlordUser ? (
                    <>
                      <NavLink
                        to="/landlord?start=property-setup-step1"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        List Property
                      </NavLink>
                      <NavLink
                        to="/bookviewing"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Book Viewing
                      </NavLink>

                      <NavLink
                        to="/contracts"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Contracts
                      </NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink
                        to="/"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive && pathname === '/'
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Search Properties
                      </NavLink>
                      <NavLink
                        to="/bookviewing"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Book Viewing
                      </NavLink>
                      <NavLink
                        to="/referencing"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Referencing
                      </NavLink>
                      <NavLink
                        to="/contracts"
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          isActive
                            ? 'block px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/5'
                            : 'block px-3 py-2 text-white/90 hover:text-[#F15A22] transition-colors'
                        }
                      >
                        Contracts
                      </NavLink>
                    </>
                  )}

                  {isAuthenticated && (
                    <NavLink
                      to={dashboardRoute}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        isActive
                          ? 'flex items-center gap-2 px-3 py-2 text-[#F15A22] font-bold rounded-lg bg-white/10'
                          : 'flex items-center gap-2 px-3 py-2 text-white hover:text-[#F15A22] transition-colors'
                      }
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </NavLink>
                  )}
                </>
              )}

              {!isAuthenticated && (
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                  {loginError && (
                    <div className="mx-2 mb-2 bg-red-500 text-white p-2 rounded-lg text-xs">
                      {loginError}
                    </div>
                  )}
                  {/* Primary CTA: Sign Up */}
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="w-full bg-[#F15A22] hover:bg-[#d94e1c] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center shadow-md active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>

                  {/* Secondary CTA: Sign In */}
                  <button
                    onClick={handleLogin}
                    className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center"
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
                      'Sign In'
                    )}
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
