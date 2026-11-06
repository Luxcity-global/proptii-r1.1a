import React, { useState, useEffect, useRef } from 'react';
import { X, User as UserIcon, Users, Mail, Search, PenLine, FileText, Send, Check, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UserService, { User } from '../../services/userService';
import contractEmailService from '../../services/contractEmailService';
import signedContractsFirestoreService from '../../services/signedContractsFirestoreService';
import contractSyncService from '../../services/contractSyncService';
import { uploadToFirebaseStorage } from '../../services/storageService';
import { buildSignedContractSave } from '../../services/signedContractHandoff';

interface SendContractProps {
  contractData: {
    title?: string;
    content: string;
    extractedFields?: {
      landlord?: string;
      tenant?: string;
      propertyAddress?: string;
      startDate?: string;
    };
  };
  signedPdfBytes?: Uint8Array | null;
  /** When true, Send Contract click shows sign-up modal instead of sending. */
  interceptWithSignUp?: boolean;
  /** Called when Send Contract is clicked and interceptWithSignUp is true. */
  onInterceptSignUp?: () => void;
  onSend: (recipients: string[], signature?: File) => void;
  onClose?: () => void;
  initialRecipient?: { name: string; email: string };
  sourceContract?: {
    id: string;
    title?: string;
    propertyAddress?: string;
    tenantName?: string;
    tenantEmail?: string;
    landlordEmail?: string;
    landlordId?: string;
    contractType?: string;
  };
  /** When set, the form can be submitted by a button outside this component and the inline send button is hidden. */
  formId?: string;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Takes the user back to the signing step. */
  onReviewSignature?: () => void;
}

type ContractRecipient = {
  name: string;
  email: string;
};

type RegistrationState = {
  checked: boolean;
  registered: boolean;
  /** True when the lookup could not be completed. Do not call the address unregistered. */
  unknown: boolean;
};

type RecipientMode = 'existing' | 'manual';

const emailLooksComplete = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
const emailKey = (value: string) => value.trim().toLowerCase();

const directoryUser = (raw: Partial<User> | null | undefined): User | null => {
  const email = String(raw?.email || '').trim();
  if (!email.includes('@')) return null;
  return {
    id: String(raw?.id || email),
    name: String(raw?.name || email).trim(),
    email,
    role: raw?.role,
  };
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const SendContract: React.FC<SendContractProps> = ({
  contractData,
  signedPdfBytes,
  interceptWithSignUp,
  onInterceptSignUp,
  onSend,
  onClose,
  initialRecipient,
  sourceContract,
  formId,
  onSubmittingChange,
  onReviewSignature,
}) => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<ContractRecipient[]>(() =>
    initialRecipient?.email && emailLooksComplete(initialRecipient.email)
      ? [{ name: initialRecipient.name || initialRecipient.email, email: initialRecipient.email.trim() }]
      : [],
  );
  const [registration, setRegistration] = useState<Record<string, RegistrationState>>({});
  const [mode, setMode] = useState<RecipientMode>('existing');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    sent: ContractRecipient[];
    failed: string[];
    reference?: string;
  } | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const lookupSeq = useRef<Record<string, number>>({});

  const documentName = contractData.title || 'Contract Document';

  const setSubmitting = (value: boolean) => {
    setIsSubmitting(value);
    onSubmittingChange?.(value);
  };

  const verifyRecipientEmail = (email: string) => {
    const key = emailKey(email);
    if (!emailLooksComplete(key)) return;
    const seq = (lookupSeq.current[key] || 0) + 1;
    lookupSeq.current[key] = seq;
    setRegistration((prev) => ({ ...prev, [key]: { checked: false, registered: false, unknown: false } }));

    void (async () => {
      const result = await UserService.checkRegisteredEmail(key);
      if (lookupSeq.current[key] !== seq) return;
      if (!result.success || result.uncertain) {
        setRegistration((prev) => ({ ...prev, [key]: { checked: true, registered: false, unknown: true } }));
        return;
      }
      setRegistration((prev) => ({ ...prev, [key]: { checked: true, registered: result.exists, unknown: false } }));
      if (result.name) {
        setRecipients((prev) =>
          prev.map((item) =>
            emailKey(item.email) === key && (!item.name.trim() || emailKey(item.name) === key)
              ? { ...item, name: result.name as string }
              : item,
          ),
        );
      }
    })();
  };

  // Suggestions come from the directory when the caller can list users.
  // Registration itself is checked per email so a failed directory load cannot
  // mark a real account as unregistered.
  useEffect(() => {
    const loadUsers = async () => {
      const currentUser = directoryUser(user ? {
        id: user.id || 'current-user',
        name: user.name || 'Current User',
        email: user.email || '',
        role: 'user',
      } : null);

      try {
        const result = await UserService.getAllUsers();
        const payload = result.users as User[] | { users?: User[] } | undefined;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.users)
            ? payload.users
            : [];
        const directory = list
          .map((person) => directoryUser(person))
          .filter((person): person is User => Boolean(person));
        if (result.success && directory.length > 0) {
          setUsers(directory);
          return;
        }
      } catch (error) {
        console.error('SendContract - user directory unavailable:', error);
      }

      setUsers(currentUser ? [currentUser] : []);
    };

    loadUsers();
  }, [user]);

  useEffect(() => {
    recipients.forEach((recipient) => verifyRecipientEmail(recipient.email));
    // Prefill (for example the landlord who sent the contract) is checked once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const addRecipient = (name: string, email: string): boolean => {
    const cleanEmail = email.trim();
    if (!emailLooksComplete(cleanEmail)) return false;
    const key = emailKey(cleanEmail);
    if (recipients.some((item) => emailKey(item.email) === key)) return true;
    setRecipients((prev) => [...prev, { name: name.trim() || cleanEmail, email: cleanEmail }]);
    if (!registration[key]) verifyRecipientEmail(cleanEmail);
    return true;
  };

  const removeRecipient = (email: string) => {
    const key = emailKey(email);
    setRecipients((prev) => prev.filter((item) => emailKey(item.email) !== key));
  };

  const selectUser = (selected: User) => {
    addRecipient(selected.name, selected.email);
    setSearchQuery('');
    setShowResults(false);
  };

  const addManualRecipient = () => {
    setFormError(null);
    if (!draftName.trim() || !draftEmail.trim()) {
      setFormError('Enter both the recipient name and email.');
      return;
    }
    if (!addRecipient(draftName, draftEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }
    setDraftName('');
    setDraftEmail('');
  };

  const needle = searchQuery.trim().toLowerCase();
  const chosenKeys = new Set(recipients.map((item) => emailKey(item.email)));
  const searchResults = users
    .filter((person) => !chosenKeys.has(emailKey(person.email)))
    .filter((person) =>
      !needle ||
      String(person.name || '').toLowerCase().includes(needle) ||
      String(person.email || '').toLowerCase().includes(needle),
    )
    .slice(0, 25);
  const typedEmailIsNew = emailLooksComplete(searchQuery) && !chosenKeys.has(emailKey(searchQuery));

  // Handle form submission
  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    const validRecipients = [...recipients];
    if (draftName.trim() && emailLooksComplete(draftEmail) && !chosenKeys.has(emailKey(draftEmail))) {
      validRecipients.push({ name: draftName.trim(), email: draftEmail.trim() });
    }

    if (validRecipients.length === 0) {
      setFormError('Add at least one recipient with a name and email.');
      return;
    }

    // Check if document is signed
    if (!signedPdfBytes) {
      setFormError('Sign the document before sending it. Go back to Review & Sign.');
      return;
    }

    // Demo mode: intercept and show sign-up modal instead of sending
    if (interceptWithSignUp && onInterceptSignUp) {
      onInterceptSignUp();
      return;
    }

    setSubmitting(true);
    try {
      // Send emails to all recipients with the signed PDF
      console.log('📧 Sending signed contract emails to', validRecipients.length, 'recipient(s)...');
      
      const emailPromises = validRecipients.map(async (recipient) => {
        try {
          const emailResult = await contractEmailService.sendSignedContractEmail({
            to: recipient.email,
            recipientName: recipient.name,
            contractName: contractData.title || 'Contract Document',
            signedPdfBytes: signedPdfBytes,
            documentName: `${(contractData.title || 'contract').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`,
            senderName: 'Proptii Team',
            senderEmail: 'noreply@proptii.com',
            message,
          });
          
          if (emailResult.success) {
            console.log(`✅ Email sent successfully to ${recipient.email}:`, emailResult.messageId);
            return { success: true, email: recipient.email };
          } else {
            console.error(`❌ Email sending failed for ${recipient.email}:`, emailResult.error);
            return { success: false, email: recipient.email, error: emailResult.error };
          }
        } catch (error) {
          console.error(`❌ Error sending email to ${recipient.email}:`, error);
          return { success: false, email: recipient.email, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const successfulEmails = emailResults.filter(r => r.success);
      const failedEmails = emailResults.filter(r => !r.success);

      // Check if any recipients are landlords/agents
      console.log('🔍 Checking if recipients are landlords/agents...');
      const recipientEmailList = validRecipients.map(r => r.email);
      const landlordCheck = await contractSyncService.checkRecipientsForLandlords(recipientEmailList);
      
      if (landlordCheck.hasLandlords && landlordCheck.landlords.length > 0) {
        console.log('✅ Found landlord/agent recipients:', landlordCheck.landlords.length);
        console.log('📋 Landlords:', landlordCheck.landlords.map(l => `${l.name} (${l.email})`).join(', '));
      }

      // Save or update contract in Firestore with complete data including signed PDF
      console.log('🔄 Saving signed contract to Firestore via Send button...');
      let savedContractId: string | undefined;
      
      try {
        if (!user?.id) throw new Error('You must be signed in to save a contract.');
        const userId = user.id;
        
        // Keep the signed PDF as bytes and upload that file. Do not encode it.
        const pdfArrayBuffer = signedPdfBytes.buffer instanceof ArrayBuffer
          ? signedPdfBytes.buffer.slice(
              signedPdfBytes.byteOffset,
              signedPdfBytes.byteOffset + signedPdfBytes.byteLength
            )
          : new ArrayBuffer(signedPdfBytes.length);
        
        // If we created a new buffer, copy the data
        if (!(signedPdfBytes.buffer instanceof ArrayBuffer)) {
          const uint8View = new Uint8Array(pdfArrayBuffer);
          uint8View.set(signedPdfBytes);
        }
        
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

        console.log('☁️ Uploading signed document to storage...');
        const file = new File([pdfBlob], `${(contractData.title || 'contract').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`, { type: 'application/pdf' });
        const uploadRes = await uploadToFirebaseStorage(file, 'contracts');
        if (!uploadRes.success || !uploadRes.url || !/^https?:\/\//i.test(uploadRes.url)) {
          throw new Error(uploadRes.error || 'Could not store the signed contract.');
        }
        const finalDocumentUrl = uploadRes.url;
        
        // Save complete contract data to Firestore
        const signedContractData = {
          ...buildSignedContractSave({
            source: sourceContract,
            title: contractData.title,
            propertyAddress: contractData.extractedFields?.propertyAddress,
            recipientName: validRecipients[0].name,
            recipientEmail: validRecipients[0].email,
            signerName: user?.name,
            signerEmail: user?.email,
            uploadedUrl: finalDocumentUrl,
            byteLength: signedPdfBytes.length,
          }),
          signedDate: new Date().toISOString(),
          emailSentDate: new Date().toISOString(),
        };
        
        const result = await signedContractsFirestoreService.saveSignedContract(userId, signedContractData);
        
        if (result.success && result.contractId) {
          console.log('✅ Signed contract saved to Firestore successfully:', result.contractId);
          savedContractId = result.contractId;
          const savedContract = await signedContractsFirestoreService.getSignedContractById(result.contractId);
          if (savedContract.success && savedContract.contract) {
            const landlordEmails = validRecipients.map(r => r.email);
            const syncResult = await contractSyncService.syncToMultipleLandlords(
              savedContract.contract,
              landlordEmails
            );
            if (syncResult.success) {
              console.log(`✅ Contract is visible to ${syncResult.syncedCount} recipient(s)`);
            }
          }
        } else {
          console.error('❌ Failed to save signed contract to Firestore:', result.error);
        }
      } catch (firestoreError) {
        console.error('❌ Error saving contract to Firestore:', firestoreError);
        // Continue even if Firestore save fails - emails are more important
      }
      
      // Call the original onSend function
      const emails = validRecipients.map(r => r.email);
      onSend(emails);
      
      if (successfulEmails.length > 0) {
        const sentKeys = new Set(successfulEmails.map((r) => emailKey(r.email)));
        setReceipt({
          sent: validRecipients.filter((r) => sentKeys.has(emailKey(r.email))),
          failed: failedEmails.map((r) => r.email),
          reference: savedContractId,
        });
      } else {
        setFormError('The contract could not be emailed to any recipient. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error sending contract:', error);
      setFormError('Error sending contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pillClass = (value: RecipientMode) =>
    `flex-1 sm:flex-initial justify-center px-3 py-1.5 sm:py-1 text-[11px] rounded-lg transition-all flex items-center gap-1 ${
      mode === value ? 'font-bold bg-[#136C9E] text-white shadow-sm' : 'font-semibold text-slate-600 hover:text-slate-900'
    }`;

  const registrationLabel = (email: string) => {
    const state = registration[emailKey(email)];
    if (!state || !state.checked) return { text: 'Checking registration…', className: 'text-slate-400' };
    if (state.unknown) return null;
    if (state.registered) return { text: 'Registered user', className: 'text-emerald-700' };
    return { text: 'Not registered yet. They will need to create an account.', className: 'text-[#DC5F12]' };
  };

  const inputClass =
    'w-full text-base sm:text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20';

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4 font-nunito-sans">
        {!signedPdfBytes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-archivo font-bold text-xs text-amber-900">Document signature incomplete</div>
                <div className="text-xs text-amber-700">Sign the document before you send it.</div>
              </div>
            </div>
            {onReviewSignature && (
              <button
                type="button"
                onClick={onReviewSignature}
                className="px-3.5 py-1.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold transition-all shrink-0 shadow-sm"
              >
                Sign now →
              </button>
            )}
          </div>
        )}

        {/* Recipients */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="font-archivo font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#136C9E] shrink-0" />
              Recipient{recipients.length > 1 ? 's' : ''} *
            </span>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button type="button" onClick={() => setMode('existing')} className={pillClass('existing')}>
                <Users className="w-3 h-3 shrink-0" />
                Existing User
              </button>
              <button type="button" onClick={() => setMode('manual')} className={pillClass('manual')}>
                <PenLine className="w-3 h-3 shrink-0" />
                Manual Entry
              </button>
            </div>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2">
              {recipients.map((recipient) => {
                const status = registrationLabel(recipient.email);
                return (
                  <div
                    key={emailKey(recipient.email)}
                    className="bg-blue-50/50 border border-[#bcd9ea] rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#136C9E] text-white font-archivo font-bold text-xs flex items-center justify-center shrink-0">
                        {initialsOf(recipient.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-archivo font-bold text-xs text-slate-900 truncate">{recipient.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{recipient.email}</div>
                        {status && <div className={`text-[10px] font-semibold ${status.className}`}>{status.text}</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.email)}
                      className="text-xs font-semibold text-[#136C9E] hover:text-[#0f567e] hover:underline px-2 py-1 shrink-0"
                      aria-label={`Remove ${recipient.name}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'existing' ? (
            <div ref={searchWrapRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchResults[0]) selectUser(searchResults[0]);
                      else if (typedEmailIsNew) {
                        addRecipient(searchQuery, searchQuery);
                        setSearchQuery('');
                      }
                    }
                  }}
                  placeholder={recipients.length ? 'Add another recipient by name or email…' : 'Search by name or email…'}
                  className="w-full text-base sm:text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {showResults && (
                <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => selectUser(person)}
                      className="w-full text-left p-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-[#136C9E] font-archivo font-bold text-[10px] flex items-center justify-center shrink-0">
                          {initialsOf(person.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-archivo font-bold text-xs text-slate-900 truncate">{person.name}</span>
                          <span className="block text-[11px] text-slate-500 truncate">{person.email}</span>
                        </span>
                      </span>
                      <span className="text-xs text-[#136C9E] font-bold shrink-0">Select</span>
                    </button>
                  ))}
                  {typedEmailIsNew && (
                    <button
                      type="button"
                      onClick={() => { addRecipient(searchQuery, searchQuery); setSearchQuery(''); setShowResults(false); }}
                      className="w-full text-left p-2.5 hover:bg-blue-50/70 transition-colors flex items-center gap-2 text-xs text-slate-700"
                    >
                      <UserPlus className="w-4 h-4 text-[#136C9E]" />
                      Add <strong className="truncate">{searchQuery.trim()}</strong>
                    </button>
                  )}
                  {searchResults.length === 0 && !typedEmailIsNew && (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {needle ? `No users match "${searchQuery}". Switch to Manual Entry above.` : 'No users to suggest. Switch to Manual Entry above.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="send-contract-name" className="block text-[11px] font-semibold text-slate-600 mb-1">Recipient Name *</label>
                  <div className="relative">
                    <input
                      id="send-contract-name"
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className={inputClass}
                    />
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label htmlFor="send-contract-email" className="block text-[11px] font-semibold text-slate-600 mb-1">Recipient Email *</label>
                  <div className="relative">
                    <input
                      id="send-contract-email"
                      type="email"
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRecipient(); } }}
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={addManualRecipient}
                className="text-xs font-bold text-[#DC5F12] hover:text-[#ba4e0b] flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add recipient
              </button>
            </div>
          )}
        </div>

        {/* Contract document */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-archivo font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#DC5F12]" />
              Contract Document
            </span>
            {signedPdfBytes ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Signed &bull; Ready
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Signature required
              </span>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 font-bold text-[10px] flex items-center justify-center shrink-0">PDF</div>
              <div className="min-w-0">
                <div className="font-archivo font-bold text-xs text-slate-900 truncate" title={documentName}>{documentName}</div>
                <div className="text-[11px] text-slate-500">
                  {signedPdfBytes ? `${formatBytes(signedPdfBytes.length)} • Signed by you` : 'Not signed yet'}
                </div>
              </div>
            </div>
            {onReviewSignature && (
              <button
                type="button"
                onClick={onReviewSignature}
                className="text-xs font-semibold text-slate-500 hover:text-[#136C9E] px-2 py-1 transition-colors shrink-0"
              >
                {signedPdfBytes ? 'Review' : 'Sign'}
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="send-contract-message" className="font-archivo font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <PenLine className="w-3.5 h-3.5 text-slate-500" />
              Message to Recipient
            </label>
            <span className="text-[10px] font-semibold text-slate-400">Optional</span>
          </div>
          <textarea
            id="send-contract-message"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add any instructions or a personal message for the recipient…"
            className="w-full text-base sm:text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#136C9E]/20 transition-all leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">Each recipient gets an email with the signed PDF attached.</p>
        </div>

        {formError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {formError}
          </div>
        )}

        {!formId && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!signedPdfBytes || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Sending…' : 'Send Contract'}
            </button>
          </div>
        )}
      </form>

      {receipt && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-nunito-sans">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-200 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Check className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <h3 className="font-archivo font-extrabold text-lg text-slate-900 tracking-tight">Contract Sent!</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sent to {receipt.sent.map((r) => `${r.name} (${r.email})`).join(', ')} and added to your signed contracts.
            </p>

            <div className="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left my-4 space-y-1.5 text-xs">
              {receipt.reference && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono font-bold text-slate-800 truncate">{receipt.reference}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Document:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={documentName}>{documentName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-700 font-bold">Email sent</span>
              </div>
              {receipt.failed.length > 0 && (
                <div className="pt-1.5 text-[11px] text-red-600">
                  Could not email: {receipt.failed.join(', ')}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                onClose?.();
              }}
              className="w-full py-2.5 rounded-xl bg-[#DC5F12] hover:bg-[#ba4e0b] text-white text-xs font-bold shadow-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SendContract;
