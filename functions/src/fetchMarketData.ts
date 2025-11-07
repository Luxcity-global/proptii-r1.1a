/**
 * Firebase Cloud Function to fetch UK market data
 * 
 * This function fetches real data from:
 * - ONS API: Rental price indices and housing statistics
 * - GOV.UK RSS Feed: Regulatory changes, EPC requirements, landlord regulations
 * 
 * Install dependencies: npm install node-fetch xml2js
 * 
 * To deploy:
 * firebase deploy --only functions:fetchUKMarketData
 * 
 * To set ONS API key:
 * firebase functions:config:set ons.api_key="YOUR_API_KEY"
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const db = admin.firestore();

interface ONSObservation {
  observation?: string[];
  time?: string[];
  '@attributes'?: {
    'DatasetID'?: string;
    'cdid'?: string;
    'v4_1'?: string;
  };
}

interface ONSDataResponse {
  observations?: ONSObservation[];
  dataset?: {
    id?: string;
    dimension?: any;
  };
}

interface GOVUKFeedEntry {
  title?: string[];
  summary?: string[];
  link?: Array<{ $?: { href?: string } }> | { $?: { href?: string } };
  published?: string[];
  updated?: string[];
  id?: string[];
}

interface GOVUKFeed {
  feed?: {
    entry?: GOVUKFeedEntry[];
    title?: string[];
    updated?: string[];
  };
}

interface MarketInsight {
  type: 'rental-demand' | 'epc-requirements' | 'regulatory-change';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  date: admin.firestore.Timestamp;
  area?: string;
  region?: string;
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  source: string;
  link?: string;
  effectiveDate?: admin.firestore.Timestamp;
  expiryDate: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  dismissedBy: string[];
}

/**
 * Fetch rental price data from ONS API
 * 
 * ONS API Documentation: https://developer.ons.gov.uk/
 * 
 * To find the correct dataset ID:
 * 1. Visit https://developer.ons.gov.uk/dataset
 * 2. Search for "Index of Private Housing Rental Prices"
 * 3. Use the dataset ID from the URL or API explorer
 */
