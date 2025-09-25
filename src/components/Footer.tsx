/*import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';*/
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedinIn,
  faInstagram,
  faTiktok,
  faYoutube,
  faDribbble
} from "@fortawesome/free-brands-svg-icons";
//import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';


//const navigate = useNavigate();

function Footer() {
  const [openSections, setOpenSections] = useState({
    home: false,
    company: false,
    contact: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer className="bg-[#0F2537] text-white">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Branding Section */}
        <div className="px-6 py-8 text-center">
          <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-12 mx-auto mb-4" />
          <p className="text-sm opacity-75 max-w-sm mx-auto">
            Revolutionizing real estate with AI to streamline the journey from
            discovery to completion for renters and buyers.
          </p>
        </div>

        {/* Collapsible Sections */}
        <div className="border-t border-gray-700">
          {/* Home Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('home')}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-[#2C5B81] hover:bg-[#3A6B91] transition-colors"
            >
              <span className="text-lg font-semibold">Home</span>
              {openSections.home ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {openSections.home && (
              <div className="px-6 py-4 bg-[#1A3A4F]">
                <ul className="space-y-3 text-sm opacity-75">
                  <li>
                    <Link to="/bookviewing" className="block py-1 hover:underline">
                      Book Viewings
                    </Link>
                  </li>
                  <li>
                    <Link to="/referencing" className="block py-1 hover:underline">
                      Referencing
                    </Link>
                  </li>
                  <li>
                    <Link to="/contracts" className="block py-1 hover:underline">
                      Contracts
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Company Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('company')}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-[#2C5B81] hover:bg-[#3A6B91] transition-colors"
            >
              <span className="text-lg font-semibold">Company</span>
              {openSections.company ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {openSections.company && (
              <div className="px-6 py-4 bg-[#1A3A4F]">
                <ul className="space-y-3 text-sm opacity-75">
                  <li>
                    <Link to="/about-us" className="block py-1 hover:underline">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="block py-1 hover:underline">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy-policy" className="block py-1 hover:underline">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="block py-1 hover:underline">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-[#2C5B81] hover:bg-[#3A6B91] transition-colors"
            >
              <span className="text-lg font-semibold">Contact</span>
              {openSections.contact ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {openSections.contact && (
              <div className="px-6 py-4 bg-[#1A3A4F]">
                <ul className="space-y-3 text-sm opacity-75">
                  <li>
                    <a href="mailto:contactus@luxcity.co.uk" className="block py-1 hover:underline">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="px-6 py-6 text-center">
          <div className="flex justify-center space-x-4 mb-6">
            <a href="https://www.youtube.com" className="w-12 h-12 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl hover:bg-[#2C5B81] transition-colors">
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a href="https://www.instagram.com/luxcity_tech/" className="w-12 h-12 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl hover:bg-[#2C5B81] transition-colors">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://www.linkedin.com/company/luxcity-global/?viewAsMember=true" className="w-12 h-12 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl hover:bg-[#2C5B81] transition-colors">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a href="#" className="w-12 h-12 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl hover:bg-[#2C5B81] transition-colors">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
            <a href="#" className="w-12 h-12 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl hover:bg-[#2C5B81] transition-colors">
              <FontAwesomeIcon icon={faDribbble} />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm opacity-75">
            Copyright 2024, All Rights Reserved by Proptii
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
          {/* Branding Section */}
          <div className="max-w-sm">
            <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-12 mb-4" />
            <p className="text-sm opacity-75">
              Revolutionizing real estate with AI to streamline the journey from
              discovery to completion for renters and buyers.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="text-lg font-semibold mb-3">Home</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li>
                  <Link to="/bookviewing" className="hover:underline">
                    Book Viewings
                  </Link>
                </li>
                <li>
                  <Link to="/referencing" className="hover:underline">
                    Referencing
                  </Link>
                </li>
                <li>
                  <Link to="/contracts" className="hover:underline">
                    Contracts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li>
                  <Link to="/about-us" className="hover:underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm opacity-75">
                <li><a href="mailto:contactus@luxcity.co.uk">Contact Us</a></li>
                <li>
                  <Link to="/terms-of-service" className="hover:underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Horizontal Line */}
        <hr className="border-gray-700 my-6" />

        {/* Footer Bottom Section */}
        <div className="flex justify-between items-center max-w-6xl mx-auto text-sm opacity-75">
          <p>&copy; 2025, All Rights Reserved by Proptii</p>
          <div className="flex space-x-4">
            <a href="https://www.linkedin.com/company/luxcity-global/?viewAsMember=true" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
            <a href="https://www.instagram.com/luxcity_tech/" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
              <FontAwesomeIcon icon={faDribbble} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


export default Footer;