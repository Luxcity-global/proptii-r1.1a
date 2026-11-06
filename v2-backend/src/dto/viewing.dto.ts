import { IsString, IsOptional, IsObject } from 'class-validator';
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
  [key: string]: any;

  @ApiPropertyOptional({ description: 'Property identifier' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Property title' })
  @IsOptional()
  @IsString()
  propertyTitle?: string;

  @ApiPropertyOptional({ description: 'Property address' })
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiPropertyOptional({ description: 'Requested viewing date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  requestedDate?: string;

  @ApiPropertyOptional({ description: 'Requested viewing time slot' })
  @IsOptional()
  @IsString()
  requestedTime?: string;

  @ApiPropertyOptional({ description: 'Viewing details object' })
  @IsOptional()
  @IsObject()
  viewingDetails?: any;
}
