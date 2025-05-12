# API Functions Summary

This document provides a high-level overview of all API functions used in the Proptii application, categorized by their current implementation status and future plans.

## Real API Calls

These functions make actual API calls to external services:

### Authentication (Azure B2C)

- **`login()`**: Authenticates users via Azure B2C
- **`logout()`**: Logs users out via Azure B2C
- **`editProfile()`**: Allows users to edit their profile via Azure B2C

### Property Search (Azure OpenAI)

- **`handleSearch()`**: Searches for property listings using Azure OpenAI
- **`parseResults()`**: Parses property listing URLs from the API response

## Simulated API Calls

These functions currently simulate API behavior but will be replaced with real API calls in the future:

### Referencing Process

- **`saveCurrentStep()`**: Saves the current step of the referencing form
- **`submitApplication()`**: Submits the complete referencing application
- **`connectToOpenBanking()`**: Simulates connecting to open banking services

## Future API Endpoints

Based on the current simulation functions, the following API endpoints will need to be implemented:

### Applications API

- **`PUT /api/applications/:applicationId/sections/:sectionName`**
  - Save data for a specific section of the application

- **`POST /api/applications/:applicationId/submit`**
  - Submit the complete application

- **`GET /api/applications/:applicationId`**
  - Retrieve an application by ID

- **`POST /api/applications/:applicationId/documents`**
  - Upload documents for an application

### Open Banking API

- **`POST /api/applications/:applicationId/open-banking/connect`**
  - Initiate open banking connection

- **`GET /api/applications/:applicationId/open-banking/status`**
  - Check open banking connection status

### Property Search API

- **`POST /api/search/properties`**
  - Search for properties (currently using Azure OpenAI directly)

## Implementation Priorities

1. **High Priority**
   - Applications API endpoints for saving and retrieving application data
   - Document upload functionality

2. **Medium Priority**
   - Open Banking integration
   - Enhanced property search with filters and pagination

3. **Low Priority**
   - Analytics for user behavior
   - Caching mechanisms for search results

## Integration Considerations

- **Authentication**: All API endpoints should require authentication via Azure B2C
- **Error Handling**: Implement consistent error handling across all API calls
- **Logging**: Add logging for all API calls for debugging and analytics
- **Rate Limiting**: Consider implementing rate limiting for external API calls
- **Caching**: Implement caching for frequently accessed data 