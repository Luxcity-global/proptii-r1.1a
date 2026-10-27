import React from 'react';

export interface MobileNavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number | string | null;
}

export interface MobileBottomNavProps {
  activeTab: string;
  onTabClick: (id: string, path?: string) => void;
  onOpenCommandSheet: () => void;
  items?: MobileNavItem[];
  role?: 'landlord' | 'tenant';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabClick,
  onOpenCommandSheet,
  items,
  role = 'landlord',
}) => {
  // Default items if not custom supplied
  const defaultItems: MobileNavItem[] =
    items ||
    (role === 'tenant'
      ? [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/dashboard',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            ),
          },
          {
            id: 'saved-searches',
            label: 'Properties',
            path: '/dashboard/saved-searches',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
            ),
          },
          {
            id: 'tenant-contracts',
            label: 'Contracts',
            path: '/dashboard/tenant-contracts',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ),
          },
          {
            id: 'tenant-referencing',
            label: 'Referencing',
            path: '/dashboard/tenant-referencing',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            ),
          },
        ]
      : [
          {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/dashboard',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            ),
          },
          {
            id: 'properties',
            label: 'Properties',
            path: '/properties',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
            ),
          },
          {
            id: 'contracts',
            label: 'Contracts',
            path: '/contracts',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ),
          },
          {
            id: 'clients',
            label: 'Clients',
            path: '/clients',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            ),
          },
        ]);

  // First 2 items on left of FAB, last 2 items on right of FAB
  const leftItems = defaultItems.slice(0, 2);
  const rightItems = defaultItems.slice(2, 4);

  return (
    <nav id="mobileBottomNav" className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="flex items-center justify-between w-full max-w-[448px] mx-auto px-2">
        {/* Left 2 Items */}
        {leftItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabClick(item.id, item.path)}
              className={`mob-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* CENTER: Elevated FAB Launcher */}
        <button
          type="button"
          onClick={onOpenCommandSheet}
          className="mob-fab-btn"
          title="Open Command Launcher"
          aria-label="Open Command Launcher"
        >
          <img
            src="/images/Proptii ico.png"
            alt="Proptii"
            onError={(e) => {
              // Fallback to proptii-logo.png if Proptii ico.png isn't available
              (e.currentTarget as HTMLImageElement).src = '/images/proptii-logo.png';
            }}
          />
        </button>

        {/* Right 2 Items */}
        {rightItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabClick(item.id, item.path)}
              className={`mob-nav-item ${isActive ? 'active' : ''} relative`}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
                {item.badge !== undefined && item.badge !== null && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
