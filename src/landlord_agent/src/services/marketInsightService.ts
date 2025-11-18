import { 
  collection, 
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type MarketInsightType = 'rental-demand' | 'epc-requirements' | 'property-values' | 'regulatory-change' | 'market-trend' | 'price-change';
export type MarketInsightSeverity = 'low' | 'medium' | 'high';

export interface MarketInsight {
  id: string;
  type: MarketInsightType;
  title: string;
  description: string;
  severity: MarketInsightSeverity;
  actionRequired: boolean;
  date: Date;
  area?: string;
  region?: string;
  
  // Type-specific data
  value?: number; // e.g., 12 (for percentage)
  unit?: string; // e.g., '%', '£'
  trend?: 'up' | 'down' | 'stable';
  
  // Metadata
  source?: string; // e.g., 'ONS', 'Rightmove', 'GOV.UK'
  link?: string; // URL for more details
  effectiveDate?: Date; // When the insight becomes effective
  expiryDate?: Date; // When the insight expires (for time-sensitive alerts)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // User-specific
  userId?: string; // If personalized to a user
  dismissedBy?: string[]; // User IDs who dismissed this
}

class MarketInsightService {
  private insightsCollection = collection(db, 'marketInsights');

  /**
   * Get all active market insights (not expired, not dismissed by user)
   */
  async getActiveInsights(userId?: string): Promise<MarketInsight[]> {
    try {
      const now = Timestamp.now();
      const constraints: QueryConstraint[] = [
        where('expiryDate', '>', now), // Only non-expired insights
        orderBy('expiryDate', 'asc'),
        orderBy('severity', 'desc'),
        limit(10) // Limit to most relevant 10
      ];

      // If no index exists, fetch without orderBy
      try {
        const q = query(this.insightsCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        let insights = this.mapInsightDocs(querySnapshot.docs);
        
        // Filter out dismissed insights if userId provided
        if (userId) {
          insights = insights.filter(insight => 
            !insight.dismissedBy?.includes(userId)
          );
        }
        
        return insights;
      } catch (indexError: any) {
        if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
          console.log('ℹ️ Firestore index not configured, using in-memory sort');
          const q = query(this.insightsCollection, where('expiryDate', '>', now));
          const querySnapshot = await getDocs(q);
          let insights = this.mapInsightDocs(querySnapshot.docs);
          
          // Sort in memory
          insights.sort((a, b) => {
            // First by severity (high > medium > low)
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0) return severityDiff;
            
            // Then by date (newest first)
            return b.date.getTime() - a.date.getTime();
          });
          
          // Filter dismissed
          if (userId) {
            insights = insights.filter(insight => 
              !insight.dismissedBy?.includes(userId)
            );
          }
          
          return insights.slice(0, 10);
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Error getting market insights:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for market insights
   */
  subscribeToInsights(
    callback: (insights: MarketInsight[]) => void,
    userId?: string
  ): Unsubscribe {
    const now = Timestamp.now();
    
    try {
      const q = query(
        this.insightsCollection,
        where('expiryDate', '>', now),
        orderBy('expiryDate', 'asc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          let insights = this.mapInsightDocs(snapshot.docs);
          
          // Filter dismissed if userId provided
          if (userId) {
            insights = insights.filter(insight => 
              !insight.dismissedBy?.includes(userId)
            );
          }
          
          // Sort by severity then date
          insights.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0) return severityDiff;
            return b.date.getTime() - a.date.getTime();
          });
          
          callback(insights.slice(0, 10));
        },
        (error) => {
          console.error('Error listening to market insights:', error);
        }
      );
    } catch (error) {
      console.error('Error setting up insights listener:', error);
      // Fallback: return empty unsubscribe function
      return () => {};
    }
  }

  /**
   * Dismiss an insight for a user
   */
  async dismissInsight(insightId: string, userId: string): Promise<void> {
    try {
      const insightRef = doc(this.insightsCollection, insightId);
      const insightSnap = await getDoc(insightRef);
      
      if (insightSnap.exists()) {
        const data = insightSnap.data();
        const dismissedBy = data.dismissedBy || [];
        
        if (!dismissedBy.includes(userId)) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(insightRef, {
            dismissedBy: [...dismissedBy, userId],
            updatedAt: Timestamp.now()
          });
          console.log(`✅ Insight ${insightId} dismissed by user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error dismissing insight:', error);
      throw error;
    }
  }

  /**
   * Fetch regulatory changes from GOV.UK RSS feed and save to Firestore
   * This runs in the browser, so no Cloud Functions needed!
   */
  async fetchGOVUKRegulatoryChanges(): Promise<number> {
    try {
      console.log('📰 Fetching GOV.UK announcements from RSS feed...');
      
      // Use CORS proxy to bypass browser CORS restrictions
      // Alternative proxies: https://api.allorigins.win/raw?url= or https://corsproxy.io/?
      const RSS_URL = 'https://www.gov.uk/government/announcements.atom';
      const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}`;
      
      console.log('📡 Using CORS proxy to fetch RSS feed...');
      const response = await fetch(PROXY_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Proptii Market Insights Bot)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GOV.UK RSS error: ${response.status} ${response.statusText}`);
      }
      
      let xmlText = await response.text();
      
      if (!xmlText || xmlText.length < 100) {
        throw new Error('GOV.UK RSS feed returned empty or invalid content');
      }
      
      console.log(`📥 Received ${xmlText.length} bytes from GOV.UK RSS feed`);
      
      // Check if response is HTML (proxy error page) instead of XML - do this BEFORE parsing
      const isHTML = xmlText.trim().startsWith('<!DOCTYPE') || 
                     xmlText.trim().startsWith('<html') ||
                     xmlText.includes('<html') ||
                     xmlText.includes('<!DOCTYPE');
      
      if (isHTML) {
        console.warn('⚠️ Proxy returned HTML instead of XML, extracting feed from HTML...');
        console.log(`🔍 First 500 chars of response: ${xmlText.substring(0, 500)}`);
        
        // Try multiple extraction patterns - the feed might be in various formats
        let extractedXml: string | null = null;
        
        // Pattern 1: Direct feed tag (Atom feed)
        const feedMatch1 = xmlText.match(/<feed[\s\S]*?<\/feed>/i);
        if (feedMatch1) {
          extractedXml = feedMatch1[0];
          console.log(`✅ Pattern 1: Found feed tag (${extractedXml.length} bytes)`);
        }
        
        // Pattern 2: RSS feed
        if (!extractedXml) {
          const rssMatch = xmlText.match(/<rss[\s\S]*?<\/rss>/i);
          if (rssMatch) {
            extractedXml = rssMatch[0];
            console.log(`✅ Pattern 2: Found RSS tag (${extractedXml.length} bytes)`);
          }
        }
        
        // Pattern 3: XML with declaration followed by feed
        if (!extractedXml) {
          const xmlFeedMatch = xmlText.match(/<\?xml[\s\S]*?<feed[\s\S]*?<\/feed>/i);
          if (xmlFeedMatch) {
            extractedXml = xmlFeedMatch[0];
            console.log(`✅ Pattern 3: Found XML declaration + feed (${extractedXml.length} bytes)`);
          }
        }
        
        // Pattern 4: Look for feed in <pre> tags or <textarea> (common in proxy wrappers)
        if (!extractedXml) {
          const preMatch = xmlText.match(/<(pre|textarea|code)[^>]*>([\s\S]*?)<\/(pre|textarea|code)>/i);
          if (preMatch && preMatch[2]) {
            const innerContent = preMatch[2];
            const innerFeedMatch = innerContent.match(/<feed[\s\S]*?<\/feed>/i) || innerContent.match(/<rss[\s\S]*?<\/rss>/i);
            if (innerFeedMatch) {
              extractedXml = innerFeedMatch[0];
              console.log(`✅ Pattern 4: Found feed in <pre>/<textarea> (${extractedXml.length} bytes)`);
            }
          }
        }
        
        // Pattern 5: Look for CDATA sections
        if (!extractedXml) {
          const cdataMatch = xmlText.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
          if (cdataMatch && cdataMatch[1]) {
            const cdataContent = cdataMatch[1];
            const cdataFeedMatch = cdataContent.match(/<feed[\s\S]*?<\/feed>/i) || cdataContent.match(/<rss[\s\S]*?<\/rss>/i);
            if (cdataFeedMatch) {
              extractedXml = cdataFeedMatch[0];
              console.log(`✅ Pattern 5: Found feed in CDATA (${extractedXml.length} bytes)`);
            }
          }
        }
        
        if (extractedXml) {
          xmlText = extractedXml;
          console.log(`📋 Extracted ${xmlText.length} bytes of XML from HTML`);
        } else {
          // Try alternative proxy
          console.warn('⚠️ Could not extract feed from HTML, trying alternative proxy...');
          try {
            // Try multiple alternative proxies
            const altProxies = [
              `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(RSS_URL)}`,
              `https://cors-anywhere.herokuapp.com/${RSS_URL}`,
              `https://thingproxy.freeboard.io/fetch/${RSS_URL}`
            ];
            
            let altXmlText: string | null = null;
            
            for (const altProxyUrl of altProxies) {
              try {
                console.log(`🔄 Trying alternative proxy: ${altProxyUrl.substring(0, 50)}...`);
                const altResponse = await fetch(altProxyUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Proptii Market Insights Bot)'
                  }
                });
                
                if (altResponse.ok) {
                  altXmlText = await altResponse.text();
                  console.log(`📥 Received ${altXmlText.length} bytes from alternative proxy`);
                  
                  // Check if this is also HTML
                  if (altXmlText.trim().startsWith('<!DOCTYPE') || altXmlText.trim().startsWith('<html') || altXmlText.includes('<html')) {
                    const altFeedMatch = altXmlText.match(/<feed[\s\S]*?<\/feed>/i) || altXmlText.match(/<rss[\s\S]*?<\/rss>/i);
                    if (altFeedMatch) {
                      altXmlText = altFeedMatch[0];
                      console.log(`📋 Extracted ${altXmlText.length} bytes from alternative proxy HTML`);
                    }
                  }
                  
                  // If it's not HTML, it's probably XML
                  if (!altXmlText.includes('<html') && !altXmlText.includes('<!DOCTYPE')) {
                    break; // Success!
                  }
                }
              } catch (proxyError: any) {
                console.warn(`⚠️ Proxy ${altProxyUrl.substring(0, 30)}... failed:`, proxyError.message);
                continue; // Try next proxy
              }
            }
            
            if (altXmlText && !altXmlText.includes('<html') && !altXmlText.includes('<!DOCTYPE')) {
              xmlText = altXmlText;
              console.log(`✅ Alternative proxy succeeded`);
            } else {
              throw new Error('All proxies returned HTML without extractable feed');
            }
          } catch (altError: any) {
            console.error('❌ All alternative proxies failed:', altError.message);
            throw new Error('All CORS proxies failed. The GOV.UK RSS feed may require server-side fetching.');
          }
        }
      }
      
      // Parse XML using DOMParser (built into browser)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        // Try to extract XML from the error message or try again with cleaned text
        console.warn('⚠️ XML parsing error, attempting to fix...');
        
        // Remove any XML declaration and try again
        const cleanedXml = xmlText.replace(/<\?xml[^>]*\?>/i, '').trim();
        const xmlDoc2 = parser.parseFromString(cleanedXml, 'text/xml');
        const parseError2 = xmlDoc2.querySelector('parsererror');
        
        if (!parseError2) {
          console.log('✅ Successfully parsed after cleaning XML');
          return this.processFeedEntries(xmlDoc2, Timestamp.now());
        }
        
        // Try extracting just the feed element
        const feedMatch = xmlText.match(/<feed[\s\S]*?<\/feed>/i);
        if (feedMatch) {
          const extractedXml = feedMatch[0];
          const xmlDoc3 = parser.parseFromString(extractedXml, 'text/xml');
          const parseError3 = xmlDoc3.querySelector('parsererror');
          if (!parseError3) {
            console.log('✅ Successfully parsed extracted feed');
            return this.processFeedEntries(xmlDoc3, Timestamp.now());
          }
        }
        
        throw new Error('Failed to parse XML: ' + parseError.textContent);
      }
      
      // Continue processing with the parsed XML
      return this.processFeedEntries(xmlDoc, Timestamp.now());
    } catch (error: any) {
      console.error('❌ Error fetching regulatory changes from GOV.UK:', error);
      console.error('   Error details:', error.message);
      throw error;
    }
  }

  /**
   * Process feed entries and save insights to Firestore
   */
  private async processFeedEntries(xmlDoc: Document, now: Timestamp): Promise<number> {
    try {
      // Extract entries from Atom feed
      const entries = xmlDoc.querySelectorAll('entry');
      console.log(`📋 Parsed ${entries.length} total announcements from GOV.UK`);
      
      // Keywords to identify relevant landlord/rental property announcements
      const relevantKeywords = [
        'epc', 'energy performance', 'energy efficiency',
        'landlord', 'private rented', 'rental', 'rent',
        'housing', 'property', 'tenancy', 'tenant',
        'regulation', 'legislation', 'compliance',
        'deposit', 'eviction', 'right to rent'
      ];
      
      // Filter for relevant announcements
      const relevantEntries: Element[] = [];
      entries.forEach(entry => {
        const titleEl = entry.querySelector('title');
        const summaryEl = entry.querySelector('summary') || entry.querySelector('content');
        const title = titleEl?.textContent?.toLowerCase() || '';
        const summary = summaryEl?.textContent?.toLowerCase() || '';
        const text = `${title} ${summary}`;
        
        if (relevantKeywords.some(keyword => text.includes(keyword))) {
          relevantEntries.push(entry);
        }
      });
      
      console.log(`✅ Found ${relevantEntries.length} relevant announcements out of ${entries.length} total`);
      
      // Process each relevant announcement (limit to 10 most recent)
      const insightsToSave: any[] = [];
      const batch = writeBatch(db);
      
      for (const entry of Array.from(relevantEntries).slice(0, 10)) {
        const titleEl = entry.querySelector('title');
        const summaryEl = entry.querySelector('summary') || entry.querySelector('content');
        const linkEl = entry.querySelector('link');
        const publishedEl = entry.querySelector('published') || entry.querySelector('updated');
        const idEl = entry.querySelector('id');
        
        const title = titleEl?.textContent || 'Government Announcement';
        const summary = summaryEl?.textContent || '';
        
        // Extract link
        let link = '';
        if (linkEl) {
          link = linkEl.getAttribute('href') || '';
        }
        if (!link && idEl?.textContent) {
          link = idEl.textContent;
        }
        if (!link) {
          link = 'https://www.gov.uk/government/announcements';
        }
        
        const published = publishedEl?.textContent || '';
        
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
        const existingQuery = query(
          this.insightsCollection,
          where('type', '==', insightType),
          where('title', '==', title),
          where('expiryDate', '>', now)
        );
        
        const existingSnap = await getDocs(existingQuery);
        
        if (existingSnap.empty) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 90); // Regulatory changes stay relevant for 90 days
          
          let publishedDate: Date;
          try {
            publishedDate = published ? new Date(published) : new Date();
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
          
          const insightData = {
            type: insightType,
            title: title,
            description: cleanSummary || 'Review the latest government announcement for details.',
            severity: insightType === 'epc-requirements' ? 'high' : 'medium',
            actionRequired: insightType === 'epc-requirements',
            date: now,
            region: 'UK',
            source: 'GOV.UK',
            link: link,
            effectiveDate: Timestamp.fromDate(publishedDate),
            expiryDate: Timestamp.fromDate(expiryDate),
            createdAt: now,
            updatedAt: now,
            dismissedBy: []
          };
          
          const docRef = doc(this.insightsCollection);
          batch.set(docRef, insightData);
          insightsToSave.push({ type: insightType, title: title.substring(0, 60) });
          
          console.log(`✅ Prepared ${insightType} insight: "${title.substring(0, 60)}..."`);
        } else {
          console.log(`⏭️  Insight already exists: "${title.substring(0, 60)}..."`);
        }
      }
      
      // Commit all new insights
      if (insightsToSave.length > 0) {
        await batch.commit();
        console.log(`✅ Created ${insightsToSave.length} new regulatory insights from GOV.UK`);
      } else {
        console.log('ℹ️  No new insights to create (all already exist)');
      }
      
      return insightsToSave.length;
    } catch (error: any) {
      console.error('❌ Error fetching regulatory changes from GOV.UK:', error);
      console.error('   Error details:', error.message);
      throw error;
    }
  }

  /**
   * Helper to map Firestore documents to MarketInsight objects
   */
  private mapInsightDocs(docs: any[]): MarketInsight[] {
    return docs.map(doc => this.mapInsightDoc(doc.id, doc.data()));
  }

  private mapInsightDoc(id: string, data: any): MarketInsight {
    return {
      id,
      type: data.type,
      title: data.title,
      description: data.description,
      severity: data.severity,
      actionRequired: data.actionRequired || false,
      date: data.date?.toDate() || new Date(),
      area: data.area,
      region: data.region,
      value: data.value,
      unit: data.unit,
      trend: data.trend,
      source: data.source,
      link: data.link,
      effectiveDate: data.effectiveDate?.toDate(),
      expiryDate: data.expiryDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      userId: data.userId,
      dismissedBy: data.dismissedBy || []
    };
  }
}

export const marketInsightService = new MarketInsightService();

