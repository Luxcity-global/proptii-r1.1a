import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ClipboardCheck,
  Clock,
  Files,
  Route,
  ShieldCheck,
  Home,
  Building2,
  Search,
  CalendarCheck,
  FileCheck,
  FileSignature,
  Users,
  BarChart3,
  Shield,
  Wrench,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RentalDocuments from './tools/RentalDocuments';
import { SEO } from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';

interface Tool {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColorClass: string;
}

const tools: Tool[] = [
  {
    id: 'readiness-checker',
    title: 'Rental Readiness Checker',
    description: 'Assess your readiness for rental applications with our interactive checklist',
    link: '/tools/readiness-checker',
    icon: ClipboardCheck,
    iconBgColor: 'bg-blue-100',
    iconColorClass: 'text-blue-600',
  },
  {
    id: 'document-tracker',
    title: 'Document Tracker',
    description: 'Track which rental documents you have and what you still need',
    link: '/tools/document-tracker',
    icon: Files,
    iconBgColor: 'bg-purple-100',
    iconColorClass: 'text-purple-600',
  },
  {
    id: 'viewing-tracker',
    title: 'Viewing Tracker',
    description: 'Organize and track your property viewings and agent communications',
    link: '/tools/viewing-tracker',
    icon: Calendar,
    iconBgColor: 'bg-green-100',
    iconColorClass: 'text-green-600',
  },
  {
    id: 'process-simulator',
    title: 'Process Simulator',
    description: 'Walk through the rental application process step by step',
    link: '/tools/process-simulator',
    icon: Route,
    iconBgColor: 'bg-yellow-100',
    iconColorClass: 'text-yellow-600',
  },
  {
    id: 'timeline-generator',
    title: 'Timeline Generator',
    description: 'Estimate how long your rental application process will take',
    link: '/tools/timeline-generator',
    icon: Clock,
    iconBgColor: 'bg-teal-100',
    iconColorClass: 'text-teal-600',
  },
  {
    id: 'know-your-rights',
    title: 'Know Your Rights',
    description: 'Interactive guide to UK tenant rights and responsibilities',
    link: '/tools/know-your-rights',
    icon: ShieldCheck,
    iconBgColor: 'bg-red-100',
    iconColorClass: 'text-red-600',
  },
];

