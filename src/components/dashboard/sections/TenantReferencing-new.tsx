import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Link2,
  List,
  Share2,
  Shield,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { firestoreService } from '../../../services/firestoreService';
import ReferencingModal from '../../ReferencingModalLegacy';
import SendReferencingModal from '../../referencing/SendReferencingModal';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import PlanUpgradeWall from '../PlanUpgradeWall';
import TenantPageHeader from '../ui/TenantPageHeader';
import BookViewingModal from '../../viewings/BookViewingModal';
import { toast } from 'react-hot-toast';
import '../../../styles/tenantReferencing.css';
import '../../../styles/tenantModals.css';

interface FormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    dateOfBirthError?: string;
    isBritish: boolean;
    nationality: string;
    identityProof?: any;
  };
  employment: {
    employmentStatus: string;
    companyDetails: string;
    lengthOfEmployment: string;
    jobPosition: string;
    referenceFullName: string;
    referenceEmail: string;
    referencePhone: string;
    proofType: string;
    proofDocument?: any;
  };
  residential: {
    currentAddress: string;
    durationAtCurrentAddress: string;
    previousAddress: string;
    durationAtPreviousAddress: string;
    reasonForLeaving: string;
    alreadyHavePropertyAddress: string;
    propertyAddress: string;
    proofType: string;
    proofDocument?: any;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument?: any;
    useOpenBanking: boolean;
    isConnectedToOpenBanking: boolean;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    identityDocument?: any;
  };
}

interface ReferencingShareItem {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientRole: 'landlord' | 'agent';
  agencyName?: string;
  propertyAddress?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

function shareInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  return ((parts[0][0] || '') + (parts[1]?.[0] || parts[0][1] || '')).toUpperCase();
}

function formatShareDate(value?: string) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(value?: string | null) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function documentStatus(doc: any): string {
  if (!doc) return 'Not uploaded';
  if (typeof doc === 'string') return doc.trim() ? 'Uploaded' : 'Not uploaded';
  if (typeof doc === 'object') {
    return doc.name || ((doc.url || doc.dataUrl || doc.downloadUrl || doc.storagePath) ? 'Uploaded' : 'Not uploaded');
  }
  return 'Not uploaded';
}

