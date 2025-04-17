# AI Search Input Bar Documentation

## Overview

The Proptii application features an advanced AI-powered search input bar that provides real-time property search capabilities. This documentation covers the implementation details, configuration, and usage of the AI search input features.

## Features

### 1. Predictive Search Typing

The search input bar provides real-time suggestions as users type:

- **Instant Feedback**: Updates search results as user types
- **Smart Suggestions**: AI-powered property suggestions
- **Debounced Input**: Prevents excessive API calls
- **Error Handling**: Graceful fallback for failed requests

### 2. Loading State Bar

Visual feedback during search operations:

- **Progress Indicator**: Animated loading bar
- **State Management**: Clear loading states
- **Error States**: Visual feedback for errors
- **Success States**: Confirmation of successful searches

### 3. Search Results Layout

Results are displayed in a 2x2 grid layout:

- **Grid System**: Responsive 2x2 grid
- **Property Cards**: Consistent card design
- **Integration Support**: Rightmove, Zoopla, OpenRent, OnTheMarket
- **Responsive Design**: Adapts to different screen sizes

## Implementation Details

### Search Input Component

```typescript
// SearchInput.tsx
interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  error: string | null;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  isLoading,
  error
}) => {
  // Implementation details
};
```

### Loading State Bar

```typescript
// LoadingBar.tsx
interface LoadingBarProps {
  isLoading: boolean;
  progress: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({
  isLoading,
  progress
}) => {
  // Implementation details
};
```

### Search Results Grid

```typescript
// SearchResults.tsx
interface SearchResultsProps {
  results: Property[];
  isLoading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  error
}) => {
  // Implementation details
};
```

## Configuration

### Environment Variables

```env
# Azure OpenAI Configuration
VITE_AZURE_OPENAI_API_KEY=your_api_key
VITE_AZURE_OPENAI_ENDPOINT=your_endpoint
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment

# Search Configuration
VITE_SEARCH_DEBOUNCE_MS=300
VITE_MAX_SUGGESTIONS=5
```

### API Configuration

```typescript
// api/config.ts
export const searchConfig = {
  debounceTime: 300,
  maxSuggestions: 5,
  apiVersion: '2024-02-15-preview',
  endpoints: {
    search: '/api/search',
    suggestions: '/api/suggestions'
  }
};
```

## Usage

### Basic Search

```typescript
// Example usage
const handleSearch = async (query: string) => {
  try {
    setIsLoading(true);
    const results = await searchProperties(query);
    setSearchResults(results);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Predictive Search

```typescript
// Example usage
const handleInputChange = debounce(async (query: string) => {
  if (query.length < 3) return;
  
  try {
    setIsLoading(true);
    const suggestions = await getSuggestions(query);
    setSuggestions(suggestions);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}, 300);
```

## Styling

### Search Input

```css
.search-input {
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}
```

### Loading Bar

```css
.loading-bar {
  height: 2px;
  background-color: #4f46e5;
  transition: width 0.3s ease;
}

.loading-bar.error {
  background-color: #ef4444;
}
```

### Search Results Grid

```css
.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}
```

## Testing

### Unit Tests

```typescript
// SearchInput.test.tsx
describe('SearchInput', () => {
  it('should debounce input changes', () => {
    // Test implementation
  });

  it('should show loading state', () => {
    // Test implementation
  });

  it('should handle errors', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// SearchIntegration.test.tsx
describe('Search Integration', () => {
  it('should fetch and display results', () => {
    // Test implementation
  });

  it('should update results on input change', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Search Not Working**:
   - Check Azure OpenAI configuration
   - Verify API endpoints
   - Ensure proper error handling

2. **Loading State Issues**:
   - Verify state management
   - Check loading bar implementation
   - Ensure proper cleanup

3. **Layout Problems**:
   - Check grid system implementation
   - Verify responsive design
   - Ensure proper card sizing

## Maintenance

### Regular Updates

1. **Dependencies**:
   - Keep all packages up to date
   - Update Azure SDK versions
   - Maintain compatibility

2. **Configuration**:
   - Review and update API settings
   - Optimize debounce timing
   - Adjust suggestion limits

3. **Testing**:
   - Regular test suite updates
   - New feature testing
   - Performance monitoring

## Future Enhancements

1. **AI Improvements**:
   - Enhanced suggestion accuracy
   - Better error handling
   - Advanced filtering options

2. **UI Enhancements**:
   - Improved loading animations
   - Better error messages
   - Enhanced mobile experience

3. **Performance**:
   - Optimized API calls
   - Better caching
   - Improved response times 