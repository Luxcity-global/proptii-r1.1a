import React from 'react';
import { PriorityAlertsCard, AlertItem } from '../PriorityAlertsCard';

// Example usage of PriorityAlertsCard
export function PriorityAlertsCardExample() {
  // Example alert data
  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'vacancy-risk',
      title: 'High Vacancy Risk',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      score: 85,
      date: new Date('2025-03-15'),
      actionText: 'View Details',
      onAction: (alert) => console.log('View vacancy alert:', alert)
    },
    {
      id: '2',
      type: 'rent-arrears',
      title: 'Rent Arrears',
      tenantName: 'Sarah Johnson',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      amount: 2400,
      daysOverdue: 12,
      actionText: 'Manage',
      onAction: (alert) => console.log('Manage arrears:', alert)
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'Urgent Maintenance',
      propertyAddress: '456 Oxford Street, London W1C 1JN',
      description: 'Boiler repair required',
      actionText: 'Schedule',
      onAction: (alert) => console.log('Schedule maintenance:', alert)
    },
    {
      id: '4',
      type: 'document-expiry',
      title: 'Gas Safety Certificate',
      propertyAddress: '789 Piccadilly, London W1J 0BH',
      date: new Date('2025-01-20'),
      actionText: 'Renew',
      onAction: (alert) => console.log('Renew document:', alert)
    },
    {
      id: '5',
      type: 'custom',
      title: 'Insurance Renewal',
      propertyAddress: '321 Bond Street, London W1S 1SS',
      customColor: '#8b5cf6',
      actionText: 'Review',
      onAction: (alert) => console.log('Review insurance:', alert)
    }
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Priority Alerts Card Examples</h2>
        
        {/* Default Usage */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Default Usage</h3>
          <PriorityAlertsCard
            alerts={alerts}
            onAlertClick={(alert) => console.log('Alert clicked:', alert)}
          />
        </div>

        {/* Custom Styling */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Custom Styling</h3>
          <PriorityAlertsCard
            alerts={alerts.slice(0, 2)}
            title="Critical Issues"
            subtitle="Requires immediate attention"
            customGradient={{
              from: '#fef3c7',
              to: '#fed7aa'
            }}
            customBorderColor="#f59e0b"
            maxAlerts={3}
            height="400px"
            onAlertClick={(alert) => console.log('Custom alert clicked:', alert)}
          />
        </div>

        {/* Different Alert Types */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Different Alert Types</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriorityAlertsCard
              alerts={alerts.filter(alert => alert.type === 'vacancy-risk')}
              title="Vacancy Alerts"
              maxAlerts={1}
              height="280px"
            />
            <PriorityAlertsCard
              alerts={alerts.filter(alert => alert.type === 'rent-arrears')}
              title="Payment Issues"
              maxAlerts={1}
              height="280px"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Empty State (No Alerts)</h3>
          <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
            <PriorityAlertsCard alerts={[]} />
            <p className="mt-4">Component won't render when no alerts are provided</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriorityAlertsCardExample;
