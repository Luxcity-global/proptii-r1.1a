import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface TimelineInputs {
  hasAllDocuments: boolean;
  needsGuarantor: boolean;
  creditScore: 'excellent' | 'good' | 'fair' | 'poor';
  propertyType: 'standard' | 'competitive';
}

const TimelineGenerator: React.FC = () => {
  const [inputs, setInputs] = useState<TimelineInputs>({
    hasAllDocuments: false,
    needsGuarantor: false,
    creditScore: 'good',
    propertyType: 'standard',
  });
  const [timeline, setTimeline] = useState<number | null>(null);

  const calculateTimeline = () => {
    let days = 14; // Base timeline

    // Adjust based on documents
    if (!inputs.hasAllDocuments) {
      days += 7;
    }

    // Adjust based on guarantor
    if (inputs.needsGuarantor) {
      days += 5;
    }

    // Adjust based on credit score
    switch (inputs.creditScore) {
      case 'excellent':
        days -= 3;
        break;
      case 'good':
        // No change
        break;
      case 'fair':
        days += 5;
        break;
      case 'poor':
        days += 10;
        break;
    }

    // Adjust based on property competitiveness
    if (inputs.propertyType === 'competitive') {
      days += 7;
    }

    setTimeline(days);
  };

  const getTimelineMessage = (days: number) => {
    if (days <= 14) {
      return 'Fast track! Your application should move quickly.';
    } else if (days <= 21) {
      return 'Standard timeline. Most applications complete within this timeframe.';
    } else {
      return 'Extended timeline. Some additional steps may be required.';
    }
  };

  return (
    <>
      <SEO
        title="Free Rental Application Timeline Calculator | UK Property Rental Timeline | Proptii"
        description="Free rental application timeline calculator for UK tenants. Estimate how long your rental application will take based on your documents, credit score, guarantor needs, and property competitiveness. Get personalized timeline estimates to plan your move."
        canonical="/tools/timeline-generator"
        keywords={[
          'rental timeline calculator',
          'rental application timeline',
          'UK rental timeline',
          'property rental timeline',
          'tenancy application time',
          'rental process duration',
          'how long to rent property',
          'UK rental application time',
          'rental timeline estimate',
          'property application timeline'
        ]}
        relatedTerms={[
          'rental application duration',
          'UK housing timeline',
          'property rental time',
          'tenant application time',
          'rental process length'
        ]}
        category="Rental Tools"
      />
      
      <div className="min-h-screen font-nunito bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>Timeline Generator</h1>
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              Estimate how long your rental application process will take based on your situation.
            </p>

            {/* SEO Content Section */}
            <div className="bg-teal-50 rounded-xl p-6 mb-8 border border-teal-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                How Long Does a UK Rental Application Take?
              </h2>
              <div style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }} contentEditable={false}>
                <p className="mb-4">
                  The time it takes to complete a rental application in the UK varies significantly based on several factors. Our timeline generator helps you estimate a realistic timeframe based on your specific circumstances.
                </p>
                <p className="mb-4">
                  <strong>Factors that affect your timeline:</strong> Having all documents ready can save 5-7 days. Needing a guarantor adds 3-5 days for their verification. Your credit score impacts processing time - excellent scores can speed things up, while poor scores may require additional checks. Highly competitive properties (in popular areas) often have longer processing times due to multiple applicants.
                </p>
                <p className="mb-4">
                  <strong>Typical timeline breakdown:</strong> Application submission (1-2 days), referencing and checks (5-10 days), contract preparation (2-3 days), deposit payment and finalization (2-3 days), and move-in preparation (2-4 days). Most straightforward applications complete in 14-21 days, while complex cases may take 3-4 weeks.
                </p>
                <p>
                  Use the calculator below to get a personalized estimate. Remember, these are estimates - actual timelines depend on the landlord, agent efficiency, and any unexpected issues that arise during the process.
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.hasAllDocuments}
                    onChange={(e) =>
                      setInputs({ ...inputs, hasAllDocuments: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700">
                    I have all required documents ready
                  </span>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.needsGuarantor}
                    onChange={(e) =>
                      setInputs({ ...inputs, needsGuarantor: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700">
                    I need a guarantor
                  </span>
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Credit Score
                </label>
                <select
                  value={inputs.creditScore}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      creditScore: e.target.value as TimelineInputs['creditScore'],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="excellent">Excellent (750+)</option>
                  <option value="good">Good (650-749)</option>
                  <option value="fair">Fair (550-649)</option>
                  <option value="poor">Poor (Below 550)</option>
                </select>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Property Type
                </label>
                <select
                  value={inputs.propertyType}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      propertyType: e.target.value as TimelineInputs['propertyType'],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="standard">Standard Property</option>
                  <option value="competitive">Highly Competitive Property</option>
                </select>
              </div>
            </div>

            <button
              onClick={calculateTimeline}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium mb-6"
            >
              Calculate Timeline
            </button>

            {timeline !== null && (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-8">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-indigo-600 mr-4" />
                  <div className="text-center">
                    <div className="text-5xl font-bold text-indigo-600 mb-2">
                      {timeline} days
                    </div>
                    <div className="text-lg text-gray-700">Estimated timeline</div>
                  </div>
                </div>
                <p className="text-center text-gray-600 mb-6">
                  {getTimelineMessage(timeline)}
                </p>
                <div className="bg-white rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                    Timeline Breakdown
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Application submission: 1-2 days</li>
                    <li>• Referencing & checks: 5-10 days</li>
                    <li>• Contract preparation: 2-3 days</li>
                    <li>• Deposit & finalization: 2-3 days</li>
                    <li>• Move-in preparation: 2-4 days</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default TimelineGenerator;