const TenantReferencing: React.FC = () => {
  const { plan, status, loading: billingLoading } = useBillingStatus();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({});
  const [shares, setShares] = useState<ReferencingShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [previewPillar, setPreviewPillar] = useState<{ title: string; step: number; complete: boolean; description: string } | null>(null);
  const [referencingStep, setReferencingStep] = useState(1);
  const [singleSectionOnly, setSingleSectionOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shared'>('details');

  const loadReferencingData = async () => {
    const userId = user?.id || (isAuthenticated ? (user as any)?.uid || 'current_user' : null);
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const propertyId = `general_${userId}`;
      const [formResult, sharesResult] = await Promise.all([
        firestoreService.getReferencingForm(userId, propertyId),
        firestoreService.getReferencingShares(userId)
      ]);

      if (formResult.success && formResult.data) {
        setFormData(formResult.data.formData as any);
        setStepStatus(formResult.data.stepStatus || {});
      }

      if (sharesResult.success && sharesResult.data) {
        setShares(sharesResult.data);
      }
    } catch (err) {
      console.error('Error loading referencing data:', err);
      setError('Failed to load referencing details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!authLoading) {
      loadReferencingData();
    } else {
      const timer = setTimeout(() => {
        if (active) setLoading(false);
      }, 1000);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [user?.id, authLoading]);

  const isFieldComplete = (section: keyof FormData, field: string): boolean => {
    if (!formData) return false;
    const sectionData = formData[section];
    if (!sectionData) return false;
    const value = (sectionData as any)[field];
    return value && value !== '' && value !== null && value !== undefined;
  };

  const isDocumentUploaded = (section: keyof FormData, documentField: string): boolean => {
    if (!formData) return false;
    const sectionData = formData[section];
    if (!sectionData) return false;
    const document = (sectionData as any)[documentField];
    if (!document) return false;
    if (typeof document === 'string') return document.trim().length > 0;
    if (typeof document === 'object') {
      return !!(
        document.url ||
        document.dataUrl ||
        document.downloadUrl ||
        document.storagePath ||
        document.name
      );
    }
    return false;
  };

  const isSectionCompleted = (step: number): boolean => {
    if (!formData) return false;
    if (stepStatus[step] === 'complete') return true;

    switch (step) {
      case 1:
        return !!(
          formData.identity?.firstName &&
          formData.identity?.lastName &&
          formData.identity?.email &&
          (formData.identity?.identityProof || formData.identity?.dateOfBirth)
        );
      case 2:
        return !!(
          formData.employment?.employmentStatus &&
          (['Unemployed', 'Retired', 'Student'].includes(formData.employment?.employmentStatus) ||
            formData.employment?.companyDetails ||
            formData.employment?.jobPosition)
        );
      case 3:
        return !!(formData.residential?.currentAddress && formData.residential?.durationAtCurrentAddress);
      case 4:
        return !!(
          formData.financial?.monthlyIncome ||
          formData.financial?.proofOfIncomeDocument ||
          formData.financial?.useOpenBanking
        );
      case 5:
        return (
          (formData as any)?.guarantor?.verifiedViaLink ||
          (formData as any)?.guarantorInvitation?.status === 'completed' ||
          !!(formData.guarantor?.firstName && formData.guarantor?.lastName && formData.guarantor?.email)
        );
      default:
        return false;
    }
  };

  const calculateProgress = () => {
    if (!formData) return { overall: 0, completed: 0, pending: 5, documents: 0 };

    const steps = [1, 2, 3, 4, 5];
    const completedSteps = steps.filter(step => isSectionCompleted(step)).length;
    const totalSteps = 5;

    const documents = [
      formData.identity?.identityProof,
      formData.employment?.proofDocument,
      formData.residential?.proofDocument,
      formData.financial?.proofOfIncomeDocument,
      formData.guarantor?.identityDocument
    ].filter(doc => {
      if (!doc) return false;
      if (typeof doc === 'string') return doc.trim().length > 0;
      if (typeof doc === 'object') {
        return !!(doc.name || doc.url || doc.dataUrl || doc.downloadUrl || doc.storagePath);
      }
      return false;
    }).length;

    return {
      overall: Math.round((completedSteps / totalSteps) * 100),
      completed: completedSteps,
      pending: totalSteps - completedSteps,
      documents
    };
  };

  const progress = calculateProgress();
  const summaryOverallProgress = isAuthenticated ? progress.overall : 0;
  const summaryCompleted = isAuthenticated ? progress.completed : 0;

  const hasStartedReferencing = () => {
    if (!formData) return false;

    const hasEmployment = !!(formData.employment?.employmentStatus || formData.employment?.companyDetails || formData.employment?.jobPosition);
    const hasResidential = !!(formData.residential?.currentAddress || formData.residential?.durationAtCurrentAddress);
    const hasFinancial = !!(formData.financial?.monthlyIncome || formData.financial?.proofOfIncomeType);
    const hasGuarantor = !!(formData.guarantor?.firstName && formData.guarantor.firstName !== '' || (formData as any).guarantorInvitation?.status);
    const hasIdentityDocs = !!(formData.identity?.dateOfBirth || formData.identity?.identityProof || formData.identity?.phoneNumber);

    return hasEmployment || hasResidential || hasFinancial || hasGuarantor || hasIdentityDocs || summaryOverallProgress > 0;
  };

  const openSectionModal = (step: number) => {
    setReferencingStep(step);
    setSingleSectionOnly(true);
    setIsReferencingModalOpen(true);
  };

  const openFullPassportModal = (step: number = 1) => {
    setReferencingStep(step);
    setSingleSectionOnly(false);
    setIsReferencingModalOpen(true);
  };

  const closeReferencingModal = () => {
    setIsReferencingModalOpen(false);
    loadReferencingData();
  };

  const handleStartPassport = async () => {
    const userId = user?.id || (isAuthenticated ? (user as any)?.uid : null);
    if (!userId) {
      toast.error("You must be logged in to start a referencing passport.");
      return;
    }

    setLoading(true);
    try {
      const initialData: FormData = {
        identity: {
          firstName: user?.givenName || user?.name?.split(' ')[0] || '',
          lastName: user?.familyName || user?.name?.split(' ').slice(1).join(' ') || '',
          email: user?.email || '',
          phoneNumber: '',
          dateOfBirth: '',
          isBritish: true,
          nationality: 'British',
        },
        employment: {
          employmentStatus: '',
          companyDetails: '',
          lengthOfEmployment: '',
          jobPosition: '',
          referenceFullName: '',
          referenceEmail: '',
          referencePhone: '',
          proofType: '',
        },
        residential: {
          currentAddress: '',
          durationAtCurrentAddress: '',
          previousAddress: '',
          durationAtPreviousAddress: '',
          reasonForLeaving: '',
          alreadyHavePropertyAddress: '',
          propertyAddress: '',
          proofType: '',
        },
        financial: {
          monthlyIncome: '',
          proofOfIncomeType: '',
          useOpenBanking: false,
          isConnectedToOpenBanking: false,
        },
        guarantor: {
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          address: '',
        }
      };

      const propertyId = `general_${userId}`;
      await firestoreService.saveReferencingForm(
        userId,
        propertyId,
        initialData as any,
        1,
        {}
      );

      setFormData(initialData);
      setStepStatus({});
      toast.success("Referencing passport started!");
      openFullPassportModal(1);
    } catch (err) {
      console.error("Error starting passport:", err);
      toast.error("Failed to start passport. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async (shareId: string, recipientName: string) => {
    if (!window.confirm(`Revoke access and delete referencing share for ${recipientName}?`)) {
      return;
    }

    if (!user?.id) return;

    try {
      await firestoreService.deleteReferencingShare(user.id, shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
      toast.success(`Access revoked for ${recipientName}`);
    } catch (err) {
      toast.error('Failed to revoke access. Please try again.');
    }
  };

  const handleGenerateLink = () => {
    if (summaryOverallProgress < 75) {
      toast.error('Your passport must be at least 75% complete before you can share it.');
      return;
    }
    setIsSendModalOpen(true);
  };

  const handleDownloadReport = () => {
    const tenantName =
      user?.name ||
      [formData?.identity?.firstName, formData?.identity?.lastName].filter(Boolean).join(' ') ||
      'Tenant';
    const generatedAt = new Date().toLocaleString('en-GB');
    const pillarRows = [
      { title: 'Identity Architecture', complete: isSectionCompleted(1), notes: formData?.identity?.email || formData?.identity?.nationality || '' },
      { title: 'Employment', complete: isSectionCompleted(2), notes: [formData?.employment?.jobPosition, formData?.employment?.companyDetails].filter(Boolean).join(' at ') },
      { title: 'Residential History', complete: isSectionCompleted(3), notes: formData?.residential?.currentAddress || '' },
      { title: 'Financial Integrity', complete: isSectionCompleted(4), notes: formData?.financial?.monthlyIncome ? `Monthly income: ${formData.financial.monthlyIncome}` : '' },
      { title: 'Guarantor', complete: isSectionCompleted(5), notes: [formData?.guarantor?.firstName, formData?.guarantor?.lastName].filter(Boolean).join(' ') },
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Referencing Report — ${escapeHtml(tenantName)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; max-width: 760px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #64748b; font-size: 13px; }
    h2 { font-size: 15px; margin: 28px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { color: #64748b; font-weight: 600; }
    .ok { color: #059669; font-weight: 700; }
    .wait { color: #d97706; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Referencing Report</h1>
  <p class="muted">Generated ${escapeHtml(generatedAt)} · Overall progress ${summaryOverallProgress}%</p>
  <h2>Applicant</h2>
  <table>
    <tr><th>Name</th><td>${escapeHtml(tenantName)}</td></tr>
    <tr><th>Email</th><td>${escapeHtml(formData?.identity?.email || user?.email || 'Not provided')}</td></tr>
    <tr><th>Phone</th><td>${escapeHtml(formData?.identity?.phoneNumber || 'Not provided')}</td></tr>
    <tr><th>Date of birth</th><td>${escapeHtml(formData?.identity?.dateOfBirth || 'Not provided')}</td></tr>
    <tr><th>Nationality</th><td>${escapeHtml(formData?.identity?.nationality || (formData?.identity?.isBritish ? 'British' : 'Not provided'))}</td></tr>
  </table>
  <h2>Verification pillars</h2>
  <table>
    <tr><th>Pillar</th><th>Status</th><th>Summary</th></tr>
    ${pillarRows.map((row) => `<tr><td>${escapeHtml(row.title)}</td><td class="${row.complete ? 'ok' : 'wait'}">${row.complete ? 'Verified' : 'Incomplete'}</td><td>${escapeHtml(row.notes || '—')}</td></tr>`).join('')}
  </table>
  <h2>Supporting documents</h2>
  <table>
    <tr><th>Identity</th><td>${escapeHtml(documentStatus(formData?.identity?.identityProof))}</td></tr>
    <tr><th>Employment</th><td>${escapeHtml(documentStatus(formData?.employment?.proofDocument))}</td></tr>
    <tr><th>Residential</th><td>${escapeHtml(documentStatus(formData?.residential?.proofDocument))}</td></tr>
    <tr><th>Financial</th><td>${escapeHtml(documentStatus(formData?.financial?.proofOfIncomeDocument))}</td></tr>
    <tr><th>Guarantor</th><td>${escapeHtml(documentStatus(formData?.guarantor?.identityDocument))}</td></tr>
  </table>
  <h2>Shared access</h2>
  ${shares.length === 0 ? '<p class="muted">No passports shared yet.</p>' : `<table><tr><th>Recipient</th><th>Role</th><th>Shared</th><th>Status</th></tr>${shares.map((share) => `<tr><td>${escapeHtml(share.recipientName)}<br/><span class="muted">${escapeHtml(share.recipientEmail)}</span></td><td>${share.recipientRole === 'agent' ? 'Letting Agent' : 'Landlord'}</td><td>${escapeHtml(formatShareDate(share.createdAt))}</td><td>${escapeHtml(share.status || 'Delivered')}</td></tr>`).join('')}</table>`}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referencing-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Referencing report downloaded');
  };

  const started = hasStartedReferencing();

  const referencingHeader = (
    <TenantPageHeader
      title="Referencing"
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

  if (billingLoading) {
    return (
      <div className="tn-ref">
        {referencingHeader}
        <div className="tn-ref-body">
          <div className="tn-ref-kpi-grid">
            <div className="tn-ref-skel" style={{ gridColumn: 'span 1', height: 176 }} />
            <div className="tn-ref-skel" style={{ height: 176 }} />
            <div className="tn-ref-skel" style={{ height: 176 }} />
          </div>
        </div>
        {viewingModal}
      </div>
    );
  }

  if (!canAccessSection('tenant-referencing', plan, status)) {
    return (
      <PlanUpgradeWall
        featureName="Referencing toolkit"
        upgradeLabel={sectionUpgradeLabel('tenant-referencing')}
        segment="renters"
      />
    );
  }

  if (loading) {
    return (
      <div className="tn-ref">
        {referencingHeader}
        <div className="tn-ref-body">
          <div className="tn-ref-kpi-grid">
            <div className="tn-ref-skel" style={{ height: 176 }} />
            <div className="tn-ref-skel" style={{ height: 176 }} />
            <div className="tn-ref-skel" style={{ height: 176 }} />
          </div>
        </div>
        {viewingModal}
      </div>
    );
  }

  if (error) {
    return (
      <div className="tn-ref">
        {referencingHeader}
        <div className="tn-ref-body">
          <div className="tn-ref-empty">
            <div className="tn-ref-empty-icon">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2>Unable to load referencing</h2>
            <p>{error}</p>
          </div>
        </div>
        {viewingModal}
      </div>
    );
  }

  const healthState = summaryOverallProgress === 100 ? 'verified' : summaryOverallProgress > 0 ? 'partial' : 'empty';
  const healthLabel = healthState === 'verified' ? 'Fully Verified' : healthState === 'partial' ? 'In Progress' : 'Not Started';
  const healthDesc = healthState === 'verified'
    ? 'All 5 architecture pillars have been verified. Your digital passport is ready for deployment.'
    : healthState === 'partial'
      ? `${summaryCompleted} of 5 architecture pillars complete. Continue verification to share your passport.`
      : 'No referencing checks completed yet. Begin identity and employment verification to proceed.';

  const pillars = [
    {
      step: 1,
      title: 'Identity Architecture',
      idLabel: 'ID: TR-IDENT',
      complete: isSectionCompleted(1),
      description: isDocumentUploaded('identity', 'identityProof')
        ? 'Identity document uploaded and personal details captured.'
        : isFieldComplete('identity', 'firstName')
          ? 'Personal details started. Upload identity proof to complete this pillar.'
          : 'Biometric passport validation and live session face-match.',
    },
    {
      step: 3,
      title: 'Residential History',
      idLabel: 'ID: TR-RESID',
      complete: isSectionCompleted(3),
      description: isFieldComplete('residential', 'currentAddress')
        ? `Current address recorded${isDocumentUploaded('residential', 'proofDocument') ? ' with supporting documents.' : '. Add proof of address to finish.'}`
        : 'Electoral roll and historical utility records for the last 36 months.',
    },
    {
      step: 4,
      title: 'Financial Integrity',
      idLabel: 'ID: TR-FINAN',
      complete: isSectionCompleted(4),
      description: isFieldComplete('financial', 'monthlyIncome')
        ? `Monthly income recorded${formData?.financial?.useOpenBanking ? ' with Open Banking connected.' : '.'}`
        : 'Income confirmation and Open Banking connection.',
    },
    {
      step: 5,
      title: 'Guarantor',
      idLabel: 'ID: TR-GUAR',
      complete: isSectionCompleted(5),
      description: (formData as any)?.guarantorInvitation?.status === 'invited'
        ? `Invite sent to ${(formData as any)?.guarantorInvitation?.guarantorEmail || 'guarantor'}. Awaiting response.`
        : isSectionCompleted(5)
          ? 'Guarantor details verified.'
          : 'Optional. Add guarantor details or send an invitation.',
    },
    {
      step: 2,
      title: 'Employment',
      idLabel: 'ID: TR-EMPLOY',
      complete: isSectionCompleted(2),
      description: isFieldComplete('employment', 'companyDetails') || isFieldComplete('employment', 'jobPosition')
        ? `${formData?.employment?.jobPosition || 'Role'} at ${formData?.employment?.companyDetails || 'employer'} recorded.`
        : 'HR validation and employment contract details.',
    },
  ];

  const ledgerShares = shares.slice(0, 3);
  const avatarTones = ['blue', 'sky', 'orange', 'slate'] as const;

  const sharedAccessSection = (
    <section className="tn-ref-shared-block">
      <div className="tn-ref-shared-head">
        <div>
          <h2>Shared Access Management</h2>
          <p>{shares.length} active share{shares.length === 1 ? '' : 's'} — manage access below</p>
        </div>
        <button
          type="button"
          className="tn-ref-btn-primary"
          onClick={handleGenerateLink}
          disabled={summaryOverallProgress < 75}
          title={summaryOverallProgress < 75 ? 'Your passport must be at least 75% complete before you can send it' : ''}
        >
          + Share with Another Landlord or Letting Agent
        </button>
      </div>

      {shares.length === 0 ? (
        <div className="tn-ref-empty">
          <div className="tn-ref-empty-icon">
            <Share2 className="w-6 h-6" />
          </div>
          <h2>No passports shared yet</h2>
          <p>
            Share your referencing passport with landlords and letting agencies. You control access duration and can revoke links at any time.
          </p>
          <div className="tn-ref-empty-actions">
            <button
              type="button"
              className="tn-ref-btn-primary"
              onClick={handleGenerateLink}
              disabled={summaryOverallProgress < 75}
            >
              Share Your Passport
            </button>
            <button type="button" className="tn-ref-btn-secondary" onClick={() => setActiveTab('details')}>
              View Verification Details
            </button>
          </div>
        </div>
      ) : (
        <div className="tn-ref-share-grid">
          {shares.map((share) => (
            <div key={share.id} className="tn-ref-share-card">
              <div>
                <div className="tn-ref-share-title">
                  <h3>{share.recipientName}</h3>
                  <span className={`tn-ref-role ${share.recipientRole === 'agent' ? 'agent' : 'landlord'}`}>
                    {share.recipientRole === 'agent' ? 'Letting Agent' : 'Landlord'}
                  </span>
                </div>
                <div className="tn-ref-share-email">{share.recipientEmail}</div>
                {share.recipientPhone && <div className="tn-ref-share-phone">{share.recipientPhone}</div>}
                {(share.propertyAddress || share.agencyName) && (
                  <div className="tn-ref-share-addr">{share.propertyAddress || share.agencyName}</div>
                )}
              </div>
              <div className="tn-ref-share-foot">
                <div className="tn-ref-share-meta">
                  Shared on: <strong>{formatShareDate(share.createdAt)}</strong>
                  {' · '}
                  Status: <strong>{share.status || 'Delivered'}</strong>
                </div>
                <div className="tn-ref-share-actions">
                  <button type="button" className="revoke" onClick={() => handleDeleteShare(share.id, share.recipientName)}>
                    Revoke Access
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="tn-ref">
      {referencingHeader}
      <div className="tn-ref-body">
      <section className="tn-ref-kpi-grid">
        <div className="tn-ref-kpi-health">
          <div>
            <div className="tn-ref-kpi-kicker">Verification Health</div>
            <div className="tn-ref-kpi-health-row">
              <span className="tn-ref-kpi-health-pct">{summaryOverallProgress}%</span>
              <span className={`tn-ref-badge ${healthState === 'verified' ? 'verified' : healthState === 'partial' ? 'partial' : 'empty'}`}>
                {healthLabel}
              </span>
            </div>
            <p className="tn-ref-kpi-health-desc">{healthDesc}</p>
          </div>
          <div className={`tn-ref-ring ${healthState === 'verified' ? '' : healthState === 'partial' ? 'is-partial' : 'is-empty'}`}>
            {healthState === 'verified' ? (
              <CheckCircle className="w-10 h-10" strokeWidth={3} />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>
        </div>

        <div className="tn-ref-kpi-steps">
          <div className="tn-ref-kpi-mini-icon">
            <List className="w-5 h-5" />
          </div>
          <div>
            <div className="tn-ref-kpi-big">{summaryCompleted}/5</div>
            <div className="tn-ref-kpi-sublabel">Steps Cleared</div>
          </div>
        </div>

        <div className="tn-ref-kpi-shares">
          <div className="tn-ref-kpi-mini-icon">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="tn-ref-kpi-big">{String(shares.length).padStart(2, '0')}</div>
            <div className="tn-ref-kpi-sublabel">Active Shares</div>
          </div>
        </div>
      </section>

      <div className="tn-ref-toolbar">
        <div className="tn-ref-tabs">
          <button
            type="button"
            className={`tn-ref-tab${activeTab === 'details' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Your Referencing Details
          </button>
          <button
            type="button"
            className={`tn-ref-tab${activeTab === 'shared' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('shared')}
          >
            Shared Passports
          </button>
        </div>
      </div>

      {activeTab === 'details' && (
        <>
        {started ? (
          <div className="tn-ref-layout">
            <div>
              <div className="tn-ref-roadmap-head">
                <h2>Verification Roadmap</h2>
                <button type="button" className="tn-ref-download" onClick={handleDownloadReport}>
                  Download referencing report
                </button>
              </div>
              <div className="tn-ref-pillars">
                {pillars.map((pillar) => (
                  <button
                    key={pillar.step}
                    type="button"
                    className="tn-ref-pillar"
                    onClick={() => openSectionModal(pillar.step)}
                  >
                    <span className={`tn-ref-pillar-icon ${pillar.complete ? 'done' : started ? 'wait' : 'off'}`}>
                      {pillar.complete ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </span>
                    <div className="tn-ref-pillar-body">
                      <div className="tn-ref-pillar-title">
                        <h3>{pillar.title}</h3>
                        <span className={`tn-ref-pillar-status ${pillar.complete ? 'done' : started ? 'wait' : 'off'}`}>
                          {pillar.complete ? 'Verified' : 'Incomplete'}
                        </span>
                      </div>
                      <p className="tn-ref-pillar-desc">{pillar.description}</p>
                      <div className="tn-ref-pillar-foot">
                        <span
                          className="tn-ref-pillar-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPillar(pillar);
                          }}
                        >
                          View Documents →
                        </span>
                        <span className="tn-ref-pillar-id">{pillar.idLabel}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="tn-ref-side">
              <div className="tn-ref-send">
                <div className="tn-ref-send-icon">
                  <Send className="w-5 h-5" />
                </div>
                <h3>Send Passport</h3>
                <p>Transmit your verified referencing architecture to property agents with one secure, time-limited link.</p>
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={summaryOverallProgress < 75}
                  title={summaryOverallProgress < 75 ? 'Your passport must be at least 75% complete before you can send it' : ''}
                >
                  Generate Passport Link
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="tn-ref-ledger">
                <h3>Access Ledger</h3>
                {ledgerShares.length === 0 ? (
                  <p className="tn-ref-ledger-empty">
                    No landlords or agents have accessed your passport yet. Share it to start tracking access here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ledgerShares.map((share, index) => (
                      <div key={share.id} className="tn-ref-ledger-row">
                        <div className="tn-ref-ledger-who">
                          <span className={`tn-ref-ledger-av ${avatarTones[index % avatarTones.length]}`}>
                            {shareInitials(share.recipientName)}
                          </span>
                          <div>
                            <div className="tn-ref-ledger-name">{share.recipientName}</div>
                            <div className="tn-ref-ledger-meta">Shared {formatShareDate(share.createdAt)}</div>
                          </div>
                        </div>
                        <span className="tn-ref-dot" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="tn-ref-empty">
            <div className="tn-ref-empty-icon">
              <Shield className="w-6 h-6" />
            </div>
            <h2>No referencing steps completed yet</h2>
            <p>
              Once you begin your referencing process, your identity, employment, and residential milestones will update here in real time. Transmit your passport to letting agents with one secure click.
            </p>
            <div className="tn-ref-steps">
              <span className="tn-ref-step"><span className="tn-ref-step-num">1</span>Complete Identity</span>
              <span className="tn-ref-step-arrow">→</span>
              <span className="tn-ref-step"><span className="tn-ref-step-num">2</span>Verify Employment</span>
              <span className="tn-ref-step-arrow">→</span>
              <span className="tn-ref-step"><span className="tn-ref-step-num">3</span>Credit Check</span>
              <span className="tn-ref-step-arrow">→</span>
              <span className="tn-ref-step"><span className="tn-ref-step-num">4</span>Share Passport</span>
            </div>
            <div className="tn-ref-empty-actions">
              <button type="button" className="tn-ref-btn-primary" onClick={handleStartPassport}>
                Start Verification Process
              </button>
              <button type="button" className="tn-ref-btn-secondary" onClick={() => navigate('/dashboard/your-files')}>
                Upload Verification Documents
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'shared' && sharedAccessSection}
      </div>

      {isReferencingModalOpen && (
        <ReferencingModal
          isOpen={isReferencingModalOpen}
          onClose={closeReferencingModal}
          initialStep={referencingStep}
          singleSectionOnly={singleSectionOnly}
          onSubmissionComplete={() => {
            loadReferencingData();
          }}
        />
      )}

      <SendReferencingModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onEditPassport={() => {
          setIsSendModalOpen(false);
          openFullPassportModal(1);
        }}
        onShareComplete={() => {
          loadReferencingData();
        }}
      />
      {previewPillar && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewPillar(null); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-pillar-preview">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className={`tn-modal-ico ${previewPillar.complete ? 'green' : 'blue'}`}>
                  {previewPillar.complete ? '✓' : '!'}
                </span>
                <div>
                  <h3 id="tn-pillar-preview">{previewPillar.title}</h3>
                  <p>Referencing pillar record</p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setPreviewPillar(null)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <div className="tn-modal-attest">
                <div>
                  <span>Status</span>
                  <strong>{previewPillar.complete ? 'Verified' : 'Incomplete'}</strong>
                </div>
                <div>
                  <span>Document type</span>
                  <strong>{previewPillar.title}</strong>
                </div>
                <div>
                  <span>Summary</span>
                  <strong>{previewPillar.description}</strong>
                </div>
              </div>
              <p style={{ margin: 0, color: '#475569', fontWeight: 400, lineHeight: 1.6 }}>
                This is the live record for this pillar from your referencing passport. Open the section to edit details, or download the report for a full dossier.
              </p>
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <button
                  type="button"
                  className="tn-modal-blue"
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleDownloadReport();
                    setPreviewPillar(null);
                  }}
                >
                  Download report
                </button>
                <button
                  type="button"
                  className="tn-modal-cancel"
                  onClick={() => {
                    const step = previewPillar.step;
                    setPreviewPillar(null);
                    openSectionModal(step);
                  }}
                >
                  Edit details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewingModal}
    </div>
  );
};

export default TenantReferencing;
