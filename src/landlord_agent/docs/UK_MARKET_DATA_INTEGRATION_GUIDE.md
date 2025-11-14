# UK Market Data Integration Guide

This guide shows you how to integrate **real UK rental market data** into your Market Insights cards.

## 📊 Available UK Data Sources

### 1. **Office for National Statistics (ONS)** - FREE
- **What it provides**: Rental price indices, housing statistics
- **API**: Yes (requires API key, free)
- **Update frequency**: Monthly
- **URL**: https://developer.ons.gov.uk/
- **Best for**: Rental demand trends, price changes

### 2. **GOV.UK** - FREE
- **What it provides**: Regulatory changes, EPC requirements, landlord regulations
- **API**: No (RSS feeds available)
- **Update frequency**: As announced
- **URL**: https://www.gov.uk/government/announcements
- **Best for**: EPC requirements, regulatory changes

### 3. **Land Registry** - FREE
- **What it provides**: Property sale prices, transaction data
- **API**: No (CSV downloads)
- **Update frequency**: Monthly
- **URL**: https://www.gov.uk/government/statistical-data-sets/price-paid-data
- **Best for**: Property value trends

### 4. **Rightmove/Zoopla** - PAID (Commercial)
- **What it provides**: Rental market reports, demand indicators
- **API**: Commercial (requires business account)
- **Update frequency**: Weekly/Monthly
- **Best for**: Granular local market data

---

## 🚀 Implementation Steps

### Step 1: Set Up ONS API Access

1. **Register for ONS API Key**:
   - Go to https://developer.ons.gov.uk/
   - Sign up for a free account
   - Generate an API key
   - Note your API key

2. **Find Relevant Datasets**:
   - Browse https://developer.ons.gov.uk/dataset
   - Key datasets:
     - **Index of Private Housing Rental Prices** (Dataset ID: `private-rental-prices`)
     - **House Price Index** (Dataset ID: `house-price-index`)

### Step 2: Update Cloud Function with Real ONS Data

Update `functions/src/fetchMarketData.ts`:

