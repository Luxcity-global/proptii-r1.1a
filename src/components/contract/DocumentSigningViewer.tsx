import React, { useState, useEffect, useRef } from 'react';
import { Download, Save, X, Move, RotateCcw, Trash2, FileText, PenTool, Type, Upload, MousePointer, Keyboard } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import SignaturePadComponent from './SignaturePad';
import { useSignedContracts } from '../../contexts/SignedContractsContext';
import contractEmailService from '../../services/contractEmailService';
import signedContractsFirestoreService from '../../services/signedContractsFirestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface DocumentSigningViewerProps {
  template: {
    id: string;
    name: string;
    file?: File;
    fileUrl: string;
    fileType?: string;
  };
  recipient?: {
    email: string;
    name: string;
  };
  onSigned?: (signedPdfBytes: Uint8Array) => void;
  onSave?: (signedPdfBytes: Uint8Array) => void;
  onExport?: (format: 'docx' | 'pdf') => void;
  onSignatureMethodSelect?: () => void;
  onUseSignature?: () => void;
}

interface SignaturePlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  signatureData: string;
  pageNumber: number;
}

const DocumentSigningViewer: React.FC<DocumentSigningViewerProps> = ({ 
  template, 
  recipient = { email: 'user@example.com', name: 'Document Signer' },
  onSigned,
  onSave,
  onExport,
  onSignatureMethodSelect,
  onUseSignature
}) => {
  // Debug: Check if context is available
  console.log('🔍 DocumentSigningViewer - Component rendering, checking context...');
  
  const { addSignedContract } = useSignedContracts();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [signaturePlacements, setSignaturePlacements] = useState<SignaturePlacement[]>([]);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type' | 'upload'>('draw');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [draggedSignature, setDraggedSignature] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // Load PDF document
  useEffect(() => {
    if (template.file) {
      loadPdfDocument();
    }
  }, [template.file]);

  // Update container rect when component mounts or resizes
  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  const loadPdfDocument = async () => {
    if (!template.file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading PDF document...');
      const arrayBuffer = await template.file.arrayBuffer();
      
      // Load PDF using pdfjs-dist for rendering
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      console.log('✅ PDF loaded successfully, pages:', pdf.numPages);
      console.log('📄 PDF document info:', {
        numPages: pdf.numPages,
        fingerprint: pdf.fingerprints?.[0],
        loadingTask: pdf.loadingTask
      });
    } catch (err) {
      console.error('❌ Error loading PDF:', err);
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render PDF page
  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Get page dimensions and create proper viewport
      const originalViewport = page.getViewport({ scale: 1.0 });
      console.log('📄 Original page dimensions:', {
        width: originalViewport.width,
        height: originalViewport.height,
        rotation: originalViewport.rotation
      });

      // Create viewport with proper scale and fixed rotation of 0
      // The page.rotate property indicates the page's inherent orientation
      const pageRotation = page.rotate || 0;
      console.log(`📄 Page rotation property: ${pageRotation}°`);
      
      // Use rotation of 0 to render pages as they are stored
      const viewport = page.getViewport({ 
        scale: 1.5, 
        rotation: 0,
        offsetX: 0,
        offsetY: 0
      });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear canvas completely
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      console.log(`✅ Page ${pageNumber} rendered successfully:`, {
        canvas: { width: canvas.width, height: canvas.height },
        viewport: { width: viewport.width, height: viewport.height },
        scale: 1.5
      });
    } catch (error) {
      console.error('❌ Error rendering PDF page:', error);
    }
  };

  // Render page when currentPage changes
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDocument]);

  // Handle signature creation
  const handleCreateSignature = () => {
    setShowSignaturePad(true);
  };

  // Handle signature capture from drawing pad
  const handleSignatureCapture = (signatureData: string | null) => {
    console.log('🖊️ Signature captured:', signatureData ? 'Signature data received' : 'No signature data');
    setCurrentSignature(signatureData);
    // Don't close the modal yet - let user click "Use Signature"
  };

  // Handle typed signature change
  const handleTypedSignatureChange = (value: string) => {
    setTypedSignature(value);
  };

  // Handle signature upload
  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedSignature(e.target?.result as string);
        setShowSignaturePad(false);
        setIsPlacingSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get current signature based on method
  const getCurrentSignature = (): string | null => {
    let signature = null;
    switch (signatureMethod) {
      case 'draw':
        signature = currentSignature;
        break;
      case 'type':
        signature = typedSignature ? `data:text/plain;base64,${btoa(typedSignature)}` : null;
        break;
      case 'upload':
        signature = uploadedSignature;
        break;
      default:
        signature = null;
    }
    
    console.log('🖊️ getCurrentSignature - method:', signatureMethod, 'signature available:', !!signature);
    return signature;
  };

  // Handle canvas click for signature placement
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlacingSignature || !getCurrentSignature() || !containerRect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Get the actual canvas dimensions (not display dimensions)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Calculate scale factors from display to actual canvas
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    // Convert click coordinates to canvas coordinates
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // Convert to PDF coordinates (PDF uses bottom-left origin, canvas uses top-left)
    const pdfX = canvasX;
    const pdfY = canvasHeight - canvasY;
    
    // Ensure coordinates are within bounds
    const clampedX = Math.max(0, Math.min(pdfX, canvasWidth));
    const clampedY = Math.max(0, Math.min(pdfY, canvasHeight));
    
    console.log('🖊️ Coordinate conversion:', {
      click: { x, y },
      display: { width: displayWidth, height: displayHeight },
      canvas: { width: canvasWidth, height: canvasHeight },
      scale: { scaleX, scaleY },
      canvasCoords: { canvasX, canvasY },
      pdfCoords: { pdfX, pdfY },
      clamped: { clampedX, clampedY }
    });

    const newPlacement: SignaturePlacement = {
      id: `sig_${Date.now()}`,
      x: clampedX,
      y: clampedY,
      width: 200,
      height: 100,
      signatureData: getCurrentSignature()!,
      pageNumber: currentPage,
    };

    setSignaturePlacements([...signaturePlacements, newPlacement]);
    setIsPlacingSignature(false);
    setCurrentSignature(null);
    setTypedSignature('');
    setUploadedSignature(null);
    console.log('🖊️ Signature placed on document at coordinates:', pdfX, pdfY);
  };

  // Handle signature placement drag
  const handleSignatureDrag = (placementId: string, newX: number, newY: number) => {
    setSignaturePlacements(prev => 
      prev.map(placement => 
        placement.id === placementId 
          ? { ...placement, x: newX, y: newY }
          : placement
      )
    );
  };

  // Handle drag start
  const handleDragStart = (placementId: string) => {
    setDraggedSignature(placementId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSignature(null);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedSignature || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Use same coordinate mapping as click handler
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    const pdfX = canvasX;
    const pdfY = canvasHeight - canvasY;

    handleSignatureDrag(draggedSignature, pdfX, pdfY);
  };

  // Remove signature placement
  const removeSignaturePlacement = (placementId: string) => {
    setSignaturePlacements(prev => 
      prev.filter(placement => placement.id !== placementId)
    );
  };

  // Sign the document with all placements
  const signDocument = async () => {
    if (!template.file || signaturePlacements.length === 0) {
      setError('Please add at least one signature to the document');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      console.log('🔄 Signing document with', signaturePlacements.length, 'signatures...');
      
      // Load the PDF document
      const arrayBuffer = await template.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Process each signature placement
      console.log('🖊️ Total signature placements to process:', signaturePlacements.length);
      
      for (const placement of signaturePlacements) {
        const page = pdfDoc.getPage(placement.pageNumber - 1);
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        // Get the canvas dimensions for this page
        const canvas = canvasRef.current;
        if (!canvas) continue;
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate scale factors from canvas to PDF
        const scaleX = pdfWidth / canvasWidth;
        const scaleY = pdfHeight / canvasHeight;
        
        // Convert canvas coordinates to PDF coordinates
        const pdfX = placement.x * scaleX;
        const pdfY = placement.y * scaleY;
        
        // Scale signature dimensions
        const pdfWidth_scaled = placement.width * scaleX;
        const pdfHeight_scaled = placement.height * scaleY;
        
        console.log('🖊️ Processing signature placement:', {
          id: placement.id,
          canvasCoords: { x: placement.x, y: placement.y },
          canvasSize: { width: canvasWidth, height: canvasHeight },
          pdfSize: { width: pdfWidth, height: pdfHeight },
          scale: { scaleX, scaleY },
          pdfCoords: { x: pdfX, y: pdfY },
          pdfDimensions: { width: pdfWidth_scaled, height: pdfHeight_scaled }
        });
        
        // Ensure coordinates are within page bounds
        const safeX = Math.max(0, Math.min(pdfX, pdfWidth - pdfWidth_scaled));
        const safeY = Math.max(0, Math.min(pdfY, pdfHeight - pdfHeight_scaled));
        
        console.log('🖊️ Embedding signature at coordinates:', { 
          canvas: { x: placement.x, y: placement.y },
          pdf: { x: pdfX, y: pdfY },
          safe: { x: safeX, y: safeY },
          dimensions: { width: pdfWidth_scaled, height: pdfHeight_scaled }
        });
        
        if (placement.signatureData.startsWith('data:image/')) {
          // Handle drawn or uploaded signatures
          try {
            const signatureImage = await pdfDoc.embedPng(placement.signatureData);
            
            // Add signature to the page with proper positioning
            page.drawImage(signatureImage, {
              x: safeX,
              y: safeY,
              width: pdfWidth_scaled,
              height: pdfHeight_scaled,
            });
            console.log('✅ Drawn signature embedded successfully');
          } catch (error) {
            console.error('❌ Error embedding drawn signature:', error);
          }
        } else if (placement.signatureData.startsWith('data:text/plain')) {
          // Handle typed signatures
          try {
            const signatureText = atob(placement.signatureData.split(',')[1]);
            
            // Add typed signature as text with proper positioning
            page.drawText(signatureText, {
              x: safeX,
              y: safeY + (20 * scaleY), // Offset for text baseline, scaled
              size: 16 * Math.min(scaleX, scaleY), // Scale font size
              color: rgb(0, 0, 0),
            });
            console.log('✅ Typed signature embedded successfully');
          } catch (error) {
            console.error('❌ Error embedding typed signature:', error);
          }
        } else {
          // Handle plain text signatures (fallback)
          try {
            page.drawText(placement.signatureData, {
              x: safeX,
              y: safeY + (20 * scaleY), // Offset for text baseline, scaled
              size: 16 * Math.min(scaleX, scaleY), // Scale font size
              color: rgb(0, 0, 0),
            });
            console.log('✅ Plain text signature embedded successfully');
          } catch (error) {
            console.error('❌ Error embedding plain text signature:', error);
          }
        }
        
        // Note: Removed signature metadata tags to keep signatures clean
      }
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      setSignedPdfBytes(signedPdfBytes);
      // Build a blob URL and base64 data URL for persistence
      const signedBlob = new Blob([signedPdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(signedBlob);
      const toBase64 = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };
      const dataUrlBase64 = `data:application/pdf;base64,${toBase64(signedPdfBytes)}`;
      setIsCompleted(true);
      
      console.log('✅ Document signed successfully');
      
      // Add to signed contracts context
      console.log('🔄 Adding signed contract to Firestore...');
      try {
        // Use authenticated user ID or fallback for development
        const userId = user?.id || 'dev-user-123';
        
        const signedContractData = {
          templateId: template.id,
          templateName: template.name,
          propertyName: 'Sample Property',
          propertyAddress: '123 Sample Street, Sample City, SC 12345',
          agentName: 'Sample Agent',
          agentEmail: 'agent@example.com',
          tenantName: recipient.name,
          tenantEmail: recipient.email,
          signedDate: new Date().toISOString(),
          documentUrl: blobUrl,
          documentBase64: dataUrlBase64,
          documentName: `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`,
          documentSize: signedPdfBytes.length,
          documentType: 'application/pdf',
          status: 'signed' as const,
          emailSent: false
        };
        
        const result = await signedContractsFirestoreService.saveSignedContract(userId, signedContractData);
        
        if (result.success) {
          console.log('✅ Signed contract saved to Firestore successfully:', result.contractId);
          
          // Also add to local context for immediate UI update
          const newSignedContract = {
            id: result.contractId || `contract_${Date.now()}`,
            propertyName: signedContractData.propertyName,
            propertyAddress: signedContractData.propertyAddress,
            agentName: signedContractData.agentName,
            email: signedContractData.agentEmail,
            phone: '+1 (555) 123-4567',
            signedDate: signedContractData.signedDate,
            documentUrl: blobUrl,
            documentName: signedContractData.documentName,
            property: signedContractData.propertyName
          };
          
          await addSignedContract(newSignedContract as any);
          console.log('✅ Contract also added to local context');
        } else {
          console.error('❌ Failed to save signed contract to Firestore:', result.error);
        }
      } catch (error) {
        console.error('❌ Error saving signed contract to Firestore:', error);
      }

      // NOTE: Email sending is now handled in SendContract component
      // Just notify that signing is complete
      console.log('✅ Document signed successfully! Now go to the Send tab to email the contract.');
      alert('Contract signed successfully! Go to the "Send" tab to email the signed contract to recipients.');
      
      if (onSigned) {
        onSigned(signedPdfBytes);
      }
      
    } catch (err) {
      console.error('❌ Error signing document:', err);
      setError(`Failed to sign document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSigning(false);
    }
  };

  // Download signed PDF
  const downloadSignedPdf = () => {
    if (signedPdfBytes) {
      const blob = new Blob([signedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${template.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle save document
  const handleSaveDocument = () => {
    if (signedPdfBytes && onSave) {
      onSave(signedPdfBytes);
    }
  };

  // Handle export document
  const handleExportDocument = (format: 'docx' | 'pdf') => {
    if (onExport) {
      onExport(format);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading document...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load your PDF</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Document</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header with Signing Options */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex-shrink-0">
        {/* Document Information Row */}
        <div className="flex items-center gap-4 mb-4">
            {/* Document Icon */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DC5F12' }}>
              <FileText size={24} className="text-white" />
            </div>
          
          {/* Document Title and Status */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sign Document</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-600">{template.name}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEF3E7', color: '#DC5F12' }}>
                Ready to Sign
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
          {/* Signature Method Selection */}
          <div
            className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200"
            data-demo-customize-sign-tools
          >
            <button
              onClick={() => { setSignatureMethod('draw'); handleCreateSignature(); onSignatureMethodSelect?.(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                signatureMethod === 'draw' 
                  ? 'text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={signatureMethod === 'draw' ? { backgroundColor: '#DC5F12' } : {}}
            >
              <MousePointer size={16} />
              Draw
            </button>
            <button
              onClick={() => { setSignatureMethod('type'); handleCreateSignature(); onSignatureMethodSelect?.(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                signatureMethod === 'type' 
                  ? 'text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={signatureMethod === 'type' ? { backgroundColor: '#DC5F12' } : {}}
            >
              <Keyboard size={16} />
              Type
            </button>
            <button
              onClick={() => { setSignatureMethod('upload'); handleCreateSignature(); onSignatureMethodSelect?.(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                signatureMethod === 'upload' 
                  ? 'text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={signatureMethod === 'upload' ? { backgroundColor: '#DC5F12' } : {}}
            >
              <Upload size={16} />
              Upload
            </button>
          </div>

          {/* Sign Document Button */}
          <button
            data-demo-customize-sign-document
            onClick={signDocument}
            disabled={isSigning || signaturePlacements.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing...
              </>
            ) : (
              <>
                <PenTool size={16} />
                Sign Document
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={downloadSignedPdf}
            disabled={!signedPdfBytes}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            <Download size={16} />
            Download
          </button>
          
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Signed</span>
            </div>
          )}
        </div>
      </div>


      {/* Document Viewer */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 pb-8">
          {/* PDF Canvas Container */}
          <div 
            ref={containerRef}
            data-demo-customize-document-canvas
            className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100 max-h-[70vh]"
          >
            <canvas 
              ref={canvasRef}
              className="block mx-auto cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                cursor: isPlacingSignature ? 'crosshair' : (draggedSignature ? 'grabbing' : 'default')
              }}
              onMouseEnter={() => {
                if (isPlacingSignature && canvasRef.current) {
                  canvasRef.current.style.cursor = 'crosshair';
                }
              }}
              onMouseLeave={() => {
                if (canvasRef.current) {
                  canvasRef.current.style.cursor = 'default';
                }
              }}
            />
            
            {/* Signature Placements Overlay */}
            {signaturePlacements
              .filter(placement => placement.pageNumber === currentPage)
              .map(placement => {
                // Convert PDF coordinates back to display coordinates
                const canvas = canvasRef.current;
                if (!canvas) return null;
                
                const canvasRect = canvas.getBoundingClientRect();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const displayWidth = canvasRect.width;
                const displayHeight = canvasRect.height;
                
                // Calculate scale factors from canvas to display
                const scaleX = displayWidth / canvasWidth;
                const scaleY = displayHeight / canvasHeight;
                
                // Convert PDF coordinates to display coordinates
                const displayX = placement.x * scaleX;
                const displayY = (canvasHeight - placement.y) * scaleY;
                
                return (
                  <div
                    key={placement.id}
                    className="absolute border-2 border-blue-500 bg-transparent rounded cursor-move overflow-hidden"
                    style={{
                      left: displayX,
                      top: displayY,
                      width: placement.width * scaleX,
                      height: placement.height * scaleY,
                    }}
                    onMouseDown={() => handleDragStart(placement.id)}
                    draggable={false}
                  >
                  {/* Show actual signature image */}
                  {placement.signatureData.startsWith('data:image/') ? (
                    <img 
                      src={placement.signatureData} 
                      alt="Signature" 
                      className="w-full h-full object-contain"
                    />
                  ) : placement.signatureData.startsWith('data:text/plain') ? (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <div className="text-lg font-cursive text-gray-800 border-b-2 border-gray-400 pb-1">
                        {atob(placement.signatureData.split(',')[1])}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <div className="text-lg font-cursive text-gray-800 border-b-2 border-gray-400 pb-1">
                        {placement.signatureData}
                      </div>
                    </div>
                  )}
                  
                  {/* Remove button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSignaturePlacement(placement.id);
                    }}
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm z-10"
                  >
                    <X size={12} />
                  </button>
                </div>
                );
              })}
          </div>

          {/* Page Navigation - Always Show */}
          <div className="flex justify-center items-center space-x-4 mt-6 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {totalPages > 1 ? (
              <>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 border border-gray-300"
                >
                  <span>← Previous</span>
                </button>
                
                <span className="text-sm text-gray-600 font-medium px-4 py-2 bg-white rounded-lg border border-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-100 border border-gray-300"
                >
                  <span>Next →</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-600 font-medium px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  📄 Single page document
                </span>
                <span className="text-sm text-gray-600 font-medium px-4 py-2 bg-white rounded-lg border border-gray-300">
                  Page 1 of 1
                </span>
              </div>
            )}
            
            {/* Removed Refresh button; viewer renders with correct orientation automatically */}
          </div>

          {/* Instructions */}
          {isPlacingSignature && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Click on the document</strong> where you want to place your signature.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                💡 The signature will be placed exactly where you click
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Your Signature</h3>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Signature Method Selection */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSignatureMethod('draw')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  signatureMethod === 'draw' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setSignatureMethod('type')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  signatureMethod === 'type' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setSignatureMethod('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  signatureMethod === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upload
              </button>
            </div>
            
            {/* Signature Content */}
            {signatureMethod === 'draw' && (
              <SignaturePadComponent
                onSignatureChange={handleSignatureCapture}
                width={600}
                height={300}
                className="mb-4"
              />
            )}
            
            {signatureMethod === 'type' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  value={typedSignature}
                  onChange={(e) => handleTypedSignatureChange(e.target.value)}
                />
                <div className="mt-3 border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
                  <div className="text-2xl font-cursive text-gray-800 border-b-2 border-gray-400 pb-1">
                    {typedSignature || 'Your signature will appear here'}
                  </div>
                </div>
              </div>
            )}
            
            {signatureMethod === 'upload' && (
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="text-center">
                    <Download size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Upload signature image</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="signature-upload"
                      onChange={handleSignatureUpload}
                    />
                    <label
                      htmlFor="signature-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Choose File
                    </label>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, or GIF files accepted</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Signature Status */}
            {getCurrentSignature() && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-800 font-medium">Signature Ready</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Click "Use Signature" to place it on the document</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignaturePad(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('🖊️ Use Signature clicked, method:', signatureMethod);
                  console.log('🖊️ Current signature data:', getCurrentSignature() ? 'Available' : 'Not available');
                  
                  if (getCurrentSignature()) {
                    setShowSignaturePad(false);
                    setIsPlacingSignature(true);
                    onUseSignature?.();
                    console.log('🖊️ Ready to place signature on document');
                  }
                }}
                disabled={!getCurrentSignature()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Use Signature
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Status Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Document signing with drag-and-drop signatures</span>
          <span className="text-gray-600">
            {isCompleted ? 'Document signed successfully' : 'Ready to sign'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentSigningViewer;