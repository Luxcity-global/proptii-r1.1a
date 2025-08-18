import React, { useState } from 'react';
import { Database, Building2, Globe, CheckCircle2 } from 'lucide-react';

interface SourceFilterPanelProps {
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface DataSource {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'active' | 'inactive';
  propertyCount?: number;
}

const dataSources: DataSource[] = [
  {
    id: 'openrent',
    name: 'openrent',
    displayName: 'OpenRent',
    description: 'UK\'s largest letting agent. Best for rental properties.',
    icon: <Building2 style={{ width: 20, height: 20 }} />,
    color: '#10B981',
    status: 'active',
    propertyCount: 80
  },
  {
    id: 'onthemarket',
    name: 'onthemarket',
    displayName: 'OnTheMarket',
    description: 'Major UK property portal for rentals and sales.',
    icon: <Globe style={{ width: 20, height: 20 }} />,
    color: '#3B82F6',
    status: 'active',
    propertyCount: 80
  }
];

const SourceFilterPanel: React.FC<SourceFilterPanelProps> = ({
  selectedSources,
  onSourcesChange,
  isVisible,
  onClose,
}) => {
  const [tempSelectedSources, setTempSelectedSources] = useState<string[]>(selectedSources);

  const handleSourceToggle = (sourceId: string) => {
    if (tempSelectedSources.includes(sourceId)) {
      // If it's selected, remove it (but keep at least one source)
      if (tempSelectedSources.length > 1) {
        setTempSelectedSources(tempSelectedSources.filter(id => id !== sourceId));
      }
    } else {
      // If it's not selected, add it
      setTempSelectedSources([...tempSelectedSources, sourceId]);
    }
  };

  const handleSelectAll = () => {
    setTempSelectedSources(dataSources.map(source => source.id));
  };

  const handleApplyFilter = () => {
    onSourcesChange(tempSelectedSources);
    onClose();
  };

  const handleReset = () => {
    setTempSelectedSources(dataSources.map(source => source.id));
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Database style={{ width: 24, height: 24, color: '#E65D24' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#23272f', margin: 0 }}>
              Data Sources
            </h2>
          </div>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            Choose which property portals to search. Selecting multiple sources gives you more comprehensive results.
          </p>
        </div>

        {/* Source Options */}
        <div style={{ marginBottom: '24px' }}>
          {dataSources.map((source) => {
            const isSelected = tempSelectedSources.includes(source.id);
            const isDisabled = tempSelectedSources.length === 1 && isSelected;

            return (
              <div
                key={source.id}
                style={{
                  border: `2px solid ${isSelected ? source.color : '#e5e5e5'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  background: isSelected ? `${source.color}08` : '#fff',
                  opacity: isDisabled ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => !isDisabled && handleSourceToggle(source.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: source.color }}>
                    {source.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#23272f', margin: 0 }}>
                        {source.displayName}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 style={{ width: 18, height: 18, color: source.color }} />
                      )}
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: source.status === 'active' ? '#10B981' : '#F59E0B',
                          background: source.status === 'active' ? '#10B98110' : '#F59E0B10',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {source.status === 'active' ? 'Active' : 'Limited'}
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, marginBottom: '8px' }}>
                      {source.description}
                    </p>
                    {source.propertyCount && (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        ~{source.propertyCount.toLocaleString()} properties available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleSelectAll}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Select All
          </button>
          <button
            onClick={handleReset}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilter}
            style={{
              background: '#E65D24',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Apply Sources ({tempSelectedSources.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceFilterPanel; 