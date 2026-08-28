export interface Property {
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
  // Extended fields for BookViewing compatibility
  street?: string;
  city?: string;
  town?: string;
  postcode?: string;
  amenities?: string[];
  bathrooms?: string;
  squareFootage?: string;
  /** r1.4 government-data layer — stable listing key when present */
  listingId?: string;
  /** Optional Ordnance Survey UPRN */
  uprn?: string;
  /** Optional portal URL — preferred as listingId for the streaming report API. */
  url?: string;
  /** Scraped GPS from proptii-search (Rightmove / OnTheMarket JSON). */
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number };
  /** Optional search-grid report hint (conservation, title pending, etc.). */
  reportHint?: string;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  query: string;
  searchType: 'onthemarket' | 'internet' | 'proptii';
}
