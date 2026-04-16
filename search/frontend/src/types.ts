export interface Property {
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  imageUrls: string[];
  description?: string;
  agent: {
    name: string;
    email: string; // Now required for strict filtering
    phone?: string;
    website?: string;
  };
  source: string;
  url: string;
}