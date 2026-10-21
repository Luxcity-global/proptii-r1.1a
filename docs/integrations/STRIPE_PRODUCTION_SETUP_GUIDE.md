# Stripe Production Integration & Setup Guide

This guide is an entrypoint for the complete Stripe live integration.

For the full, detailed DevOps operational cutover runbook (including product/price tables, required metadata, Stripe Tax configuration, Customer Portal setup, webhook endpoints, and rollback procedures), see:

👉 **[Stripe Production Cutover Runbook (docs/setup/STRIPE_PRODUCTION_CUTOVER_RUNBOOK.md)](file:///home/angeli/Desktop/luxcity/proptii-r1.1a/docs/setup/STRIPE_PRODUCTION_CUTOVER_RUNBOOK.md)**

### Key Highlights for Handover

1. **7 Paid Products & 14 Recurring Prices in GBP:**
   - Every product **must** have metadata `proptii_plan_id: <plan_id>` (e.g. `renter_pro`, `buyer_pro`, `starter`, `landlord_pro`, `elite`, `independent`, `agent_pro`).
2. **Stripe Tax Address Requirement:**
   - In live mode (`sk_live_...`), Proptii activates `automatic_tax: { enabled: true }`. A registered head-office address in Stripe Tax settings is mandatory or live checkout will fail.
3. **Customer Portal:**
   - Must be activated in Stripe Dashboard (`Settings → Customer portal`) with return URL `https://proptii.co.uk/dashboard/settings`.
4. **Webhook Endpoint:**
   - `POST https://<backend-domain>/api/billing/webhook`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Signing secret must be set as `STRIPE_WEBHOOK_SECRET`.
5. **Server-Side Price IDs:**
   - All 14 `STRIPE_PRICE_<PLAN>_<CYCLE>` environment variables must be populated on Render.
