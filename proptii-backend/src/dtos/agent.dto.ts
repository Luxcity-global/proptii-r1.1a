import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  company: string;
}

export class UpdateAgentDto extends CreateAgentDto {} 