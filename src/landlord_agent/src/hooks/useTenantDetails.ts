import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';

export interface TenantDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected' | 'expired';
}

export interface TenantDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: 'active' | 'notice' | 'arrears' | 'eviction';
  propertyAddress: string;
  rentAmount: number;
  depositAmount: number;
  leaseStart: string | null;
  leaseEnd: string | null;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  documents: TenantDocument[];
  notes: string;
}

export function useTenantDetails(tenantId: string | undefined) {
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (!isAuthenticated || !token || !tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const API_BASE_URL = PRIMARY_API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.get(`${API_BASE_URL}/api/azure-users/tenant/${tenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          setTenantDetails(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to fetch tenant details');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred fetching tenant details');
        console.error('Error fetching tenant details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantDetails();
  }, [token, isAuthenticated, tenantId]);

  return { tenantDetails, isLoading, error };
}
