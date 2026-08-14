import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  onSave: (data: { name: string; phone?: string }) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialName = '',
  initialEmail = '',
  initialPhone = '',
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPhone(initialPhone || '');
      setError(null);
      setSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen, initialName, initialPhone]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        name: trimmedName,
        phone: phone.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'Archivo, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#e0f2fe' }}
            >
              <User className="w-5 h-5" style={{ color: '#136C9E' }} />
            </div>
            <div>
              <h2 id="edit-profile-modal-title" className="text-lg font-bold text-gray-900 leading-tight">
                Edit Profile
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your account details and contact info
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                disabled={isLoading}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                required
              />
            </div>
          </div>

          {/* Email (Readonly) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="profile-email" className="block text-xs font-semibold text-gray-700">
                Email Address
              </label>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="profile-email"
                type="email"
                value={initialEmail}
                readOnly
                disabled
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed select-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Your email is linked to your authentication provider.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7123 456789"
                disabled={isLoading}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Used for viewing booking confirmations and urgent updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: '#DC5F12' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
