import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS } from "../Dashboard";
import { ChevronLeft, ChevronRight, Home, User, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import { getPlanById, type PlanId } from '../../../config/plans';
import PlanCompareModal from '../../billing/PlanCompareModal';

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

/**
 * Returns the badge label for a given unread count:
 *   0        → null (badge hidden)
 *   1–99     → numeric string
 *   100+     → "99+"
 */
export function getUnreadBadgeLabel(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return '99+';
  return String(count);
}

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useMessagingContext();
  const { plan, status, hasStripeCustomer, loading: billingLoading, refresh } = useBillingStatus();
  const [avatarError, setAvatarError] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  const normalizedPlanId: PlanId = !plan || plan === 'free' ? 'explorer' : (plan as PlanId);
  const planConfig = getPlanById(normalizedPlanId);
  const tierName = planConfig?.name ?? 'Explorer';
  const isPaidTier = Boolean(planConfig && !planConfig.isFree && normalizedPlanId !== 'explorer');
  const canUpgradeTier = !['buyer_pro', 'elite', 'enterprise'].includes(normalizedPlanId);

  const displayName =
    user?.name?.trim() ||
    [user?.givenName, user?.familyName].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    'User';

  const initials = (() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  })();

  const handleNavClick = (sectionId: string, path: string) => {
    onSectionChange(sectionId);
    navigate(path);
  };

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <div
      className="group peer hidden md:block"
      style={{ color: '#374957' }}
    >
      {/* Sidebar Container */}
      <div
        className="fixed inset-y-0 left-0 z-10 h-screen transition-all duration-300 ease-out bg-white border-r"
        style={{
          width: isCollapsed ? '56px' : '200px',
          borderColor: '#ebebeb',
          fontFamily: 'Archivo, sans-serif'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b" style={{ borderColor: '#ebebeb' }}>
            <div className={`pt-2 pb-2 ${isCollapsed ? 'px-2' : 'pl-4 pr-2'}`}>
              <div className={`flex items-center h-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                {isCollapsed ? (
                  <img
                    src="/images/Proptii ico.png"
                    alt="Proptii Logo"
                    className="w-8 h-8 object-contain flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleLogoClick}
                    title="Go to Home"
                  />
                ) : (
                  <img
                    src="/images/proptii-logo.png"
                    alt="Proptii Logo"
                    className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleLogoClick}
                    title="Go to Home"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto">
            <div className="pt-2 pb-2 pl-4 pr-2">
              <div className="space-y-3">
                {DASHBOARD_SECTIONS.map((section) => {
                  if (!section) return null;
                  const isActive = activeSection === section.id;
                  const badgeLabel = section.id === 'messages' ? getUnreadBadgeLabel(unreadCount) : null;
                  const hasAccess = canAccessSection(section.id, plan, status);
                  const upgradeLabel = sectionUpgradeLabel(section.id);

                  if (!hasAccess) {
                    return (
                      <div key={section.id} className="relative group/locked">
                        <button
                          type="button"
                          onClick={() => handleNavClick(section.id, section.path)}
                          title={isCollapsed ? upgradeLabel : undefined}
                          className={`
                            w-full flex items-center h-10 px-3 rounded-md text-sm font-medium
                            opacity-50 cursor-pointer transition-opacity hover:opacity-70
                            ${isCollapsed ? 'justify-center' : 'justify-start'}
                          `}
                          style={{
                            color: isActive ? '#136C9E' : '#374957',
                            backgroundColor: isActive ? '#E6F3FF' : 'transparent',
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            {section.icon?.(false)}
                            <Lock
                              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 text-gray-500 bg-white rounded-full"
                              aria-hidden
                            />
                          </div>
                          {!isCollapsed && (
                            <>
                              <span className="ml-2 truncate">{section.label}</span>
                              <Lock className="w-3 h-3 ml-auto shrink-0 text-gray-400" aria-hidden />
                            </>
                          )}
                        </button>
                        {/* Tooltip for locked item (expanded sidebar) */}
                        {!isCollapsed && (
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover/locked:flex w-52 bg-gray-900 text-white text-xs rounded-lg p-2.5 leading-relaxed shadow-lg pointer-events-none">
                            <span>{upgradeLabel}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleNavClick(section.id, section.path)}
                      className={`
                        w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                      `}
                      style={{
                        alignItems: 'center',
                        color: isActive ? '#136C9E' : '#374957',
                        backgroundColor: isActive ? '#E6F3FF' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        {section.icon?.(isActive)}
                        {badgeLabel !== null && (
                          <span
                            data-testid="unread-badge"
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-8px',
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 700,
                              lineHeight: 1,
                              minWidth: '16px',
                              height: '16px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 3px',
                              pointerEvents: 'none',
                            }}
                          >
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="ml-2 truncate">{section.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Profile & Subscription Tier */}
          {user && (
            <div className="border-t" style={{ borderColor: '#ebebeb' }}>
              <div className={`py-2.5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}
                  title={isCollapsed ? `${displayName} · ${tierName}` : undefined}
                >
                  {user.photoURL && !avatarError ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      onError={() => setAvatarError(true)}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-slate-200"
                    />
                  ) : initials ? (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ backgroundColor: '#E6F3FF', color: '#136C9E' }}
                      aria-label={displayName}
                    >
                      {initials}
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" style={{ color: '#374957' }} />
                    </div>
                  )}
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold leading-tight" style={{ color: '#374957' }}>
                        {displayName}
                      </div>
                      <div className="truncate text-[11px] opacity-70 leading-tight mt-0.5" style={{ color: '#374957' }}>
                        {user.email || ''}
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      data-testid="sidebar-tier-badge"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate min-w-0"
                      style={
                        isPaidTier
                          ? { backgroundColor: '#E8F5F0', color: '#1D9E75' }
                          : { backgroundColor: '#F0F6FF', color: '#136C9E' }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isPaidTier ? '#1D9E75' : '#136C9E' }}
                        aria-hidden
                      />
                      <span className="truncate">{billingLoading ? 'Plan…' : tierName}</span>
                    </span>

                    {!billingLoading && (
                      canUpgradeTier ? (
                        <button
                          type="button"
                          onClick={() => setUpgradeModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #DC5F12 0%, #F15A22 100%)',
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" aria-hidden />
                          <span>Upgrade</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNavClick('settings', '/dashboard/settings')}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex-shrink-0"
                          style={{ color: '#374957' }}
                        >
                          Manage
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trigger */}
          <div className="border-t" style={{ borderColor: '#ebebeb' }}>
            <div className={`pt-2 pb-2 space-y-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
              {/* Collapse/Expand Trigger */}
              <button
                onClick={onToggleCollapse}
                className={`w-full flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ${
                  isCollapsed ? 'h-10' : 'h-8 px-2'
                }`}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" style={{ color: '#374957' }} />
                ) : (
                  <ChevronLeft className="h-4 w-4" style={{ color: '#374957' }} />
                )}
              </button>

              {/* Proptii Home Button */}
              {(user?.role === 'landlord' || user?.role === 'agent' || user?.roles?.includes('landlord') || user?.roles?.includes('agent')) && (
                <button
                  onClick={() => { window.location.href = user?.role === 'agent' ? '/agent' : '/landlord'; }}
                  className={`w-full flex items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors text-xs font-semibold mb-2 ${
                    isCollapsed ? 'h-10' : 'h-8 px-2'
                  }`}
                  title="Return to Landlord Portal"
                >
                  {isCollapsed ? 'L' : 'Return to Landlord'}
                </button>
              )}
              {isCollapsed ? (
                <button
                  onClick={handleLogoClick}
                  className="w-full flex items-center justify-center h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  title="Go to Home"
                >
                  <Home className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleLogoClick}
                  className="w-full flex items-center justify-center h-8 px-2 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium"
                  title="Go to Home"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Proptii Home
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for content */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          width: isCollapsed ? '56px' : '200px'
        }}
      />

      {upgradeModalOpen && (
        <PlanCompareModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlanId={normalizedPlanId}
          billingStatus={{ hasStripeCustomer, status }}
          onUpgradeSuccess={refresh}
        />
      )}
    </div>
  );
};

export default DashboardSidebar;
