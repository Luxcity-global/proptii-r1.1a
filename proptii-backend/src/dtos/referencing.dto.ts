import { IsString, IsEmail, IsOptional, IsNotEmpty, IsDateString, IsArray, Allow, IsBoolean, ValidateIf } from 'class-validator';

/** Skip string validators when the client sends "" for an unfilled optional field. */
const hasText = (_: unknown, value: unknown) => typeof value === 'string' && value.trim().length > 0;

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
  @ValidateIf(hasText)
  @IsEmail()
  email?: string;

  /** SPA field name */
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /** Legacy alias */
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  dateOfBirthError?: string;

  @IsOptional()
  @IsBoolean()
  isBritish?: boolean;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @Allow()
  identityProof?: unknown;

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
  companyDetails?: string;

  @IsOptional()
  @IsString()
  lengthOfEmployment?: string;

  @IsOptional()
  @IsString()
  jobPosition?: string;

  @IsOptional()
  @IsString()
  referenceFullName?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsEmail()
  referenceEmail?: string;

  @IsOptional()
  @IsString()
  referencePhone?: string;

  @IsOptional()
  @IsString()
  proofType?: string;

  @IsOptional()
  @Allow()
  proofDocument?: unknown;

  /** Legacy aliases */
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
  @ValidateIf(hasText)
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
  durationAtCurrentAddress?: string;

  @IsOptional()
  @IsString()
  previousAddress?: string;

  @IsOptional()
  @IsString()
  durationAtPreviousAddress?: string;

  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @IsOptional()
  @IsString()
  alreadyHavePropertyAddress?: string;

  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsString()
  proofType?: string;

  @IsOptional()
  @Allow()
  proofDocument?: unknown;

  /** Legacy aliases */
  @IsOptional()
  @IsString()
  timeAtAddress?: string;

  @IsOptional()
  @IsString()
  landlordName?: string;

  @IsOptional()
  @ValidateIf(hasText)
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
  monthlyIncome?: string;

  @IsOptional()
  @IsString()
  proofOfIncomeType?: string;

  @IsOptional()
  @Allow()
  proofOfIncomeDocument?: unknown;

  @IsOptional()
  @IsBoolean()
  useOpenBanking?: boolean;

  @IsOptional()
  @IsBoolean()
  isConnectedToOpenBanking?: boolean;

  /** Legacy aliases */
  @IsOptional()
  @IsString()
  creditScore?: string;

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
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Allow()
  identityDocument?: unknown;

  /** Legacy aliases */
  @IsOptional()
  @IsString()
  guarantorName?: string;

  @IsOptional()
  @ValidateIf(hasText)
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
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  hasAgreedToCheck?: boolean;

  /** Legacy aliases */
  @IsOptional()
  @IsString()
  agentName?: string;

  @IsOptional()
  @ValidateIf(hasText)
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
