import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Minus, Zap } from 'lucide-react';
import {
  getPlansForAudienceTab,
  getDisplayPrice,
  getStripePriceId,
  type PlanConfig,
  type PlanId,
} from '../../config/plans';
import {
  createCheckoutSession,
  setPendingPlan,
} from '../../services/billingService';
import { markPendingStripeCheckout } from '../../utils/pricingRoutes';
import { trackEvent } from '../../utils/analytics';

/* ─────────────────────── types ─────────────────────── */

type Audience = 'renters' | 'landlords' | 'agents';
type Cycle = 'monthly' | 'annual';

interface Props {
  open: boolean;
  onClose: () => void;
  /** The user's current plan ID so we can badge it */
  currentPlanId: PlanId | string | null;
  /** Pre-select the audience tab based on user's segment */
  defaultAudience?: Audience;
}

/* ─────────────────── helpers ─────────────────────── */

function inferAudience(planId: PlanId | string | null): Audience {
  if (!planId || planId === 'explorer') return 'renters';
  if (['renter_pro', 'buyer_pro'].includes(planId)) return 'renters';
  if (['starter', 'landlord_pro', 'elite'].includes(planId)) return 'landlords';
  if (['independent', 'agent_pro', 'enterprise'].includes(planId)) return 'agents';
  return 'renters';
}

function formatPrice(amount: number | null): string {
  if (amount === null) return 'Custom';
  if (amount === 0) return 'Free';
  return `£${amount}`;
}

/* ─────────────────── PlanCard ─────────────────────── */

