import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RentalDocuments from './tools/RentalDocuments';
import { SEO } from '../components/SEO';

interface Tool {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  iconBgColor: string;
}

const tools: Tool[] = [
  {
    id: 'readiness-checker',
    title: 'Rental Readiness Checker',
    description: 'Assess your readiness for rental applications with our interactive checklist',
    link: '/tools/readiness-checker',
    image: '/images/rental rediness image.png',
    iconBgColor: 'bg-blue-100',
  },
  {
    id: 'document-tracker',
    title: 'Document Tracker',
    description: 'Track which rental documents you have and what you still need',
    link: '/tools/document-tracker',
    image: '/images/document tracker image.png',
    iconBgColor: 'bg-purple-100',
  },
  {
    id: 'viewing-tracker',
    title: 'Viewing Tracker',
    description: 'Organize and track your property viewings and agent communications',
    link: '/tools/viewing-tracker',
    image: '/images/viewing tracker image.png',
    iconBgColor: 'bg-green-100',
  },
  {
    id: 'process-simulator',
    title: 'Process Simulator',
    description: 'Walk through the rental application process step by step',
    link: '/tools/process-simulator',
    image: '/images/Process simulator image.png',
    iconBgColor: 'bg-yellow-100',
  },
  {
    id: 'timeline-generator',
    title: 'Timeline Generator',
    description: 'Estimate how long your rental application process will take',
    link: '/tools/timeline-generator',
    image: '/images/Time line generator image.png',
    iconBgColor: 'bg-teal-100',
  },
  {
    id: 'know-your-rights',
    title: 'Know Your Rights',
    description: 'Interactive guide to UK tenant rights and responsibilities',
    link: '/tools/know-your-rights',
    image: '/images/Know your rights image.png',
    iconBgColor: 'bg-red-100',
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
    '@type': 'WebApplication',
    name: 'Proptii Rental Tools',
    description: 'Interactive tools and resources to help UK tenants navigate the rental application process',
    applicationCategory: 'RealEstateApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
  };

  return (
    <>
      <SEO
        title="Rental Tools | Proptii"
        description="Free interactive tools and official documents to help UK tenants navigate the rental application process. No signup required."
        canonical="/tools"
        keywords={['rental tools', 'tenant tools', 'UK rental', 'property tools', 'rental application']}
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
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Use our free, interactive tools to help you through every step of the rental process.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tools.map((tool) => {
                  return (
                    <Link
                      key={tool.id}
                      to={tool.link}
                      className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:outline hover:outline-2 hover:outline-[#80B2FF] hover:-translate-y-2 transition-all duration-300 p-8 block group border border-gray-100"
                    >
                      {/* Icon with colored background */}
                      <div className={`${tool.iconBgColor} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                        <img
                          src={tool.image}
                          alt={tool.title}
                          className="w-16 h-16 object-contain"
                        />
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

        <Footer />
      </div>
    </>
  );
};

export default Tools;
