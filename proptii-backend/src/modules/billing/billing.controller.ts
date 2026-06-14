import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { QuotaReportDto } from './dto/quota-report.dto';
import { SetPendingPlanDto } from './dto/pending-plan.dto';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { RequiresActiveSubscription } from '../../decorators/requires-active-subscription.decorator';

/** Extracts the Azure AD B2C object ID from the JWT payload. */
function userId(user: Record<string, unknown>): string {
  return (user.oid ?? user.sub ?? '') as string;
}

/** Extracts the user's email from the JWT payload. */
function userEmail(user: Record<string, unknown>): string {
  if (typeof user.email === 'string') return user.email;
  if (Array.isArray(user.emails) && typeof user.emails[0] === 'string') {
    return user.emails[0] as string;
  }
  return '';
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * S1-02 / S1-03 — Create a Stripe Checkout Session.
   * Path A: trialEnabled=true  → 30-day trial (if PROMO_FREE_MONTH_ACTIVE=true)
   * Path B: trialEnabled=false → pay immediately
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  createCheckout(
    @CurrentUser() user: Record<string, unknown>,
    @Body() dto: CheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(userId(user), userEmail(user), dto);
  }

  /**
   * S1-06 — Open Stripe Billing Portal for the authenticated user.
   * Returns { portalUrl } to redirect to.
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Billing Portal session' })
  createPortal(@CurrentUser() user: Record<string, unknown>) {
    return this.billingService.createPortalSession(userId(user), userEmail(user));
  }

  /**
   * S1-04 — Return subscription state for the authenticated user.
   * Used by useBillingStatus() hook and TrialExpiredGuard on the frontend.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing status for current user' })
  getStatus(@CurrentUser() user: Record<string, unknown>) {
    return this.billingService.getBillingStatus(userId(user));
  }

  /**
   * After Stripe redirect — sync subscription to Cosmos when webhooks are not running (local dev).
   */
  @Post('confirm-checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm checkout session and activate plan' })
  confirmCheckout(
    @CurrentUser() user: Record<string, unknown>,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    return this.billingService.confirmCheckoutSession(
      userId(user),
      dto.sessionId,
    );
  }

  /**
   * S1-05 — Return the full plan catalogue.
   * Public endpoint — no auth required.
   * Used by the frontend pricing page components.
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get plan catalogue (public)' })
  getPlans() {
    return this.billingService.getPlans();
  }

  /**
   * S1-20 — Record fit-check usage for agent plans.
   * Increments fit_checks_used, creates Stripe overage invoice item if applicable.
   */
  @Post('quota/report')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @RequiresActiveSubscription()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report fit-check usage (agent plans only)' })
  reportQuota(
    @CurrentUser() user: Record<string, unknown>,
    @Body() dto: QuotaReportDto,
  ) {
    return this.billingService.reportQuota(userId(user), dto);
  }

  /**
   * S2-15 — Persist selected plan/cycle on the user doc after MSAL sign-up/sign-in.
   */
  @Post('pending-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set pending plan before checkout' })
  setPendingPlan(
    @CurrentUser() user: Record<string, unknown>,
    @Body() dto: SetPendingPlanDto,
  ) {
    return this.billingService.setPendingPlan(
      userId(user),
      userEmail(user),
      dto.planId,
      dto.cycle,
    );
  }

  /** S3-14 — Move to free plan after trial expiry. */
  @Post('downgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downgrade to free Explorer plan' })
  downgradeToFree(@CurrentUser() user: Record<string, unknown>) {
    return this.billingService.downgradeToFree(userId(user));
  }
}
