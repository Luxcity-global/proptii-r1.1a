import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { DocumentUploadModal } from './DocumentUploadModal';
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  User,
  Home,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  UserCheck,
  Shield,
  CreditCard,
  MoreHorizontal,
  Trash2,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

import { Tenant } from '../App';
import { referencingService, ReferencingDocument } from '../services/referencingService';
import { paymentScheduleService, RentPaymentPeriod } from '../services/paymentScheduleService';
import { tenantService } from '../services/tenantService';
import { useTenantDetails } from '../hooks/useTenantDetails';

interface TenantReference {
  id: string;
  type: 'employment' | 'previous-landlord' | 'personal' | 'financial';
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'pending' | 'received' | 'satisfactory' | 'unsatisfactory';
  dateRequested: Date;
  dateReceived?: Date;
  notes?: string;
}

interface RentPayment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paymentMethod?: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  dateReported: Date;
  dateCompleted?: Date;
  category: 'plumbing' | 'electrical' | 'heating' | 'structural' | 'other';
}

interface TenantDocument {
  id: string;
  name: string;
  type: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'id-document' | 'other';
  dateUploaded: Date;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending';
  downloadUrl?: string;
  fileSize?: number;
  fileType?: string;
}

interface TenantDetailsProps {
  tenant: Tenant | null;
  onBack: () => void;
  onEdit?: (tenant: Tenant) => void;
  onTenantUpdate?: (tenant: Tenant) => void;
}

