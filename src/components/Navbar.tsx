import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, ChevronDown, Settings, LogOut } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, login, logout, editProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          
          <div className="flex-1 flex justify-center space-x-8">
            <Link to="/" className="text-white hover:text-gray-200 transition-colors">
              Home
            </Link>
            <Link to="/referencing" className="text-white hover:text-gray-200 transition-colors">
              Referencing
            </Link>
            <Link to="/bookviewing" className="text-white hover:text-gray-200 transition-colors">
            Book Viewing
            </Link>
            <Link to="/contracts" className="text-white hover:text-gray-200 transition-colors">
              Contracts
            </Link>
          </div>

          <div className="flex-shrink-0 relative">
            {isAuthenticated ? (
              <div className="relative">
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
                      onClick={() => {
                        editProfile();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;