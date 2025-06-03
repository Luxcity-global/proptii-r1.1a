import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
}

interface FileUploadProps {
  updateFormData: (step: string, data: any) => void;
  formData: any;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FileUpload: React.FC<FileUploadProps> = ({ updateFormData, formData }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG and PDF files are allowed');
      return;
    }

    try {
      // If it's an image, compress it
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file);
        updateFormData('identity', { identityProof: compressedFile });
      } else {
        updateFormData('identity', { identityProof: file });
      }
    } catch (err) {
      setError('Error processing file. Please try again.');
      console.error('File processing error:', err);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            0.7 // compression quality
          );
        };
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
    });
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upload Identity Document</h3>
        {formData.identity.identityProof && (
          <span className="text-green-500">✓ File uploaded</span>
        )}
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <label className="cursor-pointer bg-[#136C9E] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors">
            Choose File
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
            />
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Upload your passport, driving license or national ID card
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
          {formData.identity.identityProof && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {formData.identity.identityProof.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
