import { CosmosDBService, CosmosConfig } from './CosmosDBService';

export interface PropertyReference {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  price: {
    amount: number;
    currency: string;
    type: 'sale' | 'rent';
    period?: 'monthly' | 'yearly'; // For rentals
  };
  specifications: {
    propertyType: 'apartment' | 'house' | 'commercial' | 'land';
    bedrooms?: number;
    bathrooms?: number;
    totalArea: number;
    parkingSpaces?: number;
    yearBuilt?: number;
  };
  features: string[];
  media: {
    images: {
      url: string;
      caption?: string;
      isPrimary: boolean;
    }[];
    videos?: {
      url: string;
      caption?: string;
    }[];
    virtualTour?: {
      url: string;
      provider: string;
    };
  };
  status: 'available' | 'under-contract' | 'sold' | 'rented' | 'inactive';
  agentId: string;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: number;
    searchScore?: number;
    viewCount: number;
  };
  amenities: {
    nearby: string[];
    onsite: string[];
  };
}

export class ReferenceService extends CosmosDBService {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async createReference(referenceData: Omit<PropertyReference, 'id' | 'metadata'>): Promise<PropertyReference> {
    const now = new Date().toISOString();
    const reference: PropertyReference = {
      ...referenceData,
      id: crypto.randomUUID(),
      metadata: {
        createdAt: now,
        lastUpdated: now,
        version: 1,
        viewCount: 0
      }
    };

    return this.create(this.getReferencesContainer(), reference);
  }

  async getReferenceById(id: string): Promise<PropertyReference | undefined> {
    return this.read<PropertyReference>(this.getReferencesContainer(), id, id);
  }

  async updateReference(
    id: string,
    updates: Partial<Omit<PropertyReference, 'id' | 'metadata'>>
  ): Promise<PropertyReference> {
    const now = new Date().toISOString();
    const reference = await this.getReferenceById(id);
    
    if (!reference) {
      throw new Error(`Reference with id ${id} not found`);
    }

    const updatedReference: PropertyReference = {
      ...reference,
      ...updates,
      metadata: {
        ...reference.metadata,
        lastUpdated: now,
        version: reference.metadata.version + 1
      }
    };

    return this.update<PropertyReference>(
      this.getReferencesContainer(),
      id,
      id,
      updatedReference
    );
  }

  async deleteReference(id: string): Promise<void> {
    return this.delete(this.getReferencesContainer(), id, id);
  }

  async searchReferences(
    filters: {
      propertyType?: PropertyReference['specifications']['propertyType'][];
      priceRange?: { min?: number; max?: number };
      location?: { city?: string; state?: string };
      status?: PropertyReference['status'];
      bedrooms?: number;
      bathrooms?: number;
    },
    sort?: {
      field: 'price' | 'createdAt' | 'viewCount';
      order: 'asc' | 'desc';
    }
  ): Promise<PropertyReference[]> {
    let query = "SELECT * FROM c WHERE 1=1";
    const parameters: { name: string; value: any }[] = [];

    if (filters.propertyType?.length) {
      query += " AND c.specifications.propertyType IN (@propertyTypes)";
      parameters.push({ name: "@propertyTypes", value: filters.propertyType });
    }

    if (filters.priceRange?.min !== undefined) {
      query += " AND c.price.amount >= @minPrice";
      parameters.push({ name: "@minPrice", value: filters.priceRange.min });
    }

    if (filters.priceRange?.max !== undefined) {
      query += " AND c.price.amount <= @maxPrice";
      parameters.push({ name: "@maxPrice", value: filters.priceRange.max });
    }

    if (filters.location?.city) {
      query += " AND c.address.city = @city";
      parameters.push({ name: "@city", value: filters.location.city });
    }

    if (filters.location?.state) {
      query += " AND c.address.state = @state";
      parameters.push({ name: "@state", value: filters.location.state });
    }

    if (filters.status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: filters.status });
    }

    if (filters.bedrooms !== undefined) {
      query += " AND c.specifications.bedrooms >= @bedrooms";
      parameters.push({ name: "@bedrooms", value: filters.bedrooms });
    }

    if (filters.bathrooms !== undefined) {
      query += " AND c.specifications.bathrooms >= @bathrooms";
      parameters.push({ name: "@bathrooms", value: filters.bathrooms });
    }

    if (sort) {
      const sortField = sort.field === 'createdAt' 
        ? 'c.metadata.createdAt' 
        : sort.field === 'viewCount'
        ? 'c.metadata.viewCount'
        : 'c.price.amount';
      
      query += ` ORDER BY ${sortField} ${sort.order.toUpperCase()}`;
    }

    return this.query<PropertyReference>(
      this.getReferencesContainer(),
      query,
      parameters
    );
  }

  async incrementViewCount(id: string): Promise<PropertyReference> {
    const reference = await this.getReferenceById(id);
    
    if (!reference) {
      throw new Error(`Reference with id ${id} not found`);
    }

    const updatedReference: PropertyReference = {
      ...reference,
      metadata: {
        ...reference.metadata,
        viewCount: reference.metadata.viewCount + 1,
        lastUpdated: new Date().toISOString()
      }
    };

    return this.update<PropertyReference>(
      this.getReferencesContainer(),
      id,
      id,
      updatedReference
    );
  }

  async getReferencesForAgent(agentId: string): Promise<PropertyReference[]> {
    const query = "SELECT * FROM c WHERE c.agentId = @agentId";
    const parameters = [{ name: "@agentId", value: agentId }];
    
    return this.query<PropertyReference>(
      this.getReferencesContainer(),
      query,
      parameters
    );
  }
} 