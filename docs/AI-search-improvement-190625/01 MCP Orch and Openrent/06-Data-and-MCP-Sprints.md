# Data & MCP Orchestration Sprints

## Sprint Plan Overview

| Sprint | Focus Area                                    | Key Outcomes                                 | Status      |
| ------ | --------------------------------------------- | -------------------------------------------- | ----------- |
| 1      | Baseline Scraping & MCP Integration           | Static scraping, MCP API, manual config      | ✅ Complete |
| 1.5    | Schema Normalization & MCP Integration        | Real data flow, schema transformation, API   | ✅ Complete |
| 2      | Dynamic Config & Pluggable Scrapers           | Runtime config, modular scrapers, validation | ✅ Complete |
| 2.1    | Schema Normalization & MCP Integration        | Real data flow, schema transformation, API   | ✅ Complete |
| 2.2    | API Enhancement and Frontend Integration      | Enhanced endpoints, real-time scraping API   | ✅ Complete |
| 2.3    | Frontend Integration and Real-time Updates    | Real-time UI, cache management, monitoring   | ✅ Complete |
| 2.4    | Environment Configuration & Real Scraping Fix | Environment variables, real data operational | ✅ Complete |
| 3      | Real-Time Orchestration, Monitoring & Scaling | Live updates, monitoring, scaling, fallback  | 🔄 Planned  |

---

## 🏁 Sprint 1: Baseline Scraping & MCP Integration

### Objectives

- Establish static scraping for a single property data source (website/API)
- Integrate scraper output with MCP Orchestrator and Data Store
- Expose property data via MCP API to frontend
- Manual configuration of source and scraping rules

### Deliverables

- Working scraper for one property source
- MCP Orchestrator able to trigger scraping and ingest data
- Data normalization and storage in unified schema
- API endpoint serving property data to frontend
- Documentation of setup and manual config

### Tasks

1. **Select Initial Data Source**
2. **Develop Static Scraper**
   - Fetch, parse, and normalize property data
   - Handle basic errors and logging
3. **Integrate with MCP Orchestrator**
   - Trigger scraping on demand or interval
   - Store results in Data Store
4. **Expose API Endpoint**
   - Serve normalized data to frontend
5. **Manual Config & Documentation**
   - Document config, runbook, and known issues

### Openrent Scraping Process Documentation

#### 1. Analyze Openrent Listings Page Structure

- Visit https://www.openrent.co.uk/ and inspect the listings page.
- Identify key data fields: title, address, price, bedrooms, bathrooms, property type, description, images, listing URL, agent/landlord info, availability date.
- Note the HTML structure for each property card/listing.
- Check for pagination and how next pages are loaded (URL pattern, query params).
- Assess if listings are present in the initial HTML or loaded dynamically (if so, note the JS triggers or API calls).

#### 2. Select Scraping Tool

- Start with **Axios** (for HTTP requests) and **Cheerio** (for HTML parsing) for static content.
- If listings are not present in the HTML or anti-bot measures are detected, escalate to **Puppeteer** or **Playwright** for headless browser automation.
- Log HTTP status codes and page content for debugging.

#### 3. Define Unified Property Schema

- Draft a schema to normalize all extracted data:
  - id, title, address, price, priceUnit, bedrooms, bathrooms, propertyType, description, images, listingUrl, agent (name/contact), availableFrom
- Map each field to its corresponding selector or extraction logic from the Openrent page.

#### 4. Build Initial Scraper

- Use Axios to fetch the first page of Openrent listings.
- Use Cheerio to parse the HTML and extract the required fields for each property.
- Log the extracted data for review.
- If data is missing or incomplete, inspect for dynamic loading and switch to Puppeteer if needed.
- Handle pagination by detecting and following 'next page' links.
- Normalize all data to the unified schema.

#### 5. Anti-Bot & Access Considerations

- Respect robots.txt and Openrent's terms of service.
- Add delays between requests to avoid rate limiting.
- Log and handle HTTP errors, CAPTCHAs, or unexpected redirects.
- If blocked, consider rotating user agents or using proxies (with caution and compliance).

#### 6. Expected Outputs

- JSON array of property objects matching the unified schema.
- Log file with scraping results, errors, and summary statistics (number of listings, pages scraped, errors encountered).
- Documentation of any issues or required manual steps.

### Dependencies

