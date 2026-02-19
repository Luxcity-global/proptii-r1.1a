import React, { createContext, useContext, useState, useEffect } from 'react';
import signedContractsFirestoreService, { SignedContractData } from '../services/signedContractsFirestoreService';
import { useAuth } from './AuthContext';

// SignedContract interface is now imported from the service

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
  console.log('🔄 useSignedContracts - Hook called');
  const context = useContext(SignedContractsContext);
  console.log('🔄 useSignedContracts - Context value:', context);
  if (!context) {
    console.error('❌ useSignedContracts - Context not available');
    console.error('❌ useSignedContracts - Provider may not be mounted or component is outside provider tree');
    throw new Error('useSignedContracts must be used within a SignedContractsProvider');
  }
  console.log('✅ useSignedContracts - Context available, returning:', context);
  return context;
};

export const SignedContractsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔄 SignedContractsProvider - Provider component rendering');
  const { user } = useAuth();
  const [signedContracts, setSignedContracts] = useState<SignedContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load contracts from Firestore on mount and set up real-time listener
  useEffect(() => {
    console.log('🔄 SignedContractsContext - Setting up Firestore connection');
    console.log('🔄 SignedContractsContext - Provider mounted, setting up listener');
    
    // Set up real-time listener for signed contracts
    const userId = user?.id || 'dev-user-123';
    const unsubscribe = signedContractsFirestoreService.onSignedContractsChange(userId, (contracts) => {
      console.log('🔄 SignedContractsContext - Real-time update received:', contracts.length, 'contracts');
      
      // Ensure all contracts have documentUrl for viewing
      const contractsWithUrls = contracts.map(contract => {
        if (!contract.documentUrl) {
          // Create a placeholder URL for contracts without documentUrl
          // This allows the view functionality to work with a demo message
          contract.documentUrl = `/demo-contracts/${contract.documentName || 'contract'}.pdf`;
          console.log('🔄 SignedContractsContext - Added placeholder documentUrl for contract:', contract.id);
        }
        return contract;
      });
      
      setSignedContracts(contractsWithUrls);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 SignedContractsContext - Cleaning up Firestore listener');
      console.log('🔄 SignedContractsContext - Provider unmounting');
      unsubscribe();
    };
  }, [user?.id]); // Re-setup listener when user changes

  const addSignedContract = async (contractData: Omit<SignedContractData, 'id' | 'signedDate'>) => {
    console.log('🔄 SignedContractsContext - addSignedContract called with:', contractData);
    
    try {
      // Add contract to Firestore
      const userId = user?.id || 'dev-user-123';
      const result = await signedContractsFirestoreService.saveSignedContract(userId, contractData);
      
      if (result.success && result.contractId) {
        const newContract: SignedContractData = {
          ...contractData,
          id: result.contractId,
          signedDate: new Date().toISOString(),
          userId: userId,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };
        
        console.log('✅ SignedContractsContext - New signed contract added to Firestore:', newContract);
        return newContract;
      } else {
        throw new Error(result.error || 'Failed to save contract');
      }
    } catch (error) {
      console.error('❌ SignedContractsContext - Error adding contract to Firestore:', error);
      throw error;
    }
  };

  const removeSignedContract = async (id: string) => {
    try {
      console.log('🔄 SignedContractsContext - Removing contract:', id);
      await signedContractsFirestoreService.deleteSignedContract(id);
      console.log('✅ SignedContractsContext - Contract removed from Firestore');
    } catch (error) {
      console.error('❌ SignedContractsContext - Error removing contract:', error);
      throw error;
    }
  };

  const getSignedContract = (id: string) => {
    return signedContracts.find(contract => contract.id === id);
  };

  const clearAllContracts = async () => {
    try {
      console.log('🔄 SignedContractsContext - Clearing all contracts from Firestore');
      // Note: We don't have a clearAllContracts method in the new service
      // This would need to be implemented if needed
      console.log('⚠️ SignedContractsContext - clearAllContracts not implemented in new service');
    } catch (error) {
      console.error('❌ SignedContractsContext - Error clearing contracts:', error);
      throw error;
    }
  };

  return (
    <SignedContractsContext.Provider value={{
      signedContracts,
      isLoading,
      addSignedContract,
      removeSignedContract,
      getSignedContract,
      clearAllContracts
    }}>
      {children}
    </SignedContractsContext.Provider>
  );
};
