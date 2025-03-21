import { Property, ViewingSchedule, Requirement } from '../context/BookViewingContext';

// API base URL - use Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const bookingService = {
  searchProperty: async (propertyUrl: string): Promise<Property> => {
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyUrl })
      });
      
      if (!response.ok) throw new Error('Failed to search property');
      return await response.json();
    } catch (error) {
      throw new Error('Error searching property: ' + (error as Error).message);
    }
  },

  searchPropertyListings: async (searchUrl: string): Promise<Property[]> => {
    try {
      const response = await fetch('/api/properties/search-listings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ searchUrl })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to search property listings');
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching property listings:', error);
      throw new Error('Error searching property listings: ' + (error as Error).message);
    }
  },

  scheduleViewing: async (propertyId: string, schedule: ViewingSchedule): Promise<void> => {
    try {
      const response = await fetch('/api/viewings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, schedule })
      });
      
      if (!response.ok) throw new Error('Failed to schedule viewing');
    } catch (error) {
      throw new Error('Error scheduling viewing: ' + (error as Error).message);
    }
  },

  checkRequirements: async (propertyId: string): Promise<Requirement[]> => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/requirements`);
      if (!response.ok) throw new Error('Failed to check requirements');
      return await response.json();
    } catch (error) {
      throw new Error('Error checking requirements: ' + (error as Error).message);
    }
  },

  getSimilarProperties: async (propertyId: string): Promise<Property[]> => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/similar`);
      if (!response.ok) throw new Error('Failed to get similar properties');
      return await response.json();
    } catch (error) {
      throw new Error('Error getting similar properties: ' + (error as Error).message);
    }
  }
}; 