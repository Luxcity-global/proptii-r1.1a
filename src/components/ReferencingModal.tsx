import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Menu, User, Briefcase, Home, Euro, Users, CreditCard, CheckCircle, PoundSterling, AlertTriangle, Info, Upload } from 'lucide-react';
import FileUpload from "./Uploads/FileUpload";
import EmploymentUpload from "./Uploads/EmploymentUpload";
import ResidentialUpload from "./Uploads/ResidentialUpload";
import FinancialUpload from "./Uploads/FinancialUpload";
import GuarantorUpload from "./Uploads/GuarantorUpload";
import referencingService from '../services/referencingService';

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
  monthlyIncome: string;
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
}

interface AgentDetailsData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  hasAgreedToCheck: boolean;
}

interface FormData {
  identity: IdentityData;
  employment: EmploymentData;
  residential: ResidentialData;
  financial: FinancialData;
  guarantor: GuarantorData;
  creditCheck: CreditCheckData;
  agentDetails: AgentDetailsData;
}

const ReferencingModal: React.FC<ReferencingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
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
      monthlyIncome: '',
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
    },
    agentDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      hasAgreedToCheck: false
    }
  });

  const [lastSavedSteps, setLastSavedSteps] = useState<{ [key: number]: Date | null }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({
    1: 'empty',
    2: 'empty',
    3: 'empty',
    4: 'empty',
    5: 'empty',
    6: 'empty',
    7: 'empty'
  });

  const updateFormData = (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...data
      }
    }));

    const stepMap: { [key in keyof FormData]: number } = {
      identity: 1,
      employment: 2,
      residential: 3,
      financial: 4,
      guarantor: 5,
      creditCheck: 6,
      agentDetails: 7
    };

    const stepIndex = stepMap[step];
    const status = determineStepStatus(step, { ...formData[step], ...data });

    setStepStatus(prev => ({
      ...prev,
      [stepIndex]: status
    }));
  };

  const determineStepStatus = (step: keyof FormData, data: any): 'empty' | 'partial' | 'complete' => {
    switch(step) {
      case 'identity':
        if (data.firstName && data.lastName && data.email && data.phoneNumber && data.dateOfBirth && data.nationality) 
          return 'complete';
        if (data.firstName || data.lastName || data.email || data.phoneNumber || data.dateOfBirth || data.nationality) 
          return 'partial';
        return 'empty';
      
      case 'employment':
        if (data.employmentStatus && data.companyDetails && data.jobPosition && data.referenceFullName && data.referenceEmail && data.referencePhone && data.proofType && data.lengthOfEmployment) 
          return 'complete';
        if (data.employmentStatus || data.companyDetails || data.jobPosition || data.referenceFullName || data.referenceEmail || data.referencePhone || data.proofType || data.lengthOfEmployment) 
          return 'partial';
        return 'empty';
      
      case 'residential':
        if (data.currentAddress && data.durationAtCurrentAddress && data.previousAddress && data.durationAtPreviousAddress && data.reasonForLeaving && data.proofType) 
          return 'complete';
        if (data.currentAddress || data.durationAtCurrentAddress || data.previousAddress || data.durationAtPreviousAddress || data.reasonForLeaving || data.proofType) 
          return 'partial';
        return 'empty';
      
      case 'financial':
        if (data.proofOfIncomeType && data.monthlyIncome) 
          return 'complete';
        if (data.proofOfIncomeType || data.monthlyIncome) 
          return 'partial';
        return 'empty';
      
      case 'guarantor':
        if (data.firstName && data.lastName && data.email && data.phoneNumber && data.address ) 
          return 'complete';
        if (data.firstName || data.lastName || data.email || data.phoneNumber || data.address) 
          return 'partial';
        return 'empty';
      
      case 'creditCheck':
        const identityData = data.identity || {};
        const hasCriticalIdentityInfo = 
          identityData.firstName && 
          identityData.lastName && 
          identityData.email && 
          identityData.phoneNumber &&
          identityData.dateOfBirth;

        return hasCriticalIdentityInfo ? 'complete' : 'empty';
      
      case 'agentDetails':
        if (data.firstName && data.lastName && data.email && data.phoneNumber && data.hasAgreedToCheck) 
          return 'complete';
        if (data.firstName || data.lastName || data.email || data.phoneNumber)
          return 'partial';
        return 'empty';
      
      default:
        return 'empty';
    }
  };

  const renderSidebarNavigation = () => {
    const steps = [
      { icon: User, text: 'Identity', step: 1, dataKey: 'identity' },
      { icon: Briefcase, text: 'Employment', step: 2, dataKey: 'employment' },
      { icon: Home, text: 'Residential', step: 3, dataKey: 'residential' },
      { icon: PoundSterling, text: 'Financial', step: 4, dataKey: 'financial' },
      { icon: Users, text: 'Guarantor', step: 5, dataKey: 'guarantor' },
      { icon: CreditCard, text: 'Credit Check', step: 6, dataKey: 'creditCheck' },
      { icon: User, text: 'Agent Details', step: 7, dataKey: 'agentDetails' }
    ];

    return steps.map(({ icon: Icon, text, step, dataKey }) => {
      const status = stepStatus[step];
      const shouldShowDot = status !== 'empty';
      let dotColor = '';
      switch(status) {
        case 'partial':
          dotColor = 'bg-orange-500';
          break;
        case 'complete':
          dotColor = 'bg-green-500';
          break;
        default:
          dotColor = 'bg-gray-300';
      }

      return (
        <li
          key={step}
          onClick={() => goToStep(step)}
          className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all ${
            currentStep === step
              ? 'bg-blue-100 text-black font-semibold rounded-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon size={18} className={currentStep === step ? 'text-orange-600' : 'text-gray-500'} />
          <span>{text}</span>
          {shouldShowDot && (
          <span 
            className={`ml-auto w-3 h-3 rounded-full ${dotColor}`}
            title={`Status: ${status}`}
          />
          )}
        </li>
      );
    });
  };

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

  const saveCurrentStep = async () => {
    try {
      setIsSaving(true);
      
      if (!user) {
        throw new Error('No user found. Please login again.');
      }

      const userId = user.id || user.localAccountId || user.homeAccountId;
      
      if (!userId) {
        throw new Error('User ID is required. Please login again.');
      }

      // Validate current step data before saving
      const currentSections = {
        1: 'identity',
        2: 'employment',
        3: 'residential',
        4: 'financial',
        5: 'guarantor',
        6: 'creditCheck',
        7: 'agentDetails'
      } as const;

      const currentSection = currentSections[currentStep as keyof typeof currentSections];
      const currentStepData = formData[currentSection];

      if (!currentStepData) {
        throw new Error('No data to save for current step');
      }

      let saveResult;
      
      switch(currentStep) {
        case 1:
          saveResult = await referencingService.saveIdentityData(userId, formData.identity);
          break;
        case 2:
          saveResult = await referencingService.saveEmploymentData(userId, formData.employment);
          break;
        case 3:
          saveResult = await referencingService.saveResidentialData(userId, formData.residential);
          break;
        case 4:
          saveResult = await referencingService.saveFinancialData(userId, formData.financial);
          break;
        case 5:
          saveResult = await referencingService.saveGuarantorData(userId, formData.guarantor);
          break;
        case 7:
          saveResult = await referencingService.saveAgentDetailsData(userId, formData.agentDetails);
          break;
        default:
          throw new Error('Invalid step');
      }

      if (!saveResult) {
        throw new Error('Save operation failed');
      }

      setLastSavedSteps(prev => ({
        ...prev,
        [currentStep]: new Date()
      }));

      // Show success message
      alert('Data saved successfully!');

    } catch (error: any) {
      console.error('Error saving form data:', error);
      alert(`Failed to save data: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setIsMenuOpen(false);
  };

  const nextStep = async () => {
    if (currentStep < 7) {
      await saveCurrentStep();
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const checkFormCompleteness = () => {
    const allStepsComplete = Object.values(stepStatus).every(status => status === 'complete');
    setIsFormComplete(allStepsComplete);
    return allStepsComplete;
  };

  const TypingAnimation = ({ text, className }) => {
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);
    
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (!isDeleting) {
          if (currentIndex < text.length) {
            setDisplayText(text.substring(0, currentIndex + 1));
            setCurrentIndex(prevIndex => prevIndex + 1);
            setTypingSpeed(150);
          } else {
            setIsDeleting(true);
            setTypingSpeed(1000);
          }
        } else {
          if (currentIndex > 0) {
            setDisplayText(text.substring(0, currentIndex - 1));
            setCurrentIndex(prevIndex => prevIndex - 1);
            setTypingSpeed(75);
          } else {
            setIsDeleting(false);
            setTypingSpeed(500);
          }
        }
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    }, [currentIndex, isDeleting, text, typingSpeed]);
    
    return <h2 className={className}>{displayText}<span className="animate-pulse">|</span></h2>;
  };

  const submitApplication = async () => {
    const isComplete = checkFormCompleteness();
    if (!isComplete) {
      setShowWarningModal(true);
      return;
    }
    proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    try {
      setIsSubmitting(true);
      await saveCurrentStep();
      const userId = user?.id || '';
      await referencingService.submitApplication(userId, formData);
      alert('Your application has been submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const WarningModal = () => {
    if (!showWarningModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-100 p-2 rounded-full">
              <AlertTriangle className="text-yellow-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold ml-3">Incomplete Form</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Your form is incomplete. Some information may be missing or incorrect.
            Are you sure you want to submit anyway?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowWarningModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowWarningModal(false);
                proceedWithSubmission();
              }}
              className="px-4 py-2 bg-[#E65D24] text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    checkFormCompleteness();
  }, [stepStatus]);

  useEffect(() => {
    const loadUserData = async () => {
      if (user && user.id) {
        try {
          const userData = await referencingService.getFormData(user.id);
          setFormData(prevData => ({
            identity: { ...prevData.identity, ...userData.identity },
            employment: { ...prevData.employment, ...userData.employment },
            residential: { ...prevData.residential, ...userData.residential },
            financial: { ...prevData.financial, ...userData.financial },
            guarantor: { ...prevData.guarantor, ...userData.guarantor },
            creditCheck: { ...prevData.creditCheck },
            agentDetails: { ...prevData.agentDetails, ...userData.agentDetails }
          }));
          Object.keys(userData).forEach(step => {
            if (userData[step] && Object.keys(userData[step]).length > 0) {
              const stepIndex = {
                identity: 1,
                employment: 2,
                residential: 3,
                financial: 4,
                guarantor: 5,
                creditCheck: 6,
                agentDetails: 7
              }[step];
              if (stepIndex) {
                const status = determineStepStatus(step, userData[step]);
                setStepStatus(prev => ({
                  ...prev,
                  [stepIndex]: status
                }));
              }
            }
          });
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="relative">
            <h3 className="text-xl font-semibold mb-6">Fill in your personal details below</h3>
            <div className="bg-white rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Nationality</label>
                <select
                  value={formData.identity.nationality}
                  onChange={(e) => updateFormData('identity', { nationality: e.target.value })}
                  className={`w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.identity.nationality ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select Nationality</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Afghanistan">Afghanistan</option>
                  <option value="Albania">Albania</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Andorra">Andorra</option>
                  <option value="Angola">Angola</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Australia">Australia</option>
                  <option value="Austria">Austria</option>
                  <option value="Azerbaijan">Azerbaijan</option>
                  <option value="Bahamas">Bahamas</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Barbados">Barbados</option>
                  <option value="Belarus">Belarus</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Belize">Belize</option>
                  <option value="Benin">Benin</option>
                  <option value="Bhutan">Bhutan</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                  <option value="Botswana">Botswana</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Brunei">Brunei</option>
                  <option value="Bulgaria">Bulgaria</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Burundi">Burundi</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="Cameroon">Cameroon</option>
                  <option value="Canada">Canada</option>
                  <option value="Cape Verde">Cape Verde</option>
                  <option value="Central African Republic">Central African Republic</option>
                  <option value="Chad">Chad</option>
                  <option value="Chile">Chile</option>
                  <option value="China">China</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Comoros">Comoros</option>
                  <option value="Congo">Congo</option>
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="Croatia">Croatia</option>
                  <option value="Cuba">Cuba</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Djibouti">Djibouti</option>
                  <option value="Dominican Republic">Dominican Republic</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Egypt">Egypt</option>
                  <option value="El Salvador">El Salvador</option>
                  <option value="Estonia">Estonia</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Fiji">Fiji</option>
                  <option value="Finland">Finland</option>
                  <option value="France">France</option>
                  <option value="Gabon">Gabon</option>
                  <option value="Gambia">Gambia</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Germany">Germany</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Greece">Greece</option>
                  <option value="Grenada">Grenada</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value="Guinea">Guinea</option>
                  <option value="Honduras">Honduras</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Iceland">Iceland</option>
                  <option value="India">India</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Iran">Iran</option>
                  <option value="Iraq">Iraq</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Israel">Israel</option>
                  <option value="Italy">Italy</option>
                  <option value="Jamaica">Jamaica</option>
                  <option value="Japan">Japan</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Kyrgyzstan">Kyrgyzstan</option>
                  <option value="Laos">Laos</option>
                  <option value="Latvia">Latvia</option>
                  <option value="Lebanon">Lebanon</option>
                  <option value="Libya">Libya</option>
                  <option value="Liechtenstein">Liechtenstein</option>
                  <option value="Lithuania">Lithuania</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Madagascar">Madagascar</option>
                  <option value="Malawi">Malawi</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Maldives">Maldives</option>
                  <option value="Mali">Mali</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Moldova">Moldova</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Mongolia">Mongolia</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Mozambique">Mozambique</option>
                  <option value="Myanmar">Myanmar</option>
                  <option value="Namibia">Namibia</option>
                  <option value="Nepal">Nepal</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="North Korea">North Korea</option>
                  <option value="Norway">Norway</option>
                  <option value="Oman">Oman</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Palestine">Palestine</option>
                  <option value="Peru">Peru</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Romania">Romania</option>
                  <option value="Russia">Russia</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="South Africa">South Africa</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Spain">Spain</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Ukraine">Ukraine</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Zimbabwe">Zimbabwe</option>
                </select>
              </div>
            </div>
            <FileUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );
      case 2:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your employment details below</h2>
            </div>
            <div className="bg-white rounded-lg p-6 mb-6 grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Employment Status</label>
                <select
                  value={formData.employment.employmentStatus}
                  onChange={(e) => updateFormData('employment', { employmentStatus: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.employment.employmentStatus ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select status</option>
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
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Referee - Full Name</label>
                <input
                  type="text"
                  value={formData.employment.referenceFullName}
                  onChange={(e) => updateFormData('employment', { referenceFullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Referee - Email Address</label>
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
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.employment.proofType ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select proof type</option>
                  <option value="Payslip">Payslip</option>
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Tax Return">Tax Return</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Referee - Phone Number</label>
                <input
                  type="tel"
                  value={formData.employment.referencePhone}
                  onChange={(e) => updateFormData('employment', { referencePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+44 123 456 7890"
                />
              </div>
            </div>
            <EmploymentUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );
      case 3:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your residential details below</h2>
            </div>
            <div className="bg-white rounded-lg p-6 mb-6 grid grid-cols-2 gap-x-6 gap-y-4">
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
                <label className="block text-gray-700 mb-2">Current Address</label>
                 <textarea
                  value={formData.residential.currentAddress}
                  onChange={(e) => updateFormData('residential', { currentAddress: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your current address"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2 whitespace-nowrap">Previous Address (If less than 3 yrs at current)</label>
                <input
                  type="text"
                  value={formData.residential.previousAddress}
                  onChange={(e) => updateFormData('residential', { previousAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your previous address"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">How long have you lived at this Address?</label>
                <select
                  value={formData.residential.durationAtCurrentAddress}
                  onChange={(e) => updateFormData('residential', { durationAtCurrentAddress: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.residential.durationAtCurrentAddress ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-3 years">2-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Proof of Address</label>
                <select
                  value={formData.residential.proofType}
                  onChange={(e) => updateFormData('residential', { proofType: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.residential.proofType ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select proof type</option>
                  <option value="Utility Bill">Utility Bill</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Council Tax Bill">Council Tax Bill</option>
                  <option value="Tenancy Agreement">Tenancy Agreement</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Select exact duration at this address</label>
                <select
                  value={formData.residential.durationAtPreviousAddress}
                  onChange={(e) => updateFormData('residential', { durationAtPreviousAddress: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.residential.durationAtPreviousAddress ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-3 years">2-3 years</option>
                </select>
              </div>
            </div>
            <ResidentialUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );
      case 4:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your financial details below</h2>
            </div>
            <div className="bg-white rounded-lg p-6 mb-6 grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Monthly Income (£)</label>
                <input
                  type="number"
                  value={formData.financial.monthlyIncome}
                  onChange={(e) => updateFormData('financial', { monthlyIncome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your monthly income"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 mb-2">Proof of income</label>
                <select
                  value={formData.financial.proofOfIncomeType}
                  onChange={(e) => updateFormData('financial', { proofOfIncomeType: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.financial.proofOfIncomeType ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select proof type</option>
                  <option value="Payslip">Recent Payslip</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Tax Return">Tax Return</option>
                  <option value="P60">P60</option>
                </select>
              </div>
            </div>
            <FinancialUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );
      case 5:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fill in your guarantor's personal details below</h2>
            </div>
            <div className="bg-white rounded-lg p-6 mb-6 grid grid-cols-2 gap-x-6 gap-y-4">
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
            <GuarantorUpload updateFormData={updateFormData} formData={formData} />
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
            <div className="rounded-lg p-6 text-center text-white" style={{ backgroundColor: '#136C9E' }}>
              <div className="flex justify-center mb-2">
                <div className="rounded-full p-2 w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#DC5F12' }}>
                  <Info className="text-white" size={24} />
                </div>
              </div>
              <TypingAnimation text="Coming Soon" className="text-2xl font-medium mb-2" />
              <p className="text-white text-sm">Automated live credit checks</p>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Fill in the agent's details below
              </h2>
            </div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Agent's First Name</label>
                  <input
                    type="text"
                    value={formData.agentDetails.firstName || ""}
                    onChange={(e) =>
                      updateFormData("agentDetails", {
                        ...formData.agentDetails,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Agent's Last Name</label>
                  <input
                    type="text"
                    value={formData.agentDetails.lastName || ""}
                    onChange={(e) =>
                      updateFormData("agentDetails", {
                        ...formData.agentDetails,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Agent's Email Address</label>
                  <input
                    type="email"
                    value={formData.agentDetails.email || ""}
                    onChange={(e) =>
                      updateFormData("agentDetails", {
                        ...formData.agentDetails,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-gray-700 mb-2">Agent's Phone Number</label>
                  <input
                    type="tel"
                    value={formData.agentDetails.phoneNumber || ""}
                    onChange={(e) =>
                      updateFormData("agentDetails", {
                        ...formData.agentDetails,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.agentDetails.hasAgreedToCheck || false}
                  onChange={(e) =>
                    updateFormData("agentDetails", {
                      ...formData.agentDetails,
                      hasAgreedToCheck: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-2 text-gray-700">
                  I authorise Proptii to perform a credit check using the information provided
                </span>
              </label>
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
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl mx-auto my-8 bg-white rounded-lg shadow-xl flex overflow-hidden min-h-[600px]">
        <div className="w-64 bg-gray-50 py-4 px-4 border-r border-gray-200 hidden md:block md:flex flex-col">
          <div className="mb-6 px-2">
            <h2 className="text-xl font-bold text-orange-600 mb-2">Referencing Steps</h2>
          </div>
          <div className="mb-6 px-2">
            <p className="text-sm text-gray-600 mb-4">
              The referencing process verifies renter or buyer identity, financial status, and rental history.
            </p>
          </div>
          <ul className="space-y-1">
            {renderSidebarNavigation()}
          </ul>
          <div className="mt-auto pt-6 px-2">
            <div className="text-sm text-gray-600 mb-2">Step {currentStep} of 7</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#136C9E] transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2">
                <Menu size={24} />
              </button>
              <h2 className="text-md font-semibold">Referencing Form</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
          {isMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
              <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl p-6">
                <button onClick={() => setIsMenuOpen(false)} className="mb-4">
                  <X size={24} />
                </button>
                <ul className="space-y-4">
                  {[
                    ["Identity", User, 1],
                    ["Employment", Briefcase, 2],
                    ["Residential", Home, 3],
                    ["Financial", Euro, 4],
                    ["Guarantor", Users, 5],
                    ["Credit Check", CreditCard, 6],
                    ["Agent Details", User, 7],
                  ].map(([label, Icon, step]) => (
                    <li
                      key={step}
                      onClick={() => {
                        goToStep(step);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-gray-100"
                    >
                      <Icon
                        size={18}
                        className={currentStep === step ? "text-orange-600" : "text-gray-500"}
                      />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f2f7fb]">
            {renderFormContent()}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div>
              {lastSavedSteps[currentStep] && (
                <div className="flex items-center text-sm text-gray-500 ml-2">
                  <CheckCircle className="text-green-500 mr-1" fontSize="small" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-[#136C9E] text-[#136C9E] rounded-md hover:bg-[#136C9E] hover:text-white transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={saveCurrentStep}
                className="px-6 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {currentStep < 7 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-[#136C9E] text-white rounded-md hover:bg-[#0F5A82] transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={submitApplication}
                  className="px-6 py-2 bg-[#E65D24] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !formData.agentDetails.hasAgreedToCheck}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <WarningModal />
    </div>
  );
};

export default ReferencingModal;