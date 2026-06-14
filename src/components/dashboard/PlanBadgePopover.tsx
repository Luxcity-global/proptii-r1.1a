import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, CreditCard } from 'lucide-react';
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
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_COLOUR: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: '#E8F5F0', text: '#1D9E75', dot: '#1D9E75' },
  trialing: { bg: '#E8F5F0', text: '#1D9E75', dot: '#1D9E75' },
  past_due: { bg: '#FAEEDA', text: '#BA7517', dot: '#BA7517' },
  canceled: { bg: '#F3F4F6', text: '#717182', dot: '#aaa' },
  free:     { bg: '#F0F6FF', text: '#136C9E', dot: '#136C9E' },
};

function statusColour(status: string | null, planId: PlanId) {
  if (planId === 'explorer') return STATUS_COLOUR.free;
  return STATUS_COLOUR[status ?? ''] ?? STATUS_COLOUR.free;
}

function statusLabel(status: string | null, planId: PlanId): string {
  if (planId === 'explorer') return 'Free';
  if (status === 'trialing') return 'Trial';
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Past due';
  if (status === 'canceled') return 'Canceled';
  return 'Free';
}

/** Plan pill in the dashboard header — hover reveals a details popover. */
const PlanBadgePopover: React.FC = () => {
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
  const colours = statusColour(status, planId);
  const badge = statusLabel(status, planId);
  const isPaid = planId !== 'explorer' && planConfig && !planConfig.isFree;

  const renewalLine =
    status === 'trialing' && trialEndsAt
      ? `Trial ends ${formatDate(trialEndsAt)}`
      : isPaid && currentPeriodEnd
        ? `Renews ${formatDate(currentPeriodEnd)}`
        : null;

  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  if (loading) return null;

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Pill */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-shadow focus:outline-none focus-visible:ring-2"
        style={{
          background: colours.bg,
          color: colours.text,
          borderColor: colours.bg,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: colours.dot }}
        />
        {planName}
        <span className="opacity-70 ml-0.5 hidden sm:inline">· {badge}</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
          onMouseEnter={show}
          onMouseLeave={hide}
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-sm" style={{ color: '#374957' }}>
                {planName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: colours.dot }}
                />
                <span className="text-xs" style={{ color: colours.text }}>
                  {badge}
                </span>
                {isPaid && billingCadence && (
                  <span className="text-xs text-gray-400 capitalize">
                    · {billingCadence}
                  </span>
                )}
              </div>
              {renewalLine && (
                <p className="text-xs text-gray-400 mt-1">{renewalLine}</p>
              )}
            </div>
            <CreditCard
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: '#136C9E' }}
            />
          </div>

          {/* Features */}
          {planConfig && (
            <div className="mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#717182' }}
              >
                What's included
              </p>
              <ul className="space-y-1.5">
                {planConfig.features
                  .filter((f) => f.included)
                  .map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start gap-2 text-xs"
                      style={{ color: '#374957' }}
                    >
                      <Check
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        style={{ color: '#1D9E75' }}
                        aria-hidden
                      />
                      {f.label}
                    </li>
                  ))}
                {planConfig.features
                  .filter((f) => !f.included)
                  .slice(0, 3)
                  .map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start gap-2 text-xs text-gray-400"
                    >
                      <X
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        aria-hidden
                      />
                      {f.label}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-gray-100 pt-3 flex gap-2">
            {hasStripeCustomer ? (
              <Link
                to="/dashboard/settings"
                className="flex-1 text-center text-xs font-semibold py-2 rounded-lg text-white transition-colors"
                style={{ background: '#DC5F12' }}
                onClick={() => setOpen(false)}
              >
                Manage billing
              </Link>
            ) : (
              <Link
                to="/pricing"
                className="flex-1 text-center text-xs font-semibold py-2 rounded-lg text-white transition-colors"
                style={{ background: '#DC5F12' }}
                onClick={() => setOpen(false)}
              >
                Upgrade plan
              </Link>
            )}
            <Link
              to="/dashboard/settings"
              className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanBadgePopover;
