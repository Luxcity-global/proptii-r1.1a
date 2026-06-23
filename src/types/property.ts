export interface Property {
  /** MongoDB _id or scraped property URL used as a stable identifier */
  id?: string;
  /** Source URL for scraped properties — doubles as the stable property ID */
  url?: string;
  /** Landlord user ID. Present for native properties; absent/undefined for scraped. */
  landlordId?: string;
  title: string;
  price: string;
  location: string;
  /** Bedrooms count — string from scraper, number from native API */
  bedrooms: string | number;
  /** Bathrooms count — string from scraper, number from native API */
  bathrooms?: string | number;
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
  // Extended fields
  street?: string;
  city?: string;
  town?: string;
  postcode?: string;
  amenities?: string[];
  squareFootage?: string;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  query: string;
  searchType: 'onthemarket' | 'internet' | 'proptii';
}
