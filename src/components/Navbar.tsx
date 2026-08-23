import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut, Menu, X, Home as HomeIcon, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, login, logout, editProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNavMode, setActiveNavMode] = useState<'search' | 'manage'>('search');

  // Sync active mode with current pathname
  useEffect(() => {
    if (location.pathname.includes('/landlord') || location.pathname.includes('/agent') || location.pathname.includes('/listings')) {
      setActiveNavMode('manage');
    } else {
      setActiveNavMode('search');
    }
  }, [location.pathname]);

  // Close dropdown on click outside
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isMobileMenuOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleEditProfile = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    try {
      await editProfile();
    } catch (error) {
      console.error('Error in editProfile:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-40 font-nunito">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii"
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center: Frosted Glassmorphism Dual-Mode Toggle Pill (Matches Reference UI) */}
          <div className="hidden md:flex items-center justify-center">
            <div className="bg-white/15 backdrop-blur-md p-1 rounded-full border border-white/25 shadow-lg flex items-center gap-1">
              
              {/* Option 1: Search Properties Free */}
              <button
                type="button"
                onClick={() => {
                  setActiveNavMode('search');
                  navigate('/');
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeNavMode === 'search'
                    ? 'bg-gradient-to-r from-[#4CA1D0]/90 to-[#2A7BAA]/90 text-white shadow-md border border-white/40'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <HomeIcon className="w-4 h-4 text-white" />
                <span>Search Properties Free</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/80" />
              </button>

              {/* Option 2: List & Manage Properties */}
              <button
                type="button"
                onClick={() => {
                  setActiveNavMode('manage');
                  navigate('/referencing');
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeNavMode === 'manage'
                    ? 'bg-gradient-to-r from-[#4CA1D0]/90 to-[#2A7BAA]/90 text-white shadow-md border border-white/40'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building2 className="w-4 h-4 text-white" />
                <span>List & Manage Properties</span>
              </button>

            </div>
          </div>

          {/* Right Action: Sign In Button or User Avatar */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 transition-all"
                >
                  <UserCircle className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold">{user?.name || user?.username || 'Account'}</span>
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-150 text-left">
                    <button
                      onClick={handleEditProfile}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 w-full text-left disabled:opacity-50"
                    >
                      <Settings className="w-4 h-4 mr-2.5 text-gray-500" />
                      {isLoading ? 'Loading...' : 'Edit Profile'}
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-full bg-[#F15A22] hover:bg-[#D54A1A] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center space-x-2">
            {!isAuthenticated && (
              <button
                onClick={login}
                className="px-4 py-1.5 rounded-full bg-[#F15A22] text-white font-bold text-xs shadow-md"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mt-2 shadow-2xl text-white">
            <div className="space-y-2 pb-3 border-b border-gray-700">
              <button
                onClick={() => {
                  navigate('/');
                  closeMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold flex items-center gap-2"
              >
                <HomeIcon className="w-4 h-4 text-[#F15A22]" />
                Search Properties Free
              </button>
              <button
                onClick={() => {
                  navigate('/referencing');
                  closeMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-gray-200 text-sm font-semibold flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-[#136C9E]" />
                List & Manage Properties
              </button>
            </div>

            <div className="py-2 space-y-1">
              <Link
                to="/referencing"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10"
              >
                Referencing
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="pt-3 border-t border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-400 text-sm font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </header>
  );
};

export default Navbar;