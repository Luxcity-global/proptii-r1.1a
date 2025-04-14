import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';

const AgentHome = () => {
  const navigate = useNavigate();

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
<section className="relative py-20 bg-[#f9f5f0]">
  {/* Background Image (Blobs) */}
  <img 
    src="/images/middle-section.png" 
    alt="Decorative background"
    className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
  />

  <div className="max-w-7xl mx-auto px-4 relative z-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Book Viewing Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/viewing-room.jpg"
            alt="Modern living room"
            className="w-full h-64 object-cover rounded-2xl"
            style={{ objectPosition: 'center 30%' }}
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Book Viewing</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
        </p>
        <button 
        onClick={() => navigate('/bookviewing')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
          Learn More
        </button>
      </div>

      {/* Referencing Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/referencing-person.jpg"
            alt="Professional woman with tablet"
            className="w-full h-64 object-cover rounded-2xl"
            style={{ objectPosition: 'center 20%' }}
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Referencing</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
        </p>
        <button 
        onClick={() => navigate('/referencing')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
          Learn More
        </button>
      </div>

      {/* Contract Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/modern-building.jpg"
            alt="Modern glass building"
            className="w-full h-64 object-cover rounded-2xl"
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Contract</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
        </p>
        <button 
        onClick={() => navigate('/contracts')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
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