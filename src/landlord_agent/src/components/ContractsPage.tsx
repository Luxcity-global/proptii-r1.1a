import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Eye,
  Download,
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  Loader2,
  FileText,
  Send,
  Trash2,
  Archive,
  CheckSquare,
  Square,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SendContractModal } from './SendContractModal';
import { contractService } from '../services/contractService';

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
  tenants?: Array<{ id: string; name: string; email: string; propertyId?: string }>;
  userProfile?: { id?: string; email?: string; [key: string]: any } | null;
  onBack?: () => void;
}

export function ContractsPage({ tenants = [], userProfile, onBack }: ContractsPageProps) {
  const [activeTab, setActiveTab] = useState<'sent' | 'unsigned' | 'signed'>('sent');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load contracts when tab changes or userProfile changes
  useEffect(() => {
    loadContracts();
    // Clear selection when tab changes
    setSelectedContracts(new Set());
    setShowBulkActions(false);
  }, [activeTab, userProfile]);
  
  // Clear invalid selections when contracts reload
  useEffect(() => {
    if (!loading && contracts.length > 0 && selectedContracts.size > 0) {
      // Only clear if current selection doesn't match any visible contracts
      const visibleContractIds = new Set(contracts.map(c => c.id));
      const validSelections = Array.from(selectedContracts).filter(id => visibleContractIds.has(id));
      if (validSelections.length !== selectedContracts.size) {
        setSelectedContracts(new Set(validSelections));
        setShowBulkActions(validSelections.length > 0);
      }
    }
  }, [contracts, loading]);

  // Helper to get current userId
  const getCurrentUserId = (): string | null => {
    try {
      // PRIORITY 1: Direct from userProfile
      if (userProfile && (userProfile as any).id) {
        return (userProfile as any).id;
      }
      // PRIORITY 2: Query parameter
      const params = new URLSearchParams(window.location.search);
      const uidFromQuery = params.get('uid');
      if (uidFromQuery) return uidFromQuery;
      // PRIORITY 3: getUserInfo
      if (typeof (window as any).getUserInfo === 'function') {
        const info = (window as any).getUserInfo();
        const uid = info?.id || info?.sub || info?.oid;
        if (uid) return uid;
      }
      // PRIORITY 4: localStorage
      const cached = localStorage.getItem('proptii_auth_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId || null;
      }
    } catch (e) {
      console.error('Error extracting userId:', e);
    }
    // FALLBACK: Email
    return userProfile?.email || null;
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUserId = getCurrentUserId();
      console.log('🔍 ContractsPage: Loading contracts for userId:', currentUserId);
      
      const statusMap: Record<string, Contract['status']> = {
        'sent': 'sent',
        'unsigned': 'unsigned',
        'signed': 'signed'
      };
      
      const fetchedContracts = await contractService.getContracts({
        userId: currentUserId || undefined,
        status: statusMap[activeTab]
      });
      
      console.log(`✅ ContractsPage: Loaded ${fetchedContracts.length} contracts`);
      setContracts(fetchedContracts);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts. Please try again.');
      // Fallback to empty array on error
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const sentContracts = contracts.filter(c => c.status === 'sent');
  const unsignedContracts = contracts.filter(c => c.status === 'unsigned');
  const signedContracts = contracts.filter(c => c.status === 'signed');

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

  const handleMarkAsSigned = async (contractId: string) => {
    try {
      await contractService.markAsSigned(contractId, 'tenant');
      await loadContracts(); // Reload to get updated data
    } catch (err) {
      console.error('Error marking contract as signed:', err);
      setError('Failed to update contract status. Please try again.');
    }
  };

  // Convert File to base64 data URL (similar to property image upload)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendContract = async (contractData: {
    file?: File;
    recipientName: string;
    recipientEmail: string;
    additionalEmail?: string;
  }) => {
    try {
      setError(null);
      
      console.log('Sending email to:', contractData.recipientEmail);
      
      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:10000/api'
        : 'https://proptii-r1-1a.onrender.com/api';
      
      if (contractData.file) {
        // Convert file to base64
        console.log('Converting file to base64:', contractData.file.name);
        const base64Data = await fileToBase64(contractData.file);
        
        // Extract base64 content (remove data:application/pdf;base64, prefix)
        const base64Content = base64Data.split(',')[1];
        const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
        
        console.log('File converted to base64, size:', base64Content.length, 'bytes');
        
        // Save contract to Firestore FIRST (so it's saved even if email fails)
        let contractId: string | null = null;
        let emailSent = false;
        
        try {
          const currentUserId = getCurrentUserId();
          if (!currentUserId) {
            console.warn('⚠️ ContractsPage: No userId found for contract creation');
          }
          console.log('📝 ContractsPage: Creating contract with userId:', currentUserId);
          contractId = await contractService.createContractWithBase64({
            title: contractData.file.name.replace(/\.[^/.]+$/, ''),
            propertyAddress: '',
            tenantName: contractData.recipientName,
            tenantEmail: contractData.recipientEmail,
            contractType: 'tenancy-agreement',
            additionalInfo: contractData.additionalEmail,
            status: 'sent',
            sentDate: new Date(),
            expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          }, contractData.file.name, base64Data, currentUserId || 'unknown');
          
          console.log('✅ Contract saved to Firestore:', contractId);
          
          // Reload contracts to show the new one
          await loadContracts();
        } catch (firestoreError) {
          console.error('❌ Error saving contract to Firestore:', firestoreError);
          alert(`Failed to save contract: ${firestoreError instanceof Error ? firestoreError.message : 'Unknown error'}`);
          setIsSendModalOpen(false);
          return; // Stop if Firestore save fails
        }
        
        // Try to send email (but don't fail if it doesn't work)
        try {
          const formData = new FormData();
          formData.append('to', contractData.recipientEmail);
          formData.append('subject', `Contract for Review: ${contractData.file.name}`);
          formData.append('html', `
            <h2>Hello ${contractData.recipientName}!</h2>
            <p>Please find attached your contract for review.</p>
            ${contractData.additionalEmail ? `<p>${contractData.additionalEmail}</p>` : ''}
            <p>Best regards,<br>Proptii Team</p>
          `);
          
          // Send base64 data separately so backend can decode it
          formData.append('attachmentBase64', base64Content);
          formData.append('attachmentFilename', contractData.file.name);
          formData.append('attachmentMimeType', mimeType);
          
          await axios.post(`${API_BASE_URL}/email/send-base64`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000
          });
          
          console.log('✅ Contract email sent successfully with attachment');
          emailSent = true;
        } catch (emailError: any) {
          console.warn('⚠️ Email service unavailable, but contract is saved:', emailError);
          // Contract is already saved, so we can continue
          const errorMessage = emailError?.message || 'Email service unavailable';
          const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ERR_CONNECTION_REFUSED');
          
          if (isNetworkError) {
            alert(`Contract saved successfully! ✅\n\n⚠️ Email service is not available (backend server not running).\n\nContract has been saved to your account and can be sent manually later.\n\nRecipient: ${contractData.recipientName} (${contractData.recipientEmail})`);
          } else {
            alert(`Contract saved successfully! ✅\n\n⚠️ Email could not be sent: ${errorMessage}\n\nContract has been saved to your account and can be sent manually later.`);
          }
        }
        
        // Show success message if email was sent
        if (emailSent) {
          alert(`Contract sent successfully! ✅\n\nSent to: ${contractData.recipientName} (${contractData.recipientEmail})\n\nAttachment: ${contractData.file.name}`);
        }
      } else {
        // Send a simple test email without contract
        const formData = new FormData();
        formData.append('to', contractData.recipientEmail);
        formData.append('subject', 'Test Email from Proptii');
        formData.append('html', `
          <h2>Hello ${contractData.recipientName}!</h2>
          <p>This is a test email from Proptii Property Management System.</p>
          ${contractData.additionalEmail ? `<p>${contractData.additionalEmail}</p>` : ''}
          <p>Best regards,<br>Proptii Team</p>
        `);
        
        const response = await axios.post(`${API_BASE_URL}/email/send`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        });
        
        console.log('Test email sent successfully');
        alert(`Test email sent successfully to ${contractData.recipientName} (${contractData.recipientEmail})!`);
      }
      
      setIsSendModalOpen(false);
    } catch (err: any) {
      console.error('Error sending email:', err);
      const errorMessage = err?.message || 'Failed to send email. Please try again.';
      setError(errorMessage);
      
      // Show error message
      alert(`Error sending email: ${errorMessage}`);
    }
  };

  const handleViewContract = (contract: Contract) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      window.open(contract.fileUrl, '_blank');
    }
  };

  const handleDownloadContract = (contract: Contract) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      const link = document.createElement('a');
      link.href = contract.fileUrl;
      link.download = contract.fileName;
      link.click();
    }
  };

  // Selection functions
  const toggleContractSelection = (contractId: string) => {
    const newSelected = new Set(selectedContracts);
    if (newSelected.has(contractId)) {
      newSelected.delete(contractId);
    } else {
      newSelected.add(contractId);
    }
    setSelectedContracts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllContracts = (contractsToSelect: Contract[]) => {
    if (selectedContracts.size === contractsToSelect.length && contractsToSelect.length > 0) {
      setSelectedContracts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedContracts(new Set(contractsToSelect.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  const clearSelection = () => {
    setSelectedContracts(new Set());
    setShowBulkActions(false);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedContracts.size > 0) {
      const confirmMessage = `Are you sure you want to delete ${selectedContracts.size} contract${selectedContracts.size > 1 ? 's' : ''}?`;
      if (window.confirm(confirmMessage)) {
        try {
          const deletePromises = Array.from(selectedContracts).map(contractId => 
            contractService.deleteContract(contractId).catch(err => {
              console.error(`Error deleting contract ${contractId}:`, err);
              return null;
            })
          );
          await Promise.all(deletePromises);
          await loadContracts();
          clearSelection();
        } catch (err) {
          console.error('Error deleting contracts:', err);
          setError('Failed to delete some contracts. Please try again.');
        }
      }
    }
  };

  const handleBulkExport = async (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (selectedContracts.size > 0) {
      const selectedContractsData = contracts.filter(c => selectedContracts.has(c.id));
      
      if (format === 'json') {
        const jsonData = JSON.stringify(selectedContractsData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contracts_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csvRows = [
          ['Title', 'Property Address', 'Tenant Name', 'Tenant Email', 'Status', 'Sent Date', 'Expiry Date'],
          ...selectedContractsData.map(c => [
            c.title,
            c.propertyAddress,
            c.tenantName,
            c.tenantEmail,
            c.status,
            c.sentDate.toLocaleDateString(),
            c.expiryDate?.toLocaleDateString() || ''
          ])
        ];
        const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contracts_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        console.log(`Export as ${format} not yet implemented`);
        alert(`Export as ${format.toUpperCase()} will be implemented soon.`);
      }
      
      clearSelection();
    }
  };

  const handleBulkArchive = async () => {
    if (selectedContracts.size > 0) {
      // Archive functionality could mark contracts as archived in the database
      // For now, just show a message
      console.log(`Archiving ${selectedContracts.size} contracts`);
      alert(`Archive functionality will be implemented soon. ${selectedContracts.size} contract(s) selected.`);
      clearSelection();
    }
  };

  const ContractTable = ({ contracts }: { contracts: Contract[] }) => {
    const isAllSelected = selectedContracts.size === contracts.length && contracts.length > 0;
    const isPartiallySelected = selectedContracts.size > 0 && selectedContracts.size < contracts.length;

    return (
      <div className="space-y-4">
        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-800">
                  {selectedContracts.size} contract{selectedContracts.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-orange-600 hover:text-orange-800"
                >
                  Clear selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchive}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ fontFamily: 'Archivo, sans-serif', width: '50px' }}>
                  <button
                    onClick={() => selectAllContracts(contracts)}
                    className="flex items-center justify-center"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : isPartiallySelected ? (
                      <CheckSquare className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </TableHead>
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
                    <button
                      onClick={() => toggleContractSelection(contract.id)}
                      className="flex items-center justify-center"
                    >
                      {selectedContracts.has(contract.id) ? (
                        <CheckSquare className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </TableCell>
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
                    <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadContract(contract)}>
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
      </div>
    );
  };

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
            className="flex items-center space-x-2 px-6 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0"
            style={{ 
              backgroundColor: '#DC5F12', 
              borderColor: '#DC5F12', 
              minWidth: '180px',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              fontFamily: 'Archivo, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            <Send className="w-4 h-4" strokeWidth={2.5} />
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
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>Contracts expiring soon</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Loading contracts...
                </p>
              </Card>
            ) : error ? (
              <Card className="p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>Error</h3>
                <p className="text-muted-foreground mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  {error}
                </p>
                <Button 
                  onClick={loadContracts}
                  style={{ backgroundColor: '#DC5F12', fontFamily: 'Archivo, sans-serif' }}
                >
                  Try Again
                </Button>
              </Card>
            ) : sentContracts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>No sent contracts</h3>
                <p className="text-muted-foreground mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Your sent contracts will appear here
                </p>
              </Card>
            ) : (
              <ContractTable contracts={sentContracts} />
            )}
          </TabsContent>

          <TabsContent value="unsigned" className="space-y-4">
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Loading contracts...
                </p>
              </Card>
            ) : unsignedContracts.length === 0 ? (
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
            {loading ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Loading contracts...
                </p>
              </Card>
            ) : signedContracts.length === 0 ? (
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
        tenants={tenants}
      />
    </div>
  );
}
