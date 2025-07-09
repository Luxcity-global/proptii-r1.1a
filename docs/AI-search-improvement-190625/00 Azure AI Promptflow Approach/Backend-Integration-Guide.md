# Backend Integration Guide: Azure AI Foundry Property Extraction

## Overview

This guide covers the integration of Azure AI Foundry with the Proptii backend for property extraction and natural language processing.

## Prerequisites

- Azure AI Foundry portal setup completed
- GPT-4.1 model deployed
- Environment variables configured

## Environment Variables Setup

### Required Environment Variables

Add these to your `.env` file in the `proptii-backend` directory:

```bash
# Azure AI Foundry Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=proptii-gpt4-extraction
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### Environment Variable Details

- **AZURE_OPENAI_ENDPOINT**: Your Azure OpenAI resource endpoint URL
- **AZURE_OPENAI_API_KEY**: API key from your Azure OpenAI resource
- **AZURE_OPENAI_DEPLOYMENT_NAME**: Name of your GPT-4.1 deployment (default: proptii-gpt4-extraction)
- **AZURE_OPENAI_API_VERSION**: API version (default: 2024-02-15-preview)

## Backend Service Architecture

### Files Created

1. **`src/services/property-extraction.service.ts`** - Core extraction service
2. **`src/controllers/property-extraction.controller.ts`** - API endpoints
3. **`src/test-property-extraction.ts`** - Integration test script
4. **`src/app.module.ts`** - Updated to include new service

### Service Features

- ✅ Natural language query processing
- ✅ Web content property extraction
- ✅ Structured JSON output with confidence scoring
- ✅ Error handling and validation
- ✅ Connection testing and health checks

## API Endpoints

### 1. Health Check

```http
GET /api/property-extraction/health
```

**Response:**

```json
{
  "status": "healthy",
  "service": "property-extraction",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 2. Azure AI Connection Test

```http
GET /api/property-extraction/test
```

**Response:**

```json
{
  "status": "success",
  "message": "Azure AI connection is working properly",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 3. Natural Language Query Processing

```http
POST /api/property-extraction/natural-language
Content-Type: application/json

{
  "query": "2 bed flats in Manchester under £200k"
}
```

**Response:**

```json
{
  "properties": [
    {
      "id": "extracted_1706358600000_abc123",
      "title": "2 Bedroom Flat in Manchester",
      "price": 180000,
      "price_type": "Sale",
      "location": "Manchester",
      "postcode": "M1 1AA",
      "property_type": "Flat",
      "bedrooms": 2,
      "bathrooms": 1,
      "description": "Modern 2-bedroom flat in central Manchester",
      "features": ["Modern kitchen", "En-suite", "Balcony"],
      "images": [],
      "agent_info": {
        "name": null,
        "phone": null,
        "email": null
      },
      "source_url": null,
      "extraction_confidence": 0.85
    }
  ],
  "search_metadata": {
    "total_results": 1,
    "query_understood": "Find 2-bedroom flats in Manchester with price under £200,000",
    "extraction_quality": 0.85,
    "processing_time_ms": 2500
  }
}
```

### 4. Web Content Extraction

```http
POST /api/property-extraction/web-content
Content-Type: application/json

{
  "web_content": "<div>Beautiful 3-bedroom house in Manchester. £250,000...</div>"
}
```

### 5. General Extraction

```http
POST /api/property-extraction/extract
Content-Type: application/json

{
  "web_content": "Property content here",
  "user_query": "Optional search query",
  "extraction_mode": "single_property"
}
```

## Testing the Integration

### 1. Start the Backend

```bash
cd proptii-backend
npm install
npm run start:dev
```

### 2. Run the Test Script

```bash
cd proptii-backend
npx ts-node src/test-property-extraction.ts
```

### 3. Manual API Testing

Use tools like Postman or curl to test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/property-extraction/health

# Test Azure connection
curl http://localhost:3000/api/property-extraction/test

# Natural language query
curl -X POST http://localhost:3000/api/property-extraction/natural-language \
  -H "Content-Type: application/json" \
  -d '{"query": "2 bed flats in Manchester under £200k"}'
```

## Error Handling

### Common Error Scenarios

1. **Missing Environment Variables**

   - Error: "Missing required environment variables"
   - Solution: Check `.env` file configuration

2. **Azure AI API Errors**

   - Error: "Azure AI API error: 401 - Unauthorized"
   - Solution: Verify API key and endpoint

3. **Model Deployment Issues**

   - Error: "Azure AI API error: 404 - Not Found"
   - Solution: Check deployment name and model access

4. **Rate Limiting**
   - Error: "Azure AI API error: 429 - Too Many Requests"
   - Solution: Implement retry logic or reduce request frequency

### Error Response Format

```json
{
  "statusCode": 500,
  "message": "Property extraction failed: Azure AI API error",
  "error": "Internal Server Error"
}
```

## Performance Optimization

### Configuration Tips

1. **Temperature Setting**: Set to 0.1 for consistent extraction
2. **Max Tokens**: 4000 for comprehensive responses
3. **Timeout**: 30 seconds for complex extractions
4. **Retry Logic**: Implement exponential backoff

### Monitoring

- Track processing time in metadata
- Monitor confidence scores
- Log extraction quality metrics
- Monitor API costs

## Integration with Frontend

### Frontend Service Integration

The backend is ready to integrate with the frontend External Collections feature:

```typescript
// Example frontend service call
const response = await fetch("/api/property-extraction/natural-language", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: userInput }),
});

const result = await response.json();
// Process extracted properties
```

### Data Flow

1. User enters natural language query
2. Frontend sends query to backend
3. Backend processes with Azure AI
4. Structured property data returned
5. Frontend displays results

## Security Considerations

### API Key Security

- Store API keys in environment variables
- Never commit keys to version control
- Use Azure Key Vault in production
- Rotate keys regularly

### Input Validation

- Validate all user inputs
- Sanitize web content
- Implement rate limiting
- Log suspicious requests

### Error Information

- Don't expose internal errors to users
- Log detailed errors for debugging
- Implement proper error codes

## Next Steps

### Immediate Actions

1. ✅ Set up Azure AI Foundry portal
2. ✅ Configure environment variables
3. ✅ Test backend integration
4. ✅ Verify API endpoints

### Upcoming Development

1. **Openrent Scraper**: Implement web scraping service
2. **Frontend Integration**: Connect with External Collections UI
3. **Performance Testing**: Load testing and optimization
4. **Production Deployment**: Environment setup and monitoring

## Troubleshooting

### Debug Mode

Enable detailed logging by setting:

```bash
LOG_LEVEL=debug
```

### Common Issues

1. **CORS Errors**: Configure CORS in main.ts
2. **Port Conflicts**: Check if port 3000 is available
3. **Module Errors**: Ensure all dependencies are installed
4. **TypeScript Errors**: Check tsconfig.json configuration

### Support

- Check Azure AI Foundry documentation
- Review NestJS logging for detailed errors
- Monitor Azure portal for API usage and errors
