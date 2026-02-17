import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, FileCheck, FileSignature, Sparkles, MoreHorizontal, Check, Search, UserPlus, Share2, Megaphone, User, Briefcase } from 'lucide-react';
import { TextAnimate } from '../magic-ui/text-animate';
import {
  getOrCreateAnonymousId,
  setOnboardingUserGroup,
  setOnboardingCompleted,
  setDiscoveryAnswer,
  type OnboardingUserGroup
} from '../../utils/onboardingSession';

type Step = 'welcome' | 'howUse' | 'howFind' | 'whoAreYou';

const HOW_USE_OPTIONS = [
  { id: 'find_rent', label: 'Find a place to rent', icon: Home },
  { id: 'manage_property', label: 'Manage my property', icon: Building2 },
  { id: 'get_referenced', label: 'Get referenced', icon: FileCheck },
  { id: 'sign_contracts', label: 'Sign contracts', icon: FileSignature },
  { id: 'search_ai', label: 'Search with AI', icon: Sparkles },
  { id: 'other', label: '... Other', icon: MoreHorizontal }
];

const HOW_FIND_OPTIONS = [
  { id: 'google', label: 'Google', icon: Search },
  { id: 'friend', label: 'Friend or referral', icon: UserPlus },
  { id: 'social', label: 'Social media', icon: Share2 },
  { id: 'ad', label: 'Ad', icon: Megaphone },
  { id: 'other', label: 'Other', icon: MoreHorizontal }
];

const USER_GROUP_OPTIONS: { id: OnboardingUserGroup; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: 'tenant', label: 'I\'m a tenant', icon: User },
  { id: 'landlord', label: 'I\'m a landlord', icon: Building2 },
  { id: 'agent', label: 'I\'m an agent', icon: Briefcase },
  { id: 'homeowner', label: 'I\'m a homeowner', icon: Home }
];

const DEMO_URL_BY_GROUP: Record<OnboardingUserGroup, string> = {
  tenant: '/tenant-onboarding',
  landlord: '/landlord-demo',
  agent: '/landlord-demo',
  homeowner: '/homeowner'
};

