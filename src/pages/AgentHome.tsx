import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';

// Add preload link for the hero image
const heroImageUrl = '/images/hero-agent-happy-couple.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const AgentHome = () => {
  const navigate = useNavigate();

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  return (
    <div className="min-h-screen font-nunito">
      <Navbar isAgent={true} />

      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Happy couple with agent"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
          {/* User Type Selection */}
          <div className="mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <Link
                to="/"
                className="px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                Tenant
              </Link>
              <button className="px-8 py-3 rounded-full bg-[#FFEFD4] text-black font-semibold transition-all">
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight">
            List Your Properties
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
            Streamline your property listings and reach more potential tenants.
          </p>

          {/* Start New Listing Button */}
          <Link
            to="/listings/new"
            className="inline-block px-8 py-4 bg-[#FFEFD4] text-black rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            Start New Listing
          </Link>
        </div>
      </section>

      {/**The new services section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0]">
        {/* Background Image (Blobs) */}
        <img
          src="/images/middle-section.png"
          alt="Decorative background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          loading="lazy"
          sizes="100vw"
        />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Book Viewing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/viewing-room.jpg"
                  alt="Modern living room"
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Book Viewing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
              </p>
              <button
                onClick={() => navigate('/bookviewing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Referencing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/referencing-person.jpg"
                  alt="Professional woman with tablet"
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Referencing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
              </p>
              <button
                onClick={() => navigate('/referencing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Contract Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/modern-building.jpg"
                  alt="Modern glass building"
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Contract</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
              </p>
              <button
                onClick={() => navigate('/contracts')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/**End of the new services section */}

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AgentHome; 
