# Scrappy AI Search Improvement - Technical Implementation

## Overview

This document outlines the technical implementation of a scrappy, test-and-learn version of the enhanced property harvesting feature. The goal is to quickly validate the concept by creating a separate section in the app that demonstrates the ability to harvest properties from multiple UK estate agent sources and display them as native listings.

## Current System Status (Updated)

### ✅ **What's Currently Working:**

**Frontend (React + Vite):**

- ✅ Running on: **http://localhost:5173**
- ✅ Status: HTTP 200 (Healthy)
- ✅ Hot module replacement enabled
- ✅ Tailwind CSS + Material-UI styling
- ✅ **NEW**: `/listings/new` route is now public (no authentication required)

**Backend (NestJS):**

- ✅ Running on: **http://localhost:3000**
- ✅ Status: HTTP 200 (Healthy)
- ✅ Cosmos DB connected
- ✅ Azure OpenAI integration ready
- ✅ Swagger docs: **http://localhost:3000/api**

### 🔗 **Available Endpoints:**

**Frontend Routes:**

- `http://localhost:5173/` - Home page
- `http://localhost:5173/listings` - Main listings page (mock data)
- `http://localhost:5173/listings/new` - New listing submission (**NOW PUBLIC**)
- `http://localhost:5173/listings/success` - Success page
- `http://localhost:5173/search` - Search functionality
- `http://localhost:5173/dashboard` - User dashboard (protected)
- `http://localhost:5173/referencing` - Referencing system (protected)

**Backend API Endpoints:**

- `http://localhost:3000/health` - Health check
- `http://localhost:3000/api` - Swagger documentation
- `http://localhost:3000/search` - Property search API
- `http://localhost:3000/search/suggestions` - Search suggestions API
- `http://localhost:3000/api/properties` - Properties CRUD API

### 📁 **Existing Project Structure:**

```
src/
├── pages/
│   ├── Listings.tsx                    # Main listings page with mock data
│   ├── listings/
│   │   ├── new.tsx                     # New listing submission (now public)
│   │   └── success.tsx                 # Success page after submission
│   └── ...
├── components/
│   ├── listings/
│   │   ├── ListingCard.tsx             # Property card component
│   │   ├── ListingDetailsModal.tsx     # Property details modal
│   │   └── submission/
│   │       ├── SubmissionForm.tsx      # Property submission form
│   │       └── ListingPreview.tsx      # Preview before submission
│   ├── SearchInput.tsx                 # AI-powered search input
│   ├── SearchResults.tsx               # Search results display
│   └── ...
├── services/
│   ├── SearchService.ts                # Property search service
│   ├── api.ts                          # API service layer
│   └── ...
├── utils/
│   ├── siteSearchMappings.ts           # External site URL builders
│   └── ...
└── ...
```

### 🎯 **Current Mock Data Structure:**

```typescript
// From src/pages/Listings.tsx
const mockProperties = [
  {
    id: "1",
    title: "Modern 2 Bed Apartment",
    price: 2500,
    type: "rent",
    bedrooms: 2,
    bathrooms: 1,
    isAvailableNow: true,
    location: {
      address: "123 Main St, Swiss Cottage",
      city: "London",
      postcode: "SW1A 1AA",
      coordinates: [51.5074, -0.1278],
    },
    images: ["https://placehold.co/600x400"],
    features: ["Furnished", "Parking", "Gym", "Pet Friendly"],
    description: "Beautiful modern apartment...",
    agent: {
      name: "John Smith",
      company: "Proptii Agents",
      phone: "+44 20 7123 4567",
      email: "john@proptii.com",
    },
    amenities: {
      schools: 3,
      transport: ["Swiss Cottage Station"],
      shops: ["Waitrose", "Marks & Spencer"],
    },
  },
  // ... more mock properties
];
```

### 🔧 **Existing Search Infrastructure:**

**Search Components:**

