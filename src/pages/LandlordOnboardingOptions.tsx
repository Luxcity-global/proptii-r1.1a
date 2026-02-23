import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, UserPlus, FileSignature } from 'lucide-react';
import { TextAnimate } from '../components/magic-ui/text-animate';
import { useAuth } from '../contexts/AuthContext';

const textStyle = { fontFamily: 'Archivo, sans-serif', color: '#374957' };

const LandlordOnboardingOptions: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAddProperty = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startScreen', 'property-setup-step1');
      window.location.href = '/landlord/index.html?start=property-setup-step1';
    }
  };

  const handleAddTenant = () => {
    if (isAuthenticated) {
      navigate('/landlord?start=tenant-selection');
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('startScreen', 'tenant-selection');
        window.location.href = '/landlord/index.html?start=tenant-selection';
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 md:px-10 md:py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/addtenbg.png)', ...textStyle }}
    >
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
              Great, you&apos;re a landlord
            </TextAnimate>
          </h1>
          <p className="text-[#6b7280] text-sm md:text-base mb-6 text-left" style={{ fontFamily: 'Archivo, sans-serif' }}>
            <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
              What would you like to do first?
            </TextAnimate>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Option 1: Add Property */}
            <button
              type="button"
              onClick={handleAddProperty}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E8F3FF] text-[#136C9E] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <Home className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Add Property
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  Set up a new property, add details, amenities, and photos.
                </p>
              </div>
            </button>

            {/* Option 2: Add Tenant */}
            <button
              type="button"
              onClick={handleAddTenant}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ECFDF3] text-[#15803D] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Add Tenant
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  Add a tenant to a property and manage their tenancy details.
                </p>
              </div>
            </button>

            {/* Option 3: Send Contract */}
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/landlord?nav=contracts&openSendModal=1');
                } else {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('startScreen', 'contracts');
                    localStorage.setItem('openSendModal', '1');
                    window.location.href = '/landlord/index.html?nav=contracts&openSendModal=1';
                  }
                }
              }}
              className="group flex flex-col items-start gap-3 w-full px-5 py-5 rounded-3xl border-2 border-[#A3CEF7] bg-white/95 backdrop-blur-sm text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit' }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF1E7] text-[#E65D24] group-hover:bg-white/15 group-hover:text-white transition-colors">
                <FileSignature className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-1 text-[#111827] group-hover:text-white transition-colors">
                  Send Contract
                </h2>
                <p className="text-sm text-[#6B7280] group-hover:text-white transition-colors">
                  See how contracts work in Proptii and walk through a sample agreement.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordOnboardingOptions;
