export interface PropertyData {
  title: string;
  price: string;
  location: string;
  bedrooms: number | null;
  bathrooms?: number | null;
  propertyType: string;
  imageUrls: string[];
  agent: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  source: string;
  url: string;
  coordinates?: { lat: number; lng: number };
}

export interface IScraper {
  name: string;
  scrape(query: string, filters: any): Promise<PropertyData[]>;
}
