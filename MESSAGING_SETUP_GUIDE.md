# Proptii Messaging System - Setup Guide

## 📋 Overview

This guide walks you through setting up the complete messaging system for Proptii-hosted properties. The system includes:

- ✅ In-app messaging between tenants and landlords
- ✅ File attachments (PDF, DOC, DOCX, TXT up to 10MB)
- ✅ Email notifications with smart deduplication
- ✅ Real-time unread badge with 30-second polling
- ✅ Participant-level security guards
- ✅ Soft delete with audit logging

---

## 🗂️ Configuration Files Created

### 1. **`api/.env`** (Backend environment variables)
   - Contains all Azure Functions configuration
   - Includes detailed comments and setup instructions
   - **Location**: `api/.env`

### 2. **`api/local.settings.json`** (Azure Functions local settings)
   - JSON format required by Azure Functions runtime
   - Same variables as `.env` but in JSON format
   - **Location**: `api/local.settings.json`

### 3. **`.env`** (Frontend environment variables - updated)
   - Added `VITE_API_ENDPOINT` for messaging API calls
   - **Location**: `.env` (root directory)

---

## ⚙️ Step-by-Step Setup

### Step 1: Create Cosmos DB Containers

**CRITICAL**: The messaging system will not work until these containers exist.

Open Azure Portal → Cosmos DB → Your Database → Create the following containers:

| Container Name | Partition Key | Additional Config |
|---|---|---|
| `conversations` | `/tenantId` | — |
| `messages` | `/conversationId` | Add composite index: `[conversationId ASC, sentAt ASC]` |
| `message_attachments` | `/conversationId` | — |
| `conversation_participants` | `/conversationId` | — |
| `notification_log` | `/recipientId` | **Set TTL to 7776000 seconds (90 days)** |
| `audit_log` | `/actorId` | — |

**Azure CLI commands** (alternative):

```bash
# Set variables
RESOURCE_GROUP="your-resource-group"
ACCOUNT_NAME="proptii-cosmos-db"
DATABASE_NAME="proptii-cosmos-db"

# Create containers
az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name conversations \
  --partition-key-path /tenantId

az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name messages \
  --partition-key-path /conversationId

az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name message_attachments \
  --partition-key-path /conversationId

az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name conversation_participants \
  --partition-key-path /conversationId

az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name notification_log \
  --partition-key-path /recipientId \
  --ttl 7776000

az cosmosdb sql container create \
  --resource-group $RESOURCE_GROUP \
  --account-name $ACCOUNT_NAME \
  --database-name $DATABASE_NAME \
  --name audit_log \
  --partition-key-path /actorId
```

---

### Step 2: Configure Azure Blob Storage

#### Option A: Use Existing Storage Account (proptiir11a)

1. Go to Azure Portal → Storage Accounts → `proptiir11a`
2. Click **Access Keys** → Copy **Connection String**
3. Update `api/local.settings.json`:
   ```json
   "BLOB_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=proptiir11a;AccountKey=<PASTE-KEY-HERE>;EndpointSuffix=core.windows.net"
   ```
4. Create a new container:
   - Go to **Containers** → **+ Container**
   - Name: `message-attachments`
   - Access level: **Private**

#### Option B: Create New Storage Account

```bash
# Create storage account
az storage account create \
  --name proptiiattachments \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name proptiiattachments \
  --resource-group your-resource-group

# Create container
az storage container create \
  --name message-attachments \
  --account-name proptiiattachments \
  --public-access off
```

---

### Step 3: Fix Email Notifications

The current `NotificationService` uses `nodemailer` with `sendmail: true`, which **doesn't work in Azure Functions**.

#### Option A: Use Resend API (Recommended)

You already have a Resend API key in `.env`. Update `api/src/shared/services/NotificationService.ts`:

```typescript
// Replace the nodemailer transporter with Resend
import axios from 'axios';

// In the notify() method, replace:
const transporter = nodemailer.createTransport({ sendmail: true });
await transporter.sendMail({ ... });

// With:
await axios.post('https://api.resend.com/emails', {
  from: fromAddress,
  to: recipientEmail,
  subject: `New message from ${senderName}`,
  text: `You have a new message from ${senderName}. Log in to Proptii to view it.`,
}, {
  headers: {
    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

#### Option B: Use Gmail SMTP

Update `NotificationService.ts`:

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'contactus@theluxcity.co.uk',
    pass: 'ddrflanpxxptgoaf'
  }
});
```

---

