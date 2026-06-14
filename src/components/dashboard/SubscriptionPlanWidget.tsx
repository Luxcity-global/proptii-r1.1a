import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { usePlan } from '../../hooks/usePlan';
import { getPlanById, type PlanId } from '../../config/plans';

function normalizePlanId(plan: string | null): PlanId {
  if (!plan || plan === 'free') return 'explorer';
  return plan as PlanId;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusBadge(status: string | null, planId: PlanId): string {
  if (planId === 'explorer') return 'Free plan';
  if (status === 'trialing') return 'Free month';
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Payment issue';
  if (status === 'canceled') return 'Canceled';
  return status ?? 'No subscription';
}

/** Dashboard card — current plan and included features from plans.ts. */
const SubscriptionPlanWidget: React.FC = () => {
  const {
    plan,
    status,
    billingCadence,
    currentPeriodEnd,
    trialEndsAt,
    hasStripeCustomer,
    loading,
  } = useBillingStatus();

  const planId = normalizePlanId(plan);
  const planConfig = usePlan(planId) ?? getPlanById(planId);
  const planName = planConfig?.name ?? 'Explorer';
  const badge = statusBadge(status, planId);
  const isPaid = planId !== 'explorer' && planConfig && !planConfig.isFree;

  const renewalLabel =
    status === 'trialing' && trialEndsAt
      ? `Trial ends ${formatDate(trialEndsAt)}`
      : isPaid
        ? `Next billing ${formatDate(currentPeriodEnd)}`
        : null;

  const includedFeatures =
    planConfig?.features.filter((f) => f.included) ?? [];
  const notIncluded =
    planConfig?.features.filter((f) => !f.included).slice(0, 3) ?? [];

  const pricingSegment =
    planConfig?.segment.includes('agent')
      ? 'agents'
      : planConfig?.segment.includes('landlord')
        ? 'landlords'
        : 'renters';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#374957' }}
          >
            Your plan
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <p
                className="text-xl md:text-2xl font-bold"
                style={{ color: '#374957' }}
              >
                {planName}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background:
                      status === 'past_due'
                        ? '#FAEEDA'
                        : status === 'trialing'
                          ? '#E8F5F0'
                          : '#F3F4F6',
                    color:
                      status === 'past_due'
                        ? '#BA7517'
                        : status === 'trialing'
                          ? '#1D9E75'
                          : '#374957',
                  }}
                >
                  {badge}
                </span>
                {isPaid && billingCadence && (
                  <span className="text-xs text-gray-500 capitalize">
                    {billingCadence} billing
                  </span>
                )}
              </div>
              {renewalLabel && (
                <p className="text-sm text-gray-500 mt-2">{renewalLabel}</p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {hasStripeCustomer ? (
            <Link
              to="/dashboard/settings"
              className="inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#DC5F12' }}
            >
              Manage billing
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#DC5F12' }}
            >
              View paid plans
            </Link>
          )}
        </div>
      </div>

      {!loading && planConfig && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: '#717182' }}
            >
              What you can access
            </h4>
            <ul className="space-y-2">
              {includedFeatures.map((f) => (
                <li
                  key={f.label}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: '#374957' }}
                >
                  <Check
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: '#1D9E75' }}
                    aria-hidden
                  />
                  <span>
                    {f.label}
                    {f.note && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {f.note}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {notIncluded.length > 0 && planId === 'explorer' && (
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: '#717182' }}
              >
                Upgrade to unlock
              </h4>
              <ul className="space-y-2">
                {notIncluded.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-start gap-2 text-sm text-gray-500"
                  >
                    <X className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`/pricing?segment=${pricingSegment}`}
                className="inline-block mt-3 text-sm font-semibold hover:underline"
                style={{ color: '#DC5F12' }}
              >
                Compare plans →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanWidget;
