import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  User,
  Home,
  Briefcase,
  PoundSterling,
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileCheck,
  X,
  FileText,
  Lock,
  ExternalLink,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';
import { uploadToFirebaseStorage } from '../services/storageService';
import { toast } from 'react-hot-toast';

const API = getResolvedApiBaseUrl();

interface InviteMeta {
  valid: boolean;
  requestId: string;
  inviteToken: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  landlordName: string;
  landlordId: string;
  landlordEmail?: string;
  status: string;
  expiresAt: string;
}

export const ReferencingInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteMeta, setInviteMeta] = useState<InviteMeta | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State - 5 Passport sections
  const [formData, setFormData] = useState({
    identity: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      isBritish: true,
      nationality: 'British',
      identityProof: null as any
    },
    employment: {
      employmentStatus: 'Employed',
      companyDetails: '',
      lengthOfEmployment: '',
      jobPosition: '',
      referenceFullName: '',
      referenceEmail: '',
      referencePhone: '',
      proofType: 'Employment Contract',
      proofDocument: null as any
    },
    residential: {
      currentAddress: '',
      durationAtCurrentAddress: '1-2 years',
      previousAddress: '',
      durationAtPreviousAddress: '',
      reasonForLeaving: 'Tenancy renewal / Moving',
      alreadyHavePropertyAddress: 'Yes',
      propertyAddress: '',
      proofType: 'Council Tax Bill',
      proofDocument: null as any
    },
    financial: {
      monthlyIncome: '',
      proofOfIncomeType: 'Payslips',
      proofOfIncomeDocument: null as any,
      useOpenBanking: false,
      isConnectedToOpenBanking: false
    },
    guarantor: {
      hasGuarantor: false,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      identityDocument: null as any
    }
  });

  // Uploading states
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // ── 1. Validate Invite Token ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      if (user) {
        setFormData(prev => ({
          ...prev,
          identity: {
            ...prev.identity,
            firstName: prev.identity.firstName || user.givenName || '',
            lastName: prev.identity.lastName || user.familyName || '',
            email: prev.identity.email || user.email || '',
          }
        }));
      }
      setLoadingInvite(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoadingInvite(true);
        const res = await fetch(`${API}/referencing/invite/validate?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (json.valid) {
          setInviteMeta(json);
          const nameParts = (json.tenantName || '').trim().split(' ');
          const initialFirstName = nameParts[0] || '';
          const initialLastName = nameParts.slice(1).join(' ') || '';

          setFormData(prev => ({
            ...prev,
            identity: {
              ...prev.identity,
              firstName: prev.identity.firstName || initialFirstName || user?.givenName || '',
              lastName: prev.identity.lastName || initialLastName || user?.familyName || '',
              email: json.tenantEmail || prev.identity.email || user?.email || '',
            },
            residential: {
              ...prev.residential,
              propertyAddress: json.propertyAddress || prev.residential.propertyAddress
            }
          }));
        } else {
          setInviteError(json.error || 'This invitation link is invalid or has expired.');
        }
      } catch (err: any) {
        // In case of network error, do not trap the user in an error screen
        setLoadingInvite(false);
      } finally {
        setLoadingInvite(false);
      }
    };

    validateToken();
  }, [token, user]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSectionChange = (section: 'identity' | 'employment' | 'residential' | 'financial' | 'guarantor', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (section: 'identity' | 'employment' | 'residential' | 'financial' | 'guarantor', field: string, file: File) => {
    setUploadingSection(`${section}_${field}`);
    try {
      const uploadRes = await uploadToFirebaseStorage(file, `referencing_documents/${section}`);
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadRes.url || '',
        dataUrl: uploadRes.url || '',
        lastModified: file.lastModified
      };

      handleSectionChange(section, field, fileData);
      toast.success(`${file.name} uploaded successfully!`);

      // If it's identity proof, optionally run AI extract
      if (section === 'identity' && file.type.startsWith('image/')) {
        runAIExtract(file);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploadingSection(null);
    }
  };

  const runAIExtract = async (file: File) => {
    setAiExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch(`${API}/referencing/ai-extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, mimeType: file.type })
          });
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setFormData(prev => ({
              ...prev,
              identity: {
                ...prev.identity,
                firstName: d.firstName || prev.identity.firstName,
                lastName: d.lastName || prev.identity.lastName,
                dateOfBirth: d.dateOfBirth || prev.identity.dateOfBirth,
                nationality: d.nationality || prev.identity.nationality,
              }
            }));
            toast.success('Information extracted from document!');
          }
        } catch {
          // non-blocking
        } finally {
          setAiExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setAiExtracting(false);
    }
  };

  // Step Validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !!formData.identity.firstName && !!formData.identity.lastName && !!formData.identity.email;
      case 2:
        return !!formData.employment.employmentStatus;
      case 3:
        return !!formData.residential.currentAddress;
      case 4:
        return !!formData.financial.monthlyIncome;
      case 5:
        if (formData.guarantor.hasGuarantor) {
          return !!formData.guarantor.firstName && !!formData.guarantor.email;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmitApplication();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Submit Application ─────────────────────────────────────────────────────
  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/referencing/invite/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          formData
        })
      });

      const json = await res.json();
      if (json.success) {
        setIsSubmitted(true);
        setSubmittedData(json);
        toast.success('Referencing application submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(json.error || 'Failed to submit referencing application');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#136C9E] mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Loading Referencing Invitation…</h2>
        <p className="text-sm text-gray-500 mt-1">Connecting to Proptii Referencing Hub</p>
      </div>
    );
  }

  // ── Render: Error / Expired ────────────────────────────────────────────────
  if (inviteError || !inviteMeta) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Unavailable</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {inviteError || 'This referencing link is invalid or has expired.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-[#136C9E] text-white font-bold text-sm hover:bg-[#0D4E73] transition-colors"
            >
              Go to Proptii Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Submission Success & Account Claiming Prompt ───────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header Banner */}
          <div 
            className="p-8 text-white text-center"
            style={{ background: 'linear-gradient(135deg, #136C9E 0%, #0D4E73 100%)' }}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Referencing Submitted!</h1>
            <p className="text-sm text-blue-100 mt-1">
              Sent directly to <strong>{inviteMeta.landlordName}</strong>
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Delivery Confirmation Box */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-green-600" />
                <span>Application delivered securely</span>
              </div>
              <p className="text-xs text-green-700 leading-relaxed">
                Your referencing documents and information have been delivered to {inviteMeta.landlordName}. An email confirmation has been sent to both parties.
              </p>
            </div>

            {/* Account Creation Card - Proptii Referencing Passport */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/70 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#136C9E] text-white flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Save Your Referencing Passport</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md mx-auto">
                  Create a free Proptii account so you never have to fill out referencing or re-upload your documents again for future rental applications.
                </p>
              </div>

              <div className="text-left space-y-2 bg-white/80 rounded-xl p-3 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Manage and update your referencing details anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Share with any landlord or agent in 1 click</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Track verification status and direct messages</span>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('redirectAfterLogin', '/dashboard/tenant-referencing');
                      login('google');
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-50 shadow-sm transition-all cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
                      <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                    </svg>
                    Continue with Google (1-Click)
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('redirectAfterLogin', '/dashboard/tenant-referencing');
                      login();
                    }}
                    className="w-full py-3 rounded-xl bg-[#136C9E] text-white font-bold text-sm hover:bg-[#0D4E73] shadow-md transition-colors"
                  >
                    Sign In / Create Account with Email
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/dashboard/tenant-referencing')}
                    className="w-full py-3.5 rounded-xl bg-[#136C9E] text-white font-bold text-sm hover:bg-[#0D4E73] shadow-md transition-colors"
                  >
                    Go to Tenant Dashboard
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Return to Proptii Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Active Multi-Step Referencing Form ────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Brand Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/proptii-logo.png" alt="Proptii" className="h-7 w-auto" onError={(e: any) => { e.target.style.display = 'none'; }} />
            <span className="font-extrabold text-[#136C9E] text-lg tracking-tight">Proptii Referencing</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">Invited Application</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#136C9E] text-xs font-bold">
              Secure
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Landlord Invitation Header Card */}
        <div 
          className="rounded-3xl p-6 sm:p-7 text-white shadow-lg mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #136C9E 0%, #0D4E73 100%)' }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
              <ShieldCheck className="w-4 h-4" /> Referencing Invitation
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Complete Referencing for {inviteMeta.landlordName}
            </h1>
            {inviteMeta.propertyAddress && (
              <p className="text-sm text-blue-100 mt-1 flex items-center gap-1.5">
                <Home className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{inviteMeta.propertyAddress}</span>
              </p>
            )}
            <p className="text-xs text-blue-100/90 mt-3 max-w-xl">
              Fill in your details across the 5 quick steps below. Once submitted, your verified referencing report is sent directly to your landlord. No password is required to submit!
            </p>
          </div>
        </div>

        {/* Step Progress Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-6 shadow-sm">
          <div className="grid grid-cols-5 gap-1 text-center">
            {[
              { num: 1, label: 'Identity', icon: User },
              { num: 2, label: 'Employment', icon: Briefcase },
              { num: 3, label: 'Residential', icon: Home },
              { num: 4, label: 'Financial', icon: PoundSterling },
              { num: 5, label: 'Guarantor', icon: Users },
            ].map(({ num, label, icon: Icon }) => {
              const isActive = currentStep === num;
              const isPast = currentStep > num;
              return (
                <button
                  key={num}
                  onClick={() => setCurrentStep(num)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#136C9E] text-white shadow-sm'
                      : isPast
                      ? 'text-green-600 hover:bg-gray-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate text-[11px]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">

          {/* ── STEP 1: IDENTITY ────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Step 1: Personal & Identity Details</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Please provide your legal name and contact details.</p>
                </div>
                <span className="text-xs font-bold text-[#136C9E] bg-blue-50 px-3 py-1 rounded-full">
                  Step 1 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.identity.firstName}
                    onChange={e => handleSectionChange('identity', 'firstName', e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.identity.lastName}
                    onChange={e => handleSectionChange('identity', 'lastName', e.target.value)}
                    placeholder="e.g. Johnson"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.identity.email}
                    onChange={e => handleSectionChange('identity', 'email', e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.identity.phoneNumber}
                    onChange={e => handleSectionChange('identity', 'phoneNumber', e.target.value)}
                    placeholder="07123 456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.identity.dateOfBirth}
                    onChange={e => handleSectionChange('identity', 'dateOfBirth', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.identity.nationality}
                    onChange={e => handleSectionChange('identity', 'nationality', e.target.value)}
                    placeholder="British"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
              </div>

              {/* ID Document Upload */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Upload Proof of ID (Passport or Driving Licence)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#136C9E] transition-colors relative bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('identity', 'identityProof', file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">Click or drag your ID document here</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, or PDF up to 10MB</p>
                </div>
                {uploadingSection === 'identity_identityProof' && (
                  <p className="text-xs text-[#136C9E] flex items-center gap-1 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document…
                  </p>
                )}
                {aiExtracting && (
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Scanning with AI and autofilling fields…
                  </p>
                )}
                {formData.identity.identityProof && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2.5 mt-2 text-xs text-green-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {formData.identity.identityProof.name || 'ID Document Attached'}
                    </span>
                    <button
                      onClick={() => handleSectionChange('identity', 'identityProof', null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: EMPLOYMENT ──────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Step 2: Employment & Referee Details</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Tell us about your current occupation.</p>
                </div>
                <span className="text-xs font-bold text-[#136C9E] bg-blue-50 px-3 py-1 rounded-full">
                  Step 2 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Employment Status *</label>
                  <select
                    value={formData.employment.employmentStatus}
                    onChange={e => handleSectionChange('employment', 'employmentStatus', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  >
                    <option value="Employed">Employed (Full-Time / Part-Time)</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company / Employer Name</label>
                  <input
                    type="text"
                    value={formData.employment.companyDetails}
                    onChange={e => handleSectionChange('employment', 'companyDetails', e.target.value)}
                    placeholder="e.g. Acme Corp Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Job Position / Title</label>
                  <input
                    type="text"
                    value={formData.employment.jobPosition}
                    onChange={e => handleSectionChange('employment', 'jobPosition', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Length of Employment</label>
                  <input
                    type="text"
                    value={formData.employment.lengthOfEmployment}
                    onChange={e => handleSectionChange('employment', 'lengthOfEmployment', e.target.value)}
                    placeholder="e.g. 2 years 6 months"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Employer / HR Referee Full Name</label>
                  <input
                    type="text"
                    value={formData.employment.referenceFullName}
                    onChange={e => handleSectionChange('employment', 'referenceFullName', e.target.value)}
                    placeholder="e.g. John Miller (HR Manager)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Referee Email Address</label>
                  <input
                    type="email"
                    value={formData.employment.referenceEmail}
                    onChange={e => handleSectionChange('employment', 'referenceEmail', e.target.value)}
                    placeholder="hr@acme.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>
              </div>

              {/* Employment Proof Upload */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Upload Proof of Employment (Contract or Payslip)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#136C9E] transition-colors relative bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('employment', 'proofDocument', file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">Click or drag employment document</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Contract, letter, or payslip</p>
                </div>
                {uploadingSection === 'employment_proofDocument' && (
                  <p className="text-xs text-[#136C9E] flex items-center gap-1 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document…
                  </p>
                )}
                {formData.employment.proofDocument && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2.5 mt-2 text-xs text-green-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {formData.employment.proofDocument.name || 'Employment Proof Attached'}
                    </span>
                    <button
                      onClick={() => handleSectionChange('employment', 'proofDocument', null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: RESIDENTIAL ─────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Step 3: Residential History</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Your current and previous address information.</p>
                </div>
                <span className="text-xs font-bold text-[#136C9E] bg-blue-50 px-3 py-1 rounded-full">
                  Step 3 of 5
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Current Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.residential.currentAddress}
                    onChange={e => handleSectionChange('residential', 'currentAddress', e.target.value)}
                    placeholder="12 High Street, Flat 4, London, SW1A 1AA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Time at Current Address</label>
                    <select
                      value={formData.residential.durationAtCurrentAddress}
                      onChange={e => handleSectionChange('residential', 'durationAtCurrentAddress', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                    >
                      <option value="Less than 6 months">Less than 6 months</option>
                      <option value="6-12 months">6-12 months</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="2-3 years">2-3 years</option>
                      <option value="3+ years">3+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Moving</label>
                    <input
                      type="text"
                      value={formData.residential.reasonForLeaving}
                      onChange={e => handleSectionChange('residential', 'reasonForLeaving', e.target.value)}
                      placeholder="e.g. Relocating for work / larger space"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                    />
                  </div>
                </div>

                {/* Proof of Address Upload */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Upload Proof of Current Address (Utility Bill, Council Tax, or Bank Statement)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#136C9E] transition-colors relative bg-gray-50/50">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('residential', 'proofDocument', file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Click or drag proof of address</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Dated within the last 3 months</p>
                  </div>
                  {uploadingSection === 'residential_proofDocument' && (
                    <p className="text-xs text-[#136C9E] flex items-center gap-1 mt-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document…
                    </p>
                  )}
                  {formData.residential.proofDocument && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2.5 mt-2 text-xs text-green-800">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {formData.residential.proofDocument.name || 'Proof of Address Attached'}
                      </span>
                      <button
                        onClick={() => handleSectionChange('residential', 'proofDocument', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: FINANCIAL ───────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Step 4: Financial & Affordability</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Provide income details to confirm rent affordability.</p>
                </div>
                <span className="text-xs font-bold text-[#136C9E] bg-blue-50 px-3 py-1 rounded-full">
                  Step 4 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Net Income (£) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                    <input
                      type="number"
                      required
                      value={formData.financial.monthlyIncome}
                      onChange={e => handleSectionChange('financial', 'monthlyIncome', e.target.value)}
                      placeholder="3500"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Proof of Income Type</label>
                  <select
                    value={formData.financial.proofOfIncomeType}
                    onChange={e => handleSectionChange('financial', 'proofOfIncomeType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                  >
                    <option value="Payslips">Recent Payslips (Last 3 months)</option>
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Tax Return">SA302 / Tax Return (Self-Employed)</option>
                    <option value="Accountant Letter">Accountant Verification Letter</option>
                  </select>
                </div>
              </div>

              {/* Proof of Income Upload */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Upload Proof of Income Document
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#136C9E] transition-colors relative bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('financial', 'proofOfIncomeDocument', file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">Click or drag payslip or bank statement</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, PNG or JPEG</p>
                </div>
                {uploadingSection === 'financial_proofOfIncomeDocument' && (
                  <p className="text-xs text-[#136C9E] flex items-center gap-1 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document…
                  </p>
                )}
                {formData.financial.proofOfIncomeDocument && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2.5 mt-2 text-xs text-green-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {formData.financial.proofOfIncomeDocument.name || 'Income Document Attached'}
                    </span>
                    <button
                      onClick={() => handleSectionChange('financial', 'proofOfIncomeDocument', null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: GUARANTOR ───────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Step 5: Guarantor (Optional)</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Include a guarantor if required for your tenancy.</p>
                </div>
                <span className="text-xs font-bold text-[#136C9E] bg-blue-50 px-3 py-1 rounded-full">
                  Step 5 of 5
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.guarantor.hasGuarantor}
                    onChange={e => handleSectionChange('guarantor', 'hasGuarantor', e.target.checked)}
                    className="w-4 h-4 text-[#136C9E] rounded border-gray-300 focus:ring-[#136C9E]"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">I have a guarantor for this tenancy</p>
                    <p className="text-xs text-gray-500">Check this box if your landlord requires a guarantor.</p>
                  </div>
                </label>
              </div>

              {formData.guarantor.hasGuarantor && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Guarantor First Name *</label>
                      <input
                        type="text"
                        value={formData.guarantor.firstName}
                        onChange={e => handleSectionChange('guarantor', 'firstName', e.target.value)}
                        placeholder="e.g. Robert"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Guarantor Last Name</label>
                      <input
                        type="text"
                        value={formData.guarantor.lastName}
                        onChange={e => handleSectionChange('guarantor', 'lastName', e.target.value)}
                        placeholder="e.g. Johnson"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Guarantor Email *</label>
                      <input
                        type="email"
                        value={formData.guarantor.email}
                        onChange={e => handleSectionChange('guarantor', 'email', e.target.value)}
                        placeholder="robert@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Guarantor Phone</label>
                      <input
                        type="tel"
                        value={formData.guarantor.phoneNumber}
                        onChange={e => handleSectionChange('guarantor', 'phoneNumber', e.target.value)}
                        placeholder="07123 456789"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#136C9E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Review & Consent Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-gray-700 space-y-1.5">
                <p className="font-bold text-gray-900">Summary & Authorization</p>
                <p>
                  By clicking <strong>Submit Application</strong>, you authorize Proptii to share your referencing passport and documents with <strong>{inviteMeta.landlordName}</strong> for referencing purposes.
                </p>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                currentStep === 1
                  ? 'invisible'
                  : 'text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={!isStepValid(currentStep) || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#136C9E] text-white text-xs font-bold hover:bg-[#0D4E73] shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : currentStep === 5 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Submit Application
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferencingInvitePage;
