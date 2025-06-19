import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ContractModal from '../components/contract/ContractModal';
import '../styles/typing.css';

// Add preload link for the hero image
const heroImageUrl = '/images/01_Man_Woman_Office_BG.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const ContractsPage = () => {
  const { isAuthenticated, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleGetStarted = () => {
    // Commenting out authentication check for now
    // if (isAuthenticated) {
    setIsModalOpen(true);
    // } else {
    //   login();
    // }
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Business professionals in office setting"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center w-full">
          {/* Main Heading */}
          <h3 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight text-white">
            Rental Agreements Made Simple.<br />
          </h3>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white">
            Fast digital signing, safe storage, and effortless sharing.
          </p>

          <button
            className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
          >
            {isAuthenticated ? 'Start Contracts' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Contracts Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/Contract-bg.png"
            alt="Contracts background"
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-20 bg-black bg-opacity-70 flex flex-col items-center justify-center px-4">
          <h3 className="text-3xl md:text-4xl lg:text-6xl text-white font-bold mb-4 animate-pulse text-center">
            Coming Soon
          </h3>
          <div className="typing-text max-w-sm md:max-w-md lg:max-w-lg mx-auto">
            <p className="text-base md:text-lg lg:text-xl text-white opacity-80 text-center px-2">
              We're working hard to bring you this feature
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:pl-14 opacity-50">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-1/2 text-left space-y-14">
              <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">Securely store rental documents.</h2>
              <p className="text-lg text-gray-600">
                Our platform lets tenants sign contracts digitally, store them safely, and share instantly with landlords or agents—no more printing, scanning, or searching.
              </p>
              <button
                onClick={handleGetStarted}
                className="bg-[#E76F51] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all text-lg font-medium"
                disabled
              >
                Get started
              </button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
              <img
                src="/images/R 9.png"
                alt="Contract illustration"
                className="w-2.5/4 h-auto"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/*Contract Modal */}
      {isModalOpen && <ContractModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      <FAQSection />
      <Footer />

      {/* Contracts Modal
      <ContractsManagementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />*/}
    </div>
  );
};

export default ContractsPage;
