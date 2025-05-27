# AI Search Input Documentation

## Overview

The AI Search Input is a sophisticated search component that leverages Azure OpenAI to provide intelligent property search capabilities. It includes features like real-time suggestions, offline support, and mobile optimization.

## API Endpoints

### Search Properties

```typescript
POST /api/search
Content-Type: application/json

{
  "query": string,
  "filters": {
    "propertyType": string[],
    "priceRange": { min: number, max: number },
    "bedrooms": number,
    "location": string
  }
}
```

Response:

```typescript
{
  "results": Property[],
  "total": number,
  "suggestions": string[]
}
```

### Get Suggestions

```typescript
GET /api/suggestions?query=string
```

Response:

```typescript
{
  "suggestions": string[]
}
```

## Usage Examples

### Basic Implementation

```typescript
import { SearchInput } from "@/components/SearchInput";

function PropertySearch() {
  const handleSearch = async (query: string) => {
    // Handle search results
  };

  return (
    <SearchInput onSearch={handleSearch} placeholder="Search properties..." />
  );
}
```

### With Custom Styling

```typescript
<SearchInput
  onSearch={handleSearch}
  placeholder="Search properties..."
  className="custom-search-input"
  inputClassName="custom-input"
  buttonClassName="custom-button"
/>
```

### With Error Handling

```typescript
<SearchInput
  onSearch={handleSearch}
  onError={(error) => {
    console.error("Search failed:", error);
    // Show error notification
  }}
  errorMessage="Failed to perform search. Please try again."
/>
```

## Error Handling

### Common Error Scenarios

1. **Network Errors**

   - Handled automatically with retry logic
   - Shows offline indicator
   - Falls back to cached results

2. **API Errors**

   - Rate limiting (429)
   - Authentication failures (401)
   - Invalid requests (400)
   - Server errors (500)

3. **Input Validation**
   - Empty queries
   - Invalid characters
   - Maximum length exceeded

### Error Recovery

```typescript
// Example of error recovery implementation
const handleSearch = async (query: string) => {
  try {
    const results = await searchService.searchProperties(query);
    setSearchResults(results);
  } catch (error) {
    if (error.status === 429) {
      // Handle rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return handleSearch(query);
    }
    // Handle other errors
    setError(error.message);
  }
};
```

## Setup Instructions

### 1. Installation

```bash
npm install @azure/openai
```

### 2. Environment Configuration

```env
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

### 3. Service Configuration

```typescript
import { SearchService } from "@/services/search.service";

const searchService = new SearchService({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});
```

## Offline Mode Behavior

### Features

- Automatic detection of offline status
- Local storage caching of recent searches
- Fallback suggestions when offline
- Seamless transition between online/offline states

### Implementation

```typescript
// Example of offline mode detection
useEffect(() => {
  const handleOnline = () => setIsOffline(false);
  const handleOffline = () => setIsOffline(true);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

### Caching Strategy

- Recent searches cached for 24 hours
- Suggestions cached for 1 hour
- Automatic cache cleanup for expired items
- Maximum cache size of 100 items

## Performance Considerations

### Optimization Techniques

1. Debounced search input (300ms)
2. Cached results and suggestions
3. Lazy loading of results
4. Mobile-specific optimizations

### Best Practices

1. Keep search queries concise
2. Use appropriate filters
3. Implement proper error boundaries
4. Monitor API usage and rate limits

## Testing

### Unit Tests

```typescript
// Example test for search functionality
describe("SearchInput", () => {
  it("should handle search submission", async () => {
    const onSearch = jest.fn();
    render(<SearchInput onSearch={onSearch} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "test query" },
    });

    fireEvent.click(screen.getByRole("button"));

    expect(onSearch).toHaveBeenCalledWith("test query");
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe("Search Integration", () => {
  it("should fetch and display results", async () => {
    const { getByRole, findByText } = render(<PropertySearch />);

    fireEvent.change(getByRole("searchbox"), {
      target: { value: "2 bedroom flat" },
    });

    fireEvent.click(getByRole("button"));

    const result = await findByText("2 Bedroom Flat");
    expect(result).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **Search not working**

   - Check API credentials
   - Verify network connection
   - Check browser console for errors

2. **Slow performance**

   - Clear browser cache
   - Check network latency
   - Verify API response times

3. **Offline mode issues**
   - Clear local storage
   - Check browser storage permissions
   - Verify cache implementation

### Support

For additional support:

1. Check the error logs
2. Review the API documentation
3. Contact the development team
