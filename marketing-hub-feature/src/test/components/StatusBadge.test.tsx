import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/status-badge';

describe('StatusBadge Component', () => {
  it('renders active status badge', () => {
    render(<StatusBadge status="active" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active').closest('div')).toHaveClass('bg-lux-green-100');
  });

  it('renders paused status badge', () => {
    render(<StatusBadge status="paused" />);
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Paused').closest('div')).toHaveClass('bg-lux-orange-100');
  });

  it('renders draft status badge', () => {
    render(<StatusBadge status="draft" />);
    
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Draft').closest('div')).toHaveClass('bg-gray-100');
  });

  it('renders completed status badge', () => {
    render(<StatusBadge status="completed" />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Completed').closest('div')).toHaveClass('bg-lux-blue-100');
  });

  it('renders error status badge', () => {
    render(<StatusBadge status="error" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error').closest('div')).toHaveClass('bg-red-100');
  });

  it('renders pending status badge', () => {
    render(<StatusBadge status="pending" />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending').closest('div')).toHaveClass('bg-yellow-100');
  });

  it('renders good status badge', () => {
    render(<StatusBadge status="good" />);
    
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Good').closest('div')).toHaveClass('bg-lux-green-100');
  });

  it('renders fair status badge', () => {
    render(<StatusBadge status="fair" />);
    
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Fair').closest('div')).toHaveClass('bg-lux-orange-100');
  });

  it('renders poor status badge', () => {
    render(<StatusBadge status="poor" />);
    
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Poor').closest('div')).toHaveClass('bg-red-100');
  });

  it('can hide icon', () => {
    render(<StatusBadge status="active" showIcon={false} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Icon should not be present
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusBadge status="active" className="custom-class" />);
    
    expect(screen.getByText('Active').closest('div')).toHaveClass('custom-class');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<StatusBadge status="active" variant="outline" />);
    expect(screen.getByText('Active').closest('div')).toHaveClass('border');

    rerender(<StatusBadge status="active" variant="secondary" />);
    // The component uses custom status-based styling that overrides the variant
    expect(screen.getByText('Active').closest('div')).toHaveClass('bg-lux-green-100');
  });
});
