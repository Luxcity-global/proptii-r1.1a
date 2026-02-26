import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, FolderKanban, Search, X } from 'lucide-react';
import { TextAnimate } from '../components/magic-ui/text-animate';
import { setOnboardingCompleted } from '../utils/onboardingSession';

const textStyle = { fontFamily: 'Archivo, sans-serif', color: '#374957' };

const HomeownerOnboardingOptions: React.FC = () => {
  const navigate = useNavigate();
  const [showResumeModal, setShowResumeModal] = useState(false);

  const handleCloseClick = () => setShowResumeModal(true);
  const handleResumeModalDismiss = () => {
    setShowResumeModal(false);
    setOnboardingCompleted();
    navigate('/');
  };

  const handleScheduleMaintenance = () => {
    localStorage.setItem('userRole', 'homeowner');
    localStorage.setItem('startScheduleMaintenanceTour', '1');
    navigate('/homeowner/dashboard?startScheduleMaintenanceTour=1');
  };

  const handleCreateProject = () => {
    localStorage.setItem('userRole', 'homeowner');
    localStorage.setItem('startCreateProjectTour', '1');
    navigate('/homeowner/dashboard?startCreateProjectTour=1');
  };

  const handleFindVendor = () => {
    localStorage.setItem('userRole', 'homeowner');
    localStorage.setItem('startFindVendorTour', '1');
    navigate('/homeowner/dashboard?startFindVendorTour=1');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 md:px-10 md:py-16 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url(/images/addtenbg.png)', ...textStyle }}
    >
      {/* Close button: top-right of page */}
      <button
        type="button"
        onClick={handleCloseClick}
        className="fixed top-6 right-6 md:top-8 md:right-10 z-20 p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-white/80 transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" strokeWidth={2} />
      </button>

      {/* Resume modal: only when user clicked close */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 flex items-center justify-center">
              <img src="/images/scout1.png" alt="Proptii guide" className="w-28 h-28 object-contain" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={textStyle}>
                You can come back anytime
              </h2>
              <p className="text-sm text-[#4B5563] mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                You can pick up this process again from your dashboard. Look for the getting started area when you sign in.
              </p>
              <button
                type="button"
                onClick={handleResumeModalDismiss}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: '#136C9E' }}
              >
                Okay, I understand
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-0">
        {/* Left: illustration */}
        <div className="flex-shrink-0 w-full md:w-auto md:max-w-[320px] flex justify-center md:justify-end">
          <img
            src="/images/onboard%20que.png"
            alt=""
            className="w-56 md:w-72 h-auto object-contain object-bottom"
          />
        </div>
        {/* Right: question card */}
        <div className="w-full max-w-4xl rounded-3xl border-2 border-[#A3CEF7] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-6 py-8 md:px-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-left" style={textStyle}>
            <TextAnimate
              className="text-2xl md:text-3xl font-bold text-left"
              by="word"
              animation="fadeIn"
              startOnView={true}
              once={true}
            >
              Great, you&apos;re a homeowner
            </TextAnimate>
          </h1>
          <p className="text-[#6b7280] text-sm md:text-base mb-6 text-left" style={{ fontFamily: 'Archivo, sans-serif' }}>
            <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
              What would you like to do first?
            </TextAnimate>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Option 1: Schedule maintenance */}
            <button
              type="button"
              onClick={handleScheduleMaintenance}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E8F3FF] text-[#136C9E] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <Wrench className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Schedule maintenance
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  Add maintenance tasks, set reminders, and keep your home in great shape.
                </p>
              </div>
            </button>

            {/* Option 2: Create project */}
            <button
              type="button"
              onClick={handleCreateProject}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ECFDF3] text-[#15803D] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <FolderKanban className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Create project
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  Track home improvement projects and manage contractors.
                </p>
              </div>
            </button>

            {/* Option 3: Find a vendor */}
            <button
              type="button"
              onClick={handleFindVendor}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF1E7] text-[#E65D24] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <Search className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Find a vendor
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  Search for trusted local tradespeople through our curated directory.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeownerOnboardingOptions;
