import React, { useState } from 'react';
import { Home, Wrench, FolderKanban, FileText, TrendingUp, MessageSquare, Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type HomeownerNavigationScreen = 
  | 'dashboard' 
  | 'maintenance' 
  | 'projects' 
  | 'documents' 
  | 'home-value' 
  | 'communication' 
  | 'settings';

interface MainLayoutProps {
  currentScreen: HomeownerNavigationScreen;
  onNavigate: (screen: HomeownerNavigationScreen) => void;
  children: React.ReactNode;
}

interface NavigationItem {
  id: HomeownerNavigationScreen;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hasNotification?: boolean;
}

export function MainLayout({ currentScreen, onNavigate, children }: MainLayoutProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Dashboard',
    },
    {
      id: 'maintenance',
      icon: Wrench,
      label: 'Maintenance',
      hasNotification: false, // TODO: Dynamic based on pending tasks
    },
    {
      id: 'projects',
      icon: FolderKanban,
      label: 'Projects',
    },
    {
      id: 'documents',
      icon: FileText,
      label: 'Documents',
    },
    {
      id: 'home-value',
      icon: TrendingUp,
      label: 'Home Value',
    },
    {
      id: 'communication',
      icon: MessageSquare,
      label: 'Messages',
      hasNotification: false, // TODO: Dynamic based on unread messages
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  const handleProptiiHomeClick = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F7F7F7]">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-10 h-screen transition-all duration-300 ease-out bg-white border-r border-gray-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
              {isCollapsed ? (
                <img 
                  src="/images/Proptii ico.png" 
                  alt="Proptii" 
                  className="w-8 h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleProptiiHomeClick}
                  title="Go to Home"
                />
              ) : (
                <img 
                  src="/images/proptii-logo.png" 
                  alt="Proptii" 
                  className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleProptiiHomeClick}
                  title="Go to Home"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const isActive = currentScreen === item.id;
                const IconComponent = item.icon;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors
                      ${isCollapsed ? 'justify-center' : 'justify-start'}
                      ${isActive 
                        ? 'bg-[#E6F3FF] text-[#136C9E]' 
                        : 'text-[#374957] hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <IconComponent className="w-5 h-5" />
                      {item.hasNotification && (
                        <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white z-10 transform -translate-x-1 -translate-y-1"></div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <div className="w-8 h-8 rounded-full bg-[#E6F3FF] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#136C9E]" />
                </div>
                {!isCollapsed && (
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[#374957]">
                      {user.name || 'Homeowner'}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapse/Expand Trigger */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center h-8 px-2 rounded-md hover:bg-gray-100 transition-colors text-[#374957]"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            
            {/* Proptii Home Button */}
            <button 
              onClick={handleProptiiHomeClick}
              className={`w-full flex items-center justify-center h-8 px-2 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium ${
                isCollapsed ? '' : 'justify-start px-3'
              }`}
              title="Go to Proptii Home"
            >
              <Home className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Proptii Home</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for sidebar */}
      <div 
        className={`transition-all duration-300 ease-out ${isCollapsed ? 'w-16' : 'w-64'}`}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

