# Azure AI Foundry Portal Setup Guide for Property Extraction

## Overview

This guide walks through setting up Azure AI Foundry for property extraction from web pages and natural language queries.

## Prerequisites

- Azure subscription with access to AI services
- Admin access to create and configure AI resources
- Basic understanding of Azure portal navigation

## Step-by-Step Setup

### 1. Access Azure AI Foundry Portal

1. Navigate to [Azure AI Studio](https://ai.azure.com/)
2. Sign in with your Azure credentials
3. Select your subscription and resource group

### 2. Create AI Project

1. Click "Create new project"
2. Project name: `proptii-property-extraction`
3. Description: `AI-powered property data extraction from web sources`
4. Select region: `UK South` (for proximity to UK property data)
5. Click "Create"

### 3. Configure Model Deployment

1. In your project, go to "Deployments"
2. Click "Create deployment"
3. Model: Select `GPT-4.1` (latest version)
4. Deployment name: `proptii-gpt4-extraction`
5. Configure:
   - **Model version**: Latest
   - **Deployment type**: Standard
   - **Capacity**: Start with 1 (can scale later)
   - **Region**: UK South

### 4. Set Up Prompt Flow

1. Navigate to "Prompt flow" in your project
2. Click "Create new flow"
3. Flow name: `property-extraction-flow`
4. Description: `Extract structured property data from web content`

### 5. Configure Input Parameters

Set up the following input parameters for your flow:

```json
{
  "web_content": {
    "type": "string",
    "description": "HTML content from property listing page",
    "required": true
  },
  "user_query": {
    "type": "string",
    "description": "Natural language search query from user",
    "required": false
  },
  "extraction_mode": {
    "type": "string",
    "description": "Mode: 'single_property' or 'search_results'",
    "default": "single_property"
  }
}
```

### 6. Configure Output Schema

Define the expected output structure:

```json
{
  "properties": [
    {
      "id": "string",
      "title": "string",
      "price": "number",
      "price_type": "string",
      "location": "string",
      "postcode": "string",
      "property_type": "string",
      "bedrooms": "number",
      "bathrooms": "number",
      "description": "string",
      "features": ["string"],
      "images": ["string"],
      "agent_info": {
        "name": "string",
        "phone": "string",
        "email": "string"
      },
      "source_url": "string",
      "extraction_confidence": "number"
    }
  ],
  "search_metadata": {
    "total_results": "number",
    "query_understood": "string",
    "extraction_quality": "number"
  }
}
```

### 7. Environment Variables

Set up these environment variables in your project:

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=proptii-gpt4-extraction
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 8. Test Configuration

1. Create a test prompt with sample property HTML
2. Run the flow to verify configuration
3. Check output format matches expected schema
4. Validate extraction accuracy

## Example: Full Prompt Flow Setup for Property Extraction

Below is a complete, ready-to-use setup for your property extraction flow in Azure AI Foundry.

### 1. Prompt Template (`property-extraction.jinja2`)

Create this file in your flow. Paste the following:

````
system:
You are a specialized property data extraction AI assistant for Proptii, a UK property platform. Your role is to:

1. Extract structured property information from web content (HTML/text)
2. Process natural language property search queries
3. Return data in a consistent JSON format
4. Handle edge cases and missing data gracefully
5. Provide confidence scores for extraction quality

Core Capabilities:
- Property listing extraction from HTML/text content
- Natural language query understanding and processing
- UK property market knowledge (locations, property types, pricing)
- Data validation and cleaning
- Confidence scoring for extraction quality

Output Format Requirements:
- Always return valid JSON
- Use consistent field names and data types
- Handle missing data with null values
- Provide confidence scores (0-1) for extraction quality
- Include metadata about the extraction process

UK Property Context:
- Common property types: House, Flat, Apartment, Bungalow, Maisonette, Studio
- Price types: Sale, Rent, POA (Price on Application), Offers Over, Guide Price
- Location formats: City, Town, Area, Postcode
- Common features: Garden, Parking, Garage, En-suite, Balcony, etc.

user:
# Property Data Extraction Task

Input:
- Web Content: {{ web_content }}
- User Query: {{ user_query }}
- Extraction Mode: {{ extraction_mode }}

Instructions:

For Single Property Extraction (extraction_mode = "single_property"):
1. Parse the provided web content to extract property details
2. Focus on accuracy and completeness
3. Extract all available information
4. Provide high-confidence extraction

For Search Results (extraction_mode = "search_results"):
1. Process the user's natural language query
2. Extract multiple properties if present in content
3. Focus on relevance to the query
4. Provide search metadata

Required Output Format:
```json
{
  "properties": [
    {
      "id": "unique_identifier_or_generated_id",
      "title": "property_title",
      "price": 250000,
      "price_type": "Sale|Rent|POA|Offers Over|Guide Price",
      "location": "City/Town/Area",
      "postcode": "POSTCODE",
      "property_type": "House|Flat|Apartment|Bungalow|Maisonette|Studio",
      "bedrooms": 3,
      "bathrooms": 2,
      "description": "detailed_property_description",
      "features": ["feature1", "feature2", "feature3"],
      "images": ["image_url1", "image_url2"],
      "agent_info": {
        "name": "agent_name",
        "phone": "phone_number",
        "email": "email_address"
      },
      "source_url": "original_page_url",
      "extraction_confidence": 0.95
    }
  ],
  "search_metadata": {
    "total_results": 1,
    "query_understood": "paraphrased_user_query",
    "extraction_quality": 0.95,
    "processing_time_ms": 1500
  }
}
```

Data Extraction Guidelines:
- Price: Extract numeric value only (remove £, commas, etc.), handle ranges, POA, etc.
- Location: Extract city/town/area, separate postcode if present.
- Property Type: Map to standard types.
- Features: Extract and standardize amenities.
- Agent Info: Extract contact details if available.
- Missing/unclear data: Use null or best guess with lower confidence.
- Always return valid JSON, even if some fields are missing.

assistant:
(Your response should be a valid JSON object as specified above.)
```

**Response Format Note:**
- The assistant's response must be a valid JSON object matching the schema above.
- Do **not** include any extra text, markdown, or code block delimiters (e.g., no ```json ... ```). Only output the JSON object itself.

### 2. YAML Flow Definition (`flow.dag.yaml`)
Paste this in Raw file mode for your flow:

```yaml
inputs:
  web_content:
    type: string
  user_query:
    type: string
  extraction_mode:
    type: string
outputs:
  extraction_result:
    type: string
    reference: ${postprocess.output}
nodes:
  - name: llm_extract
    type: llm
    source:
      type: code
      path: property-extraction.jinja2
    inputs:
      web_content: ${inputs.web_content}
      user_query: ${inputs.user_query}
      extraction_mode: ${inputs.extraction_mode}
      deployment_name: 'your-gpt-4.1-deployment'   # <-- Set your deployment name here
      temperature: '0.1'
      max_tokens: '4000'
    provider: AzureOpenAI
    module: promptflow.tools.aoai
    api: chat
  - name: postprocess
    type: python
    source:
      type: code
      path: postprocess.py
    inputs:
      input: ${llm_extract.output}
```

### 3. Python Post-Processing Node (`postprocess.py`)

Create this file in your flow to ensure valid JSON output:

```python
import json
from promptflow import tool

@tool
def postprocess(input: str) -> str:
    # Try to extract JSON from the LLM output
    try:
        # Remove markdown code block if present
        if input.strip().startswith("```json"):
            input = input.strip().split("```json")[1].split("```", 1)[0].strip()
        elif input.strip().startswith("```"):
            input = input.strip().split("```", 1)[1].split("```", 1)[0].strip()
        # Parse and re-serialize to ensure valid JSON
        data = json.loads(input)
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse LLM output: {str(e)}", "raw_output": input})
```

### 4. How to Use

- Upload or create these three files in your flow:
  - `property-extraction.jinja2` (prompt template)
  - `flow.dag.yaml` (YAML flow definition)
  - `postprocess.py` (Python post-processing node)
- Set your actual GPT-4.1 deployment name in the YAML.
- Use the UI or API to provide `web_content`, `user_query`, and `extraction_mode` as inputs.

---

This setup will ensure your Azure AI Foundry flow is ready for robust property extraction with natural language and web content support, and outputs are always valid JSON for downstream use.

## Next Steps

- [ ] Complete portal setup
- [ ] Test with sample property data
- [ ] Integrate with backend API
- [ ] Set up monitoring and logging

## Troubleshooting

- **API Key Issues**: Ensure key has proper permissions
- **Model Access**: Verify GPT-4.1 access in your subscription
- **Rate Limits**: Monitor usage and adjust capacity as needed
- **Region Issues**: Ensure all resources are in same region

## Security Considerations

- Store API keys in Azure Key Vault
- Use managed identities where possible
- Enable logging and monitoring
- Set up proper access controls
````