const MAX_HOW_USE_SELECTIONS = 3;

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [howUseSelected, setHowUseSelected] = useState<string[]>([]);
  const [howFind, setHowFind] = useState<string | null>(null);

  const handleStart = () => {
    getOrCreateAnonymousId();
    setStep('howUse');
  };

  const toggleHowUse = (id: string) => {
    setHowUseSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_HOW_USE_SELECTIONS) return prev;
      return [...prev, id];
    });
  };

  const handleHowUseContinue = () => {
    if (howUseSelected.length > 0) {
      setDiscoveryAnswer('howDoYouWantToUse', howUseSelected.join(','));
    }
    setStep('howFind');
  };

  const handleHowFind = (value: string) => {
    setDiscoveryAnswer('howDidYouFindUs', value);
    setHowFind(value);
    setStep('whoAreYou');
  };

  const handleWhoAreYou = (group: OnboardingUserGroup) => {
    setOnboardingUserGroup(group);
    setOnboardingCompleted();
    navigate(DEMO_URL_BY_GROUP[group]);
  };

  const handleSkipToSearch = () => {
    setOnboardingUserGroup('tenant');
    setOnboardingCompleted();
    navigate('/search');
  };

  const textStyle = { fontFamily: 'Archivo, sans-serif', color: '#374957' };

  const isHowUseStep = step === 'howUse';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 md:px-10 md:py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/addtenbg.png)', ...textStyle }}
    >
      <div className={`w-full ${step === 'welcome' ? 'max-w-4xl' : isHowUseStep ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <img
                src="/images/Group 984@2x.png"
                alt=""
                className="w-64 h-auto md:w-96 lg:w-[28rem] object-contain"
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii"
                className="h-12 md:h-14 w-auto mx-auto md:mx-0 mb-6 object-contain"
              />
              <h1 className="text-3xl md:text-4xl font-bold mb-3" style={textStyle}>
                <TextAnimate
                  className="text-3xl md:text-4xl font-bold font-archivo"
                  by="word"
                  animation="fadeIn"
                  startOnView={true}
                  once={true}
                >
                  Welcome to Proptii
                </TextAnimate>
              </h1>
              <p className="text-lg md:text-xl mb-5 max-w-xl mx-auto md:mx-0 leading-relaxed" style={textStyle}>
                <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
                  We make finding and securing your home easy, every step of the way
                </TextAnimate>
                <br />
                
              </p>
              <div className="flex justify-center md:justify-start">
                <button
                  onClick={handleStart}
                  className="px-8 py-4 rounded-full bg-[#E65D24] text-white font-semibold text-lg shadow-lg transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(252,209,181,0.6),0_8px_10px_-6px_rgba(252,209,181,0.4)] hover:bg-gradient-to-r hover:from-[#E65D24] hover:to-[#d9541f]"
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                >
                  Get started
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: How do you want to use Proptii? */}
        {step === 'howUse' && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-0 w-full">
            {/* Left: illustration (dog character) */}
            <div className="flex-shrink-0 w-full md:w-auto md:max-w-[320px] flex justify-center md:justify-end">
              <img
                src="/images/onboard%20que.png"
                alt=""
                className="w-56 md:w-72 h-auto object-contain object-bottom"
              />
            </div>
            {/* Right: speech-bubble card */}
            <div className="w-full max-w-2xl rounded-3xl border-2 border-[#A3CEF7] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-6 py-8 md:px-8 md:py-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-left" style={textStyle}>
                <TextAnimate
                  className="text-2xl md:text-3xl font-bold text-left"
                  by="word"
                  animation="fadeIn"
                  startOnView={true}
                  once={true}
                >
                  How do you want to use Proptii?
                </TextAnimate>
              </h2>
              <p className="text-[#6b7280] text-sm md:text-base mb-6 text-left" style={{ fontFamily: 'Archivo, sans-serif' }}>
                <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
                  {`Pick up to ${MAX_HOW_USE_SELECTIONS}. We'll show you the most relevant bit first`}
                </TextAnimate>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOW_USE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = howUseSelected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleHowUse(opt.id)}
                      data-onboarding-option
                      className={`group flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border font-medium text-left transition-all duration-200 ease-out active:scale-[0.99] outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 [&:focus]:outline-none ${
                        selected
                          ? 'border-[#3D98D8] bg-[#E0F2FE] text-[#136C9E] shadow-[0_2px_8px_rgba(61,152,216,0.2)]'
                          : 'border-[#A3CEF7] bg-white hover:border-[#136C9E] hover:bg-[#f8fbff]'
                      }`}
                      style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit', outline: 'none' }}
                    >
                      <span className={`flex-shrink-0 ${selected ? 'text-[#136C9E]' : 'text-[#374957] group-hover:text-[#136C9E]'}`}>
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                      </span>
                      <span className="flex-1 text-[#374957] group-hover:text-[#374957]">{opt.label}</span>
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                          selected ? 'border-[#3D98D8] bg-[#E0F2FE] text-[#136C9E]' : 'border-[#d1d5db] bg-white text-[#9CA3AF]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleHowUseContinue}
                  className="px-8 py-4 rounded-full bg-[#E65D24] text-white font-semibold text-lg shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(230,93,36,0.4)] hover:bg-[#d9541f]"
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: How did you find us? */}
        {step === 'howFind' && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={textStyle}>
              <TextAnimate
                className="text-2xl md:text-3xl font-bold text-center"
                by="word"
                animation="fadeIn"
                startOnView={true}
                once={true}
              >
                How did you hear about Proptii?
              </TextAnimate>
            </h2>
            <p className="mb-8 text-center" style={textStyle}>
              <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
                Quick question. One tap.
              </TextAnimate>
            </p>
            <div className="grid grid-cols-1 gap-3">
              {HOW_FIND_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleHowFind(opt.id)}
                    data-onboarding-option
                    className="group flex items-center gap-4 w-full px-5 py-4 rounded-full border-2 border-[#A3CEF7] bg-white font-medium text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&:focus]:outline-none [&:focus]:ring-0 [&:focus]:ring-offset-0 hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.99]"
                    style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit', outline: 'none' }}
                  >
                    <span className="flex-shrink-0 text-[#374957] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span className="flex-1 text-[#374957] group-hover:text-white transition-colors">
                      {opt.label}
                    </span>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8ECEF] flex items-center justify-center text-[#9CA3AF] group-hover:bg-white/25 group-hover:text-white transition-all">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Who are you? (Profiling) */}
        {step === 'whoAreYou' && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={textStyle}>
              <TextAnimate
                className="text-2xl md:text-3xl font-bold text-center"
                by="word"
                animation="fadeIn"
                startOnView={true}
                once={true}
              >
                Who are you?
              </TextAnimate>
            </h2>
            <p className="mb-8 text-center" style={textStyle}>
              <TextAnimate by="word" animation="fadeIn" startOnView={true} once={true}>
                So we can show you the most useful bit first.
              </TextAnimate>
            </p>
            <div className="grid grid-cols-1 gap-3">
              {USER_GROUP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleWhoAreYou(opt.id)}
                    data-onboarding-option
                    className="group flex items-center gap-4 w-full px-5 py-4 rounded-full border-2 border-[#A3CEF7] bg-white font-medium text-left shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-200 ease-out outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&:focus]:outline-none [&:focus]:ring-0 [&:focus]:ring-offset-0 hover:border-[#136C9E] hover:bg-[#136C9E] hover:text-white hover:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.99]"
                    style={{ fontFamily: 'Archivo, sans-serif', color: 'inherit', outline: 'none' }}
                  >
                    <span className="flex-shrink-0 text-[#374957] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                    <span className="flex-1 text-[#374957] group-hover:text-white transition-colors">
                      {opt.label}
                    </span>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8ECEF] flex items-center justify-center text-[#9CA3AF] group-hover:bg-white/25 group-hover:text-white transition-all">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-center">
              <button
                type="button"
                onClick={handleSkipToSearch}
                className="text-sm underline hover:opacity-80 transition-opacity"
                style={textStyle}
              >
                Just show me around
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
