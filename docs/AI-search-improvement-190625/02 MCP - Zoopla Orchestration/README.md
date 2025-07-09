# Zoopla Integration for MCP Sandbox

## Overview

This document describes the implementation of Zoopla property data integration into the existing MCP sandbox architecture. The integration follows the proven Openrent pattern while adapting to Zoopla's more complex structure and anti-bot measures.

## Architecture

### Components

1. **Zoopla Query Parser** (`zooplaQueryParser.ts`)

   - Builds Zoopla-specific URLs for property searches
   - Handles location normalization, filters, and pagination
   - Supports both rental and sale searches

2. **Zoopla Schema Transformer** (`zooplaSchemaTransformer.ts`)

   - Converts Zoopla-specific property data to unified MCP format
   - Handles data validation and normalization
   - Provides transformation statistics

3. **Zoopla Scraper** (`zooplaScraper.ts`)

   - Implements Cheerio + Puppeteer hybrid strategy
   - Handles rate limiting and anti-bot measures
   - Supports pagination and error recovery

4. **PropertyDataMCP Integration**
   - Enhanced orchestrator with Zoopla support
   - Cache integration with Redis
   - Multi-source search coordination

## Implementation Status

### ✅ Phase 1: Basic Search Extraction (COMPLETED)

- [x] Core infrastructure setup
- [x] URL building with filters
- [x] Basic search results parsing
- [x] Schema transformation
- [x] PropertyDataMCP integration
- [x] Cache integration
- [x] Error handling

### 🔄 Phase 2: Enhanced Data Extraction (IN PROGRESS)

- [x] Puppeteer integration for dynamic content
- [x] Individual listing page scraping
- [x] Enhanced schema transformation
- [x] Pagination support
- [ ] Advanced anti-bot measures
- [ ] Image extraction optimization

### 📋 Phase 3: Integration & Optimization (PLANNED)

- [ ] Performance optimization
- [ ] Advanced monitoring
- [ ] Rate limiting improvements
- [ ] Comprehensive testing

## Usage

### Basic Zoopla Scraping

```typescript
import { PropertyDataMCP } from "./src/mcp/property-data/PropertyDataMCP";

const propertyMCP = new PropertyDataMCP();

// Basic scraping
const properties = await propertyMCP.scrapeZoopla("London");

// With filters
const filteredProperties = await propertyMCP.scrapeZoopla("London", {
  bedrooms: 2,
  maxPrice: 2000,
  propertyType: "flat",
});
```

### Multi-Source Search

```typescript
// Search across all sources including Zoopla
const allProperties = await propertyMCP.searchProperties(
  "London",
  {
    bedrooms: 2,
    maxPrice: 2000,
  },
  true
); // Enable real scraping

// Properties will include Zoopla, Openrent, and Rightmove results
```

### Pagination Support

```typescript
// Scrape multiple pages
const paginatedProperties = await propertyMCP.scrapeWithPagination(
  "zoopla",
  "London",
  4
);
```

## Configuration

### Environment Variables

```bash
# Enable real scraping (including Zoopla)
ENABLE_REAL_SCRAPING=true

# Redis configuration (optional)
REDIS_URL=redis://localhost:6379
```

### Rate Limiting

The Zoopla scraper includes built-in rate limiting:

- Maximum 30 requests per minute
- Minimum 2 seconds between requests
- Automatic delay on rate limit detection

## Testing

### Run Integration Tests

```bash
# Test Zoopla integration
node scripts/test-zoopla-integration.js

# Test specific components
npm test -- --grep "Zoopla"
```

### Test Coverage

The test suite covers:

- Basic scraping functionality
- Multi-source search integration
- Pagination support
- Cache functionality
- Error handling
- Schema validation
- Performance metrics

## Data Schema

### Zoopla Property Format

```typescript
interface ZooplaProperty {
  id: string;
  title: string;
  price: {
    amount: number;
    frequency: "per_month" | "per_week" | "total";
    display: string;
    originalPrice?: number;
  };
  location: {
    address: string;
    area: string;
    postcode: string;
    coordinates?: [number, number];
  };
  details: {
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    floorArea?: number;
    floorAreaUnit?: string;
  };
  images: {
    src: string;
    alt: string;
    isPrimary: boolean;
  }[];
  agent: {
    name: string;
    company: string;
    phone?: string;
    email?: string;
    photo?: string;
  };
  features: string[];
  description: string;
  availableFrom?: string;
  listingUrl: string;
  metadata: {
    lastUpdated: string;
    source: "zoopla";
    searchScore?: number;
  };
}
```

### MCP Property Format

The Zoopla properties are transformed to the unified MCP format:

```typescript
interface Property {
  id: string; // Prefixed with 'zoopla-'
  title: string;
  price: {
    amount: number;
    currency: string;
    type: "rent" | "sale";
    period?: "monthly" | "yearly";
    display: string;
  };
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates?: [number, number];
    area?: string;
  };
  specifications: {
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    totalArea?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
  };
  features: string[];
  description: string;
  images: {
    src: string;
    alt: string;
    isPrimary: boolean;
  }[];
  agent: {
    name: string;
    company: string;
    phone?: string;
    email?: string;
    photo?: string;
  };
  amenities: {
    nearby: string[];
    onsite: string[];
  };
  status: "available" | "under-offer" | "sold" | "rented" | "inactive";
  metadata: {
    createdAt: string;
    lastUpdated: string;
    searchScore: number;
    viewCount: number;
    source: string; // 'zoopla'
  };
  contactUrl?: string;
  propertyUrl?: string;
}
```

