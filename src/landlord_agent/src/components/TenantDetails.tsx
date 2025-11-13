import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

import { Tenant } from '../App';
import { referencingService, ReferencingDocument } from '../services/referencingService';

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
}

export function TenantDetails({ tenant, onBack, onEdit }: TenantDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [referencingStatus, setReferencingStatus] = useState<'not-started' | 'in-progress' | 'complete'>('not-started');
  const [referencingData, setReferencingData] = useState<ReferencingDocument | null>(null);
  const [isLoadingReferencing, setIsLoadingReferencing] = useState(true);
  const [referencingDocuments, setReferencingDocuments] = useState<TenantDocument[]>([]);
  const [refereeResponses, setRefereeResponses] = useState<any[]>([]);
  const [guarantorResponses, setGuarantorResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);

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

  // Mock additional data for demonstration
  const mockTenant: Tenant = {
    ...tenant,
    depositAmount: tenant.rentAmount * 1.5,
    monthlyRent: tenant.rentAmount,
    tenancyType: 'assured-shorthold',
    moveInDate: tenant.leaseStart,
    previousAddress: '789 Previous Street, London NW1 1AA',
    employer: 'Tech Solutions Ltd',
    annualSalary: 45000,
    notes: 'Excellent tenant with good payment history. Prefers email communication for non-urgent matters.',
    rentPayments: [
      {
        id: '1',
        amount: tenant.rentAmount,
        dueDate: new Date('2024-06-01'),
        paidDate: new Date('2024-05-28'),
        status: 'paid',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: '2',
        amount: tenant.rentAmount,
        dueDate: new Date('2024-07-01'),
        paidDate: new Date('2024-06-30'),
        status: 'paid',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: '3',
        amount: tenant.rentAmount,
        dueDate: new Date('2024-08-01'),
        status: 'pending',
        paymentMethod: 'Bank Transfer'
      }
    ],
    maintenanceRequests: [
      {
        id: '1',
        title: 'Leaky kitchen tap',
        description: 'Kitchen tap has been dripping for the past week',
        priority: 'medium',
        status: 'completed',
        dateReported: new Date('2024-05-15'),
        dateCompleted: new Date('2024-05-18'),
        category: 'plumbing'
      },
      {
        id: '2',
        title: 'Heating not working properly',
        description: 'Radiator in bedroom not heating up',
        priority: 'high',
        status: 'in-progress',
        dateReported: new Date('2024-06-01'),
        category: 'heating'
      }
    ],
    documents: [
      {
        id: '1',
        name: 'Tenancy Agreement - Signed',
        type: 'tenancy-agreement',
        dateUploaded: new Date('2024-01-15'),
        status: 'valid'
      },
      {
        id: '2',
        name: 'Deposit Protection Certificate',
        type: 'deposit-certificate',
        dateUploaded: new Date('2024-01-15'),
        status: 'valid'
      },
      {
        id: '3',
        name: 'Right to Rent Check',
        type: 'right-to-rent',
        dateUploaded: new Date('2024-01-10'),
        expiryDate: new Date('2025-01-10'),
        status: 'valid'
      }
    ]
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

    // Add to mockTenant documents (in real app, this would be an API call)
    mockTenant.documents = [...(mockTenant.documents || []), newDocument];
    
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

  // Combine mock documents with referencing documents
  const allDocuments = [...(mockTenant.documents || []), ...referencingDocuments];

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
                  {mockTenant.avatar && <AvatarImage src={mockTenant.avatar} alt={mockTenant.name} />}
                  <AvatarFallback>
                    <User className="h-8 w-8" style={{ color: '#DC5F12' }} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="mb-1">{mockTenant.name}</h1>
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <Badge className={getStatusColor(mockTenant.status)}>
                      {mockTenant.status}
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
                <Button variant="outline" onClick={() => onEdit(mockTenant)}>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
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
                    <span>{mockTenant.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{mockTenant.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>{mockTenant.propertyAddress}</span>
                  </div>
                  {mockTenant.emergencyContact && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium mb-2">Emergency Contact</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{mockTenant.emergencyContact.name} ({mockTenant.emergencyContact.relationship})</p>
                          <p>{mockTenant.emergencyContact.phone}</p>
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
                      <p>{formatCurrency(mockTenant.monthlyRent || mockTenant.rentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit</p>
                      <p>{formatCurrency(mockTenant.depositAmount || mockTenant.rentAmount * 1.5)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Lease Start</p>
                      <p>{formatDate(mockTenant.leaseStart)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lease End</p>
                      <p>{formatDate(mockTenant.leaseEnd)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenancy Type</p>
                    <p className="capitalize">{mockTenant.tenancyType?.replace('-', ' ')}</p>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Employer</p>
                    <p>{mockTenant.employer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Salary</p>
                    <p>{formatCurrency(mockTenant.annualSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Previous Address</p>
                    <p className="text-sm">{mockTenant.previousAddress}</p>
                  </div>
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
                        {tenant.paymentStatus === 'current' ? 'Current' : 
                         tenant.paymentStatus === 'overdue' ? 'Overdue' : 'Payment Plan'}
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
                      {tenant.defaultRiskScore && (
                        <div className="mt-2 text-sm text-red-700">
                          Default Risk Score: {tenant.defaultRiskScore}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  {tenant.defaultRiskScore && tenant.paymentStatus === 'current' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Default Risk Score</p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-full bg-gray-200 rounded-full h-2 ${
                          tenant.defaultRiskScore >= 70 ? 'bg-red-200' : 
                          tenant.defaultRiskScore >= 40 ? 'bg-orange-200' : 'bg-green-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              tenant.defaultRiskScore >= 70 ? 'bg-red-500' : 
                              tenant.defaultRiskScore >= 40 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${tenant.defaultRiskScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{tenant.defaultRiskScore}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {mockTenant.notes || 'No additional notes'}
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
                <div className="space-y-4">
                  {mockTenant.rentPayments?.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(payment.dueDate)}
                            {payment.paidDate && ` • Paid: ${formatDate(payment.paidDate)}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTenant.maintenanceRequests?.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(request.priority)}
                          <h4 className="font-medium">{request.title}</h4>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                        <span>Priority: {request.priority}</span>
                        <span>Category: {request.category}</span>
                        <span>Reported: {formatDate(request.dateReported)}</span>
                        {request.dateCompleted && (
                          <span>Completed: {formatDate(request.dateCompleted)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                    <p className="text-muted-foreground">No documents available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload documents or have the tenant complete referencing
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