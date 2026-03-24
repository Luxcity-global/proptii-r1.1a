import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { navigateToAddPropertyOnboarding, navigateToLandlordClients } from '../utils/landlordAddPropertyNavigation';
import { navigateToComingSoon } from '../utils/comingSoonNavigation';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X, CalendarCheck, FileCheck, FileSignature, Home, Building2, Users, BarChart3, Shield, Sparkles } from 'lucide-react';

/** Routes that use the tenant service toggle (current page indicator + dropdown) instead of center nav links */
const TENANT_SERVICE_ROUTES = ['/bookviewing', '/referencing', '/contracts'] as const;
type TenantServiceRoute = (typeof TENANT_SERVICE_ROUTES)[number];

const TENANT_SERVICE_LABELS: Record<TenantServiceRoute, string> = {
  '/bookviewing': 'Book Viewing',
  '/referencing': 'Referencing',
  '/contracts': 'Contract',
};

const TENANT_SERVICE_MENU_ITEMS: { path: string; label: string; icon: React.ReactNode }[] = [
  { path: '/home-v2', label: 'Search Properties Free', icon: <Home className="h-4 w-4" /> },
  { path: '/bookviewing', label: 'Book Viewing', icon: <CalendarCheck className="h-4 w-4" /> },
  { path: '/referencing', label: 'Referencing', icon: <FileCheck className="h-4 w-4" /> },
  { path: '/contracts', label: 'Sign Contracts', icon: <FileSignature className="h-4 w-4" /> },
];

