import React from 'react';
import type { PlanConfig } from '../../config/plans';
import type { PricingAudience } from '../../utils/pricingRoutes';
import PricingPlanCard from './PricingPlanCard';
import type { BillingCycle } from './PricingBillingToggle';
import { usePlans } from '../../hooks/usePlans';

interface Props {
  audience: PricingAudience;
  billing: BillingCycle;
}

function filterByAudience(all: PlanConfig[], audience: PricingAudience): PlanConfig[] {
  if (audience === 'renters') return all.filter(p => p.segment.includes('renter') || p.segment.includes('buyer'));
  if (audience === 'landlords') return all.filter(p => p.segment.includes('landlord'));
  return all.filter(p => p.segment.includes('agent'));
}

/** S2-06 — Plan grid driven by plans.ts. */
const PricingPlanGrid: React.FC<Props> = ({ audience, billing }) => {
  const { plans } = usePlans();
  const filteredPlans = filterByAudience(plans, audience);
  const delays = ['.08s', '.18s', '.28s'];

  return (
    <div className="pr-pricing-grid">
      {filteredPlans.map((plan, i) => (
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
