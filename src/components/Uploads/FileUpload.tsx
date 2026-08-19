import { useState, useEffect } from "react";
import { uploadToFirebaseStorage } from '../../services/storageService';

interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  url?: string;
  dataUrl?: string;
}

interface FileUploadProps {
  updateFormData: (section: string, data: any) => void;
  formData: any;
}

const FileUpload: React.FC<FileUploadProps> = ({ updateFormData, formData }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // On mount/reload: restore preview from stored URL
  useEffect(() => {
    const proof = formData?.identity?.identityProof;
    if (proof?.url) {
      setPreview(proof.url);
    } else if (proof?.dataUrl) {
      setPreview(proof.dataUrl);
    } else {
      setPreview(null);
    }
  }, [formData?.identity?.identityProof]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Create a lightweight local blob URL for instant UI preview
    const localBlobUrl = URL.createObjectURL(file);
    setPreview(localBlobUrl);
    setIsUploading(true);
    setUploadProgress(0);

    const initialStoredFile: StoredFile = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      url: localBlobUrl,
    };

    updateFormData("identity", { identityProof: initialStoredFile });

    // 2. Upload directly to Firebase Cloud Storage
    try {
      const result = await uploadToFirebaseStorage(
        file,
        'referencing_documents/identity',
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (result.success && result.url) {
        setPreview(result.url);
        updateFormData("identity", {
          identityProof: {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            url: result.url,
          },
        });
      } else {
        setUploadError(result.error || 'Failed to upload document to Firebase Storage');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const storedFile = formData?.identity?.identityProof;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Identity Documents</h2>
      <label className="block text-gray-700 mb-2">
        Passport or ID Card <span className="text-red-500">*</span>
      </label>

      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
        <label
          htmlFor="identity-proof-upload"
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

              {isUploading && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading to Firebase Storage: {uploadProgress}%</p>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-500 mb-2">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPreview(null);
                  setUploadError(null);
                  updateFormData("identity", { identityProof: null });
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
          id="identity-proof-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>

      <p className="text-gray-500 text-sm mt-2">
        Please upload a clear copy of your passport or ID card
      </p>
    </div>
  );
};

export default FileUpload;
