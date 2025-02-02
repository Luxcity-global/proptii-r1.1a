import React from 'react';

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <img
              src="/images/proptii-logo.png"
              alt="Proptii"
              className="h-12 w-auto"
            />
          </div>
          
          <div className="flex-1 flex justify-center space-x-8">
            <a href="#" className="text-white hover:text-gray-200 transition-colors">
              Book Viewing
            </a>
            <a href="#" className="text-white hover:text-gray-200 transition-colors">
              Referencing
            </a>
            <a href="#" className="text-white hover:text-gray-200 transition-colors">
              Contracts
            </a>
          </div>

          <div className="flex-shrink-0">
            <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all">
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;