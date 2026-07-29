import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS } from "../Dashboard";
import { ChevronLeft, ChevronRight, Home, User, Lock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';

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
  const { plan, status } = useBillingStatus();

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
                          onClick={() => navigate('/pricing')}
                          title={isCollapsed ? upgradeLabel : undefined}
                          className={`
                            w-full flex items-center h-10 px-3 rounded-md text-sm font-medium
                            opacity-50 cursor-pointer transition-opacity hover:opacity-70
                            ${isCollapsed ? 'justify-center' : 'justify-start'}
                          `}
                          style={{ color: '#374957' }}
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

          {/* User Profile */}
          {user && (
            <div className="border-t" style={{ borderColor: '#ebebeb' }}>
              <div className="pt-2 pb-2 pl-4 pr-2">
                <div className="flex items-center h-8 px-2">
                  <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-2 w-2" style={{ color: '#374957' }} />
                  </div>
                  {!isCollapsed && (
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold" style={{ color: '#374957' }}>
                        {user.name || user.givenName || 'User'}
                      </div>
                      <div className="truncate text-xs opacity-70" style={{ color: '#374957' }}>
                        {user.email || ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trigger */}
          <div className="border-t" style={{ borderColor: '#ebebeb' }}>
            <div className="pt-2 pb-2 px-4 space-y-2">
              {/* Collapse/Expand Trigger */}
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center h-8 px-2 rounded-md hover:bg-gray-100 transition-colors"
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
                  onClick={handleLogoClick}
                  className="w-full flex items-center justify-center h-8 px-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  title="Go to Home"
                >
                  <Home className="h-4 w-4" />
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
    </div>
  );
};

export default DashboardSidebar;
