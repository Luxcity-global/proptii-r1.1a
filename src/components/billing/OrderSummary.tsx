import React from 'react';
import type { PlanConfig } from '../../config/plans';
import type { BillingCycle } from '../pricing/PricingBillingToggle';

interface Props {
  plan: PlanConfig;
  cycle: BillingCycle;
}

/** S3-04 — Plan summary from plans.ts + URL cycle (no hardcoded prices). */
const OrderSummary: React.FC<Props> = ({ plan, cycle }) => {
  const billingLabel = cycle === 'annual' ? 'Annual' : 'Monthly';
  const priceLabel =
    cycle === 'annual'
      ? plan.annualTotal != null
        ? `£${plan.annualTotal} / year`
        : '—'
      : plan.monthlyPrice != null
        ? `£${plan.monthlyPrice} / month`
        : '—';
  const dueToday =
    cycle === 'annual' ? plan.annualTotal : plan.monthlyPrice;

  return (
    <div className="pr-summary">
      <div className="pr-summary-row">
        <span className="lbl">Plan</span>
        <span>{plan.name}</span>
      </div>
      <div className="pr-summary-row">
        <span className="lbl">Billing</span>
        <span>{billingLabel}</span>
      </div>
      <div className="pr-summary-row">
        <span className="lbl">Price</span>
        <span>{priceLabel}</span>
      </div>
      {cycle === 'annual' && plan.annualSaving && (
        <div className="pr-summary-row">
          <span className="lbl">Saving</span>
          <span>{plan.annualSaving}</span>
        </div>
      )}
      <div className="pr-summary-divider" />
      <div className="pr-summary-row pr-summary-due">
        <span>Due today</span>
        <span className="amt">
          {dueToday != null ? `£${dueToday}` : '—'}
        </span>
      </div>
    </div>
  );
};

export default OrderSummary;
