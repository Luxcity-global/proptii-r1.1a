import {
  IdentityData,
  EmploymentData,
  ResidentialData,
  FinancialData,
  GuarantorData,
  CreditCheckData,
  FormData,
  FormSection
} from '../types/referencing';

/**
 * Validates identity section data
 */
export function validateIdentityData(data: IdentityData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^[0-9+\s()-]{10,15}$/.test(data.phoneNumber.replace(/\s/g, ''))) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }
  
  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const dob = new Date(data.dateOfBirth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (age < 18) {
      errors.dateOfBirth = 'You must be at least 18 years old';
    } else if (age > 120) {
      errors.dateOfBirth = 'Please enter a valid date of birth';
    }
  }
  
  if (!data.isBritish && !data.nationality) {
    errors.nationality = 'Nationality is required for non-British citizens';
  }
  
  return errors;
}

/**
 * Validates employment section data
 */
export function validateEmploymentData(data: EmploymentData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.employmentStatus) {
    errors.employmentStatus = 'Employment status is required';
  }
  
  if (data.employmentStatus && data.employmentStatus !== 'Unemployed' && data.employmentStatus !== 'Student') {
    if (!data.companyDetails.trim()) {
      errors.companyDetails = 'Company details are required';
    }
    
    if (!data.lengthOfEmployment.trim()) {
      errors.lengthOfEmployment = 'Length of employment is required';
    }
    
    if (!data.jobPosition.trim()) {
      errors.jobPosition = 'Job position is required';
    }
    
    if (!data.referenceFullName.trim()) {
      errors.referenceFullName = 'Reference name is required';
    }
    
    if (!data.referenceEmail.trim()) {
      errors.referenceEmail = 'Reference email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.referenceEmail)) {
      errors.referenceEmail = 'Please enter a valid email address';
    }
    
    if (!data.referencePhone.trim()) {
      errors.referencePhone = 'Reference phone number is required';
    }
    
    if (!data.proofType) {
      errors.proofType = 'Proof type is required';
    }
  }
  
  return errors;
}

/**
 * Validates residential section data
 */
export function validateResidentialData(data: ResidentialData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.currentAddress.trim()) {
    errors.currentAddress = 'Current address is required';
  }
  
  if (!data.durationAtCurrentAddress) {
    errors.durationAtCurrentAddress = 'Duration at current address is required';
  }
  
  if (data.durationAtCurrentAddress && ['Less than 1 year', '1-2 years', '2-3 years'].includes(data.durationAtCurrentAddress)) {
    if (!data.previousAddress.trim()) {
      errors.previousAddress = 'Previous address is required for stays less than 3 years';
    }
    
    if (!data.durationAtPreviousAddress) {
      errors.durationAtPreviousAddress = 'Duration at previous address is required';
    }
    
    if (!data.reasonForLeaving.trim()) {
      errors.reasonForLeaving = 'Reason for leaving is required';
    }
  }
  
  if (!data.proofType) {
    errors.proofType = 'Proof type is required';
  }
  
  return errors;
}

/**
 * Validates financial section data
 */
export function validateFinancialData(data: FinancialData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.useOpenBanking && !data.proofOfIncomeType) {
    errors.proofOfIncomeType = 'Proof of income type is required';
  }
  
  if (!data.useOpenBanking && data.proofOfIncomeType && !data.proofOfIncomeDocument) {
    errors.proofOfIncomeDocument = 'Proof of income document is required';
  }
  
  return errors;
}

/**
 * Validates guarantor section data
 */
export function validateGuarantorData(data: GuarantorData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.firstName.trim()) {
    errors.firstName = 'Guarantor first name is required';
  }
  
  if (!data.lastName.trim()) {
    errors.lastName = 'Guarantor last name is required';
  }
  
  if (!data.email.trim()) {
    errors.email = 'Guarantor email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Guarantor phone number is required';
  }
  
  if (!data.address.trim()) {
    errors.address = 'Guarantor address is required';
  }
  
  return errors;
}

/**
 * Validates credit check section data
 */
export function validateCreditCheckData(data: CreditCheckData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.hasAgreedToCheck) {
    errors.hasAgreedToCheck = 'You must agree to the credit check';
  }
  
  return errors;
}

/**
 * Validates a specific section of the form data
 */
export function validateSection(section: FormSection, data: FormData): Record<string, string> {
  switch (section) {
    case 'identity':
      return validateIdentityData(data.identity);
    case 'employment':
      return validateEmploymentData(data.employment);
    case 'residential':
      return validateResidentialData(data.residential);
    case 'financial':
      return validateFinancialData(data.financial);
    case 'guarantor':
      return validateGuarantorData(data.guarantor);
    case 'creditCheck':
      return validateCreditCheckData(data.creditCheck);
    default:
      return {};
  }
}

/**
 * Checks if a section is valid
 */
export function isSectionValid(section: FormSection, data: FormData): boolean {
  const errors = validateSection(section, data);
  return Object.keys(errors).length === 0;
}

/**
 * Gets the section number from section name
 */
export function getSectionNumber(section: FormSection): number {
  const sections: FormSection[] = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'];
  return sections.indexOf(section) + 1;
}

/**
 * Gets the section name from section number
 */
export function getSectionName(sectionNumber: number): FormSection {
  const sections: FormSection[] = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'];
  return sections[sectionNumber - 1];
} 