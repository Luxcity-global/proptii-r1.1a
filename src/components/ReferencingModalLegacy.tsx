import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  Menu, 
  User, 
  Briefcase, 
  Home, 
  PoundSterling, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Send,
  ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FileUpload from "./Uploads/FileUpload";
import EmploymentUpload from "./Uploads/EmploymentUpload";
import ResidentialUpload from "./Uploads/ResidentialUpload";
import FinancialUpload from "./Uploads/FinancialUpload";
import GuarantorUpload from "./Uploads/GuarantorUpload";
import referencingService from '../services/referencingService';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'react-hot-toast';
import QuickFillBanner from './referencing/ui/QuickFillBanner';
import { ExtractedData } from '../services/openRouterService';
import SendReferencingModal from './referencing/SendReferencingModal';

interface ReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionComplete?: () => void;
  initialStep?: number;
}

// Form data types for the 5 Referencing Passport steps
interface IdentityData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  dateOfBirthError?: string;
  isBritish: boolean;
  nationality: string;
  identityProof: StoredFile | File | null;
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
  proofDocument: StoredFile | File | null;
}

interface ResidentialData {
  currentAddress: string;
  durationAtCurrentAddress: string;
  previousAddress: string;
  durationAtPreviousAddress: string;
  reasonForLeaving: string;
  alreadyHavePropertyAddress: string;
  propertyAddress: string;
  proofType: string;
  proofDocument: StoredFile | File | null;
}

interface FinancialData {
  monthlyIncome: string;
  proofOfIncomeType: string;
  proofOfIncomeDocument: StoredFile | File | null;
  useOpenBanking: boolean;
  isConnectedToOpenBanking: boolean;
}

interface GuarantorData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  identityDocument: StoredFile | File | null;
}

export interface FormData {
  identity: IdentityData;
  employment: EmploymentData;
  residential: ResidentialData;
  financial: FinancialData;
  guarantor: GuarantorData;
}

interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl?: string;
  url?: string;
}

interface NavigationItem {
  label: string;
  Icon: LucideIcon;
  step: number;
}

const navigationItems: NavigationItem[] = [
  { label: "Identity", Icon: User, step: 1 },
  { label: "Employment", Icon: Briefcase, step: 2 },
  { label: "Residential", Icon: Home, step: 3 },
  { label: "Financial", Icon: PoundSterling, step: 4 },
  { label: "Guarantor", Icon: Users, step: 5 },
];

/** `<input type="date">` requires `yyyy-MM-dd` or ""; Firestore/JSON may store null as string `"null"`. */
function normalizeHtmlDateValue(value: unknown): string {
  if (value == null) return '';
  const s = String(value).trim();
  if (s === '' || s === 'null' || s === 'undefined') return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function mergeLoadedFormData(prev: FormData, patch: Partial<FormData>): FormData {
  return {
    ...prev,
    ...patch,
    identity: {
      ...prev.identity,
      ...(patch.identity || {}),
      dateOfBirth: normalizeHtmlDateValue(
        patch.identity?.dateOfBirth !== undefined
          ? patch.identity.dateOfBirth
          : prev.identity.dateOfBirth,
      ),
    },
  };
}

const fileToStoredFile = async (file: File): Promise<StoredFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File reading timeout'));
    }, 8000);

    reader.onload = () => {
      clearTimeout(timeout);
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        dataUrl: reader.result as string
      });
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('File reading failed'));
    };
    reader.readAsDataURL(file);
  });
};

