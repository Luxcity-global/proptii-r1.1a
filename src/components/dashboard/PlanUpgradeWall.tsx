import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowUpRight, Sparkles } from 'lucide-react';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import { getPlanById, type PlanId } from '../../config/plans';

interface Props {
  featureName: string;
  upgradeLabel: string;
  /** Pricing segment to land on (renters | landlords | agents). Defaults to renters. */
  segment?: 'renters' | 'landlords' | 'agents';
}

function normalizePlanId(plan: string | null | undefined): PlanId {
  if (!plan || plan === 'free') return 'explorer';
  return plan as PlanId;
}

/**
 * In-page lock ad shown when a user opens a dashboard section their plan does not include.
 * Pricing is only opened from the upgrade link — not from the sidebar.
 */
const PlanUpgradeWall: React.FC<Props> = ({
  featureName,
  upgradeLabel,
  segment = 'renters',
}) => {
  const { plan } = useBillingStatus();
  const planId = normalizePlanId(plan);
  const planConfig = usePlan(planId) ?? getPlanById(planId);
  const planName = planConfig?.name ?? 'Explorer';

  return (
    <div
      className="flex justify-center px-4 py-10 sm:py-16"
      style={{ fontFamily: 'Archivo, sans-serif' }}
    >
      <div
        className="w-full max-w-xl overflow-hidden bg-white"
        style={{
          border: '1px solid #80B2FF',
          borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(70, 95, 194, 0.12)',
        }}
      >
        <div
          className="px-6 sm:px-8 py-6 flex items-center gap-3"
          style={{ background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)' }}
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Lock className="w-5 h-5" style={{ color: '#136C9E' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#136C9E' }}>
              Locked on your plan
            </p>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#374957' }}>
              {featureName} is a paid feature
            </h2>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-7">
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#717182' }}>
            {upgradeLabel} You are currently on the{' '}
            <span className="font-semibold" style={{ color: '#374957' }}>
              {planName}
            </span>{' '}
            plan, so this section stays locked until you upgrade.
          </p>

          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-7"
            style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
          >
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC5F12' }} />
            <p className="text-sm leading-relaxed" style={{ color: '#374957' }}>
              Upgrade your current tier to unlock {featureName.toLowerCase()} and the rest of the paid toolkit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/pricing?segment=${segment}`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#DC5F12' }}
            >
              Upgrade your plan
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgradeWall;
