import {
  IsString,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  MaxLength,
  IsEmpty,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadRole {
  ESTATE_AGENT = 'Estate agent / letting agent',
  INDEPENDENT_LANDLORD = 'Independent landlord',
  PROPERTY_MANAGER = 'Property manager',
  PROPERTY_INVESTOR = 'Property investor',
  OTHER = 'Other',
}

export enum PropertyCount {
  ONE_TO_FIVE = '1–5',
  SIX_TO_TWENTY = '6–20',
  TWENTY_ONE_TO_FIFTY = '21–50',
  FIFTY_ONE_TO_HUNDRED = '51–100',
  OVER_HUNDRED = '100+',
}

export enum AdminHours {
  LESS_THAN_TWO = 'Less than 2 hours',
  TWO_TO_FIVE = '2–5 hours',
  FIVE_TO_TEN = '5–10 hours',
  TEN_TO_TWENTY = '10–20 hours',
  OVER_TWENTY = '20+ hours',
}

export enum BiggestGain {
  QUALIFY_APPLICANTS = 'Qualify applicants automatically',
  HANDLE_ENQUIRIES = 'Handle enquiries / viewings',
  REFERENCING_DOCS = 'Referencing and documents',
  CONTRACTS = 'Contracts in one place',
  ROUTINE_COMMS = 'Routine communication',
  MAINTENANCE = 'Maintenance tracking',
  COMPLIANCE = 'Compliance',
  SOMETHING_ELSE = 'Something else',
}

export const ALLOWED_TIME_SINKS = [
  'Chasing people (applicants, tenants, owners)',
  'Viewings and enquiries',
  'Referencing and documents',
  'Contracts and paperwork',
  'Compliance',
  'Maintenance and repairs',
  'Keeping systems and chats updated',
  'Other',
] as const;

export class CreateLeadDto {
  @ApiProperty({ enum: LeadRole, description: 'Role of the respondent' })
  @IsEnum(LeadRole)
  role: LeadRole;

  @ApiProperty({ enum: PropertyCount, description: 'Number of properties managed' })
  @IsEnum(PropertyCount)
  propertyCount: PropertyCount;

  @ApiProperty({
    type: [String],
    description: 'Top time sinks, 1–3 items',
    example: ['Chasing people (applicants, tenants, owners)', 'Contracts and paperwork'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  timeSinks: string[];

  @ApiProperty({ enum: AdminHours, description: 'Weekly admin hours wasted' })
  @IsEnum(AdminHours)
  adminHours: AdminHours;

  @ApiProperty({ enum: BiggestGain, description: 'Single biggest improvement wanted' })
  @IsEnum(BiggestGain)
  biggestGain: BiggestGain;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional free-text: most frustrating task',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  frustration?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Email captured upfront on questionnaire card 1',
    example: 'alex@propertyuk.co.uk',
  })
  @IsOptional()
  @IsString()
  email?: string;

  /** Bot honeypot — must be empty */
  @ApiPropertyOptional({ type: String, description: 'Honeypot (leave blank)' })
  @IsOptional()
  @IsEmpty()
  website?: string;
}
