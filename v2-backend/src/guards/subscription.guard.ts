import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from '../services/billing.service';

/** Metadata key used by @RequiredPlan() decorator. */
export const REQUIRED_PLAN_KEY = 'required_plan';

/**
 * Route/handler decorator that declares the minimum subscription plan needed.
 *
 * Usage:
 *   @UseGuards(FirebaseAuthGuard, SubscriptionGuard)
 *   @RequiredPlan('renter_pro')
 *   @Get('some-protected-route')
 *   async myHandler() { ... }
 *
 * The guard reads this metadata at runtime and compares it against the
 * authenticated user's billing status returned by BillingService.getBillingStatus.
 * Server-side guard file: v2-backend/src/guards/subscription.guard.ts
 */
export const RequiredPlan = (planTier: string) =>
  SetMetadata(REQUIRED_PLAN_KEY, planTier);

/**
 * Maps plan IDs to numeric access tiers.
 * Higher number = more access. Plans at the same tier are interchangeable
 * (e.g. renter_pro and buyer_pro are both tier 2).
 */
const PLAN_TIERS: Record<string, number> = {
  free: 0,
  explorer: 0,
  starter: 1,
  renter_pro: 2,
  buyer_pro: 2,
  independent: 2,
  landlord_pro: 3,
  agent_pro: 3,
  elite: 4,
  enterprise: 5,
};

/**
 * Returns true when the user's current plan meets or exceeds the required plan's tier.
 */
function planMeetsTier(userPlan: string, requiredPlan: string): boolean {
  const userTier = PLAN_TIERS[userPlan] ?? 0;
  const reqTier = PLAN_TIERS[requiredPlan] ?? 0;
  return userTier >= reqTier;
}

/**
 * SubscriptionGuard — enforces plan-gating at the API layer.
 *
 * Must be used AFTER FirebaseAuthGuard so that request.user is already populated.
 * If no @RequiredPlan() decorator is present on the handler or class the guard
 * passes through unconditionally (routes with no plan restriction remain open).
 *
 * Throws ForbiddenException (403) for:
 *   - expired trials
 *   - canceled / past_due / unpaid subscriptions
 *   - plans below the required tier
 *
 * Propagates ServiceUnavailableException (503) from BillingService when
 * Firestore is unavailable (added in FEAT-001 / P0-4).
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read the @RequiredPlan() metadata from the handler, falling back to the class.
    const requiredPlan = this.reflector.getAllAndOverride<string>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No plan restriction declared → allow the request through.
    if (!requiredPlan) return true;

    const request = context.switchToHttp().getRequest();
    const { uid, email, role } = request.user ?? {};

    if (!uid) throw new ForbiddenException('User not authenticated');

    // getBillingStatus throws ServiceUnavailableException on DB errors (FEAT-001).
    // Let that propagate naturally — returning 503 is safer than granting access.
    const billing = await this.billingService.getBillingStatus(uid, email, role);

    // Check server-side trial expiry.
    if (billing.trialEndsAt && billing.status === 'trialing') {
      if (new Date(billing.trialEndsAt).getTime() < Date.now()) {
        throw new ForbiddenException(
          'Trial has expired — please activate your subscription',
        );
      }
    }

    // Reject inactive subscription states.
    if (
      billing.status === 'canceled' ||
      billing.status === 'past_due' ||
      billing.status === 'unpaid'
    ) {
      throw new ForbiddenException('Subscription is not active');
    }

    // Compare plan tiers.
    const userPlan: string = billing.planId ?? billing.plan ?? 'free';
    if (!planMeetsTier(userPlan, requiredPlan)) {
      throw new ForbiddenException(
        `This feature requires ${requiredPlan} or above`,
      );
    }

    return true;
  }
}
