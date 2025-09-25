# CrewAI Property Marketing Service

A sophisticated AI-powered service for generating compliant UK property marketing content using CrewAI's agentic framework.

## 🎯 Overview

This service provides intelligent property marketing content generation through three specialized AI agents:

- **PropertyAnalysisAgent**: Analyzes property data and market context
- **ContentGenerationAgent**: Creates platform-specific marketing content
- **ComplianceValidationAgent**: Ensures UK regulatory compliance

## 🏗️ Architecture

```
Frontend (React) → Express Backend → CrewAI Service (Python)
                     ↓
                 WebSocket ← Real-time Updates
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- OpenAI API key
- Redis (for job queue)
- PostgreSQL (optional, for persistence)

### Installation

1. **Run the setup script:**

   ```bash
   cd crewai-service
   ./setup.sh
   ```

2. **Configure environment:**

   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start the service:**
   ```bash
   source venv/bin/activate
   python main.py
   ```

### Docker Setup

```bash
# Start all services
docker-compose -f docker-compose.crewai.yml up

# Or just the CrewAI service
docker-compose -f docker-compose.crewai.yml up crewai-service
```

## 📡 API Endpoints

### Generate Content

```http
POST /api/v1/generate
Content-Type: application/json

{
  "property_data": {
    "property_id": "prop_123",
    "address": "123 Example Street, London",
    "postcode": "SW1A 1AA",
    "property_type": "house",
    "price": 750000,
    "tenure": "freehold",
    "bedrooms": 3,
    "bathrooms": 2,
    "epc_rating": "C",
    "council_tax_band": "D",
    "features": ["Garden", "Parking", "Modern Kitchen"],
    "location_features": ["Near tube station", "Good schools"]
  },
  "platforms": ["facebook", "instagram", "linkedin"],
  "user_id": "user_123",
  "session_id": "session_456"
}
```

### Get Job Status

```http
GET /api/v1/jobs/{job_id}
```

### Health Check

```http
GET /health
```

### Service Capabilities

```http
GET /api/v1/capabilities
```

## 🔌 WebSocket Integration

Connect to real-time updates:

```javascript
const ws = new WebSocket("ws://localhost:8002/ws/{session_id}");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "job_update":
      console.log(`Progress: ${message.progress}% - ${message.message}`);
      break;
    case "job_complete":
      console.log("Content generated:", message.result);
      break;
    case "job_error":
      console.error("Generation failed:", message.error);
      break;
  }
};
```

## 🤖 AI Agents

### PropertyAnalysisAgent

- **Role**: UK Property Marketing Analyst
- **Capabilities**:
  - Property data analysis
  - Market positioning
  - Target audience identification
  - Competitive advantage assessment

### ContentGenerationAgent

- **Role**: Creative Property Marketing Copywriter
- **Capabilities**:
  - Platform-specific content creation
  - Headline and description writing
  - Hashtag optimization
  - Call-to-action creation

### ComplianceValidationAgent

- **Role**: ASA Compliance Validation Specialist
- **Capabilities**:
  - UK regulation compliance checking
  - ASA guideline validation
  - Anti-discrimination verification
  - Mandatory information validation

## 📋 Supported Platforms

| Platform  | Max Text | Hashtags | Image Ratio | Recommended Size |
| --------- | -------- | -------- | ----------- | ---------------- |
| Facebook  | 2,200    | 30       | 1.91:1      | 1200×630         |
| Instagram | 2,200    | 30       | 1:1         | 1080×1080        |
| LinkedIn  | 3,000    | 5        | 1.91:1      | 1200×627         |
| Twitter   | 280      | 10       | 16:9        | 1200×675         |

## ⚖️ UK Compliance

The service automatically validates content against:

- **ASA Mandatory Information**: Price, Tenure, Council Tax Band, EPC Rating
- **Prohibited Terms**: Luxury, exclusive, premium, stunning, gorgeous
- **Anti-Discrimination**: No targeting specific demographics
- **Accuracy Requirements**: Honest descriptions, truthful claims

## 🔧 Configuration

### Environment Variables

```bash
# CrewAI Configuration
CREWAI_VERBOSE=true
CREWAI_MEMORY=true

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_hub
REDIS_URL=redis://localhost:6379

# WebSocket
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8002

