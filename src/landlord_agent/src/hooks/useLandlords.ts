import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

export interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  propertyCount: number;
  activeTenants: number;
  totalValue: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastActive: string;
  joinDate: string;
}

export function useLandlords() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchLandlords = async () => {
      let authToken = token;
      if (!authToken) {
        try {
          const { getAccessTokenForApiRequest } = await import('../../../services/msalAccessToken');
          authToken = await getAccessTokenForApiRequest();
        } catch (e) {
          console.warn('Could not retrieve MSAL token for landlords:', e);
        }
      }

      try {
        setIsLoading(true);
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/clients/landlords`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        if (response.data && response.data.success) {
          setLandlords(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to fetch landlords');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred fetching landlords');
        console.error('Error fetching landlords:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandlords();
  }, [token, isAuthenticated]);

  return { landlords, isLoading, error };
}
