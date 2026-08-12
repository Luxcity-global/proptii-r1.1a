import apiService from '../../../services/api';
import { fetchWithApiFallback } from '../../../utils/apiEndpoints';

const logDev = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

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
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  source?: string;
  link?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  dismissedBy?: string[];
}

class MarketInsightService {
  async getActiveInsights(userId?: string): Promise<MarketInsight[]> {
    try {
      const response = await apiService.get('/insights/active');
      const insights = response.insights || [];
      return insights.map((i: any) => ({
        ...i,
        date: new Date(i.date),
        effectiveDate: i.effectiveDate ? new Date(i.effectiveDate) : undefined,
        expiryDate: i.expiryDate ? new Date(i.expiryDate) : undefined,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting active insights:', error);
      return [];
    }
  }

  // Polling implementation to replace onSnapshot
  subscribeToInsights(
    callback: (insights: MarketInsight[]) => void,
    userId?: string
  ): () => void {
    let isActive = true;
    let timer: any;

    const poll = async () => {
      if (!isActive) return;
      try {
        const insights = await this.getActiveInsights(userId);
        if (isActive) callback(insights);
      } catch (err) {
        console.error('Error polling insights:', err);
      }
      if (isActive) {
        timer = setTimeout(poll, 30000); // poll every 30 seconds
      }
    };

    poll();

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }

  async dismissInsight(insightId: string, userId: string): Promise<void> {
    try {
      await apiService.put(`/insights/${insightId}/dismiss`, {});
      logDev(`✅ Insight ${insightId} dismissed by user ${userId}`);
    } catch (error) {
      console.error('Error dismissing insight:', error);
      throw error;
    }
  }

  // Refactored to fetch gov.uk changes and POST them to backend
  async fetchGOVUKRegulatoryChanges(): Promise<number> {
    try {
      logDev('📰 Fetching GOV.UK announcements from RSS feed...');
      
      const { response } = await fetchWithApiFallback('/govuk-rss');
      let xmlText = '';
      if (response.ok) {
        xmlText = await response.text();
      } else {
        const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.gov.uk/search/news-and-communications.atom')}`;
        const corsRes = await fetch(PROXY_URL);
        if (corsRes.ok) xmlText = await corsRes.text();
      }

      if (!xmlText || xmlText.length < 100) return 0;
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const entries = xmlDoc.querySelectorAll('entry');
      
      const relevantKeywords = [
        'epc', 'energy performance', 'energy efficiency',
        'landlord', 'private rented', 'rental', 'rent',
        'housing', 'property', 'tenancy', 'tenant',
        'regulation', 'legislation', 'compliance',
        'deposit', 'eviction', 'right to rent'
      ];
      
      const insightsToSave: any[] = [];
      const now = new Date();
      
      entries.forEach(entry => {
        const title = entry.querySelector('title')?.textContent || '';
        const summary = (entry.querySelector('summary') || entry.querySelector('content'))?.textContent || '';
        const text = `${title} ${summary}`.toLowerCase();
        
        if (relevantKeywords.some(k => text.includes(k))) {
          let insightType = 'regulatory-change';
          if (text.includes('epc') || text.includes('energy performance') || text.includes('minimum energy')) {
            insightType = 'epc-requirements';
          }
          
          let link = entry.querySelector('link')?.getAttribute('href') || entry.querySelector('id')?.textContent || 'https://www.gov.uk';
          const published = entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent;
          const publishedDate = published ? new Date(published) : new Date();
          
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 90);
          
          insightsToSave.push({
            type: insightType,
            title,
            description: summary.replace(/<[^>]*>/g, '').trim().substring(0, 300) || 'Review the latest announcement.',
            severity: insightType === 'epc-requirements' ? 'high' : 'medium',
            actionRequired: insightType === 'epc-requirements',
            date: now.toISOString(),
            region: 'UK',
            source: 'GOV.UK',
            link,
            effectiveDate: publishedDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            dismissedBy: []
          });
        }
      });

      if (insightsToSave.length > 0) {
        // Send bulk create to backend
        await apiService.post('/insights/bulk-create', { insights: insightsToSave.slice(0, 10) });
      }

      return Math.min(insightsToSave.length, 10);
    } catch (err) {
      console.error('Error fetching regulatory changes:', err);
      return 0;
    }
  }
}

export const marketInsightService = new MarketInsightService();
