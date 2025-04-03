import { useState } from 'react';
import { FormSection } from '../../../types/referencing';
import { useReferencing } from '../context/ReferencingContext';
import useFormValidation from './useFormValidation';

/**
 * Custom hook for handling form submission and validation in the referencing process
 * 
 * @param section - The current form section
 * @param onSubmit - Optional callback for custom submission handling
 * @returns Object with form submission state and handlers
 */
export const useReferencingForm = (
  section: FormSection,
  onSubmit?: (data: any) => void
) => {
  const { state, updateFormData, saveCurrentStep, nextStep } = useReferencing();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { errors, validate, validateField, clearErrors } = useFormValidation(section);
  
  /**
   * Handle form submission with validation
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);
    
    try {
      // Get the current section data
      const sectionData = state.formData[section];
      
      // Validate the form data
      const isValid = await validate(sectionData);
      
      if (!isValid) {
        return;
      }
      
      // Save the current step
      await saveCurrentStep();
      
      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(sectionData);
      } else {
        // Otherwise, proceed to the next step
        nextStep();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handle field change with validation
   * 
   * @param fieldName - The name of the field being changed
   * @param value - The new value of the field
   */
  const handleFieldChange = (fieldName: string, value: any) => {
    // Update the form data
    updateFormData(section, { [fieldName]: value });
    
    // Validate the field
    validateField(fieldName, value, state.formData[section]);
  };
  
  return {
    handleSubmit,
    handleFieldChange,
    errors,
    isSubmitting,
    formData: state.formData[section],
    clearErrors
  };
};

export default useReferencingForm; 