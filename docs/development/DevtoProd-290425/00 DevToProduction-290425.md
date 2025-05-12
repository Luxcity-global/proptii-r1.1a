Here's a detailed implementation plan to migrate from Firebase to Azure, leveraging existing Azure resources while adding new ones:

**Phase 1: Preparation & Setup (1-2 Days)**
```
1. Resource Organization
   ├── Create Resource Group (if not exists)
   │   └── "proptii-rg" (existing)
   └── Set up Azure DevOps project
       └── Configure deployment pipelines

2. Database Migration Planning
   ├── Schema mapping: Firestore → Cosmos DB
   │   ├── properties
   │   ├── viewingRequests
   │   └── users
   └── Create Cosmos DB migration strategy

3. Environment Setup
   ├── Development
   │   ├── .env.development
   │   └── local.settings.json
   ├── Staging
   │   └── .env.staging
   └── Production
       └── .env.production
```

**Phase 2: Azure Static Web Apps Setup (1-2 Days)**
```
1. Frontend Migration
   ├── Create Static Web App resource
   │   └── Link to GitHub repository
   ├── Configure build settings
   │   ├── Build configuration
   │   └── Output location
   └── Setup custom domain & SSL

2. Authentication Migration
   ├── Already using Azure AD B2C ✓
   ├── Update auth configuration
   └── Remove Firebase auth

3. Environment Configuration
   ├── Add application settings
   └── Configure staging environments
```

**Phase 3: Azure Functions Implementation (2-3 Days)**
```
1. API Migration
   ├── Create Function App
   │   └── Node.js runtime
   ├── Migrate endpoints
   │   ├── Property endpoints
   │   ├── Viewing endpoints
   │   └── User endpoints
   └── Setup API routes

2. Database Connection
   ├── Configure Cosmos DB connection
   ├── Setup container access
   └── Implement retry logic

3. Middleware Setup
   ├── Authentication
   ├── Error handling
   └── Logging
```

**Phase 4: Database Migration (2-3 Days)**
```
1. Cosmos DB Setup
   ├── Create Cosmos DB account
   ├── Configure containers
   │   ├── Properties
   │   ├── ViewingRequests
   │   └── Users
   └── Setup backup & restore

2. Schema Migration
   ├── Design container structure
   │   ├── Partition keys
   │   ├── Indexing policies
   │   └── Consistency levels
   └── Setup access patterns

3. Data Migration
   ├── Export Firestore data
   ├── Transform to Cosmos DB format
   └── Import to Cosmos DB containers
```

**Phase 5: Azure CDN Integration (1 Day)**
```
1. CDN Setup
   ├── Create CDN profile
   ├── Configure endpoints
   └── Setup rules

2. Asset Migration
   ├── Move static assets
   └── Update asset URLs
```

**Phase 6: Testing & Validation (2-3 Days)**
```
1. Integration Testing
   ├── API endpoints
   ├── Authentication flows
   └── Cosmos DB operations

2. Performance Testing
   ├── Load testing
   ├── CDN validation
   └── Cosmos DB optimization
     ├── RU/s consumption
     ├── Query performance
     └── Partition strategy

3. Security Testing
   ├── Authentication
   ├── Authorization
   └── Data access
```

**Phase 7: Deployment & Firebase Removal (1-2 Days)**
```
1. Production Deployment
   ├── Cosmos DB deployment
   ├── Function deployment
   └── Frontend deployment

2. Firebase Cleanup
   ├── Backup Firebase data
   ├── Remove Firebase config
   └── Delete Firebase project
```

**Critical Files to Update:**
```
1. Frontend
   ├── src/config/azure.ts (update)
   ├── src/config/firebase.ts (remove)
   ├── src/services/api.ts (update)
   └── src/contexts/AuthContext.tsx (update)

2. Backend
   ├── src/database/
   │   ├── cosmos/
   │   │   ├── containers/
   │   │   └── models/
   │   └── migrations/
   ├── src/functions/
   └── src/middleware/
```

**Environment Variables to Update:**
```
Remove:
- All FIREBASE_* variables

Add/Update:
- AZURE_FUNCTIONS_URL
- COSMOS_DB_CONNECTION_STRING
- COSMOS_DB_DATABASE_NAME
- COSMOS_DB_CONTAINER_NAMES
- AZURE_CDN_ENDPOINT
- AZURE_STATIC_WEB_APP_*
```

**Rollback Plan:**
```
1. Database
   ├── Keep Firebase active during migration
   ├── Maintain data sync for 1 week
   └── Keep Firestore backups

2. Frontend
   ├── Keep Firebase config
   └── Feature flags for rollback

3. Monitoring
   ├── Set up alerts
   └── Monitor error rates
```

**Post-Migration Tasks:**
```
1. Documentation
   ├── Update API docs
   ├── Update deployment guides
   └── Update troubleshooting guides

2. Monitoring Setup
   ├── Application Insights
   ├── Cosmos DB metrics
     ├── RU/s monitoring
     ├── Latency tracking
     └── Error rate monitoring
   └── CDN metrics

3. Cost Optimization
   ├── Review resource sizing
   ├── Setup Cosmos DB autoscale
   └── Implement caching
```

Would you like me to:
1. Detail any specific phase further?
2. Create specific migration scripts?
3. Provide cost estimates?
4. Start with any particular component?
