import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import DocuSignEditor from './DocuSignEditor';

interface CustomizePageProps {
  templateId: string;
  template: {
    id: string;
    name: string;
    uploadDate: string;
    fileUrl: string;
    imagePreview: string | null;
    file?: File;
    fileType?: string; // Added for DOCX files
  };
  onBack: () => void;
}

const CustomizePage: React.FC<CustomizePageProps> = ({ templateId, template, onBack }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'edit' | 'send'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // PDF Preview states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Document editing states
  const [editedPages, setEditedPages] = useState<any[]>([]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load PDF document when component mounts
  useEffect(() => {
    let loadingTask: any = null;
    
    const loadDocument = async () => {
      if (!template) return;
      
      setIsLoadingPdf(true);
      setPdfError(null);
      
      try {
        // Check if it's a PDF file
        if (template.file?.type === 'application/pdf' || template.fileType === 'application/pdf') {
          let arrayBuffer: ArrayBuffer;
          
          if (template.file) {
            // Use the stored File object directly
            console.log("Using stored file object, size:", template.file.size, "bytes");
            arrayBuffer = await template.file.arrayBuffer();
          } else {
            // Fallback to fetching blob URL
            console.log("No file object found, attempting to fetch blob...");
            const response = await fetch(template.fileUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status}`);
            }
            arrayBuffer = await response.arrayBuffer();
          }
          
          console.log("File data loaded, size:", arrayBuffer.byteLength, "bytes");
          
          loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          console.log("PDF loaded successfully, pages:", pdf.numPages);
          
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        } else {
          // For DOCX files, we don't need PDF.js
          console.log("DOCX file detected, skipping PDF loading");
          setTotalPages(1);
          setCurrentPage(1);
        }
        
        setIsLoadingPdf(false);
      } catch (error) {
        console.error("Error loading document:", error);
        setPdfError(`Failed to load document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoadingPdf(false);
      }
    };

    loadDocument();

    // Cleanup function
    return () => {
      if (loadingTask) {
        loadingTask.destroy();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [template]);

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current || isRendering) {
      console.log("Cannot render page - missing document, canvas, or already rendering");
      return;
    }

    setIsRendering(true);
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
      
      // Create a new canvas to avoid render conflicts
      const newCanvas = document.createElement('canvas');
      const newContext = newCanvas.getContext("2d");
      
      if (!newContext) {
        console.error("Could not get new canvas context");
        return;
      }

      // Set dimensions on the new canvas
      newCanvas.width = viewport.width;
      newCanvas.height = viewport.height;

      const renderContext = {
        canvasContext: newContext,
        viewport,
      };

      // Render to the new canvas
      await page.render(renderContext).promise;
      
      // Clear the original canvas and copy the new content
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.drawImage(newCanvas, 0, 0);
      
      console.log(`Page ${pageNumber} rendered successfully`);
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      setPdfError(`Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRendering(false);
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

  // Handle document save
  const handleDocumentSave = (envelopeId: string) => {
    console.log('DocuSign envelope saved:', envelopeId);
    // Here you would typically save the envelope ID to backend or localStorage
  };

  // Handle document export
  const handleDocumentExport = (format: 'docx' | 'pdf') => {
    console.log(`Exporting document as ${format}`);
    // Here you would implement the actual export functionality
    alert(`Document exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    {/*<div className="flex transition-all duration-300 max-w-3xl">*/}
    <div className={`flex transition-all duration-300 ${isSidebarOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
      {/* Sidebar (Outside the modal, placed beside it) */}
      {isSidebarOpen && (
        <div className="max-h-[700px] w-80 bg-white shadow-lg p-6 flex flex-col">

          <h2 className="text-xl font-bold text-orange-600 mb-6">Actions Menu</h2>
          <p className="text-gray-600 mb-6">
            Our contract management solution streamlines contracting, saves time, and reduces errors.
          </p>
          
          <button onClick={onBack} className="flex items-center gap-2 bg-blue-50 text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 bi bi-upload" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
            </svg>
            Main Contract Pg
          </button>
          
          <button className="flex items-center gap-2 text-gray-600 mt-6 hover:text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 bi bi-person" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            Go To Dashboard
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`bg-[#FFFFFF] rounded-md shadow-lg w-full max-w-3xl p-6 relative pt-20 ${
        activeTab === 'edit' ? 'max-h-[750px]' : 'max-h-[850px]'
      }`}>
            
        {/* Keep the same navbar style for consistency */}
        <nav className="absolute top-0 left-0 right-0 bg-white p-4 shadow flex items-center z-10">
          <button onClick={toggleSidebar}>
            <Menu className="text-gray-700 cursor-pointer mr-2" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Customize Page</h2>
        </nav>

      <div className="mt-2 p-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex">
          {[
            { id: 'home', label: 'Home' },
            { id: 'edit', label: 'Edit' },
            { id: 'send', label: 'Send' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'home' | 'edit' | 'send')}
              className={`py-2 px-8 font-medium text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <div className="mt-4 p-4 flex justify-center max-h-[300px] overflow-y-auto">
          <div className="max-w-2xl w-full">
              {/* PDF Canvas Container */}
              <div className="flex items-center justify-center overflow-auto bg-gray-100 rounded border">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full max-h-full shadow-lg"
                  style={{ display: pdfDocument && !isLoadingPdf && !pdfError && !isRendering ? 'block' : 'none' }}
                />
                
                {/* Loading indicator */}
                {isLoadingPdf && (
                  <div className="flex flex-col items-center justify-center space-y-2 p-8">
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
                        setPdfError(null);
                        setIsLoadingPdf(true);
                        // Force reload by clearing and reloading
                        setPdfDocument(null);
                        setCurrentPage(1);
                        setTotalPages(0);
                        // The useEffect will trigger reload
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* No document state */}
                {!isLoadingPdf && !pdfError && !pdfDocument && (
                  <div className="text-gray-500 p-8">
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

        {activeTab === 'edit' && (
          <div className="mt-4 flex-1 overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
            <DocuSignEditor
              template={template}
              onSave={handleDocumentSave}
              onExport={handleDocumentExport}
            />
          </div>
        )}

        {activeTab === 'send' && (
          <div className="mt-4 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Send Document</h3>
              <p className="text-gray-600 mb-6">
                This feature will allow you to send the document via email or generate a shareable link.
              </p>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Send via Email
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Generate Share Link
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                  Download & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
    </div>
  );
};

export default CustomizePage;