import React from 'react';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import type { PlanId } from '../../config/plans';

function formatResetDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** S4-08 — Fit-check quota for Independent / Agent Pro plans. */
const AgentQuotaWidget: React.FC = () => {
  const {
    plan,
    fitChecksUsed,
    fitChecksQuota,
    currentPeriodEnd,
    loading,
  } = useBillingStatus();

  const agentPlans: PlanId[] = ['independent', 'agent_pro'];
  if (!plan || !agentPlans.includes(plan as PlanId)) {
    return null;
  }

  const planConfig = usePlan(plan as PlanId);
  const used = fitChecksUsed ?? 0;
  const quota = fitChecksQuota ?? planConfig?.fitChecksQuota ?? 0;
  const remaining = Math.max(0, quota - used);
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
      style={{ maxWidth: 360 }}
    >
      <h3
        className="text-sm font-semibold uppercase tracking-wide mb-1"
        style={{ color: '#374957' }}
      >
        Fit checks this period
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        {planConfig?.name ?? plan} · resets {formatResetDate(currentPeriodEnd)}
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading quota…</p>
      ) : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span>
              <strong>{used}</strong> used
            </span>
            <span>
              <strong>{remaining}</strong> remaining
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden mb-2"
            style={{ background: '#e5e7eb' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 100 ? '#BA7517' : '#1D9E75',
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {quota} checks included
            {planConfig?.fitChecksOverageRate != null &&
              ` · £${planConfig.fitChecksOverageRate} per check above quota`}
          </p>
        </>
      )}
    </div>
  );
};

export default AgentQuotaWidget;
