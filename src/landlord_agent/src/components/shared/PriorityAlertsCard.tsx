import React from 'react';
import { Card } from '../ui/card';
import { AlertTriangle, PoundSterling, Bell, Shield, Clock, DollarSign } from 'lucide-react';

export interface AlertItem {
  id: string;
  type: 'vacancy-risk' | 'rent-arrears' | 'maintenance' | 'document-expiry' | 'custom';
  title: string;
  subtitle?: string;
  description?: string;
  amount?: number;
  score?: number;
  date?: Date | string;
  daysOverdue?: number;
  propertyAddress?: string;
  tenantName?: string;
  customIcon?: React.ReactNode;
  customColor?: string;
  actionText?: string;
  onAction?: (alert: AlertItem) => void;
}

export interface PriorityAlertsCardProps {
  alerts: AlertItem[];
  title?: string;
  subtitle?: string;
  maxAlerts?: number;
  height?: string;
  className?: string;
  onAlertClick?: (alert: AlertItem) => void;
  showDate?: boolean;
  customGradient?: {
    from: string;
    to: string;
  };
  customBorderColor?: string;
}

export function PriorityAlertsCard({
  alerts,
  title = "Priority Alerts",
  subtitle,
  maxAlerts = 2,
  height = "320px",
  className = "",
  onAlertClick,
  showDate = true,
  customGradient = {
    from: '#EEF9FF',
    to: '#DDE4FF'
  },
  customBorderColor = '#80B2FF'
}: PriorityAlertsCardProps) {
  
  const getAlertConfig = (alert: AlertItem) => {
    const configs = {
      'vacancy-risk': {
        icon: AlertTriangle,
        iconColor: '#ca390c',
        titleColor: '#ca390c',
        borderColor: '#ffbc73',
        buttonColor: '#ca390c',
        buttonBg: '#ffbc73'
      },
      'rent-arrears': {
        icon: PoundSterling,
        iconColor: '#b8585e',
        titleColor: '#b44d53',
        borderColor: '#ffacac',
        buttonColor: '#c61626',
        buttonBg: '#ffacac'
      },
      'maintenance': {
        icon: Shield,
        iconColor: '#d97706',
        titleColor: '#d97706',
        borderColor: '#fed7aa',
        buttonColor: '#d97706',
        buttonBg: '#fed7aa'
      },
      'document-expiry': {
        icon: Clock,
        iconColor: '#dc2626',
        titleColor: '#dc2626',
        borderColor: '#fecaca',
        buttonColor: '#dc2626',
        buttonBg: '#fecaca'
      },
      'custom': {
        icon: Bell,
        iconColor: alert.customColor || '#6b7280',
        titleColor: alert.customColor || '#6b7280',
        borderColor: alert.customColor ? `${alert.customColor}40` : '#e5e7eb',
        buttonColor: alert.customColor || '#6b7280',
        buttonBg: alert.customColor ? `${alert.customColor}20` : '#f3f4f6'
      }
    };
    
    return configs[alert.type] || configs.custom;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (alerts.length === 0) return null;

  const displayedAlerts = alerts.slice(0, maxAlerts);

  return (
    <div 
      className={`shadow-sm overflow-hidden ${className}`}
      style={{ 
        background: `linear-gradient(to bottom, ${customGradient.from}, ${customGradient.to})`, 
        border: `1px solid ${customBorderColor}`, 
        height,
        borderRadius: '20px'
      }}
    >
      <div className="flex h-full">
        {/* Left Blue Panel */}
        <div 
          className="p-6 flex flex-col items-start min-w-[200px] rounded-l-xl" 
          style={{ 
            background: `linear-gradient(to bottom, ${customGradient.from}, ${customGradient.to})`, 
            color: '#374957', 
            fontFamily: 'Archivo, sans-serif'
          }}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" style={{ color: '#374957' }} />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm opacity-75 mt-1">{subtitle}</p>}
          <div className="flex-1"></div>
          <div className="mt-auto">
            <div className="font-bold block mb-1" style={{ fontSize: '32px', lineHeight: '1' }}>
              {alerts.length}
            </div>
            <div className="text-sm opacity-90 mb-2 block">
              {alerts.length === 1 ? 'Alert' : 'Alerts'}
            </div>
            {showDate && (
              <div className="text-xs opacity-75">
                As of {new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right White Panel */}
        <div 
          className="flex-1 p-4 bg-white relative z-10" 
          style={{ 
            borderRadius: '20px', 
            boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)' 
          }}
        >
          <div className="space-y-3">
            {displayedAlerts.map((alert, index) => {
              const config = getAlertConfig(alert);
              const IconComponent = alert.customIcon ? () => alert.customIcon as React.ReactElement : config.icon;
              
              return (
                <Card
                  key={alert.id}
                  className="p-6 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <IconComponent className="w-4 h-4 mt-1" style={{ color: config.iconColor }} />
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-medium mb-1 text-[14px]"
                          style={{ color: config.titleColor }}
                        >
                          {alert.title}
                        </h4>
                        
                        {alert.subtitle && (
                          <p className="text-[12px] text-[#374957] mb-1">
                            {alert.subtitle}
                          </p>
                        )}
                        
                        {alert.propertyAddress && (
                          <p className="text-[12px] text-[#374957] mb-3">
                            {alert.propertyAddress}
                          </p>
                        )}
                        
                        {alert.tenantName && !alert.propertyAddress && (
                          <p className="text-[12px] text-[#374957] mb-3">
                            {alert.tenantName}
                          </p>
                        )}
                        
                        {alert.description && (
                          <p className="text-[12px] text-[#374957] mb-3">
                            {alert.description}
                          </p>
                        )}
                        
                        <div className="flex items-baseline space-x-3">
                          {alert.score && (
                            <span 
                              className="text-[12px] font-bold"
                              style={{ color: config.titleColor }}
                            >
                              {alert.score}% Risk Score
                            </span>
                          )}
                          
                          {alert.amount && (
                            <span 
                              className="text-[12px] font-bold"
                              style={{ color: config.titleColor }}
                            >
                              {formatCurrency(alert.amount)} overdue
                            </span>
                          )}
                          
                          {alert.daysOverdue && (
                            <span 
                              className="text-[12px] font-bold"
                              style={{ color: config.titleColor }}
                            >
                              {alert.daysOverdue} days overdue
                            </span>
                          )}
                          
                          {alert.date && (
                            <span className="text-[12px] text-[#374957]">
                              Predicted: {formatDate(alert.date)}
                            </span>
                          )}
                          
                          {alert.daysOverdue && !alert.amount && (
                            <span className="text-[12px] text-[#374957]">
                              {alert.daysOverdue} days past due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="border rounded-[6px] px-4 py-1 flex items-center justify-center"
                      style={{ 
                        borderColor: config.borderColor,
                        backgroundColor: config.buttonBg
                      }}
                    >
                      <span 
                        className="text-[10px] font-bold"
                        style={{ color: config.buttonColor }}
                      >
                        {alert.actionText || 'View Details'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {alerts.length > maxAlerts && (
              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">
                  +{alerts.length - maxAlerts} more alert{alerts.length - maxAlerts > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriorityAlertsCard;
