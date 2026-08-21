import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FactsBadgeRow } from '../FactsBadgeRow';

describe('FactsBadgeRow', () => {
  it('renders unresolved when flags are missing and unresolvedFallback is set', () => {
    render(<FactsBadgeRow flags={null} unresolvedFallback />);
    expect(screen.getByText('Unresolved')).toBeInTheDocument();
    expect(screen.getByText('Gov data')).toBeInTheDocument();
  });

  it('does not invent clear when flags are absent without fallback', () => {
    const { container } = render(<FactsBadgeRow flags={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders clear and flagged states from flags', () => {
    render(
      <FactsBadgeRow
        flags={[
          { id: 'flood', label: 'Flood risk', state: 'clear' },
          { id: 'epc', label: 'EPC', state: 'flagged' },
        ]}
      />,
    );
    expect(screen.getByText('Flood risk')).toBeInTheDocument();
    expect(screen.getByText('EPC')).toBeInTheDocument();
    expect(screen.getAllByText(/Clear|Flagged/)).toHaveLength(2);
  });
});
