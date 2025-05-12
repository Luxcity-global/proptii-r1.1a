import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface CustomizePageProps {
  templateId: string;
  template: {
    id: string;
    name: string;
    uploadDate: string;
    fileUrl: string;
    imagePreview: string | null;
  };
  onBack: () => void;
}

const CustomizePage: React.FC<CustomizePageProps> = ({ templateId, template, onBack }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'edit' | 'send'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    {/*<div className="flex transition-all duration-300 max-w-3xl">*/}
    <div className={`flex transition-all duration-300 ${isSidebarOpen ? 'max-w-5xl' : 'max-w-3xl'}`}>
      {/* Sidebar (Outside the modal, placed beside it) */}
      {isSidebarOpen && (
        <div className="max-h-[700px] w-80 bg-white shadow-lg p-6 flex flex-col">

          <h2 className="text-xl font-bold text-orange-600 mb-6">Actions Menu</h2>
          <p className="text-gray-600 mb-6">
            Our contract management solution streamlines contracting, saves time, and reduces errors.
          </p>
          
          <button onClick={onBack} className="flex items-center gap-2 bg-blue-50 text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 bi bi-upload" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
            </svg>
            Main Contract Pg
          </button>
          
          <button className="flex items-center gap-2 text-gray-600 mt-6 hover:text-gray-900 px-4 py-3 rounded-md w-full justify-center hover:bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 bi bi-person" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            Go To Dashboard
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[#FFFFFF] max-h-[700px] rounded-md shadow-lg w-full max-w-3xl p-6 relative pt-20">
            
        {/* Keep the same navbar style for consistency */}
        <nav className="absolute top-0 left-0 right-0 bg-white p-4 shadow flex items-center z-10">
          <button onClick={toggleSidebar}>
            <Menu className="text-gray-700 cursor-pointer mr-2" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Customize Page</h2>
        </nav>

      <div className="mt-2 p-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex">
          {[
            { id: 'home', label: 'Home' },
            { id: 'edit', label: 'Edit' },
            { id: 'send', label: 'Send' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'home' | 'edit' | 'send')}
              className={`py-2 px-8 font-medium text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document Preview Area */}
        <div className="mt-8 p-4 flex justify-center max-h-[400px] overflow-y-auto">
          <div className="max-w-2xl w-full">
            {template.imagePreview ? (
              <div className="flex justify-center">
                <img 
                  src={template.imagePreview} 
                  alt={`Preview of ${template.name}`}
                  className="max-w-full max-h-[500px] object-contain border border-gray-200 rounded"
                />
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-10 text-center">
                <p className="text-gray-500">Preview not available for {template.name}</p>
                <p className="text-sm text-gray-400 mt-2">You can still edit this template</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default CustomizePage;