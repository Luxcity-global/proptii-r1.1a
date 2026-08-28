import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { entitiesToPills, FilterPills } from '../FilterPills';
import { EMPTY_ENTITIES } from '../../../types/govData';

describe('entitiesToPills', () => {
  it('builds pills from populated entities', () => {
    const pills = entitiesToPills({
      ...EMPTY_ENTITIES,
      location: 'Leeds',
      bedrooms: 2,
      tenure: 'rent',
      price_max: 1200,
    });

    expect(pills.map((p) => p.label)).toEqual([
      'Leeds',
      '2 bed',
      'To rent',
      'Up to £1,200',
    ]);
  });

  it('returns empty list when entities are empty', () => {
    expect(entitiesToPills(EMPTY_ENTITIES)).toEqual([]);
    expect(entitiesToPills(null)).toEqual([]);
  });
});

describe('FilterPills UI', () => {
  it('shows in-flight dots while classifying with no entities yet', () => {
    render(<FilterPills entities={null} isClassifying onDark />);
    expect(screen.getByTestId('filter-pills-inflight')).toHaveTextContent(
      'understanding your search'
    );
  });

  it('shows first three pills and +N overflow for extras', () => {
    render(
      <FilterPills
        entities={{
          ...EMPTY_ENTITIES,
          location: 'Leeds',
          bedrooms: 2,
          tenure: 'rent',
          price_max: 1200,
          radius_hint: 'Near station',
        }}
      />
    );

    expect(screen.getByTestId('filter-pill-location')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-bedrooms')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-tenure')).toBeInTheDocument();
    expect(screen.queryByTestId('filter-pill-price_max')).not.toBeInTheDocument();
    expect(screen.getByTestId('filter-pills-overflow')).toHaveTextContent('+2 more');
  });

  it('hides a pill locally when dismiss is clicked without removing sibling pills', () => {
    render(
      <FilterPills
        entities={{
          ...EMPTY_ENTITIES,
          location: 'Leeds',
          bedrooms: 2,
          tenure: 'rent',
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Hide Leeds filter'));
    expect(screen.queryByTestId('filter-pill-location')).not.toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-bedrooms')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-tenure')).toBeInTheDocument();
  });

  it('opens overflow dropdown and allows dismissing overflow pills', () => {
    render(
      <FilterPills
        entities={{
          ...EMPTY_ENTITIES,
          location: 'Leeds',
          bedrooms: 2,
          tenure: 'rent',
          price_max: 1200,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByTestId('filter-pills-overflow-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Hide Up to £1,200 filter'));
    expect(screen.queryByTestId('filter-pills-overflow')).not.toBeInTheDocument();
  });
});