const ReferencingModal: React.FC<ReferencingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmissionComplete, 
  initialStep = 1 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [showPostSaveDialog, setShowPostSaveDialog] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    identity: {
      firstName: user?.givenName || user?.name?.split(' ')[0] || '',
      lastName: user?.familyName || user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phoneNumber: '',
      dateOfBirth: '',
      dateOfBirthError: undefined,
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
      alreadyHavePropertyAddress: '',
      propertyAddress: '',
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
      address: '',
      identityDocument: null
    }
  });

  const [lastSavedSteps, setLastSavedSteps] = useState<{ [key: number]: Date | null }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileCache, setFileCache] = useState<Map<string, StoredFile>>(new Map());
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({
    1: 'partial',
    2: 'partial',
    3: 'partial',
    4: 'partial',
    5: 'partial'
  });

  // Calculate step status based on current form data
  useEffect(() => {
    const newStatus = {
      1: determineStepStatus('identity', formData.identity),
      2: determineStepStatus('employment', formData.employment),
      3: determineStepStatus('residential', formData.residential),
      4: determineStepStatus('financial', formData.financial),
      5: determineStepStatus('guarantor', formData.guarantor)
    };

    setStepStatus(newStatus);
  }, [formData]);

  const processFileUpload = async (file: File): Promise<StoredFile> => {
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (fileCache.has(cacheKey)) {
      return fileCache.get(cacheKey)!;
    }
    const storedFile = await fileToStoredFile(file);
    setFileCache(prev => new Map(prev.set(cacheKey, storedFile)));
    return storedFile;
  };

  const updateFormData = async (step: keyof FormData | string, data: Partial<FormData[keyof FormData]>) => {
    let processedData: any = { ...data };
    let fileProcessingPromises: Promise<void>[] = [];

    if ('identityProof' in data && (data as any).identityProof instanceof File) {
      fileProcessingPromises.push(
        processFileUpload((data as any).identityProof).then(result => {
          processedData.identityProof = result;
        })
      );
    }

    if ('proofDocument' in data && (data as any).proofDocument instanceof File) {
      fileProcessingPromises.push(
        processFileUpload((data as any).proofDocument).then(result => {
          processedData.proofDocument = result;
        })
      );
    }

    if ('identityDocument' in data && (data as any).identityDocument instanceof File) {
      fileProcessingPromises.push(
        processFileUpload((data as any).identityDocument).then(result => {
          processedData.identityDocument = result;
        })
      );
    }

    if ('proofOfIncomeDocument' in data && (data as any).proofOfIncomeDocument instanceof File) {
      fileProcessingPromises.push(
        processFileUpload((data as any).proofOfIncomeDocument).then(result => {
          processedData.proofOfIncomeDocument = result;
        })
      );
    }

    if (fileProcessingPromises.length > 0) {
      try {
        await Promise.all(fileProcessingPromises);
      } catch (error) {
        console.error('Error processing files:', error);
      }
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [step]: {
          ...prev[step as keyof FormData],
          ...processedData
        }
      };

      if (user?.id) {
        localStorage.setItem(`referencing_${user.id}_formData`, JSON.stringify(updated));
      }

      return updated;
    });
  };

  const determineStepStatus = (step: keyof FormData, data: any): 'empty' | 'partial' | 'complete' => {
    if (!data) return 'partial';

    switch (step) {
      case 'identity': {
        const hasAllRequiredFields = data.firstName && data.lastName && data.email && data.phoneNumber && data.dateOfBirth && data.nationality && !data.dateOfBirthError;
        const hasRequiredDocument = data.identityProof?.name && data.identityProof?.dataUrl;
        if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        return 'partial';
      }

      case 'employment': {
        const nonApplicableStatus = ['Unemployed', 'Retired', 'Student'];
        if (nonApplicableStatus.includes(data.employmentStatus)) {
          return 'complete';
        }
        if (data.employmentStatus && !nonApplicableStatus.includes(data.employmentStatus)) {
          const hasAllRequiredFields = data.employmentStatus && data.companyDetails && data.lengthOfEmployment && data.jobPosition && data.referenceFullName && data.referenceEmail && data.referencePhone && data.proofType;
          const hasRequiredDocument = data.proofDocument?.name && data.proofDocument?.dataUrl;
          if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        }
        return 'partial';
      }

      case 'residential': {
        let requiredFields = [
          'currentAddress', 'durationAtCurrentAddress', 'reasonForLeaving', 'proofType', 'alreadyHavePropertyAddress'
        ];
        if (data.alreadyHavePropertyAddress === 'Yes') {
          requiredFields.push('propertyAddress');
        }
        const needsPreviousAddress = data.durationAtCurrentAddress && data.durationAtCurrentAddress !== '2-3 years';
        if (needsPreviousAddress) {
          requiredFields.push('previousAddress', 'durationAtPreviousAddress');
        }
        const hasAllRequiredFields = requiredFields.every(field => !!data[field]);
        const hasRequiredDocument = data.proofDocument?.name && data.proofDocument?.dataUrl;
        if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        return 'partial';
      }

      case 'financial': {
        const hasAllRequiredFields = data.monthlyIncome && data.proofOfIncomeType;
        const hasRequiredDocument = data.proofOfIncomeDocument?.name && data.proofOfIncomeDocument?.dataUrl;
        const isOpenBankingConnected = data.useOpenBanking && data.isConnectedToOpenBanking;
        if (hasAllRequiredFields && (hasRequiredDocument || isOpenBankingConnected)) return 'complete';
        return 'partial';
      }

      case 'guarantor': {
        const hasAnyData = Object.values(data).some(value => !!value && value !== null && value !== '');
        if (hasAnyData) {
          const hasAllRequiredFields = data.firstName && data.lastName && data.email && data.phoneNumber && data.address;
          const hasRequiredDocument = data.identityDocument?.name && data.identityDocument?.dataUrl;
          if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
          return 'partial';
        }
        return 'complete'; // Optional, complete if not needed
      }

      default:
        return 'partial';
    }
  };

  const renderSidebarNavigation = () => {
    return navigationItems.map(({ label, Icon, step }) => {
      const status = stepStatus[step];
      let dotColor = status === 'complete' ? 'bg-green-500' : 'bg-orange-500';

      return (
        <li
          key={step}
          onClick={() => setCurrentStep(step)}
          className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all ${
            currentStep === step
              ? 'bg-blue-100 text-black font-semibold rounded-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon size={18} className={currentStep === step ? 'text-orange-600' : 'text-gray-500'} />
          <span>{label}</span>
          <span
            className={`ml-auto w-3 h-3 rounded-full ${dotColor}`}
            title={`Status: ${status}`}
          />
        </li>
      );
    });
  };

  // Load stored data on mount
  useEffect(() => {
    const loadStoredData = async () => {
      if (!user?.id) return;
      try {
        const propertyId = `general_${user.id}`;
        const result = await firestoreService.getReferencingForm(user.id, propertyId);
        if (result.success && result.data && result.data.formData) {
          setFormData(prev => mergeLoadedFormData(prev, result.data!.formData as any));
        } else {
          const localData = localStorage.getItem(`referencing_${user.id}_formData`);
          if (localData) {
            setFormData(prev => mergeLoadedFormData(prev, JSON.parse(localData)));
          }
        }
      } catch (err) {
        console.warn('Error loading referencing data:', err);
      }
    };

    loadStoredData();
  }, [user?.id]);

  const saveCurrentStep = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    
    // Evaluate if the current step is complete
    let isComplete = false;
    switch(currentStep) {
      case 1:
        isComplete = !!(formData.identity.firstName && formData.identity.lastName && formData.identity.email && formData.identity.phoneNumber && formData.identity.dateOfBirth && formData.identity.identityProof);
        break;
      case 2:
        isComplete = !!(formData.employment.employmentStatus && formData.employment.companyDetails && formData.employment.jobPosition && formData.employment.proofDocument);
        break;
      case 3:
        isComplete = !!(formData.residential.currentAddress && formData.residential.durationAtCurrentAddress && formData.residential.proofDocument);
        break;
      case 4:
        isComplete = !!(formData.financial.monthlyIncome && (formData.financial.proofOfIncomeDocument || formData.financial.useOpenBanking));
        break;
      case 5:
        isComplete = !!(formData.guarantor.firstName && formData.guarantor.lastName && formData.guarantor.email);
        // If empty, mark as partial or empty. But actually step 5 is optional for some, let's strictly check if filled.
        if (!formData.guarantor.firstName && !formData.guarantor.lastName) isComplete = true; // treat as complete if intentionally skipped
        break;
    }

    const newStepStatus = {
      ...stepStatus,
      [currentStep]: isComplete ? 'complete' : 'partial'
    } as any;
    
    setStepStatus(newStepStatus);

    try {
      const propertyId = `general_${user.id}`;
      await firestoreService.saveReferencingForm(
        user.id,
        propertyId,
        formData as any,
        currentStep,
        newStepStatus
      );
      setLastSavedSteps(prev => ({ ...prev, [currentStep]: new Date() }));
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      toast.success('Passport progress saved!');
    } catch (err) {
      console.error('Error saving step:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await saveCurrentStep();
    onClose();
  };

  const nextStep = async () => {
    await saveCurrentStep();
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Step 5 completed: Save passport and show post-save dialog
      handleCompleteAndSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteAndSave = async () => {
    const userId = user?.id || 'anonymous_tenant';
    setIsSubmitting(true);
    try {
      // Save is already handled by saveCurrentStep before this is called
      localStorage.setItem(`referencing_${userId}_submitted`, 'true');
      toast.success('Referencing Passport saved!');
      setShowPostSaveDialog(true);
    } catch (err) {
      console.error('Error saving referencing passport:', err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIDataExtracted = (data: ExtractedData) => {
    if (data.firstName || data.lastName) {
      setFormData(prev => ({
        ...prev,
        identity: {
          ...prev.identity,
          firstName: data.firstName || prev.identity.firstName,
          lastName: data.lastName || prev.identity.lastName
        }
      }));
    }
    if (data.email) {
      setFormData(prev => ({
        ...prev,
        identity: { ...prev.identity, email: data.email! }
      }));
    }
    if (data.phoneNumber) {
      setFormData(prev => ({
        ...prev,
        identity: { ...prev.identity, phoneNumber: data.phoneNumber! }
      }));
    }
    if (data.companyDetails) {
      setFormData(prev => ({
        ...prev,
        employment: { ...prev.employment, companyDetails: data.companyDetails! }
      }));
    }
    if (data.jobPosition) {
      setFormData(prev => ({
        ...prev,
        employment: { ...prev.employment, jobPosition: data.jobPosition! }
      }));
    }
    if (data.monthlyIncome) {
      setFormData(prev => ({
        ...prev,
        financial: { ...prev.financial, monthlyIncome: data.monthlyIncome! }
      }));
    }
    toast.success('AI Extracted document details populated!');
  };

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="relative">
            <QuickFillBanner onDataExtracted={handleAIDataExtracted} />
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">1. Identity Verification</h2>
              <p className="text-xs sm:text-sm text-gray-500">Your verified identity details for tenancy checks</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.identity.firstName}
                  onChange={(e) => updateFormData('identity', { firstName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.identity.lastName}
                  onChange={(e) => updateFormData('identity', { lastName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.identity.email}
                  onChange={(e) => updateFormData('identity', { email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.identity.phoneNumber}
                  onChange={(e) => updateFormData('identity', { phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="07123 456789"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.identity.dateOfBirth}
                  onChange={(e) => updateFormData('identity', { dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  value={formData.identity.nationality}
                  onChange={(e) => updateFormData('identity', { nationality: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. British, Irish, French"
                />
              </div>
            </div>
            <FileUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );

      case 2:
        return (
          <div className="relative">
            <QuickFillBanner onDataExtracted={handleAIDataExtracted} />
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">2. Employment & Referee Details</h2>
              <p className="text-xs sm:text-sm text-gray-500">Provide employment details or reference contact</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Status *</label>
                <select
                  value={formData.employment.employmentStatus}
                  onChange={(e) => updateFormData('employment', { employmentStatus: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
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
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Employer Name</label>
                <input
                  type="text"
                  value={formData.employment.companyDetails}
                  onChange={(e) => updateFormData('employment', { companyDetails: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Position / Title</label>
                <input
                  type="text"
                  value={formData.employment.jobPosition}
                  onChange={(e) => updateFormData('employment', { jobPosition: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Length of Employment</label>
                <input
                  type="text"
                  value={formData.employment.lengthOfEmployment}
                  onChange={(e) => updateFormData('employment', { lengthOfEmployment: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. 2 years"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Referee Full Name</label>
                <input
                  type="text"
                  value={formData.employment.referenceFullName}
                  onChange={(e) => updateFormData('employment', { referenceFullName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. John Manager"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Referee Email Address</label>
                <input
                  type="email"
                  value={formData.employment.referenceEmail}
                  onChange={(e) => updateFormData('employment', { referenceEmail: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="referee@company.com"
                />
              </div>
            </div>
            <EmploymentUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );

      case 3:
        return (
          <div className="relative">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">3. Residential History</h2>
              <p className="text-xs sm:text-sm text-gray-500">Current & previous address records</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Address *</label>
                <input
                  type="text"
                  value={formData.residential.currentAddress}
                  onChange={(e) => updateFormData('residential', { currentAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="Current full address"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration at Current Address *</label>
                <select
                  value={formData.residential.durationAtCurrentAddress}
                  onChange={(e) => updateFormData('residential', { durationAtCurrentAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                >
                  <option value="" disabled>Select duration</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-3 years">2-3 years</option>
                  <option value="3+ years">3+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Moving</label>
                <input
                  type="text"
                  value={formData.residential.reasonForLeaving}
                  onChange={(e) => updateFormData('residential', { reasonForLeaving: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. Relocating for work"
                />
              </div>
            </div>
            <ResidentialUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );

      case 4:
        return (
          <div className="relative">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">4. Financial & Affordability</h2>
              <p className="text-xs sm:text-sm text-gray-500">Monthly earnings and income verification</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Income (£) *</label>
                <input
                  type="number"
                  value={formData.financial.monthlyIncome}
                  onChange={(e) => updateFormData('financial', { monthlyIncome: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="e.g. 3500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proof of Income Type *</label>
                <select
                  value={formData.financial.proofOfIncomeType}
                  onChange={(e) => updateFormData('financial', { proofOfIncomeType: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
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
            <QuickFillBanner onDataExtracted={handleAIDataExtracted} />
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">5. Guarantor Details</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Optional
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Skip this section if you do not require a guarantor.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guarantor First Name</label>
                <input
                  type="text"
                  value={formData.guarantor.firstName}
                  onChange={(e) => updateFormData('guarantor', { firstName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guarantor Last Name</label>
                <input
                  type="text"
                  value={formData.guarantor.lastName}
                  onChange={(e) => updateFormData('guarantor', { lastName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guarantor Email</label>
                <input
                  type="email"
                  value={formData.guarantor.email}
                  onChange={(e) => updateFormData('guarantor', { email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="guarantor@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guarantor Phone</label>
                <input
                  type="tel"
                  value={formData.guarantor.phoneNumber}
                  onChange={(e) => updateFormData('guarantor', { phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="07123 456789"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guarantor Address</label>
                <input
                  type="text"
                  value={formData.guarantor.address}
                  onChange={(e) => updateFormData('guarantor', { address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  placeholder="Guarantor full address"
                />
              </div>
            </div>
            <GuarantorUpload updateFormData={updateFormData} formData={formData} />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-sans">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden h-[85vh] sm:h-[82vh] md:min-h-[600px] max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Desktop Sidebar */}
          <div className="w-64 bg-gray-50/80 py-5 px-4 border-r border-gray-200 hidden md:flex flex-col">
            <div className="mb-4 px-2">
              <h2 className="text-lg font-bold text-orange-600">Referencing Passport</h2>
              <p className="text-xs text-gray-500 mt-1">
                Fill once, update anytime, and share with multiple landlords & agents.
              </p>
            </div>
            <ul className="space-y-1">
              {renderSidebarNavigation()}
            </ul>
            <div className="mt-auto pt-4 px-2">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Step {currentStep} of 5</span>
                <span className="font-semibold">{Math.round((currentStep / 5) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#136C9E] transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col max-h-[92vh]">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100">
                  <Menu size={20} />
                </button>
                <h2 className="text-sm sm:text-base font-bold text-gray-800">
                  Tenant Referencing Passport
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSendModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: '#DC5F12' }}
                  title="Send passport to a Landlord or Agent"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send to Landlord / Agent</span>
                  <span className="sm:hidden">Send</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
              {renderFormContent()}
            </div>

            {/* Bottom Footer Actions */}
            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
              <div>
                {(lastSavedSteps[currentStep] || showSaveSuccess) && (
                  <div className="flex items-center text-xs text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Saved</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleSaveAndClose}
                  className="px-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-200 transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Close'}
                </button>

                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className="px-5 py-2 text-sm font-semibold bg-[#136C9E] text-white rounded-xl hover:bg-[#0F5A82] transition-colors flex items-center gap-1.5"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteAndSave}
                    className="px-5 py-2 text-sm font-semibold bg-[#DC5F12] text-white rounded-xl hover:bg-opacity-95 transition-all shadow-md flex items-center gap-1.5"
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Passport'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-save dialog: send now or just close */}
      {showPostSaveDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          {(() => {
            const steps = [1, 2, 3, 4, 5];
            const completedSteps = steps.filter(step => stepStatus[step] === 'complete').length;
            const progress = Math.round((completedSteps / steps.length) * 100);
            const canSend = progress >= 75;

            return (
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Passport Saved!</h3>
                    <p className="text-xs text-gray-500">Would you like to send it to a landlord or agent now?</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowPostSaveDialog(false);
                      setIsSendModalOpen(true);
                    }}
                    disabled={!canSend}
                    title={!canSend ? "Your passport must be at least 75% complete before you can send it" : ""}
                    className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 ${!canSend ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-95'}`}
                    style={{ backgroundColor: !canSend ? '#9CA3AF' : '#DC5F12' }}
                  >
                    <Send className="w-4 h-4" />
                    Send to Landlord / Agent Now
                  </button>
              <button
                onClick={() => {
                  setShowPostSaveDialog(false);
                  if (onSubmissionComplete) onSubmissionComplete();
                  onClose();
                }}
                className="w-full py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Save Only — I'll send later
              </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Standalone Send/Share Modal */}
      <SendReferencingModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onEditPassport={() => {
          setIsSendModalOpen(false);
          setCurrentStep(1);
        }}
        onShareComplete={() => {
          if (onSubmissionComplete) {
            onSubmissionComplete();
          }
        }}
      />
    </>
  );
};

export default ReferencingModal;