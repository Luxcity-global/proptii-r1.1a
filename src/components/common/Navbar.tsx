import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img
              src="/images/proptii-logo.png"
              alt="Proptii"
              className="h-20  w-auto"
            />
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-white hover:text-gray-200 text-xl font-medium"
            >
              Home
            </Link>
            <Link
              to="/referencing"
              className="text-white hover:text-gray-200 text-xl font-medium"
            >
              Referencing
            </Link>
            <Link
              to="/book-viewing"
              className="text-white hover:text-gray-200 text-xl font-medium"
            >
              Book Viewing
            </Link>
            <Link
              to="/contracts"
              className="text-white hover:text-gray-200 text-xl font-medium"
            >
              Contracts
            </Link>
          </div>

          <div>
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-primary text-white px-6 py-2 rounded-full text-xl font-medium hover:bg-opacity-90"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-white px-6 py-2 rounded-full text-xl font-medium hover:bg-opacity-90"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 