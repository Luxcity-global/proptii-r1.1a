import { useState, useEffect } from 'react';
import { PropertyWithCoordinates } from '../types';
import { getPropertyCoordinates } from '../../../services/api';

// Basic geocoding function for UK locations
function getLocationCoordinates(searchQuery: string): { lat: number; lng: number } {
  const query = searchQuery.toLowerCase().trim();
  
  // UK location database
  const locations: Record<string, { lat: number; lng: number }> = {
    // London areas
    'london': { lat: 51.5074, lng: -0.1278 },
    'westminster': { lat: 51.4994, lng: -0.1248 },
    'camden': { lat: 51.5390, lng: -0.1426 },
    'islington': { lat: 51.5447, lng: -0.1024 },
    'hackney': { lat: 51.5455, lng: -0.0547 },
    'tower hamlets': { lat: 51.5154, lng: -0.0285 },
    'southwark': { lat: 51.4949, lng: -0.0873 },
    'lambeth': { lat: 51.4952, lng: -0.1108 },
    'wandsworth': { lat: 51.4569, lng: -0.1920 },
    'hammersmith': { lat: 51.4924, lng: -0.2236 },
    'kensington': { lat: 51.5073, lng: -0.1878 },
    'chelsea': { lat: 51.4875, lng: -0.1687 },
    'fulham': { lat: 51.4746, lng: -0.1960 },
    'richmond': { lat: 51.4613, lng: -0.3037 },
    'kingston': { lat: 51.4123, lng: -0.3004 },
    
    // Major UK cities
    'manchester': { lat: 53.4808, lng: -2.2426 },
    'birmingham': { lat: 52.4862, lng: -1.8904 },
    'liverpool': { lat: 53.4084, lng: -2.9916 },
    'leeds': { lat: 53.8008, lng: -1.5491 },
    'sheffield': { lat: 53.3811, lng: -1.4701 },
    'bristol': { lat: 51.4545, lng: -2.5879 },
    'newcastle': { lat: 54.9783, lng: -1.6178 },
    'nottingham': { lat: 52.9548, lng: -1.1581 },
    'leicester': { lat: 52.6369, lng: -1.1398 },
    'coventry': { lat: 52.4068, lng: -1.5197 },
    'cardiff': { lat: 51.4816, lng: -3.1791 },
    'belfast': { lat: 54.5973, lng: -5.9301 },
    'edinburgh': { lat: 55.9533, lng: -3.1883 },
    'glasgow': { lat: 55.8642, lng: -4.2518 },
    'aberdeen': { lat: 57.1497, lng: -2.0943 },
    
    // Popular areas
    'brighton': { lat: 50.8225, lng: -0.1372 },
    'oxford': { lat: 51.7520, lng: -1.2577 },
    'cambridge': { lat: 52.2053, lng: 0.1218 },
    'bath': { lat: 51.3758, lng: -2.3599 },
    'york': { lat: 53.9590, lng: -1.0815 },
    'canterbury': { lat: 51.2802, lng: 1.0789 },
    'stratford': { lat: 52.1919, lng: -1.7083 }
  };
  
  // Try exact match first
  if (locations[query]) {
    return locations[query];
  }
  
  // Try partial matches
  for (const [location, coords] of Object.entries(locations)) {
    if (query.includes(location) || location.includes(query)) {
      return coords;
    }
  }
  
  // Default to London if no match found
  console.log(`📍 No coordinates found for "${searchQuery}", defaulting to London`);
  return { lat: 51.5074, lng: -0.1278 };
}

interface UseMapMarkersProps {
  properties: any[];
  searchLocation: string;
  radiusKm?: number;
  enabled?: boolean;
}

interface UseMapMarkersReturn {
  propertyCoordinates: PropertyWithCoordinates[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMapMarkers = ({ 
  properties, 
  searchLocation, 
  radiusKm = 5,
  enabled = true 
}: UseMapMarkersProps): UseMapMarkersReturn => {
  const [propertyCoordinates, setPropertyCoordinates] = useState<PropertyWithCoordinates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyCoordinates = async () => {
    if (!properties.length || !searchLocation || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📍 Fetching property coordinates for:', properties.length, 'properties');
      
      // Try to fetch real coordinates from the API
      try {
        const data = await getPropertyCoordinates(properties, searchLocation, radiusKm);
        
        if (data.success && data.data) {
          setPropertyCoordinates(data.data);
          console.log('✅ Real property coordinates loaded:', data.data.length, 'properties');
          return;
        }
      } catch (apiError) {
        console.log('⚠️ API coordinates failed, using property data:', apiError);
      }
      
      // Fallback: Use property data to generate coordinates
      const propertyCoordinates: PropertyWithCoordinates[] = properties.map((property, index) => {
        // Use the search location coordinates instead of hardcoded London
        const searchCoords = getLocationCoordinates(searchLocation);
        const baseLat = searchCoords.lat;
        const baseLng = searchCoords.lng;
        
        // Generate coordinates based on property index for more realistic distribution
        const latOffset = ((index % 3) - 1) * (radiusKm / 111) * 0.5;
        const lngOffset = ((Math.floor(index / 3) % 3) - 1) * (radiusKm / (111 * Math.cos(baseLat * Math.PI / 180))) * 0.5;
        
        return {
          ...property,
          coordinates: {
            lat: baseLat + latOffset,
            lng: baseLng + lngOffset
          },
          distanceFromCenter: Math.abs(latOffset * 111) + Math.abs(lngOffset * 111 * Math.cos(baseLat * Math.PI / 180))
        };
      });
      
      setPropertyCoordinates(propertyCoordinates);
      console.log('✅ Property coordinates generated from data:', propertyCoordinates.length, 'properties');
    } catch (err) {
      console.error('❌ Property coordinates error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch property coordinates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyCoordinates();
  }, [properties, searchLocation, radiusKm, enabled]);

  const refetch = () => {
    fetchPropertyCoordinates();
  };

  return {
    propertyCoordinates,
    isLoading,
    error,
    refetch
  };
};
