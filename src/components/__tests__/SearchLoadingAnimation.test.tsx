import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SearchLoadingAnimation } from '../SearchLoadingAnimation';

describe('SearchLoadingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces search loading without changing search behaviour', () => {
    render(<SearchLoadingAnimation />);

    expect(screen.getByRole('status', { name: 'Searching for properties' })).toBeInTheDocument();
    expect(screen.getByText('Searching for properties...')).toBeInTheDocument();
    expect(screen.getAllByText('Understanding your search').length).toBeGreaterThan(0);
    expect(screen.getByAltText('Scout')).toHaveAttribute('src', '/images/Scout ava.png');
  });

  it('echoes the current search query', () => {
    render(<SearchLoadingAnimation query="2 bed flats in Leeds" />);

    expect(screen.getByText(/2 bed flats in Leeds/)).toBeInTheDocument();
    expect(screen.getByText('Searching for properties...')).toBeInTheDocument();
  });

  it('advances through search stages while waiting', () => {
    render(<SearchLoadingAnimation />);

    expect(screen.getAllByText('Understanding your search').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.getAllByText('Scanning live listings').length).toBeGreaterThan(0);
  });
});
