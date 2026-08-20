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
import ReferencingModal from '../../ReferencingModalLegacy';
import { firestoreService } from '../../../services/firestoreService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSavedProperties } from '../../../contexts/SavedPropertiesContext';
import { fileService, FileItem } from '../../../services/fileService';
import { contractService } from '../../../services/contractService';
import { useSignedContracts } from '../../../contexts/SignedContractsContext';
import { viewingService, ViewingStats } from '../../../services/viewingService';
import FilePreviewModal from './FilePreviewModal';
import { useIsMobile } from '../ui/use-mobile';
import { trackEvent } from '../../../utils/analytics';
import AgentQuotaWidget from '../AgentQuotaWidget';

/**
 * Main dashboard home page component following the style guide
 */
const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedProperties } = useSavedProperties();
  const { signedContracts } = useSignedContracts();
  const isMobile = useIsMobile();
  
  // State for referencing modal
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [referencingStep, setReferencingStep] = useState(1);
  // Referencing is scoped to the user (no specific property selected from dashboard)
  // The actual propertyId is derived from user.id so data is never shared across tenants.
  const selectedPropertyId = user?.id ? `general_${user.id}` : null;
  
  // State for files
  const [files, setFiles] = useState<FileItem[]>([]);
  const [referencingFiles, setReferencingFiles] = useState<FileItem[]>([]);
  const [contractFiles, setContractFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewingStats, setViewingStats] = useState<ViewingStats>({
    upcoming: 0,
    completed: 0,
    rescheduled: 0,
    total: 0
  });
  
  // Get the user ID from auth context
  const userId = user?.id ?? null;
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [referencingStartedAt, setReferencingStartedAt] = useState<string | null>(null);

  React.useEffect(() => {
    trackEvent('tenant_dashboard_home_view', {
      user_id_present: Boolean(userId),
    });
  }, [userId]);
  
  // Load files on component mount
  React.useEffect(() => {
    loadFiles();
    loadViewingStats();
  }, [user?.id]);
  
  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      
      // Set current user in fileService
      fileService.setCurrentUser(user?.id || null);
      
      // Load regular files from fileService
      const loadedFiles = await fileService.getFiles();
      setFiles(loadedFiles);
      
      // Load referencing files from Firestore
      if (user?.id) {
        await loadReferencingFiles();
        await loadContractFiles();
      }
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setFilesLoading(false);
    }
  };
  
  const loadReferencingFiles = async () => {
    try {
      if (!user?.id) return;
      
      const propertyId = `general_${user.id}`;
      const result = await firestoreService.getReferencingForm(user.id, propertyId);
      
      if (result.success && result.data) {
        const referencingFilesList: FileItem[] = [];
        const formData = result.data.formData;
        
        // Extract files from each section
        const sections = [
          { section: 'identity', field: 'identityProof', category: 'Identity' },
          { section: 'employment', field: 'proofDocument', category: 'Employment' },
          { section: 'residential', field: 'proofDocument', category: 'Residential' },
          { section: 'financial', field: 'proofOfIncomeDocument', category: 'Financial' },
          { section: 'guarantor', field: 'identityDocument', category: 'Guarantor' }
        ];
        
        sections.forEach(({ section, field, category }) => {
          const sectionData = (formData as Record<string, any>)[section];
          if (sectionData && sectionData[field]) {
            const document = sectionData[field];
            if (document && (document.name || document.url || document.dataUrl) && (document.dataUrl || document.url)) {
              referencingFilesList.push({
                id: Date.now() + Math.random(), // Generate unique ID
                name: document.name || `${category} Document`,
                category,
                type: document.type || 'application/pdf',
                size: document.size || 0,
                uploadDate: new Date(document.lastModified || Date.now()).toLocaleDateString(),
                url: document.dataUrl || document.url // Use dataUrl or Firebase Storage url
              });
            }
          }
        });
        
        setReferencingFiles(referencingFilesList);
      }
    } catch (error) {
      console.error('Error loading referencing files:', error);
    }
  };

  const loadContractFiles = async () => {
    try {
      if (!user?.id) return;
      
      console.log('Loading contract files for dashboard');
      const result = await contractService.getUserContractTemplates(user.id);
      
      if (result.success && result.templates) {
        const contractFilesList: FileItem[] = result.templates.map((contract, index) => ({
          id: Date.now() + Math.random() + index as number, // Generate numeric ID
          name: contract.name,
          category: 'Contracts',
          type: contract.fileType,
          size: contract.fileSize,
          uploadDate: contract.uploadDate,
          url: contract.fileUrl || `data:${contract.fileType};base64,${contract.fileData}`,
          firestoreId: contract.id
        }));
        
        setContractFiles(contractFilesList);
        console.log(`Loaded ${contractFilesList.length} contract files for dashboard`);
      }
    } catch (error) {
      console.error('Error loading contract files:', error);
    }
  };



  const loadViewingStats = async () => {
    try {
      if (!user?.id) return;
      
      console.log('Loading viewing stats for dashboard');
      const result = await viewingService.getViewingStats(user.id);
      
      if (result.success && result.stats) {
        setViewingStats(result.stats);
        console.log(`Loaded viewing stats:`, result.stats);
      }
    } catch (error) {
      console.error('Error loading viewing stats:', error);
    }
  };
  
  // Handle file viewing
  const handleView = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };
  
  // Handle file download
  const handleDownload = async (file: FileItem) => {
    try {
      await fileService.downloadFile(file);
    } catch (err) {
      console.error('Download error:', err);
    }
  };
  
  // Calculate remaining forms and alert status
  // 5 passport sections: Identity (1), Employment (2), Residential (3), Financial (4), Guarantor (5)
  const REFERENCING_STEPS = [1, 2, 3, 4, 5] as const;
  const totalSections = REFERENCING_STEPS.length;
  const completedCount = completedSections.size;
  const remainingCount = totalSections - completedCount;
  const allCompleted = completedCount === totalSections;
  
  // Load referencing completion status from the backend (scoped to this user)
  React.useEffect(() => {
    const loadFormStatus = async () => {
      if (!userId || !selectedPropertyId) return;
      try {
        const firestoreResult = await firestoreService.getReferencingForm(userId, selectedPropertyId);
        if (firestoreResult.success && firestoreResult.data) {
          const formData = firestoreResult.data.formData;
          // Capture when the form was first started for due-date computation
          const createdAt = (firestoreResult.data as any).createdAt;
          if (createdAt) {
            const ts = createdAt?.toDate?.() ?? createdAt?._seconds
              ? new Date(createdAt._seconds * 1000)
              : typeof createdAt === 'string' ? new Date(createdAt) : null;
            if (ts) setReferencingStartedAt(ts.toISOString());
          }

          const completed = new Set<string>();

          if (formData.identity?.firstName && formData.identity?.lastName && formData.identity?.email) {
            completed.add('identity');
          }
          if (formData.employment?.employmentStatus) {
            completed.add('employment');
          }
          if (formData.residential?.currentAddress) {
            completed.add('residential');
          }
          if (formData.financial?.proofOfIncomeType?.trim()) {
            completed.add('financial');
          }
          if (
            formData.guarantor?.firstName?.trim() &&
            formData.guarantor?.lastName?.trim() &&
            formData.guarantor?.email?.trim()
          ) {
            completed.add('guarantor');
          }
          setCompletedSections(completed);
        }
      } catch (error) {
        console.error('Error loading referencing form status:', error);
      }
    };

    loadFormStatus();
  }, [userId, selectedPropertyId, isReferencingModalOpen]);
  
  // Function to open referencing modal at a specific step
  const openReferencingModal = (step: number) => {
    setReferencingStep(step);
    setIsReferencingModalOpen(true);
    trackEvent('tenant_dashboard_referencing_step_opened', {
      step,
    });
  };
  
  const closeReferencingModal = () => {
    setIsReferencingModalOpen(false);
  };

  /**
   * P3-1: Compute a human-readable due-date string based on when the form was started.
   * Each section is due 7 days after the form was first opened.
   * Returns null when the section is already complete or no start date is known.
   */
  const getDueDateLabel = (sectionKey: string): string | null => {
    if (completedSections.has(sectionKey)) return null;
    if (!referencingStartedAt) return 'Due date unknown';
    const startMs = new Date(referencingStartedAt).getTime();
    const dueMs = startMs + 7 * 24 * 60 * 60 * 1000; // 7 days
    const diffDays = Math.floor((Date.now() - dueMs) / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) {
      const remaining = Math.abs(diffDays);
      return remaining === 0 ? 'Due today' : `Due in ${remaining} day${remaining === 1 ? '' : 's'}`;
    }
    return `${diffDays} day${diffDays === 1 ? '' : 's'} past due date`;
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

  // Use real saved properties from context instead of mock data
  const savedSearches = savedProperties.map((property, index) => ({
    id: property.id,
    address: property.title,
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    price: property.price,
    features: [property.propertyType, `${property.bedrooms} Bedrooms`],
    image: property.imageUrls?.[0] || '/images/detached-house.jpg'
  }));

  // Mock data for now since we removed the hook dependency
  const dashboardSummary = {
    savedSearches: { count: savedProperties.length }, // Use real count from SavedPropertiesContext
    viewings: { upcoming: 5, total: 8 }, // 5 upcoming from Viewings page
    referencing: { completedSteps: completedCount, totalSteps: 6 }, // Dynamic count based on actual completion
    contracts: { pending: 0, total: signedContracts.length, requested: 0 }, // Use actual signed contracts count
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

  const mockSavedProperties = [
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

  // Combine regular files, referencing files, and contract files, then get the last 2
  const allFiles = [...files, ...referencingFiles, ...contractFiles];
  const recentFiles = allFiles
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 2);

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatFileSize = (bytes: number) => {
    return fileService.formatFileSize(bytes);
  };
  
  // Get file type icon based on file extension
  const getFileTypeIcon = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType === 'application/pdf' || extension === 'pdf') {
      return <FileTextIcon className="w-5 h-5 text-red-600" />;
    } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileTextIcon className="w-5 h-5 text-blue-600" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileTextIcon className="w-5 h-5 text-blue-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-600" />;
    }
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

  // Helper function to generate arc path for pie chart
  const createArcPath = (startAngle: number, endAngle: number, radius: number = 60): string => {
    // Handle full circle case
    if (Math.abs(endAngle - startAngle) >= 360) {
      return `M 100 100 m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0 Z`;
    }
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + radius * Math.cos(startAngleRad);
    const y1 = 100 + radius * Math.sin(startAngleRad);
    const x2 = 100 + radius * Math.cos(endAngleRad);
    const y2 = 100 + radius * Math.sin(endAngleRad);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Helper function to calculate pie chart angles
  const calculatePieChartSegments = () => {
    const total = viewingStats.total || 0;
    const upcoming = viewingStats.upcoming || 0;
    const completed = viewingStats.completed || 0;
    const rescheduled = viewingStats.rescheduled || 0;

    if (total === 0) {
      return {
        upcomingPercentage: 0,
        completedPercentage: 0,
        upcomingStartAngle: -90,
        upcomingEndAngle: -90,
        completedStartAngle: -90,
        completedEndAngle: -90,
        rescheduledStartAngle: -90,
        rescheduledEndAngle: -90
      };
    }

    const upcomingPercentage = (upcoming / total) * 100;
    const completedPercentage = (completed / total) * 100;
    const rescheduledPercentage = (rescheduled / total) * 100;
    
    // Start from top (-90 degrees)
    const upcomingStartAngle = -90;
    const upcomingEndAngle = -90 + (upcoming / total) * 360;
    const completedStartAngle = upcomingEndAngle;
    const completedEndAngle = completedStartAngle + (completed / total) * 360;
    const rescheduledStartAngle = completedEndAngle;
    const rescheduledEndAngle = rescheduledStartAngle + (rescheduled / total) * 360;

    return {
      upcomingPercentage: Math.round(upcomingPercentage),
      completedPercentage: Math.round(completedPercentage),
      rescheduledPercentage: Math.round(rescheduledPercentage),
      upcomingStartAngle,
      upcomingEndAngle,
      completedStartAngle,
      completedEndAngle,
      rescheduledStartAngle,
      rescheduledEndAngle
    };
  };

  const pieSegments = calculatePieChartSegments();

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-4 px-4' : 'pb-8'}`} style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Overview Section */}
      <div className={isMobile ? 'mt-4' : 'mt-8'}>
        <h2 
          className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-6`}
          style={{ color: '#374957' }}
        >
          Overview
        </h2>

        <div className="mb-6">
          <AgentQuotaWidget />
        </div>
        
        {/* Summary Cards Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4 md:gap-6`}>
        {/* Saved Listings Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          {/* Row 1: Title and Icon */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Saved Listings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-orange-100 rounded-lg flex items-center justify-center`}>
              <Building2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {savedProperties.length}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>
              {savedProperties.length === 1 ? 'Saved property' : 'Saved properties'}
            </p>
          </div>
        </div>

      {/* Viewings Card */}
        <Link to="/dashboard/viewings" className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer`}>
          {/* Row 1: Title and Icon */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Viewings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <Eye className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {viewingStats.total || 0}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Total booked</p>
          </div>
        </Link>

      {/* Referencing Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          {/* Row 1: Title and Icon */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Referencing</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {dashboardSummary?.referencing.completedSteps || completedCount}/{dashboardSummary?.referencing.totalSteps || totalSections}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Complete</p>
          </div>
        </div>

        {/* Contracts Card */}
        <Link to="/dashboard/tenant-contracts" className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer`}>
          {/* Row 1: Title and Icon */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Contracts</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-yellow-100 rounded-lg flex items-center justify-center`}>
              <Users className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`} />
            </div>
          </div>
          
          {/* Row 2: Number */}
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {signedContracts.length || 0}
            </p>
          </div>
          
          {/* Row 3: Subtitle */}
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Signed Contracts</p>
          </div>
        </Link>
        </div>
      </div>

      {/* Tenant Insights Section */}
      <div>
        <div className={`flex items-center gap-2 ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: '#374957' }} />
          <h2 
            className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}
            style={{ color: '#374957' }}
          >
            Tenant Insights
          </h2>
        </div>
        
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-4' : 'gap-8'} ${isMobile ? 'mb-6' : 'mb-8'}`}>
        {/* Referencing Card */}
        <div
          className="shadow-sm overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
            border: '1px solid #80B2FF',
            height: isMobile ? 'auto' : '320px',
            minHeight: isMobile ? '280px' : '320px',
            borderRadius: '20px'
          }}
        >
          <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
            {/* Left Blue Panel */}
            <div
              className={`${isMobile ? 'p-4 flex-row items-center justify-between' : 'p-6 flex-col items-start min-w-[200px]'} flex`}
              style={{
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                color: '#374957'
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-white rounded-full flex items-center justify-center`}>
                  <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                </div>
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                  {isMobile ? 'Referencing' : 'Referencing'}
                </h2>
              </div>
              {!isMobile && <div className="mt-auto"></div>}
              <div className={isMobile ? '' : 'mt-auto'}>
                <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-blue-800`}>
                  {allCompleted ? 6 : remainingCount}
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
                  {allCompleted ? 'Success' : 'Alerts'}
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-75`}>
                  {allCompleted 
                    ? 'All forms completed!' 
                    : 'Between 25 Nov - 2 Dec 2024'
                  }
                </div>
              </div>
            </div>

            {/* Right White Panel */}
            <div
              className={`flex-1 p-4 bg-white ${isMobile ? 'rounded-b-xl' : ''}`}
              style={{
                borderRadius: isMobile ? '0 0 20px 20px' : '20px',
                boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(70, 95, 194, 0.4)',
                overflow: 'hidden'
              }}
            >
              <div className={`flex justify-end ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <Link to="/dashboard/tenant-referencing" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:underline`}>
                  {isMobile ? 'Go to Referencing →' : 'Go to Referencing →'}
                </Link>
              </div>
              <div 
                className={`space-y-3 ${isMobile ? 'max-h-64' : 'max-h-56'} overflow-y-auto thin-scrollbar pb-4`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 transparent'
                }}
              >
                {/* Identity */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-0 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1`}>
                      {completedSections.has('identity') ? (
                        <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600 mt-1`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-orange-600 mt-1`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${isMobile ? 'text-xs' : 'text-sm'} ${
                          completedSections.has('identity') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Identity
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                          {completedSections.has('identity') 
                            ? 'Identity verification completed' 
                            : 'Upload your identity documents'}
                        </p>
                        {!completedSections.has('identity') && (
                          <div className="flex items-baseline space-x-3">
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-orange-600`}>
                              {getDueDateLabel('identity') ?? ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(1)}
                      className={`border rounded ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'} transition-colors ${
                        completedSections.has('identity')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold ${
                        completedSections.has('identity') ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isMobile ? (completedSections.has('identity') ? 'Edit' : 'View') : (completedSections.has('identity') ? 'Edit' : 'View More')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Employment Reference */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-0 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1`}>
                      {completedSections.has('employment') ? (
                        <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600 mt-1`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-orange-600 mt-1`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${isMobile ? 'text-xs' : 'text-sm'} ${
                          completedSections.has('employment') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Employment
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                          {completedSections.has('employment') 
                            ? 'Employment details completed' 
                            : 'Fill in your employment details'}
                        </p>
                        {!completedSections.has('employment') && (
                          <div className="flex items-baseline space-x-3">
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-orange-600`}>
                              {getDueDateLabel('employment') ?? ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(2)}
                      className={`border rounded ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'} transition-colors ${
                        completedSections.has('employment')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold ${
                        completedSections.has('employment') ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isMobile ? (completedSections.has('employment') ? 'Edit' : 'View') : (completedSections.has('employment') ? 'Edit' : 'View More')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Guarantor Information */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-0 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1`}>
                      {completedSections.has('guarantor') ? (
                        <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600 mt-1`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-red-600 mt-1`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${isMobile ? 'text-xs' : 'text-sm'} ${
                          completedSections.has('guarantor') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Guarantor
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                          {completedSections.has('guarantor') 
                            ? 'Guarantor information completed' 
                            : 'Additional steps required'}
                        </p>
                        {!completedSections.has('guarantor') && (
                          <div className="flex items-baseline space-x-3">
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-red-600`}>
                              {getDueDateLabel('guarantor') ?? ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(5)}
                      className={`border rounded ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'} transition-colors ${
                        completedSections.has('guarantor')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold ${
                        completedSections.has('guarantor') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isMobile ? (completedSections.has('guarantor') ? 'Edit' : 'View') : (completedSections.has('guarantor') ? 'Edit' : 'View More')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Residential */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-0 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1`}>
                      {completedSections.has('residential') ? (
                        <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600 mt-1`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-600 mt-1`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${isMobile ? 'text-xs' : 'text-sm'} ${
                          completedSections.has('residential') ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          Residential
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                          {completedSections.has('residential') 
                            ? 'Residential history completed' 
                            : 'Provide residential history'}
                        </p>
                        {!completedSections.has('residential') && (
                          <div className="flex items-baseline space-x-3">
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-yellow-600`}>
                              {getDueDateLabel('residential') ?? ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(3)}
                      className={`border rounded ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'} transition-colors ${
                        completedSections.has('residential')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-yellow-300 hover:bg-yellow-50'
                      }`}
                    >
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold ${
                        completedSections.has('residential') ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {isMobile ? (completedSections.has('residential') ? 'Edit' : 'View') : (completedSections.has('residential') ? 'Edit' : 'View More')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Financial */}
                <div className={`${isMobile ? 'p-3' : 'p-4'} border-0 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1`}>
                      {completedSections.has('financial') ? (
                        <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600 mt-1`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600 mt-1`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${isMobile ? 'text-xs' : 'text-sm'} ${
                          completedSections.has('financial') ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          Financial
                        </h4>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                          {completedSections.has('financial') 
                            ? 'Financial documents completed' 
                            : 'Submit financial documents'}
                        </p>
                        {!completedSections.has('financial') && (
                          <div className="flex items-baseline space-x-3">
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-blue-600`}>
                              {getDueDateLabel('financial') ?? ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => openReferencingModal(4)}
                      className={`border rounded ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'} transition-colors ${
                        completedSections.has('financial')
                          ? 'border-green-300 hover:bg-green-50'
                          : 'border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold ${
                        completedSections.has('financial') ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {isMobile ? (completedSections.has('financial') ? 'Edit' : 'View') : (completedSections.has('financial') ? 'Edit' : 'View More')}
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
            height: isMobile ? 'auto' : '320px',
            minHeight: isMobile ? '280px' : '320px',
            borderRadius: '20px'
          }}
        >
          <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
            {/* Left Blue Panel */}
            <div
              className={`${isMobile ? 'p-4 flex-row items-center justify-between' : 'p-6 flex-col items-start min-w-[200px]'} flex`}
              style={{
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                color: '#374957'
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-white rounded-full flex items-center justify-center`}>
                  <Eye className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                </div>
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Viewing</h2>
              </div>
              {!isMobile && <div className="mt-auto"></div>}
              <div className={isMobile ? '' : 'mt-auto'}>
                <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-blue-800`}>{viewingStats.total || 0}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>Summary</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-75`}>{viewingStats.upcoming || 0} upcoming, {viewingStats.completed || 0} completed</div>
              </div>
            </div>

            {/* Right White Panel */}
            <div
              className={`flex-1 p-4 bg-white relative ${isMobile ? 'rounded-b-xl' : ''}`}
              style={{
                borderRadius: isMobile ? '0 0 20px 20px' : '20px',
                boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(70, 95, 194, 0.4)'
              }}
            >
              <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} z-10`}>
                <Link 
                  to="/dashboard/viewings" 
                  className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:underline cursor-pointer`}
                >
                  {isMobile ? 'Go to viewings →' : 'Go to viewings →'}
                </Link>
              </div>
                    <div className={`flex items-center justify-center ${isMobile ? 'h-48' : 'h-full'}`}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Animated Pie Chart */}
                        <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-40 h-40'}`}>
                          <div className={`relative ${isMobile ? 'w-40 h-40' : 'w-48 h-48'}`} style={{ zIndex: 10 }}>
                            {viewingStats.total > 0 ? (
                              <svg className={`${isMobile ? 'w-40 h-40' : 'w-48 h-48'}`} viewBox="0 0 200 200" style={{ zIndex: 10 }}>
                                {/* Pie chart segments - Upcoming viewings */}
                                {viewingStats.upcoming > 0 && (
                                  <path
                                    d={createArcPath(pieSegments.upcomingStartAngle, pieSegments.upcomingEndAngle)}
                                    fill="#3b82f6"
                                    style={{
                                      animation: 'drawSegment 2s ease-in-out forwards',
                                      transformOrigin: '100px 100px'
                                    }}
                                  />
                                )}
                                {/* Completed viewings */}
                                {viewingStats.completed > 0 && (
                                  <path
                                    d={createArcPath(pieSegments.completedStartAngle, pieSegments.completedEndAngle)}
                                    fill="#10b981"
                                    style={{
                                      animation: 'drawSegment 2s ease-in-out 0.5s forwards',
                                      transformOrigin: '100px 100px'
                                    }}
                                  />
                                )}
                                {/* Rescheduled viewings */}
                                {viewingStats.rescheduled > 0 && (
                                  <path
                                    d={createArcPath(pieSegments.rescheduledStartAngle, pieSegments.rescheduledEndAngle)}
                                    fill="#f59e0b"
                                    style={{
                                      animation: 'drawSegment 2s ease-in-out 0.75s forwards',
                                      transformOrigin: '100px 100px'
                                    }}
                                  />
                                )}
                              </svg>
                            ) : (
                              <svg className={`${isMobile ? 'w-40 h-40' : 'w-48 h-48'}`} viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="60" fill="#e5e7eb" />
                                <text x="100" y="110" textAnchor="middle" className={`${isMobile ? 'text-xs' : 'text-sm'} fill-gray-500`}>No data</text>
                              </svg>
                            )}
                            
                            {/* Labels positioned outside the SVG */}
                            {!isMobile && (
                              <>
                                <div className="absolute top-2 right-2" style={{ zIndex: 20 }}>
                                  <span className="text-xs font-medium text-blue-600">
                                    Upcoming: {viewingStats.upcoming || 0} ←
                                  </span>
                                </div>
                                <div className="absolute bottom-2 left-2" style={{ zIndex: 20 }}>
                                  <span className="text-xs font-medium text-green-600">
                                    Completed: {viewingStats.completed || 0} →
                                  </span>
                                </div>
                              </>
                            )}
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
      <div className={isMobile ? 'p-4' : 'p-6'}>
        <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <h2 
            className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}
            style={{ color: '#374957' }}
          >
            Saved Searches
          </h2>
          <Link 
            to="/dashboard/saved-searches" 
            className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:underline`}
          >
            {isMobile ? 'View all →' : 'Go to saved searches →'}
          </Link>
        </div>
        
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
          {savedSearches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Properties</h3>
              <p className="text-gray-600 mb-4">Start saving properties you like from your search results.</p>
              <button 
                className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#E65D24' }}
                onClick={() => window.location.href = '/'}
              >
                Browse Properties
              </button>
            </div>
          ) : (
            savedSearches.slice(0, 3).map((search) => (
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
                    {search.price}
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
            ))
          )}
        </div>
      </div>


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
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} ${isMobile ? 'gap-4' : 'gap-8'}`}>
        {/* Contracts Overview */}
        <div className={`${isMobile ? 'p-4' : 'p-6'} border border-gray-200 rounded-xl`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 
              className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}
              style={{ color: '#374957' }}
            >
              Contracts
            </h2>
            <Link 
              to="/dashboard/contracts" 
              className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:underline`}
            >
              {isMobile ? 'View all →' : 'Go to Contracts →'}
            </Link>
          </div>
          
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-4'}`}>
            {/* Requested Contracts */}
            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white rounded-lg border border-gray-200`}>
              <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                {dashboardSummary?.contracts.requested || 0}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Requested Contracts
              </div>
              <Link 
                to="/dashboard/tenant-contracts?status=requested" 
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 hover:text-gray-800 transition-colors`}
              >
                View Requested
              </Link>
            </div>
            
            {/* Signed Contracts */}
            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-blue-50 rounded-lg border border-blue-200`}>
              <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                 {signedContracts.length || 0}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Signed Contracts
              </div>
              <Link 
                to="/dashboard/tenant-contracts" 
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800 transition-colors`}
              >
                View Signed
              </Link>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className={`${isMobile ? 'p-4' : 'p-6'} border border-gray-200 rounded-xl`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 
              className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}
              style={{ color: '#374957' }}
            >
              Documents
            </h2>
            <Link 
              to="/dashboard/your-files" 
              className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-600 hover:underline`}
            >
              {isMobile ? 'View all →' : 'Go to Documents →'}
            </Link>
          </div>
          
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-4'}`}>
            {filesLoading ? (
              <div className="col-span-2 text-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : recentFiles.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents found</p>
                <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
              </div>
            ) : (
              recentFiles.map((file) => (
                <div
                  key={file.id}
                  className={`${isMobile ? 'p-3' : 'p-4'} bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow`}
                >
                  <div className={`flex items-start space-x-3 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-100 rounded-md flex items-center justify-center`}>
                      {getFileTypeIcon(file.name, file.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-800 ${isMobile ? 'mb-1' : 'mb-1'} truncate`}>
                        {file.name}
                      </h3>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-orange-600 font-medium ${isMobile ? 'mb-1' : 'mb-1'}`}>
                        {formatFileSize(file.size)}
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                        Uploaded {file.uploadDate}
                      </p>
                    </div>
                  </div>
                  <button 
                    className={`w-full flex items-center justify-center ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} border border-gray-300 rounded-lg ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 hover:bg-gray-50 transition-colors`}
                    onClick={() => handleView(file)}
                  >
                    <Eye className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
                    {!isMobile && <span>View</span>}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Referencing Modal */}
      {isReferencingModalOpen && selectedPropertyId && (
        <ReferencingModal
          isOpen={isReferencingModalOpen}
          onClose={closeReferencingModal}
          initialStep={referencingStep}
          singleSectionOnly={true}
          onSubmissionComplete={() => {
            // refresh data
          }}
        />
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onDownload={handleDownload}
      />
    </div>
  );
};


export default DashboardHome; 