import React from 'react';
import type { PricingAudience } from '../../utils/pricingRoutes';

interface Props {
  audience: PricingAudience;
  onChange: (audience: PricingAudience) => void;
}

/** S2-03 — Renters / Landlords / Agents audience tabs. */
const PricingAudienceTabs: React.FC<Props> = ({ audience, onChange }) => (
  <div className="pr-audience-tabs" style={{ marginBottom: '36px' }}>
    <button
      type="button"
      className={`pr-aud-tab${audience === 'renters' ? ' active' : ''}`}
      onClick={() => onChange('renters')}
    >
      Renters &amp; buyers
    </button>
    <button
      type="button"
      className={`pr-aud-tab${audience === 'landlords' ? ' active' : ''}`}
      onClick={() => onChange('landlords')}
    >
      Landlords
    </button>
    <button
      type="button"
      className={`pr-aud-tab${audience === 'agents' ? ' active' : ''}`}
      onClick={() => onChange('agents')}
    >
      Estate agents
    </button>
  </div>
);

export default PricingAudienceTabs;
