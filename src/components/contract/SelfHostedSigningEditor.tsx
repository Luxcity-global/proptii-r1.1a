import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileText, PenTool, Download, Save, Send, User, Mail, CheckCircle } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import SignaturePadComponent from './SignaturePad';

interface SelfHostedSigningEditorProps {
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
}

const SelfHostedSigningEditor: React.FC<SelfHostedSigningEditorProps> = ({ 
  template, 
  recipient = { email: 'user@example.com', name: 'Document Signer' },
  onSigned,
  onSave,
  onExport
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingMethod, setSigningMethod] = useState<'draw' | 'type' | 'upload'>('draw');
  const [showSigningOptions, setShowSigningOptions] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle signature change from drawing pad
  const handleSignatureChange = (signatureData: string | null) => {
    console.log('🖊️ Signature changed:', signatureData ? 'Signature captured' : 'Signature cleared');
    setSignature(signatureData);
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
      };
      reader.readAsDataURL(file);
    }
  };

  // Get current signature based on method
  const getCurrentSignature = (): string | null => {
    switch (signingMethod) {
      case 'draw':
        return signature;
      case 'type':
        return typedSignature ? `data:text/plain;base64,${btoa(typedSignature)}` : null;
      case 'upload':
        return uploadedSignature;
      default:
        return null;
    }
  };

  // Sign the PDF document
  const signDocument = async () => {
    if (!template.file) {
      setError('No document file available');
      return;
    }

    const currentSignature = getCurrentSignature();
    if (!currentSignature) {
      setError('Please provide a signature first');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      console.log('🔄 Starting PDF signing process...');
      
      // Load the PDF document
      const arrayBuffer = await template.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Convert signature to image
      let signatureImage;
      if (signingMethod === 'type') {
        // For typed signatures, we'll create a text element
        firstPage.drawText(typedSignature, {
          x: 50,
          y: height - 100,
          size: 24,
          color: rgb(0, 0, 0),
        });
      } else {
        // For drawn or uploaded signatures, embed as image
        if (currentSignature.startsWith('data:image/')) {
          const imageBytes = Uint8Array.from(atob(currentSignature.split(',')[1]), c => c.charCodeAt(0));
          signatureImage = await pdfDoc.embedPng(imageBytes);
          
          // Add signature to the PDF
          firstPage.drawImage(signatureImage, {
            x: 50,
            y: height - 150,
            width: 200,
            height: 100,
          });
        }
      }
      
      // Add signature metadata
      firstPage.drawText(`Signed by: ${recipient.name}`, {
        x: 50,
        y: height - 200,
        size: 12,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      firstPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 220,
        size: 12,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      setSignedPdfBytes(signedPdfBytes);
      setIsCompleted(true);
      
      console.log('✅ PDF signed successfully');
      
      // Call the onSigned callback
      if (onSigned) {
        onSigned(signedPdfBytes);
      }
      
    } catch (err) {
      console.error('❌ Error signing PDF:', err);
      setError(`Failed to sign document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSigning(false);
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

  // Download signed PDF
  const downloadSignedPdf = () => {
    if (signedPdfBytes) {
      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Preparing document for signing...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load your document</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
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

  // Main signing interface
  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PenTool size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Sign Document</h2>
              <p className="text-sm text-gray-600">{template.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Signing Options Button */}
            <button
              onClick={() => setShowSigningOptions(!showSigningOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PenTool size={16} />
              Signing Options
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveDocument}
              disabled={!signedPdfBytes}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Save
            </button>

            {/* Download Button */}
            <button
              onClick={downloadSignedPdf}
              disabled={!signedPdfBytes}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Download
            </button>
            
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">Signed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signing Options Panel */}
      {showSigningOptions && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Choose Signing Method</h3>
            <button
              onClick={() => setShowSigningOptions(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSigningMethod('draw')}
              className={`p-4 rounded-lg border-2 transition-all ${
                signingMethod === 'draw' 
                  ? 'border-blue-500 bg-blue-100' 
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <PenTool size={24} className="mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Draw</span>
                <p className="text-xs text-gray-600 mt-1">Draw signature</p>
              </div>
            </button>

            <button
              onClick={() => setSigningMethod('type')}
              className={`p-4 rounded-lg border-2 transition-all ${
                signingMethod === 'type' 
                  ? 'border-blue-500 bg-blue-100' 
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <FileText size={24} className="mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">Type</span>
                <p className="text-xs text-gray-600 mt-1">Type signature</p>
              </div>
            </button>

            <button
              onClick={() => setSigningMethod('upload')}
              className={`p-4 rounded-lg border-2 transition-all ${
                signingMethod === 'upload' 
                  ? 'border-blue-500 bg-blue-100' 
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <Download size={24} className="mx-auto mb-2 text-orange-600" />
                <span className="text-sm font-medium">Upload</span>
                <p className="text-xs text-gray-600 mt-1">Upload image</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Document Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FileText size={16} />
            <span>Recipient: {recipient.name} ({recipient.email})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User size={14} />
            <span>Signing as: {recipient.name}</span>
          </div>
        </div>
      </div>

      {/* Signing Interface */}
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        {signingMethod === 'draw' && (
          <div className="max-w-2xl mx-auto">
            <SignaturePadComponent
              onSignatureChange={handleSignatureChange}
              width={500}
              height={250}
              className="mb-4"
            />
          </div>
        )}

        {signingMethod === 'type' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Type Your Signature</h3>
              <p className="text-sm text-gray-600 mb-4">Type your name to create a typed signature</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    value={typedSignature}
                    onChange={(e) => handleTypedSignatureChange(e.target.value)}
                  />
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
                  <div className="text-2xl font-cursive text-gray-800 border-b-2 border-gray-400 pb-1">
                    {typedSignature || 'Your signature will appear here'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {signingMethod === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Signature Image</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-center">
                  <Download size={40} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-3">Upload signature image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Choose File
                  </button>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, or GIF files accepted</p>
                  {uploadedSignature && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600 mb-2">✓ Signature uploaded</p>
                      <img 
                        src={uploadedSignature} 
                        alt="Uploaded signature" 
                        className="max-w-48 mx-auto border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sign Document Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={signDocument}
            disabled={isSigning || !getCurrentSignature()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing Document...
              </>
            ) : (
              <>
                <PenTool size={20} />
                Sign Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Self-hosted signing solution</span>
          <span className="text-gray-600">
            {isCompleted ? 'Document signed successfully' : 'Ready to sign'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SelfHostedSigningEditor;
