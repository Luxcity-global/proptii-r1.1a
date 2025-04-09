import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  hidePreview?: boolean; // New prop to hide the default preview
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onChange, hidePreview = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(
          file => file.type.startsWith('image/')
        );
        onChange([...images, ...newFiles]);
        e.dataTransfer.clearData();
      }
    },
    [images, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        onChange([...images, ...newFiles]);
        // Reset the input value so the same file can be selected again if needed
        e.target.value = '';
      }
    },
    [images, onChange]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    },
    [images, onChange]
  );

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-700 mb-2">
            Drag & drop images here, or <label className="text-primary hover:underline cursor-pointer">browse</label>
          </p>
          <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF (Max 5MB each)</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            multiple
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
            Select Files
          </label>
        </div>
      </div>

      {/* Only show this preview if hidePreview is false */}
      {!hidePreview && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload preview ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-80 hover:opacity-100"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;