import { useState } from "react";

const EmploymentUpload = ({ updateFormData, formData }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      updateFormData("identity", { identityProof: file });
    }
  };

  return (
    <div className="mt-8">
      {/* Heading */}
      <h2 className="text-lg font-semibold mb-2">Employment/School Admission Documents</h2>

      {/* Label 
      <label className="block text-gray-700 mb-2">
        Passport or ID Card <span className="text-red-500">*</span>
      </label>*/}

      {/* Drag and Drop File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
        <label
          htmlFor="identity-proof-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          {/* Upload Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>

          {/* Drag and Drop Text */}
          <p className="text-gray-600">Drag and drop a file here, or click to select</p>

          {/* Accepted Formats */}
          <p className="text-gray-500 text-sm mt-1">
            Accepted formats: <span className="font-semibold">.PDF, .DOC, .DOCX, .JPG, .JPEG, .PNG</span>
          </p>

          {/* File Size Limit */}
          <p className="text-gray-500 text-sm">Maximum file size: 5.0 MB</p>
        </label>

        {/* Hidden File Input */}
        <input
          type="file"
          id="identity-proof-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Upload File
        </button>

        {/* Display Selected File */}
        {selectedFile && (
          <div className="mt-2 text-green-600">
            File selected: {selectedFile.name}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-gray-500 text-sm mt-2">
        Please upload a clear copy of your proof of Employment Doocument
      </p>
    </div>
  );
};

export default EmploymentUpload;