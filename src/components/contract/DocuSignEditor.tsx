import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, FileText, PenTool } from 'lucide-react';
import { docusignConfig, validateDocuSignConfig } from '../../config/docusign';
import { docuSignService, DocuSignRecipient } from '../../services/docusignService';

interface DocuSignEditorProps {
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
  onSigned?: (envelopeId: string) => void;
}

const DocuSignEditor: React.FC<DocuSignEditorProps> = ({ 
  template, 
  recipient = { email: 'user@example.com', name: 'Document Signer' },
  onSigned 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [envelopeStatus, setEnvelopeStatus] = useState<string>('created');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Utility function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Initialize envelope and get signing URL when component mounts
  useEffect(() => {
    if (template.file) {
      initializeEnvelope();
    }
  }, [template]);

  const initializeEnvelope = async () => {
    if (!template.file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Initializing DocuSign envelope for signing...');
      
      // Convert file to base64
      const documentBase64 = await fileToBase64(template.file);
      
      // Create recipient for signing
      const recipients: DocuSignRecipient[] = [{
        email: recipient.email,
        name: recipient.name,
        recipientId: '1',
        routingOrder: 1,
        roleName: 'signer'
      }];
      
      // Create envelope
      const envelope = await docuSignService.createEnvelopeFromDocument(
        documentBase64,
        template.file.name,
        recipients,
        'Please sign this document'
      );
      
      setEnvelopeId(envelope.envelopeId);
      setEnvelopeStatus(envelope.status);
      
      console.log('✅ Envelope created:', envelope.envelopeId);
      
      // Get embedded signing URL
      console.log('🔄 Getting signing URL...');
      const signingUrl = await docuSignService.getEmbeddedSigningUrl({
        envelopeId: envelope.envelopeId,
        returnUrl: window.location.origin + '/contracts?signed=true',
        authenticationMethod: 'none',
        clientUserId: '1000',
        email: recipient.email,
        userName: recipient.name
      });
      
      setSigningUrl(signingUrl);
      console.log('✅ Signing URL ready');
      
    } catch (err) {
      console.error('❌ DocuSign initialization failed:', err);
      setError(`Failed to initialize signing: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Check envelope status periodically
  useEffect(() => {
    if (envelopeId && envelopeStatus === 'sent') {
      const checkStatus = async () => {
        try {
          const envelope = await docuSignService.getEnvelopeStatus(envelopeId);
          setEnvelopeStatus(envelope.status);
          
          if (envelope.status === 'completed' && onSigned) {
            onSigned(envelopeId);
          }
        } catch (err) {
          console.error('Error checking envelope status:', err);
        }
      };

      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [envelopeId, envelopeStatus, onSigned]);

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
            onClick={initializeEnvelope}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Configuration missing - show setup message
  if (!validateDocuSignConfig()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">DocuSign Setup Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            DocuSign credentials need to be configured. Please add your DocuSign integration details to complete the setup.
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            Add credentials to .env.local file
          </div>
        </div>
      </div>
    );
  }

  // Main signing interface
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
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
          
          {envelopeStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                envelopeStatus === 'completed' ? 'bg-green-500' : 
                envelopeStatus === 'sent' ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium text-gray-700 capitalize">
                {envelopeStatus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <FileText size={16} />
          <span>Recipient: {recipient.name} ({recipient.email})</span>
        </div>
      </div>

      {/* Signing Interface */}
      <div className="flex-1 bg-white">
        {signingUrl ? (
          <iframe
            ref={iframeRef}
            src={signingUrl}
            className="w-full h-full border-0"
            title="DocuSign Signing Interface"
            onLoad={() => console.log('📄 DocuSign signing interface loaded')}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-pulse">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              </div>
              <p className="text-gray-600">Loading signing interface...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      {envelopeId && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Envelope ID: {envelopeId}</span>
            <span className="text-gray-600">
              Status updates automatically every 5 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocuSignEditor; 