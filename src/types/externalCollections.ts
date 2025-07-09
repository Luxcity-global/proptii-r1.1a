/**
 * External Collections Types
 * Defines the data structures for the external collections feature
 */

export interface ExternalCollectedProperty {
  id: string;
  source: 'rightmove' | 'zoopla' | 'openrent' | 'onthemarket' | 'mock';
  title: string;
  price: {
    amount: number;
    currency: string;
    type: 'rent' | 'sale';
    period?: 'monthly' | 'yearly';
    display: string;
  };
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates?: [number, number];
    area?: string;
  };
  specifications: {
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    totalArea?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
  };
  features: string[];
  description: string;
  images: {
    src: string;
    alt: string;
    isPrimary: boolean;
  }[];
  agent: {
    name: string;
    company: string;
    phone?: string;
    email?: string;
    photo?: string;
  };
  amenities: {
    nearby: string[];
    onsite: string[];
  };
  status: 'available' | 'under-offer' | 'sold' | 'rented' | 'inactive';
  metadata: {
    createdAt: string;
    lastUpdated: string;
    searchScore: number;
    viewCount: number;
    testEnvironment: boolean;
  };
  contactUrl?: string;
  propertyUrl?: string;
}

export interface ExternalCollectionsSearchRequest {
  query: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  propertyType?: string[];
  bedrooms?: number;
  type?: 'rent' | 'sale';
  features?: string[];
}

export interface ExternalCollectionsSearchResponse {
  properties: ExternalCollectedProperty[];
  totalCount: number;
  searchQuery: string;
  searchTimestamp: string;
  sources: string[];
  relevanceScore: number;
}

export interface ExternalCollectionsAgentContactRequest {
  propertyId: string;
  agentId: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
  };
  preferredContactMethod: 'email' | 'phone' | 'both';
}

export interface ExternalCollectionsAgentContactResponse {
  success: boolean;
  message: string;
  contactId?: string;
  estimatedResponseTime?: string;
}

export interface ExternalCollectionsAnalytics {
  searchCount: number;
  propertyViews: number;
  contactRequests: number;
  conversionRate: number;
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
  topSources: Array<{
    source: string;
    count: number;
  }>;
  averageResponseTime: number;
}

export interface ExternalCollectionsTestData {
  mockProperties: ExternalCollectedProperty[];
  searchHistory: Array<{
    query: string;
    timestamp: string;
    resultCount: number;
  }>;
  contactHistory: Array<{
    propertyId: string;
    timestamp: string;
    status: 'pending' | 'contacted' | 'viewing-arranged';
  }>;
} 