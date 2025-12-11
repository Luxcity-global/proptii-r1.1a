import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Menu, User, Briefcase, Home, Euro, Users, CreditCard, CheckCircle, PoundSterling, AlertTriangle, Info, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FileUpload from "./Uploads/FileUpload";
import EmploymentUpload from "./Uploads/EmploymentUpload";
import ResidentialUpload from "./Uploads/ResidentialUpload";
import FinancialUpload from "./Uploads/FinancialUpload";
import GuarantorUpload from "./Uploads/GuarantorUpload";
import referencingService from '../services/referencingService';
import emailService from '../services/emailService';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'react-hot-toast';

interface ReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionComplete?: () => void;
  initialStep?: number;
}

// Form data types for different steps
interface IdentityData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  dateOfBirthError?: string;
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
  alreadyHavePropertyAddress: string;
  propertyAddress: string;
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
  identityDocument: File | null;
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

export interface FormData {
  identity: IdentityData;
  employment: EmploymentData;
  residential: ResidentialData;
  financial: FinancialData;
  guarantor: GuarantorData;
  creditCheck: CreditCheckData;
  agentDetails: AgentDetailsData;
}

interface TypingAnimationProps {
  text: string;
  className: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ text, className }) => {
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

interface Attachment {
  filename: string;
  content: File;
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
  { label: "Financial", Icon: Euro, step: 4 },
  { label: "Guarantor", Icon: Users, step: 5 },
  // { label: "Credit Check", Icon: CreditCard, step: 6 },
  { label: "Agent Details", Icon: User, step: 7 }
];

// Ultra-fast file processing with aggressive optimization
const fileToStoredFile = async (file: File): Promise<StoredFile> => {
  let processedFile = file;

  // Only compress if file is large (>500KB) to save processing time
  if (file.type.startsWith('image/') && file.size > 500 * 1024) {
    try {
      processedFile = await compressImage(file, 150); // More aggressive compression
      console.log(`Fast compressed ${file.name} from ${(file.size / 1024).toFixed(1)}KB to ${(processedFile.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.warn('Compression failed, using original file:', error);
      processedFile = file;
    }
  }

  // Use faster file reading with timeout
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File reading timeout'));
    }, 5000); // 5 second timeout

    reader.onload = () => {
      clearTimeout(timeout);
      const dataUrl = reader.result as string;
      resolve({
        name: processedFile.name,
        type: processedFile.type,
        size: processedFile.size,
        lastModified: processedFile.lastModified,
        dataUrl: dataUrl
      });
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('File reading failed'));
    };
    reader.readAsDataURL(processedFile);
  });
};

// Add interfaces for stored file data
interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
}

// Add this helper function before the ReferencingModal component
const base64ToFile = (storedFile: StoredFile): File => {
  // Convert base64 to blob
  const arr = storedFile.dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  // Create File from Blob
  return new File([blob], storedFile.name, {
    type: storedFile.type,
    lastModified: storedFile.lastModified
  });
};

interface StoredFormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    dateOfBirthError?: string;
    isBritish: boolean;
    nationality: string;
    identityProof: StoredFile | null;
  };
  employment: {
    employmentStatus: string;
    companyDetails: string;
    lengthOfEmployment: string;
    jobPosition: string;
    referenceFullName: string;
    referenceEmail: string;
    referencePhone: string;
    proofType: string;
    proofDocument: StoredFile | null;
  };
  residential: {
    currentAddress: string;
    durationAtCurrentAddress: string;
    previousAddress: string;
    durationAtPreviousAddress: string;
    reasonForLeaving: string;
    alreadyHavePropertyAddress: string;
    propertyAddress: string;
    proofType: string;
    proofDocument: StoredFile | null;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument: StoredFile | null;
    useOpenBanking: boolean;
    isConnectedToOpenBanking: boolean;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    identityDocument: StoredFile | null;
  };
  creditCheck: {};
  agentDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    hasAgreedToCheck: boolean;
  };
}

interface UploadProps {
  updateFormData: (step: keyof FormData | string, data: Partial<FormData[keyof FormData]>) => void;
  formData: FormData;
}

// Ultra-fast image compression with minimal quality for speed
const compressImage = (file: File, maxSizeKB: number = 150): Promise<File> => {
  return new Promise((resolve) => {
    // Check if file is already small enough
    if (file.size <= maxSizeKB * 1024) {
      console.log(`File ${file.name} is already small enough (${(file.size / 1024).toFixed(1)}KB)`);
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Add timeout for image loading
    const timeout = setTimeout(() => {
      console.warn('Image loading timeout, using original file');
      resolve(file);
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);

      // Calculate dimensions - more aggressive scaling for speed
      let { width, height } = img;
      const maxDimension = 600; // Further reduced for faster processing

      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw with optimized settings
      ctx?.drawImage(img, 0, 0, width, height);

      // Single-pass compression for speed
      const quality = 0.4; // Very aggressive quality for speed

      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const compressedSizeKB = compressedFile.size / 1024;
          console.log(`Ultra-fast compressed: ${compressedSizeKB.toFixed(1)}KB (was ${(file.size / 1024).toFixed(1)}KB)`);
          resolve(compressedFile);
        } else {
          console.warn('Compression failed, using original file');
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('Image loading failed, using original file');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

const ReferencingModal: React.FC<ReferencingModalProps> = ({ isOpen, onClose, onSubmissionComplete, initialStep = 1 }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    identity: {
      firstName: user?.givenName || '',
      lastName: user?.familyName || '',
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileCache, setFileCache] = useState<Map<string, StoredFile>>(new Map());
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({
    1: 'partial', // Orange by default
    2: 'partial', // Orange by default
    3: 'partial', // Orange by default
    4: 'partial', // Orange by default
    5: 'partial', // Orange by default (even for optional guarantor)
    // 6: 'empty', // Credit check step commented out
    7: 'partial' // Orange by default
  });

  // Load status from localStorage on mount (only once)
  useEffect(() => {
    if (user?.id) {
      // Don't load step status from localStorage - let it be calculated from current formData
    }
  }, [user?.id]);

  // Calculate step status based on current form data (runs after data changes)
  useEffect(() => {
    const newStatus = {
      1: determineStepStatus('identity', formData.identity),
      2: determineStepStatus('employment', formData.employment),
      3: determineStepStatus('residential', formData.residential),
      4: determineStepStatus('financial', formData.financial),
      5: determineStepStatus('guarantor', formData.guarantor),
      // 6: determineStepStatus('creditCheck', formData), // Credit check step commented out
      7: determineStepStatus('agentDetails', formData.agentDetails)
    };

    console.log('📊 Calculated Status:', newStatus);
    console.log('👤 Agent Details Data:', formData.agentDetails);

    setStepStatus(newStatus);
  }, [formData]);

  // Ultra-fast file processing with caching to avoid reprocessing
  const processFileUpload = async (file: File): Promise<StoredFile> => {
    // Create a cache key based on file properties
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;

    // Check if file is already processed and cached
    if (fileCache.has(cacheKey)) {
      console.log(`Using cached file: ${file.name}`);
      return fileCache.get(cacheKey)!;
    }

    // Process the file
    const storedFile = await fileToStoredFile(file);

    // Cache the result for future use
    setFileCache(prev => new Map(prev.set(cacheKey, storedFile)));

    return storedFile;
  };

  // Optimized updateFormData with reduced localStorage operations
  const updateFormData = async (step: keyof FormData | string, data: Partial<FormData[keyof FormData]>) => {
    let processedData: any = { ...data };
    let hasFilesToProcess = false;
    let fileProcessingPromises: Promise<void>[] = [];

    // Batch file processing operations
    const processFiles = async () => {
      // Check and process file uploads in parallel
      if ('identityProof' in data && (data as any).identityProof instanceof File) {
        hasFilesToProcess = true;
        fileProcessingPromises.push(
          processFileUpload((data as any).identityProof).then(result => {
            (processedData as any).identityProof = result;
          })
        );
      }

      if ('proofDocument' in data && (data as any).proofDocument instanceof File) {
        hasFilesToProcess = true;
        fileProcessingPromises.push(
          processFileUpload((data as any).proofDocument).then(result => {
            (processedData as any).proofDocument = result;
          })
        );
      }

      if ('identityDocument' in data && (data as any).identityDocument instanceof File) {
        hasFilesToProcess = true;
        fileProcessingPromises.push(
          processFileUpload((data as any).identityDocument).then(result => {
            (processedData as any).identityDocument = result;
          })
        );
      }

      if ('proofOfIncomeDocument' in data && (data as any).proofOfIncomeDocument instanceof File) {
        hasFilesToProcess = true;
        fileProcessingPromises.push(
          processFileUpload((data as any).proofOfIncomeDocument).then(result => {
            (processedData as any).proofOfIncomeDocument = result;
          })
        );
      }

      if (fileProcessingPromises.length > 0) {
        setIsProcessingFile(true);
        toast.loading('Processing files...', { id: 'file-processing' });

        try {
          await Promise.all(fileProcessingPromises);
          toast.dismiss('file-processing');
          toast.success('Files processed successfully!');
        } catch (error) {
          console.error('Error processing files:', error);
          toast.error('Failed to process files. Please try again.');
          setIsProcessingFile(false);
          toast.dismiss('file-processing');
          return;
        }

        setIsProcessingFile(false);
      }
    };

    await processFiles();

    setFormData(prev => {
      const updated = {
        ...prev,
        [step]: {
          ...prev[step as keyof FormData],
          ...processedData
        }
      };

      // Ultra-fast localStorage save using requestIdleCallback for better performance
      if (user?.id) {
        if (typeof window.requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            localStorage.setItem(`referencing_${user.id}_formData`, JSON.stringify(updated));
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            localStorage.setItem(`referencing_${user.id}_formData`, JSON.stringify(updated));
          }, 0);
        }
      }

      // Update step status immediately after form data update
      const stepMap: { [key: string]: number } = {
        identity: 1,
        employment: 2,
        residential: 3,
        financial: 4,
        guarantor: 5,
        // creditCheck: 6, // Credit check step commented out
        agentDetails: 7
      };

      const stepIndex = stepMap[step];
      if (stepIndex) {
        const currentStepData = { ...updated[step as keyof FormData] };
        const status = determineStepStatus(step as keyof FormData, currentStepData);

        setStepStatus(prevStatus => {
          const newStatus = {
            ...prevStatus,
            [stepIndex]: status
          };
          return newStatus;
        });
      }

      return updated;
    });
  };

  const determineStepStatus = (step: keyof FormData, data: any): 'empty' | 'partial' | 'complete' => {
    if (!data) return 'partial'; // Default to orange (partial) instead of empty

    switch (step) {
      case 'identity': {
        const hasAllRequiredFields = data.firstName && data.lastName && data.email && data.phoneNumber && data.dateOfBirth && data.nationality && !data.dateOfBirthError;
        const hasRequiredDocument = data.identityProof?.name && data.identityProof?.dataUrl;

        // Only return green when completely filled
        if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        return 'partial'; // Always orange until complete
      }

      case 'employment': {
        const nonApplicableStatus = ['Unemployed', 'Retired', 'Student'];
        
        // For non-applicable statuses, only status selection is required
        if (nonApplicableStatus.includes(data.employmentStatus)) {
          return 'complete';
        }

        // For employed statuses, require all employment fields AND document
        if (data.employmentStatus && !nonApplicableStatus.includes(data.employmentStatus)) {
          const hasAllRequiredFields = data.employmentStatus && data.companyDetails && data.lengthOfEmployment && data.jobPosition && data.referenceFullName && data.referenceEmail && data.referencePhone && data.proofType;
          const hasRequiredDocument = data.proofDocument?.name && data.proofDocument?.dataUrl;

          if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        }

        return 'partial'; // Always orange until complete
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

        // Only return green when completely filled
        if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
        return 'partial'; // Always orange until complete
      }

      case 'financial': {
        const hasAllRequiredFields = data.monthlyIncome && data.proofOfIncomeType;
        const hasRequiredDocument = data.proofOfIncomeDocument?.name && data.proofOfIncomeDocument?.dataUrl;
        const isOpenBankingConnected = data.useOpenBanking && data.isConnectedToOpenBanking;

        // Only return green when completely filled
        if (hasAllRequiredFields && (hasRequiredDocument || isOpenBankingConnected)) return 'complete';
        return 'partial'; // Always orange until complete
      }

      case 'guarantor': {
        // Guarantor section is completely optional
        const hasAnyData = Object.values(data).some(value => !!value && value !== null && value !== '');
        
        // If some data is entered, all fields + document must be complete for green
        if (hasAnyData) {
          const hasAllRequiredFields = data.firstName && data.lastName && data.email && data.phoneNumber && data.address;
          const hasRequiredDocument = data.identityDocument?.name && data.identityDocument?.dataUrl;

          if (hasAllRequiredFields && hasRequiredDocument) return 'complete';
          return 'partial'; // Orange if partially filled
        }
        
        // If no data entered, it's still orange by default (will be handled in the form completion check)
        return 'partial';
      }

      case 'agentDetails': {
        const hasAllRequiredFields = data.firstName && data.lastName && data.email && data.phoneNumber && data.hasAgreedToCheck;

        // Only return green when completely filled
        if (hasAllRequiredFields) return 'complete';
        return 'partial'; // Always orange until complete
      }

      default:
        return 'partial'; // Default to orange instead of empty
    }
  };

  const renderSidebarNavigation = () => {
    const steps = [
      { icon: User, text: 'Identity', step: 1, dataKey: 'identity' },
      { icon: Briefcase, text: 'Employment', step: 2, dataKey: 'employment' },
      { icon: Home, text: 'Residential', step: 3, dataKey: 'residential' },
      { icon: PoundSterling, text: 'Financial', step: 4, dataKey: 'financial' },
      { icon: Users, text: 'Guarantor', step: 5, dataKey: 'guarantor' },
      // { icon: CreditCard, text: 'Credit Check', step: 6, dataKey: 'creditCheck' },
      { icon: User, text: 'Agent Details', step: 7, dataKey: 'agentDetails' }
    ];

    return steps.map(({ icon: Icon, text, step, dataKey }) => {
      const status = stepStatus[step];
      let dotColor = 'bg-orange-500'; // Default to orange
      switch (status) {
        case 'partial':
          dotColor = 'bg-orange-500';
          break;
        case 'complete':
          dotColor = 'bg-green-500';
          break;
        case 'empty':
          dotColor = 'bg-orange-500'; // Show orange even for empty
          break;
        default:
          dotColor = 'bg-orange-500';
      }

      return (
        <li
          key={step}
          onClick={() => goToStep(step)}
          className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all ${currentStep === step
            ? 'bg-blue-100 text-black font-semibold rounded-lg'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Icon size={18} className={currentStep === step ? 'text-orange-600' : 'text-gray-500'} />
          <span>{text}</span>
          {/* Always show dot for all statuses */}
          <span
            className={`ml-auto w-3 h-3 rounded-full ${dotColor}`}
            title={`Status: ${status}`}
          />
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

  // Load stored data on mount - prioritize Firestore, fallback to localStorage
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.id) return;

      try {
        const propertyId = 'demo-property-123'; // Using demo property ID as in DashboardHome
        
        // First try to load from Firestore by specific property
        try {
          console.log('🔍 Attempting to load referencing form from Firestore:', { userId: user.id, propertyId });
          let firestoreResult = await firestoreService.getReferencingForm(user.id, propertyId);
          console.log('📋 Firestore result (specific property):', { success: firestoreResult.success, hasData: !!firestoreResult.data, error: firestoreResult.error });
          
          // If not found with specific propertyId, try to get all forms for user and use the latest one
          if (firestoreResult.success && !firestoreResult.data) {
            console.log('ℹ️ No data found for specific property, trying to get all forms for user...');
            const allFormsResult = await firestoreService.getUserReferencingForms(user.id);
            if (allFormsResult.success && allFormsResult.data && allFormsResult.data.length > 0) {
              // Use the most recently updated form
              const sortedForms = allFormsResult.data.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?._seconds || 0;
                const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?._seconds || 0;
                return bTime - aTime;
              });
              firestoreResult = { success: true, data: sortedForms[0] };
              console.log('✅ Found form data from user forms (using latest):', sortedForms[0]);
            }
          }
          
          if (firestoreResult.success && firestoreResult.data) {
            console.log('✅ Loading form data from Firestore:', firestoreResult.data);
            
            // Set form data from Firestore
            setFormData(prev => ({
              ...prev,
              ...firestoreResult.data!.formData
            }));
            
            // Set current step from Firestore (only if no initialStep provided)
            if (firestoreResult.data.currentStep && !initialStep) {
              setCurrentStep(firestoreResult.data.currentStep);
            }
            
            // Set step status from Firestore
            if (firestoreResult.data.stepStatus) {
              setStepStatus(firestoreResult.data.stepStatus);
            }
            
            return; // Exit early if Firestore data loaded successfully
          } else if (firestoreResult.success && !firestoreResult.data) {
            console.log('ℹ️ No data found in Firestore for this user');
          } else if (firestoreResult.error) {
            console.warn('⚠️ Firestore returned error:', firestoreResult.error);
          }
        } catch (error) {
          console.warn('❌ Failed to load from Firestore:', error);
        }
        
        // Fallback to localStorage if Firestore fails
        console.log('🔄 Falling back to localStorage...');
        
        // Load current step from localStorage
        const savedStep = localStorage.getItem(`referencing_${user.id}_currentStep`);
        if (savedStep) {
          setCurrentStep(parseInt(savedStep, 10));
        }

        // Load entire form data from localStorage
        const savedFormData = localStorage.getItem(`referencing_${user.id}_formData`);
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          setFormData(prev => ({
            ...prev,
            ...parsedData
          }));
        }

      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    };

    loadFormData();
  }, [user]);

  // Also load data when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      const loadDataOnOpen = async () => {
        try {
          const propertyId = 'demo-property-123';
          console.log('🔍 Loading data on modal open:', { userId: user.id, propertyId });
          
          let firestoreResult = await firestoreService.getReferencingForm(user.id, propertyId);
          console.log('📋 Firestore result on open (specific property):', { success: firestoreResult.success, hasData: !!firestoreResult.data });
          
          // If not found with specific propertyId, try to get all forms for user and use the latest one
          if (firestoreResult.success && !firestoreResult.data) {
            console.log('ℹ️ No data found for specific property on open, trying to get all forms for user...');
            const allFormsResult = await firestoreService.getUserReferencingForms(user.id);
            if (allFormsResult.success && allFormsResult.data && allFormsResult.data.length > 0) {
              // Use the most recently updated form
              const sortedForms = allFormsResult.data.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?._seconds || 0;
                const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?._seconds || 0;
                return bTime - aTime;
              });
              firestoreResult = { success: true, data: sortedForms[0] };
              console.log('✅ Found form data from user forms on open (using latest):', sortedForms[0]);
            }
          }
          
          if (firestoreResult.success && firestoreResult.data) {
            console.log('✅ Loading form data on modal open:', firestoreResult.data);
            
            // Set form data from Firestore
            setFormData(prev => ({
              ...prev,
              ...firestoreResult.data!.formData
            }));
            
            // Set current step - prioritize initialStep prop over saved step
            if (initialStep) {
              setCurrentStep(initialStep);
            } else if (firestoreResult.data.currentStep) {
              setCurrentStep(firestoreResult.data.currentStep);
            }
            
            // Set step status from Firestore
            if (firestoreResult.data.stepStatus) {
              setStepStatus(firestoreResult.data.stepStatus);
            }
          } else {
            console.log('ℹ️ No Firestore data found on modal open, falling back to localStorage');
            // Fallback to localStorage
            const savedFormData = localStorage.getItem(`referencing_${user.id}_formData`);
            if (savedFormData) {
              const parsedData = JSON.parse(savedFormData);
              setFormData(prev => ({
                ...prev,
                ...parsedData
              }));
            }
          }
        } catch (error) {
          console.warn('❌ Failed to load from Firestore on modal open:', error);
          // Fallback to localStorage
          const savedFormData = localStorage.getItem(`referencing_${user.id}_formData`);
          if (savedFormData) {
            const parsedData = JSON.parse(savedFormData);
            setFormData(prev => ({
              ...prev,
              ...parsedData
            }));
          }
        }
      };
      
      loadDataOnOpen();
    }
  }, [isOpen, user, initialStep]);

  // Save current step and all data
  const saveCurrentStep = async () => {
    try {
      setIsSaving(true);

      if (!user?.id) {
        throw new Error('No user found. Please login again.');
      }

      // Save current step to local storage (for backward compatibility)
      localStorage.setItem(`referencing_${user.id}_currentStep`, currentStep.toString());
      localStorage.setItem(`referencing_${user.id}_formData`, JSON.stringify(formData));
      localStorage.setItem(`referencing_${user.id}_stepStatus`, JSON.stringify(stepStatus));

      // Save to Firestore
      const propertyId = 'demo-property-123'; // Using demo property ID as in DashboardHome
      const saveResult = await firestoreService.saveReferencingForm(
        user.id,
        propertyId,
        formData,
        currentStep,
        stepStatus
      );

      if (!saveResult.success) {
        console.warn('Firestore save failed:', saveResult.error);
        // Don't throw error - continue with Cosmos DB save
        toast.error('Firestore save failed, but data will be saved locally');
      }

      // Also save to Cosmos DB for backward compatibility
      const section = getCurrentSection();
      if (section) {
        const currentSectionData = {
          ...formData[section],
          userId: user.id
        };

        let cosmosSaveResult;
        switch (currentStep) {
          case 1:
            cosmosSaveResult = await referencingService.saveIdentityData(currentSectionData);
            break;
          case 2:
            cosmosSaveResult = await referencingService.saveEmploymentData(currentSectionData);
            break;
          case 3:
            cosmosSaveResult = await referencingService.saveResidentialData(currentSectionData);
            break;
          case 4:
            cosmosSaveResult = await referencingService.saveFinancialData(currentSectionData);
            break;
          case 5:
            cosmosSaveResult = await referencingService.saveGuarantorData(currentSectionData);
            break;
          case 7:
            cosmosSaveResult = await referencingService.saveAgentDetailsData(currentSectionData);
            break;
          default:
            cosmosSaveResult = { success: true };
        }

        if (!cosmosSaveResult.success) {
          console.warn('Failed to save to Cosmos DB:', cosmosSaveResult.error);
        }
      }

      // Update last saved timestamp
      setLastSavedSteps(prev => ({
        ...prev,
        [currentStep]: new Date()
      }));

      // Show success message
      if (saveResult.success) {
        toast.success('Progress saved successfully to Firestore');
      } else {
        toast.success('Progress saved successfully (local storage)');
      }
      
      // Show save success indicator
      setShowSaveSuccess(true);
      
      // Auto-hide save success after 3 seconds
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error in save operation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get current section name
  const getCurrentSection = () => {
    switch (currentStep) {
      case 1:
        return 'identity';
      case 2:
        return 'employment';
      case 3:
        return 'residential';
      case 4:
        return 'financial';
      case 5:
        return 'guarantor';
      // case 6: // Credit check step commented out
      case 7:
        return 'agentDetails';
      default:
        return '';
    }
  };

  // Add auto-save on form updates
  useEffect(() => {
    if (user?.id) {
      // Save form data whenever it changes
      localStorage.setItem(`referencing_${user.id}_formData`, JSON.stringify(formData));
      // Save step status
      localStorage.setItem(`referencing_${user.id}_stepStatus`, JSON.stringify(stepStatus));
      // Save current step
      localStorage.setItem(`referencing_${user.id}_currentStep`, currentStep.toString());
    }
  }, [formData, stepStatus, currentStep, user]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setIsMenuOpen(false);
  };

  const nextStep = async () => {
    if (currentStep < 7) {
      await saveCurrentStep();
      // Skip step 6 (credit check) - jump from step 5 to step 7
      if (currentStep === 5) {
        setCurrentStep(7);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Skip step 6 (credit check) - jump from step 7 to step 5
      if (currentStep === 7) {
        setCurrentStep(5);
      } else {
        setCurrentStep(prev => prev - 1);
      }
    }
  };

  const checkFormCompleteness = () => {
    // Check if all required steps are complete (excluding optional guarantor step)
    const requiredSteps = [1, 2, 3, 4, 7]; // Identity, Employment, Residential, Financial, Agent Details
    const requiredStepsComplete = requiredSteps.every(stepNumber => stepStatus[stepNumber] === 'complete');

    // Guarantor step (5) is optional - it doesn't affect form completeness
    setIsFormComplete(requiredStepsComplete);
    return requiredStepsComplete;
  };

  // Optimized submission process
  const submitApplication = async (force: boolean = false) => {
    const isComplete = checkFormCompleteness();

    if (!isComplete && !force) {
      setShowWarningModal(true);
      return;
    }

    // Hide the warning modal if it was open
    if (showWarningModal) {
      setShowWarningModal(false);
    }

    try {
      setIsSubmitting(true);

      const userId = user?.id;

      if (!userId) {
        throw new Error('User ID is required for submission');
      }

      // Get agent details from the form data
      const agentEmail = formData.agentDetails?.email;

      if (!agentEmail) {
        throw new Error('Agent email is required. Please complete the Agent Details section.');
      }

      // ULTRA-FAST SUBMISSION: Skip all redundant operations
      // Don't save current step - data is already auto-saved
      // Don't show multiple progress updates - just submit directly

      const propertyId = 'demo-property-123'; // Using demo property ID as in DashboardHome
      
      // Save final form data to Firestore before submission (non-blocking - don't wait for it)
      // Firestore save is optional - API submission is the primary action
      firestoreService.saveReferencingForm(
        userId,
        propertyId,
        formData,
        currentStep,
        stepStatus
      ).catch((error) => {
        console.warn('Failed to save to Firestore before submission (non-blocking):', error);
        // Don't block submission if Firestore fails
      });

      // Submit to backend API immediately (this is the primary action)
      console.log('🚀 Submitting referencing application to backend API...', {
        userId,
        propertyId,
        hasFormData: !!formData,
        agentEmail: formData.agentDetails?.email
      });

      const submitWithTimeout = Promise.race([
        referencingService.submitApplication(userId, {
          formData,
          isNewReference: true
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Submission timeout - please try again')), 15000)
        )
      ]);

      const result = await submitWithTimeout as any;
      
      console.log('✅ Backend API submission result:', result);

      // Mark as submitted in Firestore (non-blocking - don't wait for it)
      if (result.success) {
        firestoreService.submitReferencingForm(userId, propertyId).catch((error) => {
          console.warn('Failed to mark as submitted in Firestore (non-blocking):', error);
          // Don't block success flow if Firestore fails
        });
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit application');
      }

      // Fast cleanup - use async operations to avoid blocking UI
      setShowSuccessModal(true);
      setShowWarningModal(false);

      // Non-blocking localStorage operations
      setTimeout(() => {
        localStorage.setItem(`referencing_${userId}_submitted`, 'true');
      }, 0);

      // Show instant success feedback
      toast.success('Application submitted successfully!', { duration: 2000 });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const WarningModal = () => {
    if (!showWarningModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
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
              onClick={() => submitApplication(true)}
              className="px-4 py-2 bg-[#E65D24] text-white rounded-md hover:bg-opacity-90 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Anyway'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    const handleClose = () => {
      setShowSuccessModal(false);
      
      // Clear form data from localStorage if user is logged in
      if (user?.id) {
        const keysToRemove = [
          `referencing_${user.id}_formData`,
          `referencing_${user.id}_stepStatus`,
          `referencing_${user.id}_currentStep`,
          `referencing_${user.id}_submitted`
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Close the main modal first
      onClose();
      
      // Then trigger the review modal in the parent component
      if (onSubmissionComplete) {
        // Use setTimeout to ensure the modal is fully closed before showing review
        setTimeout(() => {
          onSubmissionComplete();
        }, 100);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="text-green-500 w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold ml-3">Application Submitted Successfully</h3>
          </div>

          <p className="text-gray-600 mb-6">
            Your application has been submitted successfully. The agent will review your documents and contact you shortly.
          </p>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-[#136C9E] text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    checkFormCompleteness();
  }, [stepStatus]);

  // Add an effect to update credit check status when identity form changes
  // useEffect(() => {
  //   if (formData.identity) {
  //     const creditCheckStatus = determineStepStatus('creditCheck', formData);
  //     setStepStatus(prev => ({
  //       ...prev,
  //       6: creditCheckStatus
  //     }));
  //   }
  // }, [formData.identity]);

  // Update cleanup effect
  useEffect(() => {
    if (!isOpen && user?.id) {
      const isSubmitted = localStorage.getItem(`referencing_${user.id}_submitted`) === 'true';
      if (isSubmitted) {
        // Clear storage only if the form was successfully submitted
        const keysToRemove = [
          `referencing_${user.id}_formData`,
          `referencing_${user.id}_stepStatus`,
          `referencing_${user.id}_currentStep`,
          `referencing_${user.id}_submitted`
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    }
  }, [isOpen, user]);

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="relative">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 md:mb-6">Fill in your personal details below</h3>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
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
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      const age = today.getFullYear() - selectedDate.getFullYear();
                      const monthDiff = today.getMonth() - selectedDate.getMonth();

                      // Adjust age if birthday hasn't occurred this year
                      const isOldEnough =
                        age > 18 ||
                        (age === 18 && monthDiff > 0) ||
                        (age === 18 && monthDiff === 0 && today.getDate() >= selectedDate.getDate());

                      if (!isOldEnough) {
                        // Show error state
                        updateFormData('identity', {
                          dateOfBirth: e.target.value,
                          dateOfBirthError: 'You must be at least 18 years old'
                        });
                      } else {
                        // Clear error state
                        updateFormData('identity', {
                          dateOfBirth: e.target.value,
                          dateOfBirthError: undefined
                        });
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border ${formData.identity.dateOfBirthError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${formData.identity.dateOfBirthError ? 'focus:ring-red-500' : 'focus:ring-primary'}`}
                  />
                  {formData.identity.dateOfBirthError && (
                    <p className="mt-1 text-sm text-red-500">{formData.identity.dateOfBirthError}</p>
                  )}
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
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Fill in your employment details below</h2>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
              <div className="col-span-1 sm:col-span-1">
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
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Company Details</label>
                <input
                  type="text"
                  value={formData.employment.companyDetails}
                  onChange={(e) => updateFormData('employment', { companyDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Company name"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Length of Employment (Years)</label>
                <input
                  type="text"
                  value={formData.employment.lengthOfEmployment}
                  onChange={(e) => updateFormData('employment', { lengthOfEmployment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Job Position</label>
                <input
                  type="text"
                  value={formData.employment.jobPosition}
                  onChange={(e) => updateFormData('employment', { jobPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Software Developer"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Referee - Full Name</label>
                <input
                  type="text"
                  value={formData.employment.referenceFullName}
                  onChange={(e) => updateFormData('employment', { referenceFullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Referee - Email Address</label>
                <input
                  type="email"
                  value={formData.employment.referenceEmail}
                  onChange={(e) => updateFormData('employment', { referenceEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john.smith@example.com"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
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
              <div className="col-span-1 sm:col-span-1">
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
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Fill in your residential details below</h2>
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-gray-700 mb-2">Do you already have a property you're interested in renting?</label>
                <select
                  value={formData.residential.alreadyHavePropertyAddress}
                  onChange={(e) => updateFormData('residential', { alreadyHavePropertyAddress: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${!formData.residential.alreadyHavePropertyAddress ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {formData.residential.alreadyHavePropertyAddress === 'Yes' && (
                  <div className="mt-4">
                    <label className="block text-gray-700 mb-2">Property Address</label>
                    <textarea
                      value={formData.residential.propertyAddress}
                      onChange={(e) => updateFormData('residential', { propertyAddress: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter the address of the property you're interested in"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Reason for leaving Previous Address</label>
                <textarea
                  value={formData.residential.reasonForLeaving}
                  onChange={(e) => updateFormData('residential', { reasonForLeaving: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Please provide the reason for leaving"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Current Address</label>
                <textarea
                  value={formData.residential.currentAddress}
                  onChange={(e) => updateFormData('residential', { currentAddress: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your current address"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2 whitespace-nowrap">Previous Address (If less than 3 yrs at current)</label>
                <input
                  type="text"
                  value={formData.residential.previousAddress}
                  onChange={(e) => updateFormData('residential', { previousAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your previous address"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
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
                </select>
              </div>
              <div className="col-span-1 sm:col-span-1">
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
              <div className="col-span-1 sm:col-span-1">
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
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Fill in your financial details below</h2>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Monthly Income (£)</label>
                <input
                  type="number"
                  value={formData.financial.monthlyIncome}
                  onChange={(e) => updateFormData('financial', { monthlyIncome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your monthly income"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
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
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Fill in your guarantor's personal details below</h2>
              <p className="text-sm text-gray-600 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  Optional
                </span>
                This section is optional. Please skip if you don't need a guarantor.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's First Name</label>
                <input
                  type="text"
                  value={formData.guarantor.firstName}
                  onChange={(e) => updateFormData('guarantor', { firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter first name"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Last Name</label>
                <input
                  type="text"
                  value={formData.guarantor.lastName}
                  onChange={(e) => updateFormData('guarantor', { lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter last name"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Email Address</label>
                <input
                  type="email"
                  value={formData.guarantor.email}
                  onChange={(e) => updateFormData('guarantor', { email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter email address"
                />
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label className="block text-gray-700 mb-2">Guarantor's Phone Number</label>
                <input
                  type="tel"
                  value={formData.guarantor.phoneNumber}
                  onChange={(e) => updateFormData('guarantor', { phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
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
      {/*case 6:
        return (
          <div className="relative">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Fill in your personal details below</h2>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                A Credit check is required to complete your referencing.<br />
                Your personal information has been filled in automatically.<br />
                <strong>Check that all your details are correct.</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.identity.firstName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.identity.lastName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.identity.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.identity.phoneNumber}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1">
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
        );*/}
      case 7:
        return (
          <div className="relative">
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Fill in the agent's details below
              </h2>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-3 sm:gap-y-4">
                <div className="col-span-1 sm:col-span-1">
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
                <div className="col-span-1 sm:col-span-1">
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
                <div className="col-span-1 sm:col-span-1">
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
                <div className="col-span-1 sm:col-span-1">
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
            <div className="mt-3 mb-3 sm:mt-4 sm:mb-4">
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

  // Handle modal close with cleanup
  const handleClose = () => {
    setIsProcessingFile(false);
    setShowWarningModal(false);
    setShowSuccessModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-5xl mx-auto my-2 sm:my-4 md:my-8 bg-white rounded-lg shadow-xl flex overflow-hidden h-[85vh] sm:h-[80vh] md:min-h-[600px] max-h-[90vh]">
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
            <div className="text-sm text-gray-600 mb-2">Step {currentStep > 5 ? currentStep - 1 : currentStep} of 6</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#136C9E] transition-all duration-300"
                style={{ width: `${((currentStep > 5 ? currentStep - 1 : currentStep) / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-1 sm:p-2">
                <Menu size={20} className="sm:w-6 sm:h-6" />
              </button>
              <h2 className="text-sm sm:text-md font-semibold">Referencing Form</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
          {isMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[70]">
              <div className="fixed inset-y-0 left-0 w-64 sm:w-72 bg-white shadow-xl p-4 sm:p-6">
                <button onClick={() => setIsMenuOpen(false)} className="mb-4 p-1">
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-orange-600 mb-2">Referencing Steps</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    The referencing process verifies renter or buyer identity, financial status, and rental history.
                  </p>
                </div>
                <ul className="space-y-1">
                  {navigationItems.map(({ label, Icon, step }) => {
                    const status = stepStatus[step];
                    let dotColor = 'bg-orange-500'; // Default to orange
                    switch (status) {
                      case 'partial':
                        dotColor = 'bg-orange-500';
                        break;
                      case 'complete':
                        dotColor = 'bg-green-500';
                        break;
                      case 'empty':
                        dotColor = 'bg-orange-500'; // Show orange even for empty
                        break;
                      default:
                        dotColor = 'bg-orange-500';
                    }

                    return (
                      <li
                        key={step}
                        onClick={() => {
                          goToStep(step);
                          setIsMenuOpen(false);
                        }}
                        className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all ${currentStep === step
                          ? 'bg-blue-100 text-black font-semibold rounded-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        <Icon size={18} className={currentStep === step ? 'text-orange-600' : 'text-gray-500'} />
                        <span>{label}</span>
                        {/* Always show dot for all statuses */}
                        <span
                          className={`ml-auto w-3 h-3 rounded-full ${dotColor}`}
                          title={`Status: ${status}`}
                        />
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto pt-6">
                  <div className="text-sm text-gray-600 mb-2">Step {currentStep > 5 ? currentStep - 1 : currentStep} of 6</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#136C9E] transition-all duration-300"
                      style={{ width: `${((currentStep > 5 ? currentStep - 1 : currentStep) / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-6 bg-[#f2f7fb]">
            {renderFormContent()}
          </div>
          <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-t border-gray-200 flex-shrink-0">
            {/* Mobile Layout (default) - Triangle arrangement */}
            <div className="flex justify-between items-start md:hidden">
              <div>
                {(lastSavedSteps[currentStep] || showSaveSuccess) && (
                  <div className="flex items-center text-sm text-gray-500 ml-2">
                    <CheckCircle className="text-green-500 mr-1" size={20} />
                    <span>Saved</span>
                  </div>
                )}
              </div>

              {/* Right angle triangle button layout for mobile */}
              <div className="relative">
                {/* Save button positioned at top right */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={saveCurrentStep}
                    className="px-3 sm:px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Bottom row: Previous and Continue/Submit side by side */}
                <div className="flex space-x-3">
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className="px-3 sm:px-4 py-2 text-sm border border-[#136C9E] text-[#136C9E] rounded-md hover:bg-[#136C9E] hover:text-white transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {currentStep < 7 ? (
                    <button
                      onClick={nextStep}
                      className="px-3 sm:px-4 py-2 text-sm bg-[#136C9E] text-white rounded-md hover:bg-[#0F5A82] transition-colors"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={() => submitApplication()}
                      className="px-3 sm:px-4 py-2 text-sm bg-[#E65D24] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={isSubmitting || !formData.agentDetails.hasAgreedToCheck}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Layout - Horizontal arrangement */}
            <div className="hidden md:flex md:justify-between md:items-center">
              {/* Save success indicator on the left */}
              <div>
                {(lastSavedSteps[currentStep] || showSaveSuccess) && (
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="text-green-500 mr-1" size={20} />
                    <span>Saved</span>
                  </div>
                )}
              </div>

              {/* Buttons horizontally aligned on the right */}
              <div className="flex items-center space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-4 md:px-6 py-2 text-base border border-[#136C9E] text-[#136C9E] rounded-md hover:bg-[#136C9E] hover:text-white transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={saveCurrentStep}
                  className="px-4 md:px-6 py-2 text-base bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                {currentStep < 7 ? (
                  <button
                    onClick={nextStep}
                    className="px-4 md:px-6 py-2 text-base bg-[#136C9E] text-white rounded-md hover:bg-[#0F5A82] transition-colors"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={() => submitApplication()}
                    className="px-4 md:px-6 py-2 text-base bg-[#E65D24] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !formData.agentDetails.hasAgreedToCheck}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <WarningModal />
      <SuccessModal />
    </div>
  );
};

export default ReferencingModal;