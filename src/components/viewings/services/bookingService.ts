import { PropertyDetails, ViewingDetails } from '../context/BookViewingContext';

// API base URL - use Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const bookingService = {
  searchProperty: async (propertyUrl: string): Promise<PropertyDetails> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/search`, {
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

  searchPropertyListings: async (searchUrl: string): Promise<PropertyDetails[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/search-listings`, {
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

  scheduleViewing: async (property: PropertyDetails, viewingDetails: ViewingDetails): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/viewing-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            street: property.street,
            city: property.city,
            town: property.town || '',
            postcode: property.postcode
          },
          agent: {
            name: property.agent.name,
            email: property.agent.email,
            phone: property.agent.phone,
            company: property.agent.company
          },
          viewing_date: viewingDetails.date,
          viewing_time: viewingDetails.time,
          preference: viewingDetails.preference,
          status: 'PENDING'
        })
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