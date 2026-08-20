import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  FileText, 
  User, 
  Home, 
  Briefcase, 
  Lock, 
  ArrowLeft,
  X,
  FileCheck,
  Building,
  Phone,
  Mail,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { uploadToFirebaseStorage } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'react-hot-toast';

export const GuarantorReferencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL parameters
  const token = searchParams.get('token') || '';
  const tenantId = searchParams.get('tenantId') || '';
  const tenantNameParam = searchParams.get('tenantName') || searchParams.get('applicant') || '';
  const tenantEmailParam = searchParams.get('tenantEmail') || '';
  const prefilledGuarantorEmail = searchParams.get('email') || searchParams.get('guarantorEmail') || '';
  const prefilledGuarantorName = searchParams.get('name') || searchParams.get('guarantorName') || '';
  const prefilledGuarantorPhone = searchParams.get('phone') || searchParams.get('guarantorPhone') || '';
  const prefilledRelationship = searchParams.get('relationship') || '';

  // Initial name splitting if provided
  const initialNameParts = prefilledGuarantorName.trim().split(' ');
  const initialFirstName = initialNameParts[0] || '';
  const initialLastName = initialNameParts.slice(1).join(' ') || '';

  // Form state
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: prefilledGuarantorEmail,
    phoneNumber: prefilledGuarantorPhone,
    address: '',
    postcode: '',
    employmentStatus: 'Employed',
    annualIncome: '',
    relationship: prefilledRelationship || 'Parent',
    otherRelationship: '',
    consent: 'agree' as 'agree' | 'disagree',
    reason: '',
    agreedToTerms: false,
    signature: ''
  });

  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState<boolean>(!!token);

  // Document state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [uploadedDocMeta, setUploadedDocMeta] = useState<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
  } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tenant display name
  const tenantName = inviteData?.tenantName || tenantNameParam || 'Applicant';
  const tenantEmail = inviteData?.tenantEmail || tenantEmailParam || '';

  // Determine if the email field should be locked (identifier)
  const isEmailLocked = Boolean(
    prefilledGuarantorEmail ||
    inviteData?.guarantorEmail ||
    (token && (formData.email || inviteData?.guarantorEmail))
  );

  // 1. Fetch invite metadata if token is provided
  useEffect(() => {
    let isMounted = true;

    const fetchInvite = async () => {
      if (!token) {
        setInviteLoading(false);
        return;
      }

      try {
        setInviteLoading(true);
        const res = await firestoreService.getGuarantorInvite(token);
        if (isMounted && res.success && res.invitation) {
          const inv = res.invitation;
          setInviteData(inv);

          const fullName = (inv.guarantorName || prefilledGuarantorName || '').trim();
          const nameParts = fullName.split(' ');
          const autoFirstName = nameParts[0] || '';
          const autoLastName = nameParts.slice(1).join(' ') || '';

          setFormData(prev => ({
            ...prev,
            email: inv.guarantorEmail || prefilledGuarantorEmail || prev.email,
            firstName: prev.firstName || autoFirstName,
            lastName: prev.lastName || autoLastName,
            phoneNumber: prev.phoneNumber || inv.guarantorPhone || prefilledGuarantorPhone || '',
            relationship: prev.relationship || prefilledRelationship || 'Parent'
          }));
        }
      } catch (err) {
        console.warn('Could not load invite from backend:', err);
      } finally {
        if (isMounted) setInviteLoading(false);
      }
    };

    fetchInvite();
    return () => { isMounted = false; };
  }, [token]);

  // 2. Synchronize query params into form state if changed
  useEffect(() => {
    if (prefilledGuarantorEmail || prefilledGuarantorName || prefilledGuarantorPhone) {
      const nameParts = prefilledGuarantorName.trim().split(' ');
      const autoFirst = nameParts[0] || '';
      const autoLast = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        email: prefilledGuarantorEmail || prev.email,
        firstName: prev.firstName || autoFirst,
        lastName: prev.lastName || autoLast,
        phoneNumber: prev.phoneNumber || prefilledGuarantorPhone || '',
        relationship: prefilledRelationship || prev.relationship || 'Parent'
      }));
    }
  }, [prefilledGuarantorEmail, prefilledGuarantorName, prefilledGuarantorPhone, prefilledRelationship]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentFile(file);
    const localUrl = URL.createObjectURL(file);
    setDocumentPreview(localUrl);
    setIsUploadingDoc(true);

    try {
      const result = await uploadToFirebaseStorage(file, 'referencing_documents/guarantor');
      if (result.success && result.url) {
        setUploadedDocUrl(result.url);
        setUploadedDocMeta({
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        });
        toast.success('Guarantor document uploaded successfully!');
      } else {
        toast.error('Upload failed, but your file is attached locally.');
      }
    } catch (err) {
      console.warn('Storage upload error:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
    setUploadedDocUrl(null);
    setUploadedDocMeta(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please enter your full first and last name.');
      toast.error('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.phoneNumber.trim()) {
      setErrorMessage('Please provide your contact email and phone number.');
      toast.error('Please provide your contact details.');
      return;
    }

    if (!formData.address.trim()) {
      setErrorMessage('Please provide your full residential address.');
      toast.error('Please provide your address.');
      return;
    }

    if (!formData.annualIncome.trim()) {
      setErrorMessage('Please provide your approximate annual income.');
      toast.error('Please enter your annual income.');
      return;
    }

    if (!formData.agreedToTerms) {
      setErrorMessage('Please check the declaration checkbox to confirm your agreement.');
      toast.error('Please confirm the declaration checkbox.');
      return;
    }

    if (!formData.signature.trim()) {
      setErrorMessage('Please type your full legal name as your digital signature.');
      toast.error('Please sign the declaration.');
      return;
    }

    setIsSubmitting(true);

    try {
      const responsePayload = {
        token: token || undefined,
        tenantId,
        tenantEmail,
        applicantName: tenantName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim() + (formData.postcode ? `, ${formData.postcode.trim()}` : ''),
        employmentStatus: formData.employmentStatus,
        annualIncome: formData.annualIncome,
        relationship: formData.relationship === 'Other' ? (formData.otherRelationship || 'Other') : formData.relationship,
        consent: formData.consent,
        reason: formData.reason || `Guarantor agreement signed by ${formData.signature}`,
        documentUrl: uploadedDocUrl || undefined,
        documentName: uploadedDocMeta?.name || documentFile?.name || undefined,
        documentType: uploadedDocMeta?.type || documentFile?.type || 'application/pdf',
        documentSize: uploadedDocMeta?.size || documentFile?.size || 0,
        identityDocument: uploadedDocUrl ? {
          name: uploadedDocMeta?.name || documentFile?.name || 'Guarantor_ID',
          type: uploadedDocMeta?.type || documentFile?.type || 'application/pdf',
          size: uploadedDocMeta?.size || documentFile?.size || 0,
          lastModified: Date.now(),
          url: uploadedDocUrl
        } : null
      };

      const result = await firestoreService.submitGuarantorResponse(responsePayload);

      if (result.success) {
        setSubmittedSuccess(true);
        setSubmissionId(result.id || `GR-${Date.now().toString().slice(-6)}`);
        toast.success('Guarantor verification submitted successfully!');
      } else {
        setErrorMessage(result.error || 'Failed to submit response. Please try again.');
        toast.error('Submission failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting guarantor form:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
      toast.error('An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-xl w-full p-8 md:p-10 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Guarantee Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Thank You, {formData.firstName}!
          </h1>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            Your guarantor information and verification have been successfully recorded and attached to <strong>{tenantName}</strong>'s rental application.
          </p>

          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 mb-8 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Applicant</span>
              <span className="font-semibold text-gray-800">{tenantName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Guarantor</span>
              <span className="font-semibold text-gray-800">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Reference Ref</span>
              <span className="font-mono font-bold text-[#136C9E]">{submissionId}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center text-green-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Submitted &amp; Verified
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl bg-[#136C9E] hover:bg-[#0D4E73] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Return to Proptii Home
            </button>
            <p className="text-xs text-gray-400">
              A confirmation email has been sent to <strong>{formData.email}</strong> and <strong>{tenantName}</strong> has been notified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#136C9E] flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Proptii <span className="text-[#DC5F12]">Referencing</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-green-600" />
            <span>256-Bit Encrypted &amp; Secure</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-[#136C9E] via-[#105C87] to-[#0D4E73] rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Guarantor Verification Request
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            Guarantor Confirmation for {tenantName}
          </h1>

          <p className="text-blue-100 text-sm sm:text-base max-w-xl leading-relaxed">
            <strong>{tenantName}</strong> has listed you as their guarantor for their rental application on Proptii. Please fill out your details below and confirm your agreement.
          </p>

          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-blue-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Takes ~3 minutes to complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Directly updates tenant's passport</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Please check the required fields:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Personal Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-xs">
            <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs text-gray-500">Your full legal name and contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Smith"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  {isEmailLocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-gray-500" />
                      Identifier (Non-editable)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    readOnly={isEmailLocked}
                    placeholder="guarantor@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      isEmailLocked
                        ? 'bg-gray-100/90 border-gray-200 text-gray-700 font-medium cursor-not-allowed select-none pl-10 shadow-none'
                        : 'border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none'
                    }`}
                  />
                  {isEmailLocked && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {isEmailLocked && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    This email is your verified guarantor identifier and cannot be modified.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="07123 456789"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Address & Financials */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-xs">
            <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Address &amp; Financial Information</h2>
                <p className="text-xs text-gray-500">Your address, income, and relationship to the applicant</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Residential Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="123 Example Street, City"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Relationship to {tenantName} <span className="text-red-500">*</span></label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white transition-all"
                >
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Family Member">Other Family Member</option>
                  <option value="Employer">Employer</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.relationship === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Specify Relationship</label>
                  <input
                    type="text"
                    name="otherRelationship"
                    value={formData.otherRelationship}
                    onChange={handleInputChange}
                    placeholder="e.g. Mentor / Partner"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Employment Status <span className="text-red-500">*</span></label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white transition-all"
                >
                  <option value="Employed">Full-time Employed</option>
                  <option value="Part-time">Part-time Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Retired">Retired</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Approx. Annual Income (£) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Document Upload */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-xs">
            <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Proof of Identification</h2>
                <p className="text-xs text-gray-500">Upload a clear photo or PDF of your Passport or Driving Licence</p>
              </div>
            </div>

            {!documentFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center hover:border-[#136C9E] bg-gray-50/50 hover:bg-blue-50/20 transition-all cursor-pointer">
                <input
                  type="file"
                  id="guarantor-doc-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="guarantor-doc-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#136C9E] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">
                    Click to browse or drag &amp; drop document
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports Passport, Driving Licence, National ID (PDF, JPG, PNG up to 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-green-200 bg-green-50/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-gray-800 truncate">{documentFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(documentFile.size / (1024 * 1024)).toFixed(2)} MB {isUploadingDoc ? '· Uploading...' : '· Attached'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeDocument}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Declaration & Signature */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-xs">
            <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Declaration &amp; Digital Signature</h2>
                <p className="text-xs text-gray-500">Please review and confirm your willingness to act as guarantor</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed">
                By submitting this form, I confirm that all information provided is accurate and true to the best of my knowledge. I understand that I am agreeing to act as a guarantor for <strong>{tenantName}</strong> in respect of their tenancy obligations, and that a reference check may be performed in accordance with UK right to rent and referencing guidelines.
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#136C9E] focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agreedToTerms" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  I confirm that I agree to act as a guarantor and verify that the above information is accurate. <span className="text-red-500">*</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Digital Signature (Type your full legal name) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Johnathan Smith"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-serif italic transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1">Typing your name acts as an electronic signature under the Electronic Communications Act.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Additional Comments / Notes (Optional)</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Any additional information or comments for the letting agent / landlord..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#136C9E] focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingDoc}
              className="w-full py-4 rounded-2xl bg-[#DC5F12] hover:bg-[#C45210] text-white font-extrabold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Guarantor Verification...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Submit Guarantor Guarantee</span>
                </div>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Protected by Proptii. An instant confirmation email will be sent upon submission.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default GuarantorReferencePage;
