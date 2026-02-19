# Quick Start: Real UK Market Insights

## Option 1: Manual Data Entry (Immediate Testing)

To test the Market Insights feature immediately with real-looking data:

1. **Go to Firebase Console** → Firestore Database
2. **Create Collection**: `marketInsights`
3. **Add Documents** with this structure:

```json
{
  "type": "rental-demand",
  "title": "Rental demand increased 12% in East London",
  "description": "East London properties showing strong growth. Consider reviewing rent prices.",
  "severity": "medium",
  "actionRequired": false,
  "date": "2025-11-04T00:00:00Z",
  "area": "East London",
  "region": "London",
  "value": 12,
  "unit": "%",
  "trend": "up",
  "source": "ONS",
  "link": "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/indexofprivatehousingrentalprices/",
  "expiryDate": "2025-12-04T00:00:00Z",
  "createdAt": "2025-11-04T00:00:00Z",
  "updatedAt": "2025-11-04T00:00:00Z",
  "dismissedBy": []
}
```

**Example EPC Insight:**
```json
{
  "type": "epc-requirements",
  "title": "New EPC requirements coming 2025",
  "description": "Properties must achieve minimum grade C by April 2025. Review your compliance status.",
  "severity": "high",
  "actionRequired": true,
  "date": "2025-11-04T00:00:00Z",
  "region": "UK",
  "source": "GOV.UK",
  "link": "https://www.gov.uk/guidance/domestic-private-rented-property-minimum-energy-efficiency-standard-landlord-guidance",
  "effectiveDate": "2025-04-01T00:00:00Z",
  "expiryDate": "2026-01-04T00:00:00Z",
  "createdAt": "2025-11-04T00:00:00Z",
  "updatedAt": "2025-11-04T00:00:00Z",
  "dismissedBy": []
}
```

**Example Property Values Insight:**
```json
{
  "type": "property-values",
  "title": "Property values up 8.5% this quarter",
  "description": "Your portfolio value has increased significantly. Great time to review insurance coverage.",
  "severity": "low",
  "actionRequired": false,
  "date": "2025-11-04T00:00:00Z",
  "region": "UK",
  "value": 8.5,
  "unit": "%",
  "trend": "up",
  "source": "Land Registry",
  "link": "https://www.gov.uk/government/statistical-data-sets/price-paid-data",
  "expiryDate": "2025-12-04T00:00:00Z",
  "createdAt": "2025-11-04T00:00:00Z",
  "updatedAt": "2025-11-04T00:00:00Z",
  "dismissedBy": []
}
```

**Important Fields:**
- `expiryDate`: Must be in the future (insights automatically expire)
- `date`: When the insight was created/relevant
- `severity`: "low", "medium", or "high" (affects card styling)
- `type`: Determines which icon is shown

## Option 2: Automated Data Fetching (Production)

### Step 1: Set up Firebase Cloud Functions

1. Navigate to `functions/` directory
2. Install dependencies:
   ```bash
   npm install firebase-functions firebase-admin node-fetch
   ```

3. **Get ONS API Key** (free):
   - Go to https://developer.ons.gov.uk/
   - Sign up and get your API key
   - Set it in Firebase:
     ```bash
     firebase functions:config:set ons.api_key="YOUR_API_KEY"
     ```

4. **Deploy the function**:
   ```bash
   firebase deploy --only functions:fetchUKMarketData
   ```

### Step 2: Schedule the Function

The function is set to run every Monday at 9 AM UK time. You can trigger it manually for testing:

```bash
# Manual trigger URL (after deployment)
curl https://YOUR_PROJECT.cloudfunctions.net/fetchUKMarketDataManual
```

### Step 3: Verify Data

1. Check Firestore console → `marketInsights` collection
2. You should see insights created automatically
3. Refresh your app - the cards should populate with real data

## Option 3: Use Public APIs (No Cloud Functions)

If you want to fetch data directly from the frontend (not recommended for production, but good for testing):

1. **ONS API** (requires API key):
   - Sign up at https://developer.ons.gov.uk/
   - Add API calls in your frontend code

2. **Land Registry CSV**:
   - Download monthly CSV from https://www.gov.uk/government/statistical-data-sets/price-paid-data
   - Parse and create insights

3. **GOV.UK RSS Feed**:
   - Monitor https://www.gov.uk/government/announcements.atom
   - Filter for housing/landlord-related announcements

## Data Sources Summary

| Source | Data Type | Cost | Update Frequency | API Available |
|--------|-----------|------|------------------|---------------|
| ONS | Rental prices, trends | Free | Monthly | ✅ Yes |
| Land Registry | Property values | Free | Monthly | ❌ CSV only |
| GOV.UK | Regulations, EPC | Free | As published | ❌ RSS/Scraping |
| Rightmove | Market reports | Paid | Weekly | ✅ Commercial |
| Zoopla | Market data | Paid | Weekly | ✅ Commercial |

## Testing Checklist

- [ ] Created `marketInsights` collection in Firestore
- [ ] Added at least 3 test insights manually
- [ ] Verified insights appear in Dashboard
- [ ] Tested dismiss functionality
- [ ] Verified real-time updates work
- [ ] Set up Cloud Function (if using automation)
- [ ] Configured ONS API key (if using automation)

## Next Steps

1. **Start with manual data** to test the UI
2. **Set up Cloud Function** for automated fetching
3. **Add more data sources** as needed
4. **Customize insights** based on user's property locations

