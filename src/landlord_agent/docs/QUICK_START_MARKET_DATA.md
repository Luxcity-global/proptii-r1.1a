# Quick Start: Real UK Market Data

## 🚀 Fastest Path to Real Data

### Option 1: Start with EPC Requirements (Easiest - 5 minutes)

This requires no API keys and provides high-value regulatory information.

1. **Update the Cloud Function** (`functions/src/fetchMarketData.ts`):

```typescript
async function fetchEPCRequirements(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    const now = admin.firestore.Timestamp.now();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);
    
    // Check if we already have an active EPC insight
    const existing = await db.collection('marketInsights')
      .where('type', '==', 'epc-requirements')
      .where('expiryDate', '>', now)
      .limit(1)
      .get();
    
    if (existing.empty) {
      // Create EPC requirement insight with current real information
      insights.push({
        type: 'epc-requirements',
        title: 'New EPC requirements: Minimum Grade C by 2025',
        description: 'From April 2025, all rental properties must achieve minimum EPC grade C. Review your properties now to avoid penalties.',
        severity: 'high',
        actionRequired: true,
        date: now,
        region: 'UK',
        source: 'GOV.UK',
        link: 'https://www.gov.uk/guidance/domestic-private-rented-property-minimum-energy-efficiency-standard-landlord-guidance',
        effectiveDate: admin.firestore.Timestamp.fromDate(new Date('2025-04-01')),
        expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
        createdAt: now,
        updatedAt: now,
        dismissedBy: []
      });
    }
  } catch (error) {
    console.error('Error fetching EPC requirements:', error);
  }
  
  return insights;
}
```

2. **Deploy and test**:
```bash
cd functions
npm install
firebase deploy --only functions:fetchUKMarketDataManual
```

3. **Trigger manually**:
Visit: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fetchUKMarketDataManual`

---

### Option 2: Add ONS Rental Data (15 minutes)

1. **Get ONS API Key**:
   - Visit: https://developer.ons.gov.uk/
   - Sign up (free)
   - Generate API key
   - Copy the key

2. **Set Firebase Config**:
```bash
firebase functions:config:set ons.api_key="YOUR_API_KEY_HERE"
```

3. **Update Cloud Function** with real ONS API call (see full guide)

4. **Deploy**:
```bash
firebase deploy --only functions
```

---

### Option 3: Use Manual Data Entry (For Testing)

Quick way to test with real-looking data:

1. **Go to Firestore Console**
2. **Create a document in `marketInsights` collection**:

```json
{
  "type": "rental-demand",
  "title": "Rental demand increased 12% in East London",
  "description": "East London properties showing strong growth. Consider reviewing rent prices.",
  "severity": "medium",
  "actionRequired": false,
  "date": "2024-11-04T00:00:00Z",
  "region": "East London",
  "value": 12,
  "unit": "%",
  "trend": "up",
  "source": "ONS",
  "link": "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/indexofprivatehousingrentalprices/",
  "expiryDate": "2024-12-04T00:00:00Z",
  "createdAt": "2024-11-04T00:00:00Z",
  "updatedAt": "2024-11-04T00:00:00Z",
  "dismissedBy": []
}
```

3. **Refresh your app** - the card will appear immediately!

---

## ✅ Verify It's Working

1. Check Firestore console: `marketInsights` collection should have documents
2. Check Dashboard: Cards should display (not mock data)
3. Check console logs: Should see "✅ Loaded X market insights from Firestore"

---

## 🔄 Next Steps

Once basic setup works:
1. Add real ONS API integration
2. Add GOV.UK RSS feed parsing
3. Set up scheduled Cloud Function (weekly)
4. Add error handling and retry logic






