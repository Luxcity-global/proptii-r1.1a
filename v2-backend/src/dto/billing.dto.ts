import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PendingPlanDto {
  @ApiProperty({ description: 'Plan identifier (e.g. explorer, pro, scale)' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({ description: 'Billing cycle (monthly or annual)', enum: ['monthly', 'annual'], default: 'monthly' })
  @IsOptional()
  @IsIn(['monthly', 'annual'])
  cycle?: 'monthly' | 'annual';
}

export class UpgradeSubscriptionDto {
  @ApiProperty({ description: 'Target plan identifier' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({ description: 'Billing cycle (monthly or annual)', enum: ['monthly', 'annual'], default: 'monthly' })
  @IsOptional()
  @IsIn(['monthly', 'annual'])
  cycle?: 'monthly' | 'annual';
}
