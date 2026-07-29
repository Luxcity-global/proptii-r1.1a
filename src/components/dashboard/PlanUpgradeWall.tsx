import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface Props {
  featureName: string;
  upgradeLabel: string;
  /** Pricing segment to land on (renters | landlords | agents). Defaults to renters. */
  segment?: 'renters' | 'landlords' | 'agents';
}

/**
 * Full-section upgrade wall — shown when a user without the required plan
 * tries to access a locked dashboard section.
 */
const PlanUpgradeWall: React.FC<Props> = ({
  featureName,
  upgradeLabel,
  segment = 'renters',
}) => (
  <div
    className="flex flex-col items-center justify-center text-center py-24 px-6"
    style={{ fontFamily: 'Archivo, sans-serif' }}
  >
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
      style={{ background: '#F3F4F6' }}
    >
      <Lock className="w-6 h-6" style={{ color: '#374957' }} />
    </div>
    <h2 className="text-xl font-bold mb-2" style={{ color: '#374957' }}>
      {featureName} is a paid feature
    </h2>
    <p className="text-sm max-w-sm mb-6" style={{ color: '#717182', lineHeight: 1.65 }}>
      {upgradeLabel}
    </p>
    <div className="flex gap-3 flex-wrap justify-center">
      <Link
        to={`/pricing?segment=${segment}`}
        className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
        style={{ background: '#DC5F12' }}
      >
        View plans
      </Link>
      <Link
        to="/dashboard"
        className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);

export default PlanUpgradeWall;
