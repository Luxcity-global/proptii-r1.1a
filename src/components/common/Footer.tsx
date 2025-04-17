import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://proptii.com/"
            className="text-primary hover:text-primary/80"
          >
            Proptii
          </a>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <Link to="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
          {' | '}
          <Link to="/terms" className="hover:text-primary">
            Terms of Service
          </Link>
          {' | '}
          <Link to="/contact" className="hover:text-primary">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}; 