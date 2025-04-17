import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ContractModal from '../components/contract/ContractModal';


const ContractsPage = () => {
  const { isAuthenticated, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGetStarted = () => {
    // Commenting out authentication check for now
     if (isAuthenticated) {
    setIsModalOpen(true);
     } else {
       login();
     }
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />
      
      {/* Hero Section - always visible regardless of authentication status */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/01_Man_Woman_Office_BG.jpg" 
            alt="Family enjoying dinner together" 
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center w-full">
          {/* Main Heading */}
          <h3 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight text-white">
          Streamline Your Lease<br />
          Agreements
          </h3>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white">
            Save time and reduce errors with our contract management
            solution. We offer a range of customizable lease agreement
            templates to suit your specific needs.
          </p>

          <button
            onClick={handleGetStarted}
            className="bg-primary text-white px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-xl font-medium"
          >
            {isAuthenticated ? 'Start Contracts' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Contracts Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/Contract-bg.png" 
            alt="Contracts background" 
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:pl-14">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-1/2 text-left space-y-14">
              <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">Contracts</h2>
              <p className="text-lg text-gray-600">
                Invite your agent or landlord to submit your contract for review and signing. Upon signing, the contract will be forwarded to your agent and landlord, and a copy will be securely stored here for your records.
              </p>
              <button
                onClick={handleGetStarted}
                className="bg-[#E76F51] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all text-lg font-medium"
              >
                Get started
              </button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
              <img 
                src="/images/R 9.png" 
                alt="Contract illustration" 
                className="w-2.5/4 h-auto"
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
