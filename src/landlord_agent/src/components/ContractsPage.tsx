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
  AlertCircle,
  Trash2,
  Search,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SendContractModal } from './SendContractModal';
import { LandlordEmptyState } from './LandlordEmptyState';
import { contractService } from '../services/contractService';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

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
  userProfile?: { name?: string; email?: string } | null;
  onBack?: () => void;
  onSignIn?: () => void;
}

export function ContractsPage({ tenants = [], userProfile, onBack, onSignIn }: ContractsPageProps) {
  const [activeTab, setActiveTab] = useState<'sent' | 'unsigned' | 'signed'>('sent');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landlordEmail, setLandlordEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successData, setSuccessData] = useState<{ recipientName: string; recipientEmail: string; fileName: string } | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Get landlord email and userId from localStorage/auth on component mount
  useEffect(() => {
    const getUserInfo = () => {
      // Try to get from localStorage (set during login/registration)
      const storedEmail = localStorage.getItem('landlordEmail');
      if (storedEmail) {
        console.log('✅ Found landlord email in localStorage:', storedEmail);
        setLandlordEmail(storedEmail);
      }

      // Try to get userId and email from proptii_auth_state
      const authState = localStorage.getItem('proptii_auth_state');
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          if (parsed?.user?.email && !storedEmail) {
            console.log('✅ Found landlord email in auth state:', parsed.user.email);
            setLandlordEmail(parsed.user.email);
          }
          
          // Get userId
          const uid = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
          if (uid) {
            console.log('✅ Found userId in auth state:', uid);
            setUserId(uid);
          }
        } catch (e) {
          console.error('Error parsing auth state:', e);
        }
      }

      // Try to get userId from query parameter
      const params = new URLSearchParams(window.location.search);
      const uidFromQuery = params.get('uid');
      if (uidFromQuery) {
        console.log('✅ Found userId in query param:', uidFromQuery);
        setUserId(uidFromQuery);
      }
    };

    getUserInfo();
  }, []);

  // Load contracts when tab changes or landlordEmail/userId is set
  useEffect(() => {
    loadContracts();
  }, [activeTab, landlordEmail, userId]);

  // Open Send Contract modal when arriving via deep link (e.g. from home/onboarding)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('contracts_openSendModal') === '1') {
        sessionStorage.removeItem('contracts_openSendModal');
        setIsSendModalOpen(true);
      }
    } catch (_) {}
  }, []);

  // Listen for tour-triggered modal open/close
  useEffect(() => {
    const open = () => setIsSendModalOpen(true);
    const close = () => setIsSendModalOpen(false);
    window.addEventListener('proptii-open-send-contract-modal', open);
    window.addEventListener('proptii-close-send-contract-modal', close);
    return () => {
      window.removeEventListener('proptii-open-send-contract-modal', open);
      window.removeEventListener('proptii-close-send-contract-modal', close);
    };
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusMap: Record<string, Contract['status']> = {
        'sent': 'sent',
        'unsigned': 'unsigned',
        'signed': 'signed'
      };
      
      // Build filters
      const filters: any = {
        status: statusMap[activeTab]
      };
      
      // Add all available user identifiers to maximize chances of finding contracts
      // Some contracts may have userId, others may have landlordId, others may have landlordEmail
      if (userId) {
        filters.userId = userId;
        // Also try userId as landlordId since they might be the same
        filters.landlordId = userId;
        console.log('🔍 Loading contracts with userId and landlordId filters:', userId);
      }
      
      if (landlordEmail) {
        filters.landlordEmail = landlordEmail;
        console.log('🔍 Loading contracts with landlordEmail filter:', landlordEmail);
      }
      
      if (!userId && !landlordEmail) {
        console.log('⚠️ No userId or landlordEmail - loading all contracts');
      }
      
      const fetchedContracts = await contractService.getContracts(filters);
      console.log(`✅ Loaded ${fetchedContracts.length} contracts for status: ${statusMap[activeTab]}`);
      setContracts(fetchedContracts);
    } catch (err) {
      console.error('❌ Error loading contracts:', err);
      setError('Failed to load contracts. Please try again.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Base filtered contracts (by status)
  const baseSentContracts = contracts.filter(c => c.status === 'sent');
  const baseUnsignedContracts = contracts.filter(c => c.status === 'unsigned');
  const baseSignedContracts = contracts.filter(c => c.status === 'signed');

  // Filter contracts based on search term
  const filterContracts = (contractsList: Contract[]) => {
    if (!searchTerm.trim()) return contractsList;
    
    const term = searchTerm.toLowerCase();
    return contractsList.filter(contract =>
      contract.title.toLowerCase().includes(term) ||
      contract.fileName.toLowerCase().includes(term) ||
      contract.tenantName.toLowerCase().includes(term) ||
      contract.tenantEmail.toLowerCase().includes(term) ||
      contract.propertyAddress.toLowerCase().includes(term)
    );
  };

  const sentContracts = filterContracts(baseSentContracts);
  const unsignedContracts = filterContracts(baseUnsignedContracts);
  const signedContracts = filterContracts(baseSignedContracts);

  // Get current tab contracts
  const getCurrentTabContracts = () => {
    switch (activeTab) {
      case 'sent': return sentContracts;
      case 'unsigned': return unsignedContracts;
      case 'signed': return signedContracts;
      default: return [];
    }
  };

  const currentTabContracts = getCurrentTabContracts();

  // Calculate overview metrics (use base contracts, not filtered)
  const totalSent = baseSentContracts.length;
  const expiringSoon = baseSentContracts.filter(c => 
    c.expiryDate && c.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;
  const pendingSignature = baseUnsignedContracts.length;

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
      // Check file size before conversion
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        reject(new Error(`File is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`));
        return;
      }

      // Warn about large files
      if (file.size > 20 * 1024 * 1024) {
        console.log('Processing large file:', file.name, `${(file.size / (1024 * 1024)).toFixed(2)}MB. This may take a moment...`);
      }

      const reader = new FileReader();
      
      // Set timeout for very large files (5 minutes)
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File conversion timed out. The file may be too large. Please try a smaller file or compress it.'));
      }, 5 * 60 * 1000);

      reader.onload = () => {
        clearTimeout(timeout);
        const result = reader.result as string;
        console.log('File converted to base64. Original size:', file.size, 'bytes. Base64 size:', result.length, 'bytes');
        resolve(result);
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error converting file to base64:', error);
        reject(new Error('Failed to process file. Please try again or use a different file.'));
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 100);
          console.log(`File conversion progress: ${percentLoaded}%`);
        }
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
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
        ? 'http://localhost:3000/api'
        : 'https://proptii-r1-1a.onrender.com/api';
      
      if (contractData.file) {
        // Convert file to base64 and send email with attachment
        console.log('Converting file to base64:', contractData.file.name, `(${(contractData.file.size / (1024 * 1024)).toFixed(2)}MB)`);
        
        let base64Data: string;
        try {
          base64Data = await fileToBase64(contractData.file);
        } catch (conversionError: any) {
          console.error('Error converting file to base64:', conversionError);
          const errorMessage = conversionError?.message || 'Failed to process file. The file may be too large or corrupted.';
          setError(errorMessage);
          alert(`Error: ${errorMessage}\n\nPlease try:\n- Compressing the file\n- Using a smaller file\n- Checking the file is not corrupted`);
          return;
        }
        
        // Extract base64 content (remove data:application/pdf;base64, prefix)
        const base64Content = base64Data.split(',')[1];
        const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
        
        console.log('File converted to base64, size:', base64Content.length, 'bytes');
        
        const formData = new FormData();
        formData.append('to', contractData.recipientEmail);
        formData.append('subject', `Contract for Review: ${contractData.file.name}`);
        formData.append('html', `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .cta-button {
                display: inline-block;
                background-color: #DC5F12;
                color: white !important;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 50px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <h2>Hello ${contractData.recipientName}!</h2>
            <p>Please find attached your contract for review.</p>
            ${contractData.additionalEmail ? `<p>${contractData.additionalEmail}</p>` : ''}
            <div style="text-align: center;">
              <a href="https://proptii-frontend.onrender.com/contracts" class="cta-button">View Contracts</a>
            </div>
            <p>Best regards,<br>Proptii Team</p>
          </body>
          </html>
        `);
        
        // Send base64 data separately so backend can decode it
        formData.append('attachmentBase64', base64Content);
        formData.append('attachmentFilename', contractData.file.name);
        formData.append('attachmentMimeType', mimeType);
        
        // Log request details for debugging
        const fileSizeMB = contractData.file.size / (1024 * 1024);
        const base64SizeMB = base64Content.length / (1024 * 1024);
        console.log(`Sending file:`, {
          fileName: contractData.file.name,
          originalSize: `${fileSizeMB.toFixed(2)}MB`,
          base64Size: `${base64SizeMB.toFixed(2)}MB`,
          base64Length: base64Content.length,
          recipientEmail: contractData.recipientEmail,
          hasSubject: !!formData.get('subject'),
          hasHtml: !!formData.get('html')
        });
        
        // Calculate timeout based on file size (minimum 30s, add 1s per MB)
        const timeout = Math.max(30000, 30000 + (fileSizeMB * 1000)); // 30s base + 1s per MB
        
        console.log(`Sending file (${fileSizeMB.toFixed(2)}MB) with timeout: ${timeout}ms`);
        
        let response;
        try {
          response = await axios.post(`${API_BASE_URL}/email/send-base64`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: timeout,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
              }
            }
          });
        } catch (uploadError: any) {
          console.error('Error uploading file:', uploadError);
          console.error('Error response:', uploadError?.response);
          console.error('Error response data:', uploadError?.response?.data);
          
          let errorMessage = 'Failed to upload file. Please try again.';
          
          if (uploadError.code === 'ECONNABORTED') {
            errorMessage = 'Upload timed out. The file may be too large. Please try a smaller file or compress it.';
            setError(errorMessage);
            alert('Upload timed out. The file may be too large. Please try:\n- Compressing the file\n- Using a smaller file\n- Checking your internet connection');
            return;
          }
          
          if (uploadError.response?.status === 413) {
            errorMessage = 'File is too large for the server. Maximum size is 50MB.';
            setError(errorMessage);
            alert('File is too large for the server. Please use a file smaller than 50MB.');
            return;
          }
          
          // Extract error message from various possible response formats
          if (uploadError.response?.data) {
            const errorData = uploadError.response.data;
            
            // Try different possible error message fields
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.error) {
              errorMessage = typeof errorData.error === 'string' 
                ? errorData.error 
                : JSON.stringify(errorData.error);
            } else if (errorData.message) {
              errorMessage = typeof errorData.message === 'string'
                ? errorData.message
                : JSON.stringify(errorData.message);
            } else if (errorData.details) {
              // If details is a string, use it; otherwise format it
              errorMessage = typeof errorData.details === 'string'
                ? errorData.details
                : `Server error: ${errorData.error || 'Unknown error'}. Check console for details.`;
            } else {
              // Last resort: stringify the whole error data
              errorMessage = `Server error: ${JSON.stringify(errorData)}`;
            }
          } else if (uploadError.message) {
            errorMessage = uploadError.message;
          }
          
          // Add status code if available
          if (uploadError.response?.status) {
            errorMessage = `[${uploadError.response.status}] ${errorMessage}`;
          }
          
          setError(errorMessage);
          alert(`Upload failed: ${errorMessage}\n\nPlease check the console for more details.`);
          return;
        }
        
        console.log('Contract email sent successfully with attachment');
        
        // Save contract to Firestore for tracking
        try {
          // Get userId if not already set
          const currentUserId = userId || (() => {
            try {
              const authState = localStorage.getItem('proptii_auth_state');
              if (authState) {
                const parsed = JSON.parse(authState);
                return parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId || '';
              }
              const params = new URLSearchParams(window.location.search);
              return params.get('uid') || '';
            } catch (e) {
              console.error('Error getting userId:', e);
              return '';
            }
          })();

          if (!currentUserId) {
            console.warn('⚠️ No userId found - contract will be saved without userId');
          }

          const contractId = await contractService.createContractWithBase64({
            title: contractData.file.name.replace(/\.[^/.]+$/, ''),
            propertyAddress: '',
            tenantName: contractData.recipientName,
            tenantEmail: contractData.recipientEmail,
            contractType: 'tenancy-agreement',
            additionalInfo: contractData.additionalEmail,
            status: 'sent',
            sentDate: new Date(),
            expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            landlordEmail: landlordEmail || undefined, // Include landlord email for filtering
          } as any, contractData.file.name, base64Data, currentUserId || 'unknown');
          
          console.log('Contract saved to Firestore:', contractId);
          
          // Reload contracts to show the new one
          await loadContracts();
        } catch (firestoreError) {
          console.error('Error saving contract to Firestore:', firestoreError);
          // Don't fail the whole operation if Firestore save fails
        }
        
        // Show success screen instead of alert
        setSuccessData({
          recipientName: contractData.recipientName,
          recipientEmail: contractData.recipientEmail,
          fileName: contractData.file.name
        });
        setShowSuccessScreen(true);
        setIsSendModalOpen(false);
      } else {
        // Send a simple test email without contract
        const formData = new FormData();
        formData.append('to', contractData.recipientEmail);
        formData.append('subject', 'Test Email from Proptii');
        formData.append('html', `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .cta-button {
                display: inline-block;
                background-color: #DC5F12;
                color: white !important;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 50px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <h2>Hello ${contractData.recipientName}!</h2>
            <p>This is a test email from Proptii Property Management System.</p>
            ${contractData.additionalEmail ? `<p>${contractData.additionalEmail}</p>` : ''}
            <div style="text-align: center;">
              <a href="https://proptii-frontend.onrender.com/contracts" class="cta-button">View Contracts</a>
            </div>
            <p>Best regards,<br>Proptii Team</p>
          </body>
          </html>
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

  // Selection handlers
  const toggleContractSelection = (contractId: string) => {
    setSelectedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const selectAllContracts = (contracts: Contract[]) => {
    if (selectedContracts.size === contracts.length && contracts.length > 0) {
      setSelectedContracts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedContracts(new Set(contracts.map(c => c.id)));
      setShowBulkActions(contracts.length > 0);
    }
  };

  const clearSelection = () => {
    setSelectedContracts(new Set());
    setShowBulkActions(false);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedContracts.size === 0) return;

    const count = selectedContracts.size;
    const confirmMessage = `Are you sure you want to delete ${count} contract${count > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      const deletePromises = Array.from(selectedContracts).map(contractId =>
        contractService.deleteContract(contractId).catch(err => {
          console.error(`Error deleting contract ${contractId}:`, err);
          return { success: false, contractId, error: err };
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => r && !r.success);
      
      if (failed.length > 0) {
        console.error('Some contracts failed to delete:', failed);
        alert(`${failed.length} contract${failed.length > 1 ? 's' : ''} failed to delete. Check console for details.`);
      } else {
        console.log(`Successfully deleted ${count} contract${count > 1 ? 's' : ''}`);
      }

      clearSelection();
      await loadContracts();
    } catch (error) {
      console.error('Error during bulk delete:', error);
      setError('Failed to delete contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update showBulkActions when selection changes
  useEffect(() => {
    setShowBulkActions(selectedContracts.size > 0);
  }, [selectedContracts]);

  // Clear selection when tab changes
  useEffect(() => {
    clearSelection();
  }, [activeTab]);

  const ContractTable = ({ contracts }: { contracts: Contract[] }) => {
    const isAllSelected = selectedContracts.size === contracts.length && contracts.length > 0;
    const isPartiallySelected = selectedContracts.size > 0 && selectedContracts.size < contracts.length;

    return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={() => selectAllContracts(contracts)}
                className={isPartiallySelected ? 'data-[state=checked]:bg-orange-500' : ''}
              />
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
            <TableRow 
              key={contract.id} 
              className={`hover:bg-gray-50 ${selectedContracts.has(contract.id) ? 'bg-blue-50' : ''}`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedContracts.has(contract.id)}
                  onCheckedChange={() => toggleContractSelection(contract.id)}
                />
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
                    {/* Show badge if contract was synced from tenant app */}
                    {contract.additionalInfo && contract.additionalInfo.includes('Signed contract sent from tenant app') && (
                      <Badge className="mt-1 bg-green-100 text-green-800 border-0 text-xs">
                        Received from Tenant
                      </Badge>
                    )}
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
    );
  };

  // Show success screen
  if (showSuccessScreen && successData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
              Contract Sent Successfully!
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
              A contract has been sent to <strong>{successData.recipientName}</strong>
            </p>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Email: <strong>{successData.recipientEmail}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    Attachment: <strong>{successData.fileName}</strong>
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowSuccessScreen(false);
                setSuccessData(null);
              }}
              className="w-full"
              style={{ 
                backgroundColor: '#DC5F12', 
                borderColor: '#DC5F12',
                fontFamily: 'Archivo, sans-serif'
              }}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            data-demo-send-contract-cta="1"
            className="flex items-center space-x-2 px-6 py-3 min-h-[3.5rem] rounded-full transition-all duration-300 flex-shrink-0"
            style={{ 
              backgroundColor: '#DC5F12', 
              borderColor: '#DC5F12', 
              minWidth: '180px',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              fontFamily: 'Archivo, sans-serif'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
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

        {!userProfile && onSignIn ? (
          <Card className="p-12">
            <LandlordEmptyState onSignIn={onSignIn} />
          </Card>
        ) : (
        <>
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

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contracts by title, tenant, email, or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  {currentTabContracts.length} result{currentTabContracts.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                    {selectedContracts.size} contract{selectedContracts.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={loading}
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'sent' | 'unsigned' | 'signed')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sent">
              Sent ({sentContracts.length})
            </TabsTrigger>
            <TabsTrigger value="unsigned">
              Unsigned ({unsignedContracts.length})
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
        </>
        )}
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
