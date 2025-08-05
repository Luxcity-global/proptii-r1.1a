import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import savedPropertiesService, { SavedProperty } from '../services/savedPropertiesService';

interface SavedPropertiesContextType {
  savedProperties: SavedProperty[];
  isLoading: boolean;
  error: string | null;
  saveProperty: (property: any) => Promise<void>;
  removeSavedProperty: (propertyId: string) => Promise<void>;
  isPropertySaved: (propertyId: string) => boolean;
  refreshSavedProperties: () => Promise<void>;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

interface SavedPropertiesProviderProps {
  children: ReactNode;
  userId?: string;
}

export const SavedPropertiesProvider: React.FC<SavedPropertiesProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSavedProperties = async () => {
    console.log('SavedPropertiesContext - refreshSavedProperties called with userId:', userId);
    if (!userId) {
      console.log('SavedPropertiesContext - No userId provided, returning early');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('SavedPropertiesContext - Calling savedPropertiesService.getSavedProperties with userId:', userId);
      const properties = await savedPropertiesService.getSavedProperties(userId);
      console.log('SavedPropertiesContext - Received properties from service:', properties);
      setSavedProperties(properties);
    } catch (err) {
      setError('Failed to load saved properties');
      console.error('SavedPropertiesContext - Error loading saved properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProperty = async (property: any) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      const savedProperty = await savedPropertiesService.saveProperty(userId, property);
      setSavedProperties(prev => [...prev, savedProperty]);
    } catch (err) {
      setError('Failed to save property');
      console.error('Error saving property:', err);
      throw err;
    }
  };

  const removeSavedProperty = async (propertyId: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      await savedPropertiesService.removeSavedProperty(userId, propertyId);
      setSavedProperties(prev => prev.filter(p => p.propertyId !== propertyId));
    } catch (err) {
      setError('Failed to remove saved property');
      console.error('Error removing saved property:', err);
      throw err;
    }
  };

  const isPropertySaved = (propertyId: string): boolean => {
    return savedProperties.some(p => p.propertyId === propertyId);
  };

  // Load saved properties on mount and when userId changes
  useEffect(() => {
    console.log('SavedPropertiesContext - userId changed:', userId);
    console.log('SavedPropertiesContext - userId type:', typeof userId);
    console.log('SavedPropertiesContext - userId value:', userId);
    
    if (userId) {
      console.log('SavedPropertiesContext - Calling refreshSavedProperties with userId:', userId);
      refreshSavedProperties();
    } else {
      console.log('SavedPropertiesContext - No userId provided, clearing saved properties');
      setSavedProperties([]);
    }
  }, [userId]);

  const value: SavedPropertiesContextType = {
    savedProperties,
    isLoading,
    error,
    saveProperty,
    removeSavedProperty,
    isPropertySaved,
    refreshSavedProperties,
  };

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};

export const useSavedProperties = (): SavedPropertiesContextType => {
  const context = useContext(SavedPropertiesContext);
  if (context === undefined) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}; 