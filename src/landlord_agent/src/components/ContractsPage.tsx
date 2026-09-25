import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Clock,
  CheckCircle,
  Eye,
  Download,
  MoreHorizontal,
  FileText,
  Send,
  AlertCircle,
  Search,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  Settings,
  Bell,
  RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SendContractModal } from './SendContractModal';
import { contractService } from '../services/contractService';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { getLandlordTwoDummyContracts, isLandlordTwoTestAccount } from '../data/landlordTwoDummyContracts';
import { getAgentDummyContracts, isAgentTestAccount } from '../data/agentTestPersona';
import { Property, UserProfile } from '../App';
import { PRIMARY_API_BASE_URL } from '../../../utils/apiEndpoints';
import { useAuth } from '../../../contexts/AuthContext';
import '../styles/contractsPage.css';

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
  onBack?: () => void;
  userProfile?: UserProfile | null;
  properties?: Property[];
  onAddProperty?: () => void;
  onViewInsights?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
}

type Subsection = 'sent' | 'unsigned' | 'signed' | 'all';
type StatusFilter = 'all' | 'sent' | 'pending' | 'signed' | 'expiring';

const TYPE_LABELS: Record<Contract['contractType'], string> = {
  'tenancy-agreement': 'Tenancy agreement',
  'deposit-certificate': 'Deposit certificate',
  'right-to-rent': 'Right to rent',
  other: 'Other',
};