- `SearchInput.tsx` - AI-powered search with suggestions
- `SearchResults.tsx` - 2-column grid display
- `SearchService.ts` - Backend integration
- `OpenAISearchService.ts` - Azure OpenAI integration

**External Site Integration:**

- `siteSearchMappings.ts` - URL builders for Rightmove, Zoopla, OpenRent
- Basic scraping utilities in `src/scripts/`
- API endpoint: `pages/api/properties/search-listings.ts`

### 🛠 **Available Tools & Services:**

**AI Services:**

- Azure OpenAI (GPT-4o) - Already configured
- Search suggestions and property generation
- Content extraction and processing

**Database:**

- Cosmos DB - Connected and ready
- Property entities and schemas defined
- Viewing requests and agent data models

**External APIs:**

- Azure Storage for images
- Azure AD B2C for authentication
- Google APIs for sheets integration

## Current System Analysis

### 📁 **Existing Project Structure:**

```
src/
├── pages/
│   ├── Listings.tsx                    # Main listings page with mock data
│   ├── listings/
│   │   ├── new.tsx                     # New listing submission (now public)
│   │   └── success.tsx                 # Success page after submission
│   └── ...
├── components/
│   ├── listings/
│   │   ├── ListingCard.tsx             # Property card component
│   │   ├── ListingDetailsModal.tsx     # Property details modal
│   │   └── submission/
│   │       ├── SubmissionForm.tsx      # Property submission form
│   │       └── ListingPreview.tsx      # Preview before submission
│   ├── SearchInput.tsx                 # AI-powered search input
│   ├── SearchResults.tsx               # Search results display
│   └── ...
├── services/
│   ├── SearchService.ts                # Property search service
│   ├── api.ts                          # API service layer
│   └── ...
├── utils/
│   ├── siteSearchMappings.ts           # External site URL builders
│   └── ...
└── ...
```

### 🔗 **Available Endpoints:**

**Frontend Routes:**

- `http://localhost:5173/` - Home page
- `http://localhost:5173/listings` - Main listings page (mock data)
- `http://localhost:5173/listings/new` - New listing submission (now public)
- `http://localhost:5173/listings/success` - Success page
- `http://localhost:5173/search` - Search functionality
- `http://localhost:5173/dashboard` - User dashboard (protected)
- `http://localhost:5173/referencing` - Referencing system (protected)

**Backend API Endpoints:**

- `http://localhost:3000/health` - Health check
- `http://localhost:3000/api` - Swagger documentation
- `http://localhost:3000/search` - Property search API
- `http://localhost:3000/search/suggestions` - Search suggestions API
- `http://localhost:3000/api/properties` - Properties CRUD API

### 🎯 **Current Mock Data Structure:**

```typescript
// From src/pages/Listings.tsx
const mockProperties = [
  {
    id: "1",
    title: "Modern 2 Bed Apartment",
    price: 2500,
    type: "rent",
    bedrooms: 2,
    bathrooms: 1,
    isAvailableNow: true,
    location: {
      address: "123 Main St, Swiss Cottage",
      city: "London",
      postcode: "SW1A 1AA",
      coordinates: [51.5074, -0.1278],
    },
    images: ["https://placehold.co/600x400"],
    features: ["Furnished", "Parking", "Gym", "Pet Friendly"],
    description: "Beautiful modern apartment...",
    agent: {
      name: "John Smith",
      company: "Proptii Agents",
      phone: "+44 20 7123 4567",
      email: "john@proptii.com",
    },
    amenities: {
      schools: 3,
      transport: ["Swiss Cottage Station"],
      shops: ["Waitrose", "Marks & Spencer"],
    },
  },
  // ... more mock properties
];
```

### 🔧 **Existing Search Infrastructure:**

**Search Components:**

- `SearchInput.tsx` - AI-powered search with suggestions
- `SearchResults.tsx` - 2-column grid display
- `SearchService.ts` - Backend integration
- `OpenAISearchService.ts` - Azure OpenAI integration

