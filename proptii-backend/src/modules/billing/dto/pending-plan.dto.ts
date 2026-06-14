import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPendingPlanDto {
  @ApiProperty({ example: 'renter_pro' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: ['monthly', 'annual'] })
  @IsIn(['monthly', 'annual'])
  cycle: 'monthly' | 'annual';
}