async function fetchRentalData(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    const ONS_API_KEY = functions.config().ons?.api_key;
    
    if (!ONS_API_KEY) {
      console.warn('⚠️ ONS API key not configured. Skipping rental data fetch.');
      console.warn('   To configure: firebase functions:config:set ons.api_key="YOUR_KEY"');
      return insights;
    }
    
    // ONS API endpoint structure:
    // https://api.ons.gov.uk/dataset/{datasetId}/editions/{edition}/versions/{version}/observations
    // 
    // Example dataset ID for Index of Private Housing Rental Prices: "D7G7"
    // You'll need to find the exact dataset ID from ONS API explorer
    const datasetId = functions.config().ons?.dataset_id || 'D7G7'; // Default example
    const edition = 'time-series'; // Usually 'time-series' for time series data
    const version = '1'; // Version number
    
    const apiUrl = `https://api.ons.gov.uk/dataset/${datasetId}/editions/${edition}/versions/${version}/observations?apikey=${ONS_API_KEY}`;
    
    console.log(`📊 Fetching ONS rental data from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ONS API error (${response.status}): ${errorText}`);
      throw new Error(`ONS API error: ${response.statusText}`);
    }
    
    const data = await response.json() as ONSDataResponse;
    
    if (data.observations && data.observations.length > 0) {
      // Parse observations - ONS returns observations with time and value
      const observations = data.observations
        .map(obs => ({
          date: obs.time?.[0] || '',
          value: parseFloat(obs.observation?.[0] || '0'),
          region: obs['@attributes']?.cdid || 'UK'
        }))
        .filter(obs => obs.value > 0 && obs.date)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      if (observations.length >= 24) {
        // Calculate year-over-year change
        const recent = observations.slice(-12); // Last 12 months
        const previous = observations.slice(-24, -12); // Previous 12 months
        
        const recentAvg = recent.reduce((sum, obs) => sum + obs.value, 0) / recent.length;
        const previousAvg = previous.reduce((sum, obs) => sum + obs.value, 0) / previous.length;
        
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        // Only create insight if change is significant (more than 3%)
        if (Math.abs(changePercent) > 3) {
          const now = admin.firestore.Timestamp.now();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          // Determine region from data (or use UK-wide)
          const region = observations[observations.length - 1]?.region || 'UK';
          const regionName = region === 'K02000001' ? 'UK' : region; // K02000001 is ONS code for UK
          
          // Check if we already have a recent insight for this type
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const existing = await db.collection('marketInsights')
            .where('type', '==', 'rental-demand')
            .where('createdAt', '>', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .limit(1)
            .get();
          
          if (existing.empty) {
            insights.push({
              type: 'rental-demand',
              title: `Rental prices ${changePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(changePercent).toFixed(1)}% year-over-year`,
              description: `${changePercent > 0 ? 'Strong market growth' : 'Market decline'} detected. ${changePercent > 0 ? 'Consider reviewing rent prices' : 'Review your pricing strategy'}.`,
              severity: Math.abs(changePercent) > 10 ? 'high' : Math.abs(changePercent) > 5 ? 'medium' : 'low',
              actionRequired: Math.abs(changePercent) > 10,
              date: now,
              region: regionName,
              area: regionName,
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
            
            console.log(`✅ Created rental demand insight: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`);
          } else {
            console.log('ℹ️ Recent rental demand insight already exists, skipping');
          }
        }
      }
    } else {
      console.warn('⚠️ No observations found in ONS response');
    }
  } catch (error: any) {
    console.error('❌ Error fetching rental data from ONS:', error);
    console.error('   Error details:', error.message);
  }
  
  return insights;
}

/**
 * Fetch regulatory changes from GOV.UK RSS feed
 * 
 * This includes:
 * - EPC requirements
 * - Landlord regulations
 * - Housing policy changes
 * 
 * No API key required - publicly accessible RSS feed
 */
async function fetchRegulatoryChanges(): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];
  
  try {
    const RSS_URL = 'https://www.gov.uk/government/announcements.atom';
    console.log(`📰 Fetching GOV.UK announcements from: ${RSS_URL}`);
    
    const response = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Proptii Market Insights Bot)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GOV.UK RSS error: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    if (!xmlText || xmlText.length < 100) {
      throw new Error('GOV.UK RSS feed returned empty or invalid content');
    }
    
    console.log(`📥 Received ${xmlText.length} bytes from GOV.UK RSS feed`);
    
    const result = await parseStringPromise(xmlText, {
      explicitArray: true,
      mergeAttrs: false
    }) as GOVUKFeed;
    
    const entries = result.feed?.entry || [];
    console.log(`📋 Parsed ${entries.length} total announcements from GOV.UK`);
    
    const now = admin.firestore.Timestamp.now();
    
    // Keywords to identify relevant landlord/rental property announcements
    const relevantKeywords = [
      'epc', 'energy performance', 'energy efficiency',
      'landlord', 'private rented', 'rental', 'rent',
      'housing', 'property', 'tenancy', 'tenant',
      'regulation', 'legislation', 'compliance',
      'deposit', 'eviction', 'right to rent'
    ];
    
    // Filter for relevant announcements
    const relevantEntries = entries.filter((entry: GOVUKFeedEntry) => {
      const title = entry.title?.[0]?.toLowerCase() || '';
      const summary = entry.summary?.[0]?.toLowerCase() || '';
      const text = `${title} ${summary}`;
      
      return relevantKeywords.some(keyword => text.includes(keyword));
    });
    
    console.log(`✅ Found ${relevantEntries.length} relevant announcements out of ${entries.length} total`);
    
    // Process each relevant announcement (limit to 10 most recent to avoid duplicates)
    for (const entry of relevantEntries.slice(0, 10)) {
      const title = entry.title?.[0] || 'Government Announcement';
      const summary = entry.summary?.[0] || '';
      
      // Extract link - GOV.UK RSS uses different structures
      let link = '';
      if (entry.link) {
        if (Array.isArray(entry.link)) {
          const firstLink = entry.link[0];
          if (firstLink && typeof firstLink === 'object' && '$' in firstLink) {
            link = firstLink.$?.href || '';
          }
        } else if (typeof entry.link === 'object' && '$' in entry.link) {
          link = entry.link.$?.href || '';
        }
      }
      
      // Fallback link if not found
      if (!link && entry.id?.[0]) {
        link = entry.id[0];
      }
      if (!link) {
        link = 'https://www.gov.uk/government/announcements';
      }
      
      const published = entry.published?.[0] || entry.updated?.[0];
      
      // Determine insight type based on content
      const titleLower = title.toLowerCase();
      const summaryLower = summary.toLowerCase();
      const combinedText = `${titleLower} ${summaryLower}`;
      
      let insightType: 'epc-requirements' | 'regulatory-change' = 'regulatory-change';
      
      if (combinedText.includes('epc') || 
          combinedText.includes('energy performance') || 
          combinedText.includes('energy efficiency') ||
          combinedText.includes('minimum energy')) {
        insightType = 'epc-requirements';
      }
      
      // Check if we already have this insight (by exact title match)
      const existing = await db.collection('marketInsights')
        .where('type', '==', insightType)
        .where('title', '==', title)
        .where('expiryDate', '>', now)
        .limit(1)
        .get();
      
      if (existing.empty) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90); // Regulatory changes stay relevant for 90 days
        
        let publishedDate: Date;
        try {
          publishedDate = published ? new Date(published) : new Date();
          // Validate date
          if (isNaN(publishedDate.getTime())) {
            publishedDate = new Date();
          }
        } catch {
          publishedDate = new Date();
        }
        
        // Clean up summary - remove HTML tags and limit length
        const cleanSummary = summary
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 300); // Limit to 300 characters
        
        insights.push({
          type: insightType,
          title: title,
          description: cleanSummary || 'Review the latest government announcement for details.',
          severity: insightType === 'epc-requirements' ? 'high' : 'medium',
          actionRequired: insightType === 'epc-requirements',
          date: now,
          region: 'UK',
          source: 'GOV.UK',
          link: link,
          effectiveDate: admin.firestore.Timestamp.fromDate(publishedDate),
          expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
          createdAt: now,
          updatedAt: now,
          dismissedBy: []
        });
        
        console.log(`✅ Created ${insightType} insight: "${title.substring(0, 60)}..."`);
      } else {
        console.log(`⏭️  Insight already exists: "${title.substring(0, 60)}..."`);
      }
    }
    
    console.log(`✅ Created ${insights.length} new regulatory insights from GOV.UK`);
  } catch (error: any) {
    console.error('❌ Error fetching regulatory changes from GOV.UK:', error);
    console.error('   Error details:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    // Don't throw - allow function to continue even if GOV.UK fails
    // (though in production you might want to throw)
  }
  
  return insights;
}

