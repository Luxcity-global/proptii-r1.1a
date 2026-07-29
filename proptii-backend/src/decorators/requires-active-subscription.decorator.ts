import { SetMetadata } from '@nestjs/common';

export const REQUIRES_ACTIVE_SUBSCRIPTION_KEY = 'requiresActiveSubscription';

/** S4-02 — Mark routes that require an active paid subscription (not canceled/unpaid). */
export const RequiresActiveSubscription = () =>
  SetMetadata(REQUIRES_ACTIVE_SUBSCRIPTION_KEY, true);
