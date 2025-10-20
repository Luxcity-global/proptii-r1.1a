import React, { useState } from 'react';
import { FileText, Download, Eye, Upload, Search, Filter, User, Briefcase, Home, DollarSign, File, Calendar, ChevronDown } from 'lucide-react';

/**
 * Your Files section - matches the exact design from the image
 */
const YourFiles: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Files');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const files = [
    {
      id: 1,
      name: 'Passport_Scan.pdf',
      category: 'Identity',
      type: 'application/pdf',
      size: 2.4,
      uploadDate: '11/23/2023'
    },
    {
      id: 2,
      name: 'Drivers_License.pdf',
      category: 'Identity',
      type: 'application/pdf',
      size: 1.8,
      uploadDate: '11/15/2023'
    },
    {
      id: 3,
      name: 'Employment_Contract.pdf',
      category: 'Employment',
      type: 'application/pdf',
      size: 3.2,
      uploadDate: '11/20/2023'
    },
    {
      id: 4,
      name: 'Payslip_November.pdf',
      category: 'Employment',
      type: 'application/pdf',
      size: 1.5,
      uploadDate: '11/18/2023'
    },
    {
      id: 5,
      name: 'Proof_of_Address.pdf',
      category: 'Residential',
      type: 'application/pdf',
      size: 1787.81,
      uploadDate: '11/10/2023'
    },
    {
      id: 6,
      name: 'Utility_Bill.pdf',
      category: 'Residential',
      type: 'application/pdf',
      size: 1318.36,
      uploadDate: '11/25/2023'
    },
    {
      id: 7,
      name: 'Bank_Statement.pdf',
      category: 'Financial',
      type: 'application/pdf',
      size: 2.1,
      uploadDate: '01/05/2024'
    },
    {
      id: 8,
      name: 'Tax_Return_2023.pdf',
      category: 'Financial',
      type: 'application/pdf',
      size: 4.5,
      uploadDate: '01/05/2024'
    },
    {
      id: 9,
      name: 'Guarantor_ID.pdf',
      category: 'Guarantor',
      type: 'application/pdf',
      size: 2.3,
      uploadDate: '01/05/2024'
    },
    {
      id: 10,
      name: 'Guarantor_Proof_Income.pdf',
      category: 'Guarantor',
      type: 'application/pdf',
      size: 3.1,
      uploadDate: '01/05/2024'
    },
    {
      id: 11,
      name: 'Tenancy_Agreement Signed.pdf',
      category: 'Contracts',
      type: 'application/pdf',
      size: 5.2,
      uploadDate: '01/05/2024'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Identity':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'Employment':
        return <Briefcase className="w-4 h-4 text-gray-600" />;
      case 'Residential':
        return <Home className="w-4 h-4 text-gray-600" />;
      case 'Financial':
        return <DollarSign className="w-4 h-4 text-gray-600" />;
      case 'Guarantor':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'Contracts':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Identity':
        return 'text-blue-600';
      case 'Employment':
        return 'text-green-600';
      case 'Residential':
        return 'text-purple-600';
      case 'Financial':
        return 'text-yellow-600';
      case 'Guarantor':
        return 'text-orange-600';
      case 'Contracts':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const categories = ['All Files', 'Identity', 'Employment', 'Residential', 'Financial', 'Guarantor', 'Contracts'];

  // Filter files based on selected category and search query
  const filteredFiles = files.filter(file => {
    const matchesCategory = selectedFilter === 'All Files' || file.category === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header Section */}
      <div className="flex items-center justify-between mt-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#374957' }}>
            Your Files
          </h1>
          <p className="text-base" style={{ color: '#717182' }}>
            Complete your referencing to proceed with your tenancy application
          </p>
        </div>
        <button 
          className="px-12 py-3 text-white rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            border: '1px solid #DC5F12',
            minHeight: '3.5rem',
            minWidth: '180px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          Upload File
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Total Files</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>{filteredFiles.length}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>All updated files</p>
          </div>
        </div>

        {/* Referencing Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Referencing Files</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {filteredFiles.filter(f => f.category !== 'Contracts').length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Documents uploaded</p>
          </div>
        </div>

        {/* Contract Files Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Contract Files</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {filteredFiles.filter(f => f.category === 'Contracts').length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Signed contracts</p>
          </div>
        </div>

        {/* Storage Used Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Storage Used</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {(filteredFiles.reduce((total, file) => total + file.size, 0) / 1000).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>MB of 100 MB</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm" style={{ color: '#374957' }}>{selectedFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedFilter(category);
                      setIsFilterOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    style={{ color: '#374957' }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#E7F2FF' }}>
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-black">
            <div>File Name</div>
            <div>Category</div>
            <div>Type</div>
            <div>Size (KB)</div>
            <div>Uploaded At</div>
            <div></div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {filteredFiles.map((file, index) => (
            <div key={file.id} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-6 gap-4 items-center">
                {/* File Name */}
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {file.name}
                  </span>
                </div>
                
                {/* Category */}
                <div className="flex items-center gap-2">
                  {getCategoryIcon(file.category)}
                  <span className={`text-sm font-medium ${getCategoryColor(file.category)}`}>
                    {file.category}
                  </span>
                </div>
                
                {/* Type */}
                <div className="text-sm text-gray-700">
                  {file.type}
                </div>
                
                {/* Size */}
                <div className="text-sm text-gray-700">
                  {file.size}
                </div>
                
                {/* Uploaded At */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{file.uploadDate}</span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YourFiles;

