import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';

const AgentHome = () => {
  return (
    <div className="min-h-screen font-nunito">
      <Navbar />
      
      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-agent-happy-couple.jpg"
            alt="Happy couple with agent"
            className="w-full h-full object-cover"
            loading="eager"
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
              <button className="px-8 py-3 rounded-full bg-[#FFEFD4] text-gray-900 font-semibold transition-all">
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-archive leading-tight">
            List Your Properties
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-nunito-sans" style={{ fontWeight: 400 }}>
            Streamline your property listings and reach more potential tenants.
          </p>

          {/* Start New Listing Button */}
          <Link
            to="/listings/new"
            className="inline-block px-8 py-4 bg-[#FFEFD4] text-gray-900 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            Start New Listing
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 font-archivo" style={{ color: '#DC5F12' }}>
            Our Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Viewings */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/viewing-room.jpg" 
                alt="Book Viewings" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Book Viewings</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Save time and effort with our Al-powered booking service. Simply enter your desired property details and let our system handle the rest.
                </p>
                <Link 
                  to="/book-viewing" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Referencing */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/referencing-person.jpg" 
                alt="Referencing" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Referencing</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
                </p>
                <Link 
                  to="/referencing" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Contracts */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/contracts-couple.jpg" 
                alt="Contracts" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Contracts</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
                </p>
                <Link 
                  to="/contracts" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AgentHome; 