- Access to target property data source
- Initial MCP Orchestrator and Data Store setup

### Success Criteria

- End-to-end data flow: scrape → MCP → API → frontend
- Data visible in frontend within X minutes of scrape
- Manual config and runbook available

### 📌 Progress Update (July 2025): Openrent Scraper - COMPLETED

- ✅ **Real Scraping Operational**: Live Openrent data extraction working with accurate search results
- ✅ **Environment Configuration Fixed**: ENABLE_REAL_SCRAPING=true properly loaded and functional
- ✅ **Enhanced Query Parsing**: Natural language processing extracts location, bedrooms, property type, and price range
- ✅ **Geographic Accuracy**: Search results now return properties from correct locations (e.g., "2 bedroom flat in dartford" returns Dartford properties)
- ✅ **Real Images**: Property cards display actual listing images instead of placeholders
- ✅ **Bedroom Accuracy**: Exact bedroom count matching and filtering implemented
- ✅ **Schema Transformation**: Enhanced data quality with validation and error handling
- ✅ **API Integration**: Enhanced search endpoint with real data support and monitoring endpoints
- ✅ **Error Handling**: Graceful fallbacks to mock data when scraping fails

**Technical Achievements:**

- Fixed environment variable loading issue by adding `dotenv.config()` to PropertyDataMCP constructor
- Implemented query parser utility for natural language processing
- Enhanced Openrent scraper with targeted URL building and improved selectors
- Added comprehensive debug logging for environment variable tracking
- Real-time scraping with pagination support (up to 4 pages)
- Enhanced schema transformation with better data quality and validation

---

## 🏁 Sprint 1.5: Schema Normalization & MCP Integration

### Objectives

- Transform working Openrent scraper output to comprehensive MCP property schema
- Integrate real scraping capabilities into existing MCP orchestration system
- Enable seamless data flow from scraper to frontend via MCP
- Maintain robust fallback to mock data when scraping fails

### Deliverables

- Schema transformation utilities for Openrent data
- Enhanced PropertyDataMCP with real scraping methods
- Updated MCP Orchestrator with source selection logic
- New API endpoints for real-time scraping and data refresh
- Configuration management for scraping vs. mock data
- Comprehensive testing and validation

### Detailed Tasks

#### Phase 1: Schema Normalization (1-2 days)

**1.1 Create Schema Transformer**

- **File:** `src/utils/schemaTransformer.ts`
- **Purpose:** Transform scraper data to MCP schema
- **Functions:**
  - `transformOpenrentToMCP(openrentProperty: OpenrentProperty): MCPProperty`
  - `normalizePrice(price: number, unit: string): MCPPrice`
  - `extractLocation(address: string): MCPLocation`
  - `enhanceImages(images: string[]): MCPImage[]`
  - `generateMetadata(source: string): MCPMetadata`

**1.2 Data Enhancement Functions**

- **Postcode Extraction:** Parse UK postcodes from addresses using regex patterns
- **Property Type Normalization:** Map scraper types to standardized MCP types
- **Price Standardization:** Convert weekly/monthly to standard format with currency
- **Image Enhancement:** Add alt text, primary image detection, and URL normalization
- **Agent Data Enrichment:** Add company info, contact details, and performance metrics

**1.3 Schema Validation**

- **Data Quality Checks:** Validate required fields, data types, and ranges
- **Edge Case Handling:** Handle missing data, malformed addresses, invalid prices
- **Error Reporting:** Detailed logging of transformation issues and data quality metrics

#### Phase 2: MCP Integration (2-3 days)

**2.1 Extend PropertyDataMCP**

- **Add Real Scraping Methods:**
  - `async scrapeOpenrent(query: string, filters?: any): Promise<Property[]>`
  - `async scrapeWithPagination(source: string, query: string, pages: number): Promise<Property[]>`
  - `async updatePropertyCache(source: string, properties: Property[]): Promise<void>`
  - `async getRealPropertyData(query: string, useRealData: boolean): Promise<Property[]>`

**2.2 Update Orchestrator**

- **Modify `handlePropertySearch()`** to use real scraping when enabled
- **Add Source Selection Logic:** Choose between mock data and real scraping based on config
- **Implement Fallback Strategy:** Automatic fallback to mock data when scraping fails
- **Add Rate Limiting:** Respect scraping limits and implement delays

**2.3 Cache Integration**

