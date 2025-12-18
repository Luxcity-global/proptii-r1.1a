import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';

let mockNavigate: ReturnType<typeof vi.fn>;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SearchInput', () => {
  beforeEach(() => {
    mockNavigate = vi.fn();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('AI-assisted property search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('shows error message when submitting empty query', async () => {
    render(<SearchInput />);
    const searchButton = screen.getByRole('button', { name: 'Search' });

    fireEvent.click(searchButton);

    expect(await screen.findByText('Please enter a search query')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to search results with default platform (On the Market)', async () => {
    render(<SearchInput />);

    const textarea = screen.getByPlaceholderText('AI-assisted property search...');
    const searchButton = screen.getByRole('button', { name: 'Search' });

    await userEvent.type(textarea, '2 bed flats in Leeds');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/search?q=${encodeURIComponent('2 bed flats in Leeds')}&type=onthemarket`
      );
    });
  });

  it('switches platform to Proptii via icon button and navigates with type=proptii', async () => {
    render(<SearchInput />);

    const proptiiButton = screen.getByRole('button', { name: 'Proptii' });
    fireEvent.click(proptiiButton);

    const textarea = screen.getByPlaceholderText('AI-assisted property search...');
    const searchButton = screen.getByRole('button', { name: 'Search' });

    await userEvent.type(textarea, 'studio in London');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/search?q=${encodeURIComponent('studio in London')}&type=proptii`
      );
    });
  });

  it('calls onSearch when provided (and does not navigate)', async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    const textarea = screen.getByPlaceholderText('AI-assisted property search...');
    const searchButton = screen.getByRole('button', { name: 'Search' });

    await userEvent.type(textarea, 'test query');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test query');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});