# UK Property APIs (Optional)
UK_PROPERTY_API_KEY=your_uk_property_api_key_here
EPC_API_KEY=your_epc_api_key_here
```

## 🧪 Testing

### Unit Tests

```bash
pytest tests/
```

### Integration Tests

```bash
python -m pytest tests/integration/ -v
```

### Load Testing

```bash
python tests/load_test.py
```

## 📊 Monitoring

### Health Checks

- Service health: `GET /health`
- Job queue status: Available via capabilities endpoint
- WebSocket connections: Logged in console

### Logging

- Structured logging with Loguru
- Different log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging for debugging

## 🚀 Deployment

### Production Considerations

1. **Scaling**: Use multiple CrewAI service instances with load balancing
2. **Redis Cluster**: For high-availability job queue
3. **Database**: PostgreSQL for persistent storage
4. **Monitoring**: APM tools like Sentry or DataDog
5. **Security**: API key management, rate limiting

### Docker Production

```bash
# Build production image
docker build -t crewai-property-marketing:latest .

# Run with production config
docker run -d \
  --name crewai-service \
  -p 8002:8002 \
  --env-file .env.production \
  crewai-property-marketing:latest
```

## 🔄 Development

### Adding New Agents

1. Create agent class in `agents/`
2. Implement required methods
3. Add to `PropertyMarketingCrew`
4. Update capabilities endpoint

### Adding New Platforms

1. Update `PLATFORM_CONFIGS` in `config.py`
2. Add platform-specific logic to `ContentGenerationAgent`
3. Update frontend platform selector

### Extending Compliance Rules

1. Update `UK_COMPLIANCE_RULES` in `config.py`
2. Enhance `ComplianceValidationAgent` logic
3. Add new validation checks

## 📈 Performance

### Benchmarks

- **Generation Time**: <30 seconds for complete workflow
- **Concurrent Jobs**: Up to 5 simultaneous generations
- **Memory Usage**: ~500MB per instance
- **API Response**: <500ms for job creation

### Optimization Tips

- Use Redis for job queue persistence
- Implement agent result caching
- Optimize LLM prompts for faster responses
- Use connection pooling for database

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**

   - Check API key validity
   - Verify rate limits
   - Check network connectivity

2. **WebSocket Connection Issues**

   - Verify port 8002 is available
   - Check firewall settings
   - Ensure proper CORS configuration

3. **Job Queue Problems**
   - Check Redis connection
   - Verify job queue configuration
   - Monitor memory usage

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py
```

## 📚 Resources

- [CrewAI Documentation](https://docs.crewai.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [UK ASA Guidelines](https://www.asa.org.uk/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Proptii Marketing Hub and follows the same licensing terms.

A sophisticated AI-powered service for generating compliant UK property marketing content using CrewAI's agentic framework.

## 🎯 Overview

This service provides intelligent property marketing content generation through three specialized AI agents:

- **PropertyAnalysisAgent**: Analyzes property data and market context
- **ContentGenerationAgent**: Creates platform-specific marketing content
- **ComplianceValidationAgent**: Ensures UK regulatory compliance

## 🏗️ Architecture

```
Frontend (React) → Express Backend → CrewAI Service (Python)
                     ↓
                 WebSocket ← Real-time Updates
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- OpenAI API key
- Redis (for job queue)
- PostgreSQL (optional, for persistence)

### Installation

1. **Run the setup script:**

   ```bash
   cd crewai-service
   ./setup.sh
   ```

2. **Configure environment:**

   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start the service:**
   ```bash
   source venv/bin/activate
   python main.py
   ```

### Docker Setup

```bash
# Start all services
docker-compose -f docker-compose.crewai.yml up

# Or just the CrewAI service
docker-compose -f docker-compose.crewai.yml up crewai-service
```

## 📡 API Endpoints

### Generate Content

```http
POST /api/v1/generate
Content-Type: application/json

{
  "property_data": {
    "property_id": "prop_123",
    "address": "123 Example Street, London",
    "postcode": "SW1A 1AA",
    "property_type": "house",
    "price": 750000,
    "tenure": "freehold",
    "bedrooms": 3,
    "bathrooms": 2,
    "epc_rating": "C",
    "council_tax_band": "D",
    "features": ["Garden", "Parking", "Modern Kitchen"],
    "location_features": ["Near tube station", "Good schools"]
  },
  "platforms": ["facebook", "instagram", "linkedin"],
  "user_id": "user_123",
  "session_id": "session_456"
}
```

### Get Job Status

```http
GET /api/v1/jobs/{job_id}
```

### Health Check

```http
GET /health
```

### Service Capabilities

```http
GET /api/v1/capabilities
```

## 🔌 WebSocket Integration

Connect to real-time updates:

```javascript
const ws = new WebSocket("ws://localhost:8002/ws/{session_id}");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "job_update":
      console.log(`Progress: ${message.progress}% - ${message.message}`);
      break;
    case "job_complete":
      console.log("Content generated:", message.result);
      break;
    case "job_error":
      console.error("Generation failed:", message.error);
      break;
  }
};
```

## 🤖 AI Agents

### PropertyAnalysisAgent

- **Role**: UK Property Marketing Analyst
- **Capabilities**:
  - Property data analysis
  - Market positioning
  - Target audience identification
  - Competitive advantage assessment

### ContentGenerationAgent

- **Role**: Creative Property Marketing Copywriter
- **Capabilities**:
  - Platform-specific content creation
  - Headline and description writing
  - Hashtag optimization
  - Call-to-action creation

### ComplianceValidationAgent

- **Role**: ASA Compliance Validation Specialist
- **Capabilities**:
  - UK regulation compliance checking
  - ASA guideline validation
  - Anti-discrimination verification
  - Mandatory information validation

## 📋 Supported Platforms

| Platform  | Max Text | Hashtags | Image Ratio | Recommended Size |
| --------- | -------- | -------- | ----------- | ---------------- |
| Facebook  | 2,200    | 30       | 1.91:1      | 1200×630         |
| Instagram | 2,200    | 30       | 1:1         | 1080×1080        |
| LinkedIn  | 3,000    | 5        | 1.91:1      | 1200×627         |
| Twitter   | 280      | 10       | 16:9        | 1200×675         |

## ⚖️ UK Compliance

The service automatically validates content against:

- **ASA Mandatory Information**: Price, Tenure, Council Tax Band, EPC Rating
- **Prohibited Terms**: Luxury, exclusive, premium, stunning, gorgeous
- **Anti-Discrimination**: No targeting specific demographics
- **Accuracy Requirements**: Honest descriptions, truthful claims

## 🔧 Configuration

### Environment Variables

```bash
# CrewAI Configuration
CREWAI_VERBOSE=true
CREWAI_MEMORY=true

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_hub
REDIS_URL=redis://localhost:6379

