import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Calendar, ClipboardCheck, Clock, Files, Route, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RentalDocuments from './tools/RentalDocuments';
import { SEO } from '../components/SEO';

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
  const [activeTab, setActiveTab] = useState<'tools' | 'documents'>('tools');

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
        <Navbar />

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
