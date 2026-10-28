import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud, X, ChevronLeft, ChevronRight, ChevronDown, Check, FileText, HelpCircle, Search,
  Trash2, RotateCcw, Download, Lock, ArrowRight, ArrowUpRight, Send, Sparkles, CheckCircle2,
} from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import DocumentSigningViewer from './DocumentSigningViewer';
import SendContract from './SendContract';
import { SignUpPromptModal } from '../onboarding/SignUpPromptModal';
import { useOnboardingSession } from '../../contexts/OnboardingSessionContext';
import { contractService } from '../../services/contractService';
import signedContractsFirestoreService from '../../services/signedContractsFirestoreService';
import { fetchContractPdfFile } from '../../services/contractPdf';
import { uploadToFirebaseStorage } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { useBillingStatus } from '../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../utils/planAccess';
import { getPlanById, type PlanId } from '../../config/plans';
import { isMockTestUserId } from '../../data/mockTestUsers';

type TemplateActionResult = { success: boolean; error?: string };
const LOCAL_ACTION_OK: TemplateActionResult = { success: true };

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'uploaded' | 'deleted' | 'received';
  openContractId?: string | null;
  /** Show the paid-feature overlay regardless of the billing lookup. */
  locked?: boolean;
}

interface Template {
  id: string;
  name: string;
  uploadDate: string;
  fileUrl: string;
  imagePreview: string | null;
  file?: File; // Store the actual file object
  fileData?: string; // Base64 encoded file data for storage
  fileSize?: number; // File size in bytes
  firestoreId?: string; // Firestore document ID
}

