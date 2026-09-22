import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Search, Filter, Star, Trash2, Upload } from 'lucide-react';
import { useSignedContracts } from '../../../contexts/SignedContractsContext';
import ContractModal from '../../contract/ContractModal';
import signedContractsFirestoreService from '../../../services/signedContractsFirestoreService';

import { useAuth } from '../../../contexts/AuthContext';
import TenantPageHeader from '../ui/TenantPageHeader';
import BookViewingModal from '../../viewings/BookViewingModal';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import PlanUpgradeWall from '../PlanUpgradeWall';
import '../../../styles/tenantContracts.css';
import '../../../styles/tenantModals.css';

type ContractTab = 'all' | 'signed' | 'pending' | 'drafts';

function agentInitials(name?: string | null): string {
  const parts = (name || 'Agent').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AG';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

const TenantContracts: React.FC = () => {
  const navigate = useNavigate();
  const { plan, status } = useBillingStatus();
  const { signedContracts, isLoading, removeSignedContract } = useSignedContracts();
  const { isAuthenticated, user } = useAuth();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueTemplate, setIssueTemplate] = useState('Standard Assured Shorthold Tenancy (AST) — 12 Months');
  const [issueProperty, setIssueProperty] = useState('');
  const [issueTenant, setIssueTenant] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [issueStart, setIssueStart] = useState('');
  const [issueExpiry, setIssueExpiry] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ContractTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const ITEMS_PER_PAGE = 10;

  const displaySignedContracts = useMemo(() => {
    return signedContracts.map((c: any) => {
      const normalizedContract = {
        id: c.id,
        documentName: c.documentName || c.name || null,
        propertyName: c.propertyName || null,
        propertyAddress: c.propertyAddress || null,
        agentName: c.agentName || c.agent || null,
        agentEmail: c.agentEmail || null,
        tenantEmail: c.tenantEmail || null,
        email: c.email || c.tenantEmail || c.agentEmail || null,
        signedDate: c.signedDate || null,
        documentUrl: c.documentUrl || null,
        status: c.status || null,
        emailSent: c.emailSent || false
      };

      return normalizedContract;
    });
  }, [signedContracts]);

  const contractStats = {
    total: displaySignedContracts.length,
    signed: displaySignedContracts.length,
    requested: 0,
    expiring: 0
  };
  const summaryTotalContracts = isAuthenticated ? contractStats.total : 0;
  const summarySignedContracts = isAuthenticated ? contractStats.signed : 0;
  const summaryExpiringContracts = isAuthenticated ? contractStats.expiring : 0;
  const summaryPendingContracts = isAuthenticated ? contractStats.requested : 0;

  const filteredContracts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = displaySignedContracts;

    if (activeTab === 'pending' || activeTab === 'drafts') {
      list = [];
    }

    if (query) {
      list = list.filter((contract) => {
        const haystack = [
          contract.documentName,
          contract.propertyName,
          contract.propertyAddress,
          contract.agentName,
          contract.email,
          contract.agentEmail,
          contract.tenantEmail,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return [...list].sort((a, b) => {
      const aTime = a.signedDate ? new Date(a.signedDate).getTime() : 0;
      const bTime = b.signedDate ? new Date(b.signedDate).getTime() : 0;
      return sortNewestFirst ? bTime - aTime : aTime - bTime;
    });
  }, [displaySignedContracts, activeTab, searchQuery, sortNewestFirst]);

  const currentContracts = filteredContracts;

  const totalPages = Math.max(1, Math.ceil(currentContracts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedContracts = useMemo(() => {
    return currentContracts.slice(startIndex, endIndex);
  }, [currentContracts, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentContracts.length, activeTab, searchQuery]);

  if (!canAccessSection('tenant-contracts', plan, status)) {
    return (
      <PlanUpgradeWall
        featureName="Contracts"
        upgradeLabel={sectionUpgradeLabel('tenant-contracts')}
        segment="renters"
      />
    );
  }

  const getContractDate = (contract: any) => {
    return contract.signedDate;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleViewContract = async (contract: any) => {
    console.log('🔍 View button clicked for contract:', contract.id);
    let viewContract = contract;

    if (!viewContract.documentUrl) {
      console.log('🔍 Fetching full contract to get document URL...');
      const result = await signedContractsFirestoreService.getSignedContractById(contract.id);
      if (result.success && result.contract) {
        viewContract = result.contract;
      }
    }

    if ('documentUrl' in viewContract && viewContract.documentUrl) {
      if (viewContract.documentUrl.startsWith('blob:')) {
        console.log('🔍 Opening blob document URL:', viewContract.documentUrl);
        window.open(viewContract.documentUrl, '_blank');
      } else if (viewContract.documentUrl.startsWith('/')) {
        console.log('🔍 Mock contract document URL:', viewContract.documentUrl);
        alert(`This is a demo contract. In a real application, this would open: ${viewContract.documentUrl}\n\nTo test the actual view functionality, please sign a real contract document.`);
      } else {
        console.log('🔍 Opening document URL:', viewContract.documentUrl);
        window.open(viewContract.documentUrl, '_blank');
      }
    } else {
      console.log('❌ No document URL available for contract:', contract.id);
      alert('Document not available for viewing. This contract was created without a signed PDF document.');
    }
  };

  const handleDownloadContract = async (contract: any) => {
    console.log('🔍 Download button clicked for contract:', contract.id);
    let downloadContract = contract;

    if (!downloadContract.documentUrl) {
      console.log('🔍 Fetching full contract to get document URL...');
      const result = await signedContractsFirestoreService.getSignedContractById(contract.id);
      if (result.success && result.contract) {
        downloadContract = result.contract;
      }
    }

    if ('documentUrl' in downloadContract && downloadContract.documentUrl) {
      if (downloadContract.documentUrl.startsWith('blob:')) {
        console.log('🔍 Downloading blob document URL:', downloadContract.documentUrl);
        const link = document.createElement('a');
        link.href = downloadContract.documentUrl;
        link.download = `${('documentName' in downloadContract && downloadContract.documentName) ? downloadContract.documentName : 'signed-contract'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Download initiated for contract:', contract.id);
      } else if (downloadContract.documentUrl.startsWith('/')) {
        console.log('🔍 Mock contract document URL:', downloadContract.documentUrl);
        alert(`This is a demo contract. In a real application, this would download: ${downloadContract.documentUrl}\n\nTo test the actual download functionality, please sign a real contract document.`);
      } else {
        console.log('🔍 Downloading document URL:', downloadContract.documentUrl);
        const link = document.createElement('a');
        link.href = downloadContract.documentUrl;
        link.download = `${('documentName' in downloadContract && downloadContract.documentName) ? downloadContract.documentName : 'signed-contract'}.pdf`;
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

  const tabCounts = {
    all: summaryTotalContracts,
    signed: summarySignedContracts,
    pending: summaryPendingContracts,
    drafts: 0,
  };

  const renderActions = (contract: any) => (
    <>
      <button
        type="button"
        onClick={() => void handleViewContract(contract)}
        className="tn-ct-btn-view"
      >
        View PDF
      </button>
      <button
        type="button"
        onClick={() => void handleDownloadContract(contract)}
        className="tn-ct-icon-btn"
        aria-label="Download"
        title="Download"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => contract.id && handleDeleteContract(String(contract.id))}
        className="tn-ct-icon-btn danger"
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </>
  );

  const contractsHeader = (
    <TenantPageHeader
      title="Contracts"
      subtitle="Manage and track your property lease agreements and legal documents."
      primaryLabel="Request Viewing"
      primaryIcon={<Eye className="w-4 h-4" />}
      onPrimary={() => setIsBookViewingOpen(true)}
    />
  );

  const viewingModal = (
    <BookViewingModal
      open={isBookViewingOpen}
      onClose={() => setIsBookViewingOpen(false)}
      onSubmissionComplete={() => setIsBookViewingOpen(false)}
    />
  );

  if (isLoading) {
    return (
      <div className="tn-ct">
        {contractsHeader}
        <div className="tn-ct-body">
          <div className="tn-ct-kpi-grid">
            <div className="tn-ct-skel" />
            <div className="tn-ct-skel" />
            <div className="tn-ct-skel" />
            <div className="tn-ct-skel" />
          </div>
          <div className="tn-ct-skel tn-ct-skel-table" />
        </div>
        {viewingModal}
      </div>
    );
  }

  const showEmpty = currentContracts.length === 0;

  return (
    <div className="tn-ct">
      {contractsHeader}
      <div className="tn-ct-body">
      <section className="tn-ct-kpi-grid">
        <div className="tn-ct-kpi">
          <div className="tn-ct-kpi-top">
            <span className="tn-ct-kpi-label">Total Contracts</span>
            <span className="tn-ct-kpi-icon blue"><FileText className="w-3.5 h-3.5" /></span>
          </div>
          <div className="tn-ct-kpi-value">{summaryTotalContracts}</div>
        </div>
        <div className="tn-ct-kpi">
          <div className="tn-ct-kpi-top">
            <span className="tn-ct-kpi-label">Signed &amp; Active</span>
            <span className="tn-ct-kpi-icon emerald"><CheckCircle className="w-3.5 h-3.5" /></span>
          </div>
          <div className="tn-ct-kpi-value">{summarySignedContracts}</div>
        </div>
        <div className="tn-ct-kpi">
          <div className="tn-ct-kpi-top">
            <span className="tn-ct-kpi-label">Pending Signature</span>
            <span className="tn-ct-kpi-icon amber"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="tn-ct-kpi-value">{summaryPendingContracts}</div>
        </div>
        <div className="tn-ct-kpi">
          <div className="tn-ct-kpi-top">
            <span className="tn-ct-kpi-label">Expiring Soon (30d)</span>
            <span className="tn-ct-kpi-icon rose"><AlertTriangle className="w-3.5 h-3.5" /></span>
          </div>
          <div className="tn-ct-kpi-value">{summaryExpiringContracts}</div>
        </div>
      </section>

      <div className="tn-ct-toolbar">
        <div className="tn-ct-tabs">
          {([
            { id: 'all', label: 'All' },
            { id: 'signed', label: 'Signed' },
            { id: 'pending', label: 'Pending' },
            { id: 'drafts', label: 'Drafts' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tn-ct-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="tn-ct-tab-count">{tabCounts[tab.id]}</span>
            </button>
          ))}
        </div>

        <div className="tn-ct-toolbar-actions">
          <div className="tn-ct-search">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Contracts..."
            />
          </div>
          <button
            type="button"
            className={`tn-ct-ghost${searchQuery ? ' is-active' : ''}`}
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button
            type="button"
            className={`tn-ct-ghost${!sortNewestFirst ? ' is-active' : ''}`}
            onClick={() => setSortNewestFirst((prev) => !prev)}
            title={sortNewestFirst ? 'Sorted newest first' : 'Sorted oldest first'}
          >
            <Star className="w-3.5 h-3.5" />
            Sort
          </button>
        </div>
      </div>

      {showEmpty ? (
        <div className="tn-ct-empty">
          <div className="tn-ct-empty-icon">
            <Eye className="w-6 h-6" />
          </div>
          <h2>No contracts or agreements yet</h2>
          <p>
            {activeTab === 'pending' || activeTab === 'drafts'
              ? 'There are no contracts in this view yet. Signed agreements will appear under All and Signed.'
              : searchQuery
                ? 'No contracts match your search. Try a different name, agent, or email.'
                : 'Once you generate or receive an agreement, it will appear here. Track e-signatures, download PDF copies, and receive automated renewal reminders.'}
          </p>
          {!searchQuery && activeTab !== 'pending' && activeTab !== 'drafts' && (
            <>
              <div className="tn-ct-steps">
                <span className="tn-ct-step"><span className="tn-ct-step-num">1</span>Select Template</span>
                <span className="tn-ct-step-arrow">→</span>
                <span className="tn-ct-step"><span className="tn-ct-step-num">2</span>Add Parties</span>
                <span className="tn-ct-step-arrow">→</span>
                <span className="tn-ct-step"><span className="tn-ct-step-num">3</span>E Sign Digitally</span>
                <span className="tn-ct-step-arrow">→</span>
                <span className="tn-ct-step"><span className="tn-ct-step-num">4</span>Manage &amp; Renew</span>
              </div>
              <div className="tn-ct-empty-actions">
                <button type="button" className="tn-ct-btn-primary" onClick={() => {
                  setIssueTenant(user?.name || '');
                  setIssueEmail(user?.email || '');
                  setIsIssueModalOpen(true);
                }}>
                  <Upload className="w-4 h-4" />
                  Upload First File
                </button>
                <button
                  type="button"
                  className="tn-ct-btn-outline"
                  onClick={() => navigate('/dashboard/tenant-referencing')}
                >
                  <span>View Referencing Passport</span>
                  <span>→</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="tn-ct-table-wrap">
          <div className="tn-ct-table-scroll">
            <table className="tn-ct-table">
              <thead>
                <tr>
                  <th>Property / Lease Name</th>
                  <th>Counterparty / Agent</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.map((contract, index) => (
                  <tr key={contract.id || index}>
                    <td className="tn-ct-name">
                      {contract.documentName || contract.propertyName || 'Contract Document'}
                    </td>
                    <td>
                      <div className="tn-ct-party">
                        <span className="tn-ct-avatar">{agentInitials(contract.agentName)}</span>
                        <span className="tn-ct-party-name">{contract.agentName || 'Agent Name'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tn-ct-status is-signed">
                        <span className="dot" />
                        Signed
                      </span>
                    </td>
                    <td className="tn-ct-date">{formatDate(getContractDate(contract))}</td>
                    <td className="tn-ct-date">N/A</td>
                    <td>
                      <div className="tn-ct-actions">{renderActions(contract)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tn-ct-cards">
            {paginatedContracts.map((contract, index) => (
              <div key={contract.id || `m-${index}`} className="tn-ct-card">
                <div className="tn-ct-card-top">
                  <div className="tn-ct-avatar">{agentInitials(contract.agentName)}</div>
                  <div>
                    <h3>{contract.documentName || contract.propertyName || 'Contract Document'}</h3>
                    <div className="tn-ct-card-meta">{contract.agentName || 'Agent Name'}</div>
                  </div>
                </div>
                <span className="tn-ct-status is-signed"><span className="dot" />Signed</span>
                <div className="tn-ct-card-meta" style={{ marginTop: 10 }}>
                  Signed {formatDate(getContractDate(contract))}
                </div>
                <div className="tn-ct-card-actions">{renderActions(contract)}</div>
              </div>
            ))}
          </div>

          {currentContracts.length > ITEMS_PER_PAGE && (
            <div className="tn-ct-footer">
              <div>
                Showing {startIndex + 1} to {Math.min(endIndex, currentContracts.length)} of {currentContracts.length} contracts
              </div>
              <div className="tn-ct-pager">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        className={currentPage === page ? 'is-current' : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />
      {isIssueModalOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsIssueModalOpen(false); }}>
          <div className="tn-modal tn-modal-lg" role="dialog" aria-labelledby="tn-issue-title">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico orange">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 id="tn-issue-title">Issue Property Agreement</h3>
                  <p>Draft AST or commercial tenancy with e-signature relay</p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsIssueModalOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <label className="tn-modal-label">
                Contract Template
                <select value={issueTemplate} onChange={(e) => setIssueTemplate(e.target.value)}>
                  <option>Standard Assured Shorthold Tenancy (AST) — 12 Months</option>
                  <option>Commercial Lease Agreement — 3 Years</option>
                  <option>Guarantor Deed & Surety Agreement</option>
                </select>
              </label>
              <label className="tn-modal-label">
                Property Name / Unit
                <input
                  type="text"
                  value={issueProperty}
                  onChange={(e) => setIssueProperty(e.target.value)}
                  placeholder="e.g. Flat 4B, 22 Meadow Lane"
                />
              </label>
              <div className="tn-modal-grid2">
                <label className="tn-modal-label">
                  Counterparty Tenant
                  <input
                    type="text"
                    value={issueTenant}
                    onChange={(e) => setIssueTenant(e.target.value)}
                    placeholder="e.g. Sarah Jones"
                  />
                </label>
                <label className="tn-modal-label">
                  Tenant Email
                  <input
                    type="email"
                    value={issueEmail}
                    onChange={(e) => setIssueEmail(e.target.value)}
                    placeholder="e.g. sarah.j@gmail.com"
                  />
                </label>
              </div>
              <div className="tn-modal-grid2">
                <label className="tn-modal-label">
                  Start Date
                  <input type="date" value={issueStart} onChange={(e) => setIssueStart(e.target.value)} />
                </label>
                <label className="tn-modal-label">
                  Expiry Date
                  <input type="date" value={issueExpiry} onChange={(e) => setIssueExpiry(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-cancel" onClick={() => setIsIssueModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="tn-modal-primary"
                onClick={() => {
                  setIsIssueModalOpen(false);
                  setIsContractModalOpen(true);
                }}
              >
                Generate &amp; Dispatch Contract
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingModal}
    </div>
  );
};

export default TenantContracts;
