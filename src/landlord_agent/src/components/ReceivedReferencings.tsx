import React, { useEffect, useState } from 'react';
import { ShieldCheck, Eye, MessageSquare, Clock, CheckCircle2, ChevronRight, Loader2, User } from 'lucide-react';
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';

const API = getResolvedApiBaseUrl();

interface ReceivedShare {
  id: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  notes: string;
  status: 'sent' | 'viewed' | 'claimed';
  viewToken: string;
  claimToken: string;
  expiresAt: string;
  claimedBy: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  sent:    'bg-blue-100 text-blue-700',
  viewed:  'bg-green-100 text-green-700',
  claimed: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<string, string> = {
  sent:    'Received',
  viewed:  'Viewed',
  claimed: 'Connected',
};

interface Props {
  /** called when user wants to open messages for a specific conversation */
  onOpenMessages?: (conversationId?: string) => void;
}

const ReceivedReferencings: React.FC<Props> = ({ onOpenMessages }) => {
  const [shares, setShares]   = useState<ReceivedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessTokenForApiRequest();
        const res = await fetch(`${API}/referencing/received`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setShares(json.data || []);
      } catch {
        setError('Could not load received referencings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleView = (share: ReceivedShare) => {
    window.open(`/referencing/view/${share.viewToken}`, '_blank', 'noopener');
  };

  const handleMessage = async (share: ReceivedShare) => {
    // If already claimed, go straight to messages
    if (share.claimedBy && onOpenMessages) {
      onOpenMessages();
      return;
    }
    // Otherwise open ClaimReferencing to complete the setup
    window.open(`/claim-referencing?token=${share.claimToken}`, '_blank', 'noopener');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-[#136C9E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-4 text-center">{error}</div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6 text-[#136C9E]" />
        </div>
        <p className="font-semibold text-gray-800 text-sm">No referencing passports yet</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          When a tenant shares their referencing passport with you, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shares.map(share => (
        <div
          key={share.id}
          className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#136C9E]/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#136C9E]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{share.tenantName || 'Tenant'}</p>
                {share.propertyAddress && (
                  <p className="text-xs text-gray-500 truncate">{share.propertyAddress}</p>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[share.status] || STATUS_STYLES.sent}`}>
              {STATUS_LABELS[share.status] || 'Received'}
            </span>
          </div>

          {/* Notes */}
          {share.notes && (
            <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">"{share.notes}"</p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(share.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {share.expiresAt && new Date(share.expiresAt) > new Date() && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => handleView(share)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              View Passport
            </button>
            <button
              onClick={() => handleMessage(share)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#136C9E] text-white text-xs font-semibold hover:bg-[#0F5A82] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {share.claimedBy ? 'Messages' : 'Connect & Message'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceivedReferencings;
