/**
 * Types for the referencing form data
 */

import * as yup from 'yup';

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

// Validation schemas for each form section
export const identitySchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  dateOfBirth: yup.date().required('Date of birth is required').max(new Date(), 'Date of birth cannot be in the future'),
  phoneNumber: yup.string().required('Phone number is required'),
  identityProof: yup.mixed().required('Identity proof document is required')
});

export const employmentSchema = yup.object().shape({
  employmentStatus: yup.string().oneOf(['employed', 'self-employed', 'student', 'retired', 'unemployed']).required('Employment status is required'),
  employerName: yup.string().when('employmentStatus', {
    is: 'employed',
    then: yup.string().required('Employer name is required')
  }),
  jobTitle: yup.string().when('employmentStatus', {
    is: 'employed',
    then: yup.string().required('Job title is required')
  }),
  annualIncome: yup.number().positive('Annual income must be positive').required('Annual income is required'),
  employmentStartDate: yup.date().max(new Date(), 'Start date cannot be in the future').required('Employment start date is required'),
  proofDocument: yup.mixed().required('Employment proof document is required')
});

export const residentialSchema = yup.object().shape({
  currentAddress: yup.string().required('Current address is required'),
  timeAtAddress: yup.number().positive('Time at address must be positive').required('Time at address is required'),
  residentialStatus: yup.string().oneOf(['owner', 'tenant', 'living_with_family', 'other']).required('Residential status is required'),
  landlordName: yup.string().when('residentialStatus', {
    is: 'tenant',
    then: yup.string().required('Landlord name is required')
  }),
  landlordEmail: yup.string().when('residentialStatus', {
    is: 'tenant',
    then: yup.string().email('Invalid email').required('Landlord email is required')
  }),
  proofDocument: yup.mixed().required('Residential proof document is required')
});

export const financialSchema = yup.object().shape({
  monthlyIncome: yup.number().positive('Monthly income must be positive').required('Monthly income is required'),
  additionalIncome: yup.number().min(0, 'Additional income cannot be negative'),
  monthlyExpenses: yup.number().min(0, 'Monthly expenses cannot be negative').required('Monthly expenses is required'),
  creditScore: yup.number().min(300, 'Invalid credit score').max(850, 'Invalid credit score'),
  bankruptcyHistory: yup.boolean().required('Bankruptcy history is required'),
  proofOfIncomeDocument: yup.mixed().required('Proof of income document is required')
});

export const guarantorSchema = yup.object().shape({
  firstName: yup.string().required('Guarantor first name is required'),
  lastName: yup.string().required('Guarantor last name is required'),
  email: yup.string().email('Invalid email').required('Guarantor email is required'),
  phoneNumber: yup.string().required('Guarantor phone number is required'),
  annualIncome: yup.number().positive('Annual income must be positive').required('Guarantor annual income is required'),
  relationship: yup.string().required('Relationship to applicant is required'),
  identityDocument: yup.mixed().required('Guarantor identity document is required')
});

export const agentDetailsSchema = yup.object().shape({
  agencyName: yup.string().required('Agency name is required'),
  agentName: yup.string().required('Agent name is required'),
  agentEmail: yup.string().email('Invalid email').required('Agent email is required'),
  agentPhone: yup.string().required('Agent phone number is required'),
  propertyAddress: yup.string().required('Property address is required'),
  rentalAmount: yup.number().positive('Rental amount must be positive').required('Rental amount is required'),
  tenancyStartDate: yup.date().min(new Date(), 'Start date must be in the future').required('Tenancy start date is required'),
  tenancyDuration: yup.number().positive('Tenancy duration must be positive').required('Tenancy duration is required')
});

// Combined form data validation schema
export const formDataSchema = yup.object().shape({
  identity: identitySchema,
  employment: employmentSchema,
  residential: residentialSchema,
  financial: financialSchema,
  guarantor: guarantorSchema,
  agentDetails: agentDetailsSchema
}); 