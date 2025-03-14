/**
 * Types for the referencing form data
 */

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
  nationality: string;
  identityProof: File | null;
}

/**
 * Employment section data
 */
export interface EmploymentData {
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

/**
 * Residential section data
 */
export interface ResidentialData {
  currentAddress: string;
  durationAtCurrentAddress: string;
  previousAddress: string;
  durationAtPreviousAddress: string;
  reasonForLeaving: string;
  proofType: string;
  proofDocument: File | null;
}

/**
 * Financial section data
 */
export interface FinancialData {
  proofOfIncomeType: string;
  proofOfIncomeDocument: File | null;
  useOpenBanking: boolean;
  isConnectedToOpenBanking: boolean;
}

/**
 * Guarantor section data
 */
export interface GuarantorData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
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
 * Form section names
 */
export type FormSection = keyof FormData; 