import { IsString, IsEmail, IsOptional, IsNotEmpty, IsDateString, IsArray, Allow, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/** Common user-identification fields used across referencing sub-forms */
export class UserIdDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

/** POST /referencing/identity */
export class SaveIdentityDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  idType?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;
}

/** POST /referencing/employment */
export class SaveEmploymentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  employerName?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  annualSalary?: string;

  @IsOptional()
  @IsEmail()
  employerEmail?: string;

  @IsOptional()
  @IsString()
  employerPhone?: string;
}

/** POST /referencing/residential */
export class SaveResidentialDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  timeAtAddress?: string;

  @IsOptional()
  @IsString()
  landlordName?: string;

  @IsOptional()
  @IsEmail()
  landlordEmail?: string;

  @IsOptional()
  @IsString()
  landlordPhone?: string;
}

/** POST /referencing/financial */
export class SaveFinancialDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  creditScore?: string;

  @IsOptional()
  @IsString()
  monthlyIncome?: string;

  @IsOptional()
  @IsString()
  monthlyOutgoings?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bankStatements?: string[];
}

/** POST /referencing/guarantor */
export class SaveGuarantorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  guarantorName?: string;

  @IsOptional()
  @IsEmail()
  guarantorEmail?: string;

  @IsOptional()
  @IsString()
  guarantorPhone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;
}

/** POST /referencing/agentDetails */
export class SaveAgentDetailsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  agentName?: string;

  @IsOptional()
  @IsEmail()
  agentEmail?: string;

  @IsOptional()
  @IsString()
  agencyName?: string;

  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsString()
  monthlyRent?: string;
}

/** POST /referencing/:userId/submit */
export class SubmitApplicationDto {
  @IsOptional()
  @IsString()
  type?: string;

  /** Full form payload from the SPA (identity, employment, files as metadata, etc.). Validated loosely — shape varies by client. */
  @IsOptional()
  @Allow()
  formData?: unknown;

  @IsOptional()
  @IsBoolean()
  isNewReference?: boolean;
}

/** POST /referencing/ai-extract */
export class AiExtractDto {
  @IsString()
  @IsNotEmpty()
  base64Data: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

/** POST /referencing/response */
export class RefereeResponseDto {
  @IsString()
  @IsNotEmpty()
  tenantEmail: string;

  @IsString()
  @IsNotEmpty()
  role: string; // 'referee' | 'guarantor'

  @IsOptional()
  response?: Record<string, unknown>;
}
