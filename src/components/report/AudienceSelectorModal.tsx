import React from 'react';
import { ShieldCheck, X, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { AudienceLens, AUDIENCE_METADATA } from '../../data/audienceLensCopy';

export interface AudienceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAudience: (lens: AudienceLens) => void;
  propertyTitle?: string;
}

export const AudienceSelectorModal: React.FC<AudienceSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectAudience,
  propertyTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-nunito animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 relative overflow-hidden text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#136C9E] to-[#0d4f74] text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-archivo">
              Select Your Perspective
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
              {propertyTitle || 'Tailor statutory rights & recommended actions'}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-5">
          Proptii configures legal covenant disclosures, energy efficiency standards, and next steps specifically for your role:
        </p>

        {/* Perspective List */}
        <div className="space-y-2.5 mb-6">
          {(['tenant', 'buyer', 'landlord', 'agent', 'homeowner'] as AudienceLens[]).map((lens) => {
            const meta = AUDIENCE_METADATA[lens];
            return (
              <button
                key={lens}
                type="button"
                onClick={() => onSelectAudience(lens)}
                className="w-full text-left p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-blue-50/80 hover:border-[#136C9E] transition-all group flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-[#136C9E] transition-colors">
                    {meta.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {meta.description}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-[#136C9E] group-hover:text-[#136C9E] group-hover:bg-[#136C9E] group-hover:text-white transition-all flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
        >
          Cancel
        </button>

      </div>
    </div>
  );
};

export default AudienceSelectorModal;
