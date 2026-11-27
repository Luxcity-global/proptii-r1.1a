import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  FileText,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  CalendarDays,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import {
  SidebarProvider,
  useSidebar,
} from './ui/sidebar';
import { UserProfile, UserRole } from '../App';
import LandlordDashboardHeader from './LandlordDashboardHeader';
import LandlordPlanCompareModal from './LandlordPlanCompareModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useIsMobile } from './ui/use-mobile';
import { useLandlordBillingStatus } from '../hooks/useLandlordBillingStatus';
import AuthContext from '../../../contexts/AuthContext';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import {
  LANDLORD_TOP_PLANS,
  resolveSidebarTierState,
  resolveUserDisplay,
  type SidebarTierPillStyle,
} from '../../../utils/subscriptionDisplay';
import { MobileHeaderTopBar } from '../../../components/common/MobileHeaderTopBar';
import { MobileBottomNav } from '../../../components/common/MobileBottomNav';
import { MobileCommandSheet } from '../../../components/common/MobileCommandSheet';
import '../styles/sidebarOverview.css';

const proptiiLogoSmall = '/images/Proptii ico.png';

const requestSignIn = () => {
  if (window.self !== window.top) {
    window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: {} }, '*');
  } else {
    window.dispatchEvent(new CustomEvent('require-auth', { detail: {} }));
  }
};

export type NavigationScreen =
  | 'dashboard'
  | 'properties'
  | 'documents'
  | 'viewings'
  | 'clients'
  | 'insights'
  | 'inbox'
  | 'contracts'
  | 'messages'
  | 'settings'
  | 'referencing';

interface MainLayoutProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  onQuickAction?: (actionId: string) => void;
  userProfile: UserProfile | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  children: React.ReactNode;
}

type NavItem = {
  id: NavigationScreen;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hasNotification?: boolean;
  /** Numeric badge count — shown as a red pill instead of the plain dot */
  unreadBadge?: number;
};

const screenToPath: Record<NavigationScreen, string> = {
  dashboard: '/dashboard',
  viewings: '/viewings',
  properties: '/properties',
  documents: '/documents',
  contracts: '/contracts',
  clients: '/clients',
  insights: '/insights',
  inbox: '/inbox',
  messages: '/messages',
  settings: '/settings',
  referencing: '/referencing',
};

function goHomeOrSignIn(userProfile: UserProfile | null) {
  if (!userProfile) {
    requestSignIn();
  } else {
    window.location.href = '/';
  }
}

function SidebarBrand({ userProfile, collapsed }: { userProfile: UserProfile | null; collapsed?: boolean }) {
  return (
    <button
      type="button"
      className="ll-sidebar-brand"
      onClick={() => goHomeOrSignIn(userProfile)}
      title="Go to Tenant App"
    >
      <img src={proptiiLogoSmall} alt="Proptii" className="ll-sidebar-brand-icon" />
      {!collapsed && <span className="ll-sidebar-brand-title">proptii</span>}
    </button>
  );
}

