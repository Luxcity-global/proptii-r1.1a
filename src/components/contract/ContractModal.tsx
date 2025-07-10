import React, { useState, useEffect, useRef } from 'react';
import { Menu, UploadCloud, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useNavigate } from "react-router-dom";
import CustomizePage from './CustomizePage'

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

// Storage service for managing template persistence
class TemplateStorageService {
  private static STORAGE_KEY = 'contract_templates';
  private static DELETED_STORAGE_KEY = 'deleted_contract_templates';
  private static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  static async saveTemplates(templates: Template[]): Promise<void> {
    try {
      const templatesToStore = await Promise.all(
        templates.map(async (template) => {
          const storageTemplate = { ...template };
          
          // Remove file object and blob URL before storage
          delete storageTemplate.file;
          delete storageTemplate.fileUrl;
          
          // Convert file to base64 if not already done and file exists
          if (template.file && !template.fileData) {
            if (template.file.size > this.MAX_FILE_SIZE) {
              console.warn(`File ${template.name} is too large for storage (${(template.file.size / 1024 / 1024).toFixed(2)}MB)`);
              return null; // Skip large files
            }
            
            try {
              const arrayBuffer = await template.file.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              storageTemplate.fileData = base64;
              storageTemplate.fileSize = template.file.size;
            } catch (error) {
              console.error('Error converting file to base64:', error);
              return null;
            }
          }
          
          return storageTemplate;
        })
      );

      const validTemplates = templatesToStore.filter(t => t !== null);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validTemplates));
      console.log(`Saved ${validTemplates.length} templates to storage`);
    } catch (error) {
      console.error('Error saving templates:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Some files may be too large to save.');
      }
    }
  }

  static async loadTemplates(): Promise<Template[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const templates: Template[] = JSON.parse(stored);
      
      // Reconstruct file objects and blob URLs
      const reconstructedTemplates = templates.map((template) => {
        if (template.fileData) {
          try {
            // Convert base64 back to file
            const binaryString = atob(template.fileData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const file = new File([bytes], template.name, { type: 'application/pdf' });
            const fileUrl = URL.createObjectURL(file);
            
            return {
              ...template,
              file,
              fileUrl
            };
          } catch (error) {
            console.error('Error reconstructing file:', error);
            return null;
          }
        }
        return template;
      }).filter(t => t !== null) as Template[];

      console.log(`Loaded ${reconstructedTemplates.length} templates from storage`);
      return reconstructedTemplates;
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  static async saveDeletedTemplates(templates: Template[]): Promise<void> {
    try {
      const templatesToStore = templates.map(template => {
        const storageTemplate = { ...template };
        delete storageTemplate.file;
        delete storageTemplate.fileUrl;
        return storageTemplate;
      });
      
      localStorage.setItem(this.DELETED_STORAGE_KEY, JSON.stringify(templatesToStore));
      console.log(`Saved ${templatesToStore.length} deleted templates to storage`);
    } catch (error) {
      console.error('Error saving deleted templates:', error);
    }
  }

  static loadDeletedTemplates(): Template[] {
    try {
      const stored = localStorage.getItem(this.DELETED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading deleted templates:', error);
      return [];
    }
  }

  static clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.DELETED_STORAGE_KEY);
    console.log('Template storage cleared');
  }
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'uploaded' | 'deleted'>('uploaded');
  const [uploadedTemplates, setUploadedTemplates] = useState<Template[]>([]);
  const [deletedTemplates, setDeletedTemplates] = useState<Template[]>([]);
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

  // New state to track if we're in customize mode and which template is being customized
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizingTemplateId, setCustomizingTemplateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load templates from storage on component mount
  useEffect(() => {
    const loadStoredTemplates = async () => {
      try {
        const storedTemplates = await TemplateStorageService.loadTemplates();
        const storedDeletedTemplates = TemplateStorageService.loadDeletedTemplates();
        
        setUploadedTemplates(storedTemplates);
        setDeletedTemplates(storedDeletedTemplates);
        
        console.log(`Loaded ${storedTemplates.length} templates and ${storedDeletedTemplates.length} deleted templates`);
      } catch (error) {
        console.error('Error loading templates from storage:', error);
      }
    };

    if (isOpen) {
      loadStoredTemplates();
    }
  }, [isOpen]);

  // Save templates to storage whenever they change
  useEffect(() => {
    const saveTemplates = async () => {
      if (uploadedTemplates.length > 0) {
        setIsSaving(true);
        await TemplateStorageService.saveTemplates(uploadedTemplates);
        setIsSaving(false);
      }
    };
    
    saveTemplates();
  }, [uploadedTemplates]);

  // Save deleted templates to storage whenever they change
  useEffect(() => {
    if (deletedTemplates.length > 0) {
      TemplateStorageService.saveDeletedTemplates(deletedTemplates);
    }
  }, [deletedTemplates]);

  // Clear all storage (for testing)
  const handleClearStorage = () => {
    TemplateStorageService.clearStorage();
    setUploadedTemplates([]);
    setDeletedTemplates([]);
    alert('All template storage has been cleared!');
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
const handleCustomize = (templateId: string) => {
  setCustomizingTemplateId(templateId);
  setCustomizeMode(true);
  setDropdownOpen(null); // Close the dropdown
};

// Return from customize mode
const handleBackFromCustomize = () => {
  setCustomizeMode(false);
  setCustomizingTemplateId(null);
};

// Find the template being customized
const findCustomizedTemplate = () => {
  return customizingTemplateId ? 
    uploadedTemplates.find(t => t.id === customizingTemplateId) || null 
    : null;
};
  

  // Handle Delete (Move to Deleted Templates)
  const handleDelete = (templateId: string) => {
    const templateToDelete = uploadedTemplates.find((t) => t.id === templateId);
    if (templateToDelete) {
      setUploadedTemplates(uploadedTemplates.filter((t) => t.id !== templateId));
      setDeletedTemplates([...deletedTemplates, templateToDelete]);
      setConfirmDelete(null);
    }
  };

  // Handle Restore (Move to Uploaded Templates)
  const handleRestore = (templateId: string) => {
    const restoredTemplate = deletedTemplates.find(template => template.id === templateId);
    if (restoredTemplate) {
      setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
      setUploadedTemplates([...uploadedTemplates, restoredTemplate]);
    }
  };

  // Handle Permanent Delete (Remove from Deleted Templates)
  const handleDeletePermanently = (templateId: string) => {
    setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
    setConfirmDelete(null); // Close confirmation after deletion
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("File selected:", file?.name, "Type:", file?.type, "Size:", file?.size);
    
    if (file && file.type === "application/pdf") {
      try {
        const fileUrl = URL.createObjectURL(file);
        console.log("Created blob URL:", fileUrl);
        
        const imagePreview = await generatePdfPreview(file);
        console.log("Generated preview:", imagePreview ? "Success" : "Failed");

        const newTemplate: Template = {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          uploadDate: new Date().toLocaleDateString(),
          fileUrl,
          imagePreview,
          file: file, // Store the actual file object
        };
        setUploadedTemplates([...uploadedTemplates, newTemplate]);
        console.log("Template added successfully");
      } catch (error) {
        console.error("Error processing uploaded file:", error);
      }
    } else {
      console.warn("Invalid file type or no file selected");
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
          <h3 className="text-xl font-semibold mb-3">Upload your Template</h3>
          <div className="flex gap-6 items-start">
            {/* Upload Box */}
            <label className="border-dashed bg-white border-2 border-gray-300 rounded-lg w-44 h-56 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition-all">
              <UploadCloud size={32} className="mb-2 text-gray-400" />
              <span className="text-center text-sm">Click to upload or drag & drop</span>
              <input type="file" className="hidden" onChange={handleUpload} />
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


       {/* Uploaded & Deleted Templates */}
<div className="border-b border-gray-300 flex space-x-4">
  {['uploaded', 'deleted'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as 'uploaded' | 'deleted')}
      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
        activeTab === tab
          ? 'border-[#DC5F12] text-[#DC5F12]'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {tab === 'uploaded' ? 'Uploaded Templates' : 'Deleted Templates'}
    </button>
  ))}
</div>

<div className="mt-4 max-h-[200px] overflow-y-auto">
  {activeTab === 'uploaded' ? (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Templates</h3>
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
          {uploadedTemplates.map((template) => (
            <tr key={template.id} className="border-t">
              <td className="p-2 border text-left max-w-0 w-2/5">
                <div className="truncate" title={template.name}>
                  {template.name}
                </div>
              </td>
              <td className="p-2 border text-left w-1/5">{template.uploadDate}</td>
              <td className="p-2 border text-right space-x-2 w-2/5">
                {/* Manage Button */}
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === template.id ? null : template.id)}
                  className="border border-[#136C9E] text-[#136C9E] px-4 py-1 rounded-full hover:bg-[#136C9E]/10"
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
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg">
                    <button
                      //onClick={() => handleCustomize(template.id)}
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
              <td className="p-2 border text-right space-x-2 w-2/5">
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
                      const template = [...uploadedTemplates, ...deletedTemplates].find(t => t.fileUrl === previewFile);
                      if (template) handlePreview(template);
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