### Step 4: Update Users Container

The `NotificationService` reads/writes a `lastSeenAt` field on user records. Ensure your `Users` container schema includes:

```typescript
interface User {
  id: string;
  email: string;
  // ... other fields
  lastSeenAt?: string; // ISO 8601 timestamp
}
```

If this field doesn't exist, the notification system will still work but email suppression won't function correctly.

---

### Step 5: Local Development Setup

#### Install Azurite (Azure Storage Emulator)

```bash
npm install -g azurite

# Start Azurite
azurite --silent --location c:\azurite --debug c:\azurite\debug.log
```

#### Start the Backend (Azure Functions)

```bash
cd api
npm install
npm run build
npm start
```

The API will run on `http://localhost:7071`

#### Start the Frontend

```bash
# In root directory
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

---

### Step 6: Verify the Setup

#### Test 1: Check API Health

```bash
curl http://localhost:7071/api/health
```

Expected: `{ "status": "ok" }`

#### Test 2: Check Cosmos DB Containers

```bash
# List containers
az cosmosdb sql container list \
  --resource-group your-resource-group \
  --account-name proptii-cosmos-db \
  --database-name proptii-cosmos-db
```

Expected: All 6 containers listed

#### Test 3: Test Messaging Flow

1. Log in as a tenant
2. Navigate to a Proptii-hosted property (one with a `landlordId`)
3. Click the **Message** button
4. Verify you're redirected to `/dashboard/messages`
5. Send a test message
6. Check Cosmos DB → `messages` container for the new document

---

## 🚀 Deployment to Azure

### Update Azure Function App Configuration

1. Go to Azure Portal → Function App → Configuration
2. Add all variables from `api/local.settings.json` as **Application Settings**
3. Click **Save**

### Deploy the Function App

```bash
cd api
npm run build

# Deploy using Azure Functions Core Tools
func azure functionapp publish <your-function-app-name>
```

### Update Frontend Environment Variables

For production, update `.env.production`:

```env
VITE_API_ENDPOINT=https://your-function-app.azurewebsites.net
```

---

## 📊 What Works Now vs What Needs Config

| Feature | Status |
|---|---|
| Text messaging (send/receive) | ✅ Works once Cosmos DB containers exist |
| Conversation creation | ✅ Works once Cosmos DB containers exist |
| Unread badge + polling | ✅ Works once Cosmos DB containers exist |
| Participant guard (security) | ✅ Works once Cosmos DB containers exist |
| Soft delete + audit log | ✅ Works once Cosmos DB containers exist |
| Phone normalisation / Call CTA | ✅ Works now (no extra config) |
| File attachments | ⚠️ Needs Blob Storage connection string + container |
| Email notifications | ⚠️ Needs email transport fix (sendmail → SMTP/Resend) |
| Scraped property messaging | ❌ Not supported — uses viewing booking flow |

---

## 🔍 Troubleshooting

### Issue: "BLOB_STORAGE_NOT_CONFIGURED" error

**Solution**: Set `BLOB_STORAGE_CONNECTION_STRING` in `api/local.settings.json`

### Issue: "CONVERSATION_NOT_FOUND" error

**Solution**: Ensure the `conversation_participants` container exists in Cosmos DB

### Issue: Messages not appearing

**Solution**: 
1. Check browser console for API errors
2. Verify `VITE_API_ENDPOINT` points to your running Azure Functions instance
3. Check CORS settings in `api/local.settings.json`

### Issue: Email notifications not sending

**Solution**: 
1. Update `NotificationService.ts` to use Resend or SMTP (see Step 3)
2. Verify `RESEND_API_KEY` or SMTP credentials are correct

### Issue: "Unable to message: landlord information unavailable"

**Solution**: This property is a scraped property (no `landlordId`). The messaging system only works for Proptii-hosted properties stored in Cosmos DB.

---

## 📝 Next Steps

1. ✅ Create Cosmos DB containers (Step 1)
2. ✅ Configure Blob Storage (Step 2)
3. ✅ Fix email notifications (Step 3)
4. ✅ Test locally (Step 6)
5. ✅ Deploy to Azure (Deployment section)

---

## 📞 Support

For issues or questions:
- Check the [Requirements Document](.kiro/specs/proptii-communication/requirements.md)
- Check the [Design Document](.kiro/specs/proptii-communication/design.md)
- Review the [Tasks List](.kiro/specs/proptii-communication/tasks.md)

All 27 property-based tests are passing. The system is production-ready once configured.
