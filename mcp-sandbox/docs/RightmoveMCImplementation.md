# Extending Current Openrent MCP Search Implementation to Rightmove

We are extending our AI-powered property search application to include Rightmove as a data source. The following plan outlines how to mirror the OpenRent integration for Rightmove, ensuring seamless data flow and schema consistency.

---

## Project Context

- **Backend:** Express.js with TypeScript
- **Core MCP Servers:**
  - `property-data-mcp.ts` (manages data fetching/scraping)
  - `search-orchestrator-mcp.ts` (orchestrates requests)
- **Key Utility:** QueryParser utility for extracting entities (location, bedrooms, propertyType, priceRange)
- **Data Flow:**
  - `search-orchestrator-mcp` calls `property-data-mcp`
  - If `ENABLE_REAL_SCRAPING` is true, the MCP scrapes the target site, transforms the data, and returns it in the internal schema

---

## Objective

Create a `scrapeRightmove` function within `property-data-mcp.ts` that mirrors the functionality of the existing `scrapeOpenrent` function.

---

## Step-by-Step Implementation Plan

### Step 1: Create the Rightmove Scraper (`rightmove-scraper.ts`)

- ✅ **File:** `src/mcp/scrapers/rightmove-scraper.ts`
- ✅ **Responsibilities:** All direct interaction with the Rightmove website

#### 1. URL Construction Function

- ✅ Accepts a parsed query object (location, minPrice, maxPrice, minBedrooms, maxBedrooms, propertyType, listingType)
- ✅ Builds a valid Rightmove search URL
- ✅ Handles both "for-sale" and "to-rent" listings
- ✅ Maps query parameters to Rightmove's URL structure (e.g., `locationIdentifier`, `minBedrooms`, `maxPrice`, etc.)

#### 2. HTML Scraping and Parsing Logic

- ✅ Use `cheerio` (as with OpenRent) to fetch and parse HTML
- ✅ Identify the main container for property listings
- ✅ For each property card, extract:
  - ✅ Property Title / Address
  - ✅ Price (with unit)
  - ✅ Bedroom Count
  - ✅ Property Type
  - ✅ URL to detailed property page
  - ✅ Main property image URL
  - ✅ Agent's name and logo URL (if available)

#### 3. Pagination Support

- ✅ Implement logic for pagination using Rightmove's `index` query parameter
- ✅ Fetch results from the first 3-4 pages (as with OpenRent)

---

### Step 2: Schema Transformation (`rightmove-transformer.ts`)

- ✅ **File:** `src/mcp/transformers/rightmove-transformer.ts`
- ✅ **Responsibilities:** Convert raw scraped data into the standardized Property schema

#### 1. Define the Transformer Function

- ✅ Accepts an array of raw property objects
- ✅ Maps each field to the internal Property interface
- ✅ Performs data normalization and cleaning:
  - ✅ **Price:** Convert string (e.g., "£1,500 pcm") to number, set `priceUnit`
  - ✅ **Bedrooms:** Convert to number
  - ✅ **Images:** Ensure URLs are absolute, handle missing images
  - ✅ **Source:** Add `source: 'Rightmove'`
  - ✅ **ID:** Generate unique ID (e.g., hash of property URL)

---

### Step 3: Integrate into `property-data-mcp.ts`

- ✅ **Import New Modules:** `scrapeRightmove` and `transformRightmoveData`

#### 1. Create `fetchFromRightmove` Method

- ✅ Private async method: `fetchFromRightmove(query: ParsedQuery)`
- ✅ Calls `scrapeRightmove(query)` to get raw data
- ✅ Passes raw data to `transformRightmoveData()` for schema conversion
- ✅ Wrap in try/catch; on error, log and return `[]`

#### 2. Update Main Search Method

- ✅ In the main public method (e.g., `getEnhancedSearchResults`):
  - ✅ Call `fetchFromRightmove` and `fetchFromOpenrent` using `Promise.allSettled`
  - ✅ Combine results from both sources
  - ✅ Only execute this flow if `enableRealScraping` is true

---

## Reference: OpenRent Implementation

- ✅ Use the OpenRent scraper and transformer as a direct reference for:
  - ✅ Architecture
  - ✅ Data transformation
  - ✅ Integration patterns
- ✅ Ensure the new Rightmove integration matches the robustness and conventions of the OpenRent flow

---

## Summary

By following this plan, Rightmove will be fully integrated as a real-time data source in the MCP, with all data normalized to the internal Property schema and available for AI-powered search and analysis alongside OpenRent results.
