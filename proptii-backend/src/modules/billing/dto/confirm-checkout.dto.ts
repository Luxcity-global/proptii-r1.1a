import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmCheckoutDto {
  @ApiProperty({ description: 'Stripe Checkout Session ID (cs_...)' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
