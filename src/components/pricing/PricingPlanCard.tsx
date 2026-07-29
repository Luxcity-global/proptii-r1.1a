import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlanConfig } from '../../config/plans';
import { getDisplayPrice } from '../../config/plans';
import type { BillingCycle } from './PricingBillingToggle';
import {
  createAccountUrl,
  ENTERPRISE_MAILTO,
  payNowUrl,
  signupUrl,
} from '../../utils/pricingRoutes';

function CheckIcon({ dim = false }: { dim?: boolean }) {
  return (
    <span className={`pr-check-icon${dim ? ' dim' : ''}`}>
      <svg viewBox="0 0 10 10">
        <polyline points="1.5,5 4,7.5 8.5,2.5" />
      </svg>
    </span>
  );
}

function audienceLabel(plan: PlanConfig): string {
  if (plan.segment.includes('renter') && plan.segment.includes('buyer')) {
    return 'For renters & buyers';
  }
  if (plan.segment.includes('renter')) return 'For renters';
  if (plan.segment.includes('buyer')) return 'For buyers';
  if (plan.segment.includes('landlord')) return 'For landlords';
  return 'For estate agents';
}

interface Props {
  plan: PlanConfig;
  billing: BillingCycle;
  animationDelay?: string;
  showPayNowLink?: boolean;
}

/** S2-05 / S2-10 — Plan card with PRD CTA routing. */
const PricingPlanCard: React.FC<Props> = ({
  plan,
  billing,
  animationDelay = '0s',
  showPayNowLink = true,
}) => {
  const navigate = useNavigate();
  const { amount, note } = getDisplayPrice(plan, billing);

  const cardClass = [
    'pr-plan-card',
    plan.isPopular ? 'featured' : '',
    plan.isDark ? 'dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handlePrimaryCta = () => {
    if (plan.isContactSales) {
      window.location.href = ENTERPRISE_MAILTO;
      return;
    }
    if (plan.isFree) {
      navigate(createAccountUrl(plan.id));
      return;
    }
    navigate(signupUrl(plan.id, billing));
  };

  const primaryLabel = plan.isContactSales
    ? 'Contact us'
    : plan.isFree
      ? 'Get started free'
      : 'Start free trial';

  const ctaClass = plan.isDark
    ? 'pr-plan-cta white'
    : plan.isPopular && !plan.isFree
      ? 'pr-plan-cta primary'
      : plan.isFree
        ? 'pr-plan-cta secondary'
        : 'pr-plan-cta secondary';

  return (
    <div className={cardClass} style={{ animationDelay }}>
      {plan.isPopular && (
        <div className="pr-featured-badge">
          {plan.id === 'agent_pro' ? 'Recommended' : 'Most popular'}
        </div>
      )}
      <div className="pr-plan-audience">{audienceLabel(plan)}</div>
      <div className="pr-plan-name">{plan.name}</div>
      <div className="pr-plan-desc">
        {plan.isFree
          ? 'Start your search and understand your fit — no card needed.'
          : plan.isContactSales
            ? 'Multi-branch and franchise networks. Custom volume, white-label, API.'
            : `Full access to ${plan.name} features.`}
      </div>

      {plan.isContactSales ? (
        <>
          <div className="pr-plan-price" style={{ alignItems: 'center' }}>
            <span className="pr-price-amount" style={{ fontSize: '36px' }}>
              Custom
            </span>
          </div>
          <div
            className="pr-price-annual-note"
            style={{
              color: 'rgba(255,255,255,.7)',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            {note}
          </div>
        </>
      ) : (
        <>
          <div className="pr-plan-price">
            <span className="pr-price-currency">£</span>
            <span className="pr-price-amount">{amount ?? 0}</span>
            <span className="pr-price-period">/ month</span>
          </div>
          <div
            className={`pr-price-annual-note${billing === 'monthly' || plan.isFree ? ' empty' : ''}`}
          >
            {billing === 'monthly' || plan.isFree ? '\u00A0' : note}
          </div>
        </>
      )}

      <hr className="pr-plan-divider" />
      <ul className="pr-feature-list">
        {plan.features.map((f) => (
          <li key={f.label} className={f.included ? '' : 'dimmed'}>
            <CheckIcon dim={!f.included} />
            {f.label}
            {f.note ? (
              <span className="pr-soon-tag" style={{ marginLeft: 6 }}>
                {f.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <button type="button" className={ctaClass} onClick={handlePrimaryCta}>
        {primaryLabel}
      </button>

      {!plan.isFree && !plan.isContactSales && (
        <div className="pr-trial-note">First month free · cancel anytime</div>
      )}

      {showPayNowLink && !plan.isFree && !plan.isContactSales && (
        <button
          type="button"
          onClick={() => navigate(payNowUrl(plan.id, billing))}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
            color: 'var(--pr-muted)',
            textAlign: 'center',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            opacity: 0.75,
            padding: '2px 0',
          }}
        >
          Pay now &amp; skip the trial →
        </button>
      )}
    </div>
  );
};

export default PricingPlanCard;
