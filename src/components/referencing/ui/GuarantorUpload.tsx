import React from 'react';
import FileUpload from './FileUpload';

interface GuarantorUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  error?: string;
}

const GuarantorUpload: React.FC<GuarantorUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  error
}) => {
  return (
    <FileUpload
      onFileSelect={onFileSelect}
      onFileRemove={onFileRemove}
      selectedFile={selectedFile}
      error={error}
      accept={{
        'application/pdf': ['.pdf'],
        'image/*': ['.png', '.jpg', '.jpeg']
      }}
      maxSize={5242880} // 5MB
      label="Upload Guarantor ID"
    />
  );
};

export default GuarantorUpload; 