- **Redis Caching:** Cache normalized properties with configurable expiry
- **Cache Keys:** `property:openrent:london:page1`, `property:openrent:london:aggregated`
- **Cache Expiry:** 1 hour for search results, 24 hours for individual properties
- **Cache Invalidation:** Automatic refresh and manual invalidation capabilities

#### Phase 3: API Integration (1 day)

**3.1 New API Endpoints**

- **`POST /api/properties/scrape`** - Trigger real-time scraping with parameters
- **`GET /api/properties/sources`** - List available data sources and their status
- **`POST /api/properties/refresh`** - Refresh cached data for specific sources
- **`GET /api/properties/status`** - Get scraping status and health metrics

**3.2 Enhanced Search Endpoint**

- **Add `useRealData` parameter** to existing search endpoint
- **Source selection:** `sources: ['openrent', 'rightmove', 'zoopla']`
- **Pagination support:** `page: number, limit: number`
- **Filtering options:** Price range, bedrooms, property type, location

#### Phase 4: Configuration & Monitoring (1 day)

**4.1 Environment Configuration**

- **Scraping Settings:** `ENABLE_REAL_SCRAPING=true`, `SCRAPING_RATE_LIMIT=2000`
- **Source Configuration:** `ENABLED_SOURCES=openrent,rightmove,zoopla`
- **Cache Settings:** `CACHE_EXPIRY=3600`, `REDIS_ENABLED=true`
- **Fallback Settings:** `FALLBACK_TO_MOCK=true`, `MOCK_DATA_PRIORITY=1`

**4.2 Monitoring & Logging**

- **Scraping Metrics:** Success rate, response times, error rates, data quality scores
- **Data Quality Metrics:** Completeness, accuracy, freshness, transformation success rate
- **Performance Monitoring:** Cache hit rates, API response times, memory usage
- **Error Tracking:** Detailed error logs with context and recovery suggestions

### Technical Implementation Details

#### Schema Transformation Strategy

```typescript
// Example transformation function
const transformOpenrentToMCP = (openrent: OpenrentProperty): MCPProperty => ({
  id: openrent.id,
  title: openrent.title,
  price: {
    amount: openrent.price,
    currency: "GBP",
    type: "rent", // Openrent is rental-focused
    period: openrent.priceUnit === "pw" ? "weekly" : "monthly",
    display: `£${openrent.price} ${openrent.priceUnit}`,
  },
  location: {
    address: openrent.address,
    city: extractCity(openrent.address),
    postcode: extractPostcode(openrent.address),
    coordinates: null, // Would need geocoding service
    area: extractArea(openrent.address),
  },
  specifications: {
    bedrooms: openrent.bedrooms,
    bathrooms: openrent.bathrooms,
    propertyType: normalizePropertyType(openrent.propertyType),
    totalArea: null, // Not available in search results
    parkingSpaces: null,
    yearBuilt: null,
  },
  features: extractFeatures(openrent.description),
  description: openrent.description,
  images: enhanceImages(openrent.images),
  agent: {
    name: openrent.agent.name,
    company: "OpenRent",
    phone: openrent.agent.contact,
    email: null,
    photo: null,
  },
  amenities: {
    nearby: [],
    onsite: [],
  },
  status: "available",
  metadata: generateMetadata("openrent"),
  contactUrl: openrent.listingUrl,
  propertyUrl: openrent.listingUrl,
});
```

#### Integration Points

1. **PropertyDataMCP.ts** - Add real scraping methods with fallback logic
2. **ProptiiMCPOrchestrator.ts** - Update search handling and source selection
3. **mcpRoutes.ts** - Add new endpoints for scraping and data management
4. **openrentScraper.ts** - Export normalized data functions and pagination support

#### Data Flow Architecture

```
User Search Request → Orchestrator → PropertyDataMCP →
Openrent Scraper → Schema Transformer → MCP Schema →
Cache Storage → Response to Frontend
```

### Dependencies

- Working Openrent scraper from Sprint 1
- Existing MCP Orchestrator and PropertyDataMCP infrastructure
- Redis cache setup (optional, with in-memory fallback)
- Environment configuration system

### Success Criteria

#### Phase 1 Success:

- ✅ Schema transformation functions working with 100% data coverage
- ✅ Data quality validation passing for all required fields
- ✅ Edge cases handled properly (missing data, malformed addresses)
- ✅ Performance metrics within acceptable ranges (<100ms per transformation)