## URL Patterns

### Search URLs

```
Base: https://www.zoopla.co.uk/to-rent/{location}
With filters: https://www.zoopla.co.uk/to-rent/london?beds_min=2&price_max=2000&property_type=flat&results_sort=newest_listings
With pagination: https://www.zoopla.co.uk/to-rent/london?pn=2&results_sort=newest_listings
```

### Listing URLs

```
Format: https://www.zoopla.co.uk/to-rent/details/{id}/
Example: https://www.zoopla.co.uk/to-rent/details/12345678/
```

## Anti-Bot Measures

### Implemented Measures

1. **Rate Limiting**

   - Maximum 30 requests per minute
   - Minimum 2 seconds between requests
   - Automatic delay on rate limit detection

2. **User Agent Rotation**

   - Realistic browser user agents
   - Consistent across requests

3. **Request Headers**

   - Proper Accept headers
   - Cache control headers
   - Language headers

4. **Puppeteer Stealth**
   - WebDriver property removal
   - Plugin and language spoofing
   - Browser fingerprinting evasion

### Future Enhancements

- [ ] Proxy rotation
- [ ] Cookie management
- [ ] Session persistence
- [ ] CAPTCHA handling
- [ ] IP rotation

## Error Handling

### Error Types

1. **Network Errors**

   - Timeout handling
   - Connection failures
   - Rate limit responses

2. **Parsing Errors**

   - HTML structure changes
   - Missing data fields
   - Invalid data formats

3. **Anti-Bot Detection**
   - Blocked requests
   - CAPTCHA challenges
   - IP restrictions

### Recovery Strategies

1. **Fallback Methods**

   - Puppeteer → Cheerio fallback
   - Multiple selector strategies
   - Alternative URL patterns

2. **Retry Logic**

   - Exponential backoff
   - Maximum retry attempts
   - Error categorization

3. **Graceful Degradation**
   - Partial data extraction
   - Mock data fallback
   - Error reporting

## Performance

### Metrics

- **Response Time**: 2-5 seconds per page
- **Properties per Second**: 2-5 properties
- **Cache Hit Rate**: 80%+ for repeated queries
- **Success Rate**: 90%+ for valid queries

### Optimization

1. **Caching**

   - Redis integration
   - In-memory fallback
   - Cache expiration management

2. **Concurrent Processing**

   - Multi-source parallel scraping
   - Async/await optimization
   - Resource pooling

3. **Resource Management**
   - Browser instance reuse
   - Memory leak prevention
   - Connection pooling

## Monitoring

### Metrics Collection

```typescript
interface ZooplaScrapingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  propertiesExtracted: number;
  errors: {
    type: string;
    count: number;
    lastOccurrence: string;
  }[];
}
```

### Health Checks

- Regular scraping success rate monitoring
- Response time tracking
- Error pattern analysis
- Cache performance metrics

## Troubleshooting

### Common Issues

1. **No Properties Found**

   - Check URL structure
   - Verify selectors
   - Test with different locations

2. **Rate Limiting**

   - Increase delays between requests
   - Reduce concurrent requests
   - Check rate limit headers

3. **Parsing Errors**

   - Update selectors
   - Check HTML structure
   - Validate data format

4. **Performance Issues**
   - Enable caching
   - Reduce page count
   - Optimize selectors

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG = zoopla - scraper;

// Or enable in code
console.log("Debug mode enabled");
```

## Legal Considerations

### Terms of Service

- Review Zoopla's Terms of Service
- Respect rate limits and usage guidelines
- Implement proper attribution
- Monitor for policy changes

### Data Usage

- Ensure compliance with data protection laws
- Implement proper data retention policies
- Respect user privacy
- Monitor data usage patterns

## Future Enhancements

### Planned Features

1. **Advanced Filtering**

   - More property types
   - Advanced price ranges
   - Location-based filtering

2. **Enhanced Data Extraction**

   - Floor plans
   - Virtual tours
   - School information
   - Transport links

3. **Real-time Updates**

   - WebSocket integration
   - Change detection
   - Notification system

4. **Analytics Dashboard**
   - Scraping metrics
   - Performance monitoring
   - Error tracking
   - Usage analytics

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run tests: `npm test`
5. Start development server: `npm run dev`

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document all public APIs
- Follow existing patterns

### Testing Guidelines

- Unit tests for all functions
- Integration tests for workflows
- Performance tests for critical paths
- Error handling tests
- Schema validation tests

## Support

### Documentation

- [Implementation Plan](./Zoopla-Integration-Implementation-Plan.md)
- [API Documentation](../api-interfaces/ApiInterfaces.ts)
- [Testing Guide](./testing-guide.md)

### Issues

- Report bugs via GitHub issues
- Include error logs and reproduction steps
- Provide environment details
- Tag with appropriate labels

### Questions

- Check existing documentation
- Search GitHub issues
- Create new issue for questions
- Tag with 'question' label
