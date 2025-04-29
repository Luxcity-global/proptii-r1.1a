/**
 * API Interface Definitions for Proptii
 * 
 * This file contains TypeScript interfaces for all API calls that will be implemented.
 * These interfaces ensure type safety when implementing the real backend.
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Application status enum
 */
export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Application data structure
 */
export interface Application {
  id: string;
  userId: string;
  status: ApplicationStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  sections: {
    identity: IdentityData;
    employment: EmploymentData;
    residential: ResidentialData;
    financial: FinancialData;
    guarantor: GuarantorData;
    creditCheck: CreditCheckData;
  };
}

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
  identityProofId?: string;
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
  proofDocumentId?: string;
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
  proofDocumentId?: string;
}

/**
 * Financial section data
 */
export interface FinancialData {
  proofOfIncomeType: string;
  proofOfIncomeDocumentId?: string;
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
 * Document data structure
 */
export interface Document {
  id: string;
  applicationId: string;
  section: 'identity' | 'employment' | 'residential' | 'financial';
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

/**
 * Request to create a new application
 */
export interface CreateApplicationRequest {
  userId: string;
}

/**
 * Request to save section data
 */
export interface SaveSectionRequest {
  applicationId: string;
  sectionName: 'identity' | 'employment' | 'residential' | 'financial' | 'guarantor' | 'creditCheck';
  sectionData: any;
}

/**
 * Response for saving section data
 */
export interface SaveSectionResponse {
  applicationId: string;
  sectionName: string;
  lastSaved: string;
}

/**
 * Request to submit an application
 */
export interface SubmitApplicationRequest {
  applicationId: string;
}

/**
 * Response for submitting an application
 */
export interface SubmitApplicationResponse {
  applicationId: string;
  status: ApplicationStatus;
  submittedAt: string;
}

/**
 * Request to get an application by ID
 */
export interface GetApplicationRequest {
  applicationId: string;
}

/**
 * Request to upload a document
 */
export interface UploadDocumentRequest {
  applicationId: string;
  section: 'identity' | 'employment' | 'residential' | 'financial';
  documentType: string;
  file: File;
}

/**
 * Response for uploading a document
 */
export interface UploadDocumentResponse {
  documentId: string;
  applicationId: string;
  section: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Request to get documents for an application
 */
export interface GetDocumentsRequest {
  applicationId: string;
  section?: 'identity' | 'employment' | 'residential' | 'financial';
}

/**
 * Request to delete a document
 */
export interface DeleteDocumentRequest {
  documentId: string;
} 