// NOTE: Property values from Land Registry will be implemented later
// Land Registry data requires CSV processing and is more complex
// This is intentionally left for future implementation

/**
 * Main Cloud Function
 */
export const fetchUKMarketData = functions.pubsub
  .schedule('0 9 * * 1') // Every Monday at 9 AM
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('🔄 Starting UK market data fetch...');
    
    try {
      // Fetch all types of insights
      // Note: Property values skipped for now (Land Registry CSV processing)
      // ONS is optional - continue even if it fails
      const [rentalInsights, regulatoryInsights] = await Promise.allSettled([
        fetchRentalData(),
        fetchRegulatoryChanges()
      ]);
      
      // Extract successful results
      const rentalResults = rentalInsights.status === 'fulfilled' ? rentalInsights.value : [];
      const regulatoryResults = regulatoryInsights.status === 'fulfilled' ? regulatoryInsights.value : [];
      
      if (rentalInsights.status === 'rejected') {
        console.warn('⚠️ ONS data fetch failed, continuing with GOV.UK data:', rentalInsights.reason);
      }
      if (regulatoryInsights.status === 'rejected') {
        console.error('❌ GOV.UK data fetch failed:', regulatoryInsights.reason);
      }
      
      const allInsights = [...rentalResults, ...regulatoryResults];
      
      // Save to Firestore
      const batch = db.batch();
      for (const insight of allInsights) {
        const docRef = db.collection('marketInsights').doc();
        batch.set(docRef, insight);
      }
      
      await batch.commit();
      
      console.log(`✅ Created ${allInsights.length} market insights`);
      return null;
    } catch (error) {
      console.error('❌ Error in fetchUKMarketData:', error);
      throw error;
    }
  });

/**
 * Manual trigger function (for testing)
 */
export const fetchUKMarketDataManual = functions.https.onRequest(async (req, res) => {
  console.log('🔄 Manual trigger: Starting UK market data fetch...');
  
  try {
      // Fetch insights - ONS is optional, GOV.UK is required
      const [rentalInsights, regulatoryInsights] = await Promise.allSettled([
        fetchRentalData(),
        fetchRegulatoryChanges()
      ]);
      
      // Extract successful results
      const rentalResults = rentalInsights.status === 'fulfilled' ? rentalInsights.value : [];
      const regulatoryResults = regulatoryInsights.status === 'fulfilled' ? regulatoryInsights.value : [];
      
      if (rentalInsights.status === 'rejected') {
        console.warn('⚠️ ONS data fetch failed, continuing with GOV.UK data:', rentalInsights.reason);
      }
      if (regulatoryInsights.status === 'rejected') {
        console.error('❌ GOV.UK data fetch failed:', regulatoryInsights.reason);
        // GOV.UK is critical, so we should still return an error response
        res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch GOV.UK data',
          rentalInsights: rentalResults.length,
          regulatoryInsights: 0
        });
        return;
      }
      
      const allInsights = [...rentalResults, ...regulatoryResults];
    
      const batch = db.batch();
      for (const insight of allInsights) {
        const docRef = db.collection('marketInsights').doc();
        batch.set(docRef, insight);
      }
      
      await batch.commit();
      
      res.json({ 
        success: true, 
        insightsCreated: allInsights.length,
        insights: allInsights.map(i => ({ type: i.type, title: i.title }))
      });
    } catch (error: any) {
      console.error('❌ Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

