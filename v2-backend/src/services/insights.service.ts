import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getRedisClient } from '../utils/redis-client';

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

  async getPortfolioSummary(userId: string) {
    if (!userId) {
      return {
        totalProperties: 0,
        occupiedProperties: 0,
        vacantProperties: 0,
        occupancyRate: 0,
        monthlyRent: 0,
        annualRent: 0,
        averageRent: 0,
        tenantsCount: 0,
      };
    }

    const redis = getRedisClient();
    const cacheKey = `insights:portfolio:${userId}`;
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }

    const db = this.db;
    let properties: any[] = [];
    let tenants: any[] = [];

    if (db) {
      try {
        const [propsSnap1, propsSnap2, tenantsSnap] = await Promise.all([
          db.collection('properties').where('userId', '==', userId).get().catch(() => ({ docs: [] })),
          db.collection('properties').where('landlordId', '==', userId).get().catch(() => ({ docs: [] })),
          db.collection('tenants').where('userId', '==', userId).get().catch(() => ({ docs: [] })),
        ]);

        const propMap = new Map<string, any>();
        [...propsSnap1.docs, ...propsSnap2.docs].forEach(d => propMap.set(d.id, d.data()));
        properties = Array.from(propMap.values());
        tenants = (tenantsSnap.docs || []).map(d => d.data());
      } catch (err: any) {
        this.logger.warn(`getPortfolioSummary fetch error: ${err?.message || err}`);
      }
    }

    const nonArchivedProps = properties.filter(p => p.status !== 'archived' && !p.archived && !p.isArchived);
    const totalProperties = nonArchivedProps.length;
    let occupiedCount = 0;
    let monthlyRent = 0;

    nonArchivedProps.forEach(p => {
      const isOccupied = p.status === 'occupied' || Boolean(p.tenantId) || Boolean(p.tenant);
      if (isOccupied) {
        occupiedCount++;
      }
      const rent = Number(p.price || p.rentAmount || p.rent || 0);
      if (!isNaN(rent) && rent > 0) {
        monthlyRent += rent;
      }
    });

    const vacantProperties = Math.max(0, totalProperties - occupiedCount);
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
    const annualRent = monthlyRent * 12;
    const averageRent = totalProperties > 0 ? Math.round(monthlyRent / totalProperties) : 0;
    const tenantsCount = tenants.length;

    const summary = {
      totalProperties,
      occupiedProperties: occupiedCount,
      vacantProperties,
      occupancyRate,
      monthlyRent,
      annualRent,
      averageRent,
      tenantsCount,
      cachedAt: new Date().toISOString(),
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(summary), 'EX', 300); // 5 min cache
      } catch {}
    }

    return summary;
  }
}
