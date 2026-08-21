import React, { useState, useEffect, useRef } from 'react';
import { Menu, UploadCloud, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useNavigate } from 'react-router-dom';
import CustomizePage from './CustomizePage';
import { contractService, ContractTemplate } from '../../services/contractService';
import { useAuth } from '../../contexts/AuthContext';
interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'uploaded' | 'deleted' | 'received';
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

// Helper functions for Firestore operations
const convertFileToBase64 = async (file: File): Promise<string> => {
  try {
    console.log("Converting file to base64, size:", file.size, "bytes");
    const arrayBuffer = await file.arrayBuffer();
    console.log("ArrayBuffer created, size:", arrayBuffer.byteLength, "bytes");
    
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log("Uint8Array created, length:", uint8Array.length);
    
    // Convert to base64 in chunks to avoid memory issues with large files
    const chunkSize = 8192; // 8KB chunks
    let base64 = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64 += btoa(String.fromCharCode(...chunk));
    }
    
    console.log("Base64 conversion completed, length:", base64.length);
    return base64;
  } catch (error) {
    console.error("Error converting file to base64:", error);
    throw new Error(`Failed to convert file to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, initialTab = 'uploaded' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'uploaded' | 'deleted' | 'received'>(initialTab);
  const [uploadedTemplates, setUploadedTemplates] = useState<Template[]>([]);
  const [deletedTemplates, setDeletedTemplates] = useState<Template[]>([]);
  const [receivedContracts, setReceivedContracts] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate(); // Initialize navigation
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // PDF Preview states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewTemplateRef = useRef<Template | null>(null);
  const previewBlobUrlRef = useRef<string | null>(null);

  // New state to track if we're in customize mode and which template is being customized
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizingTemplateId, setCustomizingTemplateId] = useState<string | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<Template | null>(null);
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
              const file = convertBase64ToFile(contract.fileData, contract.name, contract.fileType);
              const fileUrl = URL.createObjectURL(file);
              
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
          const deletedTemplates = deletedResult.templates.map(contract => {
            const file = convertBase64ToFile(contract.fileData, contract.name, contract.fileType);
            const fileUrl = URL.createObjectURL(file);
            
            return {
              id: contract.id,
              name: contract.name,
              uploadDate: contract.uploadDate,
              fileUrl,
              imagePreview: contract.imagePreview || null,
              file: file,
              fileData: contract.fileData,
              fileSize: contract.fileSize,
              firestoreId: contract.id
            };
          });
          setDeletedTemplates(deletedTemplates);
          console.log(`✅ Loaded ${deletedTemplates.length} deleted templates from Firestore`);
        } else {
          console.log('❌ Failed to load deleted templates:', deletedResult.error);
          setDeletedTemplates([]);
        }
      } catch (error) {
        console.error('❌ Error loading templates from Firestore:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplatesFromFirestore();
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveTab(initialTab);

    if (!user?.email) {
      setReceivedContracts([]);
      return;
    }

    let autoOpened = initialTab === 'received';
    const unsubscribe = contractService.subscribeToReceivedContracts(
      user.email,
      (contracts) => {
        const pendingContracts = contracts.filter((contract) => contract.status !== 'signed');
        setReceivedContracts(pendingContracts);
        if (pendingContracts.length > 0 && !autoOpened) {
          autoOpened = true;
          setActiveTab('received');
        }
      },
      undefined,
      (error) => {
        console.error('❌ Failed to subscribe to received contracts:', error);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user?.email, initialTab]);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };
  }, []);

  const buildTemplateFromReceivedContract = async (contract: {
    id: string;
    fileName: string;
    fileUrl?: string;
    sentDate?: Date | string;
  }): Promise<Template> => {
    const fileUrl = (contract.fileUrl || '').trim();
    if (!fileUrl) {
      throw new Error('Document file is missing. Please ask the sender to resend the contract.');
    }

    if (fileUrl.startsWith('blob:')) {
      throw new Error('This document expired after reload. Please ask the sender to resend the contract.');
    }

    if (fileUrl.startsWith('data:')) {
      const mimeTypeMatch = fileUrl.match(/^data:([^;]+);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/pdf';
      const file = convertBase64ToFile(fileUrl, contract.fileName, mimeType);
      const blobUrl = URL.createObjectURL(file);
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
      }
      previewBlobUrlRef.current = blobUrl;
      return {
        id: contract.id,
        name: contract.fileName,
        uploadDate: contract.sentDate ? new Date(contract.sentDate).toLocaleDateString() : '',
        fileUrl: blobUrl,
        imagePreview: null,
        file,
      };
    }

    const response = await fetch(fileUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch contract file (${response.status})`);
    }
    const blob = await response.blob();
    const mimeType = blob.type || 'application/pdf';
    const file = new File([blob], contract.fileName, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
    }
    previewBlobUrlRef.current = blobUrl;
    return {
      id: contract.id,
      name: contract.fileName,
      uploadDate: contract.sentDate ? new Date(contract.sentDate).toLocaleDateString() : '',
      fileUrl: blobUrl,
      imagePreview: null,
      file,
    };
  };

  const openReceivedContractPreview = async (contract: {
    id: string;
    fileName: string;
    fileUrl?: string;
    sentDate?: Date | string;
  }) => {
    try {
      const template = await buildTemplateFromReceivedContract(contract);
      previewTemplateRef.current = template;
      await handlePreview(template);
    } catch (error) {
      console.error('Error opening received contract preview:', error);
      alert(error instanceof Error ? error.message : 'Failed to load contract preview.');
    }
  };

  // Clear all storage (for testing) - now clears Firestore data
  const handleClearStorage = async () => {
    if (!user?.id) {
      alert('You must be logged in to clear storage.');
      return;
    }
    
    try {
      // This would require implementing a bulk delete function in contractService
      // For now, just clear local state
      setUploadedTemplates([]);
      setDeletedTemplates([]);
      alert('All contract templates have been cleared!');
    } catch (error) {
      console.error('Error clearing templates:', error);
    }
  };


  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  // Handle Customize (Redirect)
  {/*const handleCustomize = (templateId: string) => {
    navigate(`/customize/${templateId}`);
  };*/}

