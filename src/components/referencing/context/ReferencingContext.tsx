<<<<<<< HEAD
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useCallback } from 'react';
=======
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
>>>>>>> upstream/feature/ai-search-listings-agents
import { FormData, FormSection, ReferencingState as FormReferencingState, ReferencingAction as FormReferencingAction, ReferencingFormData } from '../../../types/referencing';
import { saveToLocalStorage, loadFromLocalStorage, saveDraft } from '../../../utils/localStorage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import * as referencingService from '../../../services/referencingService';
import { isAzureConfigured } from '../../../config/azure';
import { uploadToAzureStorage } from '../../../services/storageService';
<<<<<<< HEAD
=======
import * as yup from 'yup';
>>>>>>> upstream/feature/ai-search-listings-agents

// Define the state type
interface ReferencingState {
  currentStep: number;
  formData: FormData;
  lastSaved: number | null;
  isSaving: boolean;
  isSubmitting: boolean;
  errors: Record<string, string | null>;
  applicationId: string | null;
  propertyId: string | null;
  uploadProgress: Record<string, number>;
}

// Define the action types
type ReferencingAction =
  | { type: 'SET_CURRENT_STEP'; payload: number | FormSection }
  | { type: 'UPDATE_FORM_DATA'; payload: { section: FormSection; data: any } }
  | { type: 'SET_FORM_DATA'; payload: FormData }
  | { type: 'SET_LAST_SAVED'; payload: number }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { section: FormSection; error: string | null } }
  | { type: 'SET_APPLICATION_ID'; payload: string }
  | { type: 'SET_PROPERTY_ID'; payload: string }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: { field: string; progress: number } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'CLEAR_ERROR'; payload: FormSection }
  | { type: 'CLEAR_ALL_ERRORS' };

// Define the context type
interface ReferencingContextType {
  state: ReferencingState;
  dispatch: React.Dispatch<ReferencingAction>;
  updateFormData: (section: FormSection, data: any) => void;
  saveCurrentStep: () => Promise<boolean>;
  submitApplication: () => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: FormSection | number) => void;
  saveAsDraft: (name: string) => Promise<boolean>;
  setPropertyId: (id: string) => void;
  uploadDocument: (section: FormSection, field: string, file: File) => Promise<string | null>;
<<<<<<< HEAD
}

// Create the context
const ReferencingContext = createContext<ReferencingContextType | null>(null);
=======
  formData: FormData;
  errors: {
    [K in keyof FormData]?: {
      [key: string]: string;
    };
  };
  validateSection: (section: keyof FormData) => Promise<boolean>;
}

// Create the context
const ReferencingContext = createContext<ReferencingContextType | undefined>(undefined);
>>>>>>> upstream/feature/ai-search-listings-agents

// Initial state
const initialFormData: FormData = {
  identity: {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    isBritish: false,
    nationality: '',
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
    address: '',
    identityDocument: null
  },
  creditCheck: {
    hasAgreedToCheck: false,
    additionalDocument: null
  }
};

const initialState: ReferencingState = {
  currentStep: 0,
  formData: initialFormData,
  lastSaved: null,
  isSaving: false,
  isSubmitting: false,
  errors: {
    identity: null,
    employment: null,
    residential: null,
    financial: null,
    guarantor: null,
    creditCheck: null
  },
  applicationId: null,
  propertyId: null,
  uploadProgress: {}
};

// Create the reducer
const referencingReducer = (state: ReferencingState, action: ReferencingAction): ReferencingState => {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: typeof action.payload === 'number' 
          ? action.payload 
          : ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'].indexOf(action.payload)
      };
    
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.section]: {
            ...state.formData[action.payload.section],
            ...action.payload.data
          }
        }
      };
    
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: action.payload
      };
    
    case 'SET_LAST_SAVED':
      return {
        ...state,
        lastSaved: action.payload
      };
    
    case 'SET_IS_SAVING':
      return {
        ...state,
        isSaving: action.payload
      };
    
    case 'SET_IS_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.section]: action.payload.error
        }
      };
    
    case 'SET_APPLICATION_ID':
      return {
        ...state,
        applicationId: action.payload
      };
    
    case 'SET_PROPERTY_ID':
      return {
        ...state,
        propertyId: action.payload
      };
    
    case 'SET_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.field]: action.payload.progress
        }
      };
    
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 5)
      };
    
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0)
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: null
        }
      };
    
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {
          identity: null,
          employment: null,
          residential: null,
          financial: null,
          guarantor: null,
          creditCheck: null
        }
      };
    
    default:
      return state;
  }
};

