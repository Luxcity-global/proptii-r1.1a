import React, { createContext, useContext, useState, useEffect } from 'react';
import signedContractsFirestoreService, { SignedContractData } from '../services/signedContractsFirestoreService';
import { useAuth } from './AuthContext';

interface SignedContractsContextType {
  signedContracts: SignedContractData[];
  isLoading: boolean;
  addSignedContract: (contract: Omit<SignedContractData, 'id' | 'signedDate'>) => Promise<SignedContractData>;
  removeSignedContract: (id: string) => Promise<void>;
  getSignedContract: (id: string) => SignedContractData | undefined;
  clearAllContracts: () => Promise<void>;
}

const SignedContractsContext = createContext<SignedContractsContextType | undefined>(undefined);

export const useSignedContracts = () => {
  const context = useContext(SignedContractsContext);
  if (!context) {
    throw new Error('useSignedContracts must be used within a SignedContractsProvider');
  }
  return context;
};

export const SignedContractsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [signedContracts, setSignedContracts] = useState<SignedContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time Firestore listener — only when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      setSignedContracts([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = signedContractsFirestoreService.onSignedContractsChange(user.id, (contracts) => {
      setSignedContracts(contracts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const addSignedContract = async (contractData: Omit<SignedContractData, 'id' | 'signedDate'>): Promise<SignedContractData> => {
    if (!user?.id) throw new Error('You must be signed in to save a contract.');

    const result = await signedContractsFirestoreService.saveSignedContract(user.id, contractData);

    if (result.success && result.contractId) {
      const newContract: SignedContractData = {
        ...contractData,
        id: result.contractId,
        signedDate: new Date().toISOString(),
        userId: user.id,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };
      return newContract;
    }

    throw new Error(result.error || 'Failed to save contract');
  };

  const removeSignedContract = async (id: string): Promise<void> => {
    await signedContractsFirestoreService.deleteSignedContract(id);
  };

  const getSignedContract = (id: string): SignedContractData | undefined => {
    return signedContracts.find(contract => contract.id === id);
  };

  // P1-6: Implemented — deletes all contracts for the current user
  const clearAllContracts = async (): Promise<void> => {
    if (!user?.id) return;
    await Promise.all(
      signedContracts.map(contract => signedContractsFirestoreService.deleteSignedContract(contract.id))
    );
    setSignedContracts([]);
  };

  return (
    <SignedContractsContext.Provider value={{
      signedContracts,
      isLoading,
      addSignedContract,
      removeSignedContract,
      getSignedContract,
      clearAllContracts,
    }}>
      {children}
    </SignedContractsContext.Provider>
  );
};
