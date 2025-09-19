import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Property interface matching the mock data structure
interface Property {
  id: string;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates: [number, number];
  };
  images: {
    src: string;
    alt: string;
    loading: string;
    sizes: string;
  }[];
  features: string[];
  description: string;
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  amenities: {
    schools: number;
    transport: string[];
    shops: string[];
  };
  createdAt: string;
  updatedAt: string;
  isAvailableNow?: boolean;
}

interface SavedProperty {
  id: string;
  property: Property;
  savedAt: string;
}

interface SavedPropertiesContextType {
  savedProperties: SavedProperty[];
  isPropertySaved: (propertyId: string) => boolean;
  saveProperty: (property: Property) => void;
  removeSavedProperty: (propertyId: string) => void;
  getSavedPropertiesCount: () => number;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export const useSavedProperties = () => {
  const context = useContext(SavedPropertiesContext);
  if (context === undefined) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
};

interface SavedPropertiesProviderProps {
  children: ReactNode;
}

export const SavedPropertiesProvider: React.FC<SavedPropertiesProviderProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the storage key to prevent unnecessary re-renders
  const storageKey = useMemo(() => {
    return user ? `savedProperties_${user.id || user.email}` : 'savedProperties_anonymous';
  }, [user]);

  // Load saved properties from localStorage on mount or when user changes
  useEffect(() => {
    console.log('SavedPropertiesProvider: User changed to:', user?.email || 'no user', 'isLoading:', isLoading);
    
    // Don't do anything while authentication is still loading
    if (isLoading) {
      console.log('SavedPropertiesProvider: Authentication still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('SavedPropertiesProvider: No user after loading, clearing saved properties');
      setSavedProperties([]);
      setIsInitialized(true);
      return;
    }

    const saved = localStorage.getItem(storageKey);
    console.log(`Loading saved properties for user ${user.email} from localStorage:`, saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('Parsed saved properties:', parsed);
        setSavedProperties(parsed);
      } catch (error) {
        console.error('Error loading saved properties:', error);
        setSavedProperties([]);
      }
    } else {
      console.log('No saved properties found for user, starting with empty array');
      setSavedProperties([]);
    }
    setIsInitialized(true);
  }, [user, storageKey, isLoading]);

  // Save to localStorage whenever savedProperties changes, but only after initialization
  useEffect(() => {
    if (isInitialized && user) {
      console.log(`Saving properties to localStorage for user ${user.email}:`, savedProperties);
      localStorage.setItem(storageKey, JSON.stringify(savedProperties));
    }
  }, [savedProperties, isInitialized, user, storageKey]);

  const isPropertySaved = (propertyId: string): boolean => {
    const isSaved = savedProperties.some(sp => sp.property.id === propertyId);
    console.log(`Checking if property ${propertyId} is saved:`, isSaved, 'Total saved properties:', savedProperties.length);
    return isSaved;
  };

  const saveProperty = (property: Property) => {
    console.log('Attempting to save property:', property.id);
    if (!isPropertySaved(property.id)) {
      const savedProperty: SavedProperty = {
        id: `${property.id}_${Date.now()}`,
        property,
        savedAt: new Date().toISOString()
      };
      console.log('Creating saved property:', savedProperty);
      setSavedProperties(prev => {
        const newState = [...prev, savedProperty];
        console.log('New saved properties state:', newState);
        return newState;
      });
    } else {
      console.log('Property already saved:', property.id);
    }
  };

  const removeSavedProperty = (propertyId: string) => {
    console.log('Attempting to remove property:', propertyId);
    setSavedProperties(prev => {
      const newState = prev.filter(sp => sp.property.id !== propertyId);
      console.log('New saved properties state after removal:', newState);
      return newState;
    });
  };

  const getSavedPropertiesCount = (): number => {
    return savedProperties.length;
  };

  const value: SavedPropertiesContextType = {
    savedProperties,
    isPropertySaved,
    saveProperty,
    removeSavedProperty,
    getSavedPropertiesCount
  };

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}; 