import React, { useState } from 'react';
import { Download, FileCheck2 } from 'lucide-react';
import type { FactFlag } from '../../types/govData';
import { AgentEvidentiaryRecordModal } from './AgentEvidentiaryRecordModal';
import { trackEvent } from '../../utils/analytics';

interface AgentComplianceActionsProps {
  listingId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  facts?: FactFlag[] | null;
  /** compact = inside ProptiiModule; footer = report modal footer row */
  layout?: 'compact' | 'footer';
  className?: string;
}

function exportFactsOnlyPublic(payload: {
  listingId: string;
  propertyTitle: string;
  propertyLocation: string;
  facts: FactFlag[] | null | undefined;
}) {
  const body = {
    type: 'facts-only-public',
    exportedAt: new Date().toISOString(),
    listingId: payload.listingId,
    property: {
      title: payload.propertyTitle,
      location: payload.propertyLocation,
    },
    facts: payload.facts ?? [],
    disclaimer:
      'Public facts-only export — no audience lens narrative or legal advice included.',
  };

  const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `proptii-facts-public-${payload.listingId.slice(0, 12)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Agent lens actions from handoff Step 6 footer — shown on property details when Agent is selected.
 */
export const AgentComplianceActions: React.FC<AgentComplianceActionsProps> = ({
  listingId,
  propertyTitle,
  propertyLocation,
  propertyPrice,
  facts,
  layout = 'compact',
  className = '',
}) => {
  const [evidentiaryOpen, setEvidentiaryOpen] = useState(false);

  const handleExport = () => {
    exportFactsOnlyPublic({
      listingId,
      propertyTitle,
      propertyLocation,
      facts,
    });
    trackEvent('gov_data_agent_export_facts', { listingId });
  };

  const buttonRow = (
    <div
      className={`flex flex-wrap items-center gap-2.5 ${layout === 'footer' ? '' : 'pt-2 border-t border-[#136C9E]/10'}`}
    >
      <button
        type="button"
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold shadow-sm transition-all"
        data-testid="agent-export-facts-public"
      >
        <span className="text-gray-500" aria-hidden>
          <Download className="w-3.5 h-3.5" />
        </span>
        <span>Export Facts-Only (Public)</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setEvidentiaryOpen(true);
          trackEvent('gov_data_agent_evidentiary_open', { listingId });
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#136C9E] hover:bg-[#0d4f74] text-white text-xs font-bold shadow-sm transition-all group"
        data-testid="agent-evidentiary-record-trigger"
      >
        <FileCheck2 className="w-3.5 h-3.5 text-orange-300 group-hover:scale-110 transition-transform" aria-hidden />
        <span>Agent Evidentiary Record</span>
      </button>
    </div>
  );

  return (
    <div className={className} data-testid="agent-compliance-actions">
      {layout === 'compact' && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#136C9E] mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Agent compliance exports
        </p>
      )}
      {buttonRow}

      <AgentEvidentiaryRecordModal
        isOpen={evidentiaryOpen}
        onClose={() => setEvidentiaryOpen(false)}
        listingId={listingId}
        propertyTitle={propertyTitle}
        propertyLocation={propertyLocation}
        propertyPrice={propertyPrice}
        facts={facts}
      />
    </div>
  );
};
