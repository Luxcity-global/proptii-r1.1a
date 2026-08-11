import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

export interface AnalyticsData {
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
          console.warn('Could not retrieve MSAL token for analytics:', e);
        }
      }

      try {
        setIsLoading(true);
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/analytics/portfolio`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        if (response.data && response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred fetching analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, isAuthenticated]);

  return { data, isLoading, error };
}
