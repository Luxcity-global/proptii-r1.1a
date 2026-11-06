import React, { createContext, useReducer, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { FormData, FormSection, ReferencingState as FormReferencingState, ReferencingAction as FormReferencingAction, ReferencingFormData } from '../../../types/referencing';
import { saveToLocalStorage, loadFromLocalStorage, saveDraft } from '../../../utils/localStorage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import referencingService from '../../../services/referencingService';
import { uploadToFirebaseStorage } from '../../../services/storageService';
import * as yup from 'yup';

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
  submitApplication: (userId?: string) => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: FormSection | number) => void;
  saveAsDraft: (name: string) => Promise<boolean>;
  setPropertyId: (id: string) => void;
  uploadDocument: (section: FormSection, field: string, file: File) => Promise<string | null>;
  formData: FormData;
  errors: {
    [K in keyof FormData]?: {
      [key: string]: string;
    };
  };
  validateSection: (section: keyof FormData) => Promise<boolean>;
  currentStep: number;
}

// Create the context
const ReferencingContext = createContext<ReferencingContextType | undefined>(undefined);

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
  initialStep?: number;
}

export const ReferencingProvider: React.FC<ReferencingProviderProps> = ({
  children,
  initialApplicationId,
  propertyId,
  initialStep,
}) => {
  const [state, dispatch] = useReducer(referencingReducer, {
    ...initialState,
    currentStep: typeof initialStep === 'number' && initialStep >= 0 ? initialStep : 0,
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
  const useApi = true;
  
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

  // Helper function to normalize document fields for storage and API
  const normalizeDocumentField = (doc: any): any => {
    if (!doc) return undefined;
    if (typeof doc === 'string') {
      const trimmed = doc.trim();
      if (!trimmed) return undefined;
      const name = trimmed.split('/').pop()?.split('?')[0] || 'document';
      return { name, url: trimmed, dataUrl: trimmed };
    }
    if (typeof doc === 'object') {
      const url = doc.url || doc.dataUrl || doc.downloadUrl;
      const name = doc.name || doc.fileName || doc.storagePath?.split('/').pop() || (url ? url.split('/').pop()?.split('?')[0] : 'document');
      if (!name && !url && !doc.storagePath) return undefined;
      return {
        name: name || 'document',
        url: url || undefined,
        dataUrl: doc.dataUrl || url || undefined,
        storagePath: doc.storagePath || undefined,
        type: doc.type || doc.contentType || undefined,
        size: typeof doc.size === 'number' ? doc.size : undefined,
        lastModified: doc.lastModified || undefined,
      };
    }
    return undefined;
  };

  // Upload document with multi-tier resilient fallback
  const uploadDocument = useCallback(async (
    section: FormSection,
    field: string,
    file: File
  ): Promise<string | null> => {
    if (!file) return null;
    
    const targetId = state.applicationId || state.propertyId || 'general';
    
    try {
      if (useApi) {
        const response = await referencingService.uploadDocument(
          targetId,
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
        
        if (response.success && response.data?.fileUrl) {
          return response.data.fileUrl;
        }
      }
      
      // Direct Firebase Storage upload fallback
      const result = await uploadToFirebaseStorage(
        file,
        `referencing/${targetId}/${section}/${field}`,
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
    } catch (error) {
      console.error(`Error uploading ${field} document:`, error);
      return null;
    }
  }, [state.applicationId, state.propertyId, useApi]);

  // Update form data (with automatic File serialization and background upload)
  const updateFormData = useCallback((section: FormSection, data: any) => {
    const sanitizedData = { ...data };
    for (const [key, val] of Object.entries(sanitizedData)) {
      if (val instanceof File) {
        sanitizedData[key] = {
          name: val.name,
          size: val.size,
          type: val.type,
          lastModified: val.lastModified,
          isUploading: true,
        };
        // Auto-trigger background upload for the file
        uploadDocument(section, key, val).then((uploadedUrl) => {
          if (uploadedUrl) {
            const uploadedDoc = {
              name: val.name,
              size: val.size,
              type: val.type,
              lastModified: val.lastModified,
              url: uploadedUrl,
              dataUrl: uploadedUrl,
              isUploading: false,
            };
            dispatch({
              type: 'UPDATE_FORM_DATA',
              payload: {
                section,
                data: {
                  [key]: uploadedDoc,
                  [`${key}Id`]: uploadedUrl,
                },
              },
            });
            updateSection(section, {
              [key]: uploadedDoc,
              [`${key}Id`]: uploadedUrl,
            });
          }
        }).catch((err) => {
          console.error(`Auto-upload failed for ${section}.${key}:`, err);
        });
      }
    }

    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: { section, data: sanitizedData }
    });
    updateSection(section, sanitizedData);
  }, [updateSection, uploadDocument]);

  // Save form data to API or localStorage
  const saveFormData = useCallback(async (): Promise<boolean> => {
    const targetId = state.applicationId || state.propertyId;
    if (!targetId) return false;
    
    dispatch({ type: 'SET_IS_SAVING', payload: true });
    
    try {
      if (useApi) {
        // Save to API
        const currentSection = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'][state.currentStep] as FormSection;
        const sectionData = state.formData[currentSection];
        
        // Convert FormData to API format preserving document metadata
        const apiData = convertFormSectionToApiFormat(currentSection, sectionData);
        
        const response = await referencingService.saveSectionData(
          targetId,
          currentSection,
          apiData
        );
        
        if (!response.success) {
          console.warn('API saveSectionData response warning:', response.error);
        }
      }
      
      // Save to localStorage
      saveToLocalStorage(`form_${targetId}`, state.formData);
      
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

  // Helper function to convert FormData to API format while preserving document metadata
  const convertFormDataToApiFormat = useCallback((formData: FormData): ReferencingFormData => {
    const targetId = state.propertyId || state.applicationId || '';
    const apiData: ReferencingFormData = {
      propertyId: targetId,
    };
    
    if (formData.identity) {
      const normDoc = normalizeDocumentField(formData.identity.identityProof);
      apiData.identity = {
        ...formData.identity,
        identityProof: normDoc,
        identityProofId: normDoc?.url || formData.identity.identityProofId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    if (formData.employment) {
      const normDoc = normalizeDocumentField(formData.employment.proofDocument);
      apiData.employment = {
        ...formData.employment,
        proofDocument: normDoc,
        proofDocumentId: normDoc?.url || formData.employment.proofDocumentId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    if (formData.residential) {
      const normDoc = normalizeDocumentField(formData.residential.proofDocument);
      apiData.residential = {
        ...formData.residential,
        proofDocument: normDoc,
        proofDocumentId: normDoc?.url || formData.residential.proofDocumentId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    if (formData.financial) {
      const normDoc = normalizeDocumentField(formData.financial.proofOfIncomeDocument);
      apiData.financial = {
        ...formData.financial,
        proofOfIncomeDocument: normDoc,
        proofOfIncomeDocumentId: normDoc?.url || formData.financial.proofOfIncomeDocumentId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    if (formData.guarantor) {
      const normDoc = normalizeDocumentField(formData.guarantor.identityDocument);
      apiData.guarantor = {
        ...formData.guarantor,
        identityDocument: normDoc,
        identityDocumentId: normDoc?.url || formData.guarantor.identityDocumentId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    if (formData.creditCheck) {
      const normDoc = normalizeDocumentField((formData.creditCheck as any).additionalDocument);
      apiData.creditCheck = {
        ...formData.creditCheck,
        additionalDocument: normDoc,
        additionalDocumentId: normDoc?.url || (formData.creditCheck as any).additionalDocumentId || (normDoc ? normDoc.name : undefined)
      };
    }
    
    return apiData;
  }, [state.propertyId, state.applicationId]);

  // Submit application
  const submitApplication = useCallback(async (userId?: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: true });
      dispatch({ type: 'CLEAR_ALL_ERRORS' });

      // Save current step first
      await saveFormData();
      
      if (useApi) {
        // Get userId - use provided userId, or applicationId, or 'anonymous'
        const userIdToUse = userId || state.applicationId || 'anonymous';
        
        // Convert form data to API format
        const apiData = convertFormDataToApiFormat(state.formData);
        
        console.log('Submitting referencing application:', {
          userId: userIdToUse,
          hasFormData: !!state.formData,
          propertyId: state.propertyId,
          formDataKeys: Object.keys(state.formData)
        });
        
        // Submit to API
        const response = await referencingService.submitApplication(userIdToUse, { formData: apiData });
        
        console.log('Submit application response:', response);
        
        if (!response || (response.success === false)) {
          throw new Error(response?.error || 'Failed to submit application');
        }
        
        return true;
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
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
  }, [saveFormData, state.applicationId, state.formData, state.propertyId, useApi, convertFormDataToApiFormat]);

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
  }, [saveLocalDraft, state.applicationId, state.formData, useApi, convertFormDataToApiFormat]);

  // Set property ID
  const setPropertyId = useCallback((id: string) => {
    dispatch({ type: 'SET_PROPERTY_ID', payload: id });
  }, []);


  // Helper function to convert a form section to API format while preserving documents
  const convertFormSectionToApiFormat = (section: FormSection, sectionData: any): any => {
    const apiData = { ...sectionData };
    
    switch (section) {
      case 'identity': {
        const normDoc = normalizeDocumentField(sectionData?.identityProof);
        apiData.identityProof = normDoc;
        apiData.identityProofId = normDoc?.url || sectionData?.identityProofId || (normDoc ? normDoc.name : undefined);
        break;
      }
      case 'employment': {
        const normDoc = normalizeDocumentField(sectionData?.proofDocument);
        apiData.proofDocument = normDoc;
        apiData.proofDocumentId = normDoc?.url || sectionData?.proofDocumentId || (normDoc ? normDoc.name : undefined);
        break;
      }
      case 'residential': {
        const normDoc = normalizeDocumentField(sectionData?.proofDocument);
        apiData.proofDocument = normDoc;
        apiData.proofDocumentId = normDoc?.url || sectionData?.proofDocumentId || (normDoc ? normDoc.name : undefined);
        break;
      }
      case 'financial': {
        const normDoc = normalizeDocumentField(sectionData?.proofOfIncomeDocument);
        apiData.proofOfIncomeDocument = normDoc;
        apiData.proofOfIncomeDocumentId = normDoc?.url || sectionData?.proofOfIncomeDocumentId || (normDoc ? normDoc.name : undefined);
        break;
      }
      case 'guarantor': {
        const normDoc = normalizeDocumentField(sectionData?.identityDocument);
        apiData.identityDocument = normDoc;
        apiData.identityDocumentId = normDoc?.url || sectionData?.identityDocumentId || (normDoc ? normDoc.name : undefined);
        break;
      }
      case 'creditCheck': {
        const normDoc = normalizeDocumentField(sectionData?.additionalDocument);
        apiData.additionalDocument = normDoc;
        apiData.additionalDocumentId = normDoc?.url || sectionData?.additionalDocumentId || (normDoc ? normDoc.name : undefined);
        break;
      }
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

  // ── Validation schemas — matched exactly to the actual form fields ──────────

  const isDocumentValid = (value: any): boolean => {
    if (!value) return false;
    if (value instanceof File) return true;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') {
      return !!(value.name || value.fileName || value.url || value.dataUrl || value.storagePath);
    }
    return false;
  };

  const identitySchema = yup.object().shape({
    firstName:     yup.string().required('First name is required'),
    lastName:      yup.string().required('Last name is required'),
    email:         yup.string().email('Invalid email address').required('Email is required'),
    phoneNumber:   yup.string().required('Phone number is required'),
    dateOfBirth:   yup.string().required('Date of birth is required'),
    nationality:   yup.string().required('Nationality is required'),
    identityProof: yup.mixed().test('identity-proof-required', 'Identity proof document is required', isDocumentValid),
  });

  const employmentSchema = yup.object().shape({
    employmentStatus:  yup.string().required('Employment status is required'),
    companyDetails:    yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.required('Company name is required'),
      otherwise: (s) => s.notRequired(),
    }),
    lengthOfEmployment: yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.required('Length of employment is required'),
      otherwise: (s) => s.notRequired(),
    }),
    jobPosition:       yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.required('Job position is required'),
      otherwise: (s) => s.notRequired(),
    }),
    referenceFullName: yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.required('Reference name is required'),
      otherwise: (s) => s.notRequired(),
    }),
    referenceEmail:    yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.email('Invalid email').required('Reference email is required'),
      otherwise: (s) => s.notRequired(),
    }),
    referencePhone:    yup.string().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.required('Reference phone is required'),
      otherwise: (s) => s.notRequired(),
    }),
    proofDocument: yup.mixed().when('employmentStatus', {
      is: (v: string) => v && v !== 'unemployed' && v !== 'retired',
      then: (s) => s.test('employment-proof-required', 'Proof of employment is required', isDocumentValid),
      otherwise: (s) => s.notRequired(),
    }),
  });

  const residentialSchema = yup.object().shape({
    currentAddress:            yup.string().required('Current address is required'),
    durationAtCurrentAddress:  yup.string().required('Duration at current address is required'),
    proofType:                 yup.string().required('Proof type is required'),
    proofDocument:             yup.mixed().test('residential-proof-required', 'Proof of address document is required', isDocumentValid),
  });

  const financialSchema = yup.object().shape({
    proofOfIncomeType:     yup.string().required('Proof of income type is required'),
    proofOfIncomeDocument: yup.mixed().when('useOpenBanking', {
      is: true,
      then: (s) => s.notRequired(),
      otherwise: (s) => s.test('financial-proof-required', 'Proof of income document is required', isDocumentValid),
    }),
  });

  const guarantorSchema = yup.object().shape({
    firstName:        yup.string().required('Guarantor first name is required'),
    lastName:         yup.string().required('Guarantor last name is required'),
    email:            yup.string().email('Invalid email address').required('Guarantor email is required'),
    phoneNumber:      yup.string().required('Guarantor phone number is required'),
    address:          yup.string().required('Guarantor address is required'),
    identityDocument: yup.mixed().test('guarantor-proof-required', 'Guarantor identity document is required', isDocumentValid),
  });

  const creditCheckSchema = yup.object().shape({
    hasAgreedToCheck: yup
      .boolean()
      .oneOf([true], 'You must agree to the credit check to proceed')
      .required('You must agree to the credit check to proceed'),
  });

  const sectionSchemas: Partial<Record<keyof FormData, yup.ObjectSchema<any>>> = {
    identity:    identitySchema,
    employment:  employmentSchema,
    residential: residentialSchema,
    financial:   financialSchema,
    guarantor:   guarantorSchema,
    creditCheck: creditCheckSchema,
  };

  const validateSection = useCallback(async (section: keyof FormData) => {
    const schema = sectionSchemas[section];
    if (!schema) return true; // no schema defined — allow through

    try {
      await schema.validate(state.formData[section], { abortEarly: false });
      dispatch({ type: 'CLEAR_ERROR', payload: section });
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach(err => {
          if (err.path) newErrors[err.path] = err.message;
        });
        dispatch({ type: 'SET_ERROR', payload: { section, error: newErrors as any } });
      }
      return false;
    }
  }, [state.formData]);

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
        uploadDocument,
        formData: state.formData,
        errors: state.errors,
        validateSection,
        currentStep: state.currentStep
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
};

export default ReferencingContext; 