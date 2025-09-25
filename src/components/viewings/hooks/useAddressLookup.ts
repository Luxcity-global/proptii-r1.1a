import { useState } from 'react';

interface Address {
  formatted_address: string[];
  thoroughfare: string;
  building_name: string;
  sub_building_name: string;
  sub_building_number: string;
  building_number: string;
  line_1: string;
  line_2: string;
  line_3: string;
  line_4: string;
  locality: string;
  town_or_city: string;
  county: string;
  district: string;
  country: string;
}

interface AddressLookupResponse {
  addresses: Address[];
  postcode: string;
}

export function useAddressLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const lookupAddress = async (postcode: string, houseNumber?: string) => {
    setIsLoading(true);
    setError(null);
    setAddresses([]);

    try {
      const queryParams = new URLSearchParams({
        postcode: postcode.replace(/\s/g, '')
      });
      if (houseNumber) {
        queryParams.append('house_number', houseNumber);
      }

      const response = await fetch(`/api/address/lookup?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch address');
      }

      if (houseNumber) {
        // Single address response
        setAddresses([data.address]);
        return data.address;
      } else {
        // Multiple addresses response
        setAddresses(data.addresses || []);
        return data.addresses;
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupAddress,
    isLoading,
    error,
    addresses
  };
} 