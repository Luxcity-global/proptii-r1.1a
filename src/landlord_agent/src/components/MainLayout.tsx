import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  SidebarProvider,
  useSidebar,
} from './ui/sidebar';
import { UserProfile, UserRole } from '../App';
import LandlordDashboardHeader from './LandlordDashboardHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useIsMobile } from './ui/use-mobile';
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
        const isActive = location.pathname === path || currentScreen === item.id;
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
              </span>
              <span className="ll-sidebar-nav-text">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarUserCard({ userProfile, collapsed }: { userProfile: UserProfile | null; collapsed?: boolean }) {
  if (!userProfile) return null;

  return (
    <div className="ll-sidebar-user">
      <div className="ll-sidebar-user-name">{collapsed ? userProfile.name.split(' ')[0] : userProfile.name}</div>
      <div className="ll-sidebar-user-email">{userProfile.email}</div>
    </div>
  );
}

function CustomSidebar({
  navigationItems,
  currentScreen,
  onNavigate,
  userProfile,
}: {
  navigationItems: NavItem[];
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
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

          <SidebarUserCard userProfile={userProfile} collapsed={isCollapsed} />
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
  open,
  onOpenChange,
}: {
  navigationItems: NavItem[];
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 ll-sidebar ll-sidebar-mobile">
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

          <SidebarUserCard userProfile={userProfile} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MainLayout({
  currentScreen,
  onNavigate,
  userProfile,
  userRole,
  isAuthenticated,
  children,
}: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const navigationItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'properties', icon: Building2, label: 'Properties' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'viewings', icon: CalendarDays, label: 'Viewings' },
    { id: 'contracts', icon: FileSignature, label: 'Contracts', hasNotification: true },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'referencing', icon: ShieldCheck, label: 'Referencing' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'insights', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <SidebarProvider>
      <div
        className="flex min-h-screen w-full"
        style={
          {
            '--sidebar-width': '250px',
            '--sidebar-width-collapsed': '80px',
          } as React.CSSProperties
        }
      >
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e2e8f0] md:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" style={{ color: '#334155' }} />
              </button>
              <button
                type="button"
                className="ll-sidebar-brand"
                style={{ border: 'none', margin: 0, padding: '4px 8px' }}
                onClick={() => goHomeOrSignIn(userProfile)}
              >
                <img src={proptiiLogoSmall} alt="Proptii" className="ll-sidebar-brand-icon" />
                <span className="ll-sidebar-brand-title">proptii</span>
              </button>
              <div className="w-10" />
            </div>
          </div>
        )}

        <CustomSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
        />

        <MobileSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
        />

        <main
          className="flex-1"
          style={{
            backgroundColor:
              currentScreen === 'dashboard'
                ? '#f4f6fb'
                : currentScreen === 'properties'
                  ? '#f8fafc'
                  : '#F7F7F7',
          }}
        >
          {isMobile && <div className="h-16" />}
          {currentScreen !== 'dashboard' && currentScreen !== 'properties' && (
            <div className={`${isMobile ? 'mt-4 px-4' : 'mt-6 px-5 lg:px-6'} w-full max-w-7xl mx-auto`}>
              <LandlordDashboardHeader
                userProfile={userProfile}
                userRole={userRole}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