export function TenantDetails({ tenant, onBack, onEdit, onTenantUpdate }: TenantDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [referencingStatus, setReferencingStatus] = useState<'not-started' | 'in-progress' | 'complete'>('not-started');
  const [referencingData, setReferencingData] = useState<ReferencingDocument | null>(null);
  const [isLoadingReferencing, setIsLoadingReferencing] = useState(true);
  const [referencingDocuments, setReferencingDocuments] = useState<TenantDocument[]>([]);
  const [refereeResponses, setRefereeResponses] = useState<any[]>([]);
  const [guarantorResponses, setGuarantorResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);
  const [paymentPeriods, setPaymentPeriods] = useState<RentPaymentPeriod[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [updatingPayments, setUpdatingPayments] = useState<Record<string, boolean>>({});

  const { tenantDetails: liveTenant, isLoading: isLoadingTenant } = useTenantDetails(tenant?.id);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Tenant not found</h2>
          <Button onClick={onBack}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  // Fetch real referencing data from Firestore
  useEffect(() => {
    const fetchReferencingStatus = async () => {
      if (!tenant.email) {
        console.warn('[TenantDetails] No email found for tenant, skipping referencing check');
        setIsLoadingReferencing(false);
        return;
      }

      setIsLoadingReferencing(true);
      console.log(`[TenantDetails] Fetching referencing status for: ${tenant.email}`);
      
      const result = await referencingService.getReferencingStatusByEmail(tenant.email);
      
      console.log('[TenantDetails] Referencing result:', result);
      
      setReferencingStatus(result.status);
      setReferencingData(result.data || null);
      setIsLoadingReferencing(false);
    };

    fetchReferencingStatus();
  }, [tenant.email]);

  // Extract referencing documents from Firestore data
  useEffect(() => {
    if (!referencingData || !referencingData.formData) {
      setReferencingDocuments([]);
      return;
    }

    const docs: TenantDocument[] = [];
    const formData = referencingData.formData;

    // Identity Proof
    if (formData.identity?.identityProof) {
      docs.push({
        id: 'ref-identity',
        name: `Identity Document - ${formData.identity.identityProof.name}`,
        type: 'id-document',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.identity.identityProof.dataUrl,
        fileSize: formData.identity.identityProof.size,
        fileType: formData.identity.identityProof.type
      });
    }

    // Employment Proof
    if (formData.employment?.proofDocument) {
      docs.push({
        id: 'ref-employment',
        name: `Employment Proof - ${formData.employment.proofDocument.name}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.employment.proofDocument.dataUrl,
        fileSize: formData.employment.proofDocument.size,
        fileType: formData.employment.proofDocument.type
      });
    }

    // Residential Proof
    if (formData.residential?.proofDocument) {
      docs.push({
        id: 'ref-residential',
        name: `Proof of Address - ${formData.residential.proofDocument.name}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.residential.proofDocument.dataUrl,
        fileSize: formData.residential.proofDocument.size,
        fileType: formData.residential.proofDocument.type
      });
    }

    // Financial Proof
    if (formData.financial?.proofOfIncomeDocument) {
      docs.push({
        id: 'ref-financial',
        name: `Proof of Income - ${formData.financial.proofOfIncomeDocument.name}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.financial.proofOfIncomeDocument.dataUrl,
        fileSize: formData.financial.proofOfIncomeDocument.size,
        fileType: formData.financial.proofOfIncomeDocument.type
      });
    }

    // Guarantor Identity Document
    if (formData.guarantor?.identityDocument) {
      docs.push({
        id: 'ref-guarantor',
        name: `Guarantor ID - ${formData.guarantor.identityDocument.name}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.guarantor.identityDocument.dataUrl,
        fileSize: formData.guarantor.identityDocument.size,
        fileType: formData.guarantor.identityDocument.type
      });
    }

    console.log(`[TenantDetails] Extracted ${docs.length} referencing documents`);
    setReferencingDocuments(docs);
  }, [referencingData]);

  // Fetch referee and guarantor responses from Firestore (no backend needed)
  useEffect(() => {
    const fetchRefereeGuarantorResponses = async () => {
      if (!tenant.email) {
        console.warn('[TenantDetails] No email found for tenant, skipping response fetch');
        setIsLoadingResponses(false);
        return;
      }

      setIsLoadingResponses(true);
      console.log(`[TenantDetails] Fetching referee/guarantor responses for: ${tenant.email}`);

      try {
        // Fetch directly from Firestore using referencingService
        const result = await referencingService.getRefereeGuarantorResponses(tenant.email);
        
        if (result.success) {
          console.log('[TenantDetails] Referee/Guarantor responses:', result);
          setRefereeResponses(result.refereeResponses || []);
          setGuarantorResponses(result.guarantorResponses || []);
        } else {
          console.error('[TenantDetails] Failed to fetch responses:', result.error);
        }
      } catch (error) {
        console.error('[TenantDetails] Error fetching responses:', error);
      } finally {
        setIsLoadingResponses(false);
      }
    };

    fetchRefereeGuarantorResponses();
  }, [tenant.email]);

  // Subscribe to payment periods in real-time
  useEffect(() => {
    if (!tenant?.id) {
      console.warn('[TenantDetails] No tenant ID, skipping payment subscription');
      setIsLoadingPayments(false);
      return;
    }

    console.log('🔍 [TenantDetails] Setting up payment periods subscription:', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      paymentFrequency: tenant.paymentFrequency,
      firstPaymentDate: tenant.firstPaymentDate,
      rentAmount: tenant.rentAmount,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd
    });

    setIsLoadingPayments(true);
    console.log('[TenantDetails] Subscribing to payment periods for tenant:', tenant.id);

    // Subscribe to real-time updates
    const unsubscribe = paymentScheduleService.subscribeToTenantPeriods(
      tenant.id,
      (periods) => {
        console.log('✅ [TenantDetails] Payment periods updated:', periods.length);
        if (periods.length === 0) {
          console.warn('⚠️ [TenantDetails] Received 0 payment periods - schedule may not be generated yet');
        } else {
          console.log('✅ [TenantDetails] First period:', {
            dueDate: periods[0].dueDate,
            amount: periods[0].amountDue,
            status: periods[0].status
          });
        }
        setPaymentPeriods(periods);
        setIsLoadingPayments(false);
      },
      (error) => {
        console.error('❌ [TenantDetails] Error subscribing to payment periods:', error);
        console.error('❌ [TenantDetails] Error details:', {
          code: (error as any)?.code,
          message: error.message,
          stack: error.stack
        });
        setIsLoadingPayments(false);
      }
    );

    // Also generate schedule if it doesn't exist yet
    const ensureSchedule = async () => {
      try {
        console.log('🔍 [TenantDetails] Checking for existing payment periods...');
        const existingPeriods = await paymentScheduleService.getTenantPeriods(tenant.id);
        console.log('📊 [TenantDetails] Found', existingPeriods.length, 'existing periods');
        if (existingPeriods.length === 0) {
          console.log('📅 [TenantDetails] No payment periods found, generating schedule...');
          console.log('📅 [TenantDetails] Tenant data for generation:', {
            id: tenant.id,
            paymentFrequency: tenant.paymentFrequency,
            firstPaymentDate: tenant.firstPaymentDate,
            rentAmount: tenant.rentAmount,
            userId: (tenant as any)?.userId
          });
          await paymentScheduleService.generateScheduleForTenant(tenant, {
            historyPeriods: 6,
            futurePeriods: 12,
            managerId: (tenant as any)?.userId
          });
          console.log('✅ [TenantDetails] Schedule generation initiated');
        } else {
          console.log('✅ [TenantDetails] Payment schedule already exists');
        }
      } catch (error) {
        console.error('❌ [TenantDetails] Error ensuring payment schedule:', error);
        console.error('❌ [TenantDetails] Error details:', {
          code: (error as any)?.code,
          message: error.message,
          stack: error.stack
        });
      }
    };
    ensureSchedule();

    return () => {
      console.log('[TenantDetails] Unsubscribing from payment periods');
      unsubscribe();
    };
  }, [tenant?.id]);

  // Handle deleting a referee or guarantor response
  const handleDeleteResponse = async (responseId: string, responseType: 'referee' | 'guarantor') => {
    if (!window.confirm(`Are you sure you want to delete this ${responseType} response? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log(`[TenantDetails] Deleting ${responseType} response:`, responseId);
      
      const result = await referencingService.deleteResponse(responseId);
      
      if (result.success) {
        console.log(`✅ [TenantDetails] Successfully deleted ${responseType} response`);
        
        // Remove from local state immediately
        if (responseType === 'referee') {
          setRefereeResponses(prev => prev.filter(r => r.id !== responseId));
        } else {
          setGuarantorResponses(prev => prev.filter(r => r.id !== responseId));
        }
        
        // Optional: Show success message
        alert(`${responseType.charAt(0).toUpperCase() + responseType.slice(1)} response deleted successfully`);
      } else {
        console.error(`❌ [TenantDetails] Failed to delete ${responseType} response:`, result.error);
        alert(`Failed to delete response: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ [TenantDetails] Error deleting ${responseType} response:`, error);
      alert('An unexpected error occurred while deleting the response');
    }
  };

  // Merge real tenant data with live updates
  const displayTenant: any = {
    ...tenant,
    name: liveTenant?.name || tenant.name,
    email: liveTenant?.email || tenant.email,
    phone: liveTenant?.phone || tenant.phone,
    avatar: liveTenant?.avatar || tenant.avatar,
    status: liveTenant?.status || tenant.status,
    propertyAddress: liveTenant?.propertyAddress || 'Not assigned',
    depositAmount: liveTenant?.depositAmount || tenant.rentAmount * 1.5,
    monthlyRent: liveTenant?.rentAmount || tenant.rentAmount,
    rentAmount: liveTenant?.rentAmount || tenant.rentAmount,
    tenancyType: 'assured-shorthold',
    moveInDate: liveTenant?.leaseStart || tenant.leaseStart,
    leaseStart: liveTenant?.leaseStart || tenant.leaseStart,
    leaseEnd: liveTenant?.leaseEnd || tenant.leaseEnd,
    emergencyContact: liveTenant?.emergencyContact || undefined,
    notes: liveTenant?.notes || 'No notes available.',
    maintenanceRequests: [],
    documents: liveTenant?.documents || tenant.documents || []
  };

  // Convert payment periods to display format
  const rentPayments = paymentPeriods.map((period) => ({
    id: period.id,
    amount: period.amountDue,
    dueDate: period.dueDate,
    paidDate: period.paidAt,
    status: period.status === 'paid' ? 'paid' : period.status === 'overdue' ? 'overdue' : 'pending',
    paymentMethod: period.notes || undefined
  }));

  const upcomingPayments = paymentPeriods
    .filter((period) => {
      if (!period.dueDate) return false;
      if (period.status === 'paid') return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return period.dueDate.getTime() >= now.getTime();
    })
    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
    .slice(0, 3);

  const handleTogglePaymentStatus = async (periodId: string, currentStatus: string) => {
    if (updatingPayments[periodId]) {
      return;
    }

    setUpdatingPayments((prev) => ({ ...prev, [periodId]: true }));
    try {
      if (currentStatus === 'paid') {
        // Unmark as paid
        console.log('🔄 [TenantDetails] Unmarking payment as unpaid');
        await paymentScheduleService.unmarkPeriodPaid(periodId);
      } else {
        // Mark as paid
        const paidDate = new Date();
        await paymentScheduleService.markPeriodPaid(periodId, paidDate);
      }
      
      // Update tenant's payment status based on payment periods
      console.log('🔄 [TenantDetails] Updating tenant payment status after payment status change');
      const updatedPeriods = await paymentScheduleService.getTenantPeriods(tenant.id);
      
      // Find the most recent paid period
      const paidPeriods = updatedPeriods
        .filter(p => p.status === 'paid' && p.paidAt)
        .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0));
      
      const lastPaidPeriod = paidPeriods[0];
      const lastPaymentDate = lastPaidPeriod?.paidAt;
      
      // Check if there are any overdue periods
      const now = new Date();
      const overduePeriods = updatedPeriods.filter(p => {
        if (p.status === 'paid') return false;
        const periodEnd = p.periodEnd || p.dueDate;
        return periodEnd < now;
      });
      
      // Calculate overdue amount
      const overdueAmount = overduePeriods.reduce((sum, p) => sum + (p.amountDue || 0), 0);
      
      // Determine new payment status
      let newPaymentStatus: 'current' | 'overdue' | 'payment-plan' = 'current';
      if (overdueAmount > 0) {
        newPaymentStatus = 'overdue';
      } else if (tenant.paymentStatus === 'payment-plan') {
        newPaymentStatus = 'payment-plan';
      }
      
      // Update tenant record
      await tenantService.updateTenant(tenant.id, {
        lastPaymentDate,
        paymentStatus: newPaymentStatus,
        overdueAmount: overdueAmount > 0 ? overdueAmount : undefined
      });
      
      // Fetch updated tenant and notify parent
      const updatedTenant = await tenantService.getTenant(tenant.id);
      if (updatedTenant && onTenantUpdate) {
        onTenantUpdate(updatedTenant);
      }
      
      console.log('✅ [TenantDetails] Tenant payment status updated:', {
        lastPaymentDate,
        paymentStatus: newPaymentStatus,
        overdueAmount
      });
      
    } catch (error) {
      console.error('[TenantDetails] Error toggling payment status:', error);
      alert('Unable to update payment status. Please try again.');
    } finally {
      setUpdatingPayments((prev) => {
        const next = { ...prev };
        delete next[periodId];
        return next;
      });
    }
  };

  const handleDocumentUpload = (documentData: {
    name: string;
    type: string;
    file: File;
    expiryDate?: string;
  }) => {
    // Create new document object
    const newDocument: TenantDocument = {
      id: Date.now().toString(),
      name: documentData.name,
      type: documentData.type as TenantDocument['type'],
      dateUploaded: new Date(),
      expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
      status: 'valid'
    };

    // Add to displayTenant documents (in real app, this would be an API call)
    displayTenant.documents = [...(displayTenant.documents || []), newDocument];
    
    console.log('Document uploaded:', newDocument);
    // In a real app, you would call an API to save the document
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'satisfactory':
      case 'paid':
      case 'completed':
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
      case 'urgent':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'ended':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferencingStatusColor = (status: 'not-started' | 'in-progress' | 'complete') => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferencingStatusLabel = (status: 'not-started' | 'in-progress' | 'complete') => {
    switch (status) {
      case 'not-started':
        return 'Not yet started';
      case 'in-progress':
        return 'In progress';
      case 'complete':
        return 'Complete';
      default:
        return 'Unknown';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadDocument = (document: TenantDocument) => {
    if (!document.downloadUrl) {
      console.warn('No download URL available for document:', document.name);
      return;
    }

    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = document.downloadUrl;
      link.download = document.name || 'document';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Document download initiated:', document.name);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleViewDocument = (document: TenantDocument) => {
    if (!document.downloadUrl) {
      console.warn('No download URL available for document:', document.name);
      return;
    }

    try {
      // Open document in new tab
      window.open(document.downloadUrl, '_blank');
      console.log('Document opened in new tab:', document.name);
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  // Combine display documents with referencing documents
  const allDocuments = [...(displayTenant.documents || []), ...referencingDocuments];

  if (isLoadingTenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1776B6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" style={{ color: '#DC5F12' }} />
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  {displayTenant.avatar && <AvatarImage src={displayTenant.avatar} alt={displayTenant.name} />}
                  <AvatarFallback>
                    <User className="h-8 w-8" style={{ color: '#DC5F12' }} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="mb-1">{displayTenant.name}</h1>
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <Badge className={getStatusColor(displayTenant.status)}>
                      {displayTenant.status}
                    </Badge>
                    {isLoadingReferencing ? (
                      <Badge className="bg-gray-100 text-gray-800">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Checking referencing...
                      </Badge>
                    ) : (
                      <Badge className={getReferencingStatusColor(referencingStatus)}>
                        Referencing: {getReferencingStatusLabel(referencingStatus)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(displayTenant)}>
                  <Edit3 className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                  Edit
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="p-2">
                    <MoreHorizontal className="w-4 h-4" style={{ color: '#DC5F12' }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Mail className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Phone className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Call Tenant
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{displayTenant.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{displayTenant.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{displayTenant.propertyAddress}</span>
                  </div>
                  {displayTenant.emergencyContact && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium mb-2">Emergency Contact</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{displayTenant.emergencyContact.name} ({displayTenant.emergencyContact.relationship})</p>
                          <p>{displayTenant.emergencyContact.phone}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Tenancy Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2 text-muted-foreground" />
                    Tenancy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p>{formatCurrency(displayTenant.monthlyRent || displayTenant.rentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit</p>
                      <p>{formatCurrency(displayTenant.depositAmount || displayTenant.rentAmount * 1.5)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Lease Start</p>
                      <p>{formatDate(displayTenant.leaseStart)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lease End</p>
                      <p>{formatDate(displayTenant.leaseEnd)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Employment & Income
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referencingData?.formData?.employment || referencingData?.formData?.financial || referencingData?.formData?.residential ? (
                    <>
                      {referencingData.formData.employment?.companyDetails && (
                        <div>
                          <p className="text-sm text-muted-foreground">Employer</p>
                          <p>{referencingData.formData.employment.companyDetails}</p>
                        </div>
                      )}
                      {referencingData.formData.employment?.jobPosition && (
                        <div>
                          <p className="text-sm text-muted-foreground">Job Position</p>
                          <p>{referencingData.formData.employment.jobPosition}</p>
                        </div>
                      )}
                      {referencingData.formData.financial?.monthlyIncome && (
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Income</p>
                          <p>{formatCurrency(parseFloat(referencingData.formData.financial.monthlyIncome.replace(/[^\d.]/g, '')) || 0)}</p>
                          {referencingData.formData.financial.monthlyIncome && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Annual: {formatCurrency(parseFloat(referencingData.formData.financial.monthlyIncome.replace(/[^\d.]/g, '')) * 12 || 0)}
                            </p>
                          )}
                        </div>
                      )}
                      {referencingData.formData.residential?.previousAddress && (
                        <div>
                          <p className="text-sm text-muted-foreground">Previous Address</p>
                          <p className="text-sm">{referencingData.formData.residential.previousAddress}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-muted-foreground font-medium">No employment information available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Employment and income details will appear here once the tenant completes the referencing process.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PoundSterling className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <Badge className={tenant.paymentStatus === 'current' ? 'bg-green-100 text-green-800' : 
                                       tenant.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' : 
                                       'bg-orange-100 text-orange-800'}>
                        {tenant.paymentStatus === 'current' ? 'Payment Up-to-Date' : 
                         tenant.paymentStatus === 'overdue' ? 'Payment Overdue' : 'Payment Plan'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Payment</p>
                      <p>{tenant.lastPaymentDate ? formatDate(tenant.lastPaymentDate) : 'No record'}</p>
                    </div>
                  </div>
                  
                  {tenant.paymentStatus === 'overdue' && tenant.overdueAmount && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="h-4 w-4 mr-2" style={{ color: '#DC5F12' }} />
                        <span className="font-medium">Rent Arrears</span>
                      </div>
                        <span className="font-semibold text-red-800">
                          £{tenant.overdueAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Next 3 Payment Dates</p>
                    {upcomingPayments.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {upcomingPayments.map((period) => (
                          <div key={period.id} className="flex items-center justify-between">
                            <span>{formatDate(period.dueDate)}</span>
                            <span className="font-medium">{formatCurrency(period.amountDue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming payments scheduled.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {displayTenant.notes || 'No additional notes'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PoundSterling className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Rent Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 mr-2 animate-spin text-gray-400" />
                    <p className="text-muted-foreground">Loading payment history...</p>
                  </div>
                ) : rentPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <PoundSterling className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground font-medium">No payment history yet</p>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      Payment periods will appear here once the schedule is generated.
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Tenant data: {tenant.paymentFrequency || 'missing'} frequency, 
                        Rent: £{tenant.rentAmount || 0}, 
                        First payment: {tenant.firstPaymentDate ? formatDate(tenant.firstPaymentDate) : 'not set'}
                      </p>
                      <Button
                        onClick={async () => {
                          console.log('🔧 [TenantDetails] Manual schedule generation triggered');
                          setIsLoadingPayments(true);
                          try {
                            await paymentScheduleService.generateScheduleForTenant(tenant, {
                              historyPeriods: 6,
                              futurePeriods: 12,
                              managerId: (tenant as any)?.userId
                            });
                            console.log('✅ [TenantDetails] Manual generation completed');
                            // Refresh periods
                            const periods = await paymentScheduleService.getTenantPeriods(tenant.id);
                            setPaymentPeriods(periods);
                          } catch (error) {
                            console.error('❌ [TenantDetails] Manual generation failed:', error);
                            alert('Failed to generate schedule: ' + (error instanceof Error ? error.message : 'Unknown error'));
                          } finally {
                            setIsLoadingPayments(false);
                          }
                        }}
                        disabled={isLoadingPayments || !tenant.paymentFrequency || !tenant.rentAmount}
                        variant="outline"
                      >
                        {isLoadingPayments ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate Payment Schedule'
                        )}
                      </Button>
                      {(!tenant.paymentFrequency || !tenant.rentAmount) && (
                        <p className="text-xs text-red-600 mt-2">
                          Missing required data: {!tenant.paymentFrequency && 'Payment Frequency '}
                          {!tenant.rentAmount && 'Rent Amount'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentPayments.map((payment) => {
                      const isMarking = Boolean(updatingPayments[payment.id]);
                      const isPaid = payment.status === 'paid';
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg gap-4 flex-wrap">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {formatDate(payment.dueDate)}
                                {payment.paidDate && ` • Paid: ${formatDate(payment.paidDate)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`payment-switch-${payment.id}`} className="text-sm text-muted-foreground">
                                {isPaid ? 'Paid' : 'Unpaid'}
                              </Label>
                              {isMarking ? (
                                <div className="flex items-center justify-center w-10 h-6">
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <Switch
                                  id={`payment-switch-${payment.id}`}
                                  checked={isPaid}
                                  onCheckedChange={() => handleTogglePaymentStatus(payment.id, payment.status)}
                                  disabled={isMarking}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                    Documents
                    {referencingDocuments.length > 0 && (
                      <Badge className="ml-3 bg-blue-100 text-blue-800">
                        {referencingDocuments.length} from referencing
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    style={{
                      backgroundColor: '#DC5F12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FF6B1A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#DC5F12';
                    }}
                  >
                    <FileText size={16} />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingReferencing ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 mr-2 animate-spin text-gray-400" />
                    <p className="text-muted-foreground">Loading documents...</p>
                  </div>
                ) : allDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground font-medium">No documents uploaded yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploaded files and referencing documents will appear here once available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allDocuments.map((document) => {
                      const isReferencingDoc = document.id.startsWith('ref-');
                      
                      return (
                        <div key={document.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <FileText className="w-5 h-5 mt-1" style={{ color: '#DC5F12' }} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{document.name}</p>
                                  {isReferencingDoc && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      Referencing
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>
                                    Uploaded: {formatDate(document.dateUploaded)}
                                    {document.expiryDate && ` • Expires: ${formatDate(document.expiryDate)}`}
                                  </p>
                                  {document.fileSize && (
                                    <p className="flex items-center gap-4">
                                      <span>Size: {formatFileSize(document.fileSize)}</span>
                                      {document.fileType && <span>Type: {document.fileType}</span>}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Badge className={getStatusColor(document.status)}>
                                {document.status}
                              </Badge>
                              {document.downloadUrl && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="p-2">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                                      <FileText className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                                      View Document
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                      <FileText className="w-4 h-4 mr-2" style={{ color: '#DC5F12' }} />
                                      Download
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="space-y-6">
            {/* Referee Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Employment Referee Responses
                  {refereeResponses.length > 0 && (
                    <Badge className="ml-3 bg-blue-100 text-blue-800">
                      {refereeResponses.length} response{refereeResponses.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingResponses ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 mr-2 animate-spin text-gray-400" />
                    <p className="text-muted-foreground">Loading referee responses...</p>
                  </div>
                ) : refereeResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground">No referee responses yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Responses will appear here once the referee completes the form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refereeResponses.map((response, index) => (
                      <div key={response.id || index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{response.firstName} {response.lastName}</h4>
                            <p className="text-sm text-muted-foreground">Employment Referee</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={response.consent === 'agree' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {response.consent === 'agree' ? '✓ Agreed' : '✗ Declined'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteResponse(response.id, 'referee')}
                              title="Delete response"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span>{response.email}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted: </span>
                            <span>{new Date(response.submittedAt || response.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {response.reason && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <p className="text-muted-foreground font-medium mb-1">Comments:</p>
                              <p className="text-foreground">{response.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guarantor Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Guarantor Responses
                  {guarantorResponses.length > 0 && (
                    <Badge className="ml-3 bg-blue-100 text-blue-800">
                      {guarantorResponses.length} response{guarantorResponses.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingResponses ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 mr-2 animate-spin text-gray-400" />
                    <p className="text-muted-foreground">Loading guarantor responses...</p>
                  </div>
                ) : guarantorResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground">No guarantor responses yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Responses will appear here once the guarantor completes the form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guarantorResponses.map((response, index) => (
                      <div key={response.id || index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{response.firstName} {response.lastName}</h4>
                            <p className="text-sm text-muted-foreground">Guarantor</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={response.consent === 'agree' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {response.consent === 'agree' ? '✓ Agreed' : '✗ Declined'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteResponse(response.id, 'guarantor')}
                              title="Delete response"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span>{response.email}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted: </span>
                            <span>{new Date(response.submittedAt || response.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {response.reason && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <p className="text-muted-foreground font-medium mb-1">Comments:</p>
                              <p className="text-foreground">{response.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleDocumentUpload}
      />
    </div>
  );
}