const Tools: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'tools' | 'documents'>('tools');
  const [activeMode, setActiveMode] = useState<'search' | 'list'>('search');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash === 'documents') {
      setActiveTab('documents');
    }
  }, [location]);

  const handleTabChange = (tab: 'tools' | 'documents') => {
    setActiveTab(tab);
    if (tab === 'documents') {
      window.history.replaceState(null, '', '/tools#documents');
    } else {
      window.history.replaceState(null, '', '/tools');
    }
  };

  const navigateToAgent = () => {
    if (isAuthenticated) {
      navigate('/Agent');
    } else {
      navigate('/register?role=agent&redirect=%2FAgent');
    }
  };

  const handleSearchCta = () => {
    navigate('/home-v2');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHoveredItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleModeSwitch(mode: 'search' | 'list') {
    if (mode === activeMode) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setActiveMode(mode);
      setIsDropdownOpen(true);
    }
    setHoveredItem(null);
  }

  const searchMenuItems = [
    {
      icon: <Search className="h-4 w-4" />,
      label: 'Search Properties',
      description: 'AI-powered property search across multiple platforms',
      action: () => {
        setIsDropdownOpen(false);
        handleSearchCta();
      },
    },
    {
      icon: <CalendarCheck className="h-4 w-4" />,
      label: 'Book Viewings',
      description: 'Schedule and manage property viewings instantly',
      action: () => {
        setIsDropdownOpen(false);
        navigate('/bookviewing');
      },
    },
    {
      icon: <FileCheck className="h-4 w-4" />,
      label: 'Referencing',
      description: 'Complete tenant referencing online, hassle-free',
      action: () => {
        setIsDropdownOpen(false);
        navigate('/referencing');
      },
    },
    {
      icon: <FileSignature className="h-4 w-4" />,
      label: 'Sign Contracts',
      description: 'Digital contract signing, legally binding',
      action: () => {
        setIsDropdownOpen(false);
        navigate('/contracts');
      },
    },
  ];

  const listMenuItems = [
    {
      icon: <Building2 className="h-4 w-4" />,
      label: 'List Property',
      description: 'Advertise your property to verified tenants',
      action: () => {
        setIsDropdownOpen(false);
        navigateToAgent();
      },
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Manage Tenants',
      description: 'Tenant communication and management tools',
      action: () => {
        setIsDropdownOpen(false);
        navigateToAgent();
      },
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      description: 'Track listing performance and enquiries',
      action: () => {
        setIsDropdownOpen(false);
        navigateToAgent();
      },
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: 'Verify Tenants',
      description: 'Run background and credit checks securely',
      action: () => {
        setIsDropdownOpen(false);
        navigateToAgent();
      },
    },
    {
      icon: <Wrench className="h-4 w-4" />,
      label: 'Tools',
      description: 'Free rental tools and official documents',
      action: () => {
        setIsDropdownOpen(false);
        navigate('/tools');
      },
    },
  ];

  const menuItems = activeMode === 'search' ? searchMenuItems : listMenuItems;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'FAQPage'],
    name: 'Proptii Rental Tools',
    description: 'Free interactive tools and official UK government documents to help tenants navigate the rental application process. Includes rental readiness checker, document tracker, viewing organizer, process simulator, timeline generator, and tenant rights guide.',
    applicationCategory: 'RealEstateApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    featureList: [
      'Rental Readiness Checker',
      'Document Tracker',
      'Viewing Tracker',
      'Process Simulator',
      'Timeline Generator',
      'Know Your Rights Guide',
      'Official UK Government Documents'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150'
    },
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are these rental tools really free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all our rental tools are completely free to use. You don\'t need to create an account, provide any personal information, or pay any fees. Simply visit the tool you need and start using it immediately.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need to sign up to use the tools?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No signup is required. All tools work entirely in your browser. Some tools like the Viewing Tracker use local storage to save your data, but this is stored only on your device and never sent to our servers.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are the documents official UK government documents?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all documents in our rental documents section are official UK government publications from DLUHC (Department for Levelling Up, Housing and Communities) and the Home Office. These are the same documents you would find on government websites.'
        }
      },
      {
        '@type': 'Question',
        name: 'How accurate are the timeline estimates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our timeline generator provides estimates based on typical UK rental application processes. Actual timelines can vary depending on the landlord, property type, and your specific circumstances. Use it as a guide to help plan your move.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use these tools on mobile devices?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely! All our tools are fully responsive and work perfectly on smartphones, tablets, and desktop computers. You can track viewings, check documents, and access all tools from any device.'
        }
      }
    ]
  };

  return (
    <>
      <SEO
        title="Free UK Rental Tools & Resources | Tenant Application Help | Proptii"
        description="Free interactive rental tools and official UK government documents for tenants. Check rental readiness, track documents, organize viewings, understand your rights, and estimate timelines. No signup required. Everything you need to successfully rent a property in the UK."
        canonical="/tools"
        keywords={[
          'rental tools UK',
          'tenant application tools',
          'rental readiness checker',
          'document tracker',
          'property viewing tracker',
          'rental timeline calculator',
          'UK tenant rights guide',
          'rental application help',
          'free tenant resources',
          'UK rental documents',
          'how to rent in UK',
          'tenant checklist',
          'rental application process',
          'property rental guide',
          'tenant resources'
        ]}
        relatedTerms={[
          'renting in England',
          'tenant application',
          'property rental',
          'UK housing',
          'rental process',
          'tenancy application',
          'rental checklist'
        ]}
        category="Rental Tools"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen font-nunito">
        <Navbar hideServiceLinks />

        {/* Hero Section */}
        <section className="h-[60vh] relative flex items-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="/images/modern-building.jpg"
              alt="Modern building"
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
            {/* Hero toggle – same design as home-v2 */}
            <div className="absolute left-1/2 top-[5rem] w-full max-w-2xl -translate-x-1/2 -translate-y-[192px] flex justify-center px-4 md:top-[6rem]">
              <div className="relative inline-flex flex-col items-center">
                <div ref={toggleRef} className="relative">
                  <div
                    className="absolute -inset-1 rounded-full opacity-40 blur-lg transition-all duration-700 pointer-events-none"
                    style={{
                      background:
                        activeMode === 'search'
                          ? 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 100%)'
                          : 'linear-gradient(135deg, #E8D5B0 0%, #D4C4A0 100%)',
                    }}
                  />
                  <div
                    className="relative flex items-stretch rounded-full border border-white/[0.12] p-1"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      boxShadow:
                        '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {/* Search / renters button */}
                    <button
                      onClick={() => handleModeSwitch('search')}
                      className="group relative flex items-center gap-1.5 sm:gap-2.5 rounded-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={
                        activeMode === 'search'
                          ? {
                              background: 'linear-gradient(135deg, #6BB2E8 0%, #4D97CF 80%, #357FB7 100%)',
                              color: '#FFFFFF',
                              boxShadow:
                                '0 4px 16px rgba(107, 178, 232, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.15)',
                              transform: 'translateY(-1px)',
                            }
                          : {
                              background: 'transparent',
                              color: 'rgba(255, 255, 255, 0.55)',
                            }
                      }
                      aria-pressed={activeMode === 'search'}
                      aria-label="Search Properties Free"
                    >
                      <Home className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                      <span className="whitespace-nowrap tracking-wide">Search Properties Free</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-all duration-300 ${
                          activeMode === 'search' && isDropdownOpen
                            ? 'rotate-180 opacity-100'
                            : activeMode === 'search'
                              ? 'rotate-0 opacity-70'
                              : 'rotate-0 opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                      {activeMode === 'search' && (
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }}
                        />
                      )}
                    </button>

                    <div className="my-2.5 w-px bg-white/10" />

                    {/* List / landlords button */}
                    <button
                      onClick={() => handleModeSwitch('list')}
                      className="group relative flex items-center gap-1.5 sm:gap-2.5 rounded-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={
                        activeMode === 'list'
                          ? {
                              background: 'linear-gradient(135deg, #F5E6CC 0%, #E8D5B0 80%, #DBC8A0 100%)',
                              color: '#3D2E1A',
                              boxShadow:
                                '0 4px 16px rgba(232, 213, 176, 0.35), 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.05)',
                              transform: 'translateY(-1px)',
                            }
                          : {
                              background: 'transparent',
                              color: 'rgba(255, 255, 255, 0.55)',
                            }
                      }
                      aria-pressed={activeMode === 'list'}
                      aria-label="List & Manage Properties"
                    >
                      <Building2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                      <span className="whitespace-nowrap tracking-wide">List &amp; Manage Properties</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-all duration-300 ${
                          activeMode === 'list' && isDropdownOpen
                            ? 'rotate-180 opacity-100'
                            : activeMode === 'list'
                              ? 'rotate-0 opacity-70'
                              : 'rotate-0 opacity-0'
                        }`}
                        strokeWidth={2.5}
                      />
                      {activeMode === 'list' && (
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contextual dropdown – same design as home-v2 */}
                <div
                  ref={dropdownRef}
                  className="absolute top-full z-50 mt-3 w-[calc(100vw-2rem)] sm:w-[420px] overflow-hidden"
                  style={{
                    left: '50%',
                    opacity: isDropdownOpen ? 1 : 0,
                    transform: isDropdownOpen
                      ? 'translateX(-50%) translateY(0) scale(1)'
                      : 'translateX(-50%) translateY(-8px) scale(0.97)',
                    pointerEvents: isDropdownOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-2xl border border-white/[0.1]"
                    style={{
                      background: 'rgba(15, 15, 20, 0.75)',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div
                      className="h-[2px] w-full transition-all duration-700"
                      style={{
                        background:
                          activeMode === 'search'
                            ? 'linear-gradient(90deg, transparent, #6BB2E8, transparent)'
                            : 'linear-gradient(90deg, transparent, #E8D5B0, transparent)',
                      }}
                    />

                    <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                      <Sparkles
                        className="h-3.5 w-3.5 transition-colors duration-500"
                        style={{ color: activeMode === 'search' ? '#6BB2E8' : '#D4C090' }}
                      />
                      <p
                        className="text-xs font-medium uppercase tracking-widest transition-colors duration-500"
                        style={{ color: activeMode === 'search' ? 'rgba(107, 178, 232, 0.92)' : 'rgba(212, 192, 144, 0.8)' }}
                      >
                        {activeMode === 'search' ? 'For Renters & Buyers' : 'For Landlords & Agents'}
                      </p>
                    </div>

                    <div className="p-2">
                      {menuItems.map((item, index) => (
                        <button
                          key={`${activeMode}-${index}`}
                          onClick={item.action}
                          className="group relative flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all duration-200"
                          style={{
                            background:
                              hoveredItem === index
                                ? activeMode === 'search'
                                  ? 'rgba(33, 71, 102, 0.12)'
                                  : 'rgba(232, 213, 176, 0.08)'
                                : 'transparent',
                          }}
                          onMouseEnter={() => setHoveredItem(index)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
                            style={{
                              borderColor:
                                hoveredItem === index
                                  ? activeMode === 'search'
                                    ? 'rgba(33, 71, 102, 0.35)'
                                    : 'rgba(232, 213, 176, 0.2)'
                                  : 'rgba(255, 255, 255, 0.08)',
                              background:
                                hoveredItem === index
                                  ? activeMode === 'search'
                                    ? 'rgba(33, 71, 102, 0.18)'
                                    : 'rgba(232, 213, 176, 0.1)'
                                  : 'rgba(255, 255, 255, 0.04)',
                              color:
                                hoveredItem === index
                                  ? activeMode === 'search'
                                    ? '#6BB2E8'
                                    : '#E8D5B0'
                                  : 'rgba(255, 255, 255, 0.5)',
                              boxShadow:
                                hoveredItem === index
                                  ? activeMode === 'search'
                                    ? '0 0 20px rgba(33, 71, 102, 0.2)'
                                    : '0 0 20px rgba(232, 213, 176, 0.1)'
                                  : 'none',
                            }}
                          >
                            {item.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium transition-colors duration-200"
                              style={{ color: hoveredItem === index ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)' }}
                            >
                              {item.label}
                            </p>
                            <p
                              className="mt-0.5 text-xs leading-relaxed transition-colors duration-200"
                              style={{
                                color: hoveredItem === index ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.35)',
                              }}
                            >
                              {item.description}
                            </p>
                          </div>

                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              opacity: hoveredItem === index ? 1 : 0,
                              transform: hoveredItem === index ? 'translateX(0)' : 'translateX(-4px)',
                              background:
                                activeMode === 'search' ? 'rgba(33, 71, 102, 0.25)' : 'rgba(232, 213, 176, 0.12)',
                              color: activeMode === 'search' ? '#6BB2E8' : '#E8D5B0',
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4.5 2.5L8 6L4.5 9.5" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-white/[0.06] px-5 py-3.5">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (activeMode === 'search') {
                            handleSearchCta();
                          } else {
                            navigateToAgent();
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300"
                        style={{
                          background: activeMode === 'search' ? 'rgba(33, 71, 102, 0.15)' : 'rgba(232, 213, 176, 0.08)',
                          color: activeMode === 'search' ? '#6BB2E8' : '#E8D5B0',
                          border:
                            activeMode === 'search'
                              ? '1px solid rgba(33, 71, 102, 0.3)'
                              : '1px solid rgba(232, 213, 176, 0.12)',
                        }}
                      >
                        {activeMode === 'search' ? 'Get Started Free' : 'Start Listing Today'}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 3L10 7L5 11" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight">
              Rental Tools & Resources
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
              Everything you need to navigate the UK rental process. Free tools and official documents.
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="py-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleTabChange('tools')}
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  activeTab === 'tools'
                    ? 'bg-[#E65D24] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Interactive Tools
              </button>
              <button
                onClick={() => handleTabChange('documents')}
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-[#E65D24] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rental Documents
              </button>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 bg-gray-50">
          {activeTab === 'tools' && (
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Interactive Tools</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  Use our free, interactive tools to help you through every step of the rental process. No account required - start using any tool instantly.
                </p>
                
                {/* SEO Content Section */}
                <div className="max-w-7xl mx-auto text-left bg-white rounded-2xl p-8 mb-12 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start" contentEditable={false}>
                    {/* Image on the left */}
                    <div className="order-2 md:order-1">
                      <img
                        src="/images/Interactive Tools introsectn image.png"
                        alt="UK rental application tools"
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    </div>
                    
                    {/* Text on the right */}
                    <div className="order-1 md:order-2" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
                      <p className="mb-6">
                        Navigating the UK rental application process can be challenging, especially when applying to multiple properties. Our free rental application tools help you prepare, organize, and understand every step of the rental process.
                      </p>
                      <h4 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>Why Use These Rental Tools?</h4>
                      <ul className="list-disc list-inside space-y-2" style={{ textWrap: 'pretty', hyphens: 'auto' }}>
                        <li><strong>Save Time:</strong> Prepare all your rental documents and information before applying to rental{'\u00A0'}properties.</li>
                        <li><strong>Stay Organized:</strong> Track multiple property viewings and applications all in one convenient{'\u00A0'}place.</li>
                        <li><strong>Understand the Process:</strong> Learn what happens behind the scenes during the rental application{'\u00A0'}process.</li>
                        <li><strong>Set Realistic Expectations:</strong> Get accurate timeline estimates based on your specific{'\u00A0'}situation.</li>
                        <li><strong>No Signup Required:</strong> All tools are free to use without creating an account or providing personal{'\u00A0'}information.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      to={tool.link}
                      className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:outline hover:outline-2 hover:outline-[#80B2FF] hover:-translate-y-2 transition-all duration-300 p-8 block group border border-gray-100"
                    >
                      {/* Icon with colored background */}
                      <div className={`${tool.iconBgColor} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                        <Icon className={`h-10 w-10 ${tool.iconColorClass}`} />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold mb-3 leading-tight" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                        {tool.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="mb-6 text-sm leading-relaxed" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                        {tool.description}
                      </p>
                      
                      {/* Button */}
                      <div className="w-full py-3 px-6 rounded-full border-2 border-[#E65D24] bg-white text-[#E65D24] font-medium text-center group-hover:bg-[#E65D24] group-hover:text-white transition-all duration-300 font-archive">
                        Use Tool
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'documents' && <RentalDocuments />}
        </section>

        {/* SEO FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Frequently Asked Questions About Rental Tools
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Are these rental tools really free?
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Yes, all our rental tools are completely free to use. You don't need to create an account, provide any personal information, or pay any fees. Simply visit the tool you need and start using it immediately.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Do I need to sign up to use the tools?
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  No signup is required. All tools work entirely in your browser. Some tools like the Viewing Tracker use local storage to save your data, but this is stored only on your device and never sent to our servers.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Are the documents official UK government documents?
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Yes, all documents in our rental documents section are official UK government publications from DLUHC (Department for Levelling Up, Housing and Communities) and the Home Office. These are the same documents you would find on government websites.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  How accurate are the timeline estimates?
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Our timeline generator provides estimates based on typical UK rental application processes. Actual timelines can vary depending on the landlord, property type, and your specific circumstances. Use it as a guide to help plan your move.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Can I use these tools on mobile devices?
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Absolutely! All our tools are fully responsive and work perfectly on smartphones, tablets, and desktop computers. You can track viewings, check documents, and access all tools from any device.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Tools;
