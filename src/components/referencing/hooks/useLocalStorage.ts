import { useEffect, useState } from 'react';
import { FormData, FormSection } from '../../../types/referencing';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  saveDraft 
} from '../../../utils/localStorage';

/**
 * Custom hook for managing form data persistence in localStorage
 * 
 * @param applicationId - The ID of the application
 * @param propertyId - The ID of the property
 * @param initialData - Initial form data
 * @returns Object with form data and utility functions
 */
export const useLocalStorage = (
  applicationId: string | null,
  propertyId: string | null,
  initialData: FormData
) => {
  // Generate a storage key based on application ID or property ID
  const getStorageKey = () => {
    if (applicationId) {
      return `application_${applicationId}`;
    }
    if (propertyId) {
      return `property_${propertyId}_draft`;
    }
    return 'referencing_temp_draft';
  };
  
  // Load initial data from localStorage or use provided initialData
  const loadInitialData = (): FormData => {
    const storageKey = getStorageKey();
    const savedData = loadFromLocalStorage<FormData>(storageKey);
    return savedData || initialData;
  };
  
  // State for form data
  const [formData, setFormData] = useState<FormData>(loadInitialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const storageKey = getStorageKey();
    saveToLocalStorage(storageKey, formData);
    setLastSaved(new Date());
  }, [formData]);
  
  // Update a specific section of the form data
  const updateSection = (section: FormSection, data: any) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        ...data
      }
    }));
  };
  
  // Save the current state as a named draft
  const saveAsDraft = (name: string) => {
    if (!propertyId) return;
    
    saveDraft(`property_${propertyId}`, formData, name);
  };
  
  // Auto-save functionality
  useEffect(() => {
    // Set up auto-save interval
    const autoSaveInterval = setInterval(() => {
      if (propertyId) {
        saveToLocalStorage(getStorageKey(), formData);
        setLastSaved(new Date());
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [formData, propertyId]);
  
  return {
    formData,
    updateSection,
    lastSaved,
    saveAsDraft
  };
};

export default useLocalStorage; 