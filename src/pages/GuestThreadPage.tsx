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
      setError(err.message || 'Failed to send message. Please try again.');
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

  const isLimitReached = thread ? thread.limit_reached : false;

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
        
        {/* Claim Account Container - Email Version */}
        {showResendClaim && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm flex flex-col items-center text-center">
            
            {/* Centered Logo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <img src="/images/Proptii-logo-icon.png" alt="Proptii Icon" className="h-8 w-auto" />
                <div className="flex items-center">
                  <span className="text-3xl font-black text-[#002B49] tracking-tight leading-none">prop</span>
                  <span className="text-3xl font-black text-[#F15A22] tracking-tight leading-none">tii</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FFF8F1] border border-[#FFE4CC] rounded-xl p-4 flex items-start gap-3 w-full max-w-[500px] text-left mb-8">
               <ShieldAlert className="w-5 h-5 text-[#E85D04] flex-shrink-0 mt-0.5" />
               <div>
                 <h4 className="text-sm font-bold text-[#D95B00]">Guest Communication Mode</h4>
                 <p className="text-xs text-[#D95B00] mt-0.5">
                   You are messaging as a guest. Claim your account to unlock unlimited replies.
                 </p>
               </div>
            </div>
            
            <h3 className="text-[22px] font-bold text-gray-900 mb-3">Claim Your Guest Account</h3>
            <p className="text-sm text-gray-600 mb-8 max-w-[420px] leading-relaxed">
              We'll send a verification link to your email to merge this guest chat into a permanent Proptii account. Enter the email you used for this enquiry.
            </p>

            {claimSentStatus === 'success' ? (
              <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-full max-w-[500px]">
                <CheckCircle2 className="w-5 h-5" />
                <span>Success! Check your email inbox for the claim link.</span>
              </div>
            ) : (
              <form onSubmit={handleResendClaim} className="flex flex-col sm:flex-row gap-3 w-full max-w-[500px]">
                <input
                  type="email"
                  value={emailForClaim}
                  onChange={(e) => setEmailForClaim(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#D95B00] transition-colors"
                />
                <button
                  type="submit"
                  disabled={claimSentStatus === 'sending'}
                  className="bg-[#D95B00] hover:bg-[#c45200] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {claimSentStatus === 'sending' ? 'Sending...' : 'Send Link'}
                </button>
              </form>
            )}
            {claimError && (
              <p className="text-sm text-red-600 mt-4">{claimError}</p>
            )}
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
                      {isMe ? `${message.sender_name} (you)` : message.sender_name}
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
                        {message.sender_name.charAt(0).toUpperCase()}
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
                <p className="text-xs leading-relaxed mt-0.5">
                  Guest conversations are limited to 20 messages. To keep replying and secure this conversation history, claim your permanent account using the verification email sent to you.
                </p>
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
