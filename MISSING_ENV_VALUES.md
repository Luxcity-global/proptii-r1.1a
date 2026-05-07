# Missing Environment Variable Values - Quick Reference

## 🔴 Critical (Required for Messaging to Work)

### 1. Azure Blob Storage Account Key
**File**: `api/local.settings.json`  
**Variable**: `BLOB_STORAGE_CONNECTION_STRING`

**How to get it**:
```bash
# Azure Portal
Go to: Storage Accounts → proptiir11a → Access Keys → key1 → Connection String

# Azure CLI
az storage account show-connection-string \
  --name proptiir11a \
  --resource-group <your-resource-group>
```

**Current placeholder**:
```
DefaultEndpointsProtocol=https;AccountName=proptiir11a;AccountKey=<your-storage-account-key>;EndpointSuffix=core.windows.net
```

**Replace**: `<your-storage-account-key>` with the actual key

---

## 🟡 Optional (System works without these)

### 2. Application Insights Instrumentation Key
**File**: `api/local.settings.json`  
**Variable**: `APPINSIGHTS_INSTRUMENTATIONKEY`

**How to get it**:
```bash
# Azure Portal
Go to: Application Insights → Properties → Instrumentation Key

# Azure CLI
az monitor app-insights component show \
  --app <your-app-insights-name> \
  --resource-group <your-resource-group> \
  --query instrumentationKey
```

**Current placeholder**: `<your-app-insights-key>`

**Impact if missing**: Monitoring/telemetry won't work, but messaging will function normally.

---

### 3. DocuSign Credentials
**File**: `api/local.settings.json`  
**Variables**: 
- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_USER_ID`
- `DOCUSIGN_ACCOUNT_ID`
- `DOCUSIGN_RSA_PRIVATE_KEY`

**How to get them**:
1. Go to DocuSign Developer Portal: https://developers.docusign.com/
2. Create an app or use existing app
3. Get Integration Key (Client ID)
4. Get User ID from your account settings
5. Get Account ID from your account settings
6. Generate RSA key pair and upload public key to DocuSign

**Current placeholders**: `<your-docusign-...>`

**Impact if missing**: Contract signing features won't work, but messaging is unaffected.

---

## ✅ Already Configured (No Action Needed)

These are already filled in from your existing `.env`:

- ✅ `COSMOS_DB_CONNECTION_STRING`
- ✅ `COSMOS_DB_KEY`
- ✅ `COSMOS_DB_DATABASE_NAME`
- ✅ `AZURE_AD_B2C_*` (all B2C auth variables)
- ✅ `EMAIL_FROM_ADDRESS`
- ✅ `SMTP_*` (Gmail SMTP credentials)
- ✅ `RESEND_API_KEY`

---

## 🎯 Priority Action Items

### Immediate (to get messaging working):

1. **Get Blob Storage key** (5 minutes)
   ```bash
   az storage account show-connection-string \
     --name proptiir11a \
     --resource-group <your-resource-group>
   ```
   Copy the entire connection string and replace the placeholder in `api/local.settings.json`

2. **Create Cosmos DB containers** (10 minutes)
   - See `MESSAGING_SETUP_GUIDE.md` Step 1
   - Use Azure Portal or the provided CLI commands

3. **Create Blob Storage container** (2 minutes)
   ```bash
   az storage container create \
     --name message-attachments \
     --account-name proptiir11a \
     --public-access off
   ```

4. **Fix email transport** (5 minutes)
   - See `MESSAGING_SETUP_GUIDE.md` Step 3
   - Update `NotificationService.ts` to use Resend or SMTP

### Later (optional enhancements):

5. **Get Application Insights key** (for monitoring)
6. **Configure DocuSign** (for contract signing)

---

## 📂 File Locations Summary

| File | Purpose | Status |
|---|---|---|
| `api/.env` | Backend env vars (documented) | ✅ Created |
| `api/local.settings.json` | Azure Functions config | ✅ Created |
| `.env` | Frontend env vars | ✅ Updated |
| `MESSAGING_SETUP_GUIDE.md` | Complete setup guide | ✅ Created |
| `MISSING_ENV_VALUES.md` | This file | ✅ Created |

---

## 🔗 Quick Links

- **Setup Guide**: `MESSAGING_SETUP_GUIDE.md`
- **Backend Config**: `api/local.settings.json`
- **Frontend Config**: `.env`
- **Requirements**: `.kiro/specs/proptii-communication/requirements.md`
- **Design**: `.kiro/specs/proptii-communication/design.md`
