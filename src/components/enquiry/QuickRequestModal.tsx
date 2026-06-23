import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import quickRequestService from '../../services/quickRequestService';

interface QuickRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingSource: 'native' | 'scraped';
  landlordId?: string;
  agentEmail?: string;
  agentName?: string;
  sourcePlatform?: string;
}

const CATEGORIES = [
  'Book Viewing',
  'Property Price',
  'Availability',
  'Neighbourhood Info',
  'Mortgage Info',
  'Other',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const QuickRequestModal: React.FC<QuickRequestModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  listingSource,
  landlordId,
  agentEmail,
  agentName,
  sourcePlatform,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [threadToken, setThreadToken] = useState<string | null>(null);
  const [agentDelivery, setAgentDelivery] = useState<'sent' | 'no_contact_email'>('sent');
  const [copied, setCopied] = useState(false);
  const [editableAgentEmail, setEditableAgentEmail] = useState(agentEmail || '');
  const [touchedAgentEmail, setTouchedAgentEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditableAgentEmail(agentEmail || '');
      setName('');
      setEmail('');
      setMessage('');
      setSelectedCategories([]);
      setGdprConsent(false);
      setIsSuccess(false);
      setError(null);
      setTouchedEmail(false);
      setTouchedAgentEmail(false);
    }
  }, [isOpen, agentEmail]);

  if (!isOpen) return null;

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isAgentEmailValid = listingSource === 'scraped' ? EMAIL_REGEX.test(editableAgentEmail.trim()) : true;
  const isMessageValid = message.trim().length >= 10 && message.trim().length <= 1000;
  const isFormValid = isEmailValid && isMessageValid && gdprConsent && isAgentEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await quickRequestService.submitEnquiry({
        email: email.trim(),
        name: name.trim() || undefined,
        message: message.trim(),
        categories: selectedCategories,
        listingId,
        listingTitle,
        listingSource,
        landlordId,
        agentEmail: listingSource === 'scraped' ? editableAgentEmail.trim() : undefined,
        agentName,
        sourcePlatform,
        gdprConsent,
      });
      setThreadToken(result.threadToken);
      setAgentDelivery(result.agentDelivery || 'sent');
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`flex items-center ${isSuccess ? 'justify-end' : 'justify-between'} pb-4 border-b border-gray-100`}>
          {!isSuccess && <h3 className="text-xl font-bold text-gray-900">Quick Enquiry</h3>}
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-4">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">

              <h4 className="text-2xl font-bold text-[#4A5568] mb-4">Enquiry Sent</h4>
              <p className="text-gray-600 text-[15px] leading-relaxed mb-2">
                Your enquiry has been successfully forwarded, and a<br/>
                confirmation mail has been forwarded to the client.
              </p>
              <p className="text-gray-600 text-[15px] mb-8">
                You can check your inbox for further replies.
              </p>

              <div className="w-full bg-[#F8F9FA] rounded-2xl p-6 mb-6 text-left border border-gray-100">
                <p className="text-[#2D3748] font-bold text-base mb-2">Property of Interest :</p>
                <p className="text-[#4A5568] text-[15px] mb-6">{listingTitle}</p>
                
                <p className="text-[#2D3748] font-bold text-base mb-2">Your Mail:</p>
                <p className="text-[#4A5568] text-[15px]">{email}</p>
              </div>

              {agentDelivery === 'no_contact_email' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left mb-4 flex gap-2 items-start shadow-sm">
                  <span className="text-sm mt-0.5" role="img" aria-label="warning">⚠️</span>
                  <div>
                    <span className="font-bold">No Contact Email:</span> This agent hasn't published a contact email on their listing.
                    Your enquiry is saved on Proptii and we will try to deliver it if the agent claims their listing.
                    In the meantime, consider calling them directly.
                  </div>
                </div>
              )}

              {threadToken && (
                <div className="w-full bg-[#F0F9FF] rounded-2xl p-6 mb-6 text-left border border-[#E0F2FE]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[#0284C7]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <p className="text-[17px] font-bold text-[#0369A1]">Note: Instant Conversation Access</p>
                  </div>
                  <p className="text-[15px] text-[#4A5568] mb-6 leading-relaxed">
                    You can view and reply this message tread directly on our<br/>website without waiting for emails
                  </p>
                  
                  <div className="flex gap-3">
                    <a
                      href={`/thread/${threadToken}`}
                      className="bg-[#E85D04] hover:bg-[#DC5803] text-white font-medium py-2.5 px-5 rounded-full text-[15px] transition-colors flex items-center justify-center gap-2"
                    >
                      View Conversation
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </a>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/thread/${threadToken}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="border border-[#0284C7] text-[#0284C7] bg-transparent hover:bg-[#E0F2FE] font-medium py-2.5 px-5 rounded-full text-[15px] transition-colors flex items-center justify-center gap-2"
                    >
                      {copied ? 'Copied!' : 'Copy link'}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
              )}


            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Categories */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  What is your enquiry about? (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[#FFF7ED] border-[#D95B00] text-[#D95B00] font-semibold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D95B00] focus:ring-1 focus:ring-[#D95B00] transition-colors"
                />
              </div>

              {/* Agent/Landlord Email (only editable for scraped properties in development/test simulation) */}
              {listingSource === 'scraped' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Landlord / Agent Email (Simulation) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editableAgentEmail}
                    onChange={(e) => setEditableAgentEmail(e.target.value)}
                    onBlur={() => setTouchedAgentEmail(true)}
                    placeholder="agent@example.com"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                      touchedAgentEmail && !isAgentEmailValid
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-[#D95B00] focus:ring-[#D95B00]'
                    }`}
                  />
                  {touchedAgentEmail && !isAgentEmailValid && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Editable to simulate landlord claiming on your test email.
                  </p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouchedEmail(true)}
                  placeholder="Your Email Address"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                    touchedEmail && !isEmailValid
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-[#D95B00] focus:ring-[#D95B00]'
                  }`}
                />
                {touchedEmail && !isEmailValid && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hello, I would like to find out more about this property..."
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D95B00] focus:ring-1 focus:ring-[#D95B00] transition-colors resize-none"
                  />
                  <div className="absolute bottom-2.5 right-3 text-[10px] font-medium text-gray-400">
                    {message.length} / 1000
                  </div>
                </div>
                {message.length > 0 && message.length < 10 && (
                  <p className="text-xs text-amber-600 mt-1">Message must be at least 10 characters.</p>
                )}
              </div>

              {/* GDPR Consent */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="gdprConsent"
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D95B00] focus:ring-[#D95B00]"
                />
                <label htmlFor="gdprConsent" className="text-xs text-gray-500 leading-normal select-none">
                  I agree to Proptii sharing my details with the agent/landlord and consent to the{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D95B00] hover:underline">
                    Privacy Policy
                  </a>
                  . <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-[#D95B00] hover:bg-[#c45200]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Enquiry...</span>
                  </>
                ) : (
                  <span>Send Enquiry</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickRequestModal;
