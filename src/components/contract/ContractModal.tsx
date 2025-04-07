import React, { useState } from 'react';
import { Menu, UploadCloud, X } from 'lucide-react';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useNavigate } from "react-router-dom";
import CustomizePage from './CustomizePage'

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
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'uploaded' | 'deleted'>('uploaded');
  const [uploadedTemplates, setUploadedTemplates] = useState<Template[]>([]);
  const [deletedTemplates, setDeletedTemplates] = useState<Template[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate(); // Initialize navigation
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // New state to track if we're in customize mode and which template is being customized
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizingTemplateId, setCustomizingTemplateId] = useState<string | null>(null);


  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  // Handle Customize (Redirect)
  {/*const handleCustomize = (templateId: string) => {
    navigate(`/customize/${templateId}`);
  };*/}

// Handle Customize
const handleCustomize = (templateId: string) => {
  setCustomizingTemplateId(templateId);
  setCustomizeMode(true);
  setDropdownOpen(null); // Close the dropdown
};

// Return from customize mode
const handleBackFromCustomize = () => {
  setCustomizeMode(false);
  setCustomizingTemplateId(null);
};

// Find the template being customized
const findCustomizedTemplate = () => {
  return customizingTemplateId ? 
    uploadedTemplates.find(t => t.id === customizingTemplateId) || null 
    : null;
};
  

  // Handle Delete (Move to Deleted Templates)
  const handleDelete = (templateId: string) => {
    const templateToDelete = uploadedTemplates.find((t) => t.id === templateId);
    if (templateToDelete) {
      setUploadedTemplates(uploadedTemplates.filter((t) => t.id !== templateId));
      setDeletedTemplates([...deletedTemplates, templateToDelete]);
      setConfirmDelete(null);
    }
  };

  // Handle Restore (Move to Uploaded Templates)
  const handleRestore = (templateId: string) => {
    const restoredTemplate = deletedTemplates.find(template => template.id === templateId);
    setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
    setUploadedTemplates([...uploadedTemplates, restoredTemplate]);
  };

  // Handle Permanent Delete (Remove from Deleted Templates)
  const handleDeletePermanently = (templateId: string) => {
    setDeletedTemplates(deletedTemplates.filter(template => template.id !== templateId));
    setConfirmDelete(null); // Close confirmation after deletion
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
      };
      setUploadedTemplates([...uploadedTemplates, newTemplate]);
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

  const customizedTemplate = findCustomizedTemplate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      {/* Main Container */}
      <div className={`flex transition-all duration-300 ${isSidebarOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>

        {/* Sidebar (Outside the modal, placed beside it) */}
        {isSidebarOpen && !customizeMode && (
          <div className="max-h-[700px] w-64 bg-white shadow-lg p-6 flex flex-col">
            {/*<button onClick={() => setIsSidebarOpen(false)} className="self-end">
              <X className="text-gray-700" />
        </button>*/}

            <h2 className="text-xl font-bold text-orange-600 mb-6">Actions Menu</h2>
            <p className="text-gray-600 mb-6">
              Our contract management solution streamlines contracting, saves time, and reduces errors.
            </p>
            
            <button className="flex items-center gap-2 bg-blue-50 text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 bi bi-upload" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
              </svg>
              Upload Template
            </button>
            
            <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 mt-6 hover:text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 bi bi-person" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              Go To Dashboard
            </button>
          </div>
        )}


        {/* Main Content Area */}
        {customizeMode && customizingTemplateId && customizedTemplate ? (
          <CustomizePage 
            templateId={customizingTemplateId}
            template={customizedTemplate}
            onBack={handleBackFromCustomize} 
          />
        ) : (
          <div className="bg-[#EDF3FA] max-h-[700px] rounded-md shadow-lg w-full max-w-3xl p-6 relative pt-20">
            <nav className="absolute top-0 left-0 right-0 bg-white p-4 shadow flex items-center z-10">
            <button onClick={toggleSidebar}>
                <Menu className="text-gray-700 cursor-pointer mr-2" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Main Contract Page</h2>
              <button 
                onClick={onClose} 
                className="absolute top-1 right-6 text-gray-600 hover:text-gray-800 text-2xl font-bold p-2"
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
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>

            {/* Template Previews */}
            <div className="flex space-x-4 overflow-x-auto">
              {[0, 1, 2, 3].map((index) => {
                const template = uploadedTemplates[index];
                return template && template.imagePreview ? (
                  <img
                    key={template.id}
                    src={template.imagePreview}
                    alt={`Template ${String.fromCharCode(65 + index)}`} // A, B, C, D
                    className="w-44 h-56 object-cover rounded-lg border cursor-pointer"
                    onClick={() => handlePreview(template.fileUrl)}
                  />
                ) : (
                  <div key={index} className="w-44 h-56 rounded-lg border bg-gray-200 flex items-center justify-center text-gray-500">
                    Template {String.fromCharCode(65 + index)}
                  </div>
    );
  })}
</div>

          </div>
        </div>


       {/* Uploaded & Deleted Templates */}
<div className="border-b border-gray-300 flex space-x-4">
  {['uploaded', 'deleted'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as 'uploaded' | 'deleted')}
      className={`py-2 px-4 font-medium text-sm border-b-2 transition-all ${
        activeTab === tab
          ? 'border-[#DC5F12] text-[#DC5F12]'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {tab === 'uploaded' ? 'Uploaded Templates' : 'Deleted Templates'}
    </button>
  ))}
