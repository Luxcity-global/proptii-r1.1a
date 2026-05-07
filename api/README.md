# Proptii Azure Functions API

A specialized serverless API built with **Azure Functions** to handle high-performance backend tasks.

## 🛠️ Technology Stack
- **Runtime**: Node.js 20
- **Framework**: [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- **Language**: TypeScript

---

## 🚀 Purpose
While the main NestJS backend handles core business logic, this API provides:
- **Fast Endpoints**: Optimized serverless functions for map data and search results.
- **Auto-scaling**: Designed to handle bursts of traffic during property launches.
- **Cloud Integration**: Native binding to Azure Cosmos DB and Storage.

---

## 📁 Repository Structure
- **[`src/`](src/)**: Function definitions and logic.
- **`host.json`**: Global configuration for Azure Functions.
- **`local.settings.json`**: Local environment variables (do not commit).
- **`package.json`**: Dependencies and deployment scripts.

---

## ⚙️ Environment Configuration

### Local Development

1. Copy the template and fill in your values:
   ```bash
   # local.settings.json is already created with all required variables
   # Edit api/local.settings.json and replace placeholder values
   ```

2. Required variables (already populated from existing credentials):
   - `COSMOS_DB_CONNECTION_STRING` ✅
   - `COSMOS_DB_KEY` ✅
   - `COSMOS_DB_DATABASE_NAME` ✅
   - `AZURE_AD_B2C_*` ✅

3. Variables needing your input:
   - `BLOB_STORAGE_CONNECTION_STRING` — get from Azure Portal → Storage Accounts → proptiir11a → Access Keys
   - `APPINSIGHTS_INSTRUMENTATIONKEY` — get from Azure Portal → Application Insights
   - `DOCUSIGN_*` — get from DocuSign Developer Portal

### Messaging System Setup

Before the messaging system works, create these Cosmos DB containers:

| Container | Partition Key | TTL |
|---|---|---|
| `conversations` | `/tenantId` | — |
| `messages` | `/conversationId` | — |
| `message_attachments` | `/conversationId` | — |
| `conversation_participants` | `/conversationId` | — |
| `notification_log` | `/recipientId` | 90 days |
| `audit_log` | `/actorId` | — |

See `MESSAGING_SETUP_GUIDE.md` in the root directory for full instructions.

### Running Locally

```bash
npm install
npm run build
npm start
```

API runs on `http://localhost:7071`

---

© 2026 Proptii. All Rights Reserved.
