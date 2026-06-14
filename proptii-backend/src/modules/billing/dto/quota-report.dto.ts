import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuotaReportDto {
  @ApiProperty({ description: 'Number of fit checks used in this event', minimum: 1 })
  @IsNumber()
  @Min(1)
  checksUsed: number;
}

export class QuotaStatusDto {
  used: number;
  quota: number;
  remaining: number;
}