#### Phase 2 Success:

- ✅ Real scraping integrated into MCP with configurable enable/disable
- ✅ Fallback to mock data working seamlessly when scraping fails
- ✅ Cache integration functional with proper expiry and invalidation
- ✅ Rate limiting and error handling robust

#### Phase 3 Success:

- ✅ New API endpoints responding correctly with proper error handling
- ✅ Frontend receiving real data through existing search interface
- ✅ Performance metrics acceptable (<2s response time for search)
- ✅ Pagination and filtering working with real data

#### Phase 4 Success:

- ✅ Configuration management working across all environments
- ✅ Monitoring and logging operational with actionable insights
- ✅ Error handling robust with automatic recovery mechanisms
- ✅ Documentation complete and up-to-date

### Risk Mitigation

- **Scraping Failures:** Implement multiple fallback layers (cache → mock data)
- **Performance Issues:** Add caching, rate limiting, and performance monitoring
- **Data Quality:** Implement validation and quality scoring with alerts
- **Schema Changes:** Use versioned schemas and backward compatibility

### Next Steps After Sprint 1.5

1. **Test and Validate** - Thorough testing of real data flow and fallback mechanisms
2. **Performance Optimization** - Tune caching, scraping efficiency, and response times
3. **Expand Sources** - Add Rightmove and Zoopla scrapers using the same pattern
4. **Advanced Features** - Implement real-time updates and advanced filtering

---

## 🏁 Sprint 2: Dynamic Config & Pluggable Scrapers

### Objectives

- Enable dynamic (runtime) configuration of data sources and scraping rules
- Support multiple property sources with pluggable scraper modules
- Add data validation, normalization, and error handling
- Begin basic monitoring and logging

### Deliverables

- Config system for adding/removing/updating sources at runtime
- Modular scraper architecture (plug-and-play for new sources)
- Data validation and normalization pipeline
- Enhanced error handling and logging
- Documentation for dynamic config and scraper integration

### Tasks

1. **Design Dynamic Config System**
   - Schema for source/rule config
   - Admin interface or config file reload
2. **Refactor Scraper Modules**
   - Pluggable interface for new sources
   - Example: add a second property source
3. **Implement Validation & Normalization**
   - Ensure data consistency across sources
   - Handle missing/invalid data
4. **Improve Error Handling & Logging**
   - Log failures, retries, and anomalies
   - Alert on critical errors
5. **Update Documentation**
   - Guide for adding new sources and rules

### Dependencies

- Baseline system from Sprint 1
- Agreement on config schema and validation rules

### Success Criteria

- Add/remove sources without code changes
- Multiple sources live in system
- Consistent, validated data in frontend
- Robust error logging and documentation

---

## 🏁 Sprint 3: Real-Time Orchestration, Monitoring & Scaling

### Objectives

- Enable real-time data flow and live updates to frontend
- Add scheduling, triggers, and event-driven scraping
- Implement monitoring, alerting, and fallback to cached/mock data
- Optimize for performance and scalability

### Deliverables

- Real-time data push (WebSockets/SSE/polling) to frontend
- Scheduling and event-driven triggers for scraping
- Monitoring dashboard and alerting system
- Fallback logic for source failures (cache/mock)
- Performance and scaling improvements
- Final documentation and handover

### Tasks

1. **Implement Real-Time Data Push**
   - WebSockets, SSE, or polling for live updates
2. **Add Scheduling & Triggers**
   - Interval, on-demand, and event-driven scraping
3. **Build Monitoring & Alerting**
   - Dashboard for system health
   - Alerts for failures, slowdowns, or data issues
4. **Fallback & Resilience Logic**
   - Serve cached or mock data on error
   - Automated recovery/retry
5. **Optimize & Scale**
   - Performance tuning, horizontal scaling
   - Stress testing and load validation
6. **Finalize Documentation & Handover**
   - Runbooks, diagrams, and team training

### Dependencies

- Dynamic config and modular scrapers from Sprint 2
- Frontend support for real-time updates

### Success Criteria

- Data visible in frontend within X seconds of source update
- High reliability and graceful fallback
- Monitoring and alerting in place
- System ready for production scaling

---

## 📅 Team Assignments & Timeline

_[Insert team roles, assignments, and detailed timeline here]_

---

_Last updated: July 2025_
