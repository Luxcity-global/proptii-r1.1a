# Rightmove Scraper Integration Guide

## Overview

This document provides comprehensive information about the Rightmove scraper integration in the Proptii application. The Rightmove scraper allows users to search for properties directly from the UK's largest property portal, expanding the application's reach beyond the existing OnTheMarket scraper.

## Architecture

### Backend Components

#### 1. Rightmove Scraper (`backend/src/scrapers/rightmove-scraper.ts`)

The main scraper module that handles:
- URL generation from natural language queries
- Property data extraction from Rightmove pages
- Image collection and validation
- Agent information extraction

**Key Functions:**

```typescript
scrapeRightmove(url: string, apiKey: string): Promise<Property[]>
```
- Scrapes property listings from a Rightmove URL
- Returns array of Property objects with standardized structure

```typescript
buildRightmoveUrl(query: string): Promise<string>
```
- Converts natural language queries into properly formatted Rightmove URLs
- Extracts location, price, bedrooms, and rental/sale type from query
- Returns complete Rightmove search URL

#### 2. Backend API Integration (`backend/src/index.ts`)

New endpoint added:
```
POST /scrape-rightmove
```

**Request Body:**
```json
{
  "query": "2 bedroom flats to rent in London under £1250"
}
```

**Response:**
```json
[
  {
    "title": "2 bed flat in Central London",
    "price": "£1,200 pcm",
    "location": "London",
    "bedrooms": "2 bedrooms",
    "propertyType": "Flat",
    "imageUrls": ["https://..."],
    "agent": {
      "name": "Estate Agent Name",
      "email": "",
      "website": undefined
    }
  }
]
```

### Frontend Components

#### 1. Search Interface (`frontend/src/pages/Home.tsx`)

Added Rightmove as a third search option alongside OnTheMarket and Internet Search:

- **OnTheMarket**: Official property portal scraping
- **Rightmove**: UK's largest property portal (NEW)
- **Internet Search**: Broad web search for alternative listings

#### 2. Results Display (`frontend/src/pages/SearchResults.tsx`)

Enhanced to handle Rightmove search type:
- Purple badge for Rightmove listings
- Proper endpoint routing for Rightmove searches
- Consistent property display format

## Data Structure

### Property Interface

```typescript
interface Property {
  title: string;           // Property title/description
  price: string;           // Price (e.g., "£1,200 pcm" or "£400,000")
  location: string;        // Property location/address
  bedrooms: string;        // Number of bedrooms (e.g., "2 bedrooms")
  propertyType: string;    // Type (House, Flat, Apartment, etc.)
  imageUrls: string[];     // Array of property image URLs
  agent: {
    name: string;          // Estate agent/company name
    email: string;         // Agent email (currently empty)
    website?: string;      // Agent website (optional)
  };
}
```

## Rightmove-Specific Implementation Details

### URL Building

The `buildRightmoveUrl` function processes natural language queries:

1. **Search Type Detection**: Identifies rental vs. sale based on keywords
2. **Location Extraction**: Uses regex to find location from "in [location]" pattern
3. **Price Parsing**: Extracts price limits and applies to appropriate field
4. **Bedroom Count**: Parses bedroom requirements from query

### Scraping Strategy

The scraper targets specific Rightmove selectors:

```typescript
// Property cards
const propertyCards = $('.l-searchResult');

// Property details
const title = $el.find('.propertyCard-title').text().trim();
const price = $el.find('.propertyCard-priceValue').text().trim();
const location = $el.find('.propertyCard-address').text().trim();
```

### Image Handling

- Extracts images from multiple potential selectors
- Filters out logos, icons, and non-property images
- Converts relative URLs to absolute URLs
- Validates image URLs before inclusion

## Testing

### Manual Testing

1. Start the backend server: `npm run dev` (from backend directory)
2. Use the test script: `node test-rightmove.js`
3. Or test via frontend at `http://localhost:5173`

### Test Script (`backend/test-rightmove.js`)

```javascript
const axios = require('axios');

async function testRightmoveScraper() {
  const response = await axios.post('http://localhost:3001/scrape-rightmove', {
    query: '2 bedroom flats to rent in London under £1250',
  });
  console.log('Properties found:', response.data.length);
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Navigation Failures**: Retry logic with exponential backoff
2. **Selector Failures**: Multiple fallback selectors for each data type
3. **Image Loading**: Graceful degradation when images fail to load
4. **Browser Crashes**: Proper cleanup and error reporting

## Configuration

### Browser Settings

The scraper uses headless Chrome with optimized settings:
- No sandbox mode for compatibility
- Disabled GPU acceleration
- Custom user agent
- Large viewport (1920x1080)

### Rate Limiting

- Scroll delays to trigger lazy loading
- Respectful request timing
- Browser resource cleanup

## Performance Considerations

1. **Image Loading**: Implements scrolling to trigger lazy-loaded images
2. **Memory Management**: Proper browser closure and resource cleanup
3. **Concurrent Requests**: Single browser instance with proper page management

## Security Considerations

1. **User Agent**: Uses realistic browser user agent
2. **Rate Limiting**: Respects website load times
3. **Error Handling**: Prevents sensitive information leakage

## Future Enhancements

### Planned Improvements

1. **Email Integration**: Implement agent email lookup using existing API functions
2. **Advanced Filtering**: Add property type and amenity filters
3. **Location Intelligence**: Enhance location parsing for better accuracy
4. **Caching**: Implement result caching for frequently searched areas

### Scalability Considerations

1. **Browser Pool**: Consider implementing browser pooling for high traffic
2. **Distributed Scraping**: Scale across multiple servers if needed
3. **Database Integration**: Store and cache results for performance

## API Usage Examples

### Basic Rental Search
```bash
curl -X POST http://localhost:3001/scrape-rightmove \
  -H "Content-Type: application/json" \
  -d '{"query": "1 bedroom flat to rent in Manchester under £800 pcm"}'
```

### Property Purchase Search
```bash
curl -X POST http://localhost:3001/scrape-rightmove \
  -H "Content-Type: application/json" \
  -d '{"query": "3 bedroom house for sale in Birmingham under £300k"}'
```

## Troubleshooting

### Common Issues

1. **Empty Results**: Check if Rightmove URL is correctly formed
2. **Image Loading**: Verify scroll trigger is working properly
3. **Selector Failures**: Rightmove may update their HTML structure

### Debug Steps

1. Enable browser headful mode for visual debugging
2. Log generated URLs to verify correctness
3. Check console output for specific error messages
4. Verify network connectivity and Rightmove accessibility

## Integration Checklist

- [x] Backend scraper implementation
- [x] API endpoint integration
- [x] Frontend search option
- [x] Results display integration
- [x] Error handling
- [x] Documentation
- [x] Test script
- [ ] Email lookup integration (future)
- [ ] Advanced filtering (future)

## Support

For issues or questions regarding the Rightmove integration:

1. Check the console logs for detailed error messages
2. Verify Rightmove website structure hasn't changed
3. Test with the provided test script
4. Review this documentation for implementation details

---

*Last updated: August 2025*