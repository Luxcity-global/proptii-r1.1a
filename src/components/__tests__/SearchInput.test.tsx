import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';
import { useSearch } from '../../hooks/useSearch';

// Mock the useSearch hook
jest.mock('../../hooks/useSearch');
const mockUseSearch = useSearch as jest.MockedFunction<typeof useSearch>;

describe('SearchInput', () => {
  const mockOnSearch = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearch.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
      isOffline: false,
      getSuggestions: jest.fn().mockResolvedValue([]),
      searchProperties: jest.fn().mockResolvedValue([])
    });
  });

  it('renders with default props', () => {
    render(<SearchInput onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search properties...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput onSearch={mockOnSearch} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search properties...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await userEvent.type(input, 'test query');
    fireEvent.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('shows error message when submitting empty query', async () => {
    render(<SearchInput onSearch={mockOnSearch} />);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.click(searchButton);

    expect(await screen.findByText('Please enter a search query')).toBeInTheDocument();
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('displays loading state', () => {
    mockUseSearch.mockReturnValue({
      suggestions: [],
      isLoading: true,
      error: null,
      isOffline: false,
      getSuggestions: jest.fn(),
      searchProperties: jest.fn()
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });

  it('displays error message', () => {
    const errorMessage = 'Search failed';
    mockUseSearch.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: new Error(errorMessage),
      isOffline: false,
      getSuggestions: jest.fn(),
      searchProperties: jest.fn()
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays offline indicator', () => {
    mockUseSearch.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
      isOffline: true,
      getSuggestions: jest.fn(),
      searchProperties: jest.fn()
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('displays suggestions when input is focused', async () => {
    const suggestions = ['suggestion 1', 'suggestion 2'];
    mockUseSearch.mockReturnValue({
      suggestions,
      isLoading: false,
      error: null,
      isOffline: false,
      getSuggestions: jest.fn().mockResolvedValue(suggestions),
      searchProperties: jest.fn()
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search properties...');
    
    await userEvent.type(input, 'test');
    fireEvent.focus(input);

    await waitFor(() => {
      suggestions.forEach(suggestion => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });
    });
  });

  it('calls onSearch when suggestion is clicked', async () => {
    const suggestions = ['suggestion 1'];
    mockUseSearch.mockReturnValue({
      suggestions,
      isLoading: false,
      error: null,
      isOffline: false,
      getSuggestions: jest.fn().mockResolvedValue(suggestions),
      searchProperties: jest.fn()
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search properties...');
    
    await userEvent.type(input, 'test');
    fireEvent.focus(input);

    const suggestion = await screen.findByText('suggestion 1');
    fireEvent.click(suggestion);

    expect(mockOnSearch).toHaveBeenCalledWith('suggestion 1');
  });

  it('clears input when clear button is clicked', async () => {
    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search properties...');
    
    await userEvent.type(input, 'test query');
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('handles controlled input value', () => {
    const value = 'controlled value';
    render(<SearchInput onSearch={mockOnSearch} value={value} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Search properties...');
    
    expect(input).toHaveValue(value);
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('displays no results state', () => {
    render(<SearchInput onSearch={mockOnSearch} hasResults={false} value="test query" />);
    expect(screen.getByText('No properties found')).toBeInTheDocument();
  });

  it('hides camera and mic buttons on mobile', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    render(<SearchInput onSearch={mockOnSearch} />);
    
    expect(screen.queryByRole('button', { name: /search by image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /search by voice/i })).not.toBeInTheDocument();
  });
}); 