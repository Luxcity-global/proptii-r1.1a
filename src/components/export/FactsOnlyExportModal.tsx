import React from 'react';
import { Download, Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { FlagState, getFreshnessString } from '../../data/audienceLensCopy';

export interface FactsOnlyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyAddress: string;
  price?: string | number;
  isFlagged?: boolean;
  isUnresolved?: boolean;
}

export const FactsOnlyExportModal: React.FC<FactsOnlyExportModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  propertyAddress,
  price,
  isFlagged = false,
  isUnresolved = false,
}) => {
  if (!isOpen) return null;

  const flagState: FlagState = isUnresolved ? 'unresolved' : isFlagged ? 'flagged' : 'clear';
  const timestamp = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#4CA1D0]" />
            <div>
              <h3 className="text-sm font-bold font-archivo">
                Proptii Facts-Only Verification Sheet
              </h3>
              <p className="text-[11px] text-gray-400">Public Document • No Audience Bias</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 bg-white text-gray-900 flex-1">
          
          {/* Document Header */}
          <div className="border-b border-gray-200 pb-4 flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-[#136C9E] uppercase tracking-wider">
                Official Register Extract
              </div>
              <h2 className="text-xl font-bold font-archivo mt-1">{propertyTitle}</h2>
              <p className="text-xs text-gray-600 mt-0.5">{propertyAddress}</p>
            </div>

            <div className="text-right text-xs text-gray-500">
              <div>Date: <strong>{timestamp}</strong></div>
              <div>System: <strong>Proptii Core v1.4</strong></div>
            </div>
          </div>

          {/* Neutral Summary Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Verified Register Points
            </h4>

            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-gray-50 p-3 font-bold border-b border-gray-200 text-gray-700">
                <span>Register Category</span>
                <span>Verified Status</span>
                <span>Source & Freshness</span>
              </div>

              {/* Row 1: HMLR */}
              <div className="grid grid-cols-3 p-3 border-b border-gray-100 items-center">
                <span className="font-semibold text-gray-900">HM Land Registry Title</span>
                <span className="flex items-center gap-1.5">
                  {flagState === 'clear' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {flagState === 'flagged' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  {flagState === 'unresolved' && <HelpCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="capitalize font-medium">{flagState}</span>
                </span>
                <span className="text-gray-500 text-[11px]">{getFreshnessString('HMLR')}</span>
              </div>

              {/* Row 2: EPC */}
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-gray-900">National EPC Register</span>
                <span className="flex items-center gap-1.5">
                  {flagState === 'clear' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {flagState === 'flagged' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  {flagState === 'unresolved' && <HelpCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="capitalize font-medium">{flagState} (Band C / 69)</span>
                </span>
                <span className="text-gray-500 text-[11px]">{getFreshnessString('EPC')}</span>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-gray-50 p-4 rounded-xl text-[11px] text-gray-500 leading-relaxed border border-gray-200">
            <strong>Disclosure Notice:</strong> This summary reflects raw data retrieved from statutory registers. No legal advice or transactional representation is implied. Definitional terms can be verified at proptii.com/tools/know-your-rights.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#136C9E] text-white text-xs font-bold hover:bg-[#0d4f74] shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default FactsOnlyExportModal;