// Older templates saved the PDF inside the Firestore row. New uploads use a storage URL.
const convertBase64ToFile = (base64: string, fileName: string, fileType: string): File => {
  try {
    console.log('🔄 Converting base64 to file:', fileName);
    console.log('🔄 Base64 length:', base64.length);
    console.log('🔄 Base64 preview (first 100 chars):', base64.substring(0, 100));
    
    // Clean the base64 string - remove any data URL prefix if present
    let cleanBase64 = base64;
    if (base64.includes(',')) {
      cleanBase64 = base64.split(',')[1];
      console.log('🔄 Removed data URL prefix, clean length:', cleanBase64.length);
    }
    
    // Validate base64 string
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      console.error('❌ Invalid base64 string format');
      throw new Error('Invalid base64 string format');
    }
    
    console.log('🔄 Decoding base64...');
    const binaryString = atob(cleanBase64);
    console.log('🔄 Binary string length:', binaryString.length);
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('🔄 Created Uint8Array, length:', bytes.length);
    const file = new File([bytes], fileName, { type: fileType });
    console.log('✅ Successfully converted base64 to file:', fileName, 'Size:', file.size);
    
    return file;
  } catch (error) {
    console.error('❌ Error converting base64 to file:', error);
    console.error('❌ Base64 string:', base64.substring(0, 200) + '...');
    throw new Error(`Failed to convert base64 to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

function receivedContractName(contract: any): string {
  const raw = contract?.fileName || contract?.documentName || contract?.title || contract?.contractName || 'contract';
  const name = String(raw).trim() || 'contract';
  return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
}

function bytesArePdf(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

async function fileIsPdf(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return bytesArePdf(head);
}

function senderOf(contract: any): { email: string; name: string } | null {
  const email = String(contract?.landlordEmail || contract?.agentEmail || '').trim();
  if (!email.includes('@')) return null;
  const name = String(contract?.agentName || contract?.landlordName || email).trim();
  return { email, name };
}

async function fileFromSource(source: string, name: string): Promise<File | null> {
  const value = source.trim();
  if (!value || value === '#' || value === 'null' || value === 'undefined') return null;

  try {
    if (value.startsWith('data:') || (!/^https?:\/\//i.test(value) && value.length > 80)) {
      const mime = value.startsWith('data:')
        ? (value.match(/^data:([^;]+);/)?.[1] || 'application/pdf')
        : 'application/pdf';
      if (mime === 'text/html') return null;
      const file = convertBase64ToFile(value, name, mime === 'application/octet-stream' ? 'application/pdf' : mime);
      return (await fileIsPdf(file)) ? file : null;
    }

    if (!/^https?:\/\//i.test(value)) return null;
    const res = await fetch(value);
    if (!res.ok) return null;
    const blob = await res.blob();
    if ((blob.type || '').includes('html')) return null;
    const file = new File([blob], name, { type: 'application/pdf' });
    return (await fileIsPdf(file)) ? file : null;
  } catch {
    return null;
  }
}

async function prepareReceivedPdf(contract: any): Promise<{
  file: File;
  url: string;
  fileData?: string;
  name: string;
  sender: { email: string; name: string } | null;
}> {
  const sourcesOf = (record: any) =>
    [record?.fileUrl, record?.documentUrl, record?.fileBase64, record?.base64Data].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

  let record = contract;
  let file: File | null = contract?.id
    ? await fetchContractPdfFile(String(contract.id), receivedContractName(contract))
    : null;
  for (const source of file ? [] : sourcesOf(contract)) {
    file = await fileFromSource(source, receivedContractName(contract));
    if (file) break;
  }

  if (!file && contract?.id) {
    const full = await signedContractsFirestoreService.getSignedContractById(String(contract.id));
    if (full.success && full.contract) {
      record = { ...contract, ...full.contract };
      for (const source of sourcesOf(full.contract)) {
        file = await fileFromSource(source, receivedContractName(record));
        if (file) break;
      }
    }
  }

  if (!file) {
    throw new Error('This contract does not include a PDF yet. Ask the sender to send it again.');
  }

  return {
    file,
    url: URL.createObjectURL(file),
    name: receivedContractName(record),
    sender: senderOf(record),
  };
}

type WizardStep = 1 | 2 | 3;
type LibraryTab = 'uploaded' | 'deleted' | 'received';

const SEND_FORM_ID = 'tenant-send-contract-form';
const TEMPLATE_SLOTS = 4;

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Choose & Upload' },
  { id: 2, label: 'Review & Sign' },
  { id: 3, label: 'Recipients & Send' },
];

function normalizePlanId(plan: string | null | undefined): PlanId {
  if (!plan || plan === 'free') return 'explorer';
  return plan as PlanId;
}

function receivedStatusBadge(status: string | undefined) {
  if (status === 'signed') return { label: 'Signed', className: 'bg-emerald-50 text-emerald-700' };
  if (status === 'unsigned') return { label: 'Awaiting Signature', className: 'bg-amber-50 text-amber-700' };
  return { label: 'Sent', className: 'bg-blue-50 text-[#136C9E]' };
}

type LibraryRow = {
  id: string;
  name: string;
  badge?: { label: string; className: string };
  date: string;
  from?: string;
  actions: React.ReactNode;
};

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, initialTab, openContractId, locked = false }) => {
  const { user } = useAuth();
  const { isDemoMode } = useOnboardingSession();
  // Dev test personas have no real Firebase session, so the API rejects their storage and template calls.
  const isLocalTestSession = import.meta.env.DEV && isMockTestUserId(user?.id);
  const { plan, status: planStatus, loading: billingLoading, error: billingError } = useBillingStatus();
  const isLocked =
    locked || (!billingLoading && !billingError && !canAccessSection('tenant-contracts', plan, planStatus));
  const planName = getPlanById(normalizePlanId(plan))?.name ?? 'Explorer';

  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab || 'uploaded');
  const [uploadedTemplates, setUploadedTemplates] = useState<Template[]>([]);
  const [deletedTemplates, setDeletedTemplates] = useState<Template[]>([]);
  const [receivedContracts, setReceivedContracts] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // PDF Preview states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Wizard state: step 2 signs the chosen document, step 3 sends it
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customizingTemplateId, setCustomizingTemplateId] = useState<string | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<Template | null>(null);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [returnRecipient, setReturnRecipient] = useState<{ email: string; name: string } | null>(null);
  const [signingSource, setSigningSource] = useState<{
    id: string;
    title?: string;
    propertyAddress?: string;
    tenantName?: string;
    tenantEmail?: string;
    landlordEmail?: string;
    landlordId?: string;
    contractType?: string;
  } | null>(null);
  const [openForSigning, setOpenForSigning] = useState(false);
  const openedContractRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  // Load templates and contracts from Firestore on component mount
  useEffect(() => {
    const loadTemplatesFromFirestore = async () => {
      console.log('🔄 ContractModal - useEffect triggered');
      console.log('🔄 ContractModal - isOpen:', isOpen);
      console.log('🔄 ContractModal - user:', user);
      console.log('🔄 ContractModal - user?.id:', user?.id);
      
      // Ensure user is authenticated
      if (!user?.id) {
        console.log('❌ User not authenticated, skipping template load');
        return;
      }

      const userId = user.id;
      console.log('🔄 Loading contract templates from Firestore for user:', userId);

      try {
        console.log('🔄 Loading contract templates from Firestore for user:', userId);
        setIsLoadingTemplates(true);
        
        // Load active templates
        console.log('🔄 Fetching active templates...');
        const activeResult = await contractService.getUserContractTemplates(userId);
        console.log('🔄 Active templates result:', activeResult);
        
        if (activeResult.success && activeResult.templates) {
          console.log('🔄 Processing', activeResult.templates.length, 'active templates');
          const templates = [];
          
          for (const contract of activeResult.templates) {
            try {
              console.log('🔄 Processing template:', contract.name, 'Size:', contract.fileSize);
              let file: File;
              let fileUrl = '';
              
              if (contract.fileUrl) {
                console.log('🔄 Fetching template file from Firebase Storage URL:', contract.fileUrl);
                const response = await fetch(contract.fileUrl);
                if (!response.ok) {
                  throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
                }
                const blob = await response.blob();
                file = new File([blob], contract.name, { type: contract.fileType });
                fileUrl = URL.createObjectURL(file);
              } else {
                console.log('🔄 Using legacy base64 in Firestore document');
                file = convertBase64ToFile(contract.fileData, contract.name, contract.fileType);
                fileUrl = URL.createObjectURL(file);
              }
              
              templates.push({
                id: contract.id,
                name: contract.name,
                uploadDate: contract.uploadDate,
                fileUrl,
                imagePreview: contract.imagePreview || null,
                file: file,
                fileData: contract.fileData,
                fileSize: contract.fileSize,
                firestoreId: contract.id
              });
              console.log('✅ Successfully processed template:', contract.name);
            } catch (error) {
              console.error('❌ Failed to process template:', contract.name, error);
              console.error('❌ Skipping corrupted template:', contract.name);
              // Continue with other templates instead of failing completely
            }
          }
          
          setUploadedTemplates(templates);
          console.log(`✅ Loaded ${templates.length} active templates from Firestore (${activeResult.templates.length - templates.length} skipped due to errors)`);
        } else {
          console.log('❌ Failed to load active templates:', activeResult.error);
          setUploadedTemplates([]);
        }

        // Load deleted templates
        console.log('🔄 Fetching deleted templates...');
        const deletedResult = await contractService.getDeletedContractTemplates(userId);
        console.log('🔄 Deleted templates result:', deletedResult);
        
        if (deletedResult.success && deletedResult.templates) {
          console.log('🔄 Processing', deletedResult.templates.length, 'deleted templates');
          const deleted = [];
          
          for (const contract of deletedResult.templates) {
            try {
              let file: File;
              let fileUrl = '';
              
              if (contract.fileUrl) {
                console.log('🔄 Fetching deleted template file from Firebase Storage URL:', contract.fileUrl);
                const response = await fetch(contract.fileUrl);
                if (!response.ok) {
                  throw new Error(`Failed to fetch file from storage: ${response.statusText}`);
                }
                const blob = await response.blob();
                file = new File([blob], contract.name, { type: contract.fileType });
                fileUrl = URL.createObjectURL(file);
              } else {
                file = convertBase64ToFile(contract.fileData, contract.name, contract.fileType);
                fileUrl = URL.createObjectURL(file);
              }
              
              deleted.push({
                id: contract.id,
                name: contract.name,
                uploadDate: contract.uploadDate,
                fileUrl,
                imagePreview: contract.imagePreview || null,
                file: file,
                fileData: contract.fileData,
                fileSize: contract.fileSize,
                firestoreId: contract.id
              });
            } catch (error) {
              console.error('❌ Failed to process deleted template:', contract.name, error);
            }
          }
          setDeletedTemplates(deleted);
          console.log(`✅ Loaded ${deleted.length} deleted templates from Firestore`);
        } else {
          console.log('❌ Failed to load deleted templates:', deletedResult.error);
          setDeletedTemplates([]);
        }


        // Load received contracts (sent by landlords)
        if (user?.email) {
          console.log('🔄 Fetching received contracts for tenant:', user.email);
          const receivedResult = await contractService.getReceivedContracts(user.email);
          
          if (receivedResult.success && receivedResult.contracts) {
            // Filter out signed contracts - only show sent/unsigned contracts in the received tab
            // Signed contracts have been completed and sent back to landlord
            const pendingContracts = receivedResult.contracts.filter(
              contract => contract.status !== 'signed'
            );
            console.log(`✅ Loaded ${pendingContracts.length} pending received contracts (${receivedResult.contracts.length} total, ${receivedResult.contracts.length - pendingContracts.length} signed filtered out)`);
            setReceivedContracts(pendingContracts);
          } else {
            console.log('❌ Failed to load received contracts:', receivedResult.error);
            setReceivedContracts([]);
          }
        }
      } catch (error) {
        console.error('❌ Error loading templates from Firestore:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplatesFromFirestore();
  }, [isOpen, user?.id, user?.email]);

  const resetWizard = () => {
    setStep(1);
    setCustomizingTemplateId(null);
    setCustomizingTemplate(null);
    setSignedPdfBytes(null);
    setReturnRecipient(null);
    setSigningSource(null);
    setOpenForSigning(false);
    setIsSending(false);
  };

  useEffect(() => {
    if (!isOpen) {
      openedContractRef.current = null;
      resetWizard();
      setSelectedTemplateId(null);
      setPreviewFile(null);
      setSearchQuery('');
      setNotice(null);
      setActiveTab(initialTab || 'uploaded');
      return;
    }
    if (!openContractId || !user?.id || isLoadingTemplates || billingLoading || isLocked) return;
    if (openedContractRef.current === openContractId) return;
    openedContractRef.current = openContractId;
    setActiveTab('received');
    const match = receivedContracts.find((item) => String(item.id) === String(openContractId)) || { id: openContractId };
    void openReceivedContract(match, 'customize');
  }, [isOpen, openContractId, user?.id, isLoadingTemplates, receivedContracts, initialTab, billingLoading, isLocked]);

  // Start (or restart) signing for a template and move to Review & Sign
  const handleCustomize = (templateId: string, templateOverride?: Template) => {
    const template = templateOverride ?? uploadedTemplates.find(t => t.id === templateId) ?? null;
    if (!template) return;
    if (!templateOverride) {
      setReturnRecipient(null);
      setOpenForSigning(false);
      setSigningSource(null);
    }
    setCustomizingTemplateId(templateId);
    setCustomizingTemplate(template);
    setSelectedTemplateId(templateId);
    setSignedPdfBytes(null);
    setStep(2);
  };

  const openReceivedContract = async (contract: any, mode: 'preview' | 'customize' | 'download') => {
    try {
      const prepared = await prepareReceivedPdf(contract);
      if (mode === 'download') {
        const link = document.createElement('a');
        link.href = prepared.url;
        link.download = prepared.name;
        link.click();
        return;
      }

      const template: Template = {
        id: String(contract.id),
        name: prepared.name,
        uploadDate: contract.sentDate ? new Date(contract.sentDate).toLocaleDateString() : new Date().toLocaleDateString(),
        fileUrl: prepared.url,
        imagePreview: null,
        file: prepared.file,
        fileData: prepared.fileData,
        fileSize: prepared.file.size,
      };

      if (mode === 'preview') {
        handlePreview(template);
        return;
      }

      setReturnRecipient(prepared.sender);
      setSigningSource({
        id: String(contract.id),
        title: prepared.name,
        propertyAddress: contract.propertyAddress || '',
        tenantName: contract.tenantName || '',
        tenantEmail: contract.tenantEmail || '',
        landlordEmail: prepared.sender?.email || contract.landlordEmail || '',
        landlordId: contract.landlordId || '',
        contractType: contract.contractType || 'tenancy-agreement',
      });
      setOpenForSigning(true);
      setUploadedTemplates((prev) => (prev.some((item) => item.id === template.id) ? prev : [...prev, template]));
      handleCustomize(template.id, template);
    } catch (error) {
      console.error('Error opening received contract:', error);
      alert(error instanceof Error ? error.message : 'Failed to open this contract. Please try again.');
    }
  };

  // Handle Delete (Move to Deleted Templates)
  const handleDelete = async (templateId: string) => {
    try {
      const result: TemplateActionResult = isLocalTestSession
        ? LOCAL_ACTION_OK
        : await contractService.deleteContractTemplate(templateId);
      if (result.success) {
        const templateToDelete = uploadedTemplates.find((t) => t.id === templateId);
        if (templateToDelete) {
          setUploadedTemplates(uploadedTemplates.filter((t) => t.id !== templateId));
          setDeletedTemplates([...deletedTemplates, templateToDelete]);
          setConfirmDelete(null);
          if (selectedTemplateId === templateId) setSelectedTemplateId(null);
          console.log("Template moved to deleted status in Firestore");
        }
      } else {
        console.error("Failed to delete template:", result.error);
        alert("Failed to delete template. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template. Please try again.");
    }
  };

  // Handle Restore (Move to Uploaded Templates)
  const handleRestore = async (templateId: string) => {
    try {
      const result: TemplateActionResult = isLocalTestSession
        ? LOCAL_ACTION_OK
        : await contractService.restoreContractTemplate(templateId);
      if (result.success) {
        const restoredTemplate = deletedTemplates.find(template => template.id === templateId);
        if (restoredTemplate) {
          setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
          setUploadedTemplates([...uploadedTemplates, restoredTemplate]);
          console.log("Template restored to active status in Firestore");
        }
      } else {
        console.error("Failed to restore template:", result.error);
        alert("Failed to restore template. Please try again.");
      }
    } catch (error) {
      console.error("Error restoring template:", error);
      alert("Error restoring template. Please try again.");
    }
  };

  // Handle Permanent Delete (Remove from Deleted Templates)
  const handleDeletePermanently = async (templateId: string) => {
    try {
      const result: TemplateActionResult = isLocalTestSession
        ? LOCAL_ACTION_OK
        : await contractService.permanentlyDeleteContractTemplate(templateId);
      if (result.success) {
        setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
        setConfirmDelete(null);
        console.log("Template permanently deleted from Firestore");
      } else {
        console.error("Failed to permanently delete template:", result.error);
        alert("Failed to permanently delete template. Please try again.");
      }
    } catch (error) {
      console.error("Error permanently deleting template:", error);
      alert("Error permanently deleting template. Please try again.");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("File selected:", file?.name, "Type:", file?.type, "Size:", file?.size);
    // Ensure user is authenticated
    if (!user?.id) {
      console.warn("User not authenticated during upload");
      alert("You must be logged in to upload templates.");
      return;
    }

    const userId = user.id;
    console.log("Using user ID for upload:", userId);
    
    if (!file) {
      console.warn("No file selected");
      alert("Please select a file to upload.");
      return;
    }
    
    // Check file type
    if (file.type !== "application/pdf") {
      console.warn("Invalid file type:", file.type);
      alert("Please select a PDF file. Only PDF files are supported.");
      event.target.value = '';
      return;
    }
    
    // Check file size (limit to 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxFileSize) {
      console.warn("File too large:", file.size, "bytes");
      alert(`File is too large. Maximum file size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      event.target.value = '';
      return;
    }
    
    // Check if file is too small (might be corrupted)
    if (file.size < 1024) { // Less than 1KB
      console.warn("File too small:", file.size, "bytes");
      alert("File appears to be corrupted or empty. Please try a different file.");
      event.target.value = '';
      return;
    }
    
    console.log("File validation passed. Starting upload process...");
    
    try {
      setIsSaving(true);
      setNotice(null);
      const fileUrl = URL.createObjectURL(file);
      console.log("Created blob URL:", fileUrl);
      
      // Generate preview with error handling
      let imagePreview: string | null = null;
      try {
        imagePreview = await generatePdfPreview(file);
        console.log("Generated preview:", imagePreview ? "Success" : "Failed");
      } catch (previewError) {
        console.warn("Failed to generate preview, continuing without preview:", previewError);
        // Continue without preview - this is not critical
      }

      if (isLocalTestSession) {
        const localTemplate: Template = {
          id: `local-${Date.now()}`,
          name: file.name,
          uploadDate: new Date().toLocaleDateString(),
          fileUrl,
          imagePreview,
          file,
          fileSize: file.size,
        };
        setUploadedTemplates((prev) => [...prev, localTemplate]);
        setSelectedTemplateId(localTemplate.id);
        setActiveTab('uploaded');
        setNotice(`"${file.name}" added for this test session only (test personas can't save to the server).`);
        event.target.value = '';
        return;
      }

      const uploadRes = await uploadToFirebaseStorage(file, `contractTemplates/${userId}`);
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Could not store the contract file.');
      }

      const contractData = {
        name: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileData: 'stored_via_backend_storage',
        fileUrl: uploadRes.url,
        fileSize: file.size,
        fileType: file.type,
        imagePreview: imagePreview || undefined,
        status: 'active' as const,
        category: 'contract' as const
      };

      const result = await contractService.saveContractTemplate(userId, contractData);
      
      if (result.success && result.templateId) {
        const newTemplate: Template = {
          id: result.templateId,
          name: file.name,
          uploadDate: new Date().toLocaleDateString(),
          fileUrl,
          imagePreview,
          file: file,
          fileData: 'stored_via_backend_storage',
          fileSize: file.size,
          firestoreId: result.templateId
        };
        setUploadedTemplates([...uploadedTemplates, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
        setActiveTab('uploaded');
        setNotice(`"${file.name}" uploaded and selected. Continue to Review & Sign when you're ready.`);
        console.log("Template saved to Firestore successfully");
      } else {
        console.error("Failed to save template to Firestore:", result.error);
        alert(`Failed to save template: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error("Error processing uploaded file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error processing file: ${errorMessage}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
    
    // Reset the file input to allow re-uploading the same file
    event.target.value = '';
  };

  const generatePdfPreview = async (file: File): Promise<string | null> => {
    try {
      console.log("Generating preview for file:", file.name);
      
      // Use the File object directly
      const arrayBuffer = await file.arrayBuffer();
      console.log("File loaded for preview, size:", arrayBuffer.byteLength, "bytes");
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log("PDF loaded for preview, pages:", pdf.numPages);
      
      const page = await pdf.getPage(1);
      console.log("First page loaded for preview");

      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        console.error("Could not get canvas context for preview");
        return null;
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      console.log("Preview image generated successfully");

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      return null;
    }
  };

  const handlePreview = async (template: Template) => {
    console.log("Starting PDF preview for:", template.name);
    setPreviewFile(template.fileUrl);
    setIsLoadingPdf(true);
    setPdfError(null);
    setPdfDocument(null);
    
    try {
      let arrayBuffer: ArrayBuffer;
      
      if (template.file) {
        // Use the stored File object directly
        console.log("Using stored file object, size:", template.file.size, "bytes");
        arrayBuffer = await template.file.arrayBuffer();
      } else {
        // Fallback to fetching blob URL (though this will likely fail due to CSP)
        console.log("No file object found, attempting to fetch blob...");
        const response = await fetch(template.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        arrayBuffer = await response.arrayBuffer();
      }
      
      console.log("File data loaded, size:", arrayBuffer.byteLength, "bytes");
      
      console.log("Loading PDF document from ArrayBuffer...");
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log("PDF loaded successfully, pages:", pdf.numPages);
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setIsLoadingPdf(false);
    } catch (error) {
      console.error("Error loading PDF for preview:", error);
      setPdfError(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingPdf(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPdfDocument(null);
    setCurrentPage(1);
    setTotalPages(0);
    setIsLoadingPdf(false);
    setPdfError(null);
  };

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) {
      console.log("Cannot render page - missing document or canvas");
      return;
    }

    try {
      console.log(`Rendering page ${pageNumber}...`);
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        console.error("Could not get canvas context");
        return;
      }

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      console.log(`Page ${pageNumber} rendered successfully`);
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      setPdfError(`Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Effect to render page when currentPage changes
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDocument]);

  const needle = searchQuery.trim().toLowerCase();
  const matches = (name: string) => !needle || name.toLowerCase().includes(needle);

  const actionBtn = 'px-2.5 py-1 font-semibold rounded-md transition-colors text-xs';
  const ghostBtn = `${actionBtn} text-slate-600 hover:text-[#136C9E] bg-slate-100 hover:bg-blue-50`;
  const primaryBtn = `${actionBtn} px-3 bg-[#136C9E] hover:bg-[#0f567e] text-white shadow-sm`;
  const dangerBtn = `${actionBtn} text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100`;

  const buildLibraryRows = (): LibraryRow[] => {
    if (activeTab === 'uploaded') {
      return uploadedTemplates
        .filter((t) => matches(t.name))
        .map((template, index) => ({
          id: template.id,
          name: template.name,
          badge: selectedTemplateId === template.id ? { label: 'Selected', className: 'bg-blue-50 text-[#136C9E]' } : undefined,
          date: template.uploadDate,
          actions: (
            <>
              <button type="button" onClick={() => handlePreview(template)} className={ghostBtn}>Preview</button>
              <button
                type="button"
                onClick={() => handleCustomize(template.id)}
                className={primaryBtn}
                {...(index === 0 ? { 'data-demo-contract-manage-first': true } : {})}
              >
                Sign &amp; Send
              </button>
              <button type="button" onClick={() => setConfirmDelete(template.id)} className={dangerBtn} aria-label={`Delete ${template.name}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ),
        }));
    }
    if (activeTab === 'received') {
      return receivedContracts
        .filter((c) => matches(receivedContractName(c)))
        .map((contract) => ({
          id: String(contract.id),
          name: receivedContractName(contract),
          badge: receivedStatusBadge(contract.status),
          date: contract.sentDate ? new Date(contract.sentDate).toLocaleDateString() : '',
          from: contract.landlordEmail,
          actions: (
            <>
              <button type="button" onClick={() => { void openReceivedContract(contract, 'preview'); }} className={ghostBtn}>Preview</button>
              <button type="button" onClick={() => { void openReceivedContract(contract, 'download'); }} className={ghostBtn} aria-label="Download">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => { void openReceivedContract(contract, 'customize'); }} className={primaryBtn}>Sign</button>
            </>
          ),
        }));
    }
    return deletedTemplates
      .filter((t) => matches(t.name))
      .map((template) => ({
        id: template.id,
        name: template.name,
        date: template.uploadDate,
        actions: (
          <>
            <button type="button" onClick={() => setConfirmDelete(template.id)} className={dangerBtn}>Delete</button>
            <button type="button" onClick={() => handleRestore(template.id)} className={`${primaryBtn} inline-flex items-center gap-1`}>
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          </>
        ),
      }));
  };

  if (!isOpen) return null;

  const libraryRows = buildLibraryRows();

  const hasActiveDocument = Boolean(customizingTemplateId && customizingTemplate);
  const selectedTemplate = uploadedTemplates.find((t) => t.id === selectedTemplateId) ?? null;
  const headerDocName = customizingTemplate?.name ?? selectedTemplate?.name ?? 'No document selected';

  const goToStep = (target: WizardStep) => {
    if (target > 1 && !hasActiveDocument) return;
    setStep(target);
  };

  const handleForward = () => {
    if (step === 1) {
      if (hasActiveDocument && (!selectedTemplateId || selectedTemplateId === customizingTemplateId)) {
        setStep(2);
      } else if (selectedTemplateId) {
        handleCustomize(selectedTemplateId);
      }
      return;
    }
    if (step === 2) setStep(3);
  };

  const canGoForward = step === 1
    ? Boolean(selectedTemplateId || hasActiveDocument)
    : step === 2
      ? true
      : Boolean(signedPdfBytes) && !isSending;

  const nextLabel = step === 1
    ? 'Continue to Review & Sign'
    : step === 2
      ? (signedPdfBytes ? 'Proceed to Send' : 'Next: Recipients & Send')
      : (isSending ? 'Sending…' : 'Send Contract');

  const tabCounts: Record<LibraryTab, number> = {
    uploaded: uploadedTemplates.length,
    received: receivedContracts.length,
    deleted: deletedTemplates.length,
  };
  const tabLabels: Record<LibraryTab, string> = {
    uploaded: 'Uploaded Templates',
    received: 'Received Contracts',
    deleted: 'Deleted Templates',
  };
  const emptyText: Record<LibraryTab, string> = {
    uploaded: 'No templates yet. Upload a PDF above to get started.',
    received: 'No contracts received yet. Contracts sent by your landlord will appear here.',
    deleted: 'No deleted templates.',
  };

  const confirmIsPermanent = Boolean(confirmDelete && deletedTemplates.some((t) => t.id === confirmDelete));

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 font-nunito-sans text-slate-800">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contracts-wizard-title"
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] w-full max-w-5xl max-h-[94vh] flex flex-col border border-slate-200/90 overflow-hidden"
      >
        {/* Header */}
        <header className="px-5 sm:px-7 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3f8] text-[#136C9E] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="contracts-wizard-title" className="font-archivo font-extrabold text-slate-900 text-base sm:text-lg tracking-tight truncate">
                  Contracts Wizard
                </h2>
                {hasActiveDocument && (
                  signedPdfBytes ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Signed
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsigned Draft
                    </span>
                  )
                )}
              </div>
              <div className="text-xs text-slate-500 truncate" title={headerDocName}>{headerDocName}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative group">
              <button
                type="button"
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-[#136C9E] hover:bg-[#e8f3f8]/60 flex items-center justify-center transition-colors"
                aria-label="How electronic signing works"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute right-0 top-11 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50">
                <div className="font-bold text-amber-400 mb-1">Electronic signatures</div>
                <p className="text-slate-300 leading-normal text-[11px]">
                  Choose a contract, sign it, then send it. Each recipient gets an email with the signed PDF, and a copy is saved to your contracts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Stepper */}
        <nav className="bg-slate-50/80 px-4 sm:px-8 py-3 border-b border-slate-200/80 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-6 min-w-max mx-auto sm:mx-0">
            {STEPS.map((item, index) => {
              const isCurrent = item.id === step;
              const isDone = item.id < step;
              const disabled = item.id > 1 && !hasActiveDocument;
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                  <button
                    type="button"
                    onClick={() => goToStep(item.id)}
                    disabled={disabled}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`flex items-center gap-2.5 py-1 px-2 rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCurrent ? 'font-bold text-[#DC5F12]' : isDone ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isCurrent ? 'bg-[#DC5F12] text-white shadow-sm' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : item.id}
                    </span>
                    <span className="font-archivo">{item.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className={`inline-block w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isSaving ? 'Saving…' : 'Templates saved to your account'}
          </div>
        </nav>

        {/* Step content */}
        <div className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-7 ${step === 2 && customizingTemplate ? 'flex flex-col' : ''}`}>
          {step === 1 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-archivo font-extrabold text-lg text-slate-900 tracking-tight">Select Contract Template</h3>
                  <p className="text-xs text-slate-500">Choose one of your templates or upload a PDF agreement.</p>
                </div>
                <span className="text-xs font-medium text-slate-400">PDF only • Max 10MB</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div
                  data-demo-contract-upload
                  className="relative group border-2 border-dashed border-slate-300 hover:border-[#136C9E] bg-slate-50/70 hover:bg-[#e8f3f8]/30 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px]"
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleUpload}
                    disabled={isSaving}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:cursor-wait"
                    aria-label="Upload a PDF template"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#136C9E] flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-archivo">Click or Drag &amp; Drop</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Upload Custom PDF</div>
                  {isSaving && (
                    <div className="w-full mt-3">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#136C9E] h-full w-1/2 animate-pulse rounded-full" />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-semibold">Uploading…</div>
                    </div>
                  )}
                </div>

                {Array.from({ length: TEMPLATE_SLOTS }).map((_, index) => {
                  const template = uploadedTemplates[index];
                  const slot = String.fromCharCode(65 + index);
                  if (!template) {
                    return (
                      <div
                        key={`slot-${slot}`}
                        className="hidden sm:flex border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex-col items-center justify-center text-center min-h-[170px] text-slate-400"
                      >
                        <FileText className="w-6 h-6 mb-1.5" />
                        <span className="text-[11px] font-semibold">Template {slot}</span>
                        <span className="text-[10px]">Empty slot</span>
                      </div>
                    );
                  }
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      onDoubleClick={() => handleCustomize(template.id)}
                      aria-pressed={isSelected}
                      className={`relative text-left bg-white rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all group min-h-[170px] ${
                        isSelected ? 'border-2 border-[#136C9E] shadow-md' : 'border border-slate-200 hover:border-[#136C9E]/50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="bg-[#e8f3f8] text-[#136C9E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Template {slot}
                        </span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-[#136C9E] text-white' : 'bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'
                          }`}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                      </div>
                      <div className="h-24 bg-slate-100 rounded-lg border border-slate-200/60 overflow-hidden mb-2">
                        {template.imagePreview ? (
                          <img src={template.imagePreview} alt="" className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-archivo font-bold text-xs text-slate-800 group-hover:text-[#136C9E] transition-colors truncate" title={template.name}>
                          {template.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">Uploaded {template.uploadDate}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {notice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-800">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{notice}</span>
                  <button type="button" onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap" role="tablist">
                    {(['uploaded', 'received', 'deleted'] as LibraryTab[]).map((tab) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        key={tab}
                        onClick={() => { setActiveTab(tab); setExpandedRow(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          activeTab === tab
                            ? 'font-bold bg-orange-50 text-[#DC5F12] border border-[#DC5F12]/20'
                            : 'font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        {tabLabels[tab]} ({tabCounts[tab]})
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full text-base sm:text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#136C9E]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#136C9E]" />
                    Loading your contracts…
                  </div>
                ) : libraryRows.length === 0 ? (
                  <div className="py-10 px-4 text-center text-xs text-slate-400">
                    {needle ? `Nothing matches "${searchQuery}".` : emptyText[activeTab]}
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/60 text-slate-400 font-archivo uppercase text-[10px] tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2.5 px-5">{activeTab === 'received' ? 'Contract' : 'Template File'}</th>
                            <th className="py-2.5 px-4">{activeTab === 'received' ? 'Received' : 'Date'}</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {libraryRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-5 max-w-0 w-1/2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] shrink-0">PDF</div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-semibold text-slate-800 truncate" title={row.name}>{row.name}</span>
                                      {row.badge && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${row.badge.className}`}>{row.badge.label}</span>
                                      )}
                                    </div>
                                    {row.from && <div className="text-[11px] text-slate-400 truncate" title={`From: ${row.from}`}>From: {row.from}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{row.date}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-1.5">{row.actions}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="block md:hidden p-3 space-y-2.5 bg-slate-50/60">
                      {libraryRows.map((row) => {
                        const expanded = expandedRow === row.id;
                        return (
                          <div key={row.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedRow(expanded ? null : row.id)}
                              aria-expanded={expanded}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors min-h-[48px]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-[10px] shrink-0">PDF</div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate">{row.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {row.badge && <span className={`text-[10px] font-semibold px-2 rounded ${row.badge.className}`}>{row.badge.label}</span>}
                                    <span className="text-[10px] text-slate-400">{row.date}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                              </span>
                            </button>
                            {expanded && (
                              <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 space-y-2">
                                {row.from && <div className="text-[11px] text-slate-500 truncate">From: {row.from}</div>}
                                <div className="flex items-center gap-2 flex-wrap [&>button]:min-h-[40px] [&>button]:flex-1">{row.actions}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {step === 2 && customizingTemplate && (
            <DocumentSigningViewer
              key={customizingTemplate.id}
              variant="wizard"
              template={customizingTemplate}
              recipient={returnRecipient || {
                email: 'user@example.com',
                name: 'Document Signer'
              }}
              sourceContractId={openForSigning ? customizingTemplate.id : undefined}
              onSigned={(signedBytes) => setSignedPdfBytes(signedBytes)}
            />
          )}

          {hasActiveDocument && customizingTemplate && (
            <div className={step === 3 ? 'max-w-2xl mx-auto' : 'hidden'}>
              <SendContract
                key={customizingTemplate.id}
                formId={SEND_FORM_ID}
                initialRecipient={returnRecipient || undefined}
                sourceContract={signingSource || undefined}
                contractData={{
                  title: customizingTemplate.name,
                  content: 'Contract content will be extracted here',
                  extractedFields: {
                    landlord: 'Landlord Name',
                    tenant: 'Tenant Name',
                    propertyAddress: 'Property Address',
                    startDate: 'Start Date'
                  }
                }}
                signedPdfBytes={signedPdfBytes}
                interceptWithSignUp={isDemoMode}
                onInterceptSignUp={() => setShowSignUpModal(true)}
                onSubmittingChange={setIsSending}
                onReviewSignature={() => setStep(2)}
                onSend={(recipients) => {
                  console.log('Sending contract to:', recipients);
                }}
                onClose={() => {
                  resetWizard();
                  setSelectedTemplateId(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 sm:px-7 py-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => goToStep((step - 1) as WizardStep)}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={onClose} className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            {step === 3 ? (
              <button
                type="submit"
                form={SEND_FORM_ID}
                disabled={!canGoForward}
                className="px-5 py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Send className="w-4 h-4" />
                {nextLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleForward}
                disabled={!canGoForward}
                className="px-5 py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {nextLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </footer>

        {isLocked && (
          <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-[3px] flex items-center justify-center p-4">
            <div
              role="alertdialog"
              aria-labelledby="contracts-locked-title"
              className="w-full max-w-md bg-white rounded-3xl border border-[#80B2FF] shadow-[0_12px_40px_rgba(70,95,194,0.18)] overflow-hidden"
            >
              <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)' }}>
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lock className="w-5 h-5 text-[#136C9E]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#136C9E]">Locked on your plan</p>
                  <h3 id="contracts-locked-title" className="font-archivo font-bold text-lg text-[#374957]">This feature is a paid feature</h3>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm leading-relaxed text-[#717182]">
                  {sectionUpgradeLabel('tenant-contracts')} You are on the{' '}
                  <span className="font-semibold text-[#374957]">{planName}</span> plan, so uploading, signing and sending contracts stays locked until you upgrade.
                </p>
                <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 bg-slate-50 border border-slate-200">
                  <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-[#DC5F12]" />
                  <p className="text-xs leading-relaxed text-[#374957]">Upgrade to unlock e-signing, contract templates and secure sending.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    to="/pricing?segment=renters"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#DC5F12] hover:opacity-90 transition-opacity"
                  >
                    Upgrade your plan
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div role="alertdialog" className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <p className="font-archivo font-bold text-base text-slate-900">
              {confirmIsPermanent ? 'Delete this template permanently?' : 'Delete this template?'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {confirmIsPermanent ? 'This cannot be undone.' : 'You can restore it later from Deleted Templates.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => (confirmIsPermanent ? handleDeletePermanently(confirmDelete) : handleDelete(confirmDelete))}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[85] bg-slate-950/60 flex items-center justify-center p-3 sm:p-6" onClick={closePreview}>
          <div className="bg-white rounded-2xl shadow-xl relative w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-archivo font-bold text-base text-slate-800">PDF Preview</h3>
                {totalPages > 0 && <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>}
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-700 p-1 rounded-lg" onClick={closePreview} aria-label="Close preview">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-auto bg-slate-100 p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full shadow-lg bg-white"
                style={{ display: pdfDocument && !isLoadingPdf && !pdfError ? 'block' : 'none' }}
              />

              {isLoadingPdf && (
                <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#136C9E]" />
                  Loading PDF…
                </div>
              )}

              {pdfError && (
                <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="text-red-600">
                    <div className="font-semibold text-sm">Error loading PDF</div>
                    <div className="text-xs mt-1">{pdfError}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const template = [...uploadedTemplates, ...deletedTemplates].find(t => t.fileUrl === previewFile);
                      if (template) handlePreview(template);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-[#136C9E] text-white rounded-xl hover:bg-[#0f567e]"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoadingPdf && !pdfError && !pdfDocument && (
                <div className="text-xs text-slate-500">No PDF loaded</div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 px-4 py-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs text-slate-600 font-bold">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Sign up to send your contract"
        reassurance="Create a free account to send contracts to your tenants and manage everything in one place."
      />
    </div>
  );
};

export default ContractModal;
