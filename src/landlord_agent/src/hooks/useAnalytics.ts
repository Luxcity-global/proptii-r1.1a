import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

export interface PortfolioSummary {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  monthlyRent: number;
  annualRent: number;
  averageRent: number;
  tenantsCount: number;
  cachedAt: string;
}

export interface AnalyticsData {
  summary?: PortfolioSummary;
  revenue: {
    totalMonthly: number;
    outstandingRent: number;
    momGrowth: number;
    avgRentPerUnit: number;
    revenueTrendData: any[];
    revenueByProperty: any[];
  };
  occupancy: {
    rate: number;
    vacantUnits: number;
    avgDaysVacant: number;
    renewalRate: number;
  };
  tenants: {
    totalActive: number;
    satisfactionScore: number;
    avgTenancyMonths: number;
    openRequests: number;
    overview: any[];
    payments: any[];
  };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      let authToken = token;
      if (!authToken) {
        try {
          const { getAccessTokenForApiRequest } = await import('../../../services/msalAccessToken');
          authToken = await getAccessTokenForApiRequest();
        } catch (e) {
          console.warn('Could not retrieve token for analytics:', e);
        }
      }

      try {
        setIsLoading(true);
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/insights/portfolio-summary`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        if (response.data) {
          const summary: PortfolioSummary = response.data;
          setData({
            summary,
            revenue: {
              totalMonthly: summary.monthlyRent || 0,
              outstandingRent: 0,
              momGrowth: 0,
              avgRentPerUnit: summary.averageRent || 0,
              revenueTrendData: [],
              revenueByProperty: [],
            },
            occupancy: {
              rate: summary.occupancyRate || 0,
              vacantUnits: summary.vacantProperties || 0,
              avgDaysVacant: 0,
              renewalRate: 100,
            },
            tenants: {
              totalActive: summary.tenantsCount || 0,
              satisfactionScore: 95,
              avgTenancyMonths: 12,
              openRequests: 0,
              overview: [],
              payments: [],
            },
          });
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred fetching analytics');
        console.warn('Using client fallback for analytics:', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, isAuthenticated]);

  return { data, isLoading, error };
}
