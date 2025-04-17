import { useBookViewing } from '../context/BookViewingContext';
import { bookingService } from '../services/bookingService';

const RIGHTMOVE_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?rightmove\.co\.uk\/(property-for-sale|property-to-rent|properties|find).*$/;
const ZOOPLA_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?zoopla\.co\.uk\/(for-sale|to-rent)\/.*$/;
const OPENRENT_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?openrent\.co\.uk\/properties-to-rent\/.*$/;

export function usePropertySearch() {
  const { dispatch } = useBookViewing();

  const searchProperty = async (propertyUrl: string) => {
    try {
      // Validate URL format
      const isValidUrl = 
        RIGHTMOVE_SEARCH_URL_PATTERN.test(propertyUrl) ||
        ZOOPLA_SEARCH_URL_PATTERN.test(propertyUrl) ||
        OPENRENT_SEARCH_URL_PATTERN.test(propertyUrl);

      if (!propertyUrl || !isValidUrl) {
        throw new Error('Invalid URL format. Please provide a valid Rightmove, Zoopla, or OpenRent search URL.');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous errors
      
      const properties = await bookingService.searchPropertyListings(propertyUrl);
      dispatch({ type: 'SET_PROPERTY_RESULTS', payload: properties });
    } catch (error) {
      console.error('Property search error:', error);
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return { searchProperty };
} 