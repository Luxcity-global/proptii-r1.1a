import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';
import { getAgentDummyLandlords, isAgentTestAccount, mergeById } from '../data/agentTestPersona';

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
  notes?: string;
  company?: string;
}

export function useLandlords() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchLandlords = async () => {
      const agentTest = isAgentTestAccount(user?.id, user?.email);
      if (agentTest) {
        setLandlords(getAgentDummyLandlords());
        setIsLoading(false);
        setError(null);
      }

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
        if (!agentTest) {
          setIsLoading(true);
        }
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/clients/landlords`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        if (response.data && response.data.success) {
          const live = response.data.data || [];
          setLandlords(agentTest ? mergeById(getAgentDummyLandlords(), live) : live);
        } else if (!agentTest) {
          setError(response.data?.error || 'Failed to fetch landlords');
        }
      } catch (err: any) {
        if (!agentTest) {
          setError(err.message || 'An error occurred fetching landlords');
          console.error('Error fetching landlords:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandlords();
  }, [token, isAuthenticated, user?.id, user?.email]);

  return { landlords, isLoading, error };
}
