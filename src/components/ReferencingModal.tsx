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
  
  // Reset to first step when modal is opened
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting to step 1');
      setCurrentStep(1);
    }
  }, [isOpen]);
  
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
    } catch (error) {
      console.error('Error saving form:', error);
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
      
      alert('Your application has been submitted successfully!');
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
      
      case 2:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your employment details below.</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Employment Status</label>
                <select
                  value={formData.employment.employmentStatus}
                  onChange={(e) => updateFormData('employment', { employmentStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select status</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                  <option value="Student">Student</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Company Details</label>
                <input
                  type="text"
                  value={formData.employment.companyDetails}
                  onChange={(e) => updateFormData('employment', { companyDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Company name"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Length of Employment (Years)</label>
                <input
                  type="text"
                  value={formData.employment.lengthOfEmployment}
                  onChange={(e) => updateFormData('employment', { lengthOfEmployment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Job Position</label>
                <input
                  type="text"
                  value={formData.employment.jobPosition}
                  onChange={(e) => updateFormData('employment', { jobPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Software Developer"
                />
              </div>

              <div className="col-span-2">
                <h3 className="text-gray-700 font-medium mb-2">Job Reference</h3>
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.employment.referenceFullName}
                  onChange={(e) => updateFormData('employment', { referenceFullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.employment.referenceEmail}
                  onChange={(e) => updateFormData('employment', { referenceEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john.smith@example.com"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Proof of Employment</label>
                <select
                  value={formData.employment.proofType}
                  onChange={(e) => updateFormData('employment', { proofType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select proof type</option>
                  <option value="Payslip">Payslip</option>
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Tax Return">Tax Return</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.employment.referencePhone}
                  onChange={(e) => updateFormData('employment', { referencePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+44 123 456 7890"
                />
              </div>

              <div className="col-span-2 mt-2">
                <label className="block text-gray-700 mb-3">Upload Proof of Employment</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    id="proofDocument"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateFormData('employment', { proofDocument: e.target.files[0] });
                      }
                    }}
                  />
                  <label htmlFor="proofDocument" className="cursor-pointer flex flex-col items-center justify-center w-full">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <Upload size={24} className="text-gray-500" />
                    </div>
                    <p className="text-gray-700 font-medium">Upload your document here</p>
                    <p className="text-gray-500 text-sm mt-1">PDF, JPG or PNG (max 5MB)</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your residential details below</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="block text-gray-700 mb-2">Current Address</label>
                <input
                  type="text"
                  value={formData.residential.currentAddress}
                  onChange={(e) => updateFormData('residential', { currentAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your current address"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">How long have you lived at this Address?</label>
                <select
                  value={formData.residential.durationAtCurrentAddress}
                  onChange={(e) => updateFormData('residential', { durationAtCurrentAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-3 years">2-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Previous Address (If less than 3 yrs at current address)</label>
                <input
                  type="text"
                  value={formData.residential.previousAddress}
                  onChange={(e) => updateFormData('residential', { previousAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your previous address"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Select exact duration at this address</label>
                <select
                  value={formData.residential.durationAtPreviousAddress}
                  onChange={(e) => updateFormData('residential', { durationAtPreviousAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-3 years">2-3 years</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Reason for leaving Previous Address</label>
                <textarea
                  value={formData.residential.reasonForLeaving}
                  onChange={(e) => updateFormData('residential', { reasonForLeaving: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Please provide the reason for leaving"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Proof of Address</label>
                <select
                  value={formData.residential.proofType}
                  onChange={(e) => updateFormData('residential', { proofType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select proof type</option>
                  <option value="Utility Bill">Utility Bill</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Council Tax Bill">Council Tax Bill</option>
                  <option value="Tenancy Agreement">Tenancy Agreement</option>
                </select>
              </div>

              <div className="col-span-2 mt-2">
                <label className="block text-gray-700 mb-3">Upload Proof of Address</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    id="addressProofDocument"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateFormData('residential', { proofDocument: e.target.files[0] });
                      }
                    }}
                  />
                  <label htmlFor="addressProofDocument" className="cursor-pointer flex flex-col items-center justify-center w-full">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <Upload size={24} className="text-gray-500" />
                    </div>
                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm mt-1">PDF, JPG or PNG (max 5MB)</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your financial details below</h2>
            </div>
            
            <div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Proof of income</label>
                <select
                  value={formData.financial.proofOfIncomeType}
                  onChange={(e) => updateFormData('financial', { proofOfIncomeType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Select proof type</option>
                  <option value="Payslip">Recent Payslip</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Tax Return">Tax Return</option>
                  <option value="P60">P60</option>
                </select>
              </div>
              
              <div className="mb-10">
                <label className="block text-gray-700 mb-3">Upload Proof of income</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    id="incomeProofDocument"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateFormData('financial', { proofOfIncomeDocument: e.target.files[0] });
                      }
                    }}
                  />
                  <label htmlFor="incomeProofDocument" className="cursor-pointer flex flex-col items-center justify-center w-full">
                    <div className="w-12 h-12 text-blue-600 mb-2 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="#4F6BED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-center">
                      <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
                    </p>
                  </label>
                </div>
              </div>
              
              {/* Divider with "or" */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#f2f7fb] px-4 text-sm text-gray-500">or</span>
                </div>
              </div>
              
              {/* Open Banking Section */}
              <div className="mt-6">
                <p className="text-gray-700 mb-4">Use open banking for faster connection</p>
                
                {formData.financial.isConnectedToOpenBanking ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-800">Connected</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // In a real implementation, you would initiate an open banking connection flow here
                      // For now, simulate a successful connection
                      setTimeout(() => {
                        updateFormData('financial', { 
                          useOpenBanking: true,
                          isConnectedToOpenBanking: true
                        });
                      }, 1000);
                    }}
                    className="border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Connect to open banking
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your guarantor's personal details below</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's First Name</label>
                <input
                  type="text"
                  value={formData.guarantor.firstName}
                  onChange={(e) => updateFormData('guarantor', { firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Last Name</label>
                <input
                  type="text"
                  value={formData.guarantor.lastName}
                  onChange={(e) => updateFormData('guarantor', { lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter last name"
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Email Address</label>
                <input
                  type="email"
                  value={formData.guarantor.email}
                  onChange={(e) => updateFormData('guarantor', { email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Phone Number</label>
                <input
                  type="tel"
                  value={formData.guarantor.phoneNumber}
                  onChange={(e) => updateFormData('guarantor', { phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-gray-700 mb-2">Guarantor's Address</label>
                <textarea
                  value={formData.guarantor.address}
                  onChange={(e) => updateFormData('guarantor', { address: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter full address"
                />
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your personal details below</h2>
            </div>
            
            <div className="bg-white rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-6">
                A Credit check is required to complete your referencing.<br />
                Your personal information has been filled in automatically.<br />
                <strong>Check that all your details are correct.</strong>
              </p>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.identity.firstName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.identity.lastName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.identity.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.identity.phoneNumber}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Date of birth</label>
                  <input
                    type="text"
                    value={formData.identity.dateOfBirth}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.creditCheck.hasAgreedToCheck}
                  onChange={(e) => updateFormData('creditCheck', { hasAgreedToCheck: e.target.checked })}
                  className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-2 text-gray-700">
                  I authorize Proptii to perform a credit check using the information provided
                </span>
              </label>
            </div>
            
            <div className="mt-10 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 font-medium">Coming Soon</p>
              <p className="text-gray-400 text-sm">We need to connect to live credit checking agencies.</p>
            </div>
          </div>
        );
      
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