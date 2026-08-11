import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

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

export function usePropertyMarketData(propertyId: string | undefined) {
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
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/analytics/property/${propertyId}/market-insights`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          setMarketData(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to fetch market data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred fetching market data');
        console.error('Error fetching market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, [token, isAuthenticated, propertyId]);

  return { marketData, isLoading, error };
}
