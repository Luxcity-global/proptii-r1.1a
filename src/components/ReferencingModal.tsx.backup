import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, User, Briefcase, Home, DollarSign, Users, Check, Upload } from 'lucide-react';

interface ReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form data types for different steps
interface IdentityData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  isBritish: boolean;
  nationality: string;
  identityProof: File | null;
}

interface EmploymentData {
  employmentStatus: string;
  companyDetails: string;
  lengthOfEmployment: string;
  jobPosition: string;
  referenceFullName: string;
  referenceEmail: string;
  referencePhone: string;
  proofType: string;
  proofDocument: File | null;
}

interface ResidentialData {
  currentAddress: string;
  durationAtCurrentAddress: string;
  previousAddress: string;
  durationAtPreviousAddress: string;
  reasonForLeaving: string;
  proofType: string;
  proofDocument: File | null;
}

interface FinancialData {
  proofOfIncomeType: string;
  proofOfIncomeDocument: File | null;
  useOpenBanking: boolean;
  isConnectedToOpenBanking: boolean;
}

interface GuarantorData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface CreditCheckData {
  hasAgreedToCheck: boolean;
}

interface FormData {
  identity: IdentityData;
  employment: EmploymentData;
  residential: ResidentialData;
  financial: FinancialData;
  guarantor: GuarantorData;
  creditCheck: CreditCheckData;
}

const ReferencingModal: React.FC<ReferencingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    identity: {
      firstName: user?.givenName || '',
      lastName: user?.familyName || '',
      email: user?.email || '',
      phoneNumber: '',
      dateOfBirth: '',
      isBritish: true,
      nationality: 'British',
      identityProof: null
    },
    employment: {
      employmentStatus: '',
      companyDetails: '',
      lengthOfEmployment: '',
      jobPosition: '',
      referenceFullName: '',
      referenceEmail: '',
      referencePhone: '',
      proofType: '',
      proofDocument: null
    },
    residential: {
      currentAddress: '',
      durationAtCurrentAddress: '',
      previousAddress: '',
      durationAtPreviousAddress: '',
      reasonForLeaving: '',
      proofType: '',
      proofDocument: null
    },
    financial: {
      proofOfIncomeType: '',
      proofOfIncomeDocument: null,
      useOpenBanking: false,
      isConnectedToOpenBanking: false
    },
    guarantor: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: ''
    },
    creditCheck: {
      hasAgreedToCheck: false
    }
  });
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset the form when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        identity: {
          ...prev.identity,
          firstName: user.givenName || user.name?.split(' ')[0] || '',
          lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        }
      }));
    }
  }, [user]);

  // Update form data for any step
  const updateFormData = (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...data
      }
    }));
  };

  // Save current form data
  const saveCurrentStep = async () => {
    try {
      setIsSaving(true);
      
      // In a real implementation, you would save to your database here
      // For now, simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update last saved time
      setLastSaved(new Date());
      
      return true;
    } catch (error) {
      console.error('Error saving form:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle step navigation
  const goToStep = (step: number) => {
    // Only allow going to steps that are <= current step
    // (prevents skipping ahead)
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const nextStep = async () => {
    if (currentStep < 6) {
      await saveCurrentStep();
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit the final application
  const submitApplication = async () => {
    try {
      setIsSubmitting(true);
      
      // In a real implementation, you would submit to your API here
      // For now, simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      alert('Your application has been submitted successfully!');
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form content based on current step
  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="relative">
            <h3 className="text-xl font-semibold mb-6">Fill in your personal details below</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.identity.firstName}
                  onChange={(e) => updateFormData('identity', { firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.identity.lastName}
                  onChange={(e) => updateFormData('identity', { lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.identity.email}
                  onChange={(e) => updateFormData('identity', { email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.identity.phoneNumber}
                  onChange={(e) => updateFormData('identity', { phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.identity.dateOfBirth}
                    onChange={(e) => updateFormData('identity', { dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Are you British</label>
                <select
                  value={formData.identity.isBritish ? "true" : "false"}
                  onChange={(e) => updateFormData('identity', { isBritish: e.target.value === "true" })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Proof of Identity</label>
                <input
                  type="text"
                  placeholder="e.g. Passport, Driving License"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Nationality, if you're not British</label>
                <select
                  value={formData.identity.nationality}
                  onChange={(e) => updateFormData('identity', { nationality: e.target.value })}
                  disabled={formData.identity.isBritish}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Select nationality</option>
                  <option value="Irish">Irish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Polish">Polish</option>
                  <option value="Romanian">Romanian</option>
                  <option value="Indian">Indian</option>
                  <option value="Pakistani">Pakistani</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8">
              <label className="block text-gray-700 mb-2">Upload Proof of Identity</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    id="identity-proof-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateFormData('identity', { identityProof: e.target.files[0] });
                      }
                    }}
                  />
                  <label
                    htmlFor="identity-proof-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                  >
                    Click to upload
                  </label>
                  {formData.identity.identityProof && (
                    <div className="mt-2 text-green-600">
                      File selected: {formData.identity.identityProof.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      // Add other cases for steps 2-6 here...
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="relative w-full max-w-5xl mx-auto my-8 bg-white rounded-lg shadow-xl flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 py-6 px-4 border-r border-gray-200 hidden md:block">
          <div className="mb-6 px-2">
            <p className="text-sm text-gray-600 mb-4">
              The referencing process verifies renter or buyer identity, financial status, and rental history.
            </p>
          </div>
          
          {/* Step navigation */}
          <ul className="space-y-1">
            <li 
              onClick={() => goToStep(1)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 1 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={18} className={currentStep === 1 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Identity</span>
            </li>
            
            <li 
              onClick={() => goToStep(2)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 2 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Briefcase size={18} className={currentStep === 2 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Employment</span>
            </li>
            
            <li 
              onClick={() => goToStep(3)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 3 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={18} className={currentStep === 3 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Residential</span>
            </li>
            
            <li 
              onClick={() => goToStep(4)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 4 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <DollarSign size={18} className={currentStep === 4 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Financial</span>
            </li>
            
            <li 
              onClick={() => goToStep(5)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 5 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users size={18} className={currentStep === 5 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Guarantor</span>
            </li>
            
            <li 
              onClick={() => goToStep(6)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md cursor-pointer ${
                currentStep === 6 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Check size={18} className={currentStep === 6 ? 'text-blue-700' : 'text-gray-500'} />
              <span>Credit Check</span>
            </li>
          </ul>
          
          {/* Progress bar */}
          <div className="mt-auto pt-6 px-2">
            <div className="text-sm text-gray-600 mb-2">Step {currentStep} of 6</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Referencing Application</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Form content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f2f7fb]">
            {renderFormContent()}
          </div>
          
          {/* Footer with action buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div>
              {lastSaved && (
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Saved just now</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={saveCurrentStep}
                className="px-6 py-2 bg-gray-100 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-[#E65D24] text-white rounded-full hover:bg-opacity-90 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={submitApplication}
                  className="px-6 py-2 bg-[#E65D24] text-white rounded-full hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !formData.creditCheck.hasAgreedToCheck}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferencingModal; 