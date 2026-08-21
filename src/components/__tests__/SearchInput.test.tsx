import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';
import { GovDataLayerProvider } from '../../contexts/GovDataLayerContext';
import { propertySearchFallback } from '../../types/govData';

let mockNavigate: ReturnType<typeof vi.fn>;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/govDataService', async () => {
  const actual = await vi.importActual<typeof import('../../services/govDataService')>(
    '../../services/govDataService',
  );
  return {
    ...actual,
    fetchRuntimeFlags: vi.fn(async () => ({ gov_data_layer: false })),
    classifySearchQuery: vi.fn(async () => propertySearchFallback()),
  };
});

const renderSearch = (ui: React.ReactElement) =>
  render(<GovDataLayerProvider>{ui}</GovDataLayerProvider>);

describe('SearchInput', () => {
  beforeEach(() => {
    mockNavigate = vi.fn();
  });

  it('renders with default placeholder', () => {
    renderSearch(<SearchInput />);
    expect(screen.getByPlaceholderText('AI-assisted property search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    renderSearch(<SearchInput placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('keeps the search button disabled when the query is empty', () => {
    renderSearch(<SearchInput />);
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeDisabled();
    fireEvent.click(searchButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to search results with default platform (On the Market)', async () => {
    renderSearch(<SearchInput />);

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
    renderSearch(<SearchInput />);

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
    renderSearch(<SearchInput onSearch={onSearch} />);

    const textarea = screen.getByPlaceholderText('AI-assisted property search...');
    const searchButton = screen.getByRole('button', { name: 'Search' });

    await userEvent.type(textarea, 'test query');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test query');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not mount gov-data chrome when the runtime flag is off', () => {
    renderSearch(<SearchInput />);
    expect(screen.queryByTestId('gov-data-search-chrome')).not.toBeInTheDocument();
  });
});
