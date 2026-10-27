import React from 'react';

export interface MobileHeaderTopBarProps {
  userName?: string;
  userRole?: string;
  title?: string;
  onOpenSidebar: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const MobileHeaderTopBar: React.FC<MobileHeaderTopBarProps> = ({
  userName = 'User',
  userRole,
  title,
  onOpenSidebar,
  onOpenSettings,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  // Extract initials (up to 2 letters)
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'PR';

  return (
    <div id="headerMobileTopBar" className="header-mobile-top-bar lg:hidden">
      {/* Left: Avatar Hub Button (Opens Slide-out Sidebar) */}
      <button
        id="mobileHeaderAvatarHub"
        type="button"
        onClick={onOpenSidebar}
        className="mobile-header-avatar-hub"
        title="Open Profile Navigation Hub"
        aria-label="Open Profile Navigation Hub"
      >
        <div className="mobile-avatar-circle">
          {initials}
        </div>
        <span className="mobile-avatar-name">{userName}</span>
        <svg
          className="w-3.5 h-3.5 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Center: Title / Badge */}
      {title && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 max-w-[150px] truncate">
          <span className="text-xs font-bold text-slate-700 font-heading truncate">
            {title}
          </span>
        </div>
      )}

      {/* Right: Settings & Notifications Buttons */}
      <div className="flex items-center gap-2">
        {/* Settings Button (Pattern 6 vector SVG) */}
        <button
          id="mobileHeaderSettingsBtn"
          type="button"
          onClick={onOpenSettings}
          className="mobile-header-action-btn"
          title="Settings & Preferences"
          aria-label="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Notifications Button */}
        <button
          id="mobileHeaderNotificationsBtn"
          type="button"
          onClick={onOpenNotifications}
          className="mobile-header-action-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && <span className="mobile-notif-dot" />}
        </button>
      </div>
    </div>
  );
};

export default MobileHeaderTopBar;
