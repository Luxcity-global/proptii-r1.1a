import { useState, useCallback } from 'react';
import { FormSection } from '../../../types/referencing';
import { validateSection } from '../validation/validationSchemas';

/**
 * Custom hook for form validation using Yup schemas
 * 
 * @param section - The form section to validate
 * @returns Object with validation state and functions
 */
export const useFormValidation = (section: FormSection) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  /**
   * Validate form data against the schema for the current section
   * 
   * @param data - The form data to validate
   * @returns True if validation passes, false otherwise
   */
  const validate = useCallback(
    async (data: any): Promise<boolean> => {
      setIsValidating(true);
      
      try {
        const result = await validateSection(section, data);
        setErrors(result.errors);
        return result.isValid;
      } catch (error) {
        console.error('Validation error:', error);
        setErrors({ form: 'An unexpected error occurred during validation' });
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [section]
  );
  
  /**
   * Validate a single field in the form
   * 
   * @param fieldName - The name of the field to validate
   * @param value - The value of the field
   * @param formData - The complete form data (needed for conditional validation)
   */
  const validateField = useCallback(
    async (fieldName: string, value: any, formData: any): Promise<void> => {
      try {
        // Create a temporary object with just the field being validated
        // but include the full form data for conditional validation
        const result = await validateSection(section, {
          ...formData,
          [fieldName]: value
        });
        
        // Only update the error for this specific field
        setErrors(prev => ({
          ...prev,
          [fieldName]: result.errors[fieldName] || ''
        }));
      } catch (error) {
        console.error(`Error validating field ${fieldName}:`, error);
      }
    },
    [section]
  );
  
  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  /**
   * Clear validation error for a specific field
   * 
   * @param fieldName - The name of the field to clear errors for
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);
  
  return {
    errors,
    isValidating,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};

export default useFormValidation; 