import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ContractModal from '../components/contract/ContractModal';
import { InteractiveHoverButton } from '../components/magic-ui/interactive-hover-button';
import { BentoGrid, BentoCard } from '../components/ui/bento-grid';
import { FileText, Shield, Share2, Zap, CheckCircle, Lock, Clock, FileCheck, Users } from 'lucide-react';
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

          <InteractiveHoverButton
            onClick={handleGetStarted}
            className="bg-primary text-white border-primary hover:bg-opacity-90 text-xl font-medium"
          >
            {isAuthenticated ? 'Start Contracts' : 'Get Started'}
          </InteractiveHoverButton>
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

        {/* Coming Soon Overlay 
        <div className="absolute inset-0 z-20 bg-black bg-opacity-70 flex flex-col items-center justify-center px-4">
          <h3 className="text-3xl md:text-4xl lg:text-6xl text-white font-bold mb-4 animate-pulse text-center">
            Coming Soon
          </h3>
          <div className="typing-text max-w-sm md:max-w-md lg:max-w-lg mx-auto">
            <p className="text-base md:text-lg lg:text-xl text-white opacity-80 text-center px-2">
              We're working hard to bring you this feature
            </p>
          </div>
        </div> */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:pl-14">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
            <div className="md:w-full text-left space-y-14">
              <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">Securely store rental documents.</h2>
              <p className="text-lg text-gray-600">
                Our platform lets tenants sign contracts digitally, store them safely, and share instantly with landlords or agents—no more printing, scanning, or searching.
              </p>
              <button
                onClick={handleGetStarted}
                className="bg-[#E76F51] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all text-lg font-medium"
              >
                Get started
              </button>
            </div>
          </div>

          {/* Bento Grid Section */}
          <div className="mt-20">
            <BentoGrid className="max-w-7xl mx-auto">
              <BentoCard
                name="Secure Digital Storage"
                className="col-span-2 cursor-pointer"
                background={
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    {/* File previews in background */}
                    <div className="absolute right-4 top-4 opacity-20">
                      <div className="bg-white/50 rounded-lg p-2 mb-2 text-xs">
                        <div className="font-semibold">rental_agreement.pdf</div>
                        <div className="text-gray-500">Encrypted & secure</div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-xs">
                        <div className="font-semibold">lease_contract.pdf</div>
                        <div className="text-gray-500">Safely stored</div>
                      </div>
                    </div>
                  </>
                }
                Icon={Lock}
                description="All your rental documents are automatically saved and encrypted. Access them securely from anywhere, anytime—no more lost paperwork."
                href="#"
                cta="View documents"
                onClick={handleGetStarted}
              />
              <BentoCard
                name="Instant Notifications"
                className="col-span-1"
                background={
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5" />
                    {/* Notification items */}
                    <div className="absolute top-4 left-4 right-4 space-y-2 opacity-60">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                        <span className="text-gray-700">Contract signed · 5m ago</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-700">Tenant approved · 10m ago</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700">Document ready · 15m ago</span>
                      </div>
                    </div>
                  </>
                }
                Icon={Zap}
                description="Stay updated in real-time. Get instant alerts when contracts are signed, documents are ready, or actions are needed."
                href="#"
                cta="View all"
              />
              <BentoCard
                name="Fast Digital Signing"
                className="col-span-1"
                background={
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5" />
                    {/* Signing visual */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 opacity-40">
                      <FileCheck className="w-8 h-8 text-green-600" />
                      <Clock className="w-6 h-6 text-green-500" />
                    </div>
                  </>
                }
                Icon={FileCheck}
                description="Sign contracts in minutes, not days. No printing, scanning, or mailing required. Complete agreements instantly from any device."
                href="#"
                cta="Get started"
              />
              <BentoCard
                name="Easy Collaboration"
                className="col-span-2"
                background={
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/5" />
                    {/* Collaboration visual */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-60">
                      <Users className="w-6 h-6 text-purple-600" />
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
                      </div>
                    </div>
                  </>
                }
                Icon={Users}
                description="Share contracts instantly with tenants, landlords, and agents. Everyone stays in sync with real-time updates and seamless collaboration."
                href="#"
                cta="Start sharing"
              />
            </BentoGrid>
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