**External Site Integration:**

- `siteSearchMappings.ts` - URL builders for Rightmove, Zoopla, OpenRent
- Basic scraping utilities in `src/scripts/`
- API endpoint: `pages/api/properties/search-listings.ts`

### 🛠 **Available Tools & Services:**

**AI Services:**

- Azure OpenAI (GPT-4o) - Already configured
- Search suggestions and property generation
- Content extraction and processing

**Database:**

- Cosmos DB - Connected and ready
- Property entities and schemas defined
- Viewing requests and agent data models

**External APIs:**

- Azure Storage for images
- Azure AD B2C for authentication
- Google APIs for sheets integration

## Easy Implementation Routes

### Route 1: Mock Data First (FASTEST - 1 day)

**Why this is easiest:** No scraping complexity, immediate visual feedback

- Create mock harvested properties that look real
- Build the UI components first
- Test user experience immediately
- Replace with real scraping later

### Route 2: Extend Existing Scraping (MEDIUM - 2-3 days)

**Why this is medium:** You already have some scraping code

- Extend your existing `src/scripts/testPropertySiteSearch.ts`
- Use your current `src/utils/siteSearchMappings.ts`
- Build on your existing `pages/api/properties/search-listings.ts`
- Add the new UI components

### Route 3: Rightmove Only (EASIEST SCRAPING - 2 days)

**Why this is easiest scraping:** Start with one reliable source

- Implement only Rightmove scraper
- Use your existing Cheerio setup
- Build simple results display
- Test and iterate

## Recommended Approach: Route 1 (Mock Data First)

Here's why this is the smartest approach:

### ✅ **Benefits:**

1. **Immediate Results** - You'll see the feature working in hours, not days
2. **Test User Experience** - Validate the concept before investing in complex scraping
3. **Iterate Quickly** - Easy to change UI/UX based on feedback
4. **No Legal Concerns** - No scraping issues during initial development
5. **Team Buy-in** - Stakeholders can see and interact with the feature immediately

### 📋 **Quick Implementation Plan:**

**Day 1:**

- Create mock data service with realistic property data
- Build the search interface
- Display results in a nice grid
- Add navigation link to the new section

**Day 2:**

- Add agent contact modal
- Implement relevance scoring on mock data
- Test with different search scenarios

**Day 3+:**

- Replace mock data with real scraping
- Add more sources gradually
- Optimize and refine

### 🛠 **Technical Approach:**

The documentation I created shows you exactly how to:

1. Create a separate `/property-harvesting` route
2. Build modular components that can easily switch from mock to real data
3. Implement a scoring system for relevance
4. Add agent contact functionality
5. Handle errors and loading states

### 🎯 **Key Advantages of This Approach:**

1. **Risk Mitigation** - If scraping doesn't work as expected, you still have a working feature
2. **User Feedback** - Get real user feedback on the concept before heavy development
3. **Flexible Architecture** - Easy to swap mock data for real scraping later
4. **Quick Validation** - Test the business concept without technical complexity

## AI-Powered Data Extraction Approaches

### 🎯 **Approach 1: Structured Prompting (Easiest)**

**How it works:**

- Use Azure OpenAI to extract structured data from property descriptions
- Send HTML content to GPT-4o with specific extraction prompts
- Parse the structured response into property objects

**Implementation:**

