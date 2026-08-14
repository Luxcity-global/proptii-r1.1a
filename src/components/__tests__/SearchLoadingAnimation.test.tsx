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
    expect(screen.getByText('Scout is sniffing out homes for you')).toBeInTheDocument();
  });

  it('echoes the current search query', () => {
    render(<SearchLoadingAnimation query="2 bed flats in Leeds" />);

    expect(screen.getByText('2 bed flats in Leeds')).toBeInTheDocument();
    expect(screen.getByText(/Looking for/)).toBeInTheDocument();
    expect(screen.getByText('Searching for properties...')).toBeInTheDocument();
  });

  it('cycles status copy while waiting', () => {
    render(<SearchLoadingAnimation />);

    expect(screen.getByText('Scout is sniffing out homes for you')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2400);
    });

    expect(screen.getByText('Checking listings across the UK')).toBeInTheDocument();
  });
});
