/**
 * Types for the referencing form data
 */

/**
 * Form section types
 */
export type FormSection = 'identity' | 'employment' | 'residential' | 'financial' | 'guarantor' | 'creditCheck';

/**
 * Identity section data
 */
export interface IdentityData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  isBritish: boolean;
  nationality?: string;
  identityProof?: File | null;
}

/**
 * Employment section data
 */
export interface EmploymentData {
  employmentStatus: string;
  companyDetails?: string;
  lengthOfEmployment?: string;
  jobPosition?: string;
  referenceFullName?: string;
  referenceEmail?: string;
  referencePhone?: string;
  proofType?: string;
  proofDocument?: File | null;
}

/**
 * Residential section data
 */
export interface ResidentialData {
  currentAddress: string;
  durationAtCurrentAddress: string;
  previousAddress?: string;
  durationAtPreviousAddress?: string;
  reasonForLeaving?: string;
  proofType: string;
  proofDocument: File | null;
}

/**
 * Financial section data
 */
export interface FinancialData {
  monthlyIncome: string;
  proofOfIncomeType: string;
  proofOfIncomeDocument?: File | null;
  useOpenBanking: boolean;
  isConnectedToOpenBanking?: boolean;
}

/**
 * Guarantor section data
 */
export interface GuarantorData {
  fullName: string;
  email: string;
  address: string;
  identityDocument?: File | null;
}

/**
 * Credit check section data
 */
export interface CreditCheckData {
  hasAgreedToCheck: boolean;
}

/**
 * Complete form data
 */
export interface FormData {
  identity: IdentityData;
  employment: EmploymentData;
  residential: ResidentialData;
  financial: FinancialData;
  guarantor: GuarantorData;
  creditCheck: CreditCheckData;
}

/**
 * Referencing form data with document references instead of File objects
 * This is the data structure used for API communication
 */
export interface ReferencingFormData {
  id?: string;
  propertyId: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'submitted' | 'in_progress' | 'approved' | 'rejected';
  identity?: Omit<IdentityData, 'identityProof'> & {
    identityProofId?: string;
  };
  employment?: Omit<EmploymentData, 'proofDocument'> & {
    proofDocumentId?: string;
  };
  residential?: Omit<ResidentialData, 'proofDocument'> & {
    proofDocumentId?: string;
  };
  financial?: Omit<FinancialData, 'proofOfIncomeDocument'> & {
    proofOfIncomeDocumentId?: string;
  };
  guarantor?: Omit<GuarantorData, 'identityDocument'> & {
    identityDocumentId?: string;
  };
  creditCheck?: Omit<CreditCheckData, 'additionalDocument'> & {
    additionalDocumentId?: string;
  };
}

/**
 * Referencing state
 */
export interface ReferencingState {
  currentStep: number;
  formData: FormData;
  isSubmitting: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  propertyId: string | null;
  errors: Record<string, string>;
}

/**
 * Referencing action types
 */
export type ReferencingAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_FORM_DATA'; payload: { section: FormSection; data: Partial<any> } }
  | { type: 'SET_FORM_DATA'; payload: FormData }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: number }
  | { type: 'SET_PROPERTY_ID'; payload: string }
  | { type: 'SET_ERROR'; payload: { section: FormSection; error: string } }
  | { type: 'CLEAR_ERROR'; payload: FormSection }
  | { type: 'CLEAR_ALL_ERRORS' }; 