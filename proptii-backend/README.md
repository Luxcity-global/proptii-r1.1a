# Proptii Backend

## Azure OpenAI Configuration

The backend uses Azure OpenAI for property search functionality. The following environment variables are required:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Important Notes:
1. The endpoint URL should not end with a trailing slash
2. The deployment name must match exactly with what's configured in Azure OpenAI
3. The API version is set to '2024-02-15-preview' in the code

### URL Structure
The Azure OpenAI endpoint is constructed as:
```
${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}
```

### Development Setup
1. Copy `.env.example` to `.env`
2. Fill in your Azure OpenAI credentials
3. Start the development server:
   ```bash
   npm run start:dev
   ```

### Production Deployment
Ensure all environment variables are properly set in your production environment before deploying.

## API Endpoints

### Search API
- **POST** `/search`
  - Request body:
    ```json
    {
      "query": "string",
      "type": "properties" | "suggestions"
    }
    ```
  - Returns property suggestions or search results based on the query 