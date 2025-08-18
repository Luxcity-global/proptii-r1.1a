# On the Market Scraper Implementation - Step 1

## Overview
This document outlines the implementation of the On the Market scraper following the same architectural patterns as the existing OpenRent implementation.

## Architecture Pattern
Following the successful OpenRent implementation, the On the Market integration consists of:

### 1. Core Scraper File
- **File**: `mcp-sandbox/src/scrapers/onthemarketScraper.ts`
- **Purpose**: Direct interaction with On the Market website
- **Follows**: Same patterns as `openrentScraper.ts`

### 2. URL Construction
- **File**: `mcp-sandbox/src/utils/queryParser.ts`
- **Function**: `buildOnTheMarketUrl(parsedQuery: ParsedQuery)`
- **Mirrors**: `buildOpenrentUrl` function

### 3. Integration Point
- **File**: `mcp-sandbox/src/mcp/property-data/PropertyDataMCP.ts`
- **Method**: `scrapeOnTheMarket()` (to be implemented in Step 2)
- **Pattern**: Same as `scrapeOpenRent()` method

## Step 1 Implementation Details

### URL Construction Function
The `buildOnTheMarketUrl` function constructs valid On the Market search URLs:

**Base URL Pattern:**
```
https://www.onthemarket.com/to-rent/property/{location}/?{parameters}
```

**Supported Parameters:**
- `min-bedrooms`: Minimum bedroom count
- `max-bedrooms`: Maximum bedroom count  
- `property-type`: Property type (flat, house, etc.)
- `min-price`: Minimum price
- `max-price`: Maximum price
- `view`: Display mode (defaults to 'map-list')

**Example URLs Generated:**
- `2 bedroom flat in London` →
  `https://www.onthemarket.com/to-rent/property/london/?min-bedrooms=2&max-bedrooms=2&property-type=flat&view=map-list`

### HTML Scraping Logic
The `parseOnTheMarketListings` function handles:

#### 1. Container Selection
Multiple selector patterns for flexibility:
```css
.property-result, .property-card, .property-listing
```

#### 2. Data Extraction
For each property card:
- **Title**: `.property-title, .property-heading, h3 a, h2 a`
- **Address**: `.property-address, .address, .location` or extracted from title
- **Price**: `.property-price, .price, .price-display`
- **Features**: `.property-details li, .property-features li, .features li`
- **Images**: `img` tags with `src`, `data-src`, or `data-lazy-src`
- **URL**: Links containing `/details/` or `/property/`

#### 3. Price Unit Detection
Automatically detects:
- `pcm` - Per calendar month
- `pw` - Per week
- `pppw` - Per person per week
- `total` - For sale properties

#### 4. Property Type Extraction
Uses regex patterns to identify:
- Flat, House, Apartment, Studio
- Maisonette, Bungalow, Penthouse
- Terraced, Detached, Semi-detached

### Pagination Support
- **Pages**: Scrapes up to 4 pages (matching OpenRent)
- **URL Pattern**: Adds `page=2`, `page=3`, etc.
- **Rate Limiting**: 2-second delay between pages
- **Termination**: Stops if no properties found on a page

### Quality Assurance Features
- **Deduplication**: Tracks seen URLs to prevent duplicates
- **Validation**: Checks for missing key fields
- **Logging**: Detailed QA metrics (skipped, partial, duplicates)
- **Sampling**: Logs partial/edge cases for debugging

## Testing
The scraper includes test functions:
- `testOnTheMarketScraping()`: Quick test with standard query
- `main()`: Standalone testing with sample output

## Next Steps
- **Step 2**: Integration with PropertyDataMCP.ts
- **Step 3**: Schema transformation and data normalization
- **Step 4**: Error handling and monitoring

## Code Quality
- **Type Safety**: Full TypeScript with Property interface
- **Error Handling**: Try-catch blocks with detailed logging
- **Rate Limiting**: Respectful scraping with delays
- **Modularity**: Reusable functions for testing and integration

## Comparison with OpenRent
| Feature | OpenRent | On the Market |
|---------|----------|---------------|
| Base URL | openrent.co.uk | onthemarket.com |
| Price Units | pcm, pw | pcm, pw, pppw, total |
| Pagination | ✅ 4 pages | ✅ 4 pages |
| Rate Limiting | ✅ 2s delay | ✅ 2s delay |
| QA Logging | ✅ Detailed | ✅ Detailed |
| Schema | Property interface | Same Property interface |

## Implementation Status
- ✅ **Step 1**: Core scraper created
- ⏳ **Step 2**: PropertyDataMCP integration (next)
- ⏳ **Step 3**: Schema transformation (next)
- ⏳ **Step 4**: Testing and validation (next)

The On the Market scraper is now ready for integration into the PropertyDataMCP system, following the exact same patterns proven successful with OpenRent. 