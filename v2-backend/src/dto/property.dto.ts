import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsString()
  @IsNotEmpty()
  postcode: string;

  @ApiProperty({ example: 2500, description: 'Monthly rent amount (positive number)' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'rentAmount / price must be a positive number' })
  price: number;

  @ApiPropertyOptional({ example: 2500, description: 'Alias for price' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'rentAmount must be a positive number' })
  @IsOptional()
  rentAmount?: number;

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

  @ApiPropertyOptional({ example: ['https://example.com/photo1.jpg'], description: 'Photos array' })
  @IsArray()
  @IsOptional()
  photos?: any[];

  @ApiPropertyOptional({ example: 'vacant', enum: ['vacant', 'occupied', 'under_offer', 'archived'] })
  @IsString()
  @IsOptional()
  @IsIn(['vacant', 'occupied', 'under_offer', 'archived'])
  status?: string;

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
  @IsString()
  @IsOptional()
  postcode?: string;

  @ApiPropertyOptional({ example: 2600 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 2600 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  rentAmount?: number;

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

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  photos?: any[];

  @ApiPropertyOptional({ enum: ['vacant', 'occupied', 'under_offer', 'archived'] })
  @IsString()
  @IsOptional()
  @IsIn(['vacant', 'occupied', 'under_offer', 'archived'])
  status?: string;

  @ApiPropertyOptional({ example: '100023336956' })
  @IsString()
  @IsOptional()
  uprn?: string;
}
