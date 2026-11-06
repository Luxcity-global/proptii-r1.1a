import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitInviteApplicationDto {
  @ApiPropertyOptional({ description: 'Referencing invite token' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({ description: 'Referencing application form data object' })
  @IsObject()
  @IsNotEmpty()
  formData!: Record<string, any>;
}

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Referencing application form data object' })
  @IsObject()
  @IsNotEmpty()
  formData!: Record<string, any>;
}

export class ClaimShareDto {
  @ApiProperty({ description: 'Passport share claim token' })
  @IsString()
  @IsNotEmpty()
  claimToken!: string;
}

export class RequestReferencingDto {
  @ApiProperty({ description: 'Tenant email address' })
  @IsString()
  @IsNotEmpty()
  tenantEmail!: string;

  @ApiPropertyOptional({ description: 'Tenant full name' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Property address' })
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @ApiPropertyOptional({ description: 'Landlord display name' })
  @IsOptional()
  @IsString()
  landlordName?: string;
}
