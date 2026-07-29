import React, { useState } from 'react';
import type { PricingAudience } from '../../utils/pricingRoutes';
import { COMPARE_DATA, type CompareRow } from './compareData';

function ColCell({
  val,
}: {
  val: 'yes' | 'no' | { partial: string } | string;
}) {
  if (val === 'yes') return <td className="pr-yes">✓</td>;
  if (val === 'no') return <td className="pr-no">—</td>;
  if (typeof val === 'object' && 'partial' in val) {
    return (
      <td>
        <span className="pr-partial">{val.partial}</span>
      </td>
    );
  }
  return <td>{val}</td>;
}

interface Props {
  audience: PricingAudience;
}

/** S2-07 — Collapsible feature comparison table. */
const PricingCompareSection: React.FC<Props> = ({ audience }) => {
  const [open, setOpen] = useState(false);
  const cmpData = COMPARE_DATA[audience];

  return (
    <section className="pr-compare-section">
      <div className="pr-compare-toggle">
        <button type="button" onClick={() => setOpen((v) => !v)}>
          Compare all features in detail
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transition: 'transform .2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="3,5 7,9 11,5" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="pr-compare-table-wrap">
          <table className="pr-compare-table">
            <thead>
              <tr>
                <th style={{ width: '36%' }}>Feature</th>
                {cmpData.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cmpData.rows.map((row: CompareRow, i) => {
                if (row.type === 'section') {
                  return (
                    <tr key={i} className="pr-section-row">
                      <td colSpan={4}>{row.label}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={i}>
                    <td className="pr-feature-name">{row.feature}</td>
                    {row.cols.map((col, ci) => (
                      <ColCell key={ci} val={col} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PricingCompareSection;
