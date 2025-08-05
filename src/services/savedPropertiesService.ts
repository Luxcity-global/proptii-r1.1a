import axios from 'axios';

// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://proptii-r1-1a.onrender.com/api';

export interface SavedProperty {
  id: string;
  propertyId: string;
  userId: string;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  address: string;
  city: string;
  postcode: string;
  savedAt: string;
  property: {
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
  };
}

class SavedPropertiesService {
  // In-memory storage for demo purposes
  private savedProperties: Map<string, SavedProperty[]> = new Map();

  async saveProperty(userId: string, property: any): Promise<SavedProperty> {
    try {
      console.log('SavedPropertiesService - Saving property for userId:', userId, 'property:', property);
      
      // For demo purposes, we'll use localStorage as a simple persistence layer
      const savedProperty: SavedProperty = {
        id: `saved-${Date.now()}`,
        propertyId: property.id,
        userId,
        title: property.title,
        price: property.price,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        propertyType: property.type === 'rent' ? 'To Rent' : 'For Sale',
        address: property.location.address,
        city: property.location.city,
        postcode: property.location.postcode,
        savedAt: new Date().toISOString(),
        property: property
      };

      // Get existing saved properties for this user
      const existing = this.getSavedPropertiesFromStorage(userId);
      const updated = [...existing, savedProperty];
      
      // Save to localStorage
      localStorage.setItem(`saved-properties-${userId}`, JSON.stringify(updated));
      console.log('SavedPropertiesService - Property saved successfully. Total saved properties:', updated.length);
      
      return savedProperty;
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  }

  async removeSavedProperty(userId: string, propertyId: string): Promise<void> {
    try {
      const existing = this.getSavedPropertiesFromStorage(userId);
      const updated = existing.filter(p => p.propertyId !== propertyId);
      localStorage.setItem(`saved-properties-${userId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing saved property:', error);
      throw error;
    }
  }

  async getSavedProperties(userId: string): Promise<SavedProperty[]> {
    try {
      console.log('SavedPropertiesService - Getting saved properties for userId:', userId);
      const properties = this.getSavedPropertiesFromStorage(userId);
      console.log('SavedPropertiesService - Found properties:', properties);
      return properties;
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      return [];
    }
  }

  async checkIfPropertySaved(userId: string, propertyId: string): Promise<boolean> {
    try {
      const savedProperties = this.getSavedPropertiesFromStorage(userId);
      return savedProperties.some(p => p.propertyId === propertyId);
    } catch (error) {
      console.error('Error checking if property is saved:', error);
      return false;
    }
  }

  private getSavedPropertiesFromStorage(userId: string): SavedProperty[] {
    try {
      const key = `saved-properties-${userId}`;
      const stored = localStorage.getItem(key);
      console.log('SavedPropertiesService - Getting saved properties for userId:', userId);
      console.log('SavedPropertiesService - localStorage key:', key);
      console.log('SavedPropertiesService - Stored data:', stored);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('SavedPropertiesService - Parsed data:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      console.error('SavedPropertiesService - Error getting saved properties from storage:', error);
      return [];
    }
  }
}

export default new SavedPropertiesService(); 