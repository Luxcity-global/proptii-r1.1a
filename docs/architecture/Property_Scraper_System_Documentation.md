# Property Scraper System Documentation

## Overview

The Property Scraper is a comprehensive web scraping system designed to extract property rental listings from various UK property websites. It's built with TypeScript and uses Puppeteer for web automation, providing both fast and detailed property search capabilities.

## System Architecture

### Core Components

1. **Main Scraper Engine** (`scraper.ts`)
2. **Backend API Server** (`index.ts`) 
3. **Frontend Interface** (`SearchResults.tsx`)
4. **Browser Pool Management**
5. **Caching System**
6. **Email Discovery Engine**

## How It Works

### 1. Search Flow Overview

```
User Query → Frontend → Backend API → Scraper Engine → Property Results
```

### 2. Search Types

The system supports three main search approaches:

#### A. **API-Based Search** (Default)
- **Endpoint**: `/scrape-api`
- **Purpose**: Returns mock/sample properties quickly for demo purposes
- **Speed**: Instant response
- **Use Case**: Testing, demos, or when real scraping isn't needed

#### B. **OnTheMarket Direct Scraping** 
- **Endpoint**: `/scrape`
- **Purpose**: Scrapes actual property listings from OnTheMarket.com
- **Speed**: 15-30 seconds
- **Use Case**: Primary property search from OnTheMarket URLs

#### C. **Internet-Wide Search**
- **Endpoint**: `/scrape-internet-fast`
- **Purpose**: Searches across multiple property websites using Brave Search API
- **Speed**: 8-15 seconds
- **Use Case**: Broader property search beyond single websites

### 3. Detailed Process Breakdown

#### OnTheMarket Scraping Process

1. **URL Validation & Cleanup**
   - Cleans and validates incoming OnTheMarket URLs
   - Handles URL variations and formatting issues

2. **Browser Pool Management**
   - Reuses existing browser instances for efficiency
   - Maintains pool of up to 2 browsers
   - Optimizes resource usage

3. **Page Navigation & Optimization**
   - Blocks heavy resources for faster loading
   - Sets up request interception to avoid unnecessary downloads
   - Configures viewport and user agent for optimal scraping

4. **Content Extraction**
   - Waits for property cards to load using CSS selectors
   - Extracts: title, price, location, bedrooms, property type, images
   - Processes up to 10 properties for speed optimization

5. **Agent Information Extraction**
   - Extracts agent/company names from property cards
   - Creates mock emails for fast response
   - Optionally performs real email lookup for top 5 agents

#### Internet Search Process

1. **Query Processing**
   - Constructs targeted search queries for property websites
   - Focuses on Facebook Marketplace and independent property sites
   - Excludes major portals to avoid duplicates

2. **Concurrent API Calls**
   - Uses Brave Search API for web searches
   - Makes parallel requests with 8-second timeouts
   - Processes results from multiple sources simultaneously

3. **Result Filtering**
   - Excludes major property portals (Rightmove, Zoopla, etc.)
   - Looks for property-related keywords in titles and descriptions
   - Validates URLs and content quality

4. **Property Data Assembly**
   - Extracts basic information from search results
   - Creates realistic mock contact details
   - Returns structured property objects

### 4. Email Discovery System

The scraper includes a sophisticated email discovery engine:

#### Email Search Strategy
1. **Website Scraping**: Direct extraction from agent websites
2. **Search API**: Uses Brave Search API to find contact information
3. **Email Validation**: Filters out invalid/placeholder emails
4. **Prioritization**: Ranks emails by relevance (lettings > info > general)

#### Email Validation Process
- Validates email format using regex patterns
- Filters out common false positives and placeholder emails
- Excludes noreply, test, and example domain emails
- Prioritizes business and lettings-specific email addresses

### 5. Caching System

Implements a sophisticated caching mechanism with time-based expiration:

**Cache Types:**
- **Search Results Cache**: Stores property listings (20-30 minutes)
- **Agent Email Cache**: Stores discovered emails (30-120 minutes)

**Cache Features:**
- Time To Live (TTL) based expiration
- Automatic cleanup of expired entries
- Memory-efficient storage
- Fast retrieval for repeated queries

### 6. Performance Optimizations

#### Speed Optimizations
- **Browser Reuse**: Pool of persistent browser instances
- **Resource Blocking**: Blocks fonts, media, and unnecessary resources
- **Concurrent Processing**: Parallel API calls and scraping
- **Result Limiting**: Processes only top results for speed
- **Timeout Management**: Aggressive timeouts to prevent hanging

#### Memory Management
- **Page Cleanup**: Closes unnecessary browser pages
- **Cache Expiration**: Automatic cleanup of expired cache entries
- **Resource Limits**: Limits image downloads and processing

### 7. Data Structure

Each property returns this standardized format:

**Property Object Contains:**
- **title**: Property title/description
- **price**: Rental price (e.g., "£1,200 pcm")
- **location**: Property location/area
- **bedrooms**: Number of bedrooms
- **propertyType**: House, Flat, Apartment, etc.
- **imageUrls**: Array of property image URLs
- **agent**: Object containing name, email, and optional website

### 8. Error Handling & Resilience

- **Graceful Degradation**: Falls back to basic info if detailed scraping fails
- **Retry Logic**: Automatic retries for failed requests
- **Timeout Protection**: Prevents infinite waits
- **Rate Limiting**: Respects API rate limits with delays
- **Error Logging**: Comprehensive error tracking and logging

### 9. Integration Points

#### Frontend Integration
- SearchResults component calls backend endpoints
- Handles different search types (API, OnTheMarket, Internet)
- Manages loading states and error handling
- Displays results in a user-friendly interface

#### Backend Routing
- Routes requests to appropriate scrapers based on URL patterns
- Handles OnTheMarket URLs specifically
- Provides fallback options for different search types
- Manages API key distribution and rate limiting

## Key Features

1. **Multi-Source Scraping**: OnTheMarket, Facebook Marketplace, independent agents
2. **Fast Response Times**: Under 15 seconds for most searches
3. **Email Discovery**: Automatic contact information extraction
4. **Image Extraction**: Property photos and galleries
5. **Smart Caching**: Reduces redundant requests
6. **Browser Optimization**: Resource blocking and reuse
7. **Error Recovery**: Fallbacks and retry mechanisms

## Technical Dependencies

- **Puppeteer**: Web automation and scraping
- **Cheerio**: HTML parsing and DOM manipulation  
- **Axios**: HTTP requests for search APIs
- **Brave Search API**: Internet-wide property search
- **TypeScript**: Type safety and development experience

## Search Flow Summary

1. **User Input**: User enters search query in frontend
2. **Query Processing**: Frontend determines search type and formats request
3. **Backend Routing**: Backend routes to appropriate scraper function
4. **Data Extraction**: Scraper extracts property information from sources
5. **Email Enrichment**: System attempts to find contact emails for agents
6. **Result Assembly**: Data is structured into standardized property objects
7. **Caching**: Results are cached for future requests
8. **Response**: Formatted property data is returned to frontend
9. **Display**: Frontend presents properties to user with images and contact info

This system provides a robust, scalable solution for extracting property rental information from various UK property websites while maintaining good performance and reliability. The modular design allows for easy extension to additional property sources and search capabilities.




















