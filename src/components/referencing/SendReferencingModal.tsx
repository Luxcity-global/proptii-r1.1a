import React, { useState } from 'react';
import { 
  X, 
  Send, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3, 
  Plus,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { toast } from 'react-hot-toast';

interface SendReferencingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPassport?: () => void;
  onShareComplete?: (share: any) => void;
}

export const SendReferencingModal: React.FC<SendReferencingModalProps> = ({
  isOpen,
  onClose,
  onEditPassport,
  onShareComplete
}) => {
  const { user } = useAuth();
  const [recipientRole, setRecipientRole] = useState<'landlord' | 'agent'>('agent');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [hasAgreed, setHasAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSentShare, setLastSentShare] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setRecipientName('');
    setRecipientEmail('');
    setRecipientPhone('');
    setAgencyName('');
    setPropertyAddress('');
    setNotes('');
    setIsSuccess(false);
    setLastSentShare(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleCopyLink = () => {
    const viewToken = lastSentShare?.viewToken;
    if (!viewToken) return;
    const link = `${window.location.origin}/referencing/view/${viewToken}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      toast.error('Please enter the recipient name');
      return;
    }

    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    if (!hasAgreed) {
      toast.error('Please authorise sharing your referencing passport');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = user?.id || 'anonymous_tenant';
      const sharePayload = {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientPhone: recipientPhone.trim(),
        recipientRole,
        agencyName: recipientRole === 'agent' ? agencyName.trim() : '',
        propertyAddress: propertyAddress.trim(),
        notes: notes.trim(),
      };

      const result = await firestoreService.shareReferencingPassport(userId, sharePayload);

      if (result.success) {
        setIsSuccess(true);
        setLastSentShare(result.share || sharePayload);
        toast.success(`Referencing passport shared with ${recipientName}!`);
        if (onShareComplete) {
          onShareComplete(result.share || sharePayload);
        }
      } else {
        toast.error(result.error || 'Failed to share referencing passport');
      }
    } catch (err: any) {
      console.error('Error sharing referencing passport:', err);
      toast.error('Failed to share referencing passport. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 font-sans">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div 
          className="px-6 py-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #136C9E 0%, #0D4E73 100%)' }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Send Referencing Passport</h2>
              <p className="text-xs sm:text-sm text-blue-100/90">
                Share your verified referencing report with any landlord or agent
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Successfully Sent!</h3>
                <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                  Your referencing passport has been shared with{' '}
                  <span className="font-semibold text-gray-900">{lastSentShare?.recipientName || recipientName}</span>
                  {' '}({lastSentShare?.recipientEmail || recipientEmail}).
                  {' '}An email notification has been sent to them.
                </p>
              </div>

              {/* Share details */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-left text-xs text-gray-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient Role:</span>
                  <span className="font-medium capitalize">{lastSentShare?.recipientRole || recipientRole}</span>
                </div>
                {lastSentShare?.propertyAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Property:</span>
                    <span className="font-medium truncate max-w-[240px]">{lastSentShare.propertyAddress}</span>
                  </div>
                )}
                {lastSentShare?.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Link expires:
                    </span>
                    <span className="font-medium">
                      {new Date(lastSentShare.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Email status:</span>
                  <span className="inline-flex items-center text-green-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    Delivered
                  </span>
                </div>
              </div>

              {/* View link + copy */}
              {lastSentShare?.viewToken && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-left space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Shareable view link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 truncate font-mono">
                      {`${window.location.origin}/referencing/view/${lastSentShare.viewToken}`}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {copiedLink
                        ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy</>
                      }
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Anyone with this link can view the passport without logging in.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Send to Another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-all text-sm shadow-md"
                  style={{ backgroundColor: '#DC5F12' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Passport Ready Banner */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Your Referencing Passport is Loaded</h4>
                    <p className="text-[11px] text-gray-600">
                      Your saved documents & 5 verified sections will be shared with this recipient.
                    </p>
                  </div>
                </div>
                {onEditPassport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditPassport();
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {/* Recipient Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Sending To
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecipientRole('agent')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border font-medium text-sm transition-all ${
                      recipientRole === 'agent'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-800 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Letting Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientRole('landlord')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border font-medium text-sm transition-all ${
                      recipientRole === 'landlord'
                        ? 'border-orange-600 bg-orange-50/80 text-orange-800 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Direct Landlord
                  </button>
                </div>
              </div>

              {/* Recipient Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {recipientRole === 'agent' ? "Agent's Name *" : "Landlord's Name *"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={recipientRole === 'agent' ? "e.g. Sarah Jenkins" : "e.g. David Miller"}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="07123 456789"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Agency Name (if Agent) */}
              {recipientRole === 'agent' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Agency / Estate Agent Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Foxtons / Savills"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Target Property Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Property Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Flat 3, 24 Kensington High Street, London"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                  />
                </div>
              </div>

              {/* Personal Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Message / Cover Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Hi Sarah, please find my Proptii referencing passport attached for the 2-bed apartment."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#136C9E] text-sm"
                />
              </div>

              {/* Authorisation */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#136C9E] focus:ring-[#136C9E]"
                  />
                  <span className="text-xs text-gray-600 leading-snug">
                    I authorise sharing my verified referencing passport and uploaded documents with this recipient for tenancy evaluation.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                {onEditPassport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditPassport();
                    }}
                    className="w-full sm:w-auto text-xs text-gray-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Review / Edit My Passport Details
                  </button>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasAgreed}
                    className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#DC5F12' }}
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Referencing</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendReferencingModal;
