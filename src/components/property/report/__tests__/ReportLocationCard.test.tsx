import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportLocationCard } from '../ReportLocationCard';

describe('ReportLocationCard', () => {
  it('renders a static map image for a non-empty embed query', () => {
    render(
      <ReportLocationCard
        embedQuery="Falcon Road, London SW11 2LN"
        addressLabel="Falcon Road, London SW11 2LN"
      />,
    );
    expect(screen.getByAltText(/Approximate location/i)).toBeInTheDocument();
    expect(screen.getByTestId('report-location-map')).toBeInTheDocument();
    expect(screen.getByTestId('report-map-zoom-controls')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByTestId('report-map-pin')).toBeInTheDocument();
    expect(screen.getByTestId('report-location-card')).toBeInTheDocument();
    expect(screen.queryByTestId('report-location-map-placeholder')).not.toBeInTheDocument();
    expect(screen.queryByText(/postcodes\.io/i)).not.toBeInTheDocument();
    const map = screen.getByTestId('report-location-map');
    expect(map.querySelector('svg')).toBeTruthy();
  });

  it('falls back to the address so the map slot is not empty', () => {
    render(
      <ReportLocationCard
        embedQuery=""
        addressLabel="Hammerton Street, Pudsey"
      />,
    );
    const mapImage = screen.getByAltText(/Approximate location of Hammerton Street, Pudsey/i);
    expect(mapImage).toBeInTheDocument();
    expect(mapImage.getAttribute('src')).toMatch(/wikimedia|staticmap|data:image\/svg\+xml/);
  });

  it('hides the map area when there is no map query', () => {
    render(<ReportLocationCard embedQuery="" addressLabel="" />);
    expect(screen.getByTestId('report-location-card')).toBeInTheDocument();
    expect(screen.queryByTestId('report-location-map-placeholder')).not.toBeInTheDocument();
    expect(screen.queryByAltText(/Approximate location/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Map pending/i)).not.toBeInTheDocument();
    expect(screen.getByText(/map not available/i)).toBeInTheDocument();
  });
});
