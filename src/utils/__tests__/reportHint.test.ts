import { describe, expect, it } from 'vitest';
import { reportHintFromFlags } from '../reportHint';
import type { FactFlag } from '../../types/govData';

describe('reportHintFromFlags', () => {
  const flags: FactFlag[] = [
    { id: 'epc', label: 'EPC Band C', state: 'clear' },
    { id: 'title', label: 'Covenants Noted', state: 'flagged' },
  ];

  it('prefers an explicit listing hint', () => {
    expect(reportHintFromFlags(flags, 'Conservation area')).toBe('Conservation area');
  });

  it('uses the first flagged fact label when no listing hint is set', () => {
    expect(reportHintFromFlags(flags)).toBe('Covenants Noted');
  });

  it('returns null when there is nothing to show so the grid slot can stay empty', () => {
    expect(reportHintFromFlags(null)).toBeNull();
    expect(reportHintFromFlags([])).toBeNull();
    expect(reportHintFromFlags([{ id: 'epc', label: 'EPC Band B', state: 'clear' }])).toBeNull();
  });
});
