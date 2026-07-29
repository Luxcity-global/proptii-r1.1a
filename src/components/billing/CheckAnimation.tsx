import React from 'react';

/** S3-18 — Reusable green check animation (screens 4 & 8). */
const CheckAnimation: React.FC = () => (
  <div className="pr-check-circle">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="5,12 10,17 19,7" />
    </svg>
  </div>
);

export default CheckAnimation;