interface PlanCardProps {
  plan: PlanConfig;
  cycle: Cycle;
  isCurrent: boolean;
  onUpgrade: (plan: PlanConfig) => void;
  upgrading: string | null;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  cycle,
  isCurrent,
  onUpgrade,
  upgrading,
}) => {
  const { amount, note } = getDisplayPrice(plan, cycle);
  const isUpgrading = upgrading === plan.id;

  return (
    <div
      className="flex flex-col rounded-2xl border overflow-hidden flex-shrink-0"
      style={{
        width: 220,
        minWidth: 200,
        borderColor: isCurrent ? '#136C9E' : plan.isDark ? '#1a2332' : '#e5e7eb',
        backgroundColor: plan.isDark ? '#1a2332' : '#ffffff',
        boxShadow: isCurrent
          ? '0 0 0 2px #136C9E'
          : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* Popular badge */}
      {plan.isPopular && !isCurrent && (
        <div
          className="absolute top-0 right-0 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl"
          style={{ backgroundColor: '#DC5F12' }}
        >
          Most popular
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div
          className="absolute top-0 right-0 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl"
          style={{ backgroundColor: '#136C9E' }}
        >
          Current plan
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Plan name */}
        <p
          className="text-sm font-bold mb-1"
          style={{ color: plan.isDark ? '#ffffff' : '#1a2332' }}
        >
          {plan.name}
        </p>

        {/* Price */}
        <div className="mb-1">
          {plan.isContactSales ? (
            <p className="text-2xl font-bold" style={{ color: plan.isDark ? '#ffffff' : '#1a2332' }}>
              Custom
            </p>
          ) : (
            <p className="text-2xl font-bold" style={{ color: plan.isDark ? '#ffffff' : '#1a2332' }}>
              {formatPrice(amount)}
              {amount !== null && amount > 0 && (
                <span className="text-sm font-normal" style={{ color: plan.isDark ? '#9ca3af' : '#6b7280' }}>
                  /mo
                </span>
              )}
            </p>
          )}
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: plan.isDark ? '#6b7280' : '#9ca3af' }}>
            {plan.isContactSales ? 'Annual contract' : note}
          </p>
        </div>

        {/* Divider */}
        <div className="my-3 border-t" style={{ borderColor: plan.isDark ? '#374957' : '#f3f4f6' }} />

        {/* CTA */}
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="w-full py-2 rounded-lg text-xs font-semibold mb-4"
            style={{
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              cursor: 'default',
            }}
          >
            Current plan
          </button>
        ) : plan.isContactSales ? (
          <a
            href="mailto:hello@proptii.com?subject=Enterprise%20enquiry"
            className="w-full py-2 rounded-lg text-xs font-semibold mb-4 text-center block transition-colors hover:opacity-90"
            style={{ backgroundColor: '#374957', color: '#ffffff' }}
          >
            Contact sales
          </a>
        ) : plan.isFree ? (
          <button
            type="button"
            disabled
            className="w-full py-2 rounded-lg text-xs font-semibold mb-4"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'default' }}
          >
            Free forever
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUpgrade(plan)}
            disabled={isUpgrading}
            className="w-full py-2 rounded-lg text-xs font-semibold mb-4 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: plan.isDark ? '#ffffff' : '#136C9E',
              color: plan.isDark ? '#1a2332' : '#ffffff',
            }}
          >
            {isUpgrading ? 'Redirecting…' : 'Upgrade'}
          </button>
        )}

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              {f.included ? (
                <Check
                  className="flex-shrink-0 mt-0.5 w-3.5 h-3.5"
                  style={{ color: plan.isDark ? '#34d399' : '#15803d' }}
                />
              ) : (
                <Minus
                  className="flex-shrink-0 mt-0.5 w-3.5 h-3.5"
                  style={{ color: '#d1d5db' }}
                />
              )}
              <span
                className="text-[11px] leading-snug"
                style={{ color: f.included ? (plan.isDark ? '#e5e7eb' : '#374957') : '#9ca3af' }}
              >
                {f.label}
                {f.note && (
                  <span className="block text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
                    {f.note}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ────────────────── main modal ───────────────────── */

const PlanCompareModal: React.FC<Props> = ({
  open,
  onClose,
  currentPlanId,
  defaultAudience,
}) => {
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [audience, setAudience] = useState<Audience>(
    defaultAudience ?? inferAudience(currentPlanId),
  );
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  /* Reset tab when modal opens */
  useEffect(() => {
    if (open) {
      setAudience(defaultAudience ?? inferAudience(currentPlanId));
      setUpgradeError(null);
    }
  }, [open, currentPlanId, defaultAudience]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const plans = getPlansForAudienceTab(audience);

  const handleUpgrade = async (plan: PlanConfig) => {
    const priceId = getStripePriceId(plan, cycle);
    if (!priceId) {
      /* No Stripe price yet — fall through to pricing page */
      navigate(`/pricing?plan=${plan.id}&cycle=${cycle}`);
      onClose();
      return;
    }
    setUpgrading(plan.id);
    setUpgradeError(null);
    try {
      await setPendingPlan(plan.id, cycle);
      markPendingStripeCheckout('pay_now');
      trackEvent('billing_checkout_started', {
        plan_id: plan.id,
        cycle,
        trial_enabled: false,
        source: 'settings_plan_modal',
      });
      const { checkoutUrl } = await createCheckoutSession(priceId, false);
      window.location.href = checkoutUrl;
    } catch (err) {
      setUpgradeError(
        err instanceof Error ? err.message : 'Could not start checkout.',
      );
      setUpgrading(null);
    }
  };

  const TABS: { id: Audience; label: string }[] = [
    { id: 'renters', label: 'Renters & Buyers' },
    { id: 'landlords', label: 'Landlords' },
    { id: 'agents', label: 'Agents' },
  ];

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          fontFamily: 'Archivo, sans-serif',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(220,95,18,0.08)',
        }}
      >
        {/* Accent stripe */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #DC5F12 0%, #f59e42 50%, #DC5F12 100%)',
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#fff4ec' }}
            >
              <Zap className="w-4 h-4" style={{ color: '#DC5F12' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#1a2332' }}>
                Get more out of Proptii as you grow
              </h2>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Compare plans and upgrade at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {/* Billing toggle */}
            <div
              className="flex items-center rounded-lg border p-0.5 text-xs"
              style={{ borderColor: '#e5e7eb' }}
            >
              {(['monthly', 'annual'] as Cycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className="px-3 py-1.5 rounded-md font-medium transition-colors capitalize"
                  style={{
                    backgroundColor: cycle === c ? '#136C9E' : 'transparent',
                    color: cycle === c ? '#ffffff' : '#374957',
                  }}
                >
                  {c}
                  {c === 'annual' && (
                    <span
                      className="ml-1 text-[10px] font-bold px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: cycle === 'annual' ? 'rgba(255,255,255,0.25)' : '#fff4ec',
                        color: cycle === 'annual' ? '#ffffff' : '#DC5F12',
                      }}
                    >
                      Save
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: '#6b7280' }} />
            </button>
          </div>
        </div>

        {/* Audience tabs */}
        <div className="px-6 pb-0 flex justify-center gap-1 border-b" style={{ borderColor: '#f3f4f6' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAudience(tab.id)}
              className="px-3 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: audience === tab.id ? '#136C9E' : '#6b7280',
                fontWeight: audience === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
              {audience === tab.id && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: '#DC5F12' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Plan columns — centered, scrollable on small screens */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #fffaf7 0%, #ffffff 120px)' }}
        >
          <div className="px-6 py-6 flex justify-center">
            <div
              className="flex flex-wrap justify-center gap-4 pb-2 w-full"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {plans.map((plan) => (
                <div key={plan.id} style={{ scrollSnapAlign: 'center' }}>
                  <PlanCard
                    plan={plan}
                    cycle={cycle}
                    isCurrent={
                      plan.id === currentPlanId ||
                      (plan.isFree && (!currentPlanId || currentPlanId === 'free' || currentPlanId === 'explorer'))
                    }
                    onUpgrade={handleUpgrade}
                    upgrading={upgrading}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error + footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: '#f3f4f6' }}>
          {upgradeError && (
            <p className="text-xs mb-2" style={{ color: '#b91c1c' }}>
              {upgradeError}
            </p>
          )}
          <p className="text-xs text-center" style={{ color: '#9ca3af' }}>
            All plans include a 1-month free trial.{' '}
            <a
              href="/pricing"
              className="underline font-medium hover:opacity-80"
              style={{ color: '#DC5F12' }}
            >
              Full pricing page →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanCompareModal;
