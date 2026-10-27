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

export interface MobileAccordionCardProps {
  id?: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  statusBadge?: React.ReactNode;
  fields: MobileAccordionField[];
  actions?: MobileAccordionAction[];
  defaultExpanded?: boolean;
  avatar?: React.ReactNode;
  onRowClick?: () => void;
}

export const MobileAccordionCard: React.FC<MobileAccordionCardProps> = ({
  id,
  title,
  subtitle,
  statusBadge,
  fields,
  actions,
  defaultExpanded = false,
  avatar,
  onRowClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
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

          {/* Optional Avatar */}
          {avatar && <div className="shrink-0">{avatar}</div>}

          {/* Title & Subtitle */}
          <div className="mob-accordion-title-wrap">
            <div className="mob-accordion-main-title">{title}</div>
            {subtitle && <div className="mob-accordion-sub-title">{subtitle}</div>}
          </div>
        </div>

        {/* Status Badge */}
        {statusBadge && <div className="shrink-0 ml-2">{statusBadge}</div>}
      </div>

      {/* Expandable Details Panel */}
      <div className={`mob-accordion-details ${isExpanded ? 'is-open' : ''}`}>
        {/* Fields Grid */}
        <div className="mob-accordion-grid">
          {fields.map((field, idx) => (
            <div key={idx} className="mob-accordion-field">
              <span className="mob-accordion-field-label">{field.label}</span>
              <span className="mob-accordion-field-value">{field.value}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons Row */}
        {actions && actions.length > 0 && (
          <div className="mob-accordion-actions">
            {actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  act.onClick(e);
                }}
                className={`mob-accordion-btn ${
                  act.variant === 'primary' ? 'btn-orange' : ''
                }`}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAccordionCard;
