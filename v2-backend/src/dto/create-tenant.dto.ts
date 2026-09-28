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
  @ApiProperty() @IsString() @IsNotEmpty() phone: string;
  @ApiProperty() @IsString() @IsNotEmpty() propertyId: string;
  @ApiProperty() @IsNumber() @Min(0) rentAmount: number;
  @ApiProperty() @IsString() @IsNotEmpty() leaseStart: string;
  @ApiProperty() @IsString() @IsNotEmpty() leaseEnd: string;

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
}
