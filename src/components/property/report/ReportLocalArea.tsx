import React from 'react';
import { Droplets, Landmark, Shield } from 'lucide-react';
import type { LocalAreaCheck } from '../../../types/govData';
import { ReportDataSource } from './ReportDataSource';
import { ReportStatusChip } from './ReportStatusChip';

interface ReportLocalAreaProps {
  intro: string;
  checks: LocalAreaCheck[];
}

const CARD_STYLES: Record<string, { card: string; tile: string; icon: typeof Droplets }> = {
  'flood-risk': {
    card: 'border-brand-blue/20 bg-brand-blue-light',
    tile: 'bg-brand-blue/15 text-brand-blue',
    icon: Droplets,
  },
  'crime-safety': {
    card: 'border-brand-navy/10 bg-brand-cream',
    tile: 'bg-brand-navy/10 text-brand-navy',
    icon: Shield,
  },
  'heritage-conservation': {
    card: 'border-brand-blue/20 bg-brand-blue-light',
    tile: 'bg-brand-blue/15 text-brand-blue',
    icon: Landmark,
  },
};

const DEFAULT_CARD = CARD_STYLES['flood-risk'];

export const ReportLocalArea: React.FC<ReportLocalAreaProps> = ({ intro, checks }) => {
  if (!checks.length) return null;

  return (
    <section
      id="local-area-intelligence"
      aria-labelledby="local-area-intelligence-title"
      className="rounded-xl border border-rule bg-paper p-5 sm:p-7"
    >
      <div className="pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-blue">
          Enrichment data · Secondary
        </p>
        <h2
          id="local-area-intelligence-title"
          className="mt-2 font-display text-[21px] font-bold tracking-[-0.02em] text-brand-blue sm:text-[26px]"
        >
          Local Area Intelligence
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">{intro}</p>
      </div>

      <ul className="mt-1 grid gap-4 md:grid-cols-3">
        {checks.map((check) => {
          const surface = CARD_STYLES[check.id] || DEFAULT_CARD;
          const Icon = surface.icon;

          return (
            <li key={check.id} className="flex">
              <article
                id={check.id}
                aria-labelledby={`${check.id}-title`}
                className={`flex w-full flex-col rounded-xl border p-4 sm:p-5 ${surface.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${surface.tile}`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <ReportStatusChip label={check.status} tone={check.tone} />
                </div>
                <h3
                  id={`${check.id}-title`}
                  className="mt-4 font-display text-[15px] font-semibold leading-tight tracking-[-0.01em] text-brand-navy sm:text-[16px]"
                >
                  {check.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-muted">{check.finding}</p>
                <div className="mt-auto">
                  <ReportDataSource source={check.source} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
