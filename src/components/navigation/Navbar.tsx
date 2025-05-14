import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { Container } from '../layout/Container';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isMobile } = useResponsive();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="w-full bg-white shadow-md fixed md:absolute top-0 left-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/public/images/proptii-logo.png" alt="Proptii" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/listings" className="text-gray-600 hover:text-primary">
              Properties
            </Link>
            <Link to="/agents" className="text-gray-600 hover:text-primary">
              Agents
            </Link>
            <Link to="/about-us" className="text-gray-600 hover:text-primary">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary">
              Contact
            </Link>
            <Link
              to="/login"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="block md:hidden p-2 text-gray-600 hover:text-primary focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } md:hidden bg-white border-t border-gray-200 transition-all duration-300 ease-in-out`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/listings"
              className="block px-3 py-2 text-gray-600 hover:text-primary rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              to="/agents"
              className="block px-3 py-2 text-gray-600 hover:text-primary rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Agents
            </Link>
            <Link
              to="/about-us"
              className="block px-3 py-2 text-gray-600 hover:text-primary rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 text-gray-600 hover:text-primary rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/login"
              className="block px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar; 