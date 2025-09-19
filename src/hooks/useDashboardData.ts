import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  dashboardService, 
  createDashboardService,
  DashboardSummary, 
  SavedProperty, 
  PropertyViewing, 
  ReferencingApplication, 
  Contract, 
  UserFile 
} from '../services/dashboardService';

interface DashboardData {
  isLoading: boolean;
  error: string | null;
  dashboardSummary: DashboardSummary | null;
  savedProperties: SavedProperty[];
  viewings: PropertyViewing[];
  upcomingViewings: PropertyViewing[];
  pastViewings: PropertyViewing[];
  cancelledViewings: PropertyViewing[];
  referencingApplications: ReferencingApplication[];
  contracts: Contract[];
  files: UserFile[];
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for loading dashboard data
 * This centralizes data fetching across different dashboard sections
 */
export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [viewings, setViewings] = useState<PropertyViewing[]>([]);
  const [referencingApplications, setReferencingApplications] = useState<ReferencingApplication[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);

  const fetchDashboardData = async () => {
    console.log('🚀 fetchDashboardData called with user?.id:', user?.id);
    setIsLoading(true);
    setError(null);
    
    // Create dashboard service with current user ID
    const dashboardServiceInstance = createDashboardService(user?.id);
    console.log('🔧 Created dashboard service instance for user:', user?.id);
    
    try {
      // Fetch all data in parallel for better performance
      const [
        dashboardResponse,
        propertiesResponse,
        viewingsResponse,
        referencingResponse,
        contractsResponse,
        filesResponse
      ] = await Promise.all([
        dashboardServiceInstance.getDashboardSummary(),
        dashboardServiceInstance.getSavedProperties(),
        dashboardServiceInstance.getViewings(),
        dashboardServiceInstance.getReferencingApplications(),
        dashboardServiceInstance.getContracts(),
        dashboardServiceInstance.getUserFiles()
      ]);

      console.log('📋 Dashboard response:', dashboardResponse);
      if (dashboardResponse.success && dashboardResponse.data) {
        console.log('✅ Setting dashboard summary:', dashboardResponse.data);
        setDashboardSummary(dashboardResponse.data);
      } else if (!dashboardResponse.success) {
        console.error('❌ Dashboard response failed:', dashboardResponse.error);
        setError(dashboardResponse.error || 'Failed to fetch dashboard summary');
      }

      if (propertiesResponse.success && propertiesResponse.data) {
        setSavedProperties(propertiesResponse.data);
      } else if (!propertiesResponse.success) {
        console.error('Error fetching properties:', propertiesResponse.error);
      }

      if (viewingsResponse.success && viewingsResponse.data) {
        setViewings(viewingsResponse.data);
      } else if (!viewingsResponse.success) {
        console.error('Error fetching viewings:', viewingsResponse.error);
      }

      if (referencingResponse.success && referencingResponse.data) {
        setReferencingApplications(referencingResponse.data);
      } else if (!referencingResponse.success) {
        console.error('Error fetching referencing applications:', referencingResponse.error);
      }

      if (contractsResponse.success && contractsResponse.data) {
        setContracts(contractsResponse.data);
      } else if (!contractsResponse.success) {
        console.error('Error fetching contracts:', contractsResponse.error);
      }

      if (filesResponse.success && filesResponse.data) {
        setFiles(filesResponse.data);
      } else if (!filesResponse.success) {
        console.error('Error fetching files:', filesResponse.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('An unexpected error occurred while fetching dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial mount and when user changes
  useEffect(() => {
    console.log('🔄 useDashboardData useEffect triggered with user?.id:', user?.id);
    if (user?.id) { // Only fetch data if user ID is available
      console.log('📊 Fetching dashboard data for user:', user.id);
      fetchDashboardData();
    } else {
      console.log('⏳ No user ID available, skipping dashboard data fetch');
    }
  }, [user?.id]); // Re-run when user.id changes

  // Filter viewings for convenience
  const upcomingViewings = viewings.filter(viewing => viewing.status === 'upcoming');
  const pastViewings = viewings.filter(viewing => viewing.status === 'completed');
  const cancelledViewings = viewings.filter(viewing => viewing.status === 'cancelled');

  return {
    isLoading,
    error,
    dashboardSummary,
    savedProperties,
    viewings,
    upcomingViewings,
    pastViewings,
    cancelledViewings,
    referencingApplications,
    contracts,
    files,
    refreshData: fetchDashboardData
  };
}; 