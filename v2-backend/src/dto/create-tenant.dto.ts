import { IsString, IsNotEmpty, IsEmail, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationship?: string;
}

export class CreateTenantDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() @IsNotEmpty() propertyId: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) rentAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() leaseStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leaseEnd?: string;

  // Optional fields — present for manual add, absent for invite flow
  @ApiPropertyOptional() @IsOptional() @IsString() propertyAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentFrequency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() firstPaymentDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referencingStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentStatus?: string;
  @ApiPropertyOptional() @IsOptional() emergencyContact?: EmergencyContactDto;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() annualIncome?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;

  @ApiPropertyOptional({ example: 75, description: 'Default risk score' })
  @IsOptional()
  @IsNumber()
  defaultRiskScore?: number;

  @ApiPropertyOptional({ example: 'user_123', description: 'Owner User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'landlord_123' })
  @IsOptional()
  @IsString()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'agent_123' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastPaymentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overdueAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paymentIntervalDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}
