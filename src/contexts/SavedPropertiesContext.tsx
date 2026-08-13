import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { consumePendingProperty } from '../utils/onboardingSession';

export interface SavedProperty {
  id: string;
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  imageUrls: string[];
  agent: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    website?: string;
  };
  source?: string;
  description?: string;
  savedAt: string;
}

interface SavedPropertiesContextType {
  savedProperties: SavedProperty[];
  isPropertySaved: (propertyId: string) => boolean;
  saveProperty: (property: any) => void;
  unsaveProperty: (propertyId: string) => void;
  toggleSaveProperty: (property: any) => void;
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
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved properties from localStorage on mount; migrate any pending property from onboarding
  useEffect(() => {
    const saved = localStorage.getItem('savedProperties');
    let parsed: SavedProperty[] = [];
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading saved properties:', error);
        localStorage.removeItem('savedProperties');
      }
    }
    const pending = consumePendingProperty();
    if (pending && typeof pending === 'object' && pending !== null && 'title' in pending) {
      const prop = pending as Record<string, unknown>;
      const propertyId = `${prop.title}-${prop.location}-${prop.price}`;
      if (!parsed.some(p => p.id === propertyId)) {
        const agentData = (prop.agent as Record<string, unknown>) || {};
        parsed.push({
          id: propertyId,
          title: String(prop.title ?? ''),
          price: String(prop.price ?? ''),
          location: String(prop.location ?? ''),
          bedrooms: String(prop.bedrooms ?? ''),
          propertyType: String(prop.propertyType ?? ''),
          imageUrls: Array.isArray(prop.imageUrls) ? prop.imageUrls as string[] : (Array.isArray(prop.images) ? prop.images as string[] : []),
          agent: {
            id: agentData.id as string | undefined,
            name: String(agentData.name ?? prop.source ?? 'Unknown Agent'),
            email: String(agentData.email ?? ''),
            phone: agentData.phone as string | undefined,
            company: agentData.company as string | undefined,
            website: agentData.website as string | undefined
          },
          source: prop.source as string | undefined,
          description: (prop.description || prop.summary || prop.notes) as string | undefined,
          savedAt: new Date().toISOString()
        });
      }
    }
    setSavedProperties(parsed);
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever savedProperties changes (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
    }
  }, [savedProperties, isInitialized]);

  const isPropertySaved = (propertyId: string): boolean => {
    return savedProperties.some(prop => prop.id === propertyId);
  };

  const saveProperty = (property: any) => {
    // Create a stable unique identifier using multiple property attributes
    const propertyId = `${property.title}-${property.location}-${property.price}`;
    
    // Check if already saved
    if (isPropertySaved(propertyId)) {
      return;
    }

    // Extract all agent information
    const agentData = property.agent || {};
    const savedProperty: SavedProperty = {
      id: propertyId,
      title: property.title,
      price: property.price,
      location: property.location,
      bedrooms: property.bedrooms,
      propertyType: property.propertyType,
      imageUrls: property.imageUrls || property.images || [],
      agent: {
        id: agentData.id || agentData.name || property.source || `agent-${Date.now()}`,
        name: agentData.name || property.source || 'Unknown Agent',
        email: agentData.email || '',
        phone: agentData.phone || '',
        company: agentData.company || property.source || 'Estate Agency',
        website: agentData.website
      },
      source: property.source,
      description: property.description || property.summary || property.notes || '',
      savedAt: new Date().toISOString()
    };

    setSavedProperties(prev => [...prev, savedProperty]);
  };

  const unsaveProperty = (propertyId: string) => {
    setSavedProperties(prev => prev.filter(prop => prop.id !== propertyId));
  };

  const toggleSaveProperty = (property: any) => {
    const propertyId = `${property.title}-${property.location}-${property.price}`;
    
    if (isPropertySaved(propertyId)) {
      unsaveProperty(propertyId);
    } else {
      saveProperty(property);
    }
  };

  const value: SavedPropertiesContextType = {
    savedProperties,
    isPropertySaved,
    saveProperty,
    unsaveProperty,
    toggleSaveProperty
  };

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};
