import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2,
  Eye,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  PoundSterling,
  Calendar,
  Home,
  BarChart3,
  X,
  MapPin,
  Image,
  Phone,
  Mail,
  CheckCircle,
  CircleDot,
  File,
  FileUp,
  FileTextIcon,
  Heart
} from 'lucide-react';
import ReferencingModal from '../../referencing/ReferencingModal';
import { ReferencingProvider, useReferencing } from '../../referencing/context/ReferencingContext';

/**
 * Main dashboard home page component following the style guide
 */
const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  
  // State for referencing modal
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [referencingStep, setReferencingStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState('demo-property-123'); // Using demo property ID
  
  // Get the user ID from localStorage or auth context
  const getUserId = () => {
    // Try to get user ID from localStorage keys
    const keys = Object.keys(localStorage);
    const referencingKey = keys.find(key => key.startsWith('referencing_') && key.includes('_formData'));
    if (referencingKey) {
      return referencingKey.split('_')[1]; // Extract user ID from key
    }
    return null;
  };
  
  const userId = getUserId();
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  
  // Calculate remaining forms and alert status
  const totalSections = 6;
  const completedCount = completedSections.size;
  const remainingCount = totalSections - completedCount;
  const allCompleted = completedCount === totalSections;
  
  // Load form completion status from localStorage
  // Using EXACT same logic as ReferencingSidebar component
  React.useEffect(() => {
    const loadFormStatus = () => {
      try {
        // IMPORTANT: Use the user ID-based key where the actual form data is stored
        // The modal saves to: referencing_{userId}_formData
        let storedData = null;
        let dataSource = '';
        
        if (userId) {
          // Try user ID-based key first (where actual data is stored)
          const userKey = `referencing_${userId}_formData`;
          storedData = localStorage.getItem(userKey);
          dataSource = 'user_id_based';
          console.log('Using user ID-based key:', userKey);
        }
        
        if (!storedData) {
          // Fallback to property ID-based key
          const storageKey = `property_${selectedPropertyId}_draft`;
          const fullKey = `proptii_${storageKey}`;
          storedData = localStorage.getItem(fullKey);
          dataSource = 'property_id_based';
          console.log('Fallback to property ID-based key:', fullKey);
        }
        
        console.log('🔍 Dashboard Debug - Loading form status:');
        console.log('Data source:', dataSource);
        console.log('User ID:', userId);
        console.log('Raw stored data:', storedData);
        console.log('All localStorage keys:', Object.keys(localStorage));
        
        // Check for alternative keys that might exist
        const alternativeKeys = [
          `form_${selectedPropertyId}`,
          `proptii_form_${selectedPropertyId}`,
          `proptii_property_${selectedPropertyId}_draft`,
          `referencing_ebc1c666-fed1-4567-843d-9736cc2e082e_formData`,
          `referencing_ebc1c666-fed1-4567-843d-9736cc2e082e_stepStatus`,
          `referencing_ebc1c666-fed1-4567-843d-9736cc2e082e_currentStep`
        ];
        
        alternativeKeys.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            console.log(`Found data in key: ${key}`, JSON.parse(data));
          }
        });
        
        // Check if the user ID-based key has the actual form data
        const userIdBasedKey = `referencing_ebc1c666-fed1-4567-843d-9736cc2e082e_formData`;
        const userIdData = localStorage.getItem(userIdBasedKey);
        if (userIdData) {
          try {
            const parsedData = JSON.parse(userIdData);
            console.log('🔍 User ID-based form data found:', parsedData);
            
            // Check if this data has the identity information
            if (parsedData.identity) {
              console.log('Identity data in user ID key:', parsedData.identity);
              const identityComplete = parsedData.identity.firstName && parsedData.identity.lastName && parsedData.identity.email;
              console.log('Identity complete in user ID key:', identityComplete);
            }
          } catch (error) {
            console.error('Error parsing user ID data:', error);
          }
        }
        
        if (storedData) {
          const formData = JSON.parse(storedData);
          console.log('Parsed form data:', formData);
          
          const completed = new Set<string>();
          
          // EXACT SAME LOGIC as ReferencingSidebar.isStepCompleted
          // Identity: firstName, lastName, and email must be filled
          const identityComplete = formData.identity?.firstName && formData.identity?.lastName && formData.identity?.email;
          console.log('Identity check:', {
            firstName: formData.identity?.firstName,
            lastName: formData.identity?.lastName,
            email: formData.identity?.email,
            complete: identityComplete,
            identityObject: formData.identity
          });
          
          if (identityComplete) {
            completed.add('identity');
          }
          
          // Employment: employmentStatus must be filled
          if (formData.employment?.employmentStatus) {
            completed.add('employment');
          }
          
          // Residential: currentAddress must be filled
          if (formData.residential?.currentAddress) {
            completed.add('residential');
          }
          
          // Financial: check for actual meaningful data
          const financialComplete = formData.financial?.proofOfIncomeType && 
                                   formData.financial.proofOfIncomeType.trim() !== '';
          console.log('Financial check:', {
            proofOfIncomeType: formData.financial?.proofOfIncomeType,
            complete: financialComplete,
            financialObject: formData.financial
          });
          if (financialComplete) {
            completed.add('financial');
          }
          
          // Guarantor: check for actual meaningful data
          const guarantorComplete = formData.guarantor?.firstName && 
                                   formData.guarantor?.lastName && 
                                   formData.guarantor?.email &&
                                   formData.guarantor.firstName.trim() !== '' &&
                                   formData.guarantor.lastName.trim() !== '' &&
                                   formData.guarantor.email.trim() !== '';
          console.log('Guarantor check:', {
            firstName: formData.guarantor?.firstName,
            lastName: formData.guarantor?.lastName,
            email: formData.guarantor?.email,
            complete: guarantorComplete,
            guarantorObject: formData.guarantor
          });
          if (guarantorComplete) {
            completed.add('guarantor');
          }
          
          // Credit Check: hasAgreedToCheck must be true
          if (formData.creditCheck?.hasAgreedToCheck) {
            completed.add('creditCheck');
          }
          
          console.log('Completed sections:', Array.from(completed));
          setCompletedSections(completed);
        } else {
          console.log('No stored data found for any key');
          
          // Check what keys actually exist in localStorage
          const allKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            allKeys.push(localStorage.key(i));
          }
          console.log('All localStorage keys:', allKeys);
        }
      } catch (error) {
        console.error('Error loading form status:', error);
      }
    };
    
    loadFormStatus();
    
    // Reload when modal closes to update completion status
    if (!isReferencingModalOpen) {
      loadFormStatus();
    }
    
    // Listen for storage events from other tabs/windows (and same window)
    const handleStorageChange = (e: StorageEvent) => {
      const userKey = userId ? `referencing_${userId}_formData` : null;
      const propertyKey = `proptii_property_${selectedPropertyId}_draft`;
      
      if (e.key === userKey || e.key === propertyKey || e.key === null) {
        loadFormStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedPropertyId, isReferencingModalOpen]);
  
  // Function to open referencing modal at a specific step
  const openReferencingModal = (step: number) => {
    setReferencingStep(step);
    setIsReferencingModalOpen(true);
  };
  
  const closeReferencingModal = () => {
    setIsReferencingModalOpen(false);
  };

  
  // Add CSS animation for pie chart and custom scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes drawSegment {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Custom thin scrollbar for webkit browsers */
      .thin-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      
      .thin-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .thin-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }
      
      .thin-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Mock data arrays
  const savedSearches = [
    {
      id: 1,
      address: '123 Regent Street, London W1B 4EA',
      propertyType: '2 Bedroom Apartment',
      bedrooms: 2,
      price: 2400,
      features: ['Central Heating', 'Double Glazing', 'Balcony'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 2,
      address: '45 Victoria Park Road, London E9 7JN',
      propertyType: '3 Bedroom House',
      bedrooms: 3,
      price: 2100,
      features: ['Garden', 'Parking', 'Central Heating'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 3,
      address: '78 Oak Gardens, London SW4 9AL',
      propertyType: '1 Bedroom Flat',
      bedrooms: 1,
      price: 2800,
      features: ['Concierge', 'Gym Access', 'Balcony'],
      image: '/images/detached-house.jpg'
    }
  ];

  // Mock data for now since we removed the hook dependency
  const dashboardSummary = {
    savedSearches: { count: savedSearches.length }, // Actual count from savedSearches array
    viewings: { upcoming: 5, total: 8 }, // 5 upcoming from Viewings page
    referencing: { completedSteps: completedCount, totalSteps: 6 }, // Dynamic count based on actual completion
    contracts: { pending: 0, total: 2, requested: 0 }, // 2 total contracts
    portfolioValue: '2,400',
    occupancyRate: 95,
    averageRent: 2400,
    upcomingRenewals: 2,
    priorityAlerts: {
      count: 2,
      alerts: [
        {
          message: 'Employment Reference - Fill in your employment details',
          propertyAddress: '123 Regent Street, London'
        },
        {
          message: 'Guarantor Information - Additional steps required',
          propertyAddress: '456 Oxford Street, London'
        }
      ]
    }
  };

  const savedProperties = [
    {
      id: 1,
      address: '123 Regent Street, London W1B 4EA',
      city: 'London',
      bedrooms: 2,
      price: 2400
    },
    {
      id: 2,
      address: '456 Oxford Street, London W1C 1AP',
      city: 'London',
      bedrooms: 1,
      price: 1800
    },
    {
      id: 3,
      address: '789 Bond Street, London W1S 1DH',
      city: 'London',
      bedrooms: 3,
      price: 3200
    }
  ];

  const upcomingViewings = [
    {
      id: 1,
      propertyAddress: '123 Regent Street, London',
      date: '2024-11-28',
      time: '2:00 PM'
    },
    {
      id: 2,
      propertyAddress: '456 Oxford Street, London',
      date: '2024-11-29',
      time: '10:00 AM'
    }
  ];

  const files = [
    {
      id: 1,
      name: 'Proof of Identity',
      type: 'application/pdf',
      size: 1572864, // 1.5 MB
      uploadDate: '15 Nov 2024',
      url: '#'
    },
    {
      id: 2,
      name: 'Proof of Address',
      type: 'application/pdf',
      size: 1572864, // 1.5 MB
      uploadDate: '15 Nov 2024',
      url: '#'
    },
    {
      id: 3,
      name: 'Bank Statement.pdf',
      type: 'application/pdf',
      size: 8388608,
      uploadDate: '10 Nov 2024',
      url: '#'
    }
  ];

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const referencingProgress = dashboardSummary?.referencing.completedSteps || 0;
  const totalReferencingSteps = dashboardSummary?.referencing.totalSteps || 1;

  const getFileColorByType = (type: string): string => {
    if (type.includes('pdf')) {
      return 'bg-red-100';
    } else if (type.includes('image')) {
      return 'bg-blue-100';
    } else {
      return 'bg-gray-100';
    }
  };

  const getFileIconByType = (type: string) => {
    if (type.includes('pdf')) {
      return <FileTextIcon className="w-6 h-6 text-red-500" />;
    } else if (type.includes('image')) {
      return <Image className="w-6 h-6 text-blue-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Overview Section */}
      <div className="mt-8">
        <h2 
          className="text-lg font-semibold mb-6"
          style={{ color: '#374957' }}
        >
          Overview
        </h2>
        
        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saved Listings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Row 1: Title and Icon */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Saved Listings</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.savedSearches.count || 3}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Active Searches</p>
          </div>
        </div>

      {/* Viewings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Row 1: Title and Icon */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Viewings</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.viewings.upcoming || 5}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Upcoming</p>
          </div>
        </div>

      {/* Referencing Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Row 1: Title and Icon */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Referencing</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {referencingProgress}/{totalReferencingSteps}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Complete</p>
          </div>
        </div>

        {/* Contracts Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          {/* Row 1: Title and Icon */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Contracts</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.contracts.total || 1}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>As of 09/10/2025</p>
          </div>
        </div>
        </div>
      </div>

      {/* Tenant Insights Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: '#374957' }} />
          <h2 
            className="text-lg font-semibold"
            style={{ color: '#374957' }}
          >
            Tenant Insights
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Referencing Card */}
        <div
          className="shadow-sm overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
            border: '1px solid #80B2FF',
            height: '320px',
            borderRadius: '20px'
          }}
        >
          <div className="flex h-full">
            {/* Left Blue Panel */}
            <div
              className="p-6 flex flex-col items-start min-w-[200px]"
              style={{
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                color: '#374957'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Referencing</h2>
              </div>
              <div className="mt-auto">
                <div className="text-4xl font-bold text-blue-800">
                  {allCompleted ? 6 : remainingCount}
                </div>
                <div className="text-sm opacity-90">
                  {allCompleted ? 'Success' : 'Alerts'}
                </div>
                <div className="text-xs opacity-75">
                  {allCompleted 
                    ? 'All forms completed!' 
                    : 'Between 25 Nov - 2 Dec 2024'
                  }
                </div>
              </div>
            </div>

            {/* Right White Panel */}
            <div
              className="flex-1 p-4 bg-white"
              style={{
                borderRadius: '20px',
                boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)',
                overflow: 'hidden'
              }}
            >
              <div className="flex justify-end mb-4">
                <Link to="/dashboard/tenant-referencing" className="text-sm font-medium text-blue-600 hover:underline">
                  Go to Referencing →
                </Link>
              </div>
              <div 
                className="space-y-3 max-h-56 overflow-y-auto thin-scrollbar pb-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 transparent'
                }}
              >
                {/* Identity */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('identity') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('identity') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Identity
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('identity') 
                            ? 'Identity verification completed' 
                            : 'Upload your identity documents'}
                        </p>
                        {!completedSections.has('identity') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-orange-600">
                              5 days past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(1)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('identity')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('identity') ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {completedSections.has('identity') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Employment Reference */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('employment') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('employment') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Employment
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('employment') 
                            ? 'Employment details completed' 
                            : 'Fill in your employment details'}
                        </p>
                        {!completedSections.has('employment') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-orange-600">
                              14 days past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(2)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('employment')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('employment') ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {completedSections.has('employment') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Guarantor Information */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('guarantor') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('guarantor') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Guarantor
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('guarantor') 
                            ? 'Guarantor information completed' 
                            : 'Additional steps required'}
                        </p>
                        {!completedSections.has('guarantor') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-red-600">
                              12 days past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(5)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('guarantor')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('guarantor') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {completedSections.has('guarantor') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Residential */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('residential') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('residential') ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          Residential
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('residential') 
                            ? 'Residential history completed' 
                            : 'Provide residential history'}
                        </p>
                        {!completedSections.has('residential') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-yellow-600">
                              8 days past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(3)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('residential')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-yellow-300 hover:bg-yellow-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('residential') ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {completedSections.has('residential') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Financial */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('financial') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('financial') ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          Financial
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('financial') 
                            ? 'Financial documents completed' 
                            : 'Submit financial documents'}
                        </p>
                        {!completedSections.has('financial') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-blue-600">
                              3 days past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(4)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('financial')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('financial') ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {completedSections.has('financial') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Credit Check */}
                <div className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {completedSections.has('creditCheck') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-purple-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 text-sm ${
                          completedSections.has('creditCheck') ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          Credit Check
                        </h4>
                        <p className="text-xs text-gray-700 mb-2">
                          {completedSections.has('creditCheck') 
                            ? 'Credit check authorization completed' 
                            : 'Complete credit check authorization'}
                        </p>
                        {!completedSections.has('creditCheck') && (
                          <div className="flex items-baseline space-x-3">
                            <span className="text-xs font-bold text-purple-600">
                              1 day past due date
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(6)}
                      className={`border rounded px-3 py-1 transition-colors ${
                        completedSections.has('creditCheck')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        completedSections.has('creditCheck') ? 'text-green-600' : 'text-purple-600'
                      }`}>
                        {completedSections.has('creditCheck') ? 'Edit' : 'View More'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Viewing Card */}
        <div
          className="shadow-sm overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
            border: '1px solid #80B2FF',
            height: '320px',
            borderRadius: '20px'
          }}
        >
          <div className="flex h-full">
            {/* Left Blue Panel */}
            <div
              className="p-6 flex flex-col items-start min-w-[200px]"
              style={{
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                color: '#374957'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Viewing</h2>
              </div>
              <div className="mt-auto">
                <div className="text-4xl font-bold text-blue-800">2</div>
                <div className="text-sm opacity-90">Summary</div>
                <div className="text-xs opacity-75">Between 25 Nov - 2 Dec 2024</div>
              </div>
            </div>

            {/* Right White Panel */}
            <div
              className="flex-1 p-4 bg-white relative"
      style={{
                borderRadius: '20px',
                boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)'
              }}
            >
              <div className="absolute top-4 right-4 z-10">
                <Link 
                  to="/dashboard/viewings" 
                  className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  Go to viewings →
                </Link>
              </div>
                    <div className="flex items-center justify-center h-full">
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Animated Pie Chart */}
                        <div className="relative w-40 h-40">
                          <div className="relative w-48 h-48">
                            <svg className="w-48 h-48" viewBox="0 0 200 200">
                              {/* Pie chart segments */}
                              {/* Upcoming viewings segment (3/5 = 60% = 216 degrees) */}
                              <path
                                d="M 100 100 L 100 40 A 60 60 0 1 1 41.4 158.6 Z"
                                fill="#3b82f6"
                                style={{
                                  animation: 'drawSegment 2s ease-in-out forwards',
                                  transformOrigin: '100px 100px'
                                }}
                              />
                              {/* Completed viewings segment (2/5 = 40% = 144 degrees) */}
                              <path
                                d="M 100 100 L 41.4 158.6 A 60 60 0 0 1 100 40 Z"
                                fill="#10b981"
                                style={{
                                  animation: 'drawSegment 2s ease-in-out 0.5s forwards',
                                  transformOrigin: '100px 100px'
                                }}
                              />
                              
                              {/* Connecting lines extending from pie segments */}
                              {/* Line from blue segment pointing to "Upcoming: 3" text */}
                              <line x1="70.7" y1="29.3" x2="120" y2="20" stroke="#3b82f6" strokeWidth="2" />
                              <circle cx="120" cy="20" r="3" fill="#3b82f6" />
                              
                              {/* Line from green segment pointing to "Completed: 2" text */}
                              <line x1="41.4" y1="158.6" x2="30" y2="170" stroke="#10b981" strokeWidth="2" />
                              <circle cx="30" cy="170" r="3" fill="#10b981" />
                            </svg>
                            
                            {/* Labels positioned outside the SVG */}
                            <div className="absolute top-2 right-2">
                              <span className="text-xs font-medium text-blue-600">Upcoming: 3</span>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <span className="text-xs font-medium text-green-600">Completed: 2</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Saved Searches Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-lg font-semibold"
            style={{ color: '#374957' }}
          >
            Saved Searches
          </h2>
          <Link 
            to="/dashboard/saved-searches" 
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Go to saved searches →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSearches.map((search) => (
            <div key={search.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={search.image} 
                  alt={search.address} 
                  className="w-full h-full object-cover" 
                />
                {/* Heart Icon */}
                <div className="absolute top-3 right-3">
                  <div className="bg-white bg-opacity-80 rounded-full p-1">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </div>
                </div>
              </div>
              
              {/* Property Details */}
              <div className="p-4">
                {/* Address */}
                <h3 className="text-base font-bold text-gray-800 mb-1 truncate">
                  {search.address}
                </h3>
                
                {/* Property Type */}
                <p className="text-xs text-gray-600 mb-3 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  London · {search.propertyType}
                </p>
                
                {/* Price */}
                <div className="flex items-center text-lg font-bold text-gray-900 mb-3">
                  {formatCurrency(search.price)}
                  <span className="text-sm text-gray-500 ml-1">/month</span>
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {search.features.slice(0, 3).map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 cursor-pointer transition-colors"
                    >
                      {feature}
                    </span>
                  ))}
                  {search.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 cursor-pointer transition-colors">
                      +{search.features.length - 3} more
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Properties Section */}
      {/* <div className="bg-white p-6 rounded-xl border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Saved Properties</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedProperties.slice(0, 3).map((property) => (
            <div key={property.id} className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <img src="/images/detached-house.jpg" alt={property.address} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-500 text-white">
                    Occupied
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">{property.address}</h3>
                <p className="text-sm text-gray-500 flex items-center mb-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.city} • {property.bedrooms} beds
                </p>
                <div className="flex items-center text-lg font-bold text-gray-900 mb-4">
                  <PoundSterling className="w-4 h-4 mr-1" />
                  {formatCurrency(property.price)}
                  <span className="text-sm text-gray-500 ml-1">/month</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/properties/${property.id}`} className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 mr-2" />View
                  </Link>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {savedProperties.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No saved properties found.</p>
            </div>
        )}
      </div>
      </div> */}

      {/* Upcoming Viewings Section */}
      {/* <div className="bg-white p-6 rounded-xl border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Viewings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingViewings.slice(0, 2).map((viewing) => (
            <div key={viewing.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <Calendar className="w-6 h-6 text-blue-500 mr-4" />
              <div>
                <p className="text-md font-medium text-gray-800">{viewing.propertyAddress}</p>
                <p className="text-sm text-gray-600">{formatDate(viewing.date)} at {viewing.time}</p>
              </div>
              <Link to={`/viewings/${viewing.id}`} className="ml-auto px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
                Details
              </Link>
            </div>
          ))}
          {upcomingViewings.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No upcoming viewings scheduled.</p>
            </div>
          )}
        </div>
      </div> */}

      {/* Contracts and Documents Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contracts Overview */}
        <div className="p-6 border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#374957' }}
            >
              Contracts
            </h2>
            <Link 
              to="/dashboard/contracts" 
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Go to Contracts →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Requested Contracts */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {dashboardSummary?.contracts.requested || 0}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Requested Contracts
              </div>
              <Link 
                to="/dashboard/tenant-contracts?status=requested" 
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                View Requested
              </Link>
            </div>
            
            {/* Signed Contracts */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {dashboardSummary?.contracts.total || 1}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Signed Contracts
              </div>
              <Link 
                to="/dashboard/tenant-contracts?status=signed" 
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View Signed
              </Link>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="p-6 border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#374957' }}
            >
              Documents
            </h2>
            <Link 
              to="/dashboard/documents" 
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Go to Documents →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {files.slice(0, 2).map((file) => (
              <div
                key={file.id}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {file.name}
                    </h3>
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      {formatFileSize(file.size)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded {file.uploadDate}
                    </p>
                  </div>
                </div>
                <button 
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referencing Modal */}
      {isReferencingModalOpen && (
        <ReferencingProvider propertyId={selectedPropertyId}>
          <ReferencingModalWithStep 
            open={isReferencingModalOpen}
            onClose={closeReferencingModal}
            propertyId={selectedPropertyId}
            initialStep={referencingStep}
          />
        </ReferencingProvider>
      )}
    </div>
  );
};

// Helper component to set the initial step in the modal
const ReferencingModalWithStep: React.FC<{
  open: boolean;
  onClose: () => void;
  propertyId: string;
  initialStep: number;
}> = ({ open, onClose, propertyId, initialStep }) => {
  const { setCurrentStep } = useReferencing();

  React.useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
    }
  }, [open, initialStep, setCurrentStep]);

  return (
    <ReferencingModal
      open={open}
      onClose={onClose}
      propertyId={propertyId}
    />
  );
};

export default DashboardHome; 