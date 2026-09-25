import React, { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { DocumentUploadModal } from './DocumentUploadModal';
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';

import { Tenant } from '../App';
import { referencingService, ReferencingDocument } from '../services/referencingService';
import { paymentScheduleService, RentPaymentPeriod } from '../services/paymentScheduleService';
import { tenantService } from '../services/tenantService';
import { useTenantDetails } from '../hooks/useTenantDetails';
import { ClientDetailsDrawer, clientInitials, type ClientStatusTone } from './ClientDetailsDrawer';
import { uploadToFirebaseStorage } from '../../../services/storageService';

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
  initialTab?: string;
}

export function TenantDetails({ tenant, onBack, onEdit, onTenantUpdate, initialTab = 'overview' }: TenantDetailsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
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
  // Persistent document list managed in React state (not mutated on displayTenant)
  const [managedDocuments, setManagedDocuments] = useState<TenantDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { tenantDetails: liveTenant, isLoading: isLoadingTenant } = useTenantDetails(tenant?.id);

  useEffect(() => {
    setActiveTab(initialTab || 'overview');
  }, [initialTab, tenant?.id]);

  // Seed managed documents from existing tenant record whenever tenant changes
  useEffect(() => {
    const existing = (tenant as any)?.documents as TenantDocument[] | undefined;
    setManagedDocuments(existing ? [...existing] : []);
    setUploadError(null);
  }, [tenant?.id]);

  // Fetch real referencing data from Firestore
  useEffect(() => {
    const fetchReferencingStatus = async () => {
      if (!tenant?.email) {
        console.warn('[TenantDetails] No email found for tenant, skipping referencing check');
        setIsLoadingReferencing(false);
        return;
      }

      setIsLoadingReferencing(true);
      console.log(`[TenantDetails] Fetching referencing status for: ${tenant.email}`);
      
      const result = await referencingService.getReferencingStatusByEmail(tenant.email);
      
      console.log('[TenantDetails] Referencing result:', result);
      
      setReferencingStatus(result.status);
      setReferencingData((result.data as ReferencingDocument) || null);
      setIsLoadingReferencing(false);
    };

    fetchReferencingStatus();
  }, [tenant?.email]);

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
        name: `Identity Document - ${formData.identity.identityProof.name || 'Document'}`,
        type: 'id-document',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.identity.identityProof.dataUrl || formData.identity.identityProof.url,
        fileSize: formData.identity.identityProof.size,
        fileType: formData.identity.identityProof.type
      });
    }

    // Employment Proof
    if (formData.employment?.proofDocument) {
      docs.push({
        id: 'ref-employment',
        name: `Employment Proof - ${formData.employment.proofDocument.name || 'Document'}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.employment.proofDocument.dataUrl || formData.employment.proofDocument.url,
        fileSize: formData.employment.proofDocument.size,
        fileType: formData.employment.proofDocument.type
      });
    }

    // Residential Proof
    if (formData.residential?.proofDocument) {
      docs.push({
        id: 'ref-residential',
        name: `Proof of Address - ${formData.residential.proofDocument.name || 'Document'}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.residential.proofDocument.dataUrl || formData.residential.proofDocument.url,
        fileSize: formData.residential.proofDocument.size,
        fileType: formData.residential.proofDocument.type
      });
    }

    // Financial Proof
    if (formData.financial?.proofOfIncomeDocument) {
      docs.push({
        id: 'ref-financial',
        name: `Proof of Income - ${formData.financial.proofOfIncomeDocument.name || 'Document'}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.financial.proofOfIncomeDocument.dataUrl || formData.financial.proofOfIncomeDocument.url,
        fileSize: formData.financial.proofOfIncomeDocument.size,
        fileType: formData.financial.proofOfIncomeDocument.type
      });
    }

    // Guarantor Identity Document
    if (formData.guarantor?.identityDocument) {
      docs.push({
        id: 'ref-guarantor',
        name: `Guarantor ID - ${formData.guarantor.identityDocument.name || 'Document'}`,
        type: 'other',
        dateUploaded: referencingData.createdAt?.toDate?.() || new Date(),
        status: 'valid',
        downloadUrl: formData.guarantor.identityDocument.dataUrl || formData.guarantor.identityDocument.url,
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
      if (!tenant?.email) {
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
  }, [tenant?.email]);

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

  if (!tenant) {
    return (
      <ClientDetailsDrawer
        initials="?"
        name="Tenant not found"
        statusLabel="—"
        statusTone="idle"
        subtitle="This record is no longer available"
        tabs={[{ id: 'overview', label: 'Overview' }]}
        activeTab="overview"
        onTabChange={() => undefined}
        onClose={onBack}
      >
        <div className="ll-cd-empty">
          <p className="ll-cd-empty-title">Tenant not found</p>
          <p>Go back to Clients to pick another record.</p>
        </div>
      </ClientDetailsDrawer>
    );
  }

  // Merge real tenant data with live updates
  // Merge Firestore tenant with live profile data from Azure AD endpoint.
  // IMPORTANT: liveTenant.status uses display-layer values ('notice', 'arrears', 'eviction')
  // which are NOT compatible with Tenant.status ('active' | 'pending' | 'ended').
  // We intentionally keep the authoritative Firestore status and only pull in
  // display-safe fields (name, email, phone, avatar) from the live profile.
  const displayTenant: any = {
    ...tenant,
    // Safe fields from live profile
    name: liveTenant?.name || tenant.name,
    email: liveTenant?.email || tenant.email,
    phone: liveTenant?.phone || tenant.phone,
    avatar: liveTenant?.avatar || tenant.avatar,
    // Status: always trust Firestore, never overwrite with the Azure endpoint value
    status: tenant.status,
    propertyAddress: tenant.propertyAddress || 'Not assigned',
    depositAmount: liveTenant?.depositAmount,
    monthlyRent: tenant.rentAmount,
    rentAmount: tenant.rentAmount,
    tenancyType: 'assured-shorthold',
    moveInDate: tenant.leaseStart,
    leaseStart: tenant.leaseStart,
    leaseEnd: tenant.leaseEnd,
    emergencyContact: tenant.emergencyContact,
    notes: liveTenant?.notes || (tenant as Tenant & { notes?: string }).notes || '',
    maintenanceRequests: [],
    // Documents are managed via managedDocuments state — this field is for legacy compat only
    documents: (tenant as Tenant & { documents?: TenantDocument[] }).documents || []
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

  const handleDocumentUpload = async (documentData: {
    name: string;
    type: string;
    file: File;
    expiryDate?: string;
  }) => {
    if (!tenant) return;
    setIsUploadingDocument(true);
    setUploadError(null);

    try {
      // 1. Upload the file to Firebase Storage under a scoped path
      const storagePath = `tenant-documents/${tenant.id}`;
      const result = await uploadToFirebaseStorage(documentData.file, storagePath);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed — no download URL returned');
      }

      // 2. Build the persisted document object
      const newDocument: TenantDocument = {
        id: Date.now().toString(),
        name: documentData.name,
        type: documentData.type as TenantDocument['type'],
        dateUploaded: new Date(),
        expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
        status: 'valid',
        downloadUrl: result.url,
        fileSize: documentData.file.size,
        fileType: documentData.file.type,
      };

      // 3. Persist to Firestore via tenantService
      const updatedDocuments = [...managedDocuments, newDocument];
      await tenantService.updateTenant(tenant.id, { documents: updatedDocuments } as any);

      // 4. Update local state so the UI reflects the new document immediately
      setManagedDocuments(updatedDocuments);

      // Notify parent so its tenant state is also refreshed
      if (onTenantUpdate) {
        const refreshed = await tenantService.getTenant(tenant.id);
        if (refreshed) onTenantUpdate(refreshed);
      }

      console.log('✅ [TenantDetails] Document uploaded and persisted:', newDocument.name);
    } catch (error: any) {
      console.error('❌ [TenantDetails] Document upload failed:', error);
      setUploadError(error?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploadingDocument(false);
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
        return 'Not yet started';
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

  const handleDownloadDocument = (file: TenantDocument) => {
    if (!file.downloadUrl) {
      console.warn('No download URL available for document:', file.name);
      return;
    }

    try {
      const link = window.document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      console.log('Document download initiated:', file.name);
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

  // Combine persistently managed documents with referencing documents
  const allDocuments = [...managedDocuments, ...referencingDocuments];

const asDate = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateSafe = (value: unknown) => {
    const date = asDate(value);
    return date ? formatDate(date) : '—';
  };

  const termLabel = (start: unknown, end: unknown) => {
    const from = asDate(start);
    const to = asDate(end);
    if (!from || !to) return '—';
    const months = Math.max(1, Math.round((to.getTime() - from.getTime()) / (30.44 * 86400000)));
    return `${months} Month${months === 1 ? '' : 's'}`;
  };

  const paymentTone = (): { tone: ClientStatusTone; label: string } => {
    if (tenant.paymentStatus === 'overdue') return { tone: 'overdue', label: 'Overdue' };
    if (tenant.paymentStatus === 'payment-plan') return { tone: 'due', label: 'Payment Plan' };
    return { tone: 'paid', label: 'Paid' };
  };

  const kycTone = (): { tone: ClientStatusTone; label: string } => {
    if (isLoadingReferencing) return { tone: 'pending', label: 'Checking…' };
    if (referencingStatus === 'complete') return { tone: 'complete', label: '✓ Verified' };
    if (referencingStatus === 'in-progress') return { tone: 'progress', label: 'In progress' };
    return { tone: 'idle', label: 'Not started' };
  };

  const status = paymentTone();
  const kyc = kycTone();
  const formData = referencingData?.formData;
  const monthlyIncomeRaw = formData?.financial?.monthlyIncome;
  const monthlyIncome = monthlyIncomeRaw
    ? parseFloat(String(monthlyIncomeRaw).replace(/[^\d.]/g, ''))
    : NaN;
  const hasIncome = Number.isFinite(monthlyIncome) && monthlyIncome > 0;
  const rentToIncome = hasIncome && displayTenant.rentAmount
    ? ((displayTenant.rentAmount / monthlyIncome) * 100).toFixed(1)
    : null;
  const identityDoc = formData?.identity?.identityProof;
  const tenancyDocs = allDocuments.filter((doc: TenantDocument) => doc.type === 'tenancy-agreement');
  const depositDocs = allDocuments.filter((doc: TenantDocument) => doc.type === 'deposit-certificate');
  const primaryAgreement = tenancyDocs[0] || allDocuments.find((doc: TenantDocument) => !String(doc.id).startsWith('ref-'));
  const drawerTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agreement', label: 'Tenancy Agreement' },
    { id: 'payment', label: 'Payment History' },
    { id: 'referencing', label: 'Referencing' },
    { id: 'notes', label: 'Notes & Activity' },
  ];

  const paymentStatusTone = (value: string): ClientStatusTone => {
    if (value === 'paid') return 'paid';
    if (value === 'overdue') return 'overdue';
    return 'due';
  };

  return (
    <>
      <ClientDetailsDrawer
        initials={clientInitials(displayTenant.name)}
        name={displayTenant.name}
        statusLabel={status.label}
        statusTone={status.tone}
        subtitle={displayTenant.propertyAddress}
        phone={displayTenant.phone}
        email={displayTenant.email}
        tabs={drawerTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={onBack}
        loading={isLoadingTenant}
        actions={
          onEdit ? (
            <button type="button" className="ll-cd-comm" onClick={() => onEdit(displayTenant)}>
              Edit
            </button>
          ) : null
        }
      >
        {activeTab === 'overview' && (
          <>
            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Primary contact information</h4>
              <div className="ll-cd-grid">
                <div className="ll-cd-field">
                  <span>Email Address</span>
                  <strong className="is-mono">{displayTenant.email || '—'}</strong>
                </div>
                <div className="ll-cd-field">
                  <span>Direct Phone (UK)</span>
                  <strong className="is-mono">{displayTenant.phone || '—'}</strong>
                </div>
              </div>
              <div className="ll-cd-field">
                <span>Right to Rent / KYC Verification</span>
                <span className={`ll-cd-pill is-${kyc.tone}`}>{kyc.label}</span>
              </div>
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Emergency &amp; legal contact</h4>
              {displayTenant.emergencyContact ? (
                <>
                  <div className="ll-cd-grid">
                    <div className="ll-cd-field">
                      <span>Contact Name</span>
                      <strong>{displayTenant.emergencyContact.name || '—'}</strong>
                    </div>
                    <div className="ll-cd-field">
                      <span>Relationship</span>
                      <strong>{displayTenant.emergencyContact.relationship || '—'}</strong>
                    </div>
                  </div>
                  <div className="ll-cd-field">
                    <span>Emergency Phone (UK)</span>
                    <strong className="is-mono">{displayTenant.emergencyContact.phone || '—'}</strong>
                  </div>
                </>
              ) : (
                <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No emergency contact on file.</p>
              )}
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Occupancy schedule</h4>
              <div className="ll-cd-grid">
                <div className="ll-cd-field">
                  <span>Move-In Date</span>
                  <strong>{formatDateSafe(displayTenant.leaseStart)}</strong>
                </div>
                <div className="ll-cd-field">
                  <span>Tenancy Duration</span>
                  <strong>{termLabel(displayTenant.leaseStart, displayTenant.leaseEnd)}</strong>
                </div>
              </div>
              <div className="ll-cd-grid">
                <div className="ll-cd-field">
                  <span>Security Deposit Held</span>
                  <strong className="is-green">
                    {displayTenant.depositAmount ? formatCurrency(displayTenant.depositAmount) : '—'}
                  </strong>
                </div>
                <div className="ll-cd-field">
                  <span>Lease end</span>
                  <strong>{formatDateSafe(displayTenant.leaseEnd)}</strong>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'agreement' && (
          <>
            <section className="ll-cd-navy">
              <div className="ll-cd-navy-top">
                <div className="ll-cd-navy-doc">
                  <div className="ll-cd-navy-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3>Residential Tenancy Agreement</h3>
                    <p className="ll-cd-doc-ref">{primaryAgreement?.name || 'No agreement uploaded'}</p>
                  </div>
                </div>
                {primaryAgreement?.downloadUrl ? (
                  <button type="button" className="ll-cd-btn is-ghost-dark" onClick={() => handleDownloadDocument(primaryAgreement)}>
                    <Download size={14} />
                    Download
                  </button>
                ) : (
                  <button type="button" className="ll-cd-btn is-ghost-dark" onClick={() => setIsUploadModalOpen(true)}>
                    Upload
                  </button>
                )}
              </div>
              <div className="ll-cd-navy-metrics">
                <div>
                  <span>Start Date</span>
                  <strong>{formatDateSafe(displayTenant.leaseStart)}</strong>
                </div>
                <div>
                  <span>Expiry Date</span>
                  <strong>{formatDateSafe(displayTenant.leaseEnd)}</strong>
                </div>
                <div>
                  <span>Term Duration</span>
                  <strong>{termLabel(displayTenant.leaseStart, displayTenant.leaseEnd)}</strong>
                </div>
              </div>
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Documents on file</h4>
              {allDocuments.length === 0 ? (
                <div className="ll-cd-empty" style={{ padding: '12px 0' }}>
                  <p className="ll-cd-empty-title">No documents uploaded yet</p>
                  <p>Tenancy files and referencing uploads will appear here.</p>
                </div>
              ) : (
                allDocuments.map((doc: TenantDocument) => (
                  <div key={doc.id} className="ll-cd-audit-row">
                    <span>{doc.name}</span>
                    <strong>
                      {doc.status}
                      {doc.downloadUrl ? (
                        <>
                          {' · '}
                          <button type="button" className="ll-cd-btn is-ghost" onClick={() => handleViewDocument(doc)}>
                            View
                          </button>
                        </>
                      ) : null}
                    </strong>
                  </div>
                ))
              )}
              {depositDocs.length > 0 && (
                <div className="ll-cd-audit-row">
                  <span>Deposit protection certificate</span>
                  <strong className="is-ok">On file</strong>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <button type="button" className="ll-cd-btn is-orange" onClick={() => setIsUploadModalOpen(true)}>
                  Upload document
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === 'payment' && (
          <>
            <div className="ll-cd-ledger-head">
              <h3 className="ll-cd-heading">Financial Ledger &amp; Invoices</h3>
            </div>
            {tenant.paymentStatus === 'overdue' && tenant.overdueAmount ? (
              <div className="ll-cd-warn">
                <span>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Rent arrears
                </span>
                <strong>{formatCurrency(tenant.overdueAmount)}</strong>
              </div>
            ) : null}
            {isLoadingPayments ? (
              <div className="ll-cd-loading">
                <div className="ll-cd-spinner" />
                <p>Loading payment history…</p>
              </div>
            ) : rentPayments.length === 0 ? (
              <section className="ll-cd-card">
                <div className="ll-cd-empty">
                  <p className="ll-cd-empty-title">No payment history yet</p>
                  <p>Payment periods appear here once the schedule is generated.</p>
                  <button
                    type="button"
                    className="ll-cd-btn is-orange"
                    style={{ marginTop: 12 }}
                    disabled={isLoadingPayments || !tenant.paymentFrequency || !tenant.rentAmount}
                    onClick={async () => {
                      setIsLoadingPayments(true);
                      try {
                        await paymentScheduleService.generateScheduleForTenant(tenant, {
                          historyPeriods: 6,
                          futurePeriods: 12,
                          managerId: (tenant as Tenant & { userId?: string }).userId,
                        });
                        const periods = await paymentScheduleService.getTenantPeriods(tenant.id);
                        setPaymentPeriods(periods);
                      } catch (error) {
                        alert('Failed to generate schedule: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      } finally {
                        setIsLoadingPayments(false);
                      }
                    }}
                  >
                    Generate payment schedule
                  </button>
                </div>
              </section>
            ) : (
              <div className="ll-cd-ledger">
                <table className="ll-cd-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentPayments.map((payment) => {
                      const isMarking = Boolean(updatingPayments[payment.id]);
                      const isPaid = payment.status === 'paid';
                      return (
                        <tr key={payment.id}>
                          <td className="is-ref">{String(payment.id).slice(0, 10)}</td>
                          <td className="is-muted">{formatDateSafe(payment.dueDate)}</td>
                          <td>
                            Monthly rent
                            {payment.paidDate ? ` · Paid ${formatDateSafe(payment.paidDate)}` : ''}
                          </td>
                          <td className="is-amt">{formatCurrency(payment.amount)}</td>
                          <td>
                            <div className="ll-cd-pay-actions">
                              <span className={`ll-cd-pill is-${paymentStatusTone(payment.status)}`}>
                                {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Due'}
                              </span>
                              {isMarking ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <Label htmlFor={`payment-switch-${payment.id}`} className="sr-only">
                                    {isPaid ? 'Paid' : 'Unpaid'}
                                  </Label>
                                  <Switch
                                    id={`payment-switch-${payment.id}`}
                                    checked={isPaid}
                                    onCheckedChange={() => handleTogglePaymentStatus(payment.id, payment.status)}
                                    disabled={isMarking}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'referencing' && (
          <>
            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Primary identity &amp; right to rent</h4>
              <div className="ll-cd-grid">
                <div className="ll-cd-field">
                  <span>Document Type</span>
                  <strong>
                    {identityDoc?.name || identityDoc?.type || (referencingStatus === 'complete' ? 'Identity document on file' : '—')}
                  </strong>
                </div>
                <div className="ll-cd-field">
                  <span>Referencing status</span>
                  <strong>{getReferencingStatusLabel(referencingStatus)}</strong>
                </div>
              </div>
              <div className="ll-cd-field">
                <span>UK Right to Rent Status</span>
                <span className={`ll-cd-pill is-${kyc.tone}`}>{kyc.label}</span>
              </div>
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Employment &amp; income affordability</h4>
              {formData?.employment || formData?.financial ? (
                <>
                  <div className="ll-cd-grid">
                    <div className="ll-cd-field">
                      <span>Verified Employer</span>
                      <strong>{formData.employment?.companyDetails || '—'}</strong>
                    </div>
                    <div className="ll-cd-field">
                      <span>Position &amp; Role</span>
                      <strong>{formData.employment?.jobPosition || '—'}</strong>
                    </div>
                  </div>
                  <div className="ll-cd-grid">
                    <div className="ll-cd-field">
                      <span>Verified monthly income</span>
                      <strong className="is-green">{hasIncome ? formatCurrency(monthlyIncome) : '—'}</strong>
                    </div>
                    <div className="ll-cd-field">
                      <span>Rent-to-income</span>
                      <strong>{rentToIncome ? `${rentToIncome}%` : '—'}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>
                  Employment and income details appear once the tenant completes referencing.
                </p>
              )}
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Residential history</h4>
              {formData?.residential ? (
                <div className="ll-cd-grid">
                  <div className="ll-cd-field">
                    <span>Current address</span>
                    <strong>{formData.residential.currentAddress || '—'}</strong>
                  </div>
                  <div className="ll-cd-field">
                    <span>Previous address</span>
                    <strong>{formData.residential.previousAddress || '—'}</strong>
                  </div>
                </div>
              ) : (
                <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No residential history submitted yet.</p>
              )}
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Employment referee responses</h4>
              {isLoadingResponses ? (
                <p>Loading referee responses…</p>
              ) : refereeResponses.length === 0 ? (
                <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No referee responses yet.</p>
              ) : (
                refereeResponses.map((response, index) => (
                  <div key={response.id || index} className="ll-cd-response">
                    <div className="ll-cd-response-top">
                      <div>
                        <h4>{response.firstName} {response.lastName}</h4>
                        <p className="ll-cd-role">Employment referee</p>
                      </div>
                      <div className="ll-cd-pay-actions">
                        <span className={`ll-cd-pill ${response.consent === 'agree' ? 'is-complete' : 'is-overdue'}`}>
                          {response.consent === 'agree' ? '✓ Agreed' : 'Declined'}
                        </span>
                        <button type="button" className="ll-cd-icon-btn" onClick={() => handleDeleteResponse(response.id, 'referee')} aria-label="Delete response">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="ll-cd-field">
                      <span>Email</span>
                      <strong className="is-mono">{response.email}</strong>
                    </div>
                    {response.reason && <p className="ll-cd-note" style={{ marginTop: 10 }}>{response.reason}</p>}
                  </div>
                ))
              )}
            </section>

            <section className="ll-cd-card">
              <h4 className="ll-cd-card-title">Guarantor responses</h4>
              {isLoadingResponses ? (
                <p>Loading guarantor responses…</p>
              ) : guarantorResponses.length === 0 ? (
                <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No guarantor responses yet.</p>
              ) : (
                guarantorResponses.map((response, index) => (
                  <div key={response.id || index} className="ll-cd-response">
                    <div className="ll-cd-response-top">
                      <div>
                        <h4>{response.firstName} {response.lastName}</h4>
                        <p className="ll-cd-role">Guarantor</p>
                      </div>
                      <div className="ll-cd-pay-actions">
                        <span className={`ll-cd-pill ${response.consent === 'agree' ? 'is-complete' : 'is-overdue'}`}>
                          {response.consent === 'agree' ? '✓ Agreed' : 'Declined'}
                        </span>
                        <button type="button" className="ll-cd-icon-btn" onClick={() => handleDeleteResponse(response.id, 'guarantor')} aria-label="Delete response">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="ll-cd-field">
                      <span>Email</span>
                      <strong className="is-mono">{response.email}</strong>
                    </div>
                    {response.reason && <p className="ll-cd-note" style={{ marginTop: 10 }}>{response.reason}</p>}
                  </div>
                ))
              )}
            </section>

            {referencingDocuments.length > 0 && (
              <section className="ll-cd-card ll-cd-report">
                <div className="ll-cd-report-main">
                  <div className="ll-cd-report-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5>Referencing documents</h5>
                    <p>{referencingDocuments.length} file{referencingDocuments.length === 1 ? '' : 's'} from the referencing pack</p>
                  </div>
                </div>
                {referencingDocuments[0]?.downloadUrl && (
                  <button type="button" className="ll-cd-btn is-ghost" onClick={() => handleDownloadDocument(referencingDocuments[0])}>
                    <Download size={14} />
                    Download
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === 'notes' && (
          <section className="ll-cd-card">
            <h4 className="ll-cd-card-title">Internal management notes</h4>
            {displayTenant.notes ? (
              <div className="ll-cd-note">{displayTenant.notes}</div>
            ) : (
              <p className="ll-cd-empty" style={{ padding: 0, textAlign: 'left' }}>No notes on file for this tenant.</p>
            )}
          </section>
        )}
      </ClientDetailsDrawer>

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        isUploading={isUploadingDocument}
        uploadError={uploadError}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadError(null);
        }}
        onUpload={handleDocumentUpload}
      />
    </>
  );
}
