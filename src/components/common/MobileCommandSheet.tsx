import React, { useEffect } from 'react';

export interface MobileCommandAction {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  cardColor: 'orange' | 'sky' | 'emerald' | 'purple';
  onClick: () => void;
}

export interface MobileCommandTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface MobileCommandSheetProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'landlord' | 'tenant';
  onNavigate?: (id: string, path?: string) => void;
  onQuickAction?: (actionId: string) => void;
  customActions?: MobileCommandAction[];
  customTools?: MobileCommandTool[];
}

export const MobileCommandSheet: React.FC<MobileCommandSheetProps> = ({
  isOpen,
  onClose,
  role = 'landlord',
  onNavigate,
  onQuickAction,
  customActions,
  customTools,
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultLandlordActions: MobileCommandAction[] = [
    {
      id: 'send-contract',
      title: 'Send Contract',
      desc: 'Generate agreement',
      cardColor: 'orange',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC5F12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('send-contract');
        } else {
          onNavigate?.('contracts', '/contracts');
        }
      },
    },
    {
      id: 'add-property',
      title: 'Add Property',
      desc: 'List a new home',
      cardColor: 'sky',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <line x1="12" y1="7" x2="12" y2="13" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('add-property');
        } else {
          onNavigate?.('properties', '/properties');
        }
      },
    },
    {
      id: 'add-tenant',
      title: 'Add Tenant',
      desc: 'Register client/renter',
      cardColor: 'emerald',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('add-tenant');
        } else {
          onNavigate?.('clients', '/clients');
        }
      },
    },
    {
      id: 'book-viewing',
      title: 'Book Viewing',
      desc: 'Schedule walkthrough',
      cardColor: 'purple',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('book-viewing');
        } else {
          onNavigate?.('viewings', '/viewings');
        }
      },
    },
  ];

  const defaultTenantActions: MobileCommandAction[] = [
    {
      id: 'request-viewing',
      title: 'Book Viewing',
      desc: 'Schedule appointment',
      cardColor: 'purple',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('request-viewing');
        } else {
          onNavigate?.('viewings', '/dashboard/viewings');
        }
      },
    },
    {
      id: 'view-contracts',
      title: 'View Contracts',
      desc: 'Agreements & terms',
      cardColor: 'orange',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC5F12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('view-contracts');
        } else {
          onNavigate?.('tenant-contracts', '/dashboard/tenant-contracts');
        }
      },
    },
    {
      id: 'tenant-passport',
      title: 'Referencing',
      desc: 'Verify passport & ID',
      cardColor: 'emerald',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('tenant-passport');
        } else {
          onNavigate?.('tenant-referencing', '/dashboard/tenant-referencing');
        }
      },
    },
    {
      id: 'upload-doc',
      title: 'Your Files',
      desc: 'Upload documents',
      cardColor: 'sky',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      onClick: () => {
        onClose();
        if (onQuickAction) {
          onQuickAction('upload-doc');
        } else {
          onNavigate?.('your-files', '/dashboard/your-files');
        }
      },
    },
  ];

  const defaultLandlordTools: MobileCommandTool[] = [
    {
      id: 'properties',
      label: 'Properties',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('properties', '/properties');
      },
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('clients', '/clients');
      },
    },
    {
      id: 'referencing',
      label: 'Referencing',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('referencing', '/referencing');
      },
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('documents', '/documents');
      },
    },
    {
      id: 'viewings',
      label: 'Viewings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('viewings', '/viewings');
      },
    },
    {
      id: 'insights',
      label: 'Analytics',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('insights', '/insights');
      },
    },
  ];

  const defaultTenantTools: MobileCommandTool[] = [
    {
      id: 'saved-searches',
      label: 'Saved Search',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('saved-searches', '/dashboard/saved-searches');
      },
    },
    {
      id: 'viewings',
      label: 'Viewings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('viewings', '/dashboard/viewings');
      },
    },
    {
      id: 'tenant-contracts',
      label: 'Contracts',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('tenant-contracts', '/dashboard/tenant-contracts');
      },
    },
    {
      id: 'tenant-referencing',
      label: 'Referencing',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('tenant-referencing', '/dashboard/tenant-referencing');
      },
    },
    {
      id: 'your-files',
      label: 'Files Vault',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('your-files', '/dashboard/your-files');
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      onClick: () => {
        onClose();
        onNavigate?.('settings', '/dashboard/settings');
      },
    },
  ];

  const actions = customActions || (role === 'tenant' ? defaultTenantActions : defaultLandlordActions);
  const tools = customTools || (role === 'tenant' ? defaultTenantTools : defaultLandlordTools);

  return (
    <div id="mobileCommandSheet">
      {/* Backdrop */}
      <div
        className={`mob-cmd-sheet-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      {/* Slide-Up Panel */}
      <div className={`mob-cmd-sheet-panel ${isOpen ? 'active' : ''}`}>
        {/* Drag Pill */}
        <div className="mob-drag-handle" />

        {/* Header */}
        <div className="mob-cmd-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shadow-xs p-1">
              <img src="/images/Proptii ico.png" alt="Proptii" className="w-4 h-5 object-contain" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-slate-900 leading-tight">
                Command Launcher
              </div>
              <div className="text-[11px] text-slate-500">Quick actions &amp; portfolio tools</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm cursor-pointer shadow-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="mob-cmd-body">
          {/* Section 1: Instant Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                Instant Actions
              </span>
              <span className="text-[10px] font-bold text-[#DC5F12] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                ⚡ Fast Workflow
              </span>
            </div>
            <div className="mob-action-grid">
              {actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={act.onClick}
                  className={`mob-action-card card-${act.cardColor} text-left`}
                >
                  <div className="mob-action-icon-box">
                    {act.icon}
                  </div>
                  <div className="mob-action-title">{act.title}</div>
                  <div className="mob-action-desc">{act.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Portfolio Tools */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading mb-2">
              Portfolio Tools
            </div>
            <div className="mob-tools-grid">
              {tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.onClick}
                  className="mob-tool-item"
                >
                  <div className="mob-tool-icon-box">{t.icon}</div>
                  <span className="mob-tool-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileCommandSheet;
