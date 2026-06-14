import React from 'react';
import { getPlansForAudienceTab } from '../../config/plans';
import type { PricingAudience } from '../../utils/pricingRoutes';
import PricingPlanCard from './PricingPlanCard';
import type { BillingCycle } from './PricingBillingToggle';

interface Props {
  audience: PricingAudience;
  billing: BillingCycle;
}

/** S2-06 — Plan grid driven by plans.ts. */
const PricingPlanGrid: React.FC<Props> = ({ audience, billing }) => {
  const plans = getPlansForAudienceTab(audience);
  const delays = ['.08s', '.18s', '.28s'];

  return (
    <div className="pr-pricing-grid">
      {plans.map((plan, i) => (
        <PricingPlanCard
          key={plan.id}
          plan={plan}
          billing={billing}
          animationDelay={delays[i] ?? '0s'}
        />
      ))}
    </div>
  );
};

export default PricingPlanGrid;
