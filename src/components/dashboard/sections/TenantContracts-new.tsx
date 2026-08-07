import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Eye, Calendar, CheckCircle, Clock, AlertTriangle, User, Mail, Phone, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSignedContracts } from '../../../contexts/SignedContractsContext';
import ContractModal from '../../contract/ContractModal';

import { useAuth } from '../../../contexts/AuthContext';
import { useIsMobile } from '../ui/use-mobile';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import PlanUpgradeWall from '../PlanUpgradeWall';

const TenantContracts: React.FC = () => {
  const { plan, status } = useBillingStatus();
  if (!canAccessSection('tenant-contracts', plan, status)) {
    return (
      <PlanUpgradeWall
        featureName="Contracts"
        upgradeLabel={sectionUpgradeLabel('tenant-contracts')}
        segment="renters"
      />
    );
  }
  const { signedContracts, isLoading, clearAllContracts, addSignedContract, removeSignedContract } = useSignedContracts();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Use SignedContractsContext directly to support real-time updates and remove reload flickers
  const displaySignedContracts = useMemo(() => {
    return signedContracts.map((c: any) => {
      // Normalize the contract structure to ensure all fields are properly mapped
      const normalizedContract = {
        id: c.id,
        documentName: c.documentName || c.name || null, // Contract file name
        propertyName: c.propertyName || null,
        propertyAddress: c.propertyAddress || null,
        agentName: c.agentName || c.agent || null, // Agent name, NOT document name
        agentEmail: c.agentEmail || null,
        tenantEmail: c.tenantEmail || null,
        email: c.email || c.tenantEmail || c.agentEmail || null,
        signedDate: c.signedDate || null,
        documentUrl: c.documentUrl || null,
        documentBase64: c.documentBase64 || null,
        status: c.status || null,
        emailSent: c.emailSent || false
      };
      
      // If no usable documentUrl but we have a base64 data URL, build a blob URL on the fly
      if ((!normalizedContract.documentUrl || normalizedContract.documentUrl.startsWith('/')) && normalizedContract.documentBase64 && typeof normalizedContract.documentBase64 === 'string' && normalizedContract.documentBase64.startsWith('data:application/pdf;base64,')) {
        try {
          // Convert data URL to Blob URL
          const res = fetch(normalizedContract.documentBase64);
          // Note: fetch on data URL returns a resolved promise; convert to blob lazily
          // We'll attach a lazy getter to avoid blocking render
          (res as any).then?.(async (r: Response) => {
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            normalizedContract.documentUrl = url;
          });
        } catch (e) {
          console.warn('Failed to convert base64 to blob url for contract', normalizedContract.id, e);
        }
      }
      return normalizedContract;
    });
  }, [signedContracts]);

  // Contract statistics
  const contractStats = {
    total: displaySignedContracts.length, // Use display contracts for stats
    signed: displaySignedContracts.length, // Use display contracts for stats
    requested: 0, // No requested contracts
    expiring: 0 // No expiring contracts (since we removed mock data)
  };
  const summaryTotalContracts = isAuthenticated ? contractStats.total : 0;
  const summarySignedContracts = isAuthenticated ? contractStats.signed : 0;
  const summaryExpiringContracts = isAuthenticated ? contractStats.expiring : 0;

  // Default to signed tab since requested is disabled
  const [activeTab, setActiveTab] = useState('signed');

  // Always show signed contracts
  const currentContracts = displaySignedContracts;

  // Pagination logic
  const totalPages = Math.ceil(currentContracts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedContracts = useMemo(() => {
    return currentContracts.slice(startIndex, endIndex);
  }, [currentContracts, startIndex, endIndex]);

  // Reset pagination when contracts change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentContracts.length]);

  // Get contract date based on tab
  const getContractDate = (contract: any) => {
    return contract.signedDate; // Always return signedDate
  };

  // Handle contract viewing
  const handleViewContract = (contract: any) => {
    console.log('🔍 View button clicked for contract:', contract.id);
    console.log('🔍 Contract details:', contract);
    if ('documentUrl' in contract && contract.documentUrl) {
      if (contract.documentUrl.startsWith('blob:')) {
        console.log('🔍 Opening blob document URL:', contract.documentUrl);
        window.open(contract.documentUrl, '_blank');
      } else if (contract.documentUrl.startsWith('/')) {
        console.log('🔍 Mock contract document URL:', contract.documentUrl);
        alert(`This is a demo contract. In a real application, this would open: ${contract.documentUrl}\n\nTo test the actual view functionality, please sign a real contract document.`);
      } else {
        console.log('🔍 Opening document URL:', contract.documentUrl);
        window.open(contract.documentUrl, '_blank');
      }
    } else {
      console.log('❌ No document URL available for contract:', contract.id);
      alert('Document not available for viewing. This contract was created without a signed PDF document.');
    }
  };

  // Handle contract downloading
  const handleDownloadContract = (contract: any) => {
    console.log('🔍 Download button clicked for contract:', contract.id);
    console.log('🔍 Contract details:', contract);
    if ('documentUrl' in contract && contract.documentUrl) {
      if (contract.documentUrl.startsWith('blob:')) {
        console.log('🔍 Downloading blob document URL:', contract.documentUrl);
        const link = document.createElement('a');
        link.href = contract.documentUrl;
        link.download = `${('documentName' in contract && contract.documentName) ? contract.documentName : 'signed-contract'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Download initiated for contract:', contract.id);
      } else if (contract.documentUrl.startsWith('/')) {
        console.log('🔍 Mock contract document URL:', contract.documentUrl);
        alert(`This is a demo contract. In a real application, this would download: ${contract.documentUrl}\n\nTo test the actual download functionality, please sign a real contract document.`);
      } else {
        console.log('🔍 Downloading document URL:', contract.documentUrl);
        const link = document.createElement('a');
        link.href = contract.documentUrl;
        link.download = `${('documentName' in contract && contract.documentName) ? contract.documentName : 'signed-contract'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Download initiated for contract:', contract.id);
      }
    } else {
      console.log('❌ No document URL available for contract:', contract.id);
      alert('Document not available for download. This contract was created without a signed PDF document.');
    }
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} mt-4`}>
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          Showing {startIndex + 1} to {Math.min(endIndex, currentContracts.length)} of {currentContracts.length} contracts
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}
          >
            <ChevronLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className={isMobile ? '' : 'hidden sm:inline'}>Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`${isMobile ? 'min-w-[32px] h-8 text-xs' : 'min-w-[40px] h-9 text-sm'} px-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className={`${isMobile ? 'px-1' : 'px-2'} text-gray-500`}>
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}
          >
            <span className={isMobile ? '' : 'hidden sm:inline'}>Next</span>
            <ChevronRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </button>
        </div>
      </div>
    );
  };

  // Handle contract deletion
  const handleDeleteContract = async (contractId: string) => {
    try {
      console.log('🔍 Delete button clicked for contract:', contractId);
      if (window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
        const result = await removeSignedContract(contractId);
        
        if (result.success) {
          console.log('✅ Contract deleted successfully:', contractId);
        } else {
          console.error('❌ Failed to delete contract:', result.error);
          alert('Failed to delete contract. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error deleting contract:', error);
      alert('Failed to delete contract. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isMobile ? 'h-48' : 'h-64'}`}>
        <div className={`animate-spin rounded-full ${isMobile ? 'h-6 w-6' : 'h-8 w-8'} border-b-2 border-gray-900`}></div>
        <span className={`${isMobile ? 'ml-2 text-sm' : 'ml-2'} text-gray-600`}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-4 px-4' : 'pb-8'}`}>
      {/* Header */}
      <div className={`flex items-start ${isMobile ? 'gap-3' : 'justify-between'} ${isMobile ? 'pt-4' : 'pt-6'}`}>
        <div className={`${isMobile ? 'flex-1 min-w-0' : ''}`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Contracts</h2>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'mt-1 break-words' : ''}`}>Manage your property contracts and agreements</p>
        </div>
        <button
          onClick={() => setIsContractModalOpen(true)}
          className={`${isMobile ? 'px-3 py-2 text-xs whitespace-nowrap flex-shrink-0' : 'px-4 py-2'} bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ${isMobile ? 'min-h-[2.5rem]' : ''}`}
        >
          {isMobile ? 'Go To Contract' : 'Go To Contract Page'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
        {/* Total Contracts */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Total Contracts</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryTotalContracts}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>All contracts</p>
          </div>
        </div>

        {/* Signed Contracts */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Signed</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-green-100 rounded-lg flex items-center justify-center`}>
              <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summarySignedContracts}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Completed</p>
          </div>
        </div>

        {/* Requested Contracts - disabled */}
        {false && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Requested</h3>
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
        )}

        {/* Expiring Soon */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Expiring Soon</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-red-100 rounded-lg flex items-center justify-center`}>
              <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryExpiringContracts}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Within 30 days</p>
          </div>
        </div>
      </div>

      {/* Alert Message - disabled for requested feature */}
      {false && (
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
      )}

      {/* Contract Modal */}
      <ContractModal 
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />

      {/* Tabs Section - requested tab disabled */}
      <div>
        <div className={isMobile ? 'mb-4' : 'mb-6'}>
          <div className={`bg-white rounded-full border border-gray-100 p-1 ${isMobile ? 'w-full' : 'inline-flex'}`}>
            <button
              className={`${isMobile ? 'w-full px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} font-medium transition-colors rounded-full text-white`}
              style={{ backgroundColor: '#DC5F12' }}
              disabled
            >
              Signed Contracts ({displaySignedContracts.length}) {signedContracts.length > 0 ? '📄' : '📝'}
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        {!isMobile && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#E7F2FF' }}>
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600">
                <div>Name</div>
                <div>Agent</div>
                <div>Email</div>
                <div>Signed Date</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {paginatedContracts.map((contract, index) => (
                <div key={contract.id || index} className="grid grid-cols-5 gap-4 items-start px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Name (Contract File Name) */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 break-words overflow-wrap-anywhere">
                        {contract.documentName || contract.propertyName || 'Contract Document'}
                      </p>
                    </div>
                  </div>

                  {/* Agent */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contract.agentName || 'Agent Name'}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{contract.email || contract.tenantEmail || contract.agentEmail || 'No email'}</span>
                  </div>

                  {/* Signed Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {getContractDate(contract) ? new Date(getContractDate(contract)).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleViewContract(contract)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      aria-label="View"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadContract(contract)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      aria-label="Download"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => contract.id && handleDeleteContract(String(contract.id))}
                      className="inline-flex items-center p-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls for Desktop */}
        {!isMobile && <PaginationControls />}

        {/* Mobile Card View */}
        {isMobile && (
          <div className="space-y-4">
            {paginatedContracts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">No Contracts</h3>
                <p className="text-sm text-gray-600">You don't have any signed contracts yet.</p>
              </div>
            ) : (
              paginatedContracts.map((contract, index) => (
                <div 
                  key={contract.id || index} 
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                        {contract.documentName || contract.propertyName || 'Contract Document'}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-600 truncate">
                          {contract.agentName || 'Agent Name'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500">Email:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-700 truncate">
                          {contract.email || contract.tenantEmail || contract.agentEmail || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Signed Date:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs font-medium text-gray-900">
                          {getContractDate(contract) ? new Date(getContractDate(contract)).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleViewContract(contract)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadContract(contract)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => contract.id && handleDeleteContract(String(contract.id))}
                      className="inline-flex items-center justify-center p-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination Controls for Mobile */}
        {isMobile && <PaginationControls />}
      </div>
    </div>
  );
};

export default TenantContracts;