</div>

<div className="mt-4 max-h-[200px] overflow-y-auto">
  {activeTab === 'uploaded' ? (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Templates</h3>
      {/* Uploaded Templates Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 border text-left">Template</th>
            <th className="p-2 border text-center">Date</th>
            <th className="p-2 border text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {uploadedTemplates.map((template) => (
            <tr key={template.id} className="border-t">
              <td className="p-2 border text-left">{template.name}</td>
              <td className="p-2 border text-left">{template.uploadDate}</td>
              <td className="p-2 border text-right space-x-2">
                {/* Manage Button */}
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === template.id ? null : template.id)}
                  className="border border-[#136C9E] text-[#136C9E] px-4 py-1 rounded-full hover:bg-[#136C9E]/10"
                >
                  Manage
                </button>
                <button
                  onClick={() => handlePreview(template.fileUrl)}
                  className="bg-[#136C9E] text-white px-4 py-1 rounded-full hover:bg-[#0F5B88]"
                >
                  Preview
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen === template.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg">
                    <button
                      //onClick={() => handleCustomize(template.id)}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Customize
                    </button>
                    <button
                      onClick={() => setConfirmDelete(template.id)}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                )}

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Are you sure you want to delete this template?</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="mr-4 px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  ) : (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Deleted Templates</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 border text-left">Template</th>
            <th className="p-2 border text-left">Date</th>
            <th className="p-2 border text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deletedTemplates.map((template) => (
            <tr key={template.id} className="border-t">
              <td className="p-2 border text-left">{template.name}</td>
              <td className="p-2 border text-left">{template.uploadDate}</td>
              <td className="p-2 border text-right space-x-2">
                <button className="border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-50"
                onClick={() => setConfirmDelete(template.id)}
                >
                  Delete
                </button>
                <button className="bg-[#136C9E] text-white px-4 py-1 rounded-full hover:bg-[#0F5B88]"
                onClick={() => handleRestore(template.id)}
                >
                  Restore
                </button>
              </td>
            </tr>
          ))}

          {/* Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-5 rounded-md shadow-md">
              <p>Are you sure you want to delete this template permanently?</p>
              <div className="flex justify-end mt-4 gap-3">
                <button className="bg-gray-500 text-white px-3 py-1 rounded-md" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded-md" onClick={() => handleDeletePermanently(confirmDelete)}>Delete</button>
              </div>
            </div>
          </div>
        )}
        
        </tbody>
      </table>
    </div>
  )}
</div>

      </div>
        )}  

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closePreview}>
          <div className="bg-white p-4 rounded-md shadow-lg relative w-3/4 h-3/4" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-700 hover:text-gray-900" onClick={closePreview}>
              <X size={24} />
            </button>
            <embed src={previewFile} type="application/pdf" width="100%" height="100%" />
          </div>
        </div>
      )}

      
        
    </div>
    </div>
  );
};

export default ContractModal;
