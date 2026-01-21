import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Search & View Properties',
    description: 'Find properties that match your criteria and schedule viewings',
    details: [
      'Search for properties on Proptii',
      'Contact agents to arrange viewings',
      'Attend viewings and take notes',
      'Compare properties and locations',
    ],
  },
  {
    id: 2,
    title: 'Submit Application',
    description: 'Apply for your chosen property with required documents',
    details: [
      'Complete application form',
      'Submit proof of income (payslips, bank statements)',
      'Provide references (previous landlord, employer)',
      'Pay application fee (if applicable)',
    ],
  },
  {
    id: 3,
    title: 'Referencing & Credit Check',
    description: 'Landlord or agent conducts background checks',
    details: [
      'Credit check is performed',
      'Employment verification',
      'Previous landlord reference check',
      'Right to rent verification',
    ],
  },
  {
    id: 4,
    title: 'Offer & Negotiation',
    description: 'Receive offer and negotiate terms if needed',
    details: [
      'Receive offer from landlord',
      'Review tenancy terms',
      'Negotiate rent or terms if needed',
      'Accept or decline offer',
    ],
  },
  {
    id: 5,
    title: 'Deposit & Contract',
    description: 'Pay deposit and sign tenancy agreement',
    details: [
      'Pay security deposit (usually 5 weeks rent)',
      'Review tenancy agreement',
      'Sign contract',
      'Deposit registered with protection scheme',
    ],
  },
  {
    id: 6,
    title: 'Move In',
    description: 'Complete final checks and move into your new home',
    details: [
      'Inventory check-in',
      'Receive keys',
      'Set up utilities',
      'Update address with relevant services',
    ],
  },
];

const ProcessSimulator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId - 1);
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      <SEO
        title="UK Rental Application Process Guide | Step-by-Step Simulator | Proptii"
        description="Complete step-by-step guide to the UK rental application process. Walk through all 6 stages: property search, application submission, referencing, offer negotiation, deposit & contract, and move-in. Understand exactly what happens at each stage when renting in the UK."
        canonical="/tools/process-simulator"
        keywords={[
          'UK rental process',
          'rental application process',
          'tenancy application steps',
          'UK rental process guide',
          'property rental process',
          'rental application stages',
          'how to rent in UK',
          'UK tenancy process',
          'rental application walkthrough',
          'property rental steps'
        ]}
        relatedTerms={[
          'renting process UK',
          'tenant application',
          'UK housing process',
          'rental application guide',
          'property rental UK'
        ]}
        category="Rental Tools"
      />
      
      <div 
        className="min-h-screen font-nunito"
        style={{ 
          backgroundImage: 'url(/assets/add_prp_slide/addtenbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%'
        }}
      >
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-10">
            <h1 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Rental Process Simulator
            </h1>
            <p 
              className="text-gray-600 mb-8 text-center max-w-2xl mx-auto"
              style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
            >
              Walk through the UK rental application process step by step to understand what to expect.
            </p>

            {/* Main wizard layout */}
            <div className="bg-[#F7F8FB] rounded-3xl p-6 md:p-10">
              <div className="grid md:grid-cols-[280px,minmax(0,1fr)] gap-10 items-stretch">
                {/* Left sidebar - steps */}
                <div>
                  <div className="bg-white rounded-2xl shadow-md p-4 space-y-2">
                    {steps.map((step, index) => {
                      const isCurrentStep = index === currentStep;
                      const isCompleted = index < currentStep;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => goToStep(step.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                            isCurrentStep
                              ? 'bg-[#E6F3FF] border-2 border-[#136C9E] shadow-sm'
                              : isCompleted
                              ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          style={isCurrentStep ? { fontFamily: 'Archivo, sans-serif' } : { fontFamily: 'Archivo, sans-serif' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrentStep
                                  ? 'bg-[#136C9E] text-white'
                                  : isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {isCompleted ? '✓' : step.id}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isCurrentStep
                                  ? 'text-[#136C9E]'
                                  : isCompleted
                                  ? 'text-green-700'
                                  : 'text-gray-800'
                              }`}
                              style={{ fontFamily: 'Archivo, sans-serif' }}
                            >
                              {step.title}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side - current step content */}
                <div className="flex flex-col">
                  <p
                    className="text-sm text-gray-500 mb-2"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    Step {currentStepData.id} of {steps.length}
                  </p>
                  <h2
                    className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                    style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}
                  >
                    {currentStepData.title}
                  </h2>
                  <p
                    className="text-lg text-gray-600 mb-6"
                    style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
                  >
                    {currentStepData.description}
                  </p>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-4"
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                      What happens:
                    </h3>
                    <ul className="space-y-3">
                      {currentStepData.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-[#136C9E] mr-3 flex-shrink-0 mt-0.5" />
                          <span
                            className="text-gray-700"
                            style={{ fontFamily: 'Archivo, sans-serif' }}
                          >
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="mt-10 flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${
                    currentStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`px-10 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center ${
                    currentStep === steps.length - 1
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 hover:scale-105 hover:shadow-lg'
                  }`}
                  style={{
                    background: currentStep === steps.length - 1
                      ? '#D1D5DB'
                      : 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                    boxShadow: currentStep === steps.length - 1
                      ? 'none'
                      : '0 4px 14px 0 rgba(220, 95, 18, 0.39)',
                    fontFamily: 'Archivo, sans-serif'
                  }}
                >
                  <span>
                    {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                  </span>
                  {currentStep < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ProcessSimulator;
