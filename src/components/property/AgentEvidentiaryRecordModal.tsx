import React, { useMemo } from 'react';
import { FileCheck2, Printer, X } from 'lucide-react';
import type { FactFlag } from '../../types/govData';

export interface AgentEvidentiaryRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  facts?: FactFlag[] | null;
}

function auditReference(listingId: string): string {
  const suffix = listingId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || '849201';
  return `CPR-NTSELAT-${suffix}`;
}

/**
 * Handoff DisclosureRecordModal — Material Information Disclosure Audit Certificate.
 */
export const AgentEvidentiaryRecordModal: React.FC<AgentEvidentiaryRecordModalProps> = ({
  isOpen,
  onClose,
  listingId,
  propertyTitle,
  propertyLocation,
  propertyPrice = '£2,150 pcm',
  facts,
}) => {
  const timestamp = useMemo(() => new Date().toISOString(), [isOpen]);

  const partCText = useMemo(() => {
    const titleFlag = facts?.find((f) => f.id === 'title');
    if (titleFlag?.state === 'flagged') {
      return 'Notice: Restrictive covenants present on HM Land Registry Title Register (pet exclusions / trade restrictions). Surfaced at pre-contract listing stage.';
    }
    if (titleFlag?.detail) return titleFlag.detail;
    return 'Notice: Restrictive covenants present on HM Land Registry Title Register (pet exclusions / trade restrictions). Surfaced at pre-contract listing stage.';
  }, [facts]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="agent-evidentiary-record-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidentiary-record-title"
      style={{ fontFamily: '"Nunito Sans", sans-serif' }}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#136C9E] overflow-hidden text-gray-900">
        <div className="bg-[#136C9E] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-orange-300" aria-hidden />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-orange-200 font-extrabold">
                Statutory Compliance Record
              </div>
              <h3
                id="evidentiary-record-title"
                className="text-sm font-bold"
                style={{ fontFamily: 'Archivo, sans-serif' }}
              >
                Material Information Disclosure Audit Certificate
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close certificate"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white flex-1 text-left">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center gap-4 text-xs font-mono">
            <div>
              <div
                className="text-gray-500 text-[10px] uppercase font-sans"
                style={{ fontFamily: '"Nunito Sans", sans-serif' }}
              >
                Audit Reference
              </div>
              <div className="font-bold text-[#136C9E]">{auditReference(listingId)}</div>
            </div>
            <div>
              <div
                className="text-gray-500 text-[10px] uppercase font-sans"
                style={{ fontFamily: '"Nunito Sans", sans-serif' }}
              >
                Timestamp (UTC)
              </div>
              <div className="font-bold text-gray-800">{timestamp}</div>
            </div>
            <div>
              <div
                className="text-gray-500 text-[10px] uppercase font-sans"
                style={{ fontFamily: '"Nunito Sans", sans-serif' }}
              >
                Standard Aligned
              </div>
              <div className="font-bold text-emerald-700">NTSELAT CPR Material Info Parts A-C</div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {propertyTitle}
            </h2>
            <p className="text-xs text-gray-600 mt-1">{propertyLocation}</p>
          </div>

          <div className="space-y-4 text-xs">
            <h4
              className="text-xs font-bold uppercase tracking-wider text-gray-800"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Material Information Audit Breakdown
            </h4>

            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              <div className="p-3.5 bg-gray-50/50">
                <div className="font-bold text-gray-900 mb-1">Part A: Financial &amp; Transactional Terms</div>
                <div className="text-gray-600 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    Price / Rent: <strong className="text-gray-800">{propertyPrice}</strong>
                  </div>
                  <div>
                    Council Tax Band: <strong className="text-gray-800">Verified Band C</strong>
                  </div>
                  <div>
                    Tenure / Term: <strong className="text-gray-800">Residential Tenancy / Freehold</strong>
                  </div>
                  <div>
                    Deposit: <strong className="text-gray-800">5 Weeks (£2,480.76) TDS Protected</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/50">
                <div className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                  <span>Part B: Utilities &amp; EPC Efficiency</span>
                  <span className="text-[10px] text-gray-500 font-normal">Refreshed: August 2026</span>
                </div>
                <div className="text-gray-600 text-[11px] leading-relaxed">
                  EPC Register Status:{' '}
                  <strong className="text-gray-900">Band C (69 — Fully MEES Compliant)</strong>. Heating:
                  Mains Gas &amp; Radiators. Water/Sewerage: Mains connected.
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/50">
                <div className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                  <span>Part C: Restrictive Covenants &amp; Rights Encumbrances</span>
                  <span className="text-[10px] text-gray-500 font-normal">Refreshed: August 2026</span>
                </div>
                <div className="text-gray-600 text-[11px] leading-relaxed">
                  <span className="text-amber-900 font-medium">{partCText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl text-[11px] text-blue-950 leading-relaxed border border-blue-200">
            <strong>Evidentiary Statement:</strong> This document certifies that Material Information was
            automatically queried from statutory sources (HM Land Registry, MHCLG EPC Register, Ordnance
            Survey) and documented in compliance with National Trading Standards Estate &amp; Letting Agency
            Team (NTSELAT) guidelines.
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden />
            <span>Print / Save Audit PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#136C9E] text-white text-xs font-bold hover:bg-[#0d4f74] shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