# WebSocket
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8002

# UK Property APIs (Optional)
UK_PROPERTY_API_KEY=your_uk_property_api_key_here
EPC_API_KEY=your_epc_api_key_here
```

## 🧪 Testing

### Unit Tests

```bash
pytest tests/
```

### Integration Tests

```bash
python -m pytest tests/integration/ -v
```

### Load Testing

```bash
python tests/load_test.py
```

## 📊 Monitoring

### Health Checks

- Service health: `GET /health`
- Job queue status: Available via capabilities endpoint
- WebSocket connections: Logged in console

### Logging

- Structured logging with Loguru
- Different log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging for debugging

## 🚀 Deployment

### Production Considerations

1. **Scaling**: Use multiple CrewAI service instances with load balancing
2. **Redis Cluster**: For high-availability job queue
3. **Database**: PostgreSQL for persistent storage
4. **Monitoring**: APM tools like Sentry or DataDog
5. **Security**: API key management, rate limiting

### Docker Production

```bash
# Build production image
docker build -t crewai-property-marketing:latest .

# Run with production config
docker run -d \
  --name crewai-service \
  -p 8002:8002 \
  --env-file .env.production \
  crewai-property-marketing:latest
```

## 🔄 Development

### Adding New Agents

1. Create agent class in `agents/`
2. Implement required methods
3. Add to `PropertyMarketingCrew`
4. Update capabilities endpoint

### Adding New Platforms

1. Update `PLATFORM_CONFIGS` in `config.py`
2. Add platform-specific logic to `ContentGenerationAgent`
3. Update frontend platform selector

### Extending Compliance Rules

1. Update `UK_COMPLIANCE_RULES` in `config.py`
2. Enhance `ComplianceValidationAgent` logic
3. Add new validation checks

## 📈 Performance

### Benchmarks

- **Generation Time**: <30 seconds for complete workflow
- **Concurrent Jobs**: Up to 5 simultaneous generations
- **Memory Usage**: ~500MB per instance
- **API Response**: <500ms for job creation

### Optimization Tips

- Use Redis for job queue persistence
- Implement agent result caching
- Optimize LLM prompts for faster responses
- Use connection pooling for database

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**

   - Check API key validity
   - Verify rate limits
   - Check network connectivity

2. **WebSocket Connection Issues**

   - Verify port 8002 is available
   - Check firewall settings
   - Ensure proper CORS configuration

3. **Job Queue Problems**
   - Check Redis connection
   - Verify job queue configuration
   - Monitor memory usage

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py
```

## 📚 Resources

- [CrewAI Documentation](https://docs.crewai.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [UK ASA Guidelines](https://www.asa.org.uk/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Proptii Marketing Hub and follows the same licensing terms.


