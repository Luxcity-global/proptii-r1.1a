import { Allow, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateViewingStatusDto {
  @ApiProperty({ description: 'New status of viewing', example: 'confirmed' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Optional agent notes' })
  @IsOptional()
  @IsString()
  agentNotes?: string;

  @ApiPropertyOptional({ description: 'Updated viewing details' })
  @IsOptional()
  @IsObject()
  viewingDetails?: any;
}

export class CreateViewingDto {
  @ApiPropertyOptional({ description: 'Authenticated user / tenant identifier' })
  @IsOptional()
  @IsString()
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Property identifier' })
  @IsOptional()
  @IsString()
  propertyId?: string | null;

  @ApiPropertyOptional({ description: 'Landlord identifier' })
  @IsOptional()
  @IsString()
  landlordId?: string | null;

  @ApiPropertyOptional({ description: 'Agent identifier' })
  @IsOptional()
  @IsString()
  agentId?: string | null;

  @ApiPropertyOptional({ description: 'Agent contact email' })
  @IsOptional()
  @IsString()
  agentEmail?: string | null;

  @ApiPropertyOptional({ description: 'Landlord contact email' })
  @IsOptional()
  @IsString()
  landlordEmail?: string | null;

  @ApiPropertyOptional({ description: 'Tenant identifier' })
  @IsOptional()
  @IsString()
  tenantId?: string | null;

  @ApiPropertyOptional({ description: 'Tenant / applicant email' })
  @IsOptional()
  @IsString()
  tenantEmail?: string | null;

  @ApiPropertyOptional({ description: 'Tenant / applicant full name' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Applicant full name alias' })
  @IsOptional()
  @IsString()
  applicantName?: string;

  @ApiPropertyOptional({ description: 'Tenant / applicant phone number' })
  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @ApiPropertyOptional({ description: 'Property title' })
  @IsOptional()
  @IsString()
  propertyTitle?: string;

  @ApiPropertyOptional({ description: 'Property address' })
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiPropertyOptional({ description: 'Fallback property address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Denormalized property price' })
  @IsOptional()
  @Allow()
  propertyPrice?: number | string | null;

  @ApiPropertyOptional({ description: 'Fallback property price' })
  @IsOptional()
  @Allow()
  price?: number | string | null;

  @ApiPropertyOptional({ description: 'Denormalized property photo URL' })
  @IsOptional()
  @IsString()
  propertyPhoto?: string;

  @ApiPropertyOptional({ description: 'Fallback photo URL' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ description: 'Fallback image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Requested viewing date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  requestedDate?: string;

  @ApiPropertyOptional({ description: 'Requested viewing time slot' })
  @IsOptional()
  @IsString()
  requestedTime?: string;

  @ApiPropertyOptional({ description: 'Notes for the agent or landlord' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Optional agent notes' })
  @IsOptional()
  @IsString()
  agentNotes?: string;

  @ApiPropertyOptional({ description: 'Initial viewing status (e.g. pending, requested)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Embedded property and agent summary object' })
  @IsOptional()
  @IsObject()
  property?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Legacy agent summary object' })
  @IsOptional()
  @IsObject()
  agent?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Viewing details object' })
  @IsOptional()
  @IsObject()
  viewingDetails?: any;

  @ApiPropertyOptional({ description: 'Legacy applicant details object' })
  @IsOptional()
  @IsObject()
  userDetails?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Legacy viewing date field' })
  @IsOptional()
  @IsString()
  viewing_date?: string;

  @ApiPropertyOptional({ description: 'Legacy viewing time field' })
  @IsOptional()
  @IsString()
  viewing_time?: string;

  @ApiPropertyOptional({ description: 'Legacy viewing preference field' })
  @IsOptional()
  @IsString()
  preference?: string;

  @ApiPropertyOptional({ description: 'Applicant WhatsApp number' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
