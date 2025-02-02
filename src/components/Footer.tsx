import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-white font-bold text-2xl flex items-center mb-4">
              <Home className="w-6 h-6 mr-2" />
              proptii
            </div>
            <p className="text-gray-400">
              Revolutionizing real estate with AI to streamline the journey from discovery to completion for renters and buyers.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Home</h4>
            <ul className="space-y-2">
              <li><Link to="/referencing" className="text-gray-400 hover:text-white">Referencing</Link></li>
              <li><Link to="/book-viewing" className="text-gray-400 hover:text-white">Book Viewings</Link></li>
              <li><Link to="/contracts" className="text-gray-400 hover:text-white">Contracts</Link></li>
              <li><Link to="/how-it-works" className="text-gray-400 hover:text-white">How it works?</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white">About us</Link></li>
              <li><Link to="/reviews" className="text-gray-400 hover:text-white">Reviews</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
              <li><Link to="/career" className="text-gray-400 hover:text-white">Career</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li><Link to="/email" className="text-gray-400 hover:text-white">Email</Link></li>
              <li><Link to="/phone" className="text-gray-400 hover:text-white">Phone</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact us</Link></li>
              <li><Link to="/legal" className="text-gray-400 hover:text-white">Legal</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>Copyright 2024, All Rights Reserved by Proptii</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;