# OpenRent Scraper Integration Guide

## Overview

The OpenRent scraper is a specialized component designed to extract property listings from OpenRent.co.uk, one of the UK's leading property rental platforms. This scraper follows the same architectural patterns as the existing Rightmove and Rentola scrapers, providing consistent API interfaces and robust error handling.

## Features

- **Comprehensive Property Extraction**: Scrapes title, price, location, bedrooms, property type, images, and agent information
- **Smart URL Routing**: Automatically detects OpenRent URLs and routes them to the appropriate scraper
- **Query Parsing**: Converts natural language queries into OpenRent search parameters
- **URL Building**: Programmatically constructs OpenRent search URLs with filters
- **Error Handling**: Robust error handling with graceful fallbacks
- **Image Processing**: Extracts and validates property images
- **Flexible Selectors**: Uses multiple fallback selectors to handle dynamic content

## Architecture

### Core Files

```
backend/src/scrapers/
├── openrent-scraper.ts          # Main OpenRent scraper implementation
└── ...

backend/src/
├── index.ts                     # Updated with OpenRent endpoints and routing
└── scraper.ts                   # Main scraper (unchanged)
```

### Integration Points

1. **URL Routing** (`/scrape` endpoint): Automatically detects `openrent.co.uk` URLs
2. **Direct Search** (`/scrape-openrent` endpoint): Accepts natural language queries
3. **Imports**: Added to main index.ts for API exposure

## API Endpoints

### 1. General Scraping Endpoint

**POST** `/scrape`

Routes OpenRent URLs automatically to the OpenRent scraper.

```json
{
  "url": "https://www.openrent.co.uk/properties-to-rent/liverpool-merseyside?term=Liverpool,%20Merseyside"
}
```

### 2. OpenRent-Specific Endpoint

**POST** `/scrape-openrent`

Accepts natural language queries and builds OpenRent URLs automatically.

```json
{
  "query": "2 bedroom flat in Liverpool under £1000"
}
```

**Response Format** (both endpoints):
```json
[
  {
    "title": "2 Bed Flat, Silkhouse Court, L2",
    "price": "£1,500 per month",
    "location": "Liverpool City Centre",
    "bedrooms": "2 Beds",
    "propertyType": "Flat",
    "imageUrls": [
      "https://staticcdn.openrent.co.uk/images/property1.jpg",
      "https://staticcdn.openrent.co.uk/images/property2.jpg"
    ],
    "agent": {
      "name": "OpenRent",
      "email": "Contact via OpenRent",
      "website": "https://www.openrent.co.uk/property/123456"
    }
  }
]
```

## Functions Reference

### `scrapeOpenRent(url: string, apiKey: string): Promise<Property[]>`

Main scraping function that extracts property listings from OpenRent pages.

**Parameters:**
- `url`: OpenRent search results URL
- `apiKey`: API key for additional services (currently unused but maintained for consistency)

**Returns:** Array of Property objects

**Features:**
- Uses Playwright for dynamic content handling
- Multiple fallback selectors for reliability
- Image extraction and validation
- Robust error handling with partial results

### `buildOpenRentUrl(location: string, filters?: object): string`

Constructs OpenRent search URLs programmatically.

**Parameters:**
- `location`: Location string (e.g., "Liverpool, Merseyside")
- `filters`: Optional filters object
  - `minPrice?: number`: Minimum price filter
  - `maxPrice?: number`: Maximum price filter
  - `bedrooms?: string`: Number of bedrooms ("1", "2", "3", etc.)
  - `propertyType?: string`: Property type filter

**Example:**
```typescript
const url = buildOpenRentUrl("Liverpool, Merseyside", {
  maxPrice: 1500,
  bedrooms: "2",
  propertyType: "flat"
});
// Result: https://www.openrent.co.uk/properties-to-rent/liverpool-merseyside?term=Liverpool,%20Merseyside&maxPrice=1500&bedrooms=2+Bed
```

### `parseOpenRentQuery(query: string): object`

Parses natural language queries into structured search parameters.

**Parameters:**
- `query`: Natural language property search query

**Returns:** Object with parsed parameters:
- `location: string`: Extracted location
- `maxPrice?: number`: Extracted maximum price
- `bedrooms?: string`: Extracted bedroom count
- `propertyType?: string`: Extracted property type

**Example:**
```typescript
const parsed = parseOpenRentQuery("2 bedroom flat in Liverpool under £1000");
// Result: { location: "Liverpool", maxPrice: 1000, bedrooms: "2", propertyType: "flat" }
```

## OpenRent-Specific Implementation Details

### HTML Structure Analysis

OpenRent uses a specific DOM structure for property listings:

