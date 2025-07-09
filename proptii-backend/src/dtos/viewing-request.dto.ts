import { IsNotEmpty, IsString, IsDate, IsIn, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PropertyDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  town: string;

  @IsNotEmpty()
  @IsString()
  postcode: string;
}

class AgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  company: string;
}

export class CreateViewingRequestDto {
  @ValidateNested()
  @Type(() => PropertyDto)
  property: PropertyDto;

  @ValidateNested()
  @Type(() => AgentDto)
  agent: AgentDto;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  viewing_date: Date;

  @IsNotEmpty()
  @IsString()
  viewing_time: string;

  @IsNotEmpty()
  @IsString()
  preference: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED'])
  status: string;
}

export class UpdateViewingRequestDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED'])
  status: string;
} 