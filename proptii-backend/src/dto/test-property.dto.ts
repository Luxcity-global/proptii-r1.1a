import { IsString, IsNumber, IsOptional, Min, Max, Length, IsIn } from 'class-validator';

export class TestPropertyDto {
  @IsString()
  @Length(3, 255)
  title: string;

  @IsString()
  @Length(10, 1000)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(1000000000)
  price: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  bedrooms: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  bathrooms: number;

  @IsString()
  @Length(3, 255)
  street: string;

  @IsString()
  @Length(2, 100)
  city: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  town?: string;

  @IsString()
  @Length(5, 10)
  postcode: string;

  @IsString()
  @IsIn(['available', 'sold', 'pending', 'off_market'])
  status: string;

  @IsString()
  @Length(1, 50)
  agentId: string;
} 