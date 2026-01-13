import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import BookViewingModal from '../components/viewings/BookViewingModal';
import ReviewModal from '../components/ReviewModal';
import { bookViewingRequestService } from '../services/bookViewingRequestService';
import { AnimatedList } from '../components/magic-ui/animated-list';
import { InteractiveHoverButton } from '../components/magic-ui/interactive-hover-button';
import { TextAnimate } from '../components/magic-ui/text-animate';
import { DotPattern } from '../components/magic-ui/dot-pattern';

// PropertyDetails interface for prefilled data
interface PropertyDetails {
  id?: string;
  street: string;
  town: string;
  city: string;
  postcode: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}


const BookViewing = () => {
  const { isAuthenticated, login, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [prefilledPropertyData, setPrefilledPropertyData] = useState<PropertyDetails | null>(null);

  // Check for prefilled property data from search results
  useEffect(() => {
    const prefilledData = sessionStorage.getItem('prefilledProperty');
    if (prefilledData) {
      try {
        const parsedData = JSON.parse(prefilledData);
        setPrefilledPropertyData(parsedData);
        // Persist request to Firestore so Viewings page can source from it
        if (user?.id) {
          const writeDraftFallback = () => {
            try {
              const draftViewing = {
                id: `draft_${Date.now()}`,
                userId: user?.id || 'anonymous',
                propertyId: parsedData.id || 'unknown-property',
                property: {
                  street: parsedData.street,
                  town: parsedData.town,
                  city: parsedData.city,
                  postcode: parsedData.postcode,
                  agent: parsedData.agent
                },
                viewingDetails: { date: '', time: '', preference: 'In-Person Viewing', userDetails: { fullName: '', email: '', phoneNumber: '' } },
                status: 'pending'
              } as any;
              sessionStorage.setItem('draft_viewing', JSON.stringify(draftViewing));
            } catch (e) {
              console.warn('Failed to create draft viewing placeholder:', e);
            }
          };

          const managerInfo = {
            landlordId: parsedData.agent?.id || null,
            agentId: parsedData.agent?.id || null
          };

          bookViewingRequestService
            .saveRequest(
              user.id,
              parsedData.id || `property_${Date.now()}`,
              {
                street: parsedData.street,
                town: parsedData.town,
                city: parsedData.city,
                postcode: parsedData.postcode,
                agent: parsedData.agent
              },
              managerInfo
            )
            .then((r) => {
              if (r.success) {
                sessionStorage.setItem('book_viewing_request_id', r.requestId || '');
              } else {
                writeDraftFallback();
              }
            })
            .catch((e) => {
              console.warn('Failed to save book viewing request:', e);
              writeDraftFallback();
            });
        }
        
        // If user is authenticated, automatically open the modal
        if (isAuthenticated) {
          setIsModalOpen(true);
        }
        
        // Clear the sessionStorage after retrieving the data
        sessionStorage.removeItem('prefilledProperty');
      } catch (error) {
        console.error('Error parsing prefilled property data:', error);
        sessionStorage.removeItem('prefilledProperty');
      }
    }
  }, [isAuthenticated]);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsModalOpen(true);
  };

  const handleSubmissionComplete = () => {
    // Show review modal after viewing booking modal is closed
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
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Family enjoying dinner together"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-1"></div>
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
              Book Viewings Without the Back-and-Forth
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
            Share the listing and your preferred time. We contact the agent and confirm your appointment—so you can focus on finding the right place.
          </TextAnimate>

          <InteractiveHoverButton
            onClick={handleGetStarted}
            className="bg-transparent text-[#DC5F12] px-10 py-4 rounded-full hover:bg-[#DC5F12] hover:text-white text-xl font-medium border-2"
            style={{ 
              borderColor: '#DC5F12'
            }}
          >
            {isAuthenticated ? 'Start booking viewings' : 'Get Started'}
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
              Book viewings without endless calls
            </h2>
            <TextAnimate
              className="text-gray-600 text-base md:text-lg leading-relaxed"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              Share the listing link and your preferred date and time. We contact the agent and confirm your appointment. Less chasing, more time to find the right place.
            </TextAnimate>
            <InteractiveHoverButton
              onClick={handleGetStarted}
              className="bg-transparent text-[#DC5F12] font-medium px-6 py-3 rounded-full hover:bg-[#DC5F12] hover:text-white shadow-md hover:shadow-lg border-2"
              style={{ 
                borderColor: '#DC5F12'
              }}
            >
              {isAuthenticated ? 'Start booking viewings' : 'Get Started'}
            </InteractiveHoverButton>
          </div>

          {/* Right Section - Animated List */}
          <div className="w-full md:w-1/2 md:ml-auto flex justify-center items-center self-center">
            <div className="w-full max-w-sm md:max-w-md">
              <AnimatedList delay={1500} className="w-full gap-6">
                <img
                  key="input-list-3"
                  src="/images/Input list 3.png"
                  alt="Input list step 3"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
                <img
                  key="input-list-2"
                  src="/images/Input list 2.png"
                  alt="Input list step 2"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
                <img
                  key="input-list-1"
                  src="/images/Input list 1.png"
                  alt="Input list step 1"
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

      <BookViewingModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmissionComplete={handleSubmissionComplete}
        prefilledPropertyData={prefilledPropertyData}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleReviewModalClose}
        userType="tenant"
        userId={user?.id}
        userEmail={user?.email}
        source="viewing_completion"
      />
    </div>
  );
};

export default BookViewing;