interface NavbarProps {
  isAgent?: boolean;
  hideServiceLinks?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isAgent = false, hideServiceLinks = false }) => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [activeServiceMode, setActiveServiceMode] = useState<'search' | 'list'>('search');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hoveredServiceItem, setHoveredServiceItem] = useState<number | null>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const serviceToggleRef = useRef<HTMLDivElement>(null);

  const pathname = location.pathname;
  const isTenantServiceRoute = TENANT_SERVICE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const currentServiceRoute = (TENANT_SERVICE_ROUTES.find((r) => pathname === r || pathname.startsWith(r + '/')) ?? '/bookviewing') as TenantServiceRoute;
  const currentServiceLabel = TENANT_SERVICE_LABELS[currentServiceRoute];

  const handleServiceModeSwitch = (mode: 'search' | 'list') => {
    if (mode === activeServiceMode) {
      setIsServiceDropdownOpen((o) => !o);
    } else {
      setActiveServiceMode(mode);
      setIsServiceDropdownOpen(true);
    }
    setHoveredServiceItem(null);
  };

  const searchServiceMenuItems = [
    { icon: <Home className="h-4 w-4" />, label: 'Search Properties', description: 'AI-powered property search', action: () => { setIsServiceDropdownOpen(false); navigate('/home-v2'); } },
    { icon: <CalendarCheck className="h-4 w-4" />, label: 'Book Viewings', description: 'Schedule and manage property viewings', action: () => { setIsServiceDropdownOpen(false); navigate('/bookviewing'); } },
    { icon: <FileCheck className="h-4 w-4" />, label: 'Referencing', description: 'Complete tenant referencing online', action: () => { setIsServiceDropdownOpen(false); navigate('/referencing'); } },
    { icon: <FileSignature className="h-4 w-4" />, label: 'Sign Contracts', description: 'Digital contract signing', action: () => { setIsServiceDropdownOpen(false); navigate('/contracts'); } },
  ];

  const listServiceMenuItems = [
    { icon: <Building2 className="h-4 w-4" />, label: 'List Property', description: 'Advertise your property to verified tenants', action: () => { setIsServiceDropdownOpen(false); navigateToAddPropertyOnboarding(navigate); } },
    { icon: <Users className="h-4 w-4" />, label: 'Manage Tenants', description: 'Tenant communication and management', action: () => { setIsServiceDropdownOpen(false); navigateToLandlordClients(navigate); } },
    { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytics', description: 'Track listing performance', action: () => { setIsServiceDropdownOpen(false); navigateToComingSoon(navigate, 'analytics'); } },
    { icon: <Shield className="h-4 w-4" />, label: 'Verify Tenants', description: 'Run background and credit checks', action: () => { setIsServiceDropdownOpen(false); navigateToComingSoon(navigate, 'verify-tenants'); } },
  ];

  const serviceMenuItems = activeServiceMode === 'search' ? searchServiceMenuItems : listServiceMenuItems;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
      if (isServiceDropdownOpen && serviceDropdownRef.current && !serviceDropdownRef.current.contains(target) && serviceToggleRef.current && !serviceToggleRef.current.contains(target)) {
        setIsServiceDropdownOpen(false);
        setHoveredServiceItem(null);
      }
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isServiceDropdownOpen, isMobileMenuOpen]);

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

          {/* Desktop Navigation: center – either three links OR tenant service toggle (middle) */}
          {!hideServiceLinks && !isTenantServiceRoute && (
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
          )}
          {/* Tenant service toggle in the middle (same two-sided design as home-v2) */}
          {!hideServiceLinks && isTenantServiceRoute && (
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative flex items-center justify-center">
                <div ref={serviceToggleRef} className="relative">
                  {/* Outer glow */}
                  <div
                    className="absolute -inset-1 rounded-full opacity-40 blur-lg pointer-events-none"
                    style={{
                      background:
                        activeServiceMode === 'search'
                          ? 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 100%)'
                          : 'linear-gradient(135deg, #E8D5B0 0%, #D4C4A0 100%)',
                    }}
                  />
                  {/* Glass container */}
                  <div
                    className="relative flex items-stretch rounded-full border border-white/[0.12] p-1"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {/* Search / Renters side (blue) – shows current page label */}
                    <button
                      type="button"
                      onClick={() => handleServiceModeSwitch('search')}
                      className="group relative flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={
                        activeServiceMode === 'search'
                          ? {
                              background: 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 80%, #357FB7 100%)',
                              color: '#FFFFFF',
                              boxShadow: '0 4px 16px rgba(107, 178, 232, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.15)',
                              transform: 'translateY(-1px)',
                            }
                          : { background: 'transparent', color: 'rgba(255, 255, 255, 0.55)' }
                      }
                      aria-pressed={activeServiceMode === 'search'}
                      aria-label={currentServiceLabel}
                    >
                      <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={2.5} />
                      <span className="whitespace-nowrap tracking-wide">{currentServiceLabel}</span>
                      <ChevronDown
                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-all duration-300 ${
                          activeServiceMode === 'search' && isServiceDropdownOpen ? 'rotate-180 opacity-100' : activeServiceMode === 'search' ? 'opacity-70' : 'opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                      {activeServiceMode === 'search' && (
                        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
                      )}
                    </button>
                    <div className="my-1.5 w-px bg-white/10 shrink-0" aria-hidden />
                    {/* List / Landlords side (gold) */}
                    <button
                      type="button"
                      onClick={() => handleServiceModeSwitch('list')}
                      className="group relative flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={
                        activeServiceMode === 'list'
                          ? {
                              background: 'linear-gradient(135deg, #F5E6CC 0%, #E8D5B0 80%, #DBC8A0 100%)',
                              color: '#3D2E1A',
                              boxShadow: '0 4px 16px rgba(232, 213, 176, 0.35), 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.05)',
                              transform: 'translateY(-1px)',
                            }
                          : { background: 'transparent', color: 'rgba(255, 255, 255, 0.55)' }
                      }
                      aria-pressed={activeServiceMode === 'list'}
                      aria-label="List & Manage Properties"
                    >
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={2.5} />
                      <span className="whitespace-nowrap tracking-wide">List &amp; Manage Properties</span>
                      <ChevronDown
                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-all duration-300 ${
                          activeServiceMode === 'list' && isServiceDropdownOpen ? 'rotate-180 opacity-100' : activeServiceMode === 'list' ? 'opacity-70' : 'opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                      {activeServiceMode === 'list' && (
                        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                      )}
                    </button>
                  </div>
                </div>
                {/* Contextual dropdown – same design as home-v2, centered below pill */}
                {isServiceDropdownOpen && (
                  <div
                    ref={serviceDropdownRef}
                    className="absolute left-1/2 top-full z-50 mt-3 w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 overflow-hidden"
                    style={{
                      opacity: 1,
                      transform: 'translateX(-50%) translateY(0) scale(1)',
                      transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-2xl border border-white/[0.1]"
                      style={{
                        background: 'rgba(15, 15, 20, 0.75)',
                        backdropFilter: 'blur(40px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div
                        className="h-[2px] w-full"
                        style={{
                          background:
                            activeServiceMode === 'search'
                              ? 'linear-gradient(90deg, transparent, #6BB2E8, transparent)'
                              : 'linear-gradient(90deg, transparent, #E8D5B0, transparent)',
                        }}
                      />
                      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                        <Sparkles className="h-3.5 w-3.5" style={{ color: activeServiceMode === 'search' ? '#6BB2E8' : '#D4C090' }} />
                        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: activeServiceMode === 'search' ? 'rgba(107, 178, 232, 0.92)' : 'rgba(212, 192, 144, 0.8)' }}>
                          {activeServiceMode === 'search' ? 'For Renters & Buyers' : 'For Landlords & Agents'}
                        </p>
                      </div>
                      <div className="p-2">
                        {serviceMenuItems.map((item, index) => (
                          <button
                            key={`${activeServiceMode}-${index}`}
                            type="button"
                            onClick={item.action}
                            onMouseEnter={() => setHoveredServiceItem(index)}
                            onMouseLeave={() => setHoveredServiceItem(null)}
                            className="group relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all duration-200"
                            style={{
                              background:
                                hoveredServiceItem === index
                                  ? activeServiceMode === 'search'
                                    ? 'rgba(33, 71, 102, 0.12)'
                                    : 'rgba(232, 213, 176, 0.08)'
                                  : 'transparent',
                            }}
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all"
                              style={{
                                borderColor: hoveredServiceItem === index ? (activeServiceMode === 'search' ? 'rgba(33, 71, 102, 0.35)' : 'rgba(232, 213, 176, 0.2)') : 'rgba(255, 255, 255, 0.08)',
                                background: hoveredServiceItem === index ? (activeServiceMode === 'search' ? 'rgba(33, 71, 102, 0.18)' : 'rgba(232, 213, 176, 0.1)') : 'rgba(255, 255, 255, 0.04)',
                                color: hoveredServiceItem === index ? (activeServiceMode === 'search' ? '#6BB2E8' : '#E8D5B0') : 'rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white/90">{item.label}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-white/40">{item.description}</p>
                            </div>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: activeServiceMode === 'search' ? '#6BB2E8' : '#E8D5B0' }}>
                              <path d="M4.5 2.5L8 6L4.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/[0.06] px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsServiceDropdownOpen(false);
                            if (activeServiceMode === 'search') {
                              navigate('/home-v2');
                            } else {
                              navigateToAddPropertyOnboarding(navigate);
                            }
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition-all"
                          style={{
                            background: activeServiceMode === 'search' ? 'rgba(33, 71, 102, 0.15)' : 'rgba(232, 213, 176, 0.08)',
                            color: activeServiceMode === 'search' ? '#6BB2E8' : '#E8D5B0',
                            border: activeServiceMode === 'search' ? '1px solid rgba(33, 71, 102, 0.3)' : '1px solid rgba(232, 213, 176, 0.12)',
                          }}
                        >
                          {activeServiceMode === 'search' ? 'Get Started Free' : 'Start Listing Today'}
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 3L10 7L5 11" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
          )}

          {/* Desktop User Section */}
          <div className="hidden md:flex flex-shrink-0 items-center relative">
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
              {!hideServiceLinks && !isTenantServiceRoute && (
              <>
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
              </>
              )}
              {!hideServiceLinks && isTenantServiceRoute && (
                <>
                  <div className="px-3 py-2 text-white/80 text-sm">Current: <span className="font-semibold text-[#E76F51]">{currentServiceLabel}</span></div>
                  {TENANT_SERVICE_MENU_ITEMS.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        closeMobileMenu();
                        setIsServiceDropdownOpen(false);
                        navigate(item.path);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        pathname === item.path || (item.path !== '/home-v2' && pathname.startsWith(item.path))
                          ? 'text-[#E76F51] font-bold'
                          : 'text-white hover:text-[#E76F51] transition-colors'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </>
              )}

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
