import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  async getMarketInsights(query?: string, location?: string) {
    const db = this.db;
    // Return cached/static market insights from Firestore if available
    if (db) {
      try {
        const snap = await db.collection('market_insights')
          .orderBy('updatedAt', 'desc')
          .limit(20)
          .get();
        if (!snap.empty) {
          const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return { data: items, source: 'cache' };
        }
      } catch (err: any) {
        this.logger.warn(`getMarketInsights cache error: ${err?.message || err}`);
      }
    }

    // Static fallback
    return {
      data: [
        {
          id: 'avg_rent',
          metric: 'Average Rent',
          value: '£1,850/month',
          change: '+3.2%',
          period: 'last 12 months',
          location: location || 'London',
        },
        {
          id: 'vacancy_rate',
          metric: 'Vacancy Rate',
          value: '2.8%',
          change: '-0.4%',
          period: 'last 12 months',
          location: location || 'London',
        },
        {
          id: 'avg_days_listed',
          metric: 'Avg Days Listed',
          value: '18 days',
          change: '-2 days',
          period: 'last 12 months',
          location: location || 'London',
        },
      ],
      source: 'static',
    };
  }

  async getPriceTrends(postcode?: string) {
    return {
      data: {
        postcode: postcode || 'SW1',
        avgPricePerSqFt: 850,
        yearOnYearChange: 3.2,
        quarterlyChange: 0.8,
        medianRent: 2100,
        rentalYield: 4.1,
      },
    };
  }

  async getDemandMetrics(location?: string) {
    return {
      data: {
        location: location || 'London',
        searchesPerProperty: 42,
        avgTimeToRent: 18,
        competitivenessScore: 7.8,
        demandTrend: 'high',
      },
    };
  }
}
