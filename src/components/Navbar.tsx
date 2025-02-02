import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Camera, Search } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex-shrink-0">
            <div className="text-white font-bold text-2xl flex items-center">
              <Home className="w-6 h-6 mr-2" />
              proptii
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/book-viewing" className="text-white hover:text-gray-200">Book Viewing</Link>
            <Link to="/referencing" className="text-white hover:text-gray-200">Referencing</Link>
            <Link to="/contracts" className="text-white hover:text-gray-200">Contracts</Link>
            <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition">
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;