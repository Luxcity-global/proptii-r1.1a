import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../../components/kpi-card';
import { TrendingUp } from 'lucide-react';

describe('KPICard Component', () => {
  it('renders basic KPI card with title and value', () => {
    render(
      <KPICard
        title="Total Leads"
        value="1,234"
      />
    );

    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders with trend information', () => {
    render(
      <KPICard
        title="Conversion Rate"
        value="12.5%"
        trend="up"
        trendValue="+2.3%"
      />
    );

    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('+2.3%')).toBeInTheDocument();
  });

  it('renders with target information', () => {
    render(
      <KPICard
        title="Revenue"
        value="$50,000"
        target={75000}
      />
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('Target: 75000')).toBeInTheDocument();
  });

  it('renders with progress bar', () => {
    render(
      <KPICard
        title="Campaign Progress"
        value="75%"
        progress={75}
      />
    );

    expect(screen.getByText('Campaign Progress')).toBeInTheDocument();
    expect(screen.getAllByText('75%')).toHaveLength(2); // Value and progress percentage
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('renders with different status colors', () => {
    const { rerender } = render(
      <KPICard
        title="Good Status"
        value="100"
        status="good"
      />
    );
    expect(screen.getByText('Good Status').closest('[data-slot="card"]')).toHaveClass('bg-lux-green-50');

    rerender(
      <KPICard
        title="Fair Status"
        value="50"
        status="fair"
      />
    );
    expect(screen.getByText('Fair Status').closest('[data-slot="card"]')).toHaveClass('bg-lux-orange-50');

    rerender(
      <KPICard
        title="Poor Status"
        value="10"
        status="poor"
      />
    );
    expect(screen.getByText('Poor Status').closest('[data-slot="card"]')).toHaveClass('bg-red-50');
  });

  it('renders with icon', () => {
    render(
      <KPICard
        title="With Icon"
        value="500"
        icon={<TrendingUp data-testid="trend-icon" />}
      />
    );

    expect(screen.getByTestId('trend-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <KPICard
        title="Custom Class"
        value="100"
        className="custom-class"
      />
    );

    expect(screen.getByText('Custom Class').closest('[data-slot="card"]')).toHaveClass('custom-class');
  });
});
