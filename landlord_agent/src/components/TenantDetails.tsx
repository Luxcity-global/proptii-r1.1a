import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

import { Tenant } from '../App';

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
}

interface TenantDetailsProps {
  tenant: Tenant | null;
  onBack: () => void;
  onEdit?: (tenant: Tenant) => void;
}

export function TenantDetails({ tenant, onBack, onEdit }: TenantDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
    references: [
      {
        id: '1',
        type: 'employment',
        contactName: 'HR Department - Tech Solutions Ltd',
        contactEmail: 'hr@techsolutions.com',
        contactPhone: '+44 20 7123 4567',
        status: 'satisfactory',
        dateRequested: new Date('2024-01-01'),
        dateReceived: new Date('2024-01-03'),
        notes: 'Confirmed employment and salary details'
      },
      {
        id: '2',
        type: 'previous-landlord',
        contactName: 'John Smith Properties',
        contactPhone: '+44 20 7987 6543',
        status: 'satisfactory',
        dateRequested: new Date('2024-01-01'),
        dateReceived: new Date('2024-01-05'),
        notes: 'No issues reported, always paid on time'
      }
    ],
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
                    <Badge className={getReferencingStatusColor(mockTenant.referencingStatus)}>
                      Referencing: {getReferencingStatusLabel(mockTenant.referencingStatus)}
                    </Badge>
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
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTenant.documents?.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-5 h-5" style={{ color: '#DC5F12' }} />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded: {formatDate(document.dateUploaded)}
                            {document.expiryDate && ` • Expires: ${formatDate(document.expiryDate)}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" style={{ color: '#DC5F12' }} />
                  Reference Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTenant.references?.map((reference) => (
                    <div key={reference.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{reference.contactName}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{reference.type.replace('-', ' ')} Reference</p>
                        </div>
                        <Badge className={getStatusColor(reference.status)}>
                          {reference.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {reference.contactEmail && <p>Email: {reference.contactEmail}</p>}
                        {reference.contactPhone && <p>Phone: {reference.contactPhone}</p>}
                        <p>Requested: {formatDate(reference.dateRequested)}</p>
                        {reference.dateReceived && <p>Received: {formatDate(reference.dateReceived)}</p>}
                        {reference.notes && <p className="mt-2 italic">Notes: {reference.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}