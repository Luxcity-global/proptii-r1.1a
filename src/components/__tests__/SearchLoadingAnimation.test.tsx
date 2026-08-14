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

  it('starts on the first step instead of marking earlier steps complete', () => {
    render(<SearchLoadingAnimation />);

    expect(document.querySelector('.search-load-headline')?.textContent).toBe('Understanding your search');
    expect(document.querySelectorAll('.search-load-step-icon.is-done')).toHaveLength(0);
    expect(document.querySelectorAll('.search-load-step-icon.is-active')).toHaveLength(1);
  });

  it('ticks the next step only after the progress bar has moved on', () => {
    render(<SearchLoadingAnimation />);

    act(() => {
      vi.advanceTimersByTime(14900);
    });

    expect(document.querySelector('.search-load-headline')?.textContent).toBe('Understanding your search');
    expect(document.querySelectorAll('.search-load-step-icon.is-done')).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(document.querySelector('.search-load-headline')?.textContent).toBe('Scanning live listings');
    expect(document.querySelectorAll('.search-load-step-icon.is-done')).toHaveLength(1);
  });
});
