import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ContractModal from '../components/contract/ContractModal';
import { InteractiveHoverButton } from '../components/magic-ui/interactive-hover-button';
import { AnimatedList } from '../components/magic-ui/animated-list';
import { TextAnimate } from '../components/magic-ui/text-animate';
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
    <div className="min-h-screen font-archive">
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
            <TextAnimate
              className="text-3xl md:text-6xl font-bold font-archive leading-tight text-white"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              Know What You're Signing, Keep Proof
            </TextAnimate>
          </h3>

          {/* Subheading */}
          <TextAnimate
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-white"
            by="word"
            animation="fadeIn"
            startOnView={true}
            once={true}
          >
            Sign contracts digitally, store them safely, and share them when needed. All your rental documents in one place.
          </TextAnimate>

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
          {/* Text Section */}
          <div className="mb-12 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">
              Keep all your rental documents safe
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Sign contracts digitally, store them safely, and share them when needed. No more printing, scanning, or searching for lost papers.
            </p>
          </div>

          {/* Bento Grid Section */}
          <div className="mb-12">
            <BentoGrid className="max-w-7xl mx-auto">
              <BentoCard
                name="Secure Digital Storage"
                className="col-span-2 cursor-pointer border-2 border-white bg-[#E3F2FD]"
                background={
                  <>
                    {/* Magic UI Animated List with secure storage images */}
                    <div className="absolute top-4 right-4 w-40 md:w-64 opacity-80">
                      <AnimatedList delay={1500} className="w-full -space-y-3">
                        <img
                          key="secure-digital-1"
                          src="/images/Secure digital1.png"
                          alt="Secure digital storage illustration 1"
                          className="w-full h-auto object-contain"
                          loading="lazy"
                        />
                        <img
                          key="secure-digital-2"
                          src="/images/Secure digital2.png"
                          alt="Secure digital storage illustration 2"
                          className="w-full h-auto object-contain"
                          loading="lazy"
                        />
                        <img
                          key="secure-digital-3"
                          src="/images/Secure digital3.png"
                          alt="Secure digital storage illustration 3"
                          className="w-full h-auto object-contain"
                          loading="lazy"
                        />
                        <img
                          key="secure-digital-4"
                          src="/images/Secure digital4.png"
                          alt="Secure digital storage illustration 4"
                          className="w-full h-auto object-contain"
                          loading="lazy"
                        />
                      </AnimatedList>
                    </div>
                  </>
                }
                Icon={Lock}
                iconClassName="text-[#136C9E]"
                description="All your rental documents are saved in one safe place. Access them from anywhere, anytime—no more lost paperwork."
                href="#"
                cta="Get started"
                onClick={handleGetStarted}
              />
              <BentoCard
                name="Instant Notifications"
                className="col-span-1 border-2 border-white"
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
                iconClassName="text-blue-600"
                description="Get notified when contracts are signed, documents are ready, or when you need to take action. Stay on top of everything."
                href="#"
                cta="Get started"
                onClick={handleGetStarted}
              />
              {/* Swapped contents of Fast Digital Signing and Easy Collaboration cards */}
              <BentoCard
                name="Easy Collaboration"
                className="col-span-1 border-2 border-white"
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
                iconClassName="text-purple-600"
                description="Share contracts instantly with tenants, landlords, and agents. Everyone sees the same thing, no confusion."
                href="#"
                cta="Get started"
                onClick={handleGetStarted}
              />
              <BentoCard
                name="Fast Digital Signing"
                className="col-span-2 border-2 border-white"
                background={
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5" />
                    {/* Signed document image in lower-right, clipped by card */}
                    <div className="absolute -bottom-6 -right-6 w-80 md:w-96 opacity-90">
                      <img
                        src="/images/Signdocumentimg.png"
                        alt="Signed document illustration"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  </>
                }
                Icon={FileCheck}
                iconClassName="text-green-600"
                description={
                  <>
                    Sign contracts in minutes, not days. No printing or scanning needed.
                    <br />
                    Complete everything from your phone or computer.
                  </>
                }
                href="#"
                cta="Get started"
                onClick={handleGetStarted}
              />
            </BentoGrid>
          </div>

          {/* Call-to-action button beneath Bento Grid */}
          <div>
            <button
              onClick={handleGetStarted}
              className="bg-[#E76F51] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all text-lg font-medium"
            >
              Get started
            </button>
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
