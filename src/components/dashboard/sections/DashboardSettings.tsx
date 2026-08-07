import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  CreditCard,
  LogOut,
  User,
  Shield,
  Bell,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { usePlan } from '../../../hooks/usePlan';
import { getPlanById } from '../../../config/plans';
import { createBillingPortalSession } from '../../../services/billingService';
import type { PlanId } from '../../../config/plans';
import PlanCompareModal from '../../billing/PlanCompareModal';

/* ─────────────────────────── helpers ─────────────────────────── */

function normalizePlanId(plan: string | null): PlanId {
  return (plan === 'free' ? 'explorer' : plan ?? 'explorer') as PlanId;
}

function statusLabel(status: string | null): string {
  if (!status) return 'No subscription';
  if (status === 'trialing') return 'Free trial';
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Payment issue';
  if (status === 'canceled') return 'Cancelled';
  return status;
}

function statusColor(status: string | null): string {
  if (status === 'active') return '#15803d';
  if (status === 'trialing') return '#0369a1';
  if (status === 'past_due') return '#b91c1c';
  if (status === 'canceled') return '#6b7280';
  return '#374957';
}

function statusBg(status: string | null): string {
  if (status === 'active') return '#dcfce7';
  if (status === 'trialing') return '#e0f2fe';
  if (status === 'past_due') return '#fee2e2';
  if (status === 'canceled') return '#f3f4f6';
  return '#f3f4f6';
}

/* ─────────────────────── sub-components ──────────────────────── */

