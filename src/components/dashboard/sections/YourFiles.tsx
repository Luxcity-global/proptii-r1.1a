import React, { useState } from "react";
import {  formatDate, } from '../../../utils/formatters';

interface FileItem {
  name: string;
  date: string;
}

interface Tab {
  label: string;
  files: FileItem[];
}

const tabs: Tab[] = [
  {
    label: "Identity Files",
    files: [{ name: "Lease_Agreement.pdf", date: "2/13/2025 11:36 AM" }],
  },
  {
    label: "Employment Files",
    files: [{ name: "Pay_Slip.pdf", date: "2/10/2025 09:45 AM" }],
  },
  {
    label: "Residential Files",
    files: [{ name: "Utility_Bill.pdf", date: "2/08/2025 03:12 PM" }],
  },
  {
    label: "Financial Files",
    files: [{ name: "Bank_Statement.pdf", date: "2/05/2025 10:30 AM" }],
  },
];

const FileDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = tabs[activeTab].files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Uploaded Files Card */}
      <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">4</h2>
          <p className="text-gray-600">Uploaded Files</p>
          <p className="text-xs text-gray-500">As of {formatDate(new Date().toISOString())}</p>
        </div>
        <div className="text-orange-500 text-3xl">📄</div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mt-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === index
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* File Table */}
      <div className="bg-white mt-4 shadow-md rounded-lg p-4">
        {/* Search Bar */}
        <div className="flex justify-between items-center pb-3 border-b">
          <span className="text-gray-600">File Name and Upload Date</span>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Find File..."
              className="border px-3 py-1 rounded-md outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-3 py-1 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-100">
              Search
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="mt-3">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border-b last:border-none"
              >
                <div>
                  <p className="text-gray-800 font-medium">{file.name}</p>
                  <p className="text-gray-500 text-sm">{file.date}</p>
                </div>
                <button className="border border-blue-600 text-blue-600 px-4 py-1 rounded-md hover:bg-blue-100">
                  View File
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm p-3">No files found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDashboard;
