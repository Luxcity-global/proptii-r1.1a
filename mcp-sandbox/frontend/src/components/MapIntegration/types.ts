// Types for Map Integration components

export interface AreaInsightData {
  areaName: string;
  averageRent: {
    oneBedroom: number;
    twoBedroom: number;
    threeBedroom: number;
  };
  localAmenities: string[];
  transportLinks: string[];
  walkabilityScore: number;
  safetyScore: number;
  schoolScore: number;
}

export interface PropertyWithCoordinates {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  areaUnit: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromCenter: number;
}

export interface MapIntegrationSectionProps {
  searchQuery: string;
  properties: any[];
  searchLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  radiusKm: number;
  isLoading: boolean;
  onMarkerClick: (property: any) => void;
}

export interface AreaInsightPanelProps {
  areaInsights: AreaInsightData | null;
  isLoading: boolean;
  error: string | null;
}

export interface PropertyMapProps {
  properties: PropertyWithCoordinates[];
  center: { lat: number; lng: number };
  radiusKm: number;
  zoom: number;
  onMarkerClick: (property: any) => void;
  showRadiusCircle?: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MapIntegrationState {
  areaInsights: AreaInsightData | null;
  propertyCoordinates: PropertyWithCoordinates[];
  mapCenter: { lat: number; lng: number };
  radiusKm: number;
  mapZoom: number;
  selectedProperty: any | null;
  isLoading: boolean;
  error: string | null;
  showRadiusCircle: boolean;
}
