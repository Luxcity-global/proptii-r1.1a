import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, CheckCircle, Clock, AlertTriangle, User, Mail, Phone } from 'lucide-react';

/**
 * Tenant Contracts section - redesigned to match the provided design
 */
const TenantContracts: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requested');

  // Mock data for summary cards
  const contractStats = {
    total: 3,
    signed: 5,
    requested: 2,
    expiring: 8
  };

  // Mock data for contracts
  const requestedContracts = [
    {
      id: 1,
      property: '123 Regent Street, London W1B 4EA',
      agent: 'John Doe',
      email: 'johndoe@gmail.com',
      phone: '08130990478',
      issueDate: '15 Jan 2024',
      dueInDays: 5
    },
    {
      id: 2,
      property: '456 Oxford Street, London W1C 1AP',
      agent: 'Jane Smith',
      email: 'janesmith@gmail.com',
      phone: '08130990478',
      issueDate: '17 Jan 2024',
      dueInDays: 3
    },
    {
      id: 3,
      property: '789 Bond Street, London W1S 1DH',
      agent: 'Mike Johnson',
      email: 'mikejohnson@gmail.com',
      phone: '08130990478',
      issueDate: '20 Jan 2024',
      dueInDays: 1
    }
  ];

  const signedContracts = [
    {
      id: 1,
      property: '22 Kensington Gardens, London W2 4RU',
      agent: 'James Bond',
      email: 'Bond@gmail.com',
      phone: '08130990478',
      signedDate: '5 Jan 2024'
    },
    {
      id: 2,
      property: '15 Camden High Street, London NW1 7JE',
      agent: 'Jane Smoke',
      email: 'Jsmoke@gmail.com',
      phone: '08130990478',
      signedDate: '3 Apr 2024'
    },
    {
      id: 3,
      property: '8 Notting Hill Gate, London W11 3JE',
      agent: 'An Agent',
      email: 'Amail@gmail.com',
      phone: '12345678923',
      signedDate: '2 Jan 2024'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const currentContracts = activeTab === 'requested' ? requestedContracts : signedContracts;
  
  // Helper function to get date based on contract type
  const getContractDate = (contract: any) => {
    return activeTab === 'requested' ? contract.issueDate : contract.signedDate;
  };
  
  // Helper function to get due days for requested contracts
  const getDueDays = (contract: any) => {
    return activeTab === 'requested' ? contract.dueInDays : null;
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Spacing above header */}
      <div className="mt-10"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
        <h1 className="text-2xl font-semibold" style={{ color: '#374957' }}>
            Contracts
        </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track compliance across your contracts
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
          Go To Contract Page
        </button>
      </div>

      {/* Spacing */}
      <div className="mb-6"></div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Contracts */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Total Contracts</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
              <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {contractStats.total}
              </p>
            </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>All contracts</p>
          </div>
        </div>

        {/* Signed Contracts */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Signed Contracts</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {contractStats.signed}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>As of 10/09/2025</p>
          </div>
        </div>

        {/* Requested Contracts */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Requested Contracts</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {contractStats.requested}
            </p>
          </div>
            <div>
            <p className="text-sm" style={{ color: '#717182' }}>Awaiting signature</p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Expiring Soon</h3>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mb-3">
              <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {contractStats.expiring}
              </p>
            </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Within 30 days</p>
            </div>
          </div>
        </div>

      {/* Alert Message */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-sm font-medium text-orange-800">
            3 contracts are awaiting your signature and should be reviewed.
              </p>
            </div>
      </div>

      {/* Tabs Section */}
      <div>
        <div className="mb-6">
          <div className="bg-white rounded-full border border-gray-100 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('requested')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-full ${
                activeTab === 'requested'
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
              style={{
                backgroundColor: activeTab === 'requested' ? '#DC5F12' : 'transparent'
              }}
            >
              Requested Contracts ({requestedContracts.length})
            </button>
            <button
              onClick={() => setActiveTab('signed')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-full ${
                activeTab === 'signed'
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
              style={{
                backgroundColor: activeTab === 'signed' ? '#DC5F12' : 'transparent'
              }}
            >
              Signed Contracts ({signedContracts.length})
            </button>
            </div>
          </div>
        
        {/* Contracts Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#E7F2FF' }}>
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-600">
              <div>Property</div>
              <div>Agent</div>
              <div>Email</div>
              <div>Phone</div>
              <div>{activeTab === 'requested' ? 'Issue Date' : 'Signed Date'}</div>
              <div>Actions</div>
        </div>
      </div>

          {/* Table Body */}
        <div className="divide-y divide-gray-100">
            {currentContracts.map((contract) => (
              <div key={contract.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Property */}
                  <div className="flex items-center gap-3">
                    {activeTab === 'signed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {contract.property}
                    </span>
                  </div>
                  
                  {/* Agent */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{contract.agent}</span>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{contract.email}</span>
                    </div>
                  
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{contract.phone}</span>
                    </div>
                  
                  {/* Date */}
                    <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {getContractDate(contract)}
                      </span>
                    </div>
                    {getDueDays(contract) && (
                      <div className="mt-1">
                        <span className="text-xs text-red-600 font-medium">
                          Due in {getDueDays(contract)} days
                        </span>
                    </div>
                    )}
                    {activeTab === 'signed' && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Signed
                        </span>
                  </div>
                    )}
                </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {activeTab === 'requested' ? (
                      <button className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors" style={{ backgroundColor: '#136C9E' }}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Contract
                      </button>
                    ) : (
                      <>
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default TenantContracts;

