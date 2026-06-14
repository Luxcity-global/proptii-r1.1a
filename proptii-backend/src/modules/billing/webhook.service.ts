import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Container } from '@azure/cosmos';
import { BillingService } from './billing.service';
import { EmailService } from '../../services/email.service';
import { buildPriceIdMap, getPlanConfig } from './config/plans.config';
import {
  getSubscriptionCurrentPeriodEndIso,
  getSubscriptionTrialEndIso,
} from './stripe-subscription.utils';
import type {
  UserDocument,
  PlanId,
  BillingCadence,
  SubscriptionStatus,
} from '../../models/user.model';

interface BillingEventDoc {
  id: string;
  type: string;
  result: 'success' | 'error' | 'duplicate';
  processedAt: string;
  error?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly stripe: any | null;
  private eventsContainer: Container | null = null;

  constructor(
    private readonly billingService: BillingService,
    private readonly emailService: EmailService,
  ) {
    this.stripe = billingService.getStripe();
  }

  // ── S1-07 / S1-08: Verify and dispatch ───────────────────────────────────

  async processWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe webhooks are disabled — STRIPE_SECRET_KEY is not configured on this server.',
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Stripe signature verification failed: ${err.message}`);
      throw err;
    }

    // ── S1-09: Idempotency — skip already-processed events ────────────────
    const alreadyProcessed = await this.isEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(`Duplicate event ignored: ${event.id} (${event.type})`);
      await this.markEvent(event.id, event.type, 'duplicate');
      return;
    }

    this.logger.log(`Processing Stripe event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event);
          break;
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
      await this.markEvent(event.id, event.type, 'success');
    } catch (err: any) {
      this.logger.error(`Failed to process event ${event.id} (${event.type}): ${err.message}`);
      await this.markEvent(event.id, event.type, 'error', err.message);
      throw err;
    }
  }

  // ── S1-10: checkout.session.completed ────────────────────────────────────

  private async handleCheckoutCompleted(event: any): Promise<void> {
    const session = event.data.object as any;

    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error(`checkout.session.completed — no userId in metadata, session=${session.id}`);
      return;
    }

    const subscriptionId = session.subscription as string | null;
    if (!subscriptionId) {
      this.logger.warn(`checkout.session.completed — no subscription on session=${session.id}`);
      return;
    }

    const lineItems = await this.stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 1 },
    );
    const priceId = lineItems.data[0]?.price?.id ?? '';

    await this.billingService.activateFromCheckoutSession(userId, session, {
      priceId,
    });
  }

  // ── S1-11: customer.subscription.updated ─────────────────────────────────

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;

    const userDoc = await this.billingService.getUserByStripeCustomerId(customerId);
    if (!userDoc) {
      this.logger.warn(`subscription.updated — no user for customerId=${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0]?.price.id ?? '';
    const priceMap = buildPriceIdMap();
    const planInfo = priceMap.get(priceId);

    await this.billingService.updateUserDoc(userDoc.id, {
      plan: (planInfo?.planId ?? userDoc.plan) as PlanId,
      stripe_price_id: priceId,
      subscription_status: subscription.status as SubscriptionStatus,
      billing_cadence: planInfo?.cadence ?? (userDoc.billing_cadence as BillingCadence),
      current_period_end: getSubscriptionCurrentPeriodEndIso(subscription),
      trial_ends_at: getSubscriptionTrialEndIso(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    this.logger.log(
      `Subscription updated — userId=${userDoc.id} status=${subscription.status}`,
    );
  }

  // ── S1-12: customer.subscription.deleted ─────────────────────────────────

  private async handleSubscriptionDeleted(event: any): Promise<void> {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;

    const userDoc = await this.billingService.getUserByStripeCustomerId(customerId);
    if (!userDoc) {
      this.logger.warn(`subscription.deleted — no user for customerId=${customerId}`);
      return;
    }

    await this.billingService.updateUserDoc(userDoc.id, {
      plan: 'free' as PlanId,
      subscription_status: 'canceled' as SubscriptionStatus,
      stripe_subscription_id: null,
      stripe_price_id: null,
      billing_cadence: null,
      current_period_end: null,
      cancel_at_period_end: false,
      trial_ends_at: null,
      fit_checks_used: null,
      fit_checks_quota: null,
    });

    this.logger.log(`Subscription deleted — userId=${userDoc.id} downgraded to free`);
  }

  // ── S1-13: invoice.payment_succeeded ─────────────────────────────────────

  private async handlePaymentSucceeded(event: any): Promise<void> {
    const invoice = event.data.object as any;
    const customerId = invoice.customer as string;

    const userDoc = await this.billingService.getUserByStripeCustomerId(customerId);
    if (!userDoc) {
      this.logger.warn(`invoice.payment_succeeded — no user for customerId=${customerId}`);
      return;
    }

    const updates: Partial<UserDocument> = {
      payment_failed_at: null,
      subscription_status: 'active' as SubscriptionStatus,
    };

    // Reset fit-check counter for agent plans on each billing cycle
    const isAgentPlan = userDoc.plan === 'independent' || userDoc.plan === 'agent_pro';
    if (isAgentPlan) {
      updates.fit_checks_used = 0;
    }

    await this.billingService.updateUserDoc(userDoc.id, updates);

    // Send receipt email
    const userEmail = userDoc.email;
    if (userEmail) {
      const amountPaid = invoice.amount_paid ?? 0;
      const formattedAmount = `£${(amountPaid / 100).toFixed(2)}`;
      await this.emailService.sendEmail({
        to: userEmail,
        subject: `Payment confirmed — ${formattedAmount} received`,
        html: this.buildReceiptEmailHtml({
          firstName: userDoc.givenName ?? userDoc.name ?? 'there',
          planName: this.getPlanName(userDoc.plan),
          amount: formattedAmount,
          invoiceUrl: invoice.hosted_invoice_url ?? '',
        }),
      });
    }

    this.logger.log(`Payment succeeded — userId=${userDoc.id} amount=${invoice.amount_paid}`);
  }

  // ── S1-14: invoice.payment_failed ────────────────────────────────────────

  private async handlePaymentFailed(event: any): Promise<void> {
    const invoice = event.data.object as any;
    const customerId = invoice.customer as string;

    const userDoc = await this.billingService.getUserByStripeCustomerId(customerId);
    if (!userDoc) {
      this.logger.warn(`invoice.payment_failed — no user for customerId=${customerId}`);
      return;
    }

    await this.billingService.updateUserDoc(userDoc.id, {
      subscription_status: 'past_due' as SubscriptionStatus,
      payment_failed_at: new Date().toISOString(),
    });

    // Send payment-failed email (S1-19)
    const userEmail = userDoc.email;
    if (userEmail) {
      const amountDue = invoice.amount_due ?? 0;
      const formattedAmount = `£${(amountDue / 100).toFixed(2)}`;
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

      await this.emailService.sendEmail({
        to: userEmail,
        subject: 'Action needed: payment failed on your Proptii subscription',
        html: this.buildPaymentFailedEmailHtml({
          firstName: userDoc.givenName ?? userDoc.name ?? 'there',
          planName: this.getPlanName(userDoc.plan),
          amountDue: formattedAmount,
          billingPortalUrl: `${frontendUrl}/account/billing`,
        }),
      });
    }

    this.logger.warn(`Payment failed — userId=${userDoc.id} status set to past_due`);
  }

  // ── S1-15: customer.subscription.trial_will_end ──────────────────────────

  private async handleTrialWillEnd(event: any): Promise<void> {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;

    const userDoc = await this.billingService.getUserByStripeCustomerId(customerId);
    if (!userDoc) {
      this.logger.warn(`trial_will_end — no user for customerId=${customerId}`);
      return;
    }

    await this.billingService.updateUserDoc(userDoc.id, { trial_ending_soon: true });

    // Send day-27 reminder email (S1-18)
    const userEmail = userDoc.email;
    if (userEmail) {
      const renewalDate = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'soon';

      const priceId = subscription.items.data[0]?.price.id ?? '';
      const priceMap = buildPriceIdMap();
      const planInfo = priceMap.get(priceId);
      const planCfg = planInfo ? getPlanConfig(planInfo.planId) : null;
      const renewalAmount = planCfg
        ? planInfo?.cadence === 'annual'
          ? `£${planCfg.annualTotal}`
          : `£${planCfg.monthlyPrice}`
        : 'your subscription amount';

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

      await this.emailService.sendEmail({
        to: userEmail,
        subject: 'Your free month ends in 3 days',
        html: this.buildTrialEndingEmailHtml({
          firstName: userDoc.givenName ?? userDoc.name ?? 'there',
          planName: this.getPlanName(userDoc.plan),
          renewalDate,
          renewalAmount,
          activateUrl: `${frontendUrl}/billing/activate`,
          cancelUrl: `${frontendUrl}/account/billing`,
        }),
      });
    }

    this.logger.log(`Trial ending soon notified — userId=${userDoc.id}`);
  }

  // ── S1-09: Idempotency helpers ────────────────────────────────────────────

  private getEventsContainer(): Container | null {
    return this.billingService.getEventsContainerRef();
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const container = this.getEventsContainer();
    if (!container) return false;
    try {
      const { resource } = await container.item(eventId, eventId).read<BillingEventDoc>();
      return !!resource && resource.result !== 'error';
    } catch (err: any) {
      if (err?.code === 404) return false;
      this.logger.error(`isEventProcessed check failed: ${err.message}`);
      return false;
    }
  }

  private async markEvent(
    eventId: string,
    type: string,
    result: BillingEventDoc['result'],
    errorMsg?: string,
  ): Promise<void> {
    const container = this.getEventsContainer();
    if (!container) return;
    try {
      const doc: BillingEventDoc = {
        id: eventId,
        type,
        result,
        processedAt: new Date().toISOString(),
        ...(errorMsg ? { error: errorMsg } : {}),
      };
      await container.items.upsert(doc);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes('Resource Not Found')) {
        this.logger.warn(
          `BillingEvents container missing in Cosmos — webhook idempotency disabled. Create container "BillingEvents" (partition /id) or ignore in local dev.`,
        );
        return;
      }
      this.logger.error(`Failed to mark event ${eventId}: ${msg}`);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getPlanName(planId: PlanId | string | undefined): string {
    const cfg = getPlanConfig((planId ?? 'free') as PlanId);
    return cfg?.name ?? planId ?? 'your plan';
  }

  // ── S1-18: Trial-ending reminder email HTML ───────────────────────────────

  private buildTrialEndingEmailHtml(data: {
    firstName: string;
    planName: string;
    renewalDate: string;
    renewalAmount: string;
    activateUrl: string;
    cancelUrl: string;
  }): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px 0; margin: 0; color: #333; }
  .c { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(0,43,73,.1); }
  h1 { color: #002B49; font-size: 22px; margin-bottom: 8px; }
  .badge { display: inline-block; background: #FFF3CD; color: #BA7517; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
  .detail { background: #f5f8fb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .btn { display: inline-block; background: #F15A22; color: #fff !important; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .cancel { display: block; text-align: center; margin-top: 14px; font-size: 13px; color: #888; }
  .cancel a { color: #888; }
  .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #666; }
</style></head><body>
<div class="c">
  <div class="badge">Free trial ending</div>
  <h1>Hi ${data.firstName}, your free month ends in 3 days</h1>
  <p>Your <strong>${data.planName}</strong> free trial is coming to an end. To keep your access, add a payment method before the trial expires.</p>

  <div class="detail">
    <p><strong>Plan:</strong> ${data.planName}</p>
    <p><strong>Trial ends:</strong> ${data.renewalDate}</p>
    <p><strong>Renewal amount:</strong> ${data.renewalAmount}</p>
  </div>

  <div style="text-align:center;margin-top:24px;">
    <a href="${data.activateUrl}" class="btn">Review your plan →</a>
  </div>

  <p class="cancel"><a href="${data.cancelUrl}">Cancel before day 30 — no charge</a></p>

  <div class="footer">
    <p>Best regards,<br>The Proptii Team</p>
    <p style="font-size:12px;color:#aaa;">You're receiving this because you signed up for a Proptii free trial.</p>
  </div>
</div>
</body></html>`;
  }

  // ── S1-19: Payment-failed email HTML ─────────────────────────────────────

  private buildPaymentFailedEmailHtml(data: {
    firstName: string;
    planName: string;
    amountDue: string;
    billingPortalUrl: string;
  }): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px 0; margin: 0; color: #333; }
  .c { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(0,43,73,.1); }
  h1 { color: #002B49; font-size: 22px; margin-bottom: 8px; }
  .badge { display: inline-block; background: #FEE2E2; color: #B91C1C; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
  .detail { background: #f5f8fb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .btn { display: inline-block; background: #F15A22; color: #fff !important; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #666; }
</style></head><body>
<div class="c">
  <div class="badge">Payment failed</div>
  <h1>Hi ${data.firstName}, we couldn't process your payment</h1>
  <p>Your <strong>${data.planName}</strong> subscription payment failed. Please update your payment method to keep access to your plan.</p>
  <p>You have a <strong>7-day grace period</strong> before your account is downgraded to the free plan.</p>

  <div class="detail">
    <p><strong>Plan:</strong> ${data.planName}</p>
    <p><strong>Amount due:</strong> ${data.amountDue}</p>
  </div>

  <div style="text-align:center;margin-top:24px;">
    <a href="${data.billingPortalUrl}" class="btn">Update payment method →</a>
  </div>

  <div class="footer">
    <p>Best regards,<br>The Proptii Team</p>
    <p style="font-size:12px;color:#aaa;">If you have any questions, contact us at support@proptii.com</p>
  </div>
</div>
</body></html>`;
  }

  private buildReceiptEmailHtml(data: {
    firstName: string;
    planName: string;
    amount: string;
    invoiceUrl: string;
  }): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px 0; margin: 0; color: #333; }
  .c { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 24px rgba(0,43,73,.1); }
  h1 { color: #002B49; font-size: 22px; margin-bottom: 8px; }
  .badge { display: inline-block; background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
  .detail { background: #f5f8fb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .btn { display: inline-block; background: #F15A22; color: #fff !important; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; }
  .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #666; }
</style></head><body>
<div class="c">
  <div class="badge">Payment confirmed</div>
  <h1>Hi ${data.firstName}, your payment was successful</h1>
  <p>Thank you — your <strong>${data.planName}</strong> subscription has been renewed.</p>

  <div class="detail">
    <p><strong>Plan:</strong> ${data.planName}</p>
    <p><strong>Amount charged:</strong> ${data.amount}</p>
  </div>

  ${data.invoiceUrl ? `<div style="text-align:center;margin-top:24px;"><a href="${data.invoiceUrl}" class="btn">View invoice →</a></div>` : ''}

  <div class="footer">
    <p>Best regards,<br>The Proptii Team</p>
  </div>
</div>
</body></html>`;
  }
}
