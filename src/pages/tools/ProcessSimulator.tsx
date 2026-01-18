import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
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
      'Use property search websites (Rightmove, Zoopla, etc.)',
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
        title="Rental Process Simulator | Proptii"
        description="Walk through the UK rental application process step by step. Understand what happens at each stage of renting a property."
        canonical="/tools/process-simulator"
        keywords={['rental process', 'tenancy process', 'UK rental', 'property application']}
        category="Rental Tools"
      />
      
      <div className="min-h-screen font-nunito">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Rental Process Simulator</h1>
            <p className="text-gray-600 mb-8">
              Walk through the UK rental application process step by step to understand what to expect.
            </p>

            {/* Step Timeline */}
            <div className="mb-8 flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`flex flex-col items-center flex-1 ${
                      index <= currentStep ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                        index < currentStep
                          ? 'bg-green-600 text-white'
                          : index === currentStep
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <span className="font-bold">{step.id}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="border border-gray-200 rounded-lg p-8 mb-6">
              <div className="mb-4">
                <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                  Step {currentStepData.id} of {steps.length}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentStepData.title}</h2>
              <p className="text-lg text-gray-600 mb-6">{currentStepData.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens:</h3>
                <ul className="space-y-3">
                  {currentStepData.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${
                  currentStep === steps.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next Step'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-5 w-5 ml-2" />}
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ProcessSimulator;
