import React, { useState } from 'react';
import { Menu, UploadCloud, X } from 'lucide-react';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  uploadDate: string;
  fileUrl: string;
  imagePreview: string | null;
  status: 'active' | 'deleted';
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCustomize = (templateId: string) => {
    navigate(`/contracts/customize/${templateId}`);
  };

  const handleDelete = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, status: 'deleted' }
          : template
      )
    );
    setConfirmDelete(null);
  };

  const handleRestore = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, status: 'active' }
          : template
      )
    );
  };

  const handleDeletePermanently = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
    setConfirmDelete(null);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(file);
      const imagePreview = await generatePdfPreview(fileUrl);

      const newTemplate: Template = {
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileUrl,
        imagePreview,
        status: 'active'
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
  };

  const generatePdfPreview = async (fileUrl: string): Promise<string | null> => {
    try {
      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return null;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      return null;
    }
  };

  const handlePreview = (fileUrl: string) => {
    setPreviewFile(fileUrl);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  if (!isOpen) return null;

  const activeTemplates = templates.filter(t => t.status === 'active');
  const deletedTemplates = templates.filter(t => t.status === 'deleted');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className={`flex transition-all duration-300 ${isSidebarOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="max-h-[700px] w-64 bg-white shadow-lg p-6 flex flex-col">
            <button onClick={() => setIsSidebarOpen(false)} className="self-end">
              <X className="text-gray-700" />
            </button>

            <h2 className="text-xl font-bold text-orange-600 mb-6">Actions Menu</h2>
            <p className="text-gray-600 mb-6">
              Our contract management solution streamlines contracting, saves time, and reduces errors.
            </p>
            
            <button className="flex items-center gap-2 bg-blue-50 text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
              <UploadCloud className="w-5 h-5 text-orange-500" />
              Upload Template
            </button>
            
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 mt-6 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" width="16" height="16" fill="currentColor">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              Go To Dashboard
            </button>
          </div>
        )}

        {/* Main Modal */}
        <div className="bg-[#EDF3FA] max-h-[700px] rounded-md shadow-lg w-full max-w-3xl p-6 relative pt-20">
          <nav className="absolute top-0 left-0 right-0 bg-white p-4 shadow flex items-center z-10">
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu className="text-gray-700 cursor-pointer mr-2" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Contract Management</h2>
            <button 
              onClick={onClose} 
              className="absolute top-18 right-6 text-gray-600 hover:text-gray-800 text-2xl font-bold p-2"
            >
              &times;
            </button>
          </nav>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Upload your Template</h3>
            <div className="flex gap-6 items-start">
              {/* Upload Box */}
              <label className="border-dashed bg-white border-2 border-gray-300 rounded-lg w-44 h-56 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition-all">
                <UploadCloud size={32} className="mb-2 text-gray-400" />
                <span className="text-center text-sm">Click to upload or drag & drop</span>
                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf" />
              </label>

              {/* Template Previews */}
              <div className="flex space-x-4 overflow-x-auto">
                {activeTemplates.map((template) => (
                  template.imagePreview && (
                    <div key={template.id} className="relative group">
                      <img
                        src={template.imagePreview}
                        alt={template.name}
                        className="w-44 h-56 object-cover rounded-lg cursor-pointer"
                        onClick={() => handlePreview(template.fileUrl)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleCustomize(template.id)}
                          className="bg-white text-gray-800 px-4 py-2 rounded-md text-sm"
                        >
                          Customize
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Active Templates
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'deleted'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Deleted Templates
            </button>
          </div>

          {/* Template List */}
          <div className="space-y-4">
            {(activeTab === 'active' ? activeTemplates : deletedTemplates).map((template) => (
              <div
                key={template.id}
                className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  {template.imagePreview && (
                    <img
                      src={template.imagePreview}
                      alt={template.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-500">Uploaded: {template.uploadDate}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {activeTab === 'active' ? (
                    <>
                      <button
                        onClick={() => handleCustomize(template.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Customize
                      </button>
                      <button
                        onClick={() => setConfirmDelete(template.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(template.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setConfirmDelete(template.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Delete Permanently
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Document Preview</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <iframe
              src={previewFile}
              className="w-full h-[80vh]"
              title="Document Preview"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {activeTab === 'active' ? 'delete' : 'permanently delete'} this template?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'active') {
                    handleDelete(confirmDelete);
                  } else {
                    handleDeletePermanently(confirmDelete);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractModal; 