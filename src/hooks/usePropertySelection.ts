import { useState } from 'react';
import { savePropertySelection, removePropertySelection, updatePropertySelectionStatus, PropertyData } from '../utils/propertySelectionUtils';

export const usePropertySelection = (userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectProperty = async (propertyData: PropertyData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await savePropertySelection(userId, propertyData);
      
      if (!result.success) {
        setError(result.error || 'Failed to save property selection');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeProperty = async (selectionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await removePropertySelection(selectionId);
      
      if (!result.success) {
        setError(result.error || 'Failed to remove property selection');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (
    selectionId: string,
    status: 'interested' | 'viewing_requested' | 'viewing_scheduled' | 'viewing_completed' | 'rejected',
    notes?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await updatePropertySelectionStatus(selectionId, status, notes);
      
      if (!result.success) {
        setError(result.error || 'Failed to update property status');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectProperty,
    removeProperty,
    updateStatus,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};
