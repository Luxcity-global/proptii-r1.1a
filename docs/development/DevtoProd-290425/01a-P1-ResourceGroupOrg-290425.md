**Resource Organization Plan for proptii-rg**

1. **Resource Group Structure**
   ```
   proptii-rg/
   ├── Core Infrastructure
   │   ├── Network Security
   │   │   ├── Network Security Groups
   │   │   └── Virtual Networks
   │   │
   │   ├── Identity & Access
   │   │   ├── Key Vault
   │   │   └── Managed Identities
   │   │
   │   └── Monitoring
   │       ├── Application Insights
   │       └── Log Analytics Workspace
   │
   ├── Application Services
   │   ├── Frontend
   │   │   ├── Static Web App (Production)
   │   │   ├── Static Web App (Staging)
   │   │   └── CDN Profile
   │   │
   │   ├── Backend
   │   │   ├── Function App (Production)
   │   │   ├── Function App (Staging)
   │   │   └── API Management
   │   │
   │   └── Database
   │       ├── Cosmos DB Account
   │       │   ├── Database (Production)
   │       │   │   ├── Properties Container
   │       │   │   ├── ViewingRequests Container
   │       │   │   └── Users Container
   │       │   └── Database (Staging)
   │       │       ├── Properties Container
   │       │       ├── ViewingRequests Container
   │       │       └── Users Container
   │       └── Cosmos DB Backup Vault
   │
   └── DevOps & CI/CD
       ├── Azure DevOps
       │   ├── Build Pipelines
       │   └── Release Pipelines
       │
       └── Monitoring & Alerts
           ├── Action Groups
           └── Alert Rules
   ```

2. **Resource Naming Convention**
   ```
   Format: proptii-{environment}-{service}-{resourceType}-{instance}
   
   Examples:
   - proptii-prod-web-static-01
   - proptii-prod-func-api-01
   - proptii-prod-cosmos-01
   - proptii-prod-cosmos-properties-01
   - proptii-prod-cosmos-viewings-01
   - proptii-prod-cosmos-users-01
   ```

3. **Tagging Strategy**
   ```
   Required Tags:
   - Environment: prod/staging/dev
   - Project: proptii
   - Component: frontend/backend/database/infrastructure
   - Owner: [team/individual]
   - CostCenter: [cost center code]
   - MigrationPhase: phase1/phase2/phase3
   
   Optional Tags:
   - Version: [version number]
   - LastUpdated: [date]
   - Criticality: high/medium/low
   ```

4. **Resource Dependencies**
   ```
   Critical Path:
   Key Vault → Function App → Cosmos DB
   Static Web App → CDN → Function App
   ```

5. **Access Control Structure**
   ```
   Role Assignments:
   - Network Admins: Network Security Groups
   - Database Admins: Cosmos DB Account
   - Developers: Function Apps & Static Web Apps
   - DevOps: CI/CD Resources
   - Security: Key Vault
   ```

6. **Resource Configuration Standards**
   ```
   Common Settings:
   - Location: East US 2 (eastus2)
   - SKU: Standard tier for production
   - Backup: Enabled for all production resources
   - Monitoring: Enabled for all resources
   - Logging: Enabled for all resources
   
   Cosmos DB Specific:
   - API: Core (SQL)
   - Consistency Level: Session
   - Multi-region: Enabled
   - Automatic Failover: Enabled
   ```

7. **Resource Lifecycle Management**
   ```
   Development Resources:
   - Auto-shutdown: Enabled
   - Auto-delete: After 7 days of inactivity
   
   Staging Resources:
   - Auto-shutdown: Disabled
   - Auto-delete: Manual
   
   Production Resources:
   - Auto-shutdown: Disabled
   - Auto-delete: Never
   ```

8. **Cost Management**
   ```
   Budget Allocation:
   - Infrastructure: 20%
   - Application Services: 40%
   - Cosmos DB: 30%
   - DevOps: 10%
   
   Cost Alerts:
   - Warning at 80% of budget
   - Critical at 95% of budget
   ```

9. **Monitoring Strategy**
   ```
   Key Metrics:
   - Application Performance
   - Cosmos DB Performance
     - Request Units (RU/s)
     - Storage Usage
     - Latency
     - Error Rate
   - Network Traffic
   - Cost Usage
   
   Alert Thresholds:
   - CPU: >80% for 5 minutes
   - Memory: >85% for 5 minutes
   - Response Time: >500ms
   - Error Rate: >1%
   - RU Consumption: >80% of provisioned
   ```

10. **Backup Strategy**
    ```
    Cosmos DB:
    - Continuous Backup: Enabled
    - Point-in-time Restore: Enabled
    - Retention: 30 days
    - Geo-redundancy: Enabled
    
    Application:
    - Configuration backup: Daily
    - Code backup: With each deployment
    ```

