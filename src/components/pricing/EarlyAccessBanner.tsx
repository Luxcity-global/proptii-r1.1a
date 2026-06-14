import React from 'react';

const promoActive =
  import.meta.env.VITE_PROMO_FREE_MONTH_ACTIVE === 'true';

/** S2-02 — Early access promo banner (env-controlled). */
const EarlyAccessBanner: React.FC = () => {
  if (!promoActive) return null;

  return (
    <div className="pr-early-banner" style={{ position: 'relative', zIndex: 50 }}>
      <span className="pr-banner-pill">Limited offer</span>
      Sign up before <strong>31 July 2026</strong> — get your first month completely free.
    </div>
  );
};

export default EarlyAccessBanner;
