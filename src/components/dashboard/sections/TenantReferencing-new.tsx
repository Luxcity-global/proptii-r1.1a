import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User, 
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { firestoreService } from '../../../services/firestoreService';
import ReferencingModal from '../../ReferencingModalLegacy';
import { useIsMobile } from '../ui/use-mobile';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import PlanUpgradeWall from '../PlanUpgradeWall';

// Interface for form data structure - matches the actual Firestore data
interface FormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    dateOfBirthError?: string;
    isBritish: boolean;
    nationality: string;
    identityProof?: any;
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
    proofDocument?: any;
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
    proofDocument?: any;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument?: any;
    useOpenBanking: boolean;
    isConnectedToOpenBanking: boolean;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    identityDocument?: any;
  };
  agentDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    hasAgreedToCheck: boolean;
  };
}

/**
 * Tenant Referencing page - matches the exact design from the image
 */
const TenantReferencing: React.FC = () => {
  const { plan, status } = useBillingStatus();
  if (!canAccessSection('tenant-referencing', plan, status)) {
    return (
      <PlanUpgradeWall
        featureName="Referencing toolkit"
        upgradeLabel={sectionUpgradeLabel('tenant-referencing')}
        segment="renters"
      />
    );
  }

  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [referencingStep, setReferencingStep] = useState(1);

  // Load form data from Firestore (scoped to this user)
  useEffect(() => {
    const loadFormData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Key is scoped per-user so no tenant can overwrite another's data
        const propertyId = `general_${user.id}`;
        const result = await firestoreService.getReferencingForm(user.id, propertyId);
        
        if (result.success && result.data) {
          setFormData(result.data.formData);
          setStepStatus(result.data.stepStatus);
        } else {
          console.log('No Firestore data found, using default state');
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [user?.id]);

  // Calculate progress statistics
  const calculateProgress = () => {
    if (!formData) return { overall: 0, completed: 0, pending: 0, documents: 0 };

    const steps = [1, 2, 3, 4, 5, 7]; // Excluding step 6 (credit check)
    const completedSteps = steps.filter(step => stepStatus[step] === 'complete').length;
    const totalSteps = steps.length;
    
    // Count uploaded documents
    const documents = [
      formData.identity?.identityProof,
      formData.employment?.proofDocument,
      formData.residential?.proofDocument,
      formData.financial?.proofOfIncomeDocument,
      formData.guarantor?.identityDocument
    ].filter(doc => doc && doc.name).length;

    return {
      overall: Math.round((completedSteps / totalSteps) * 100),
      completed: completedSteps,
      pending: totalSteps - completedSteps,
      documents
    };
  };

  // Check if a specific field is complete
  const isFieldComplete = (section: keyof FormData, field: string): boolean => {
    if (!formData) return false;
    
    const sectionData = formData[section];
    if (!sectionData) return false;

    const value = (sectionData as any)[field];
    return value && value !== '' && value !== null && value !== undefined;
  };

  // Check if a document is uploaded
  const isDocumentUploaded = (section: keyof FormData, documentField: string): boolean => {
    if (!formData) return false;
    
    const sectionData = formData[section];
    if (!sectionData) return false;

    const document = (sectionData as any)[documentField];
    return document && document.name && document.dataUrl;
  };

  const progress = calculateProgress();
  const summaryOverallProgress = isAuthenticated ? progress.overall : 0;
  const summaryCompleted = isAuthenticated ? progress.completed : 0;
  const summaryPending = isAuthenticated ? progress.pending : 0;
  const summaryDocuments = isAuthenticated ? progress.documents : 0;

  // Modal functions
  const openReferencingModal = (step: number) => {
    setReferencingStep(step);
    setIsReferencingModalOpen(true);
  };
  
  const closeReferencingModal = () => {
    setIsReferencingModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referencing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header Section */}
      <div className="flex flex-row items-start gap-3 flex-nowrap mt-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ color: '#374957' }}>
            Tenant Referencing
          </h1>
          <p className="text-sm md:text-base leading-relaxed pr-2" style={{ color: '#717182' }}>
            Complete your referencing to proceed with your tenancy application
          </p>
        </div>
        <button 
          className="flex-shrink-0 self-start px-5 py-2.5 text-white rounded-full text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            border: '1px solid #DC5F12',
            minHeight: '2.75rem',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            alignSelf: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onClick={() => window.location.href = '/referencing'}
        >
          Go To Referencing
        </button>
      </div>

      {/* Progress Overview Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4 ${isMobile ? 'md:gap-6' : 'gap-6'}`}>
        {/* Overall Progress Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Overall Progress</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>{summaryOverallProgress}%</p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>{summaryCompleted} of {progress.pending + summaryCompleted} sections</p>
          </div>
        </div>

        {/* Completed Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Completed</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-green-100 rounded-lg flex items-center justify-center`}>
              <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>{summaryCompleted}</p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Sections verified</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Pending</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-yellow-100 rounded-lg flex items-center justify-center`}>
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>{summaryPending}</p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Awaiting completion</p>
          </div>
        </div>

        {/* Documents Uploaded Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Documents Uploaded</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>{summaryDocuments}</p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Total files</p>
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-6'}`}>
          {/* Circular Progress - Made bigger */}
          <div className={`relative ${isMobile ? 'w-16 h-16 flex-shrink-0' : 'w-32 h-32'}`}>
            <svg className={`${isMobile ? 'w-16 h-16' : 'w-32 h-32'} transform -rotate-90`} viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#136C9E"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress.overall / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`${isMobile ? 'text-xs' : 'text-lg'} font-bold`} style={{ color: '#374957' }}>{progress.overall}%</span>
              {!isMobile && <span className="text-xs font-medium" style={{ color: '#717182' }}>Complete</span>}
            </div>
          </div>

          {/* Progress Text and Bar - Keep on row with button */}
          <div className="flex-1 min-w-0">
            <p className={`${isMobile ? 'text-xs' : 'text-base'} ${isMobile ? 'mb-1' : 'mb-4'}`} style={{ color: '#374957' }}>
              {isMobile ? (
                <>Completed {progress.completed} of {progress.completed + progress.pending} sections</>
              ) : (
                <>You have completed {progress.completed} out of {progress.completed + progress.pending} referencing sections. Complete all sections to finalize your application.</>
              )}
            </p>
            
            {/* Horizontal Progress Bar and Button Row */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                <div className="h-2 rounded-full" style={{ width: `${progress.overall}%`, backgroundColor: '#136C9E' }}></div>
              </div>
              {!isMobile && (
                <span className="text-sm font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#374957' }}>
                  {progress.completed} completed
                </span>
              )}
              
              {/* Resume Button - Inline with progress bar */}
              <button 
                className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-6 py-3 text-base'} rounded-lg font-medium text-white transition-colors whitespace-nowrap flex-shrink-0`}
                style={{ backgroundColor: '#DC5F12' }}
                onClick={() => openReferencingModal(1)}
              >
                {isMobile ? 'Resume' : 'Resume Process'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referencing Details Cards - 6 different card types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Define the 6 different card types */}
        {[
          {
            title: "Identity",
            icon: <User className="w-5 h-5 text-blue-600" />,
            progress: "7",
            status: stepStatus[1] === 'complete' ? "Complete" : "Incomplete",
            step: 1,
            items: [
              { name: "First Name", description: "Personal identification", status: isFieldComplete('identity', 'firstName') ? "complete" : "incomplete" },
              { name: "Last Name", description: "Personal identification", status: isFieldComplete('identity', 'lastName') ? "complete" : "incomplete" },
              { name: "Email Address", description: "Contact information", status: isFieldComplete('identity', 'email') ? "complete" : "incomplete" },
              { name: "Phone Number", description: "Contact information", status: isFieldComplete('identity', 'phoneNumber') ? "complete" : "incomplete" },
              { name: "Date of Birth", description: "Personal details", status: isFieldComplete('identity', 'dateOfBirth') ? "complete" : "incomplete" },
              { name: "Nationality", description: "Citizenship details", status: isFieldComplete('identity', 'nationality') ? "complete" : "incomplete" },
              { name: "Passport or ID Card", description: "Identity verification", status: isDocumentUploaded('identity', 'identityProof') ? "complete" : "incomplete" }
            ]
          },
          {
            title: "Employment",
            icon: <Briefcase className="w-5 h-5 text-blue-600" />,
            progress: "8",
            status: stepStatus[2] === 'complete' ? "Complete" : "Incomplete",
            step: 2,
            items: [
              { name: "Employment Status", description: "Current employment", status: isFieldComplete('employment', 'employmentStatus') ? "complete" : "incomplete" },
              { name: "Company Details", description: "Employer information", status: isFieldComplete('employment', 'companyDetails') ? "complete" : "incomplete" },
              { name: "Length of Employment", description: "Employment duration", status: isFieldComplete('employment', 'lengthOfEmployment') ? "complete" : "incomplete" },
              { name: "Job Position", description: "Current role", status: isFieldComplete('employment', 'jobPosition') ? "complete" : "incomplete" },
              { name: "Referee - Full Name", description: "Employment referee", status: isFieldComplete('employment', 'referenceFullName') ? "complete" : "incomplete" },
              { name: "Referee - Email Address", description: "Referee contact", status: isFieldComplete('employment', 'referenceEmail') ? "complete" : "incomplete" },
              { name: "Proof of Employment", description: "Employment verification", status: isDocumentUploaded('employment', 'proofDocument') ? "complete" : "incomplete" },
              { name: "Referee - Phone Number", description: "Referee contact", status: isFieldComplete('employment', 'referencePhone') ? "complete" : "incomplete" }
            ]
          },
          {
            title: "Residential",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            progress: "7",
            status: stepStatus[3] === 'complete' ? "Complete" : "Incomplete",
            step: 3,
            items: [
              { name: "Property Interest", description: "Do you already have a property you're interested in renting?", status: isFieldComplete('residential', 'alreadyHavePropertyAddress') ? "complete" : "incomplete" },
              { name: "Reason for leaving", description: "Previous Address", status: isFieldComplete('residential', 'reasonForLeaving') ? "complete" : "incomplete" },
              { name: "Current Address", description: "Current residence", status: isFieldComplete('residential', 'currentAddress') ? "complete" : "incomplete" },
              { name: "Previous Address", description: "If less than 3 yrs at current", status: isFieldComplete('residential', 'previousAddress') ? "complete" : "incomplete" },
              { name: "How long at this Address?", description: "Duration at current address", status: isFieldComplete('residential', 'durationAtCurrentAddress') ? "complete" : "incomplete" },
              { name: "Proof of Address", description: "Address verification", status: isDocumentUploaded('residential', 'proofDocument') ? "complete" : "incomplete" },
              { name: "Select exact duration", description: "At this address", status: isFieldComplete('residential', 'durationAtPreviousAddress') ? "complete" : "incomplete" }
            ]
          },
          {
            title: "Financial",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            progress: "3",
            status: stepStatus[4] === 'complete' ? "Complete" : "Incomplete",
            step: 4,
            items: [
              { name: "Monthly Income (£)", description: "Monthly earnings", status: isFieldComplete('financial', 'monthlyIncome') ? "complete" : "incomplete" },
              { name: "Proof of income", description: "Income verification", status: isFieldComplete('financial', 'proofOfIncomeType') ? "complete" : "incomplete" },
              { name: "Proof of Income", description: "Income documentation", status: isDocumentUploaded('financial', 'proofOfIncomeDocument') ? "complete" : "incomplete" }
            ]
          },
          {
            title: "Guarantor",
            icon: <User className="w-5 h-5 text-amber-600" />,
            progress: "6",
            status: stepStatus[5] === 'complete' ? "Complete" : "Incomplete",
            step: 5,
            items: [
              { name: "Guarantor's First Name", description: "Guarantor personal details", status: isFieldComplete('guarantor', 'firstName') ? "complete" : "incomplete" },
              { name: "Guarantor's Last Name", description: "Guarantor personal details", status: isFieldComplete('guarantor', 'lastName') ? "complete" : "incomplete" },
              { name: "Guarantor's Email Address", description: "Guarantor contact", status: isFieldComplete('guarantor', 'email') ? "complete" : "incomplete" },
              { name: "Guarantor's Phone Number", description: "Guarantor contact", status: isFieldComplete('guarantor', 'phoneNumber') ? "complete" : "incomplete" },
              { name: "Guarantor's Address", description: "Guarantor address", status: isFieldComplete('guarantor', 'address') ? "complete" : "incomplete" },
              { name: "Guarantor's ID Document", description: "Guarantor identification", status: isDocumentUploaded('guarantor', 'identityDocument') ? "complete" : "incomplete" }
            ]
          },
          {
            title: "Agent Details",
            icon: <User className="w-5 h-5 text-amber-600" />,
            progress: "4",
            status: stepStatus[7] === 'complete' ? "Complete" : "Incomplete",
            step: 7,
            items: [
              { name: "Agent's First Name", description: "Agent personal details", status: isFieldComplete('agentDetails', 'firstName') ? "complete" : "incomplete" },
              { name: "Agent's Last Name", description: "Agent personal details", status: isFieldComplete('agentDetails', 'lastName') ? "complete" : "incomplete" },
              { name: "Agent's Email Address", description: "Agent contact", status: isFieldComplete('agentDetails', 'email') ? "complete" : "incomplete" },
              { name: "Agent's Phone Number", description: "Agent contact", status: isFieldComplete('agentDetails', 'phoneNumber') ? "complete" : "incomplete" }
            ]
          }
        ].map((card, index) => {
          // Define gradient styles based on card type
          const getCardStyle = (title: string) => {
            if (title === "Residential" || title === "Financial") {
              // Orange gradient for Residential and Financial
              return {
                background: 'linear-gradient(to bottom, #FFF7ED, #FFEDD5)',
                border: '1px solid #FB923C',
                height: isMobile ? 'auto' : '320px',
                minHeight: isMobile ? '280px' : '320px',
                borderRadius: '20px'
              };
            } else if (title === "Guarantor" || title === "Agent Details") {
              // Cream gradient for Guarantor and Agent Details
              return {
                background: 'linear-gradient(to bottom, #FFFBEB, #FEF3C7)',
                border: '1px solid #F59E0B',
                height: isMobile ? 'auto' : '320px',
                minHeight: isMobile ? '280px' : '320px',
                borderRadius: '20px'
              };
            } else {
              // Default blue gradient for Identity and Employment
              return {
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                border: '1px solid #80B2FF',
                height: isMobile ? 'auto' : '320px',
                minHeight: isMobile ? '280px' : '320px',
                borderRadius: '20px'
              };
            }
          };

          return (
          <div
            key={`${card.title.toLowerCase()}-${index}`}
            className="shadow-sm overflow-hidden"
            style={getCardStyle(card.title)}
          >
            <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
              {/* Left Panel */}
              <div
                className={`${isMobile ? 'p-4 flex-row items-center justify-between' : 'p-6 flex-col items-start min-w-[200px]'} flex`}
                style={{
                  background: card.title === "Residential" || card.title === "Financial" 
                    ? 'linear-gradient(to bottom, #FFF7ED, #FFEDD5)'
                    : card.title === "Guarantor" || card.title === "Agent Details"
                    ? 'linear-gradient(to bottom, #FFFBEB, #FEF3C7)'
                    : 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                  color: '#374957'
                }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                    {card.icon}
                  </div>
                  <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>{card.title}</h2>
                </div>
                {!isMobile && <div className="flex-1"></div>}
                <div className={isMobile ? '' : 'mt-auto'}>
                  <div 
                    className={`font-bold block mb-1 ${isMobile ? 'text-2xl' : 'text-4xl'}`}
                    style={{
                      fontSize: isMobile ? '24px' : undefined,
                      lineHeight: '1',
                      color: card.title === "Residential" || card.title === "Financial" 
                        ? '#C2410C'
                        : card.title === "Guarantor" || card.title === "Agent Details"
                        ? '#B45309'
                        : '#1E40AF'
                    }}
                  >
                    {card.progress}
                  </div>
                  <div className="flex items-center mt-2">
                    {card.status === "Complete" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  <div className="text-xs opacity-75">As of 11/10/2025</div>
                </div>
              </div>

              {/* Right White Panel */}
              <div
                className={`flex-1 p-4 bg-white relative z-10 overflow-hidden flex flex-col ${isMobile ? 'rounded-b-xl' : ''}`}
                style={{
                  borderRadius: isMobile ? '0 0 20px 20px' : '20px',
                  boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(70, 95, 194, 0.4)',
                  overflow: 'hidden'
                }}
              >
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => openReferencingModal(card.step)}
                    className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    Go to {card.title} →
                  </button>
                </div>
                <div 
                  className={`space-y-3 overflow-y-auto flex-1 pr-2 ${isMobile ? '' : ''}`}
                  style={{
                    maxHeight: isMobile && card.items.length > 2 ? '250px' : isMobile ? 'auto' : undefined,
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                  }}
                >
                  {card.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {item.status === "complete" ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium mb-1 text-sm ${
                              item.status === "complete" ? "text-green-600" : "text-orange-600"
                            }`}>
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-700 mb-2">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className={`border rounded px-3 py-1 ${
                          item.status === "complete" ? "border-green-300" : "border-orange-300"
                        }`}>
                          <span className={`text-xs font-bold ${
                            item.status === "complete" ? "text-green-600" : "text-orange-600"
                          }`}>
                            {item.status === "complete" ? "Complete" : "Incomplete"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Referencing Modal */}
      {isReferencingModalOpen && (
        <ReferencingModal
          isOpen={isReferencingModalOpen}
          onClose={closeReferencingModal}
          initialStep={referencingStep}
          onSubmissionComplete={() => {
            // Reload form data when submission is complete
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default TenantReferencing;