// Handle Customize
const handleCustomize = (templateId: string, templateOverride?: Template) => {
  const template = templateOverride ?? uploadedTemplates.find(t => t.id === templateId) ?? null;
  setCustomizingTemplateId(templateId);
  setCustomizingTemplate(template);
  setCustomizeMode(true);
  setDropdownOpen(null); // Close the dropdown
};

// Return from customize mode
const handleBackFromCustomize = () => {
  setCustomizeMode(false);
  setCustomizingTemplateId(null);
  setCustomizingTemplate(null);
};

// Find the template being customized
const findCustomizedTemplate = () => {
  return customizingTemplate;
};
  

  // Handle Delete (Move to Deleted Templates)
  const handleDelete = async (templateId: string) => {
    try {
      const result = await contractService.deleteContractTemplate(templateId);
      if (result.success) {
        const templateToDelete = uploadedTemplates.find((t) => t.id === templateId);
        if (templateToDelete) {
          setUploadedTemplates(uploadedTemplates.filter((t) => t.id !== templateId));
          setDeletedTemplates([...deletedTemplates, templateToDelete]);
          setConfirmDelete(null);
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
      const result = await contractService.restoreContractTemplate(templateId);
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
      const result = await contractService.permanentlyDeleteContractTemplate(templateId);
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
      return;
    }
    
    // Check file size (limit to 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxFileSize) {
      console.warn("File too large:", file.size, "bytes");
      alert(`File is too large. Maximum file size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }
    
    // Check if file is too small (might be corrupted)
    if (file.size < 1024) { // Less than 1KB
      console.warn("File too small:", file.size, "bytes");
      alert("File appears to be corrupted or empty. Please try a different file.");
      return;
    }
    
    console.log("File validation passed. Starting upload process...");
    
    try {
      setIsSaving(true);
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

      // Convert file to base64 for Firestore storage
      console.log("Converting file to base64...");
      const fileData = await convertFileToBase64(file);
      console.log("Converted file to base64, size:", fileData.length);

      // Save to Firestore
      console.log("Saving to Firestore...");
      const contractData = {
        name: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileData,
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
          fileData,
          fileSize: file.size,
          firestoreId: result.templateId
        };
        setUploadedTemplates([...uploadedTemplates, newTemplate]);
        console.log("Template saved to Firestore successfully");
        alert(`File "${file.name}" uploaded successfully!`);
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
    previewTemplateRef.current = template;
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
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }
    previewTemplateRef.current = null;
    setPreviewFile(null);
    setPdfDocument(null);
    setCurrentPage(1);
    setTotalPages(0);
    setIsLoadingPdf(false);
    setPdfError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
      previewTemplateRef.current = null;
      setPreviewFile(null);
      setPdfDocument(null);
      setCurrentPage(1);
      setTotalPages(0);
      setIsLoadingPdf(false);
      setPdfError(null);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const customizedTemplate = findCustomizedTemplate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      {/* Main Container */}
      <div className={`flex transition-all duration-300 ${isSidebarOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>

        {/* Sidebar (Outside the modal, placed beside it) */}
        {isSidebarOpen && !customizeMode && (
          <div className="max-h-[700px] w-64 bg-white shadow-lg p-6 flex flex-col">
            {/*<button onClick={() => setIsSidebarOpen(false)} className="self-end">
              <X className="text-gray-700" />
        </button>*/}

            <h2 className="text-xl font-bold text-orange-600 mb-6">Actions Menu</h2>
            <p className="text-gray-600 mb-6">
              Our contract management solution streamlines contracting, saves time, and reduces errors.
            </p>
            
            <button className="flex items-center gap-2 bg-blue-50 text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 bi bi-upload" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
              </svg>
              Upload Template
            </button>
            
            <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 mt-6 hover:text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 bi bi-person" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              Go To Dashboard
            </button>

            {/* Storage Status */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-700">Auto-Save</span>
                {isSaving && <span className="text-orange-500">Saving...</span>}
              </div>
              <p className="text-gray-600">
                Templates: {uploadedTemplates.length} stored
              </p>
              
              {/* Clear Storage Button (for testing) */}
              <button 
                onClick={handleClearStorage}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Clear All Storage
              </button>
            </div>
          </div>
        )}


        {/* Main Content Area */}
        {customizeMode && customizingTemplateId && customizedTemplate ? (
          <CustomizePage 
            templateId={customizingTemplateId}
            template={customizedTemplate}
            onBack={handleBackFromCustomize} 
          />
        ) : (
          <div className="bg-[#EDF3FA] max-h-[700px] rounded-md shadow-lg w-full max-w-3xl p-6 relative pt-20">
            <nav className="absolute top-0 left-0 right-0 bg-white p-4 shadow flex items-center z-10">
            <button onClick={toggleSidebar}>
                <Menu className="text-gray-700 cursor-pointer mr-2" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Main Contract Page</h2>
              <button 
                onClick={onClose} 
                className="absolute top-1 right-6 text-gray-600 hover:text-gray-800 text-2xl font-bold p-2"
              >
                &times;
              </button>
            </nav>

        <div className="mb-6">
          <div className="mb-3">
            <h3 className="text-xl font-semibold">Upload your Template</h3>
          </div>
          <div className="flex gap-6 items-start">
            {/* Upload Box */}
            <label
              className="border-dashed bg-white border-2 border-gray-300 rounded-lg w-44 h-56 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition-all"
              data-demo-contract-upload
            >
              <UploadCloud size={32} className="mb-2 text-gray-400" />
              <span className="text-center text-sm">Click to upload or drag & drop</span>
              <span className="text-center text-xs text-gray-400 mt-1">Max 10MB • PDF only</span>
              <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleUpload} />
            </label>

            {/* Template Previews */}
            <div className="flex space-x-4 overflow-x-auto">
              {[0, 1, 2, 3].map((index) => {
                const template = uploadedTemplates[index];
                return template && template.imagePreview ? (
                  <img
                    key={template.id}
                    src={template.imagePreview}
                    alt={`Template ${String.fromCharCode(65 + index)}`} // A, B, C, D
                    className="w-44 h-56 object-cover rounded-lg border cursor-pointer"
                    onClick={() => handlePreview(template)}
                  />
                ) : (
                  <div key={index} className="w-44 h-56 rounded-lg border bg-gray-200 flex items-center justify-center text-gray-500">
                    Template {String.fromCharCode(65 + index)}
                  </div>
    );
  })}
</div>

          </div>
        </div>


       {/* Uploaded, Deleted Templates & Received Contracts */}
<div className="border-b border-gray-300 flex space-x-4">
  {['uploaded', 'received', 'deleted'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as 'uploaded' | 'deleted' | 'received')}
      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
        activeTab === tab
          ? 'border-[#DC5F12] text-[#DC5F12]'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {tab === 'uploaded' ? 'Uploaded Templates' : tab === 'received' ? `Received Contracts${receivedContracts.length ? ` (${receivedContracts.length})` : ''}` : 'Deleted Templates'}
    </button>
  ))}
</div>

<div className="mt-4 max-h-[200px] overflow-y-auto">
  {activeTab === 'uploaded' ? (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700">Your Templates</h3>
        {isLoadingTemplates && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            Loading templates...
          </div>
        )}
      </div>
      {/* Uploaded Templates Table */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 border text-left w-2/5">Template</th>
            <th className="p-2 border text-center w-1/5">Date</th>
            <th className="p-2 border text-right w-2/5">Actions</th>
          </tr>
        </thead>
        <tbody>
          {uploadedTemplates.map((template, index) => (
          <tr key={template.id} className="border-t">
              <td className="p-2 border text-left max-w-0 w-2/5">
                <div className="truncate" title={template.name}>
                  {template.name}
                </div>
              </td>
              <td className="p-2 border text-left w-1/5">{template.uploadDate}</td>
              <td className="p-2 border text-right space-x-2 w-2/5 relative">
                {/* Manage Button */}
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === template.id ? null : template.id)}
                  className="border border-[#136C9E] text-[#136C9E] px-4 py-1 rounded-full hover:bg-[#136C9E]/10"
                  {...(index === 0 ? { 'data-demo-contract-manage-first': true } : {})}
                >
                  Manage
                </button>
                <button
                  onClick={() => handlePreview(template)}
                  className="bg-[#136C9E] text-white px-4 py-1 rounded-full hover:bg-[#0F5B88]"
                >
                  Preview
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen === template.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                    <button
                      onClick={() => handleCustomize(template.id)}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Customize
                    </button>
                    <button
                      onClick={() => setConfirmDelete(template.id)}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                )}

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Are you sure you want to delete this template?</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="mr-4 px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  ) : activeTab === 'received' ? (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Received Contracts</h3>
      {receivedContracts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No contracts received yet</p>
          <p className="text-sm mt-2">Contracts sent by your landlord will appear here</p>
        </div>
      ) : (
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-2 border text-left w-2/5">Contract</th>
              <th className="p-2 border text-center w-1/5">Date</th>
              <th className="p-2 border text-right w-2/5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivedContracts.map((contract) => (
              <tr key={contract.id} className="border-t">
                <td className="p-2 border text-left max-w-0 w-2/5">
                  <div className="truncate" title={contract.fileName}>
                    <strong>{contract.fileName}</strong>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    <span className={`px-2 py-0.5 rounded ${
                      contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                      contract.status === 'unsigned' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {contract.status === 'sent' ? 'Sent' : contract.status === 'unsigned' ? 'Awaiting Signature' : 'Signed'}
                    </span>
                  </div>
                  {contract.landlordEmail && (
                    <div className="text-xs text-gray-500 truncate mt-1" title={`From: ${contract.landlordEmail}`}>
                      From: {contract.landlordEmail}
                    </div>
                  )}
                </td>
                <td className="p-2 border text-left w-1/5">
                  {contract.sentDate && new Date(contract.sentDate).toLocaleDateString()}
                </td>
                <td className="p-2 border text-right space-x-2 w-2/5 relative">
                  {/* Manage Button */}
                  <button
                    onClick={() => setDropdownOpen(dropdownOpen === contract.id ? null : contract.id)}
                    className="border border-[#136C9E] text-[#136C9E] px-4 py-1 rounded-full hover:bg-[#136C9E]/10"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => openReceivedContractPreview(contract)}
                    className="bg-[#136C9E] text-white px-4 py-1 rounded-full hover:bg-[#0F5B88]"
                    disabled={!contract.fileUrl}
                    title={contract.fileUrl ? 'Preview contract' : 'Document file unavailable'}
                  >
                    Preview
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen === contract.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                      <button
                        onClick={async () => {
                          try {
                            const existingTemplate = uploadedTemplates.find(t => t.id === contract.id);
                            if (existingTemplate) {
                              handleCustomize(contract.id, existingTemplate);
                              return;
                            }

                            const template = await buildTemplateFromReceivedContract(contract);
                            if (template.file?.type && template.file.type !== 'application/pdf') {
                              alert(`Cannot customize ${contract.fileName}. Only PDF files can be customized.`);
                              setDropdownOpen(null);
                              return;
                            }

                            let fileData: string | undefined;
                            if (template.file) {
                              try {
                                fileData = await convertFileToBase64(template.file);
                              } catch (conversionError) {
                                console.warn('Failed to convert fetched contract to base64:', conversionError);
                              }
                            }

                            const templateToAdd: Template = {
                              ...template,
                              fileData,
                              fileSize: template.file?.size,
                            };

                            setUploadedTemplates(prev => {
                              if (prev.some(t => t.id === templateToAdd.id)) {
                                return prev;
                              }
                              return [...prev, templateToAdd];
                            });

                            handleCustomize(contract.id, templateToAdd);
                          } catch (error) {
                            console.error('Error preparing contract for customization:', error);
                            alert(error instanceof Error ? error.message : 'Failed to open contract for customization. Please try again.');
                          } finally {
                            setDropdownOpen(null);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Customize
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const template = await buildTemplateFromReceivedContract(contract);
                            const link = document.createElement('a');
                            link.href = template.fileUrl;
                            link.download = contract.fileName;
                            link.click();
                          } catch (error) {
                            console.error('Error downloading contract:', error);
                            alert(error instanceof Error ? error.message : 'Failed to download contract.');
                          } finally {
                            setDropdownOpen(null);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Download
                      </button>
                    </div>
                  )}

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ) : (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Deleted Templates</h3>
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 border text-left w-2/5">Template</th>
            <th className="p-2 border text-left w-1/5">Date</th>
            <th className="p-2 border text-right w-2/5">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deletedTemplates.map((template) => (
            <tr key={template.id} className="border-t">
              <td className="p-2 border text-left max-w-0 w-2/5">
                <div className="truncate" title={template.name}>
                  {template.name}
                </div>
              </td>
              <td className="p-2 border text-left w-1/5">{template.uploadDate}</td>
              <td className="p-2 border text-right space-x-2 w-2/5 relative">
                <button className="border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-50"
                onClick={() => setConfirmDelete(template.id)}
                >
                  Delete
                </button>
                <button className="bg-[#136C9E] text-white px-4 py-1 rounded-full hover:bg-[#0F5B88]"
                onClick={() => handleRestore(template.id)}
                >
                  Restore
                </button>
              </td>
            </tr>
          ))}

          {/* Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-5 rounded-md shadow-md">
              <p>Are you sure you want to delete this template permanently?</p>
              <div className="flex justify-end mt-4 gap-3">
                <button className="bg-gray-500 text-white px-3 py-1 rounded-md" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded-md" onClick={() => handleDeletePermanently(confirmDelete)}>Delete</button>
              </div>
            </div>
          </div>
        )}
        
        </tbody>
      </table>
    </div>
  )}
</div>

      </div>
        )}  

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closePreview}>
          <div className="bg-white p-4 rounded-md shadow-lg relative w-3/5 h-4/5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with close button and page info */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-800">PDF Preview</h3>
                {totalPages > 0 && (
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
              <button 
                className="text-gray-700 hover:text-gray-900 p-1" 
                onClick={closePreview}
              >
                <X size={24} />
              </button>
            </div>

            {/* PDF Canvas Container */}
            <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-100 rounded">
              <canvas 
                ref={canvasRef}
                className="max-w-full max-h-full shadow-lg"
                style={{ display: pdfDocument && !isLoadingPdf && !pdfError ? 'block' : 'none' }}
              />
              
              {/* Loading indicator */}
              {isLoadingPdf && (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <div className="text-gray-500">Loading PDF...</div>
                </div>
              )}

              {/* Error message */}
              {pdfError && (
                <div className="flex flex-col items-center justify-center space-y-2 p-4">
                  <div className="text-red-500 text-center">
                    <div className="font-semibold">Error loading PDF</div>
                    <div className="text-sm mt-1">{pdfError}</div>
                  </div>
                  <button 
                    onClick={() => {
                      if (previewTemplateRef.current) {
                        handlePreview(previewTemplateRef.current);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* No document state */}
              {!isLoadingPdf && !pdfError && !pdfDocument && (
                <div className="text-gray-500">
                  No PDF loaded
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-4 pt-2 border-t">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center space-x-1 px-3 py-2 rounded ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                
                <span className="text-sm text-gray-600 font-medium">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center space-x-1 px-3 py-2 rounded ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
        
    </div>
    </div>
  );
};

export default ContractModal;