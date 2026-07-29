import { IsString, IsBoolean, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ description: 'Stripe Price ID for the selected plan and billing cycle' })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiProperty({ description: 'true = 30-day free trial (Path A); false = pay immediately (Path B)' })
  @IsBoolean()
  trialEnabled: boolean;

  @ApiPropertyOptional({ example: 'renter_pro' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ enum: ['monthly', 'annual'] })
  @IsOptional()
  @IsIn(['monthly', 'annual'])
  cycle?: 'monthly' | 'annual';

  /** Browser origin at checkout time — ensures Stripe redirects back to the live site. */
  @ApiPropertyOptional({ example: 'https://proptii.co' })
  @IsOptional()
  @IsString()
  returnBaseUrl?: string;
}

export class BillingStatusDto {
  /** Which dashboard this status applies to (`consumer` = renter/buyer, `landlord` = landlord/agent). */
  dashboard: string;
  plan: string;
  status: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  fitChecksUsed: number | null;
  fitChecksQuota: number | null;
  pendingPlan: string | null;
  pendingCycle: string | null;
  billingCadence: string | null;
  hasStripeCustomer: boolean;
}
