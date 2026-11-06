import React, { useState } from 'react';

export interface MobileAccordionField {
  label: string;
  value: React.ReactNode;
}

export interface MobileAccordionAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface MobileAccordionStatusBadgeObj {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | string;
}

export interface MobileAccordionCardProps {
  id?: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  statusBadge?: React.ReactNode | MobileAccordionStatusBadgeObj;
  fields?: MobileAccordionField[];
  metrics?: MobileAccordionField[];
  actions?: MobileAccordionAction[] | React.ReactNode;
  defaultExpanded?: boolean;
  avatar?: React.ReactNode;
  initials?: string;
  onRowClick?: () => void;
  children?: React.ReactNode;
}

export const MobileAccordionCard: React.FC<MobileAccordionCardProps> = ({
  id,
  title,
  subtitle,
  statusBadge,
  fields,
  metrics,
  actions,
  defaultExpanded = false,
  avatar,
  initials,
  onRowClick,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const displayFields = (fields && Array.isArray(fields)
    ? fields
    : metrics && Array.isArray(metrics)
      ? metrics
      : []) as MobileAccordionField[];

  const renderStatusBadge = () => {
    if (!statusBadge) return null;
    if (React.isValidElement(statusBadge)) {
      return statusBadge;
    }
    if (typeof statusBadge === 'object' && 'label' in statusBadge) {
      const badgeObj = statusBadge as MobileAccordionStatusBadgeObj;
      const v = badgeObj.variant || 'neutral';
      let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      if (v === 'success') {
        badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (v === 'warning') {
        badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (v === 'danger') {
        badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      }
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClasses} uppercase tracking-wider`}
        >
          {badgeObj.label}
        </span>
      );
    }
    return <>{String(statusBadge)}</>;
  };

  const renderAvatar = () => {
    if (avatar) return <div className="shrink-0">{avatar}</div>;
    if (initials) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
          {initials}
        </div>
      );
    }
    return null;
  };

  const renderActions = () => {
    if (!actions) return null;
    if (React.isValidElement(actions)) {
      return <div className="mob-accordion-custom-actions pt-2">{actions}</div>;
    }
    if (Array.isArray(actions) && actions.length > 0) {
      return (
        <div className="mob-accordion-actions">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                act.onClick(e);
              }}
              className={`mob-accordion-btn ${act.variant === 'primary' ? 'btn-orange' : ''}`}
            >
              {act.icon}
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mob-accordion-item" id={id ? `mob-item-${id}` : undefined}>
      {/* Row Header (Clickable Dropdown Toggle) */}
      <div
        className="mob-accordion-header"
        onClick={() => {
          if (onRowClick && !isExpanded) {
            onRowClick();
          } else {
            setIsExpanded((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Circular Chevron Button */}
          <button
            type="button"
            onClick={toggleExpand}
            className={`mob-chevron-btn ${isExpanded ? 'is-expanded' : ''}`}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Optional Avatar / Initials */}
          {renderAvatar()}

          {/* Title & Subtitle */}
          <div className="mob-accordion-title-wrap">
            <div className="mob-accordion-main-title">{title}</div>
            {subtitle && <div className="mob-accordion-sub-title">{subtitle}</div>}
          </div>
        </div>

        {/* Status Badge */}
        {statusBadge && <div className="shrink-0 ml-2">{renderStatusBadge()}</div>}
      </div>

      {/* Expandable Details Panel */}
      <div className={`mob-accordion-details ${isExpanded ? 'is-open' : ''}`}>
        {/* Fields Grid */}
        {displayFields.length > 0 && (
          <div className="mob-accordion-grid">
            {displayFields.map((field, idx) => (
              <div key={idx} className="mob-accordion-field">
                <span className="mob-accordion-field-label">{field.label}</span>
                <span className="mob-accordion-field-value">{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {children}

        {/* Action Buttons Row */}
        {renderActions()}
      </div>
    </div>
  );
};

export default MobileAccordionCard;