const AVATAR_TONES = ['blue', 'teal', 'violet', 'amber', 'rose'] as const;

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  narrow,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  narrow?: boolean;
}) {
  const selected = options.find((option) => option.value === value);
  const display = value === 'all' ? label : selected?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={`ll-ct-filter${narrow ? ' narrow' : ''}${value !== 'all' ? ' is-active' : ''}`}>
          <span>{display}</span>
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="ll-ct-filter-menu rounded-[14px] border-slate-200 bg-white p-1.5 min-w-[200px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`ll-ct-filter-item${value === option.value ? ' is-selected' : ''}`}
            onSelect={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {value === option.value ? <Check size={14} strokeWidth={2.5} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function tenantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function avatarTone(name: string): (typeof AVATAR_TONES)[number] {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function propertyParts(address: string): { property: string; unit: string } {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    property: parts[0] || address || '—',
    unit: parts.slice(1).join(', ') || '—',
  };
}

function isExpiringSoon(contract: Contract): boolean {
  if (!contract.expiryDate) return false;
  return contract.expiryDate.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function displayStatus(contract: Contract): StatusFilter {
  if (isExpiringSoon(contract) && contract.status !== 'signed') return 'expiring';
  if (contract.status === 'unsigned') return 'pending';
  if (contract.status === 'signed') return 'signed';
  return 'sent';
}

function statusChip(contract: Contract): { key: 'sent' | 'pending' | 'signed' | 'expiring'; label: string } {
  const visual = displayStatus(contract);
  if (visual === 'pending') return { key: 'pending', label: 'Pending Signature' };
  if (visual === 'expiring') return { key: 'expiring', label: 'Expiring Soon' };
  if (visual === 'signed') return { key: 'signed', label: 'Signed & Active' };
  return { key: 'sent', label: 'Sent' };
}

function StatusPill({ contract }: { contract: Contract }) {
  const chip = statusChip(contract);
  return (
    <span className={`ll-ct-status is-${chip.key}`}>
      <span className="dot" aria-hidden />
      {chip.label}
    </span>
  );
}

function formatPeriod(contract: Contract): string {
  const sent = contract.sentDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (contract.expiryDate) {
    const end = contract.expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${sent} – ${end}`;
  }
  return sent || '—';
}

export function ContractsPage({
  tenants = [],
  onBack,
  userProfile,
  properties = [],
  onAddProperty,
  onViewInsights,
  onViewSettings,
  onViewNotifications,
}: ContractsPageProps) {
  const { user } = useAuth();
  const landlordEmail = user?.email ?? userProfile?.email ?? null;
  const userId = user?.id ?? null;

  const [subsection, setSubsection] = useState<Subsection>('sent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successData, setSuccessData] = useState<{ recipientName: string; recipientEmail: string; fileName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId && !landlordEmail) {
      setContracts([]);
      setLoading(false);
      return;
    }
    loadContracts();
  }, [userId, landlordEmail]);

  const loadContracts = async () => {
    if (!userId && !landlordEmail) {
      setContracts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (userId) { filters.userId = userId; filters.landlordId = userId; }
      if (landlordEmail) { filters.landlordEmail = landlordEmail; }
      const fetchedContracts = await contractService.getContracts(filters);
      const dummy = isAgentTestAccount(userId, landlordEmail)
        ? getAgentDummyContracts()
        : isLandlordTwoTestAccount(userId, landlordEmail)
          ? getLandlordTwoDummyContracts()
          : null;
      if (dummy) {
        const byId = new Map(dummy.map((contract) => [contract.id, contract]));
        fetchedContracts.forEach((contract) => byId.set(contract.id, contract));
        setContracts(Array.from(byId.values()));
      } else {
        setContracts(fetchedContracts);
      }
    } catch (err) {
      console.error('Error loading contracts:', err);
      if (isAgentTestAccount(userId, landlordEmail)) {
        setError(null);
        setContracts(getAgentDummyContracts());
      } else if (isLandlordTwoTestAccount(userId, landlordEmail)) {
        setError(null);
        setContracts(getLandlordTwoDummyContracts());
      } else {
        setError('Failed to load contracts. Please try again.');
        setContracts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sentContracts = useMemo(() => contracts.filter((c) => c.status === 'sent'), [contracts]);
  const unsignedContracts = useMemo(() => contracts.filter((c) => c.status === 'unsigned'), [contracts]);
  const signedContracts = useMemo(() => contracts.filter((c) => c.status === 'signed'), [contracts]);

  const subsectionContracts = useMemo(() => {
    if (subsection === 'unsigned') return unsignedContracts;
    if (subsection === 'signed') return signedContracts;
    if (subsection === 'sent') return sentContracts;
    return contracts;
  }, [subsection, contracts, sentContracts, unsignedContracts, signedContracts]);

  const propertyOptions = useMemo(() => {
    const set = new Set<string>();
    contracts.forEach((c) => {
      const name = propertyParts(c.propertyAddress).property;
      if (name && name !== '—') set.add(name);
    });
    (properties || []).forEach((p) => {
      const name = propertyParts(p.address || '').property;
      if (name && name !== '—') set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contracts, properties]);

  const filteredContracts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return subsectionContracts.filter((contract) => {
      const visual = displayStatus(contract);
      if (statusFilter !== 'all') {
        if (statusFilter === 'sent') {
          if (contract.status !== 'sent' && visual !== 'sent') return false;
        } else if (visual !== statusFilter && !(statusFilter === 'pending' && contract.status === 'unsigned')) {
          return false;
        }
      }
      const { property } = propertyParts(contract.propertyAddress);
      if (propertyFilter !== 'all' && property !== propertyFilter) return false;
      if (typeFilter !== 'all' && contract.contractType !== typeFilter) return false;
      if (query) {
        const hay = `${contract.title} ${contract.fileName} ${contract.tenantName} ${contract.tenantEmail} ${contract.propertyAddress}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [subsectionContracts, statusFilter, propertyFilter, typeFilter, searchQuery]);

  const kpiPending = subsectionContracts.filter((c) => c.status === 'unsigned' || displayStatus(c) === 'pending').length;
  const kpiSigned = subsectionContracts.filter((c) => c.status === 'signed').length;
  const kpiExpiring = subsectionContracts.filter((c) => isExpiringSoon(c)).length;

  const kpiTotalLabel =
    subsection === 'sent' ? 'Total Sent' : subsection === 'unsigned' ? 'Total Unsigned' : subsection === 'signed' ? 'Total Signed' : 'Total Contracts';
  const kpiTotalSub =
    subsection === 'sent' ? 'Dispatched for review' : subsection === 'unsigned' ? 'Awaiting signature' : subsection === 'signed' ? 'Fully executed' : 'Across active portfolio';

  const filtersActive = statusFilter !== 'all' || propertyFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setPropertyFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
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
      
      const API_BASE_URL = PRIMARY_API_BASE_URL;
      
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

        // ── Save contract record BEFORE sending the email ──────────────────
        // This ensures we always have a Firestore record even if the email fails.
        let savedContractId: string | null = null;
        try {
          const currentUserId = userId ?? '';
          savedContractId = await contractService.createContractWithBase64({
            title: contractData.file.name.replace(/\.[^/.]+$/, ''),
            propertyAddress: '',
            tenantName: contractData.recipientName,
            tenantEmail: contractData.recipientEmail,
            contractType: 'tenancy-agreement',
            additionalInfo: contractData.additionalEmail,
            status: 'sent',
            sentDate: new Date(),
            expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            landlordEmail: landlordEmail || undefined,
          } as any, contractData.file.name, base64Data, currentUserId || 'unknown');
          console.log('✅ Contract saved to Firestore before email send:', savedContractId);
        } catch (saveError: any) {
          console.error('Failed to save contract record:', saveError);
          const saveMsg = saveError?.message || 'Failed to save the contract record. Please try again.';
          setError(saveMsg);
          alert(`Could not save contract: ${saveMsg}`);
          return; // Abort — don't send email if we can't track the contract
        }
        
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
              <a href="${((import.meta as any)?.env?.VITE_APP_URL || (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://proptii.co')}/contracts" class="cta-button">View Contracts</a>
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
        
        // Contract is already saved to Firestore (done above before sending email)
        // Reload contracts to show the new one
        await loadContracts();
        
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
              <a href="${((import.meta as any)?.env?.VITE_APP_URL || (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://proptii.co')}/contracts" class="cta-button">View Contracts</a>
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

  const handleClearSelection = () => {
    setSelectedContracts(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedContracts.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedContracts.size} contract(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedContracts).map(contractId =>
        contractService.deleteContract(contractId).catch(err => {
          console.error(`Error deleting contract ${contractId}:`, err);
          return { error: err };
        })
      );

      await Promise.all(deletePromises);
      
      // Clear selection and reload contracts
      setSelectedContracts(new Set());
      await loadContracts();
    } catch (err) {
      console.error('Error deleting contracts:', err);
      setError('Failed to delete some contracts. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOne = async (contractId: string) => {
    if (!window.confirm('Delete this contract? This cannot be undone.')) return;
    try {
      await contractService.deleteContract(contractId);
      setSelectedContracts((prev) => {
        const next = new Set(prev);
        next.delete(contractId);
        return next;
      });
      await loadContracts();
    } catch (err) {
      console.error('Error deleting contract:', err);
      setError('Failed to delete contract. Please try again.');
    }
  };

  const renderActions = (contract: Contract) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ll-ct-action" title="Actions" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ll-ct-filter-menu rounded-[14px] border-slate-200 bg-white p-1.5 min-w-[180px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <DropdownMenuItem className="ll-ct-filter-item" onSelect={() => handleViewContract(contract)}>
          <Eye size={14} /> View Details
        </DropdownMenuItem>
        <DropdownMenuItem className="ll-ct-filter-item" onSelect={() => handleDownloadContract(contract)}>
          <Download size={14} /> Download PDF
        </DropdownMenuItem>
        {contract.status === 'unsigned' && (
          <DropdownMenuItem className="ll-ct-filter-item" onSelect={() => handleMarkAsSigned(contract.id)}>
            <CheckCircle size={14} /> Mark as Signed
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="ll-ct-filter-item" onSelect={() => handleDeleteOne(contract.id)}>
          <Trash2 size={14} /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (showSuccessScreen && successData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fbfbfe', fontFamily: 'Archivo, sans-serif' }}>
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#374957' }}>
              Contract Sent Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              A contract has been sent to <strong>{successData.recipientName}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Email: <strong>{successData.recipientEmail}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800">
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
              style={{ backgroundColor: '#DC5F12', borderColor: '#DC5F12' }}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId && !landlordEmail) {
    return <LandlordPageEmptyShell page="contracts" variant="guest" />;
  }

  if ((userId || landlordEmail) && isNewPortfolioUser(properties) && !isLandlordTwoTestAccount(userId, landlordEmail) && !isAgentTestAccount(userId, landlordEmail)) {
    return (
      <LandlordPageEmptyShell
        page="contracts"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile?.name}
      />
    );
  }

  const subsectionTabs: { id: Subsection; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'sent', label: 'Sent', count: sentContracts.length, icon: <Send size={16} /> },
    { id: 'unsigned', label: 'Unsigned', count: unsignedContracts.length, icon: <Clock size={16} /> },
    { id: 'signed', label: 'Signed', count: signedContracts.length, icon: <CheckCircle size={16} /> },
    { id: 'all', label: 'All', count: contracts.length, icon: null },
  ];

  return (
    <div className="ll-ct">
      <header className="ll-ct-header">
        <div className="ll-ct-inner ll-ct-header-inner">
          <div>
            <h1>Contracts</h1>
            <p>Manage, track, and send property lease agreements.</p>
          </div>
          <div className="ll-ct-header-actions">
            <button type="button" className="ll-ct-header-icon" title="Settings" onClick={onViewSettings}>
              <Settings size={16} />
            </button>
            <button type="button" className="ll-ct-header-icon" title="Notifications" onClick={onViewNotifications}>
              <Bell size={16} />
              <span className="ll-ct-header-dot" />
            </button>
            {onViewInsights && (
              <button type="button" className="ll-ct-btn-insights" onClick={onViewInsights}>
                <span className="ll-ct-insights-icon">
                  <Sparkles size={12} />
                </span>
                Portfolio Insights
              </button>
            )}
            <button type="button" className="ll-ct-btn-send" onClick={() => setIsSendModalOpen(true)}>
              <Send size={14} />
              Send Contract
            </button>
          </div>
        </div>
      </header>

      <div className="ll-ct-inner ll-ct-body">
        <div className="ll-ct-subtabs">
          {subsectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ll-ct-subtab${subsection === tab.id ? ' active' : ''}`}
              onClick={() => {
                setSubsection(tab.id);
                setSelectedContracts(new Set());
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="ll-ct-subtab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <section className="ll-ct-kpi-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={`kpi-skel-${i}`} className="ll-ct-kpi skel" aria-hidden>
                  <div className="ll-ct-skel ll-ct-skel-icon" />
                  <div className="ll-ct-skel-lines">
                    <div className="ll-ct-skel" style={{ height: 12, width: 80 }} />
                    <div className="ll-ct-skel" style={{ height: 24, width: 48 }} />
                    <div className="ll-ct-skel" style={{ height: 10, width: 112 }} />
                  </div>
                </div>
              ))
            : (
              <>
                <button type="button" className="ll-ct-kpi" onClick={() => setStatusFilter('all')}>
                  <div className="ll-ct-kpi-icon blue"><FileText size={22} /></div>
                  <div>
                    <div className="ll-ct-kpi-label">{kpiTotalLabel}</div>
                    <div className="ll-ct-kpi-value">{subsectionContracts.length}</div>
                    <div className="ll-ct-kpi-sub">{kpiTotalSub}</div>
                  </div>
                </button>
                <button type="button" className="ll-ct-kpi pending" onClick={() => setStatusFilter('pending')}>
                  <div className="ll-ct-kpi-icon amber"><Clock size={22} /></div>
                  <div>
                    <div className="ll-ct-kpi-label">Pending Signature</div>
                    <div className="ll-ct-kpi-value amber">{kpiPending}</div>
                    <div className="ll-ct-kpi-sub">Awaiting tenant review</div>
                  </div>
                </button>
                <button type="button" className="ll-ct-kpi signed" onClick={() => setStatusFilter('signed')}>
                  <div className="ll-ct-kpi-icon emerald"><CheckCircle size={22} /></div>
                  <div>
                    <div className="ll-ct-kpi-label">Signed & Active</div>
                    <div className="ll-ct-kpi-value emerald">{kpiSigned}</div>
                    <div className="ll-ct-kpi-sub">Legally binding & active</div>
                  </div>
                </button>
                <button type="button" className="ll-ct-kpi expiring" onClick={() => setStatusFilter('expiring')}>
                  <div className="ll-ct-kpi-icon rose"><AlertCircle size={22} /></div>
                  <div>
                    <div className="ll-ct-kpi-label">Expiring Soon</div>
                    <div className="ll-ct-kpi-value rose">{kpiExpiring}</div>
                    <div className="ll-ct-kpi-sub">Requires renewal action</div>
                  </div>
                </button>
              </>
            )}
        </section>

        <div className="ll-ct-filters">
          <div className="ll-ct-filters-row">
            <div className="ll-ct-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search contracts by tenant name, property, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search contracts"
              />
            </div>
            <FilterDropdown
              label="All Properties"
              value={propertyFilter}
              onChange={setPropertyFilter}
              options={[
                { value: 'all', label: 'All Properties' },
                ...propertyOptions.map((name) => ({ value: name, label: name })),
              ]}
            />
            <FilterDropdown
              label="All Statuses"
              value={statusFilter}
              narrow
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'sent', label: 'Sent' },
                { value: 'pending', label: 'Pending Signature' },
                { value: 'signed', label: 'Signed & Active' },
                { value: 'expiring', label: 'Expiring Soon' },
              ]}
            />
            <FilterDropdown
              label="All"
              value={typeFilter}
              narrow
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: 'All' },
                ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
        </div>

        {selectedContracts.size > 0 && (
          <div className="ll-ct-bulk">
            <span>{selectedContracts.size} contract{selectedContracts.size === 1 ? '' : 's'} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={handleClearSelection} disabled={isDeleting}>
                Clear
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting…' : 'Delete selected'}
              </Button>
            </div>
          </div>
        )}

        <div className="ll-ct-table-wrap">
          {error && (
            <div className="ll-ct-error">
              {error}{' '}
              <button type="button" onClick={loadContracts} style={{ marginTop: 12 }}>
                Try again
              </button>
            </div>
          )}

          {!error && (
            <>
              <div className="ll-ct-table-scroll">
                <table className="ll-ct-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property / Unit</th>
                      <th>Contract Title</th>
                      <th>Status</th>
                      <th>Period / Due Date</th>
                      <th className="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skel-${i}`} className="ll-ct-skel-row">
                          <td>
                            <div className="ll-ct-tenant">
                              <div className="ll-ct-skel ll-ct-skel-circle" />
                              <div className="ll-ct-skel-lines">
                                <div className="ll-ct-skel" style={{ height: 12, width: 112 }} />
                                <div className="ll-ct-skel" style={{ height: 10, width: 144 }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ll-ct-skel-lines">
                              <div className="ll-ct-skel" style={{ height: 12, width: 112 }} />
                              <div className="ll-ct-skel" style={{ height: 10, width: 64 }} />
                            </div>
                          </td>
                          <td><div className="ll-ct-skel" style={{ height: 12, width: 144 }} /></td>
                          <td><div className="ll-ct-skel ll-ct-skel-pill" /></td>
                          <td>
                            <div className="ll-ct-skel-lines">
                              <div className="ll-ct-skel" style={{ height: 12, width: 112 }} />
                              <div className="ll-ct-skel" style={{ height: 10, width: 80 }} />
                            </div>
                          </td>
                          <td className="right"><div className="ll-ct-skel ll-ct-skel-action" /></td>
                        </tr>
                      ))}
                    {!loading && filteredContracts.length === 0 && (
                      <tr className="ll-ct-empty-row">
                        <td colSpan={6}>
                          <div className="ll-ct-empty">
                            <div className="ll-ct-empty-icon">
                              <FileText size={28} />
                            </div>
                            <h4>No contracts found</h4>
                            <p>
                              {filtersActive
                                ? `No contracts in "${subsection.toUpperCase()}" match your current filter or search criteria.`
                                : 'Send a contract to start tracking lease agreements here.'}
                            </p>
                            {filtersActive ? (
                              <button type="button" onClick={resetFilters}>
                                <RotateCcw size={14} />
                                Reset Filters
                              </button>
                            ) : (
                              <button type="button" onClick={() => setIsSendModalOpen(true)}>
                                Send Contract
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      filteredContracts.map((contract) => {
                        const parts = propertyParts(contract.propertyAddress);
                        return (
                          <tr key={contract.id} onClick={() => handleViewContract(contract)}>
                            <td>
                              <div className="ll-ct-tenant">
                                <div className={`ll-ct-avatar ${avatarTone(contract.tenantName)}`}>
                                  {tenantInitials(contract.tenantName)}
                                </div>
                                <div>
                                  <div className="ll-ct-tenant-name">{contract.tenantName || 'Unknown tenant'}</div>
                                  <div className="ll-ct-muted">{contract.tenantEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="ll-ct-prop">{parts.property}</div>
                              <div className="ll-ct-muted">{parts.unit}</div>
                            </td>
                            <td>
                              <span title={contract.title}>{contract.title || contract.fileName}</span>
                            </td>
                            <td>
                              <StatusPill contract={contract} />
                            </td>
                            <td>
                              <div>{formatPeriod(contract)}</div>
                              {isExpiringSoon(contract) && contract.expiryDate && (
                                <div className="ll-ct-due">
                                  Due {contract.expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </div>
                              )}
                            </td>
                            <td className="right">{renderActions(contract)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="ll-ct-cards">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={`card-skel-${i}`} className="ll-ct-card" aria-hidden>
                      <div className="ll-ct-tenant" style={{ marginBottom: 10 }}>
                        <div className="ll-ct-skel ll-ct-skel-circle" />
                        <div className="ll-ct-skel-lines">
                          <div className="ll-ct-skel" style={{ height: 12, width: 112 }} />
                          <div className="ll-ct-skel" style={{ height: 10, width: 144 }} />
                        </div>
                      </div>
                      <div className="ll-ct-skel-lines">
                        <div className="ll-ct-skel" style={{ height: 12, width: 128 }} />
                        <div className="ll-ct-skel" style={{ height: 10, width: 72 }} />
                        <div className="ll-ct-skel ll-ct-skel-pill" />
                      </div>
                    </div>
                  ))}
                {!loading && filteredContracts.length === 0 && (
                  <div className="ll-ct-empty">
                    <div className="ll-ct-empty-icon">
                      <FileText size={28} />
                    </div>
                    <h4>No contracts found</h4>
                    <p>
                      {filtersActive
                        ? `No contracts in "${subsection.toUpperCase()}" match your current filter or search criteria.`
                        : 'Send a contract to start tracking lease agreements here.'}
                    </p>
                    {filtersActive ? (
                      <button type="button" onClick={resetFilters}>
                        <RotateCcw size={14} />
                        Reset Filters
                      </button>
                    ) : (
                      <button type="button" onClick={() => setIsSendModalOpen(true)}>
                        Send Contract
                      </button>
                    )}
                  </div>
                )}
                {!loading &&
                  filteredContracts.map((contract) => {
                    const parts = propertyParts(contract.propertyAddress);
                    return (
                      <div key={contract.id} className="ll-ct-card" onClick={() => handleViewContract(contract)}>
                        <div className="ll-ct-tenant" style={{ marginBottom: 10 }}>
                          <div className={`ll-ct-avatar ${avatarTone(contract.tenantName)}`}>
                            {tenantInitials(contract.tenantName)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="ll-ct-tenant-name">{contract.tenantName}</div>
                            <div className="ll-ct-muted">{contract.tenantEmail}</div>
                          </div>
                          {renderActions(contract)}
                        </div>
                        <div className="ll-ct-prop">{parts.property}</div>
                        <div className="ll-ct-muted">{parts.unit}</div>
                        <div style={{ margin: '8px 0' }}>{contract.title || contract.fileName}</div>
                        <StatusPill contract={contract} />
                      </div>
                    );
                  })}
              </div>

              <div className="ll-ct-footer">
                <span>
                  {loading
                    ? 'Loading contracts data...'
                    : `Showing ${filteredContracts.length} of ${subsectionContracts.length} contracts`}
                </span>
                <span>Click a summary card above to filter by status</span>
              </div>
            </>
          )}
        </div>
      </div>

      <SendContractModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendContract}
        tenants={tenants}
      />
    </div>
  );
}