function SidebarNavList({
  navigationItems,
  currentScreen,
  onNavigate,
  collapsed,
  onItemClick,
}: {
  navigationItems: NavItem[];
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const location = useLocation();

  return (
    <ul className="ll-sidebar-nav">
      {navigationItems.map((item) => {
        const path = screenToPath[item.id] || '/dashboard';
        const currentPath = location.pathname.startsWith('/landlord')
          ? location.pathname.slice('/landlord'.length) || '/'
          : location.pathname;
        const isActive = currentPath === path || currentScreen === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              className={`ll-sidebar-nav-item${isActive ? ' is-active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                onItemClick?.();
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="ll-sidebar-nav-icon-wrap">
                <item.icon className="w-5 h-5" />
                {item.hasNotification && <span className="ll-sidebar-nav-dot" />}
                {(item.unreadBadge ?? 0) > 0 && (
                  <span
                    aria-label={`${item.unreadBadge} unread`}
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
                    {(item.unreadBadge ?? 0) > 99 ? '99+' : String(item.unreadBadge)}
                  </span>
                )}
              </span>
              <span className="ll-sidebar-nav-text">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface SidebarUserCardProps {
  userProfile: UserProfile | null;
  fallbackPhotoUrl?: string | null;
  collapsed?: boolean;
  tierName: string;
  tierPillStyle: SidebarTierPillStyle;
  billingLoading: boolean;
  canUpgradeTier: boolean;
  onUpgrade: () => void;
  onManage: () => void;
}

function SidebarUserCard({
  userProfile,
  fallbackPhotoUrl,
  collapsed,
  tierName,
  tierPillStyle,
  billingLoading,
  canUpgradeTier,
  onUpgrade,
  onManage,
}: SidebarUserCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const { displayName, initials, photoUrl } = resolveUserDisplay(
    userProfile
      ? {
          ...userProfile,
          photoURL: userProfile.photoURL || fallbackPhotoUrl || undefined,
        }
      : null,
  );

  useEffect(() => {
    setAvatarError(false);
  }, [photoUrl]);

  if (!userProfile) return null;

  return (
    <div
      className="ll-sidebar-user"
      title={collapsed ? `${displayName} · ${tierName}` : undefined}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        {photoUrl && !avatarError ? (
          <img
            src={photoUrl}
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
            <User className="h-4 w-4 text-slate-600" />
          </div>
        )}

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="ll-sidebar-user-name">{displayName}</div>
            <div className="ll-sidebar-user-email">{userProfile.email}</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span
            data-testid="landlord-sidebar-tier-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate min-w-0"
            style={{
              backgroundColor: tierPillStyle.bg,
              color: tierPillStyle.text,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tierPillStyle.dot }}
              aria-hidden
            />
            <span className="truncate">{billingLoading ? 'Plan…' : tierName}</span>
          </span>

          {!billingLoading && (
            canUpgradeTier ? (
              <button
                type="button"
                onClick={onUpgrade}
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
                onClick={onManage}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0"
              >
                Manage
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface SidebarUserCardSectionProps {
  fallbackPhotoUrl?: string | null;
  tierName: string;
  tierPillStyle: SidebarTierPillStyle;
  billingLoading: boolean;
  canUpgradeTier: boolean;
  onUpgrade: () => void;
  onManage: () => void;
}

function CustomSidebar({
  navigationItems,
  currentScreen,
  onNavigate,
  userProfile,
  userCardProps,
}: {
  navigationItems: NavItem[];
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  userCardProps: SidebarUserCardSectionProps;
}) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="group peer hidden md:block" data-collapsible="icon">
      <aside
        className={`ll-sidebar fixed inset-y-0 left-0 z-10 h-screen transition-all duration-300 ease-out${
          isCollapsed ? ' is-collapsed' : ''
        }`}
        style={{
          width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
      >
        <div className="ll-sidebar-inner">
          <SidebarBrand userProfile={userProfile} collapsed={isCollapsed} />

          <SidebarNavList
            navigationItems={navigationItems}
            currentScreen={currentScreen}
            onNavigate={onNavigate}
            collapsed={isCollapsed}
          />

          <button
            type="button"
            className="ll-sidebar-collapse"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          </button>

          <SidebarUserCard
            userProfile={userProfile}
            collapsed={isCollapsed}
            {...userCardProps}
          />
        </div>
      </aside>

      <div
        className="transition-all duration-300 ease-out"
        style={{
          width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
      />
    </div>
  );
}

function MobileSidebar({
  navigationItems,
  currentScreen,
  onNavigate,
  userProfile,
  userCardProps,
  open,
  onOpenChange,
}: {
  navigationItems: NavItem[];
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  userCardProps: SidebarUserCardSectionProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] max-w-[85vw] h-[100dvh] p-0 z-[960] ll-sidebar ll-sidebar-mobile"
        overlayClassName="z-[950]"
      >
        <div className="ll-sidebar-inner">
          <SheetHeader className="p-0 space-y-0 text-left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBrand userProfile={userProfile} />
          </SheetHeader>

          <SidebarNavList
            navigationItems={navigationItems}
            currentScreen={currentScreen}
            onNavigate={onNavigate}
            onItemClick={() => onOpenChange(false)}
          />

          <SidebarUserCard
            userProfile={userProfile}
            {...userCardProps}
            onUpgrade={() => {
              onOpenChange(false);
              userCardProps.onUpgrade();
            }}
            onManage={() => {
              onOpenChange(false);
              userCardProps.onManage();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MainLayout({
  currentScreen,
  onNavigate,
  onQuickAction,
  userProfile,
  userRole,
  isAuthenticated,
  children,
}: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandSheetOpen, setCommandSheetOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { unreadCount } = useMessagingContext();
  const authContext = useContext(AuthContext);
  const {
    plan,
    status,
    hasStripeCustomer,
    loading: billingLoading,
    refresh: refreshBilling,
  } = useLandlordBillingStatus(isAuthenticated, {
    email: userProfile?.email,
    role: userRole,
  });

  const {
    normalizedPlanId,
    tierName,
    canUpgradeTier,
    tierPillStyle,
  } = resolveSidebarTierState(plan, status, LANDLORD_TOP_PLANS);

  const sidebarUserCardProps: SidebarUserCardSectionProps = {
    fallbackPhotoUrl: authContext?.user?.photoURL ?? null,
    tierName,
    tierPillStyle,
    billingLoading,
    canUpgradeTier,
    onUpgrade: () => setUpgradeModalOpen(true),
    onManage: () => onNavigate('settings'),
  };

  useEffect(() => {
    const handleOpenMobileSidebar = () => setMobileSidebarOpen(true);
    window.addEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
    return () => window.removeEventListener('open-mobile-sidebar', handleOpenMobileSidebar);
  }, []);

  const screenTitleMap: Record<NavigationScreen, string> = {
    dashboard: 'Dashboard',
    properties: 'Properties',
    documents: 'Files',
    viewings: 'Viewings',
    contracts: 'Contracts',
    clients: 'Clients',
    referencing: 'Referencing',
    messages: 'Messages',
    inbox: 'Inbox',
    insights: 'Analytics',
    settings: 'Settings',
  };

  const navigationItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'properties', icon: Building2, label: 'Properties' },
    { id: 'documents', icon: FileText, label: 'Files' },
    { id: 'viewings', icon: CalendarDays, label: 'Viewings' },
    { id: 'contracts', icon: FileSignature, label: 'Contracts', hasNotification: true },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'referencing', icon: ShieldCheck, label: 'Referencing' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', unreadBadge: unreadCount },
    { id: 'insights', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleMobileNavClick = (id: string) => {
    onNavigate(id as NavigationScreen);
  };

  return (
    <SidebarProvider>
      <div
        className={`flex min-h-screen w-full overflow-x-hidden${currentScreen === 'messages' || currentScreen === 'inbox' ? ' ll-viewport-height' : ''}`}
        style={
          {
            '--sidebar-width': '250px',
            '--sidebar-width-collapsed': '80px',
            ...(currentScreen === 'messages' || currentScreen === 'inbox'
              ? { overflow: 'hidden' }
              : {}),
          } as React.CSSProperties
        }
      >
        {/* Pattern 1: Mobile Header Top Bar (Avatar Hub) */}
        {currentScreen !== 'clients' && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white">
            <MobileHeaderTopBar
              userName={userProfile?.name || 'Agent User'}
              userPhoto={userProfile?.photoURL}
              userRole={userRole}
              title={screenTitleMap[currentScreen] || 'Dashboard'}
              showTitle={false}
              onOpenSidebar={() => setMobileSidebarOpen(true)}
              onOpenSettings={() => onNavigate('settings')}
              onOpenNotifications={() => onNavigate('messages')}
              unreadCount={unreadCount}
            />
          </div>
        )}

        <CustomSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
          userCardProps={sidebarUserCardProps}
        />

        <MobileSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
          userCardProps={sidebarUserCardProps}
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
        />

        <main
          className={`flex-1 min-w-0 overflow-x-hidden${currentScreen === 'messages' || currentScreen === 'inbox' ? ' ll-viewport-height' : ''}`}
          style={{
            backgroundColor:
              currentScreen === 'dashboard'
                ? '#f4f6fb'
                : currentScreen === 'properties' ||
                    currentScreen === 'clients' ||
                    currentScreen === 'referencing' ||
                    currentScreen === 'insights' ||
                    currentScreen === 'messages' ||
                    currentScreen === 'inbox' ||
                    currentScreen === 'documents' ||
                    currentScreen === 'viewings' ||
                    currentScreen === 'settings'
                  ? '#f8fafc'
                  : currentScreen === 'contracts'
                    ? '#fbfbfe'
                    : '#F7F7F7',
            paddingBottom: isMobile ? 'calc(76px + env(safe-area-inset-bottom, 0px))' : undefined,
            ...(currentScreen === 'messages' || currentScreen === 'inbox'
              ? {
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }
              : {}),
          }}
        >
          {currentScreen !== 'clients' && (
            <div className={`lg:hidden h-[60px]${currentScreen === 'messages' || currentScreen === 'inbox' ? ' flex-shrink-0' : ''}`} />
          )}
          {currentScreen !== 'dashboard' &&
            currentScreen !== 'properties' &&
            currentScreen !== 'contracts' &&
            currentScreen !== 'clients' &&
            currentScreen !== 'referencing' &&
            currentScreen !== 'insights' &&
            currentScreen !== 'messages' &&
            currentScreen !== 'inbox' &&
            currentScreen !== 'documents' &&
            currentScreen !== 'viewings' &&
            currentScreen !== 'settings' && (
            <div className="mt-4 md:mt-6 px-4 lg:px-6 w-full max-w-7xl mx-auto">
              <LandlordDashboardHeader
                userProfile={userProfile}
                userRole={userRole}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
          {currentScreen === 'messages' || currentScreen === 'inbox' ? (
            <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
              {children}
            </div>
          ) : (
            children
          )}
        </main>

        {/* Pattern 2: Mobile Bottom Command Dock */}
        <MobileBottomNav
          activeTab={currentScreen}
          onTabClick={handleMobileNavClick}
          onOpenCommandSheet={() => setCommandSheetOpen(true)}
          role="landlord"
        />

        {/* Mobile Command Launcher Sheet */}
        <MobileCommandSheet
          isOpen={commandSheetOpen}
          onClose={() => setCommandSheetOpen(false)}
          role="landlord"
          onNavigate={(id) => onNavigate(id as NavigationScreen)}
          onQuickAction={(actionId) => {
            setCommandSheetOpen(false);
            if (onQuickAction) {
              onQuickAction(actionId);
            } else {
              if (actionId === 'send-contract') {
                onNavigate('contracts');
                window.dispatchEvent(new CustomEvent('open-send-contract'));
              } else if (actionId === 'add-property') {
                onNavigate('properties');
                window.dispatchEvent(new CustomEvent('open-add-property'));
              } else if (actionId === 'add-tenant') {
                onNavigate('clients');
                window.dispatchEvent(new CustomEvent('open-add-tenant'));
              } else if (actionId === 'book-viewing') {
                onNavigate('viewings');
                window.dispatchEvent(new CustomEvent('open-book-viewing'));
              }
            }
          }}
        />
      </div>

      {upgradeModalOpen && (
        <LandlordPlanCompareModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          currentPlanId={normalizedPlanId}
          defaultAudience={userRole === 'agent' ? 'agents' : 'landlords'}
          billingStatus={{ hasStripeCustomer, status }}
          onUpgradeSuccess={refreshBilling}
        />
      )}
    </SidebarProvider>
  );
}
