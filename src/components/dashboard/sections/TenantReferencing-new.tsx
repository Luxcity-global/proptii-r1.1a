import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User, 
  Briefcase,
  Home,
  PoundSterling,
  Users,
  Send,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  ShieldCheck,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { firestoreService } from '../../../services/firestoreService';
import ReferencingModal from '../../ReferencingModalLegacy';
import SendReferencingModal from '../../referencing/SendReferencingModal';
import { useIsMobile } from '../ui/use-mobile';
import { useBillingStatus } from '../../../hooks/useBillingStatus';
import { canAccessSection, sectionUpgradeLabel } from '../../../utils/planAccess';
import PlanUpgradeWall from '../PlanUpgradeWall';
import { toast } from 'react-hot-toast';

// Interface for form data structure - 5 passport sections
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

const TenantReferencing: React.FC = () => {
  // ── All hooks must be called unconditionally before any early returns ──────
  const { plan, status } = useBillingStatus();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'empty' | 'partial' | 'complete' }>({});
  const [shares, setShares] = useState<ReferencingShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [referencingStep, setReferencingStep] = useState(1);
  const [singleSectionOnly, setSingleSectionOnly] = useState(true);

  // Load form data and shares from Firestore
  const loadReferencingData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const propertyId = `general_${user.id}`;
      const [formResult, sharesResult] = await Promise.all([
        firestoreService.getReferencingForm(user.id, propertyId),
        firestoreService.getReferencingShares(user.id)
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
    loadReferencingData();
  }, [user?.id]);

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
      case 1: // Identity
        return !!(
          formData.identity?.firstName &&
          formData.identity?.lastName &&
          formData.identity?.email &&
          (formData.identity?.identityProof || formData.identity?.dateOfBirth)
        );
      case 2: // Employment
        return !!(
          formData.employment?.employmentStatus &&
          (['Unemployed', 'Retired', 'Student'].includes(formData.employment?.employmentStatus) ||
            formData.employment?.companyDetails ||
            formData.employment?.jobPosition)
        );
      case 3: // Residential
        return !!(formData.residential?.currentAddress && formData.residential?.durationAtCurrentAddress);
      case 4: // Financial
        return !!(
          formData.financial?.monthlyIncome ||
          formData.financial?.proofOfIncomeDocument ||
          formData.financial?.useOpenBanking
        );
      case 5: // Guarantor
        return (
          (formData as any)?.guarantor?.verifiedViaLink ||
          (formData as any)?.guarantorInvitation?.status === 'completed' ||
          !!(formData.guarantor?.firstName && formData.guarantor?.lastName && formData.guarantor?.email)
        );
      default:
        return false;
    }
  };

  // Calculate progress statistics across the 5 steps
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
  const summaryPending = isAuthenticated ? progress.pending : 0;
  const summaryDocuments = isAuthenticated ? progress.documents : 0;

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
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your referencing passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // No passport started yet – show a friendly onboarding CTA
  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-6 font-sans">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 max-w-lg w-full text-center shadow-sm border border-blue-100">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Create Your Referencing Passport
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Fill in your 5 referencing sections once and share your passport with multiple landlords or letting agents without repeating forms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openFullPassportModal(1)}
              className="px-6 py-3 bg-[#136C9E] text-white rounded-xl text-sm font-semibold hover:bg-[#0F5A82] transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Start My Passport (5 Sections)
            </button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Fill once', sub: '5 simple sections' },
              { label: 'Share freely', sub: 'Multiple recipients' },
              { label: 'Edit anytime', sub: 'Section by section' },
            ].map((f) => (
              <div key={f.label} className="bg-white rounded-xl p-3 shadow-sm border border-blue-50">
                <p className="text-xs font-bold text-gray-800">{f.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referencing Modal */}
        {isReferencingModalOpen && (
          <ReferencingModal
            isOpen={isReferencingModalOpen}
            onClose={() => { setIsReferencingModalOpen(false); loadReferencingData(); }}
            initialStep={referencingStep}
            singleSectionOnly={singleSectionOnly}
            onSubmissionComplete={loadReferencingData}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#374957' }}>
              Referencing Passport
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              5 Sections
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">
            Fill each section once, keep details updated, and share with multiple landlords and letting agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-xs md:text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            onClick={() => openFullPassportModal(1)}
          >
            <Edit3 className="w-4 h-4 text-[#136C9E]" />
            Edit Full Passport
          </button>
          <button 
            className="px-5 py-2.5 text-white rounded-full text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            }}
            onClick={() => setIsSendModalOpen(true)}
          >
            <Send className="w-4 h-4" />
            Send to Landlord / Agent
          </button>
        </div>
      </div>

      {/* Progress Overview Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4 md:gap-6`}>
        {/* Overall Progress Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl border border-gray-100 shadow-sm`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Overall Progress</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl md:text-3xl font-bold" style={{ color: '#374957' }}>{summaryOverallProgress}%</p>
          </div>
          <p className="text-xs text-gray-500">{summaryCompleted} of 5 sections complete</p>
        </div>

        {/* Completed Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl border border-gray-100 shadow-sm`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Completed</h3>
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl md:text-3xl font-bold" style={{ color: '#374957' }}>{summaryCompleted}</p>
          </div>
          <p className="text-xs text-gray-500">Verified of 5 sections</p>
        </div>

        {/* Pending Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl border border-gray-100 shadow-sm`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Pending</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl md:text-3xl font-bold" style={{ color: '#374957' }}>{summaryPending}</p>
          </div>
          <p className="text-xs text-gray-500">Awaiting completion</p>
        </div>

        {/* Sent Shares Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-2xl border border-gray-100 shadow-sm`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Shared Applications</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <Send className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl md:text-3xl font-bold" style={{ color: '#DC5F12' }}>{shares.length}</p>
          </div>
          <p className="text-xs text-gray-500">Landlords & agents sent to</p>
        </div>
      </div>

      {/* Shared Recipients Manager (Send to Multiple Landlords/Agents) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#136C9E]" />
              <h2 className="text-lg font-bold text-gray-800">
                Shared With Landlords & Agents ({shares.length})
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Send your completed referencing passport to multiple recipients. You can revoke access anytime.
            </p>
          </div>

          <button
            onClick={() => setIsSendModalOpen(true)}
            disabled={summaryOverallProgress < 75}
            title={summaryOverallProgress < 75 ? "Your passport must be at least 75% complete before you can send it" : ""}
            className={`px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${summaryOverallProgress < 75 ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-95'}`}
            style={{ backgroundColor: '#DC5F12' }}
          >
            <Plus className="w-4 h-4" />
            Send to Another Landlord/Agent
          </button>
        </div>

        {shares.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No Landlords or Agents Added Yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Once your passport details are filled, you can send your report directly to any prospective landlord or letting agent.
            </p>
            <button
              onClick={() => setIsSendModalOpen(true)}
              disabled={summaryOverallProgress < 75}
              title={summaryOverallProgress < 75 ? "Your passport must be at least 75% complete before you can send it" : ""}
              className={`px-5 py-2.5 rounded-full text-white text-xs sm:text-sm font-semibold transition-all shadow-sm ${summaryOverallProgress < 75 ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-95'}`}
              style={{ backgroundColor: '#136C9E' }}
            >
              Send Referencing Passport
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shares.map((share) => (
              <div 
                key={share.id} 
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all bg-gray-50/50 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {share.recipientName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          share.recipientRole === 'agent' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {share.recipientRole === 'agent' ? 'Agent' : 'Landlord'}
                        </span>
                      </div>
                      {share.agencyName && (
                        <p className="text-xs text-gray-500 font-medium">{share.agencyName}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteShare(share.id, share.recipientName)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke and delete share"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{share.recipientEmail}</span>
                    </div>
                    {share.recipientPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{share.recipientPhone}</span>
                      </div>
                    )}
                    {share.propertyAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium">{share.propertyAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200/70 text-[11px] text-gray-500">
                  <span>Sent {new Date(share.createdAt).toLocaleDateString('en-GB')}</span>
                  <span className="inline-flex items-center text-green-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referencing Passport Sections (5 Steps) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Passport Sections (5)</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Click any section below to open and edit its specific details directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              title: "Identity Verification",
              icon: <User className="w-5 h-5 text-blue-600" />,
              progress: "1",
              status: isSectionCompleted(1) ? "Complete" : "Incomplete",
              step: 1,
              items: [
                { name: "Full Name", description: "Personal identification", status: isFieldComplete('identity', 'firstName') && isFieldComplete('identity', 'lastName') ? "complete" : "incomplete" },
                { name: "Email & Phone", description: "Contact details", status: isFieldComplete('identity', 'email') && isFieldComplete('identity', 'phoneNumber') ? "complete" : "incomplete" },
                { name: "Date of Birth", description: "Personal verification", status: isFieldComplete('identity', 'dateOfBirth') ? "complete" : "incomplete" },
                { name: "Nationality", description: "Right to rent", status: isFieldComplete('identity', 'nationality') ? "complete" : "incomplete" },
                { name: "Passport / ID Document", description: "Identity proof upload", status: isDocumentUploaded('identity', 'identityProof') ? "complete" : "incomplete" }
              ]
            },
            {
              title: "Employment & Income",
              icon: <Briefcase className="w-5 h-5 text-blue-600" />,
              progress: "2",
              status: isSectionCompleted(2) ? "Complete" : "Incomplete",
              step: 2,
              items: [
                { name: "Employment Status", description: "Current work status", status: isFieldComplete('employment', 'employmentStatus') ? "complete" : "incomplete" },
                { name: "Company Details", description: "Employer info", status: isFieldComplete('employment', 'companyDetails') ? "complete" : "incomplete" },
                { name: "Job Position & Duration", description: "Role & tenure", status: isFieldComplete('employment', 'jobPosition') ? "complete" : "incomplete" },
                { name: "Referee Contact", description: "Manager / HR contact", status: isFieldComplete('employment', 'referenceFullName') && isFieldComplete('employment', 'referenceEmail') ? "complete" : "incomplete" },
                { name: "Proof of Employment", description: "Work documentation", status: isDocumentUploaded('employment', 'proofDocument') ? "complete" : "incomplete" }
              ]
            },
            {
              title: "Residential History",
              icon: <Home className="w-5 h-5 text-orange-600" />,
              progress: "3",
              status: isSectionCompleted(3) ? "Complete" : "Incomplete",
              step: 3,
              items: [
                { name: "Current Address", description: "Primary residence", status: isFieldComplete('residential', 'currentAddress') ? "complete" : "incomplete" },
                { name: "Duration at Address", description: "Time at current address", status: isFieldComplete('residential', 'durationAtCurrentAddress') ? "complete" : "incomplete" },
                { name: "Proof of Address", description: "Utility bill / Bank statement", status: isDocumentUploaded('residential', 'proofDocument') ? "complete" : "incomplete" }
              ]
            },
            {
              title: "Financial & Income Proof",
              icon: <PoundSterling className="w-5 h-5 text-orange-600" />,
              progress: "4",
              status: isSectionCompleted(4) ? "Complete" : "Incomplete",
              step: 4,
              items: [
                { name: "Monthly Income (£)", description: "Gross monthly earnings", status: isFieldComplete('financial', 'monthlyIncome') ? "complete" : "incomplete" },
                { name: "Proof of Income", description: "Payslips / Tax return", status: isDocumentUploaded('financial', 'proofOfIncomeDocument') ? "complete" : "incomplete" }
              ]
            },
            {
              title: "Guarantor Details",
              icon: <Users className="w-5 h-5 text-amber-600" />,
              progress: "5",
              status: isSectionCompleted(5)
                ? "Complete" 
                : (formData as any)?.guarantorInvitation?.status === 'invited'
                  ? "Invited (Pending)"
                  : "Optional",
              step: 5,
              items: ((formData as any)?.guarantor?.verifiedViaLink || (formData as any)?.guarantorInvitation?.status === 'completed') ? [
                { name: "Guarantor Details", description: `${(formData as any)?.guarantor?.firstName || ''} ${(formData as any)?.guarantor?.lastName || ''} (${(formData as any)?.guarantor?.email || ''})`, status: "complete" },
                { name: "Employment & Income", description: `${(formData as any)?.guarantor?.employmentStatus || 'Provided'} ${(formData as any)?.guarantor?.annualIncome ? `· £${(formData as any)?.guarantor?.annualIncome}/yr` : ''}`, status: "complete" },
                { name: "Guarantor ID & Declaration", description: "Verified by guarantor via direct link", status: "complete" }
              ] : (formData as any)?.guarantorInvitation?.status === 'invited' ? [
                { name: "Guarantor Invitation", description: `Invite sent to ${(formData as any)?.guarantorInvitation?.guarantorEmail || (formData as any)?.guarantor?.email || 'Guarantor'}`, status: "incomplete" },
                { name: "Guarantor Details", description: "Awaiting submission from guarantor", status: "incomplete" },
                { name: "Guarantor ID Upload", description: "Awaiting document upload", status: "incomplete" }
              ] : [
                { name: "Guarantor Name", description: "Optional guarantor info", status: isFieldComplete('guarantor', 'firstName') ? "complete" : "incomplete" },
                { name: "Guarantor Contact", description: "Email and phone", status: isFieldComplete('guarantor', 'email') ? "complete" : "incomplete" },
                { name: "Guarantor ID Upload", description: "Guarantor ID document", status: isDocumentUploaded('guarantor', 'identityDocument') ? "complete" : "incomplete" }
              ]
            }
          ].map((card) => (
            <div
              key={card.title}
              onClick={() => openSectionModal(card.step)}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#136C9E]/50 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors flex items-center justify-center flex-shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base group-hover:text-[#136C9E] transition-colors">{card.title}</h3>
                    <span className="text-xs text-gray-400">Section {card.progress} of 5</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    card.status === "Complete" 
                      ? "bg-green-100 text-green-700" 
                      : card.status === "Invited (Pending)"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-orange-100 text-orange-700"
                  }`}>
                    {card.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSectionModal(card.step);
                    }}
                    className="text-xs font-semibold text-[#136C9E] group-hover:text-white px-3 py-1.5 rounded-lg border border-blue-200 group-hover:bg-[#136C9E] group-hover:border-[#136C9E] transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <span>{card.status === "Complete" ? "Edit" : "Fill"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {card.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {item.status === 'complete' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="text-gray-400 ml-1.5 hidden sm:inline">({item.description})</span>
                      </div>
                    </div>
                    <span className={`font-semibold ${item.status === 'complete' ? 'text-green-600' : 'text-orange-500'}`}>
                      {item.status === 'complete' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referencing Modal */}
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

      {/* Standalone Send Modal */}
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
    </div>
  );
};

export default TenantReferencing;
