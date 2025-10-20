import React from 'react';
import { Home, Building2, FileText, BarChart3, User, Users, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { LogoutButton } from './auth/LogoutButton';

// Import logos
const proptiiLogoLarge = '/src/assets/proptii_logo_large.png';
const proptiiLogoSmall = '/src/assets/proptii_logo_small.png';

export type NavigationScreen = 'dashboard' | 'properties' | 'documents' | 'clients' | 'insights' | 'inbox';

interface MainLayoutProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  userProfile: UserProfile | null;
  children: React.ReactNode;
}

// Custom Sidebar Header with perfect alignment
function CustomSidebarHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="border-b border-sidebar-border">
      {/* Logo container with conditional padding */}
      <div className={`pt-2 pb-2 ${isCollapsed ? 'px-2' : 'pl-4 pr-2'}`}>
        <div className={`flex items-center h-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <a href="http://localhost:5173" className="flex items-center">
            {isCollapsed ? (
              <img 
                src={proptiiLogoSmall} 
                alt="Proptii Logo" 
                className="w-8 h-8 object-contain flex-shrink-0 hover:opacity-80 transition-opacity"
              />
            ) : (
              <img 
                src={proptiiLogoLarge} 
                alt="Proptii Logo" 
                className="h-8 object-contain hover:opacity-80 transition-opacity"
              />
            )}
          </a>
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
  }>;
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="pt-2 pb-2 pl-4 pr-2">
      <div className="space-y-3">
        {navigationItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
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
              <item.icon className="w-5 h-5 flex-shrink-0" />
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
        {!isCollapsed && (
          <div className="ml-2">
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Sidebar Trigger
function CustomSidebarTrigger() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="border-t border-sidebar-border pt-2 pb-2 pl-4 pr-2 space-y-2">
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
        <a 
          href="http://localhost:5173"
          className="w-full flex items-center justify-center h-8 px-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          <Home className="h-4 w-4" />
        </a>
      ) : (
        <a 
          href="http://localhost:5173"
          className="w-full flex items-center justify-center h-8 px-2 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium"
        >
          <Home className="h-4 w-4 mr-2" />
          Proptii Home
        </a>
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
          <CustomSidebarHeader />
          
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
          <CustomSidebarTrigger />
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

export function MainLayout({ currentScreen, onNavigate, userProfile, children }: MainLayoutProps) {
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
      id: 'clients' as NavigationScreen,
      icon: Users,
      label: 'Clients',
    },
    {
      id: 'inbox' as NavigationScreen,
      icon: Inbox,
      label: 'Inbox',
    },
    {
      id: 'insights' as NavigationScreen,
      icon: BarChart3,
      label: 'Insights',
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
        {/* Custom Sidebar with Collapse Support */}
        <CustomSidebar 
          navigationItems={navigationItems}
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          userProfile={userProfile}
        />

        {/* Main Content */}
        <main className="flex-1" style={{ backgroundColor: '#F7F7F7' }}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}