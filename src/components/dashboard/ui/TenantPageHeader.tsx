import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Plus } from 'lucide-react';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useIsMobile } from './use-mobile';
import '../../../styles/tenantPageHeader.css';

interface TenantPageHeaderProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  breadcrumb?: React.ReactNode;
  primaryLabel: string;
  primaryIcon?: React.ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  extraActions?: React.ReactNode;
  onInsights?: () => void;
}

const TenantPageHeader: React.FC<TenantPageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled,
  extraActions,
  onInsights,
}) => {
  const navigate = useNavigate();
  const { unreadCount } = useMessagingContext();
  const isMobile = useIsMobile();

  return (
    <header className={`tn-ph${isMobile ? ' is-mobile' : ''}`}>
      <div className="tn-ph-inner">
        <div>
          {breadcrumb}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="tn-ph-actions">
          <button
            type="button"
            className="tn-ph-icon"
            title="Settings"
            onClick={() => navigate('/dashboard/settings')}
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            className="tn-ph-icon"
            title="Notifications"
            onClick={() => navigate('/dashboard/messages')}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="tn-ph-dot" />}
          </button>
          <button
            type="button"
            className="tn-ph-insights"
            onClick={() => (onInsights ? onInsights() : navigate('/dashboard#tenant-insights'))}
          >
            <span className="tn-ph-insights-icon">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            Portfolio Insights
          </button>
          {extraActions}
          <button
            type="button"
            className="tn-ph-primary"
            onClick={onPrimary}
            disabled={primaryDisabled}
          >
            {primaryIcon}
            {primaryLabel}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TenantPageHeader;
