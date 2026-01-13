import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import ReferencingModal from '../components/ReferencingModal.OLD';
import ReviewModal from '../components/ReviewModal';
import DocumentChecklistModal from '../components/DocumentChecklistModal';
import { InteractiveHoverButton } from '../components/magic-ui/interactive-hover-button';
import { TextAnimate } from '../components/magic-ui/text-animate';
import { DotPattern } from '../components/magic-ui/dot-pattern';
import { AnimatedList } from '../components/magic-ui/animated-list';


// Add preload link for the hero image
const heroImageUrl = '/images/pablo-merchan-montes-wYOPqmtDD0w-unsplash.jpg';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const Referencing = () => {
  const { isAuthenticated, login, user } = useAuth();
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      // Redirect to login or trigger login modal
      login();
      return;
    }

    const shouldSkipChecklist = localStorage.getItem('skipDocumentChecklist') === 'true';
    if (shouldSkipChecklist) {
      setIsReferencingModalOpen(true);
    } else {
      setIsChecklistModalOpen(true);
    }
  };

  const handleChecklistComplete = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsReferencingModalOpen(true);
  };

  const handleSubmissionComplete = () => {
    // Show review modal after referencing modal is closed
    setIsReviewModalOpen(true);
  };

  const handleReviewModalClose = () => {
    setIsReviewModalOpen(false);
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section - always visible regardless of authentication status */}
      <section className="h-[80vh] relative flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Family enjoying dinner together"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center w-full">
          {/* Main Heading */}
          <h3 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight text-white">
            <TextAnimate
              className="text-3xl md:text-6xl font-bold font-archive leading-tight text-white block"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              Show Agents You're a Serious Tenant
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
            Build a tenant profile that proves you're credible. Share it with agents so they take you seriously—without the back-and-forth.
          </TextAnimate>

          <InteractiveHoverButton
            onClick={handleGetStarted}
            className="bg-transparent text-[#DC5F12] px-10 py-4 rounded-full hover:bg-[#DC5F12] hover:text-white text-xl font-medium border-2"
            style={{ 
              borderColor: '#DC5F12'
            }}
          >
            {isAuthenticated ? 'Start Referencing' : 'Get Started'}
          </InteractiveHoverButton>
        </div>
      </section>

      {/* Steps Section */}
      <section className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24 px-4 md:px-8 min-h-[600px] flex items-center justify-center" style={{ backgroundImage: "url('/images/Referencing.png')" }}>
        {/* Container with spacing */}
        <div className="relative container mx-auto flex flex-col md:flex-row items-start gap-8 md:gap-12 w-full overflow-hidden" style={{ backgroundColor: 'rgba(247, 247, 247, 0.5)', minHeight: '500px', padding: '2rem', paddingLeft: '4rem', maxWidth: '90%', borderRadius: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <DotPattern className="opacity-30" />
          {/* Left Section - Text Content */}
          <div className="w-full md:w-2/5 space-y-6 md:space-y-10 text-center md:text-left md:absolute md:top-1/2 md:-translate-y-1/2 md:left-48 md:rounded-lg md:p-6 relative z-50">
            <h2 className="text-2xl md:text-3xl font-bold text-[#136C9E] leading-tight">
              All your referencing in one place
            </h2>
            <TextAnimate
              className="text-gray-600 text-base md:text-lg leading-relaxed"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              No more chasing employers or guarantors. We collect your details, reach out to your referees, and share everything with agents. Less work for you, faster results.
            </TextAnimate>
            <InteractiveHoverButton
              onClick={handleGetStarted}
              className="bg-transparent text-[#DC5F12] font-medium px-6 py-3 rounded-full hover:bg-[#DC5F12] hover:text-white shadow-md hover:shadow-lg border-2"
              style={{ 
                borderColor: '#DC5F12'
              }}
            >
              {isAuthenticated ? 'Start Referencing' : 'Get Started'}
            </InteractiveHoverButton>
          </div>

          {/* Right Section - Animated List */}
          <div className="w-full md:w-1/2 md:ml-auto flex justify-center items-center self-center">
            <div className="w-full max-w-sm md:max-w-md">
              <AnimatedList delay={1500} className="w-full gap-6">
                <img
                  key="referencing-list-4"
                  src="/images/referencing list 4.png"
                  alt="Referencing step 4"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
                <img
                  key="referencing-list-3"
                  src="/images/referencing list 3.png"
                  alt="Referencing step 3"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
                <img
                  key="referencing-list-2"
                  src="/images/referencing list 2.png"
                  alt="Referencing step 2"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
                <img
                  key="referencing-list-1"
                  src="/images/referencing list 1.png"
                  alt="Referencing step 1"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </AnimatedList>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <Footer />

      {/* Document Checklist Modal */}
      <DocumentChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onGetStarted={handleChecklistComplete}
      />

      {/* Referencing Modal */}
      <ReferencingModal
        isOpen={isReferencingModalOpen}
        onClose={() => setIsReferencingModalOpen(false)}
        onSubmissionComplete={handleSubmissionComplete}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleReviewModalClose}
        userType="tenant"
        userId={user?.id}
        userEmail={user?.email}
        source="referencing_completion"
      />
    </div>
  );
};

export default Referencing; 
