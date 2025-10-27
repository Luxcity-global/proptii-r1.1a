import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  FileSignature, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Send, 
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SendContractModal } from './SendContractModal';

export interface Contract {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  status: 'sent' | 'unsigned' | 'signed';
  sentDate: Date;
  signedDate?: Date;
  expiryDate?: Date;
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other';
  fileUrl: string;
  fileName: string;
  additionalInfo?: string;
}

interface ContractsPageProps {
  onBack?: () => void;
}

export function ContractsPage({ onBack }: ContractsPageProps) {
  const [activeTab, setActiveTab] = useState<'sent' | 'unsigned' | 'signed'>('sent');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Mock contract data
  const mockContracts: Contract[] = [
    {
      id: '1',
      title: 'Tenancy Agreement - Regent Street',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      tenantName: 'Sarah Johnson',
      tenantEmail: 'sarah.johnson@email.com',
      status: 'sent',
      sentDate: new Date('2024-12-01'),
      expiryDate: new Date('2024-12-15'),
      contractType: 'tenancy-agreement',
      fileUrl: '#',
      fileName: 'tenancy_agreement_regent_street.pdf',
      additionalInfo: 'Standard 12-month tenancy agreement'
    },
    {
      id: '2',
      title: 'Deposit Protection Certificate',
      propertyAddress: '45 Victoria Park Road, London E9 7JN',
      tenantName: 'Michael Chen',
      tenantEmail: 'michael.chen@email.com',
      status: 'unsigned',
      sentDate: new Date('2024-11-28'),
      signedDate: new Date('2024-12-02'),
      contractType: 'deposit-certificate',
      fileUrl: '#',
      fileName: 'deposit_certificate_victoria_park.pdf',
      additionalInfo: 'Deposit amount: £2,100'
    },
    {
      id: '3',
      title: 'Right to Rent Check',
      propertyAddress: '78 Oak Gardens, London SW4 9AL',
      tenantName: 'Emma Watson',
      tenantEmail: 'emma.watson@email.com',
      status: 'signed',
      sentDate: new Date('2024-11-20'),
      signedDate: new Date('2024-11-25'),
      contractType: 'right-to-rent',
      fileUrl: '#',
      fileName: 'right_to_rent_oak_gardens.pdf',
      additionalInfo: 'Passport verification completed'
    },
    {
      id: '4',
      title: 'Tenancy Agreement - Maple Court',
      propertyAddress: '92 Maple Court, London N1 5QT',
      tenantName: 'David Rodriguez',
      tenantEmail: 'david.rodriguez@email.com',
      status: 'sent',
      sentDate: new Date('2024-12-05'),
      expiryDate: new Date('2024-12-20'),
      contractType: 'tenancy-agreement',
      fileUrl: '#',
      fileName: 'tenancy_agreement_maple_court.pdf',
      additionalInfo: '6-month break clause included'
    }
  ];

  const sentContracts = mockContracts.filter(c => c.status === 'sent');
  const unsignedContracts = mockContracts.filter(c => c.status === 'unsigned');
  const signedContracts = mockContracts.filter(c => c.status === 'signed');

  // Calculate overview metrics
  const totalSent = sentContracts.length;
  const expiringSoon = sentContracts.filter(c => 
    c.expiryDate && c.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;
  const pendingSignature = unsignedContracts.length;

  // Get alerts
  const alerts = [
    ...sentContracts.filter(c => 
      c.expiryDate && c.expiryDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    ).map(c => ({
      id: `expiring-${c.id}`,
      type: 'expiring' as const,
      title: 'Contract Expiring Soon',
      description: `${c.title} expires on ${c.expiryDate?.toLocaleDateString()}`,
      contractId: c.id
    })),
    ...unsignedContracts.map(c => ({
      id: `pending-${c.id}`,
      type: 'pending' as const,
      title: 'Awaiting Your Signature',
      description: `${c.title} has been signed by tenant and awaits your signature`,
      contractId: c.id
    }))
  ];

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-500';
      case 'unsigned':
        return 'bg-orange-500';
      case 'signed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Contract['status']) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'unsigned':
        return 'Awaiting Signature';
      case 'signed':
        return 'Signed';
      default:
        return status;
    }
  };

  const getContractTypeIcon = (type: Contract['contractType']) => {
    switch (type) {
      case 'tenancy-agreement':
        return <FileSignature className="w-4 h-4" />;
      case 'deposit-certificate':
        return <CheckCircle className="w-4 h-4" />;
      case 'right-to-rent':
        return <User className="w-4 h-4" />;
      default:
        return <FileSignature className="w-4 h-4" />;
    }
  };

  const handleMarkAsSigned = (contractId: string) => {
    // In a real app, this would update the contract status
    console.log('Marking contract as signed:', contractId);
    // For demo purposes, we could update the mock data here
  };

  const handleSendContract = (contractData: {
    file: File;
    recipientName: string;
    recipientEmail: string;
    additionalInfo?: string;
  }) => {
    // In a real app, this would send the contract
    console.log('Sending contract:', contractData);
    setIsSendModalOpen(false);
  };

  const ContractTable = ({ contracts }: { contracts: Contract[] }) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Contract</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Property</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Tenant</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Status</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Sent Date</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Expiry</TableHead>
            <TableHead style={{ fontFamily: 'Archivo, sans-serif' }}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getContractTypeIcon(contract.contractType)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                      {contract.title}
                    </div>
                    <div className="text-sm text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      {contract.fileName}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    {contract.propertyAddress}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      {contract.tenantName}
                    </div>
                    <div className="text-xs text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      {contract.tenantEmail}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(contract.status)} text-white border-0`}>
                  {getStatusText(contract.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    {contract.sentDate.toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {contract.expiryDate ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
                      {contract.expiryDate.toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    -
                  </span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    {contract.status === 'unsigned' && (
                      <DropdownMenuItem onClick={() => handleMarkAsSigned(contract.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Signed
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              Contracts
            </h1>
            <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Manage your property contracts and agreements
            </p>
          </div>
          <Button 
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center space-x-2"
            style={{ backgroundColor: '#DC5F12', fontFamily: 'Archivo, sans-serif' }}
          >
            <Send className="w-4 h-4" />
            <span>Send Contract</span>
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>Sent Contracts</p>
                <p className="text-2xl font-semibold" style={{ fontFamily: 'Archivo, sans-serif' }}>{totalSent}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>Expiring Soon</p>
                <p className="text-2xl font-semibold text-orange-600" style={{ fontFamily: 'Archivo, sans-serif' }}>{expiringSoon}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>Pending Signature</p>
                <p className="text-2xl font-semibold text-yellow-600" style={{ fontFamily: 'Archivo, sans-serif' }}>{pendingSignature}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`p-4 ${
                  alert.type === 'expiring' 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                      alert.type === 'expiring' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>{alert.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contracts Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sent">
              Sent ({totalSent})
            </TabsTrigger>
            <TabsTrigger value="unsigned">
              Unsigned ({pendingSignature})
            </TabsTrigger>
            <TabsTrigger value="signed">
              Signed ({signedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent" className="space-y-4">
            {sentContracts.length === 0 ? (
              <Card className="p-12 text-center">
                <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>No sent contracts</h3>
                <p className="text-muted-foreground mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Send your first contract to get started
                </p>
                <Button 
                  onClick={() => setIsSendModalOpen(true)}
                  style={{ backgroundColor: '#DC5F12', fontFamily: 'Archivo, sans-serif' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Send Contract
                </Button>
              </Card>
            ) : (
              <ContractTable contracts={sentContracts} />
            )}
          </TabsContent>

          <TabsContent value="unsigned" className="space-y-4">
            {unsignedContracts.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>No unsigned contracts</h3>
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  All contracts are up to date
                </p>
              </Card>
            ) : (
              <ContractTable contracts={unsignedContracts} />
            )}
          </TabsContent>

          <TabsContent value="signed" className="space-y-4">
            {signedContracts.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>No signed contracts</h3>
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Signed contracts will appear here
                </p>
              </Card>
            ) : (
              <ContractTable contracts={signedContracts} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Contract Modal */}
      <SendContractModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendContract}
      />
    </div>
  );
}