interface SettingsRowProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  description,
  action,
  onClick,
  destructive = false,
}) => (
  <div
    className={`flex items-center justify-between py-4 px-0 transition-colors ${
      onClick ? 'cursor-pointer group' : ''
    }`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className="flex-1 min-w-0 pr-6">
      <p
        className="text-sm font-medium"
        style={{ color: destructive ? '#b91c1c' : '#1a2332' }}
      >
        {title}
      </p>
      {description && (
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b7280' }}>
          {description}
        </p>
      )}
    </div>
    {action ?? (
      onClick && (
        <ChevronRight
          className="flex-shrink-0 w-4 h-4 transition-transform group-hover:translate-x-0.5"
          style={{ color: '#9ca3af' }}
        />
      )
    )}
  </div>
);

interface SettingsGroupProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ label, icon, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0 md:gap-8 py-8 border-b last:border-b-0" style={{ borderColor: '#ebebeb' }}>
    {/* Category label */}
    <div className="mb-4 md:mb-0 flex md:flex-col md:items-start items-center gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0f6fb' }}>
        {icon}
      </div>
      <p className="text-sm font-semibold" style={{ color: '#374957' }}>{label}</p>
    </div>

    {/* Rows */}
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#ebebeb' }}>
      <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {React.Children.map(children, (child, i) => (
          <div key={i} className="px-5">{child}</div>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────────────── main component ───────────────────────── */

const DashboardSettings: React.FC = () => {
  const { user, logout, editProfile } = useAuth();
  const navigate = useNavigate();
  const currentRole = user?.roles?.[0] ?? null;
  // Only landlords and agents can switch roles — tenants have no other dashboard
  // to switch to, and ProtectedRoute would redirect them back immediately anyway.
  const canSwitchRole = currentRole === 'landlord' || currentRole === 'agent';

  const {
    plan,
    status,
    billingCadence,
    currentPeriodEnd,
    trialEndsAt,
    cancelAtPeriodEnd,
    hasStripeCustomer,
    loading,
    refresh,
  } = useBillingStatus();

  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const displayPlanId = normalizePlanId(plan);
  const planConfig = usePlan(displayPlanId) ?? getPlanById(displayPlanId);
  const planName = planConfig?.name ?? 'Explorer';

  const isFreePlan = !plan || plan === 'free' || plan === 'explorer';

  const cycleLabel =
    billingCadence === 'monthly' ? 'Monthly' : billingCadence === 'annual' ? 'Annual' : '—';

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—';

  const nextBillingDate = cancelAtPeriodEnd
    ? `Cancels ${formatDate(currentPeriodEnd)}`
    : formatDate(currentPeriodEnd);

  const openPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { portalUrl } = await createBillingPortalSession();
      window.location.href = portalUrl;
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : 'Could not open billing portal.');
      setPortalBusy(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutBusy(true);
    try {
      await logout();
      navigate('/');
    } catch {
      setSignOutBusy(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Page title — left-aligned, spaced below top nav */}
      <div className="w-full text-left mt-6 md:mt-8 mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1a2332' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Manage your account, subscription, and preferences.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
      {/* ── Profile ── */}
      <SettingsGroup
        label="Profile"
        icon={<User className="w-4 h-4" style={{ color: '#136C9E' }} />}
      >
        <SettingsRow
          title="Display name"
          description={user?.name || user?.givenName || '—'}
          onClick={editProfile}
          action={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); editProfile(); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-orange-50"
              style={{ color: '#DC5F12', borderColor: '#DC5F12' }}
            >
              Edit
            </button>
          }
        />
        <SettingsRow
          title="Email address"
          description={user?.email || '—'}
          action={
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#f3f4f6', color: '#6b7280' }}>
              Managed by provider
            </span>
          }
        />
        {user?.phone && (
          <SettingsRow
            title="Phone number"
            description={user.phone}
            action={
              <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                Managed by provider
              </span>
            }
          />
        )}
      </SettingsGroup>

      {/* ── Plan ── */}
      <SettingsGroup
        label="Plan"
        icon={<Zap className="w-4 h-4" style={{ color: '#136C9E' }} />}
      >
        {/* Current plan row */}
        <SettingsRow
          title="Current plan"
          description={
            loading
              ? 'Loading…'
              : `${planName}${isFreePlan ? ' — free, no billing' : ''}`
          }
          action={
            <div className="flex items-center gap-2">
              {!loading && status && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: statusColor(status),
                    backgroundColor: statusBg(status),
                  }}
                >
                  {statusLabel(status)}
                </span>
              )}
              {!isFreePlan && (
                <button
                  type="button"
                  onClick={() => setShowPlansModal(true)}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-orange-50"
                  style={{ color: '#DC5F12', borderColor: '#DC5F12', whiteSpace: 'nowrap' }}
                >
                  View plans
                </button>
              )}
            </div>
          }
        />

        {/* Upgrade / View plans */}
        {isFreePlan ? (
          <SettingsRow
            title="Upgrade your plan"
            description="Unlock referencing, contracts, smart search, and more with a Renter Pro or Agent plan."
            action={
              <button
                type="button"
                onClick={() => setShowPlansModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                style={{
                  backgroundColor: '#DC5F12',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                View plans
              </button>
            }
          />
        ) : (
          <>
            <SettingsRow
              title="Billing cycle"
              description={cycleLabel}
            />
            {status === 'trialing' && trialEndsAt && (
              <SettingsRow
                title="Trial ends"
                description={formatDate(trialEndsAt)}
              />
            )}
            {currentPeriodEnd && status !== 'trialing' && (
              <SettingsRow
                title={cancelAtPeriodEnd ? 'Subscription ends' : 'Next billing date'}
                description={nextBillingDate}
              />
            )}
            {hasStripeCustomer && (
              <SettingsRow
                title="Cancel plan"
                description="Cancel your current subscription via the billing portal."
                onClick={openPortal}
              />
            )}
          </>
        )}
      </SettingsGroup>

      {/* ── Billing (only if Stripe customer) ── */}
      {hasStripeCustomer && (
        <SettingsGroup
          label="Billing"
          icon={<CreditCard className="w-4 h-4" style={{ color: '#136C9E' }} />}
        >
          <SettingsRow
            title="Payment details"
            description="Update your saved card or payment method."
            onClick={portalBusy ? undefined : openPortal}
            action={
              portalBusy ? (
                <span className="text-xs" style={{ color: '#9ca3af' }}>Opening…</span>
              ) : (
                <ChevronRight className="flex-shrink-0 w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: '#9ca3af' }} />
              )
            }
          />
          <SettingsRow
            title="Invoice history"
            description="View and download past invoices."
            onClick={portalBusy ? undefined : openPortal}
            action={
              portalBusy ? (
                <span className="text-xs" style={{ color: '#9ca3af' }}>Opening…</span>
              ) : (
                <ChevronRight className="flex-shrink-0 w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: '#9ca3af' }} />
              )
            }
          />
          <SettingsRow
            title="Manage billing"
            description="Full access to your Stripe billing portal — plans, payments, invoices."
            onClick={portalBusy ? undefined : openPortal}
            action={
              <button
                type="button"
                disabled={portalBusy}
                onClick={(e) => { e.stopPropagation(); openPortal(); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-orange-50 disabled:opacity-50"
                style={{ color: '#DC5F12', borderColor: '#DC5F12', whiteSpace: 'nowrap' }}
              >
                {portalBusy ? 'Opening…' : 'Open portal'}
              </button>
            }
          />
          {portalError && (
            <div className="py-3">
              <p className="text-xs" style={{ color: '#b91c1c' }}>{portalError}</p>
            </div>
          )}
        </SettingsGroup>
      )}

      {/* ── Notifications (placeholder) ── */}
      <SettingsGroup
        label="Notifications"
        icon={<Bell className="w-4 h-4" style={{ color: '#136C9E' }} />}
      >
        <SettingsRow
          title="Email notifications"
          description="Receive updates about your viewings, referencing progress, and account activity."
          action={
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#f3f4f6', color: '#6b7280' }}>
              Coming soon
            </span>
          }
        />
        <SettingsRow
          title="Billing alerts"
          description="Get notified before your subscription renews or when a payment fails."
          action={
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#f3f4f6', color: '#6b7280' }}>
              Coming soon
            </span>
          }
        />
      </SettingsGroup>

      {/* ── Account ── */}
      <SettingsGroup
        label="Account"
        icon={<Shield className="w-4 h-4" style={{ color: '#136C9E' }} />}
      >
        <SettingsRow
          title="Edit profile"
          description="Update your name, email, or password via your account provider."
          onClick={editProfile}
        />
        {canSwitchRole && (
          <SettingsRow
            title="Switch account role"
            description={`Currently active as: ${currentRole}. Switch to your tenant view.`}
            onClick={() => navigate('/select-role')}
            action={
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigate('/select-role'); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-50"
                style={{ color: '#136C9E', borderColor: '#136C9E' }}
              >
                Switch role
              </button>
            }
          />
        )}
        <SettingsRow
          title="Sign out"
          description="Sign out of your Proptii account on this device."
          destructive
          onClick={signOutBusy ? undefined : handleSignOut}
          action={
            signOutBusy ? (
              <span className="text-xs" style={{ color: '#9ca3af' }}>Signing out…</span>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50"
                style={{ color: '#b91c1c', border: '1px solid #fca5a5' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            )
          }
        />
      </SettingsGroup>

      {/* Footer */}
      <div className="pt-6 pb-12 flex items-center justify-between">
        <button
          type="button"
          onClick={() => refresh()}
          className="text-xs hover:underline"
          style={{ color: '#DC5F12', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Refresh account data
        </button>
        <span className="text-xs" style={{ color: '#d1d5db' }}>
          Proptii · {new Date().getFullYear()}
        </span>
      </div>

      </div>

      {/* Plans comparison modal */}
      <PlanCompareModal
        open={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        currentPlanId={plan as PlanId | null}
      />
    </div>
  );
};

export default DashboardSettings;
