import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  town?: string;

  @IsNotEmpty()
  @IsString()
  postcode: string;
}

export class UpdatePropertyDto extends CreatePropertyDto {} 