```typescript
async function fetchRentalData(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    const ONS_API_KEY = functions.config().ons?.api_key;
    if (!ONS_API_KEY) {
      console.warn('⚠️ ONS API key not configured');
      return insights;
    }
    
    // ONS API endpoint for private rental prices
    // Dataset ID: DSD001 (example - use actual ID from ONS explorer)
    const response = await fetch(
      `https://api.ons.gov.uk/dataset/private-rental-prices/editions/time-series/versions/1/data?apikey=${ONS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`ONS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process ONS data structure
    // ONS returns: { observations: [{ date, value, region }] }
    if (data.observations && data.observations.length > 0) {
      const observations = data.observations;
      const recent = observations.slice(-12); // Last 12 months
      const previous = observations.slice(-24, -12); // Previous 12 months
      
      const recentAvg = recent.reduce((sum: number, obs: any) => 
        sum + parseFloat(obs.value || 0), 0) / recent.length;
      const previousAvg = previous.reduce((sum: number, obs: any) => 
        sum + parseFloat(obs.value || 0), 0) / previous.length;
      
      const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      if (Math.abs(changePercent) > 3) { // Only create insight if significant change
        const now = admin.firestore.Timestamp.now();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        // Determine region from data (e.g., "London", "East of England")
        const region = observations[observations.length - 1]?.region || 'UK';
        
        insights.push({
          type: 'rental-demand',
          title: `Rental ${changePercent > 0 ? 'demand increased' : 'demand decreased'} ${Math.abs(changePercent).toFixed(1)}% in ${region}`,
          description: `${region} properties showing ${changePercent > 0 ? 'strong growth' : 'decline'}. Consider reviewing rent prices.`,
          severity: Math.abs(changePercent) > 10 ? 'high' : Math.abs(changePercent) > 5 ? 'medium' : 'low',
          actionRequired: Math.abs(changePercent) > 10,
          date: now,
          region: region,
          area: region,
          value: Math.abs(changePercent),
          unit: '%',
          trend: changePercent > 0 ? 'up' : 'down',
          source: 'ONS',
          link: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/indexofprivatehousingrentalprices/',
          expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
          createdAt: now,
          updatedAt: now,
          dismissedBy: []
        });
      }
    }
  } catch (error) {
    console.error('Error fetching rental data from ONS:', error);
  }
  
  return insights;
}
```

### Step 3: Fetch EPC Requirements from GOV.UK

For EPC requirements, you can:
- **Option A**: Monitor GOV.UK RSS feed for announcements
- **Option B**: Use web scraping (with caution)
- **Option C**: Manual updates (simplest for now)

```typescript
async function fetchEPCRequirements(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    // Option 1: Parse GOV.UK RSS feed
    const RSS_URL = 'https://www.gov.uk/government/announcements.atom';
    const response = await fetch(RSS_URL);
    const xml = await response.text();
    
    // Parse XML (use xml2js library)
    const parser = require('xml2js');
    const result = await parser.parseStringPromise(xml);
    
    // Look for EPC-related announcements
    const entries = result.feed?.entry || [];
    const epcEntries = entries.filter((entry: any) => 
      entry.title?.[0]?.toLowerCase().includes('epc') ||
      entry.title?.[0]?.toLowerCase().includes('energy performance') ||
      entry.title?.[0]?.toLowerCase().includes('energy efficiency')
    );
    
    if (epcEntries.length > 0) {
      const latest = epcEntries[0];
      const now = admin.firestore.Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      
      insights.push({
        type: 'epc-requirements',
        title: latest.title[0],
        description: latest.summary?.[0] || 'Review your compliance status.',
        severity: 'high',
        actionRequired: true,
        date: now,
        region: 'UK',
        source: 'GOV.UK',
        link: latest.link?.[0]?.$.href || 'https://www.gov.uk/guidance/domestic-private-rented-property-minimum-energy-efficiency-standard-landlord-guidance',
        effectiveDate: latest.published?.[0] ? admin.firestore.Timestamp.fromDate(new Date(latest.published[0])) : now,
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

### Step 4: Calculate Property Values from Land Registry

Land Registry data is available as CSV. For production, you'd download and process monthly:

```typescript
async function fetchPropertyValues(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    // Download Land Registry CSV (monthly)
    // URL: https://www.gov.uk/government/statistical-data-sets/price-paid-data
    const CSV_URL = 'https://landregistry.data.gov.uk/app/ppd/ppd_data.csv';
    
    // Note: This is a large file. In production, use a Cloud Storage bucket
    // and process incrementally
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV (use csv-parser library)
    const csv = require('csv-parser');
    const rows: any[] = [];
    
    // Process CSV rows
    // Calculate average price change by region
    // This is simplified - production would need proper aggregation
    
    const now = admin.firestore.Timestamp.now();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Example: Calculate portfolio value change
    // In production, compare current quarter vs previous quarter
    const portfolioValueChange = 8.5; // Calculate from actual data
    
    insights.push({
      type: 'property-values',
      title: `Property values up ${portfolioValueChange}% this quarter`,
      description: 'Your portfolio value has increased significantly. Great time to review insurance coverage.',
      severity: 'low',
      actionRequired: false,
      date: now,
      region: 'UK',
      value: portfolioValueChange,
      unit: '%',
      trend: 'up',
      source: 'Land Registry',
      link: 'https://www.gov.uk/government/statistical-data-sets/price-paid-data',
      expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
      createdAt: now,
      updatedAt: now,
      dismissedBy: []
    });
  } catch (error) {
    console.error('Error fetching property values:', error);
  }
  
  return insights;
}
```

---

## 🔧 Setup Instructions

### 1. Install Required Dependencies

In your `functions` directory:

```bash
cd functions
npm install node-fetch xml2js csv-parser
npm install --save-dev @types/node-fetch @types/xml2js
```

### 2. Configure ONS API Key

Set the API key in Firebase Functions config:

```bash
firebase functions:config:set ons.api_key="YOUR_ONS_API_KEY"
```

### 3. Deploy Cloud Function

```bash
firebase deploy --only functions:fetchUKMarketData
```

### 4. Test the Function

Manually trigger the function:

```bash
# Get the function URL from Firebase Console
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fetchUKMarketDataManual
```

Or test locally:

```bash
firebase emulators:start --only functions
```

---

## 📝 Alternative: Use Third-Party APIs (Paid)

If you want more granular data, consider:

### Rightmove/Zoopla Commercial APIs
- **Rightmove**: Contact for commercial API access
- **Zoopla**: https://developer.zoopla.co.uk/ (requires business account)
- **Cost**: Usually £500-2000/month for API access

### Property Data Providers
- **Hometrack**: Comprehensive market data
- **TwentyEA**: Property market analytics
- **Cost**: Typically £500-5000/month depending on data volume

---

## 🎯 Recommended Implementation Priority

1. **Start with EPC Requirements** (Easiest)
   - Use GOV.UK RSS feed or manual updates
   - Low maintenance, high value

2. **Add ONS Rental Data** (Medium difficulty)
   - Requires API key setup
   - Monthly updates
   - Provides real rental trends

3. **Add Property Values** (Hardest)
   - Requires CSV processing
   - Large data files
   - Monthly processing recommended

---

## 🔄 Real-Time Updates

The existing infrastructure already supports real-time updates:

1. **Cloud Function** runs on schedule (weekly recommended)
2. **Frontend** listens to Firestore `marketInsights` collection
3. **UI updates automatically** when new insights are added

---

## 🧪 Testing

1. **Manual Test**: Call `fetchUKMarketDataManual` function
2. **Check Firestore**: Verify `marketInsights` collection has documents
3. **Check Dashboard**: Refresh app and verify cards show real data
4. **Monitor Logs**: Check Cloud Function logs for errors

---

## 📚 Additional Resources

- **ONS API Documentation**: https://developer.ons.gov.uk/api-guide
- **GOV.UK RSS Feeds**: https://www.gov.uk/government/announcements.atom
- **Land Registry Data**: https://www.gov.uk/government/statistical-data-sets/price-paid-data
- **EPC Regulations**: https://www.gov.uk/guidance/domestic-private-rented-property-minimum-energy-efficiency-standard-landlord-guidance

---

## ⚠️ Important Notes

1. **Rate Limits**: ONS API has rate limits. Implement caching if needed.
2. **Data Freshness**: Some data updates monthly. Set realistic expectations.
3. **Error Handling**: Always handle API failures gracefully.
4. **Costs**: Free APIs are rate-limited. Monitor usage.
5. **Legal**: Ensure compliance with terms of service for all APIs.










