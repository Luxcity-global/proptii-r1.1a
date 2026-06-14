import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

/**
 * Handles incoming Stripe webhook events.
 *
 * This controller is PUBLIC — no JwtAuthGuard applied.
 * Stripe signature verification is performed inside WebhookService before
 * any event data is processed (S1-08).
 *
 * Raw body access: main.ts registers express.raw({ type: 'application/json' })
 * for this path BEFORE the global JSON parser, so req.body is a Buffer here.
 */
@ApiExcludeController()
@Controller('webhooks')
@SkipThrottle()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: Request & { body: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      this.logger.error(
        'req.body is not a Buffer — raw body middleware may not be configured correctly',
      );
      throw new BadRequestException('Raw body not available for signature verification');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // WebhookService handles signature verification, idempotency, event routing,
    // and logging. Any signature failure throws a 400-equivalent error.
    await this.webhookService.processWebhook(rawBody, signature);

    return { received: true };
  }
}
