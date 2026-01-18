import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface Right {
  id: string;
  title: string;
  description: string;
  details: string[];
}

const rights: Right[] = [
  {
    id: 'deposit',
    title: 'Deposit Protection',
    description: 'Your deposit must be protected in a government-approved scheme',
    details: [
      'Landlord must protect your deposit within 30 days',
      'You must receive deposit protection information',
      'Deposit must be returned within 10 days of tenancy ending (minus deductions)',
      'You can dispute unfair deductions',
    ],
  },
  {
    id: 'repairs',
    title: 'Repairs & Maintenance',
    description: 'Landlord is responsible for most repairs and property maintenance',
    details: [
      'Landlord must keep property in good repair',
      'Landlord must ensure gas, electricity, and water are safe',
      'Landlord must provide Energy Performance Certificate (EPC)',
      'You must report issues promptly',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Quiet Enjoyment',
    description: 'You have the right to live in your home without unnecessary interference',
    details: [
      'Landlord must give 24 hours notice before visiting (except emergencies)',
      'You have right to quiet enjoyment of the property',
      'Landlord cannot enter without permission',
      'You can refuse entry if proper notice not given',
    ],
  },
  {
    id: 'eviction',
    title: 'Eviction Protection',
    description: 'Landlord must follow proper legal procedures to evict you',
    details: [
      'Landlord must give proper notice (usually 2 months)',
      'Landlord must obtain court order for eviction',
      'Bailiffs must be used for eviction (not landlord)',
      'You have right to challenge eviction in court',
    ],
  },
  {
    id: 'discrimination',
    title: 'Protection from Discrimination',
    description: 'You are protected from discrimination based on protected characteristics',
    details: [
      'Protected characteristics include: age, disability, gender, race, religion, sexual orientation',
      'Landlord cannot refuse tenancy based on protected characteristics',
      'You can report discrimination to Equality and Human Rights Commission',
      'You may be entitled to compensation',
    ],
  },
];

const KnowYourRights: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const toggleCheck = (rightId: string, detailIndex: number) => {
    const key = `${rightId}-${detailIndex}`;
    setChecked({ ...checked, [key]: !checked[key] });
  };

  const totalDetails = rights.reduce((sum, right) => sum + right.details.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const percentage = totalDetails > 0 ? (checkedCount / totalDetails) * 100 : 0;

  return (
    <>
      <SEO
        title="UK Tenant Rights Guide | Know Your Rental Rights & Responsibilities | Proptii"
        description="Comprehensive interactive guide to UK tenant rights and responsibilities. Learn about deposit protection schemes, landlord repair obligations, privacy rights, eviction protection, and discrimination laws. Based on official UK government guidance."
        canonical="/tools/know-your-rights"
        keywords={[
          'UK tenant rights',
          'tenant rights UK',
          'rental rights',
          'tenant protection UK',
          'landlord tenant rights',
          'UK housing rights',
          'tenant responsibilities',
          'deposit protection rights',
          'eviction protection UK',
          'tenant privacy rights',
          'discrimination protection tenant',
          'repair rights tenant'
        ]}
        relatedTerms={[
          'tenant legal rights',
          'UK housing law',
          'rental agreement rights',
          'tenant obligations',
          'UK tenancy rights'
        ]}
        category="Rental Tools"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: rights.map((right) => ({
            '@type': 'Question',
            name: right.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: right.description + ' ' + right.details.join(' '),
            },
          })),
        }}
      />
      
      <div className="min-h-screen font-nunito">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>Know Your Rights</h1>
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              Interactive guide to UK tenant rights and responsibilities. Check off items as you learn about them.
            </p>

            {/* SEO Content Section */}
            <div className="bg-red-50 rounded-xl p-6 mb-8 border border-red-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Understanding Your Rights as a UK Tenant
              </h2>
              <div style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }} contentEditable={false}>
                <p className="mb-4">
                  As a tenant in the UK, you have specific legal rights protected by law. Understanding these rights helps you recognize when they're being violated and ensures you can live safely and comfortably in your rental property. This guide covers the five most important areas of tenant rights.
                </p>
                <p className="mb-4">
                  <strong>Deposit Protection:</strong> Your landlord must protect your deposit in a government-approved scheme within 30 days and provide you with protection information. You can dispute unfair deductions, and deposits must be returned within 10 days of tenancy ending (minus legitimate deductions).
                </p>
                <p className="mb-4">
                  <strong>Repairs & Maintenance:</strong> Landlords are legally required to keep properties in good repair, ensure gas, electricity, and water are safe, and provide an Energy Performance Certificate. You must report issues promptly.
                </p>
                <p className="mb-4">
                  <strong>Privacy & Quiet Enjoyment:</strong> You have the right to live without unnecessary interference. Landlords must give 24 hours' notice before visiting (except emergencies) and cannot enter without permission.
                </p>
                <p className="mb-4">
                  <strong>Eviction Protection:</strong> Landlords must follow proper legal procedures - giving proper notice (usually 2 months), obtaining a court order, and using bailiffs for eviction. You have the right to challenge evictions in court.
                </p>
                <p>
                  <strong>Protection from Discrimination:</strong> You're protected from discrimination based on age, disability, gender, race, religion, or sexual orientation. Report discrimination to the Equality and Human Rights Commission.
                </p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
                <span className="text-2xl font-bold text-indigo-600">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {checkedCount} of {totalDetails} rights reviewed
              </p>
            </div>

            {/* Rights Sections */}
            <div className="space-y-4">
              {rights.map((right) => (
                <div key={right.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(right.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{right.title}</h3>
                      <p className="text-gray-600">{right.description}</p>
                    </div>
                    {expandedSection === right.id ? (
                      <ChevronUp className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {expandedSection === right.id && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      <ul className="space-y-3 mt-4">
                        {right.details.map((detail, idx) => {
                          const key = `${right.id}-${idx}`;
                          const isChecked = checked[key] || false;
                          return (
                            <li key={idx} className="flex items-start">
                              <button
                                onClick={() => toggleCheck(right.id, idx)}
                                className="mt-1 mr-3 flex-shrink-0"
                              >
                                {isChecked ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                                ) : (
                                  <Circle className="h-6 w-6 text-gray-400" />
                                )}
                              </button>
                              <span
                                className={`flex-1 ${isChecked ? 'line-through text-gray-500' : 'text-gray-700'}`}
                              >
                                {detail}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Legal Help?</h3>
              <p className="text-blue-800 text-sm">
                This guide provides general information. For specific legal advice, consult a qualified solicitor or contact Citizens Advice.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default KnowYourRights;
