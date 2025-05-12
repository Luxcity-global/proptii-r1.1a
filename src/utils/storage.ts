import { FormData, FormSection } from '../types/referencing';

const STORAGE_KEY = 'proptii_referencing_form_data';

/**
 * Saves the complete form data to localStorage
 */
export function saveFormData(formData: FormData): void {
  try {
    // We need to handle File objects specially since they can't be serialized
    const serializable = serializeFormData(formData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving form data to localStorage:', error);
  }
}

/**
 * Loads the form data from localStorage
 */
export function loadFormData(): FormData | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;
    
    const parsed = JSON.parse(savedData);
    return parsed as FormData;
  } catch (error) {
    console.error('Error loading form data from localStorage:', error);
    return null;
  }
}

/**
 * Clears the form data from localStorage
 */
export function clearFormData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing form data from localStorage:', error);
  }
}

/**
 * Saves a specific section of the form data
 */
export function saveFormSection(section: FormSection, sectionData: any): void {
  try {
    const formData = loadFormData() || getEmptyFormData();
    formData[section] = sectionData;
    saveFormData(formData);
  } catch (error) {
    console.error(`Error saving ${section} data to localStorage:`, error);
  }
}

/**
 * Creates an empty form data object
 */
export function getEmptyFormData(): FormData {
  return {
    identity: {
      firstName: '',
      lastName: '',
      email: '',
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
  };
}

/**
 * Serializes form data for storage
 * Removes File objects which can't be serialized
 */
function serializeFormData(formData: FormData): any {
  const serializable = JSON.parse(JSON.stringify(formData));
  
  // Remove File objects which can't be serialized
  if (serializable.identity) {
    serializable.identity.identityProof = null;
  }
  
  if (serializable.employment) {
    serializable.employment.proofDocument = null;
  }
  
  if (serializable.residential) {
    serializable.residential.proofDocument = null;
  }
  
  if (serializable.financial) {
    serializable.financial.proofOfIncomeDocument = null;
  }
  
  return serializable;
} 