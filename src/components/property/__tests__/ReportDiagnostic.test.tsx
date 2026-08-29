import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportDiagnostic } from '../ReportDiagnostic';

describe('ReportDiagnostic', () => {
  it('renders backend sources[] instead of hardcoded fallback steps', () => {
    render(
      <ReportDiagnostic
        isOpen
        addressLabel="12 Falcon Road, London SW11 2LN"
        audience="tenant"
        sources={[
          { id: 'epc', title: 'Validating National EPC Register', detail: 'Band C check' },
          { id: 'flood', title: 'Checking EA flood CSV', detail: 'Postcode centroid' },
        ]}
        onComplete={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Validating National EPC Register')).toBeInTheDocument();
    expect(screen.getByText('Checking EA flood CSV')).toBeInTheDocument();
    expect(screen.queryByText(/Ordnance Survey & UPRN/i)).not.toBeInTheDocument();
  });
});
