import React from 'react';

export type BillingCycle = 'monthly' | 'annual';

interface Props {
  billing: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

/** S2-04 — Monthly / annual toggle; annual is default on the parent page. */
const PricingBillingToggle: React.FC<Props> = ({ billing, onChange }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      marginTop: '36px',
      marginBottom: '36px',
    }}
  >
    <div className="pr-billing-toggle">
      <button
        type="button"
        className={`pr-toggle-btn${billing === 'monthly' ? ' active' : ''}`}
        onClick={() => onChange('monthly')}
      >
        Pay monthly
      </button>
      <button
        type="button"
        className={`pr-toggle-btn${billing === 'annual' ? ' active' : ''}`}
        onClick={() => onChange('annual')}
      >
        Pay annually <span className="pr-save-badge">Save 20%</span>
      </button>
    </div>
    <div style={{ fontSize: '14px', color: 'var(--pr-muted)', fontWeight: 500 }}>
      {billing === 'annual'
        ? 'Showing annual prices · billed once per year'
        : 'Showing monthly prices · billed each month'}
    </div>
  </div>
);

export default PricingBillingToggle;
