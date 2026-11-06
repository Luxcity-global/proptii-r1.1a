import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncContractDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  @IsNotEmpty()
  contractId!: string;

  @ApiProperty({ description: 'Landlord email address' })
  @IsString()
  @IsNotEmpty()
  landlordEmail!: string;

  @ApiPropertyOptional({ description: 'Contract status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Tenant email address' })
  @IsOptional()
  @IsString()
  tenantEmail?: string;

  @ApiPropertyOptional({ description: 'Tenant full name' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Property address' })
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiPropertyOptional({ description: 'Document storage or download URL' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class UpdateContractStatusDto {
  @ApiProperty({ description: 'New contract status', example: 'signed' })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ description: 'ISO date string when signed' })
  @IsOptional()
  @IsString()
  signedDate?: string;

  @ApiPropertyOptional({ description: 'Signer identity (tenant | landlord)', enum: ['tenant', 'landlord'] })
  @IsOptional()
  @IsString()
  signedBy?: 'tenant' | 'landlord';
}

export class MarkContractSignedDto {
  @ApiProperty({ description: 'Signer identity (tenant | landlord)', enum: ['tenant', 'landlord'] })
  @IsString()
  @IsNotEmpty()
  signedBy!: 'tenant' | 'landlord';
}
