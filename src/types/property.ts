export interface Property {
  /** Stable primary key for r1.4 facts/report (Firestore id or url hash). */
  listingId?: string;
  /** Ordnance Survey UPRN — nullable until match job resolves it. */
  uprn?: string | null;
  titleNumber?: string | null;
  /** Source listing URL when scraped. */
  url?: string;
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
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  query: string;
  searchType: 'onthemarket' | 'internet' | 'proptii';
}
