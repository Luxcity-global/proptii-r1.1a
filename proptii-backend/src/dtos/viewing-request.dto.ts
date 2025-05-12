import { IsNotEmpty, IsString, IsUUID, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateViewingRequestDto {
  @IsNotEmpty()
  @IsUUID()
  property_id: string;

  @IsNotEmpty()
  @IsUUID()
  agent_id: string;

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