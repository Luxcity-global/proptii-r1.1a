import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2, Check } from 'lucide-react';
import quickRequestService, { ThreadDetails, ThreadMessage } from '../services/quickRequestService';

const GuestThreadPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<ThreadDetails | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [threadLimitReached, setThreadLimitReached] = useState(false);

  // Email resend claim state
  const [showResendClaim, setShowResendClaim] = useState(true);
  const [emailForClaim, setEmailForClaim] = useState('');
  const [claimSentStatus, setClaimSentStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchThreadData = async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setLoading(true);

    try {
      const data = await quickRequestService.getThread(token);
      setThread(data.thread);
      setMessages(data.messages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation history.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadData(true);
  }, [token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling every 10 seconds for new messages
  useEffect(() => {
    if (!pollingActive || !token) return;

    const interval = setInterval(() => {
      fetchThreadData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [pollingActive, token]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !thread || !replyText.trim() || replyText.trim().length < 10) return;

    setSending(true);
    setError(null);

    // Determine sender details
    // We assume the guest viewing this page is the tenant
    const senderType = 'ghost_tenant';
    const senderId = thread.ghost_tenant_id || 'guest-tenant-id';
    const senderName = thread.ghost_tenant_name ?? 'Guest Tenant';

    try {
      await quickRequestService.addReply(token, {
        message: replyText.trim(),
        senderType,
        senderId,
        senderName,
      });
      setReplyText('');
      // Refresh thread data immediately
      await fetchThreadData(false);
    } catch (err: any) {
      // P3-4: 429 means the 20-message ghost limit has been reached
      if (err?.response?.status === 429 || err?.message?.includes('limit')) {
        setThreadLimitReached(true);
        setPollingActive(false);
        setError(null);
      } else {
        setError(err.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleResendClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForClaim.trim()) return;

    setClaimSentStatus('sending');
    setClaimError(null);

    try {
      await quickRequestService.resendClaimToken(emailForClaim.trim());
      setClaimSentStatus('success');
    } catch (err: any) {
      setClaimError(err.message || 'Failed to resend claim link.');
      setClaimSentStatus('error');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isLimitReached = threadLimitReached || (thread ? thread.limit_reached : false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#D95B00] animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading conversation thread...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {thread?.listing_title || 'Property Enquiry'}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {thread?.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF7ED] border border-[#ffeedb] text-[#D95B00]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchThreadData(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Conversation Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col min-h-0">
        
        {/* Claim Account Container - Compact Banner */}
        {showResendClaim && (
          <div className="bg-gradient-to-r from-[#FFF8F1] to-white border border-[#FFE4CC] rounded-2xl p-5 mb-6 shadow-sm flex flex-col md:flex-row items-center gap-5 justify-between relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-[#FFE4CC]/40 to-transparent rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start gap-4 flex-1 z-10 w-full md:w-auto">
              <div className="bg-[#FFE4CC] p-3 rounded-2xl flex-shrink-0 shadow-sm border border-[#FFD6B3]">
                <ShieldAlert className="w-6 h-6 text-[#D95B00]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-gray-900">Guest Mode</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D95B00]/10 text-[#D95B00] uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
                  You are messaging as a guest. To unlock unlimited replies and secure your conversation history, please claim your permanent account.
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0 z-10">
              {claimSentStatus === 'success' ? (
                <div className="px-5 py-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Link Sent! Check your inbox.</span>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <form onSubmit={handleResendClaim} className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <input
                      type="email"
                      value={emailForClaim}
                      onChange={(e) => setEmailForClaim(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full sm:w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE4CC] focus:border-[#D95B00] transition-all bg-white shadow-sm placeholder:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={claimSentStatus === 'sending'}
                      className="bg-[#D95B00] hover:bg-[#c45200] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 whitespace-nowrap shadow-sm hover:shadow-md flex items-center justify-center min-w-[120px]"
                    >
                      {claimSentStatus === 'sending' ? 'Sending...' : 'Claim Account'}
                    </button>
                  </form>
                  {claimError && (
                    <p className="text-xs text-red-500 font-medium mt-2 animate-in fade-in slide-in-from-top-1">
                      {claimError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message History Container */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-sm min-h-[350px]">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No messages in this conversation yet.
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.sender_type === 'ghost_tenant' || message.sender_type === 'platform_tenant';
              
              // Show date divider if message is on a new day
              const showDateDivider = index === 0 || 
                formatDate(messages[index - 1].sent_at) !== formatDate(message.sent_at);

              return (
                <div key={message.id} className="space-y-2">
                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {formatDate(message.sent_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
                    <div className="text-[10px] text-gray-500 mb-1 px-1">
                      {isMe ? `${message.sender_name || 'User'} (you)` : (message.sender_name || 'User')}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-[13px] ${
                      isMe 
                        ? 'bg-[#F0F9FF] border border-[#E0F2FE] text-gray-800' 
                        : 'bg-[#F9FAFB] border border-gray-100 text-gray-800'
                    }`}>
                      <p className="leading-relaxed break-words whitespace-pre-wrap">
                        {message.body}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${isMe ? 'bg-[#D95B00]' : 'bg-[#A52A2A]'}`}>
                        {(message.sender_name || 'User').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Today - {formatTime(message.sent_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box */}
        <div className="mt-4">
          {isLimitReached ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start text-red-700 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Message Limit Reached</h4>
                <p className="text-xs leading-relaxed mt-0.5 mb-3">
                  Guest conversations are limited to 20 messages. Create a free Proptii account to continue this conversation and access your full history on any device.
                </p>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Create Free Account →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="relative flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:border-[#D95B00] transition-colors">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here (minimum 10 characters)..."
                required
                disabled={sending}
                rows={2}
                className="flex-1 border-0 focus:ring-0 focus:outline-none px-3 py-1.5 text-sm resize-none placeholder-gray-400 max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (replyText.trim().length >= 10 && !sending) {
                      handleSendReply(e);
                    }
                  }
                }}
              />
              <div className="flex flex-col items-end gap-1.5 pr-1 pb-1">
                <span className="text-[10px] font-medium text-gray-400 mr-2">
                  {replyText.length} / 1000
                </span>
                <button
                  type="submit"
                  disabled={replyText.trim().length < 10 || sending}
                  className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                    replyText.trim().length < 10 || sending
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-400 hover:text-[#D95B00] hover:bg-orange-50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default GuestThreadPage;