```typescript
const extractPropertyData = async (htmlContent: string) => {
  const prompt = `
    Extract property information from this HTML content:
    ${htmlContent}
    
    Return as JSON:
    {
      "title": "Property title",
      "price": "£1,500 pcm",
      "bedrooms": 2,
      "bathrooms": 1,
      "location": "Walthamstow, London",
      "description": "Property description",
      "features": ["Furnished", "Garden"],
      "agent": {
        "name": "Agent name",
        "company": "Company name",
        "phone": "Phone number",
        "email": "Email address"
      }
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
};
```

**Pros:**

- ✅ Very easy to implement
- ✅ Works with any HTML structure
- ✅ Handles edge cases automatically
- ✅ No need for complex selectors

**Cons:**

- ❌ Higher API costs
- ❌ Slower processing
- ❌ Rate limiting concerns

### 🎯 **Approach 2: Hybrid Extraction (Medium)**

**How it works:**

- Use basic CSS selectors for reliable data (price, title, location)
- Use AI only for complex extraction (features, agent details)
- Combine both approaches for best results

**Implementation:**

```typescript
const hybridExtraction = async (html: string, $: CheerioAPI) => {
  // Basic extraction with selectors
  const basicData = {
    title: $(".property-title").text().trim(),
    price: $(".property-price").text().trim(),
    location: $(".property-location").text().trim(),
    bedrooms: parseInt($(".bedrooms").text()) || 0,
    bathrooms: parseInt($(".bathrooms").text()) || 0,
  };

  // AI extraction for complex data
  const description = $(".property-description").text();
  const aiData = await extractWithAI(description);

  return { ...basicData, ...aiData };
};
```

**Pros:**

- ✅ Cost-effective
- ✅ Fast for basic data
- ✅ Reliable for structured content
- ✅ AI handles complex parsing

**Cons:**

- ❌ Requires some selector maintenance
- ❌ Still needs AI for complex data

### 🎯 **Approach 3: Template-Based AI (Most Efficient)**

**How it works:**

- Create site-specific templates for each estate agent
- Use AI to fill in the templates with extracted data
- Standardize output across all sources

**Implementation:**

```typescript
const siteTemplates = {
  rightmove: {
    selectors: {
      title: ".propertyCard-title",
      price: ".propertyCard-priceValue",
      location: ".propertyCard-address",
    },
    aiPrompt:
      "Extract features and agent details from Rightmove property description",
  },
  zoopla: {
    selectors: {
      title: '[data-testid="listing-title"]',
      price: '[data-testid="listing-price"]',
      location: '[data-testid="listing-location"]',
    },
    aiPrompt:
      "Extract features and agent details from Zoopla property description",
  },
};

const templateExtraction = async (site: string, html: string) => {
  const template = siteTemplates[site];
  const $ = cheerio.load(html);

  // Use selectors for basic data
  const basicData = {};
  Object.entries(template.selectors).forEach(([key, selector]) => {
    basicData[key] = $(selector).text().trim();
  });

  // Use AI with site-specific prompt
  const description = $(".description").text();
  const aiData = await extractWithAI(description, template.aiPrompt);

  return { ...basicData, ...aiData };
};
```

**Pros:**

- ✅ Most cost-effective
- ✅ Fastest processing
- ✅ Site-specific optimization
- ✅ Easy to maintain and extend

**Cons:**

- ❌ Requires initial template setup
- ❌ Need to update templates when sites change

## Recommended AI Approach: Template-Based (Approach 3)

For the scrappy version, I recommend **Approach 3: Template-Based AI** because:

1. **Cost-Effective** - Minimal AI usage, mostly selector-based
2. **Fast** - Quick processing for real-time results
3. **Maintainable** - Easy to add new sites
4. **Reliable** - Combines best of both worlds

### 🚀 **Implementation Priority:**

1. **Start with Rightmove** - Most reliable and structured
2. **Add Zoopla** - Good structure, popular source
3. **Add OpenRent** - Direct agent listings
4. **Expand to local agents** - Regional coverage

This approach will give you a working system quickly while keeping costs low and performance high!

## Next Steps

1. **Start with Route 1** - Create the basic structure and mock data
2. **Test thoroughly** - Ensure the UI works well
3. **Iterate quickly** - Add more sources and improve the user experience
4. **Monitor performance** - Track success rates and user engagement
5. **Plan for production** - Consider legal implications and scaling requirements

This scrappy implementation provides a solid foundation for testing the concept while maintaining the flexibility to evolve based on real-world usage and feedback.
