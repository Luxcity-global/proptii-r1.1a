import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { FormData } from '../ReferencingModal';

interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
}

interface EmploymentUploadProps {
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  formData: FormData;
}

const EmploymentUpload: React.FC<EmploymentUploadProps> = ({ updateFormData, formData }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Load file from formData on mount
  useEffect(() => {
    if (formData?.employment?.proofDocument?.dataUrl) {
      setPreview(formData.employment.proofDocument.dataUrl);
    }
  }, [formData]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);

        // Create StoredFile object
        const storedFile: StoredFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          dataUrl: dataUrl
        };

        // Update form data with stored file
        updateFormData("employment", { proofDocument: storedFile });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mt-8">
      {/* Heading */}
      <h2 className="text-lg font-semibold mb-2">Employment Documents</h2>

      {/* Label */}
      <label className="block text-gray-700 mb-2">
        Proof of Employment <span className="text-red-500">*</span>
      </label>

      {/* Drag and Drop File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
        <label
          htmlFor="employment-proof-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          {!preview ? (
            <>
              {/* Upload Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>

              {/* Drag and Drop Text */}
              <p className="text-gray-600">Drag and drop or click to select</p>

              {/* Accepted Formats */}
              <p className="text-gray-500 text-sm mt-1">
                Accepted formats: <span className="font-semibold">.PDF, .DOC, .DOCX, .JPG, .JPEG, .PNG</span>
              </p>

              {/* File Size Limit */}
              <p className="text-gray-500 text-sm">Maximum file size: 5.0 MB</p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-center mb-4">
                {formData?.employment?.proofDocument?.type?.startsWith('image/') ? (
                  <img src={preview} alt="Preview" className="max-h-32 max-w-full object-contain" />
                ) : (
                  <div className="p-4 bg-gray-100 rounded">
                    <p className="text-gray-600">{formData?.employment?.proofDocument?.name}</p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedFile(null);
                  setPreview(null);
                  updateFormData("employment", { proofDocument: null });
                }}
                className="text-red-500 hover:text-red-700"
              >
                Remove File
              </button>
            </div>
          )}
        </label>

        {/* Hidden File Input */}
        <input
          type="file"
          id="employment-proof-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>

      {/* Helper Text */}
      <p className="text-gray-500 text-sm mt-2">
        Please upload a clear copy of your employment proof document
      </p>
    </div>
  );
};

export default EmploymentUpload;