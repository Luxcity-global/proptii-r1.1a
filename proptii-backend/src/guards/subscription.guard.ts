import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from '../modules/billing/billing.service';
import { REQUIRES_ACTIVE_SUBSCRIPTION_KEY } from '../decorators/requires-active-subscription.decorator';
import type { PlanId, SubscriptionStatus } from '../models/user.model';

const FREE_PLANS: PlanId[] = ['free'];

function userIdFromRequest(user: Record<string, unknown>): string {
  return (user?.oid ?? user?.sub ?? '') as string;
}

/** S4-01 / S4-04 — API-layer subscription access (free plan always allowed). */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_ACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as Record<string, unknown> | undefined;
    const userId = user ? userIdFromRequest(user) : '';
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const allowed = await this.billingService.userHasFeatureAccess(userId);
    if (!allowed) {
      throw new ForbiddenException(
        'Your subscription is inactive. Update billing or choose a plan to continue.',
      );
    }
    return true;
  }
}

export function isFreePlan(plan: PlanId | string | null | undefined): boolean {
  return !plan || FREE_PLANS.includes(plan as PlanId);
}

export function subscriptionAllowsAccess(
  plan: PlanId | string | null | undefined,
  status: SubscriptionStatus | string | null | undefined,
): boolean {
  if (isFreePlan(plan)) return true;
  if (!status) return false;
  return status === 'active' || status === 'trialing' || status === 'past_due';
}
