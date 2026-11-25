import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  IsIn,
} from 'class-validator';
import { Type, Transform, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Modern 2-Bed Luxury Apartment', description: 'Listing title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '10 Downing Street', description: 'Street address (required)' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'London', description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'SW1A 2AA', description: 'UK Postcode (required)' })
  @Expose()
  @Transform(({ obj, value }) => {
    if (value && typeof value === 'string' && value.trim()) return value.trim();
    if (obj?.address && typeof obj.address === 'string') {
      const match = obj.address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
      if (match) return match[1];
      return 'SW1A 1AA';
    }
    return value;
  })
  @IsString()
  @IsNotEmpty()
  postcode: string;

  @ApiProperty({ example: 2500, description: 'Monthly rent amount (positive number)' })
  @Transform(({ obj, value }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(cleaned)) return cleaned;
    }
    if (typeof obj?.rent === 'number') return obj.rent;
    if (typeof obj?.rent === 'string') {
      const cleaned = parseFloat(String(obj.rent).replace(/[^0-9.-]/g, ''));
      if (!isNaN(cleaned)) return cleaned;
    }
    if (typeof obj?.rentAmount === 'number') return obj.rentAmount;
    if (typeof obj?.rentAmount === 'string') {
      const cleaned = parseFloat(String(obj.rentAmount).replace(/[^0-9.-]/g, ''));
      if (!isNaN(cleaned)) return cleaned;
    }
    return value;
  })
  @IsNumber()
  @IsPositive({ message: 'rentAmount / price must be a positive number' })
  price: number;

  @ApiPropertyOptional({ example: 2500, description: 'Alias for price' })
  @Transform(({ obj, value }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(cleaned)) return cleaned;
    }
    if (typeof obj?.price === 'number') return obj.price;
    if (typeof obj?.rent === 'number') return obj.rent;
    return value;
  })
  @IsNumber()
  @IsPositive({ message: 'rentAmount must be a positive number' })
  @IsOptional()
  rentAmount?: number;

  @ApiPropertyOptional({ example: 2500, description: 'Alias for rent' })
  @IsOptional()
  rent?: any;

  @ApiPropertyOptional({ example: 'Flat', description: 'Alias for propertyType' })
  @IsOptional()
  type?: any;

  @ApiPropertyOptional({ description: 'Property documents' })
  @IsOptional()
  @IsArray()
  documents?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  archived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  property?: any;

  @ApiPropertyOptional({ example: 2, description: 'Number of bedrooms' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2, description: 'Number of bathrooms' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 'Flat', description: 'Property type' })
  @IsString()
  @IsOptional()
  propertyType?: string;

  @ApiPropertyOptional({ example: 'Spacious apartment close to transport', description: 'Property description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Spacious apartment close to transport', description: 'Notes alias' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 850, description: 'Square footage' })
  @IsOptional()
  squareFootage?: number | string;

  @ApiPropertyOptional({ example: ['Balcony', 'Concierge', 'Gym'], description: 'Property amenities' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Structured amenity selections with optional access/cost metadata',
  })
  @IsArray()
  @IsOptional()
  amenityDetails?: Array<{
    amenityId: string;
    accessType?: 'private' | 'shared' | 'communal';
    additionalCost?: boolean;
    notes?: string;
  }>;

  @ApiPropertyOptional({ description: 'Free-text additional features not in the catalogue' })
  @IsString()
  @IsOptional()
  additionalFeatures?: string;

  @ApiPropertyOptional({
    description: 'UK property classification (category / type group / subtype)',
  })
  @IsOptional()
  propertyClassification?: {
    categoryId: string;
    typeGroupId: string;
    subtypeId: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  receptionRooms?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floorNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  constructionType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  epcRating?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  propertyUse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  numberOfFloors?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buildingSpecification?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  permittedUse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  businessRates?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landArea?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planningStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landAccess?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landUtilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  boundaries?: string;

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'], description: 'Photos array' })
  @IsArray()
  @IsOptional()
  photos?: any[];

  @ApiPropertyOptional({
    example: 'vacant',
    enum: ['vacant', 'occupied', 'under_offer', 'under-renovation', 'draft', 'archived'],
    description: 'Listing lifecycle status. draft is non-searchable (C1 soft gate allows draft saves).',
  })
  @IsString()
  @IsOptional()
  @IsIn(['vacant', 'occupied', 'under_offer', 'under-renovation', 'draft', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    example: 'private',
    enum: ['private', 'public'],
    description: 'C2 search visibility. New listings default to private; public vacant listings appear in tenant search.',
  })
  @IsString()
  @IsOptional()
  @IsIn(['private', 'public'])
  listingVisibility?: 'private' | 'public';

  @ApiPropertyOptional({
    example: true,
    description: 'True after the listing has been published at least once (keeps visibility toggle UI when later hidden).',
  })
  @IsBoolean()
  @IsOptional()
  listingEverPublished?: boolean;

  @ApiPropertyOptional({
    example: 'yes',
    enum: ['yes', 'no'],
    description: 'Whether the landlord will take a tenancy deposit (listing commitment).',
  })
  @IsString()
  @IsOptional()
  @IsIn(['yes', 'no'])
  takesDeposit?: 'yes' | 'no';

  @ApiPropertyOptional({ example: '1500', description: 'Deposit amount in GBP when takesDeposit is yes' })
  @IsOptional()
  depositAmount?: string | number;

  @ApiPropertyOptional({
    example: true,
    description: 'Landlord confirms deposit will be protected in an approved scheme',
  })
  @IsBoolean()
  @IsOptional()
  depositProtectionConfirmed?: boolean;

  @ApiPropertyOptional({
    example: 'landlord',
    enum: ['landlord', 'agent'],
    description: 'Who will protect the deposit (optional)',
  })
  @IsString()
  @IsOptional()
  @IsIn(['landlord', 'agent'])
  depositProtectedBy?: 'landlord' | 'agent';

  @ApiPropertyOptional({ example: '100023336956', description: 'Unique Property Reference Number (UPRN)' })
  @IsString()
  @IsOptional()
  uprn?: string;

  @ApiPropertyOptional({ example: 'agent_user_id_123', description: 'Agent ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'agent_user_id_123', description: 'Landlord ID' })
  @IsString()
  @IsOptional()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Agent name' })
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiPropertyOptional({ example: 'info@agency.com', description: 'Owner email' })
  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: '+442079460912', description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Luxcity Properties', description: 'Agent company' })
  @IsString()
  @IsOptional()
  agentCompany?: string;

  @ApiPropertyOptional({ example: 75, description: 'Default risk score' })
  @IsOptional()
  @IsNumber()
  defaultRiskScore?: number;

  @ApiPropertyOptional({ description: 'Attached tenant details' })
  @IsOptional()
  tenant?: any;

  @ApiPropertyOptional({ example: 'tenant_123', description: 'Attached tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Pending tenants awaiting assignment' })
  @IsOptional()
  @IsArray()
  pendingTenants?: any[];
}

export class UpdatePropertyDto {
  @ApiPropertyOptional({ example: 'Updated Listing Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '10 Downing Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SW1A 2AA' })
  @Transform(({ obj, value }) => {
    if (value && typeof value === 'string' && value.trim()) return value.trim();
    if (obj?.address && typeof obj.address === 'string') {
      const match = obj.address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
      if (match) return match[1];
    }
    return value;
  })
  @IsString()
  @IsOptional()
  postcode?: string;

  @ApiPropertyOptional({ example: 2600 })
  @Transform(({ obj, value }) => {
    if (typeof value === 'number' && !isNaN(value)) return Math.max(0, value);
    if (typeof value === 'string') {
      const cleaned = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!isNaN(cleaned)) return Math.max(0, cleaned);
    }
    if (typeof obj?.rent === 'number' && !isNaN(obj.rent)) return Math.max(0, obj.rent);
    if (typeof obj?.rent === 'string') {
      const cleaned = parseFloat(String(obj.rent).replace(/[^0-9.]/g, ''));
      if (!isNaN(cleaned)) return Math.max(0, cleaned);
    }
    return value;
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 2600 })
  @Transform(({ obj, value }) => {
    if (typeof value === 'number' && !isNaN(value)) return Math.max(0, value);
    if (typeof value === 'string') {
      const cleaned = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!isNaN(cleaned)) return Math.max(0, cleaned);
    }
    if (typeof obj?.price === 'number' && !isNaN(obj.price)) return Math.max(0, obj.price);
    if (typeof obj?.rent === 'number' && !isNaN(obj.rent)) return Math.max(0, obj.rent);
    return value;
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  rent?: any;

  @ApiPropertyOptional({ example: 'Flat' })
  @IsOptional()
  type?: any;

  @ApiPropertyOptional({ description: 'Property documents' })
  @IsOptional()
  @IsArray()
  documents?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  archived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  property?: any;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 'Flat' })
  @IsString()
  @IsOptional()
  propertyType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  squareFootage?: number | string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Structured amenity selections with optional access/cost metadata',
  })
  @IsArray()
  @IsOptional()
  amenityDetails?: Array<{
    amenityId: string;
    accessType?: 'private' | 'shared' | 'communal';
    additionalCost?: boolean;
    notes?: string;
  }>;

  @ApiPropertyOptional({ description: 'Free-text additional features not in the catalogue' })
  @IsString()
  @IsOptional()
  additionalFeatures?: string;

  @ApiPropertyOptional({
    description: 'UK property classification (category / type group / subtype)',
  })
  @IsOptional()
  propertyClassification?: {
    categoryId: string;
    typeGroupId: string;
    subtypeId: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  receptionRooms?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floorNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  constructionType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  epcRating?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  propertyUse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  numberOfFloors?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buildingSpecification?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  permittedUse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  businessRates?: number | string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landArea?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planningStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landAccess?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landUtilities?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  boundaries?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  photos?: any[];

  @ApiPropertyOptional({
    enum: ['vacant', 'occupied', 'under_offer', 'under-renovation', 'draft', 'archived'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['vacant', 'occupied', 'under_offer', 'under-renovation', 'draft', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    example: 'private',
    enum: ['private', 'public'],
    description: 'C2 search visibility toggle for tenant property searches.',
  })
  @IsString()
  @IsOptional()
  @IsIn(['private', 'public'])
  listingVisibility?: 'private' | 'public';

  @ApiPropertyOptional({
    example: true,
    description: 'True after the listing has been published at least once.',
  })
  @IsBoolean()
  @IsOptional()
  listingEverPublished?: boolean;

  @ApiPropertyOptional({ example: 'yes', enum: ['yes', 'no'] })
  @IsString()
  @IsOptional()
  @IsIn(['yes', 'no'])
  takesDeposit?: 'yes' | 'no';

  @ApiPropertyOptional({ example: '1500' })
  @IsOptional()
  depositAmount?: string | number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  depositProtectionConfirmed?: boolean;

  @ApiPropertyOptional({ example: 'landlord', enum: ['landlord', 'agent'] })
  @IsString()
  @IsOptional()
  @IsIn(['landlord', 'agent'])
  depositProtectedBy?: 'landlord' | 'agent';

  @ApiPropertyOptional({ example: '100023336956' })
  @IsString()
  @IsOptional()
  uprn?: string;

  @ApiPropertyOptional({ example: 'agent_user_id_123', description: 'Agent ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'agent_user_id_123', description: 'Landlord ID' })
  @IsString()
  @IsOptional()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Agent name' })
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiPropertyOptional({ example: 'info@agency.com', description: 'Owner email' })
  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: '+442079460912', description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Luxcity Properties', description: 'Agent company' })
  @IsString()
  @IsOptional()
  agentCompany?: string;

  @ApiPropertyOptional({ example: 75, description: 'Default risk score' })
  @IsOptional()
  @IsNumber()
  defaultRiskScore?: number;

  @ApiPropertyOptional({ description: 'Attached tenant details' })
  @IsOptional()
  tenant?: any;

  @ApiPropertyOptional({ example: 'tenant_123', description: 'Attached tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Pending tenants awaiting assignment' })
  @IsOptional()
  @IsArray()
  pendingTenants?: any[];
}
