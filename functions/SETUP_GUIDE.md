# UK Market Data Setup Guide

This guide walks you through setting up real UK market data from ONS and GOV.UK.

## 📋 Prerequisites

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Firebase project initialized**: `firebase init`
3. **Node.js 18+**: Required for Cloud Functions

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

This installs:
- `node-fetch` - For API calls
- `xml2js` - For parsing GOV.UK RSS feeds
- `firebase-admin` & `firebase-functions` - Firebase SDK

### Step 2: Get ONS API Key (For Rental Data)

1. **Visit**: https://developer.ons.gov.uk/
2. **Sign up** for a free account
3. **Generate an API key** from your dashboard
4. **Find the Dataset ID**:
   - Browse https://developer.ons.gov.uk/dataset
   - Search for "Index of Private Housing Rental Prices"
   - Note the Dataset ID (e.g., "D7G7" or similar)

### Step 3: Configure Firebase Functions

Set your ONS API key:

```bash
firebase functions:config:set ons.api_key="YOUR_ONS_API_KEY_HERE"
```

(Optional) Set custom dataset ID if different from default:

```bash
firebase functions:config:set ons.dataset_id="YOUR_DATASET_ID"
```

### Step 4: Build and Deploy

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

This deploys:
- `fetchUKMarketData` - Scheduled function (runs every Monday at 9 AM)
- `fetchUKMarketDataManual` - Manual trigger for testing

### Step 5: Test the Function

**Option A: Manual HTTP Trigger**

After deployment, Firebase will provide a URL like:
```
https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fetchUKMarketDataManual
```

Visit this URL in your browser or use curl:
```bash
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fetchUKMarketDataManual
```

**Option B: Local Testing**

```bash
cd functions
npm run serve
# Then visit http://localhost:5001/YOUR-PROJECT/us-central1/fetchUKMarketDataManual
```

### Step 6: Verify Data in Firestore

1. Go to Firebase Console → Firestore
2. Check the `marketInsights` collection
3. You should see documents with:
   - `type: "rental-demand"` (from ONS)
   - `type: "epc-requirements"` (from GOV.UK)
   - `type: "regulatory-change"` (from GOV.UK)

---

## 🔍 What Gets Fetched

### From ONS API:
- **Rental Price Indices**: Year-over-year percentage changes
- **Frequency**: Monthly data, calculated when function runs
- **Insight Created**: When change > 3% year-over-year

### From GOV.UK RSS Feed:
- **Regulatory Changes**: EPC requirements, landlord regulations, housing policy
- **Frequency**: Real-time from RSS feed
- **Insights Created**: For any announcement matching keywords:
  - EPC, energy performance, energy efficiency
  - Landlord, private rented, rental
  - Housing, property, tenancy
  - Regulation, legislation, compliance

---

## 📊 Expected Results

After successful deployment, you should see:

1. **In Cloud Function Logs**:
   ```
   📊 Fetching ONS rental data from: ...
   ✅ Created rental demand insight: +5.2%
   📰 Fetching GOV.UK announcements from: ...
   📋 Found 3 relevant announcements out of 50 total
   ✅ Created epc-requirements insight: ...
   ✅ Created regulatory-change insight: ...
   ```

2. **In Firestore `marketInsights` collection**:
   - Documents with real data from ONS and GOV.UK
   - Each with proper structure, links, and expiry dates

3. **In Your Dashboard**:
   - Market Insights cards showing real UK data
   - Updates automatically when new insights are created

---

## 🛠️ Troubleshooting

### ONS API Not Working

**Error**: `⚠️ ONS API key not configured`

**Solution**: 
```bash
firebase functions:config:set ons.api_key="YOUR_KEY"
firebase deploy --only functions
```

**Error**: `❌ ONS API error: 404`

**Solution**: 
- Check the dataset ID is correct
- Visit https://developer.ons.gov.uk/dataset to find the correct ID
- Update: `firebase functions:config:set ons.dataset_id="CORRECT_ID"`

### GOV.UK RSS Not Working

**Error**: `❌ Error fetching regulatory changes from GOV.UK`

**Solution**:
- Check internet connectivity
- Verify RSS URL is accessible: https://www.gov.uk/government/announcements.atom
- Check Cloud Function logs for detailed error

### No Insights Created

**Possible Reasons**:
1. **ONS**: No significant change detected (< 3% threshold)
2. **GOV.UK**: No relevant announcements found
3. **Already exists**: Insights already created within expiry period

**Solution**: Check Cloud Function logs for detailed messages

---

## 🔄 Scheduled Updates

The function runs automatically:
- **Schedule**: Every Monday at 9 AM (UK time)
- **Frequency**: Weekly (can be changed in `fetchMarketData.ts`)

To change schedule:
```typescript
// In fetchMarketData.ts, modify:
.schedule('0 9 * * 1') // Current: Monday 9 AM
// Options:
// '0 9 * * *' - Every day at 9 AM
// '0 9 * * 0' - Every Sunday at 9 AM
// '0 9 1 * *' - First day of month at 9 AM
```

---

## 📝 Next Steps

Once basic setup works:
1. ✅ Test with manual trigger
2. ✅ Verify data appears in Firestore
3. ✅ Check Dashboard shows real insights
4. ✅ Monitor scheduled runs
5. 🔜 Add Land Registry data (when ready)

---

## 📚 Additional Resources

- **ONS API Documentation**: https://developer.ons.gov.uk/api-guide
- **GOV.UK Announcements**: https://www.gov.uk/government/announcements
- **Firebase Functions Docs**: https://firebase.google.com/docs/functions











