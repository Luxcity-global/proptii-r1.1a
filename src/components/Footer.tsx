import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-gray-300 transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-gray-300 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-gray-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/referencing" className="hover:text-gray-300 transition-colors">
                  Referencing
                </Link>
              </li>
              <li>
                <Link to="/viewings" className="hover:text-gray-300 transition-colors">
                  Book Viewings
                </Link>
              </li>
              <li>
                <Link to="/contracts" className="hover:text-gray-300 transition-colors">
                  Contracts
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@proptii.com" className="hover:text-gray-300 transition-colors">
                  Email
                </a>
              </li>
              <li>
                <a href="tel:+44123456789" className="hover:text-gray-300 transition-colors">
                  Phone
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest updates and property news.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>Copyright 2024, All Rights Reserved by Proptii</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;