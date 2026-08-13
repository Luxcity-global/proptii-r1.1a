import { PropertyDetails, ViewingDetails } from '../context/BookViewingContext';
import { fetchWithApiFallback } from '../../../utils/apiEndpoints';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';

const VIEWINGS_PATH = '/viewing-requests';
const SEARCH_PATH = '/search';

export const bookingService = {
  searchProperty: async (query: string): Promise<PropertyDetails> => {
    try {
      const { response } = await fetchWithApiFallback(SEARCH_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          type: 'properties'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search property');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching property:', error);
      throw error;
    }
  },

  searchPropertyListings: async (propertyUrl: string): Promise<PropertyDetails[]> => {
    try {
      const { response } = await fetchWithApiFallback(SEARCH_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: propertyUrl,
          type: 'properties'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search property listings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching property listings:', error);
      throw error;
    }
  },

  scheduleViewing: async (property: PropertyDetails, viewingDetails: ViewingDetails): Promise<void> => {
    try {
      const token = await getAccessTokenForApiRequest();
      if (!token) {
        console.warn('Skipping /viewing-requests: no auth token (dashboard uses Firestore)');
        return;
      }

      // Extract city and postcode from property if available
      // PropertyDetails may have city and postcode as optional fields
      const propertyData: any = {
        street: property.street
      };

      // Try to get city and postcode from property object
      let city = (property as any).city;
      let postcode = (property as any).postcode;

      // If city/postcode not directly available, try to extract from street
      if (!city && !postcode && property.street) {
        // Try to parse address format: "Street, City, Postcode"
        const parts = property.street.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          city = parts[parts.length - 2];
        }
        if (parts.length >= 3) {
          postcode = parts[parts.length - 1];
        }
      }

      // Only include city and postcode if they have values (since they're optional)
      if (city) {
        propertyData.city = city;
      }
      if (postcode) {
        propertyData.postcode = postcode;
      }

      const init: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property: propertyData,
          agent: {
            name: property.agent.name || 'Unknown',
            email: property.agent.email || 'unknown@example.com',
            phone: property.agent.phone?.trim() || 'N/A',
            company: property.agent.company?.trim() || 'N/A',
          },
          viewing_date: viewingDetails.date,
          viewing_time: viewingDetails.time,
          preference: viewingDetails.preference,
          whatsappNumber: viewingDetails.whatsappNumber,
          status: 'PENDING'
        })
      };

      try {
        const { response } = await fetchWithApiFallback(VIEWINGS_PATH, init);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to schedule viewing');
        }
      } catch (networkError) {
        console.error('All viewing request endpoints failed:', networkError);
        throw networkError;
      }
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