// Create the provider component
interface ReferencingProviderProps {
  children: ReactNode;
  initialApplicationId?: string;
  propertyId: string;
}

export const ReferencingProvider: React.FC<ReferencingProviderProps> = ({
  children,
  initialApplicationId,
  propertyId
}) => {
  const [state, dispatch] = useReducer(referencingReducer, {
    ...initialState,
    applicationId: initialApplicationId || null,
    propertyId: propertyId || null
  });
  
  // Use localStorage hook for data persistence
  const { 
    formData: storedFormData, 
    updateSection, 
    lastSaved: storedLastSaved,
    saveAsDraft: saveLocalDraft
  } = useLocalStorage(
    state.applicationId,
    state.propertyId,
    initialFormData
  );
  
  // Check if we should use API or localStorage
  const useApi = isAzureConfigured();
  
  // Initialize form data from localStorage or API
  useEffect(() => {
    const loadInitialData = async () => {
      if (useApi && state.applicationId) {
        try {
          // Try to load data from API
          const response = await referencingService.getApplication(state.applicationId);
          if (response.success && response.data) {
            // Convert API data to FormData format
            const formData = convertApiDataToFormData(response.data);
            dispatch({ type: 'SET_FORM_DATA', payload: formData });
          } else {
            // If API fails, fall back to localStorage
            dispatch({ type: 'SET_FORM_DATA', payload: storedFormData });
          }
        } catch (error) {
          console.error('Error loading application data:', error);
          // Fall back to localStorage
          dispatch({ type: 'SET_FORM_DATA', payload: storedFormData });
        }
      } else {
        // Use localStorage data
        dispatch({ type: 'SET_FORM_DATA', payload: storedFormData });
      }
      
      if (storedLastSaved) {
        dispatch({ type: 'SET_LAST_SAVED', payload: storedLastSaved.getTime() });
      }
    };
    
    loadInitialData();
  }, [storedFormData, storedLastSaved, state.applicationId, useApi]);

  // Create application if needed
  useEffect(() => {
    const createApplicationIfNeeded = async () => {
      if (useApi && state.propertyId && !state.applicationId) {
        try {
          const response = await referencingService.createApplication(state.propertyId);
          if (response.success && response.data?.applicationId) {
            dispatch({ type: 'SET_APPLICATION_ID', payload: response.data.applicationId });
          }
        } catch (error) {
          console.error('Error creating application:', error);
        }
      }
    };
    
    createApplicationIfNeeded();
  }, [state.propertyId, state.applicationId, useApi]);

  // Update form data
  const updateFormData = useCallback((section: FormSection, data: any) => {
    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: { section, data }
    });
    updateSection(section, data);
  }, [updateSection]);

  // Save form data to API or localStorage
  const saveFormData = useCallback(async (): Promise<boolean> => {
    if (!state.propertyId) return false;
    
    dispatch({ type: 'SET_IS_SAVING', payload: true });
    
    try {
      if (useApi && state.applicationId) {
        // Save to API
        const currentSection = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'][state.currentStep] as FormSection;
        const sectionData = state.formData[currentSection];
        
        // Convert FormData to API format (remove File objects)
        const apiData = convertFormSectionToApiFormat(currentSection, sectionData);
        
        const response = await referencingService.saveSectionData(
          state.applicationId,
          currentSection,
          apiData
        );
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to save data');
        }
      } else {
        // Save to localStorage
        saveToLocalStorage(`form_${state.propertyId}`, state.formData);
      }
      
      // Update last saved timestamp
      const timestamp = Date.now();
      dispatch({ type: 'SET_LAST_SAVED', payload: timestamp });
      
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_IS_SAVING', payload: false });
    }
  }, [state.propertyId, state.formData, state.currentStep, state.applicationId, useApi]);

  // Save current step
  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    return await saveFormData();
  }, [saveFormData]);

  // Upload document to Azure Storage
  const uploadDocument = useCallback(async (
    section: FormSection,
    field: string,
    file: File
  ): Promise<string | null> => {
    if (!file) return null;
    
    try {
      if (useApi && state.applicationId) {
        // Upload to API
        const response = await referencingService.uploadDocument(
          state.applicationId,
          section,
          file,
          field,
          (progress) => {
            dispatch({
              type: 'SET_UPLOAD_PROGRESS',
              payload: { field, progress }
            });
          }
        );
        
        if (response.success && response.data) {
          return response.data.fileUrl;
        }
        
        throw new Error(response.error || 'Failed to upload document');
      } else {
        // Upload directly to Azure Storage
        const result = await uploadToAzureStorage(
          file,
          `${section}/${field}`,
          (progress) => {
            dispatch({
              type: 'SET_UPLOAD_PROGRESS',
              payload: { field, progress: progress.percentage }
            });
          }
        );
        
        if (result.success && result.url) {
          return result.url;
        }
        
        throw new Error(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error(`Error uploading ${field} document:`, error);
      return null;
    }
  }, [state.applicationId, useApi]);

  // Submit application
  const submitApplication = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: true });
      dispatch({ type: 'CLEAR_ALL_ERRORS' });

      // Save current step first
      await saveFormData();
      
      if (useApi && state.applicationId) {
        // Submit to API
        const response = await referencingService.submitApplication(state.applicationId);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to submit application');
        }
        
        return true;
      } else {
        // Simulate API call
<<<<<<< HEAD
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
=======
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
>>>>>>> upstream/feature/ai-search-listings-agents
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      
      dispatch({
        type: 'SET_ERROR',
        payload: {
          section: 'creditCheck',
          error: error instanceof Error ? error.message : 'Failed to submit. Please try again.'
        }
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: false });
    }
  }, [saveFormData, state.applicationId, useApi]);

  // Navigate to the next step
  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  // Navigate to the previous step
  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  // Set the current step directly
  const setCurrentStep = useCallback((step: FormSection | number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  // Save as draft
  const saveAsDraft = useCallback(async (name: string): Promise<boolean> => {
    try {
      if (useApi && state.applicationId) {
        // Save to API
        const apiData = convertFormDataToApiFormat(state.formData);
        
        const response = await referencingService.saveDraft(
          state.applicationId,
          name,
          apiData
        );
        
        return response.success;
      } else {
        // Save to localStorage
        saveLocalDraft(name);
        return true;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }, [saveLocalDraft, state.applicationId, state.formData, useApi]);

  // Set property ID
  const setPropertyId = useCallback((id: string) => {
    dispatch({ type: 'SET_PROPERTY_ID', payload: id });
  }, []);

  // Helper function to convert FormData to API format
  const convertFormDataToApiFormat = (formData: FormData): ReferencingFormData => {
    // Create a deep copy to avoid modifying the original
    const apiData: ReferencingFormData = {
      propertyId: state.propertyId || '',
    };
    
    // Convert each section
    if (formData.identity) {
      apiData.identity = {
        ...formData.identity,
        identityProofId: formData.identity.identityProof ? 'pending-upload' : undefined
      };
      delete (apiData.identity as any).identityProof;
    }
    
    if (formData.employment) {
      apiData.employment = {
        ...formData.employment,
        proofDocumentId: formData.employment.proofDocument ? 'pending-upload' : undefined
      };
      delete (apiData.employment as any).proofDocument;
    }
    
    if (formData.residential) {
      apiData.residential = {
        ...formData.residential,
        proofDocumentId: formData.residential.proofDocument ? 'pending-upload' : undefined
      };
      delete (apiData.residential as any).proofDocument;
    }
    
    if (formData.financial) {
      apiData.financial = {
        ...formData.financial,
        proofOfIncomeDocumentId: formData.financial.proofOfIncomeDocument ? 'pending-upload' : undefined
      };
      delete (apiData.financial as any).proofOfIncomeDocument;
    }
    
    if (formData.guarantor) {
      apiData.guarantor = {
        ...formData.guarantor,
        identityDocumentId: formData.guarantor.identityDocument ? 'pending-upload' : undefined
      };
      delete (apiData.guarantor as any).identityDocument;
    }
    
    if (formData.creditCheck) {
      apiData.creditCheck = {
        ...formData.creditCheck,
        additionalDocumentId: formData.creditCheck.additionalDocument ? 'pending-upload' : undefined
      };
      delete (apiData.creditCheck as any).additionalDocument;
    }
    
    return apiData;
  };

  // Helper function to convert a form section to API format
  const convertFormSectionToApiFormat = (section: FormSection, sectionData: any): any => {
    // Create a deep copy
    const apiData = { ...sectionData };
    
    // Remove File objects based on section
    switch (section) {
      case 'identity':
        delete apiData.identityProof;
        if (sectionData.identityProof) {
          apiData.identityProofId = 'pending-upload';
        }
        break;
      case 'employment':
        delete apiData.proofDocument;
        if (sectionData.proofDocument) {
          apiData.proofDocumentId = 'pending-upload';
        }
        break;
      case 'residential':
        delete apiData.proofDocument;
        if (sectionData.proofDocument) {
          apiData.proofDocumentId = 'pending-upload';
        }
        break;
      case 'financial':
        delete apiData.proofOfIncomeDocument;
        if (sectionData.proofOfIncomeDocument) {
          apiData.proofOfIncomeDocumentId = 'pending-upload';
        }
        break;
      case 'guarantor':
        delete apiData.identityDocument;
        if (sectionData.identityDocument) {
          apiData.identityDocumentId = 'pending-upload';
        }
        break;
      case 'creditCheck':
        delete apiData.additionalDocument;
        if (sectionData.additionalDocument) {
          apiData.additionalDocumentId = 'pending-upload';
        }
        break;
    }
    
    return apiData;
  };

  // Helper function to convert API data to FormData format
  const convertApiDataToFormData = (apiData: ReferencingFormData): FormData => {
    const formData: FormData = {
      identity: {
        ...initialFormData.identity,
        ...(apiData.identity || {})
      },
      employment: {
        ...initialFormData.employment,
        ...(apiData.employment || {})
      },
      residential: {
        ...initialFormData.residential,
        ...(apiData.residential || {})
      },
      financial: {
        ...initialFormData.financial,
        ...(apiData.financial || {})
      },
      guarantor: {
        ...initialFormData.guarantor,
        ...(apiData.guarantor || {})
      },
      creditCheck: {
        ...initialFormData.creditCheck,
        ...(apiData.creditCheck || {})
      }
    };
    
    return formData;
  };

<<<<<<< HEAD
=======
  // Validation schemas
  const employmentSchema = yup.object().shape({
    employmentStatus: yup.string().required('Employment status is required'),
    companyDetails: yup.string().required('Company details are required'),
    lengthOfEmployment: yup.string().required('Length of employment is required'),
    jobPosition: yup.string().required('Job position is required'),
    referenceFullName: yup.string().required('Reference name is required'),
    referenceEmail: yup.string().email('Invalid email').required('Reference email is required'),
    referencePhone: yup.string().required('Reference phone is required'),
    proofDocument: yup.mixed().required('Proof of employment is required')
  });

  const validateSection = useCallback(async (section: keyof FormData) => {
    try {
      let schema;
      switch (section) {
        case 'employment':
          schema = employmentSchema;
          break;
        // Add other section schemas here
        default:
          return true;
      }

      await schema.validate(state.formData[section], { abortEarly: false });
      dispatch({
        type: 'CLEAR_ERROR',
        payload: section
      });
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach(err => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        dispatch({
          type: 'SET_ERROR',
          payload: {
            section,
            error: newErrors
          }
        });
      }
      return false;
    }
  }, [state.formData]);

>>>>>>> upstream/feature/ai-search-listings-agents
  return (
    <ReferencingContext.Provider
      value={{
        state,
        dispatch,
        updateFormData,
        saveCurrentStep,
        submitApplication,
        nextStep,
        prevStep,
        setCurrentStep,
        saveAsDraft,
        setPropertyId,
<<<<<<< HEAD
        uploadDocument
=======
        uploadDocument,
        formData: state.formData,
        errors: state.errors,
        validateSection
>>>>>>> upstream/feature/ai-search-listings-agents
      }}
    >
      {children}
    </ReferencingContext.Provider>
  );
};

// Custom hook to use the referencing context
export const useReferencing = (): ReferencingContextType => {
  const context = useContext(ReferencingContext);
  if (!context) {
    throw new Error('useReferencing must be used within a ReferencingProvider');
  }
  return context;
<<<<<<< HEAD
};
=======
}; 
>>>>>>> upstream/feature/ai-search-listings-agents

export default ReferencingContext; 