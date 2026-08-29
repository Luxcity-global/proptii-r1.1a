import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parsePaidPendingCopy, ReportPendingSection } from '../ReportPendingSection';

describe('ReportPendingSection', () => {
  it('always shows the dancing pending chip', () => {
    render(
      <ReportPendingSection
        kicker="Part C"
        title="Restrictive Covenants & Title"
        statusLabel="To come in next release"
        body="Title register pending."
        testId="report-part-c-pending"
      />,
    );
    expect(screen.getByText('To come in next release')).toBeInTheDocument();
    expect(screen.getByText('To come in next release')).toHaveClass('report-pending-chip');
  });

  it('parses paid copy into title and status label', () => {
    expect(
      parsePaidPendingCopy(
        'Deeper legal, compliance & professional checks — paid, coming later in this journey',
      ),
    ).toEqual({
      title: 'Deeper legal, compliance & professional checks',
      statusLabel: 'Coming later in this journey',
    });
  });
});
