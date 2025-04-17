import React, { useState } from 'react';
import { X, FileUp } from 'lucide-react';

interface SendContractProps {
  contractData: {
    title?: string;
    content: string;
    extractedFields?: {
      landlord?: string;
      tenant?: string;
      propertyAddress?: string;
      startDate?: string;
    };
  };
  onSend: (recipients: string[], signature?: File) => void;
}

const SendContract: React.FC<SendContractProps> = ({ contractData, onSend }) => {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle recipient email input changes
  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  // Add new recipient field
  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  // Remove recipient field
  const removeRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  // Handle file drops for signature
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSignatureFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection for signature
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSignatureFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const validRecipients = recipients.filter(email => email.trim() !== '');
    onSend(validRecipients, signatureFile || undefined);
  };

  return (
    <div className="bg-white rounded-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Contract</h2>

      {/* Recipients Section */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Recipient{recipients.length > 1 ? 's' : ''}</label>
        {recipients.map((recipient, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="email"
              value={recipient}
              onChange={(e) => handleRecipientChange(index, e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="email@example.com"
            />
            {recipients.length > 1 && (
              <button 
                onClick={() => removeRecipient(index)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={addRecipient}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          + Add another recipient
        </button>
      </div>

      {/* Extracted Content Preview */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Extracted Content</label>
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
          <div className="font-medium text-base">
            {contractData.title || "Lease Agreement"}
          </div>
          <div className="mt-4 text-gray-700 whitespace-pre-line">
            {contractData.extractedFields ? (
              <>
                <p><strong>Landlord:</strong> {contractData.extractedFields.landlord || "Not specified"}</p>
                <p><strong>Tenant:</strong> {contractData.extractedFields.tenant || "Not specified"}</p>
                <p><strong>Property Address:</strong> {contractData.extractedFields.propertyAddress || "Not specified"}</p>
                <p><strong>Start Date:</strong> {contractData.extractedFields.startDate || "Not specified"}</p>
              </>
            ) : (
              <p className="italic text-gray-500">Content extraction in progress...</p>
            )}
          </div>
        </div>
      </div>

      {/* Signature Upload */}
      <div className="mb-8">
        <label className="block text-gray-700 mb-2">Upload signature</label>
        <div 
          className={`border-2 border-dashed rounded-md p-6 text-center ${
            dragActive ? "border-orange-500 bg-orange-50" : "border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {signatureFile ? (
            <div className="flex items-center justify-center">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md flex items-center">
                <FileUp size={20} className="mr-2" />
                <span>{signatureFile.name}</span>
              </div>
              <button 
                onClick={() => setSignatureFile(null)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-500 mb-2">Drag and drop a document here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <label className="cursor-pointer inline-block">
                <span className="bg-transparent text-orange-500 px-4 py-2 rounded-md border border-orange-500 hover:bg-orange-50 transition-colors">
                  Select a file
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Send Contract
        </button>
      </div>
    </div>
  );
};

export default SendContract;