import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X, Upload, MoveUp, MoveDown } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onChange, 
  maxImages = 4 
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews when images change
  React.useEffect(() => {
    const newPreviews = images.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    
    // Cleanup function to revoke object URLs
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for image files
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    // Limit to maxImages
    const newImages = [...images, ...imageFiles].slice(0, maxImages);
    onChange(newImages);
  }, [images, onChange, maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap images
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="text-primary font-medium">Drop the images here...</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {images.length}/{maxImages} images uploaded
              </p>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={previews[index]} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={() => moveImage(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded-full bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <MoveUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveImage(index, 'down')}
                  disabled={index === images.length - 1}
                  className="p-1 rounded-full bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <MoveDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeImage(index)}
                  className="p-1 rounded-full bg-white/80 hover:bg-white"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 