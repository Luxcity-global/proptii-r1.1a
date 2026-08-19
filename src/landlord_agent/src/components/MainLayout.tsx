import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, FileText, BarChart3, User, Users, Inbox, ChevronLeft, ChevronRight, FileSignature, CalendarDays, Menu, MessageSquare, Settings, ShieldCheck } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserProfile } from '../App';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useIsMobile } from './ui/use-mobile';

// Import logos
const proptiiLogoLarge = '/images/proptii-logo.png'; // Full logo for expanded sidebar
const proptiiLogoSmall = '/images/Proptii ico.png'; // Icon only for collapsed sidebar

const requestSignIn = () => {
  if (window.self !== window.top) {
    // Running in iframe inside LandlordDemo — delegate auth to parent
    window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: {} }, '*');
  } else {
    // Running directly embedded in host page or standalone
    window.dispatchEvent(new CustomEvent('require-auth', { detail: {} }));
  }
};

export type NavigationScreen = 'dashboard' | 'properties' | 'documents' | 'viewings' | 'clients' | 'insights' | 'inbox' | 'contracts' | 'messages' | 'settings' | 'referencing';

interface MainLayoutProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  children: React.ReactNode;
}

// Custom Sidebar Header with perfect alignment
function CustomSidebarHeader({ userProfile }: { userProfile: UserProfile | null }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleLogoClick = () => {
    if (!userProfile) {
      requestSignIn();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="border-b border-sidebar-border">
      {/* Logo container with conditional padding */}
      <div className={`pt-2 pb-2 ${isCollapsed ? 'px-2' : 'pl-4 pr-2'}`}>
        <div className={`flex items-center h-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          {isCollapsed ? (
            <img
              src={proptiiLogoSmall}
              alt="Proptii Logo"
              className="w-8 h-8 object-contain flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
              title="Go to Tenant App"
            />
          ) : (
            <img
              src={proptiiLogoLarge}
              alt="Proptii Logo"
              className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
              title="Go to Tenant App"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Navigation Menu with perfect alignment
function CustomNavigationMenu({ navigationItems, currentScreen, onNavigate }: {
  navigationItems: Array<{
    id: NavigationScreen;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    hasNotification?: boolean;
  }>;
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();

  // Map navigation screens to paths
  const screenToPath: Record<NavigationScreen, string> = {
    'dashboard': '/dashboard',
    'viewings': '/viewings',
    'properties': '/properties',
    'documents': '/documents',
    'contracts': '/contracts',
    'clients': '/clients',
    'insights': '/insights',
    'inbox': '/inbox',
    'messages': '/messages',
    'settings': '/settings',
  };

  const handleNavigation = (screen: NavigationScreen) => {
    onNavigate(screen);
  };

  return (
    <div className="pt-2 pb-2 pl-4 pr-2">
      <div className="space-y-3">
        {navigationItems.map((item) => {
          const path = screenToPath[item.id] || '/dashboard';
          const isActive = location.pathname === path || currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
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
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="relative flex-shrink-0">
                <item.icon className="w-5 h-5" />
                {item.hasNotification && (
                  <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 transform -translate-x-1 -translate-y-1"></div>
                )}
              </div>
              {!isCollapsed && (
                <span className="ml-2 truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Custom User Profile Section
function CustomUserProfile({ userProfile }: { userProfile: UserProfile | null }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!userProfile) return null;

  return (
    <div className="border-t border-sidebar-border pt-2 pb-2 pl-4 pr-2">
      <div className="flex items-center h-8 px-2">
        <Avatar className="h-4 w-4 flex-shrink-0">
          {userProfile.logo && <AvatarImage src={userProfile.logo} alt={userProfile.name} />}
          <AvatarFallback>
            <User className="h-2 w-2" />
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="ml-2 min-w-0 flex-1">
            <div className="truncate text-xs font-semibold" style={{ color: '#374957' }}>{userProfile.name}</div>
            <div className="truncate text-xs opacity-70" style={{ color: '#374957' }}>{userProfile.email}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Sidebar Trigger
function CustomSidebarTrigger({ userProfile }: { userProfile: UserProfile | null }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleProptiiHomeClick = () => {
    if (!userProfile) {
      requestSignIn();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="border-t border-sidebar-border pt-2 pb-2 px-4 space-y-2">
      {/* Collapse/Expand Trigger */}
      <button
        onClick={toggleSidebar}
        className="w-full flex items-center justify-center h-8 px-2 rounded-md hover:bg-sidebar-accent transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" style={{ color: '#374957' }} />
        ) : (
          <ChevronLeft className="h-4 w-4" style={{ color: '#374957' }} />
        )}
      </button>

      {/* Proptii Home Button */}
      {isCollapsed ? (
        <button
          onClick={handleProptiiHomeClick}
          className="w-full flex items-center justify-center h-8 px-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          title="Go to Tenant App"
        >
          <Home className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={handleProptiiHomeClick}
          className="w-full flex items-center justify-center h-8 px-2 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium"
          title="Go to Tenant App"
        >
          <Home className="h-4 w-4 mr-2" />
          Proptii Home
        </button>
      )}
    </div>
  );
}

// Main Custom Sidebar Component
function CustomSidebar({
  navigationItems,
  currentScreen,
  onNavigate,
  userProfile
}: {
  navigationItems: Array<{
    id: NavigationScreen;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }>;
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="group peer hidden md:block" data-collapsible="icon" style={{ color: '#374957' }}>
      {/* Sidebar Container */}
      <div
        className="fixed inset-y-0 left-0 z-10 h-screen transition-all duration-300 ease-out bg-white border-r border-sidebar-border"
        style={{
          width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <CustomSidebarHeader userProfile={userProfile} />

          {/* Navigation */}
          <div className="flex-1 overflow-auto">
            <CustomNavigationMenu
              navigationItems={navigationItems}
              currentScreen={currentScreen}
              onNavigate={onNavigate}
            />
          </div>

          {/* User Profile */}
          <CustomUserProfile userProfile={userProfile} />

          {/* Trigger */}
          <CustomSidebarTrigger userProfile={userProfile} />
        </div>
      </div>

      {/* Spacer for content */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'
        }}
      />
    </div>
  );
}

// Mobile Sidebar Component
function MobileSidebar({
  navigationItems,
  currentScreen,
  onNavigate,
  userProfile,
  open,
  onOpenChange
}: {
  navigationItems: Array<{
    id: NavigationScreen;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    hasNotification?: boolean;
  }>;
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Map navigation screens to paths
  const screenToPath: Record<NavigationScreen, string> = {
    'dashboard': '/dashboard',
    'viewings': '/viewings',
    'properties': '/properties',
    'documents': '/documents',
    'contracts': '/contracts',
    'clients': '/clients',
    'insights': '/insights',
    'inbox': '/inbox',
    'messages': '/messages',
    'settings': '/settings',
  };

  const handleNavigate = (screen: NavigationScreen) => {
    onNavigate(screen);
    onOpenChange(false);
  };

  const handleLogoClick = () => {
    if (!userProfile) {
      requestSignIn();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii Logo"
                className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
              />
            </div>
          </SheetHeader>

          {/* Navigation */}
          <div className="flex-1 overflow-auto pt-4 px-4">
            <div className="space-y-3">
              {navigationItems.map((item) => {
                const path = screenToPath[item.id] || '/dashboard';
                const isActive = location.pathname === path || currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className="w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors justify-start"
                    style={{
                      color: isActive ? '#136C9E' : '#374957',
                      backgroundColor: isActive ? '#E6F3FF' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                      {item.hasNotification && (
                        <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 transform -translate-x-1 -translate-y-1"></div>
                      )}
                    </div>
                    <span className="ml-2 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          {userProfile && (
            <div className="border-t border-sidebar-border pt-4 pb-4 px-4">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {userProfile.logo && <AvatarImage src={userProfile.logo} alt={userProfile.name} />}
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2 min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" style={{ color: '#374957' }}>{userProfile.name}</div>
                  <div className="truncate text-xs opacity-70" style={{ color: '#374957' }}>{userProfile.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Proptii Home Button */}
          <div className="border-t border-sidebar-border pt-4 pb-4 px-4">
            <button
              onClick={handleLogoClick}
              className="w-full flex items-center justify-center h-10 px-4 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium"
            >
              <Home className="h-4 w-4 mr-2" />
              Proptii Home
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MainLayout({ currentScreen, onNavigate, userProfile, children }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const navigationItems = [
    {
      id: 'dashboard' as NavigationScreen,
      icon: Home,
      label: 'Dashboard',
    },
    {
      id: 'properties' as NavigationScreen,
      icon: Building2,
      label: 'Properties',
    },
    {
      id: 'documents' as NavigationScreen,
      icon: FileText,
      label: 'Documents',
    },
    {
      id: 'viewings' as NavigationScreen,
      icon: CalendarDays,
      label: 'Viewings',
    },
    {
      id: 'contracts' as NavigationScreen,
      icon: FileSignature,
      label: 'Contracts',
      hasNotification: true, // This would be dynamic based on unsigned contracts
    },
    {
      id: 'clients' as NavigationScreen,
      icon: Users,
      label: 'Clients',
    },
    {
      id: 'referencing' as NavigationScreen,
      icon: ShieldCheck,
      label: 'Referencing',
    },
    {
      id: 'messages' as NavigationScreen,
      icon: MessageSquare,
      label: 'Messages',
    },
    {
      id: 'insights' as NavigationScreen,
      icon: BarChart3,
      label: 'Analytics',
    },
    {
      id: 'settings' as NavigationScreen,
      icon: Settings,
      label: 'Settings',
    },
  ];

  return (
    <SidebarProvider>
      <div
        className="flex min-h-screen w-full"
        style={{
          '--sidebar-width': '200px',
          '--sidebar-width-collapsed': '56px'
        } as React.CSSProperties}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-sidebar-border md:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" style={{ color: '#374957' }} />
              </button>
              <img
                src="/images/proptii-logo.png"
                alt="Proptii Logo"
                className="h-14 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => userProfile ? window.location.href = '/' : requestSignIn()}
              />
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>
        )}

        {/* Custom Sidebar with Collapse Support - Desktop Only */}
        <CustomSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
        />

        {/* Main Content */}
        <main className="flex-1" style={{ backgroundColor: '#F7F7F7' }}>
          {isMobile && <div className="h-16" />} {/* Spacer for mobile header */}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}