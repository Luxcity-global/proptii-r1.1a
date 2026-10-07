import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';
import { marketInsightService } from '../services/marketInsightService';

export interface PropertyMarketData {
  averagePrice: number;
  priceChange12Months: number;
  averageYield: number;
  averageDaysOnMarket: number;
  rentalDemandIndex: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  priceHistory: { month: string; price: number }[];
  demographics: {
    averageAge: string;
    topProfession: string;
    familyHouseholds: number;
  };
}

/** Pull a UK postcode out of a property address for GET /api/insights/price-trends. */
function postcodeFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  const match = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
  return match?.[1];
}

/**
 * Map the documented insights payloads onto the shape Property Insights already renders.
 * Competitiveness from the API is sometimes a 0–10 score; the screen shows 0–100.
 */
export function mapDocumentedInsights(
  trends: { medianRent?: number; yearOnYearChange?: number; rentalYield?: number } | null,
  demand: { avgTimeToRent?: number; competitivenessScore?: number } | null,
): PropertyMarketData | null {
  // The property screen divides rent by average price. Skip the fallback when median rent is missing.
  if (!trends?.medianRent) return null;
  const score = demand?.competitivenessScore;
  const rentalDemandIndex =
    score == null ? 0 : score <= 10 ? Math.round(score * 10) : Math.round(score);

  return {
    averagePrice: trends?.medianRent ?? 0,
    priceChange12Months: trends?.yearOnYearChange ?? 0,
    averageYield: trends?.rentalYield ?? 0,
    averageDaysOnMarket: demand?.avgTimeToRent ?? 0,
    rentalDemandIndex,
    confidenceLevel: trends?.medianRent && demand ? 'high' : 'medium',
    priceHistory: [],
    demographics: {
      averageAge: '',
      topProfession: '',
      familyHouseholds: 0,
    },
  };
}

async function loadDocumentedPropertyInsights(address?: string): Promise<PropertyMarketData | null> {
  const postcode = postcodeFromAddress(address);
  const location = address?.trim() || undefined;
  const [trendsResult, demandResult] = await Promise.allSettled([
    marketInsightService.getPriceTrends(postcode),
    marketInsightService.getDemand(location),
  ]);
  const trends = trendsResult.status === 'fulfilled' ? trendsResult.value : null;
  const demand = demandResult.status === 'fulfilled' ? demandResult.value : null;
  return mapDocumentedInsights(trends, demand);
}

export function usePropertyMarketData(propertyId: string | undefined, address?: string) {
  const [marketData, setMarketData] = useState<PropertyMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!isAuthenticated || !token || !propertyId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/analytics/property/${propertyId}/market-insights`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.success && response.data.data) {
          setMarketData(response.data.data);
          return;
        }

        const documented = await loadDocumentedPropertyInsights(address);
        if (documented) {
          setMarketData(documented);
          return;
        }
        setError(response.data?.error || 'Failed to fetch market data');
      } catch (err: any) {
        try {
          const documented = await loadDocumentedPropertyInsights(address);
          if (documented) {
            setMarketData(documented);
            setError(null);
            return;
          }
        } catch (fallbackError) {
          console.error('Error fetching documented property insights:', fallbackError);
        }
        setError(err.message || 'An error occurred fetching market data');
        console.error('Error fetching market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, [token, isAuthenticated, propertyId, address]);

  return { marketData, isLoading, error };
}
