import { useState, useEffect } from "react";
import { uploadToFirebaseStorage } from '../services/storageService';

interface StoredFile {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    url?: string;
    dataUrl: string;
}

interface FileUploadProps {
    updateFormData: (section: string, data: any) => void;
    formData: any;
}

const FileUpload: React.FC<FileUploadProps> = ({ updateFormData, formData }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // Load file from formData on mount
    useEffect(() => {
        const proof = formData?.identity?.identityProof;
        if (proof?.url || proof?.dataUrl) {
            setPreview(proof.url || proof.dataUrl);
        }
    }, [formData]);

    const handleUploadProcess = async (file: File) => {
        // Check file size (25MB limit)
        if (file.size > 25 * 1024 * 1024) {
            alert('File size must be less than 25MB');
            return;
        }

        setSelectedFile(file);
        setIsUploading(true);

        try {
            const uploadRes = await uploadToFirebaseStorage(file, 'referencing_documents/identity');
            if (uploadRes.success && uploadRes.url) {
                setPreview(uploadRes.url);
                const storedFile: StoredFile = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    url: uploadRes.url,
                    dataUrl: uploadRes.url
                };
                updateFormData("identity", { identityProof: storedFile });
            } else {
                alert(uploadRes.error || 'Failed to upload document to storage');
            }
        } catch (err: any) {
            console.error('File upload failed:', err);
            alert(err?.message || 'Upload error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            await handleUploadProcess(event.target.files[0]);
        }
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            await handleUploadProcess(event.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Identity Documents</h2>
            <label className="block text-gray-700 mb-2">
                Passport or ID Card <span className="text-red-500">*</span>
            </label>
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
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
                                {formData?.identity?.identityProof?.type?.startsWith('image/') ? (
                                    <img src={preview} alt="Preview" className="max-h-32 max-w-full object-contain" />
                                ) : (
                                    <div className="p-4 bg-gray-100 rounded">
                                        <p className="text-gray-600">{formData?.identity?.identityProof?.name}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedFile(null);
                                    setPreview(null);
                                    updateFormData("identity", { identityProof: null });
                                }}
                                className="text-red-500 hover:text-red-700"
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