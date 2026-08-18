import { useState, useEffect } from "react";
import { uploadToAzureStorage } from '../../services/storageService';

interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
  url?: string;
}

interface EmploymentUploadProps {
  updateFormData: (section: string, data: any) => void;
  formData: any;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

const EmploymentUpload: React.FC<EmploymentUploadProps> = ({ updateFormData, formData }) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const proof = formData?.employment?.proofDocument;
    if (proof?.dataUrl) {
      setPreview(proof.dataUrl);
    } else if (proof?.url) {
      setPreview(proof.url);
    } else {
      setPreview(null);
    }
  }, [formData?.employment?.proofDocument]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let dataUrl: string;
    try {
      dataUrl = await readAsDataUrl(file);
    } catch {
      console.error('[EmploymentUpload] Failed to read file as data URL');
      return;
    }

    const storedFile: StoredFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      dataUrl,
    };
    setPreview(dataUrl);
    updateFormData("employment", { proofDocument: storedFile });

    uploadToAzureStorage(file, 'referencing_documents')
      .then((result) => {
        if (result.success && result.url) {
          updateFormData("employment", {
            proofDocument: { ...storedFile, url: result.url },
          });
        }
      })
      .catch(() => {});
  };

  const storedFile = formData?.employment?.proofDocument;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Employment Documents</h2>
      <label className="block text-gray-700 mb-2">
        Proof of Employment <span className="text-red-500">*</span>
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white relative">
        <label
          htmlFor="employment-proof-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          {!preview ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">Drag and drop or click to select</p>
              <p className="text-gray-500 text-sm mt-1">
                Accepted formats: <span className="font-semibold">.PDF, .DOC, .DOCX, .JPG, .JPEG, .PNG</span>
              </p>
              <p className="text-gray-500 text-sm">Maximum file size: 5.0 MB</p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-center mb-4">
                {storedFile?.type?.startsWith('image/') ? (
                  <img src={preview} alt="Preview" className="max-h-32 max-w-full object-contain rounded" />
                ) : (
                  <div className="p-4 bg-gray-100 rounded flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 text-sm">{storedFile?.name}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPreview(null);
                  updateFormData("employment", { proofDocument: null });
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove File
              </button>
            </div>
          )}
        </label>

        <input
          type="file"
          id="employment-proof-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>

      <p className="text-gray-500 text-sm mt-2">
        Please upload a clear copy of your employment proof document
      </p>
    </div>
  );
};

export default EmploymentUpload;