- **Property containers**: `a.pli` (property listing items)
- **Titles**: `.banda.pt.listing-title` or `.listing-title`
- **Prices**: `.pim h2` (monthly) or `.piw h2` (weekly)
- **Locations**: `.ltc h2` with distance information
- **Details**: `.lic li` for bedrooms and property features
- **Images**: Multiple `img` elements within property cards

### Scraping Strategy

1. **Multiple Selector Approach**: Uses fallback selectors to handle dynamic content
2. **Price Normalization**: Handles both weekly and monthly price formats
3. **Location Cleaning**: Removes distance markers and map icons
4. **Image Validation**: Filters out placeholder images and icons
5. **Data Validation**: Ensures minimum data quality before including properties

### Error Handling

- **Graceful Degradation**: Returns partial results if some properties fail to scrape
- **Selector Fallbacks**: Tries multiple selectors for each data field
- **Browser Management**: Proper cleanup and retry logic
- **Timeout Handling**: Reasonable timeouts with fallback behavior

## Testing Examples

### Test with Direct URL

```bash
curl -X POST http://localhost:3001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.openrent.co.uk/properties-to-rent/liverpool-merseyside?term=Liverpool,%20Merseyside"}'
```

### Test with Natural Language Query

```bash
curl -X POST http://localhost:3001/scrape-openrent \
  -H "Content-Type: application/json" \
  -d '{"query":"2 bedroom flat in Liverpool under £1200"}'
```

### Test Different Queries

```typescript
// Various query formats that work:
"2 bed flat in Manchester under £800"
"Studio apartment in Birmingham"
"3 bedroom house in Leeds max £1500"
"Property in Liverpool under £1000"
"Flat in London"
```

## Configuration

### Browser Settings

The scraper uses Playwright with optimized settings:

```typescript
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
}
```

### Performance Optimizations

- **Limited Results**: Processes maximum 20 properties for performance
- **Image Limits**: Maximum 5 images per property
- **Timeout Management**: 3-second content loading timeout
- **Efficient Selectors**: Prioritized selector order for speed

## Error Scenarios and Handling

### Common Issues

1. **Page Structure Changes**: Multiple fallback selectors mitigate this
2. **Dynamic Loading**: Playwright handles JavaScript-rendered content
3. **Rate Limiting**: Browser automation with realistic delays
4. **Network Issues**: Retry logic and graceful degradation

### Monitoring

Key logging points:
- URL detection and routing
- Property count found
- Scraping progress and errors
- Browser lifecycle events

## Integration with Existing System

### Consistency with Other Scrapers

The OpenRent scraper follows the same patterns as Rightmove and Rentola scrapers:

- **Same Property interface**: Consistent data structure
- **Same error handling patterns**: Uniform error responses
- **Same API patterns**: Consistent endpoint structure
- **Same logging approach**: Uniform console output

### URL Routing Logic

The main `/scrape` endpoint automatically routes URLs:

```typescript
if (url.includes('openrent.co.uk')) {
  const results = await scrapeOpenRent(url, apiKey);
} else if (url.includes('rightmove.co.uk')) {
  const results = await scrapeRightmove(url, apiKey);
} // ... etc
```

## Maintenance and Updates

### Regular Checks

1. **Selector Validation**: Verify DOM selectors still work
2. **Data Quality**: Monitor extracted data accuracy
3. **Performance**: Check scraping speed and success rates
4. **API Compliance**: Ensure respectful scraping practices

### Future Enhancements

Potential improvements:
- **Enhanced Filtering**: More sophisticated search filters
- **Geo-Location**: Integration with mapping services
- **Price History**: Track price changes over time
- **Agent Contact**: Enhanced agent information extraction

## Troubleshooting

### Common Issues

**No properties found:**
- Check if page structure changed
- Verify selectors are still valid
- Check for rate limiting or blocking

**Incomplete data:**
- Review data validation rules
- Check selector specificity
- Examine page loading timing

**Performance issues:**
- Adjust timeouts and limits
- Review browser settings
- Check for memory leaks

### Debug Mode

Enable detailed logging by setting appropriate log levels in the scraper.

## Best Practices

1. **Respectful Scraping**: Appropriate delays and request limits
2. **Error Recovery**: Always return partial results when possible
3. **Data Validation**: Strict validation before including properties
4. **Resource Management**: Proper browser cleanup and memory management
5. **Monitoring**: Comprehensive logging for troubleshooting

## Dependencies

- **Playwright**: Browser automation
- **TypeScript**: Type safety
- **Express**: API framework
- **Cheerio**: HTML parsing (inherited)

## Version History

- **v1.0.0**: Initial OpenRent scraper implementation
  - Basic property extraction
  - URL building and query parsing
  - Integration with existing system
  - Comprehensive error handling

