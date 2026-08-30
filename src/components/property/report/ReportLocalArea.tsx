import React from 'react';
import { Droplets, Landmark, Shield, Zap } from 'lucide-react';
import type { LocalAreaCheck } from '../../../types/govData';
import { ReportDataSource } from './ReportDataSource';
import { ReportStatusChip } from './ReportStatusChip';

interface ReportLocalAreaProps {
  intro: string;
  checks: LocalAreaCheck[];
}

const CARD_STYLES: Record<string, { tile: string; icon: typeof Droplets }> = {
  'flood-risk': {
    tile: 'bg-cyan-50 text-cyan-700',
    icon: Droplets,
  },
  'crime-safety': {
    tile: 'bg-amber-50 text-amber-600',
    icon: Shield,
  },
  'heritage-conservation': {
    tile: 'bg-blue-50 text-[#136C9E]',
    icon: Landmark,
  },
  epc: {
    tile: 'bg-blue-50 text-[#136C9E]',
    icon: Zap,
  },
};

const DEFAULT_CARD = CARD_STYLES['heritage-conservation'];

export const ReportLocalArea: React.FC<ReportLocalAreaProps> = ({ intro, checks }) => {
  if (!checks.length) return null;

  return (
    <section
      id="local-area-intelligence"
      aria-labelledby="local-area-intelligence-title"
      className="space-y-3 pt-2"
    >
      <h2
        id="local-area-intelligence-title"
        className="text-[11px] font-normal text-slate-600 uppercase tracking-widest font-archivo"
      >
        Local open intelligence — evaluated at the postcode centroid
      </h2>
      <p className="sr-only">{intro}</p>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {checks.map((check) => {
          const surface = CARD_STYLES[check.id] || DEFAULT_CARD;
          const Icon = surface.icon;

          return (
            <li key={check.id} className="flex">
              <article
                id={check.id}
                aria-labelledby={`${check.id}-title`}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-[0_16px_32px_#E7F2FF] hover:border-[#136C9E] transition-all duration-200 flex flex-col justify-between w-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${surface.tile}`}>
                      <Icon aria-hidden="true" className="w-4 h-4" />
                    </div>
                    <ReportStatusChip label={check.status} tone={check.tone} />
                  </div>

                  <h3
                    id={`${check.id}-title`}
                    className="text-[15px] font-normal text-gray-900 font-archivo mb-1"
                  >
                    {check.title}
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-4 font-normal">
                    {check.finding}
                  </p>
                </div>
                <ReportDataSource source={check.source} />
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
