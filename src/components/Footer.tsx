/*import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';*/
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faLinkedinIn, faTwitter, faYoutube, faDribbble } from "@fortawesome/free-brands-svg-icons";
//import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


//const navigate = useNavigate();

function Footer() {
  return (
    <footer className="bg-[#0F2537] text-white py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
        {/* Branding Section */}
        <div className="max-w-sm">
          <img src="/public/images/proptii-logo.png" alt="Proptii Logo" className="h-12 mb-4" />
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
              {/*<li>
                <button onClick={() => navigate('/bookviewing')} className="hover:underline">
                  Book Viewings
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/referencing')} className="hover:underline">
                  Referencing
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contracts')} className="hover:underline">
                  Contracts
                </button>
</li>*/}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li><a href="#">Email</a></li>
              <li><a href="#">Phone</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li><a href="#">About Us</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Horizontal Line */}
      <hr className="border-gray-700 my-6" />

      {/* Footer Bottom Section */}
      <div className="flex justify-between items-center max-w-6xl mx-auto text-sm opacity-75">
        <p>Copyright 2025, All Rights Reserved by Proptii &copy;</p>
        <div className="flex space-x-4">
          <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://www.linkedin.com/company/luxcity-global/?viewAsMember=true" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
            <FontAwesomeIcon icon={faLinkedinIn} />
          </a>
          <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="#" className="w-10 h-10 flex items-center justify-center border-2 border-[#2C5B81] rounded-full text-white text-xl opacity-100 hover:opacity-75">
            <FontAwesomeIcon icon={faDribbble} />
          </a>
        </div>
      </div>
    </footer>
  );
}


export default Footer;