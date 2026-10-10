/**
 * LandlordMessages — landlord inbox at /landlord/messages.
 * Requirements: 11.1–11.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Download, MessageSquare, Plus, Search, Settings, Sparkles, Edit, X, Loader2, ChevronDown } from 'lucide-react';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../contexts/AuthContext';
import communicationService from '../../../services/communicationService';
import MessageThread from '../../../components/messaging/MessageThread';
import ComposeBox from '../../../components/messaging/ComposeBox';
import AttachmentPill from '../../../components/messaging/AttachmentPill';
import type { Conversation, Message } from '../../../types/messaging';
import type { UserProfile } from '../App';
import { useTenants } from '../hooks/useTenants';
import '../styles/messagesPage.css';

type TabId = 'inbox' | 'unread' | 'draft';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarTone(name: string): 'sky' | 'orange' | 'green' | 'rose' | 'violet' {
  const tones = ['sky', 'orange', 'green', 'rose', 'violet'] as const;
  const sum = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return tones[sum % tones.length];
}

function isUnread(conv: Conversation, cursor: string | null): boolean {
  return conv.lastMessageAt !== null && (cursor === null || new Date(conv.lastMessageAt) > new Date(cursor));
}

function formatTime(iso: string | null): { label: string; fresh: boolean } {
  if (!iso) return { label: '', fresh: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: '', fresh: false };
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return { label: 'Just now', fresh: true };
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) {
    return {
      label: d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }),
      fresh: false,
    };
  }
  if (diffDays === 1) return { label: 'Yesterday', fresh: false };
  if (diffDays < 7) return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), fresh: false };
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), fresh: false };
}

interface TenantInboxProps {
  userProfile?: UserProfile | null;
  onViewInsights?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onAddTenant?: () => void;
  onBack?: () => void;
}

const EmptyState: React.FC<{ message: string; sub: string }> = ({ message, sub }) => (
  <div className="ll-msg-empty">
    <div className="ll-msg-empty-icon">
      <MessageSquare size={28} />
    </div>
    <h3>{message}</h3>
    <p>{sub}</p>
  </div>
);

export const TenantInbox: React.FC<TenantInboxProps> = ({
  userProfile,
  onViewInsights,
  onViewSettings,
  onViewNotifications,
  onAddTenant,
  onBack,
}) => {
  const { conversations, activeConversationId, setActiveConversationId, _setConversations, decrementUnreadCount } =
    useMessagingContext();
  const { user } = useAuth();
  // Note: useNavigate is from react-router-dom but the landlord app uses MemoryRouter.
  // Navigation is handled via the onBack prop instead.
  // We keep this import for compatibility if rendered outside MemoryRouter.
  let navigateFn: ((path: string) => void) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigateFn = useNavigate();
  } catch {
    navigateFn = null;
  }
  const handleBackToDashboard = () => {
    if (onBack) { onBack(); return; }
    if (navigateFn) navigateFn('/landlord/dashboard');
  };

  const [activeTab, setActiveTab] = useState<TabId>('inbox');
  const [search, setSearch] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Record<string, Array<{ message: Message; file?: File }>>>(
    {},
  );
  const [readCursors, setReadCursors] = useState<Record<string, string | null>>({});

  // ── New Message compose modal state ────────────────────────────────────────
  const [showCompose,        setShowCompose]        = useState(false);
  const [composeTenantId,    setComposeTenantId]    = useState('');
  const [composePropertyId,  setComposePropertyId]  = useState('');
  const [composePropertyTitle, setComposePropertyTitle] = useState('');
  const [composeTenantName,  setComposeTenantName]  = useState('');
  const [composeCreating,    setComposeCreating]    = useState(false);
  const [composeError,       setComposeError]       = useState<string | null>(null);
  const [tenantSearch,       setTenantSearch]       = useState('');
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  // Load tenants for the compose picker
  const { tenants: allTenants } = useTenants({
    userId: (user as any)?.id || (user as any)?.uid || null,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const optimisticBottomRef = useRef<HTMLDivElement>(null);
  // Track last seen lastMessageAt per conversation to detect when real messages arrive
  const lastSeenAt = useRef<Record<string, string | null>>({});
  // Track pending optimistic message IDs so we can clear them once MessageThread confirms load
  const pendingOptimisticIds = useRef<Record<string, Set<string>>>({});

  const scrollToBottom = useCallback(() => {
    optimisticBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // When the active conversation receives a new real message (lastMessageAt advances),
  // clear the optimistic messages for that conversation to prevent double-rendering.
  // IMPORTANT: only clear if we have previously seen a lastMessageAt for this conversation
  // (i.e. prev !== undefined), and the value has actually advanced. This prevents the
  // poller's 15-second tick from wiping optimistics before MessageThread has re-fetched.
  useEffect(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;
    const prev = lastSeenAt.current[activeConversationId];
    const now = conv.lastMessageAt;
    // prev === undefined → first time we see this conversation, just record and skip clear
    // prev === null or a timestamp → if now has advanced, schedule a delayed clear so
    // MessageThread has time to fetch the real messages first.
    if (prev !== undefined && now && now !== prev) {
      // Delay clearing optimistics to give MessageThread's useEffect time to fire and
      // load the real messages (avoids a flash of empty thread between send and fetch).
      setTimeout(() => {
        setOptimisticMessages((m) => ({ ...m, [activeConversationId]: [] }));
      }, 1500);
    }
    lastSeenAt.current[activeConversationId] = now;
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (conversations.length === 0) {
      communicationService
        .getConversations()
        .then((convs) => {
          if (convs.length > 0) _setConversations(convs);
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      // Do NOT clear optimistic messages here — they may belong to this conversation
      // if the user just sent a message and immediately clicked away and back.
      // Initialise lastSeenAt sentinel so the poller won't wipe optimistics on first tick.
      const conv = conversations.find((c) => c.id === id);
      if (!(id in lastSeenAt.current)) {
        lastSeenAt.current[id] = conv?.lastMessageAt ?? null;
      }
      const prevCursor = readCursors[id] ?? null;
      if (conv && isUnread(conv, prevCursor)) decrementUnreadCount(1);
      setReadCursors((prev) => ({ ...prev, [id]: new Date().toISOString() }));
      setMobileShowThread(true); // navigate to thread on mobile
    },
    [setActiveConversationId, conversations, readCursors, decrementUnreadCount],
  );

  const [mobileShowThread, setMobileShowThread] = useState(false);

  const handleSend = useCallback(
    (message: Message, file?: File) => {
      if (!activeConversationId) return;
      setOptimisticMessages((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] ?? []), { message, file }],
      }));
      setTimeout(scrollToBottom, 0);
    },
    [activeConversationId, scrollToBottom],
  );

  const handleSendError = useCallback(() => {
    if (!activeConversationId) return;
    // Remove the last optimistic message for this conversation (the one that failed)
    setOptimisticMessages((prev) => {
      const current = prev[activeConversationId] ?? [];
      return { ...prev, [activeConversationId]: current.slice(0, -1) };
    });
  }, [activeConversationId]);

  const currentUserId = user?.id ?? '';
  const userName = userProfile?.name || (user as { name?: string; displayName?: string } | null)?.name || (user as { displayName?: string } | null)?.displayName || 'Landlord';
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // ── Open a new conversation from the compose picker ────────────────────────
  const handleOpenCompose = async () => {
    setComposeError(null);
    setComposeTenantId('');
    setComposePropertyId('');
    setComposePropertyTitle('');
    setComposeTenantName('');
    setTenantSearch('');
    setShowTenantDropdown(false);
    setShowCompose(true);
  };

  const handleStartConversation = async () => {
    if (!composeTenantId || !currentUserId) return;
    setComposeCreating(true);
    setComposeError(null);
    try {
      const conv = await communicationService.getOrCreateConversation({
        propertyId:    composePropertyId || `direct-${composeTenantId}`,
        tenantId:      composeTenantId,
        landlordId:    currentUserId,
        propertyTitle: composePropertyTitle || 'Property',
        tenantName:    composeTenantName || 'Tenant',
      });
      setShowCompose(false);
      handleSelect(conv.id);
      _setConversations(prev => prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]);
    } catch {
      setComposeError('Could not start conversation. Please try again.');
    } finally {
      setComposeCreating(false);
    }
  };

  const unreadConvs = conversations.filter((c) => isUnread(c, readCursors[c.id] ?? null));
  const draftConvs = conversations.filter((c) => !c.lastMessageAt);

  const tabCounts: Record<TabId, number> = {
    inbox: conversations.length,
    unread: unreadConvs.length,
    draft: draftConvs.length,
  };

  const byTime = (a: Conversation, b: Conversation) =>
    new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();

  const visibleConvs: Conversation[] =
    activeTab === 'unread' ? [...unreadConvs].sort(byTime) : activeTab === 'draft' ? draftConvs : [...conversations].sort(byTime);

  const filteredConvs = visibleConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (conv.tenantName || '').toLowerCase();
    const property = (conv.propertyTitle || conv.propertyId || '').toLowerCase();
    return name.includes(q) || property.includes(q);
  });

  const emptyMessages: Record<TabId, { message: string; sub: string }> = {
    inbox: { message: 'No conversations', sub: 'Messages from tenants and applicants will appear here.' },
    unread: { message: 'No unread messages', sub: 'New messages from tenants will appear here.' },
    draft: { message: 'No drafts', sub: 'Conversations without messages will appear here.' },
  };

  const exportConversations = () => {
    const rows = [
      ['Name', 'Property', 'Last message', 'Tab'],
      ...filteredConvs.map((conv) => [
        conv.tenantName || 'Tenant',
        conv.propertyTitle || conv.propertyId || '',
        conv.lastMessageAt || '',
        activeTab,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `proptii-messages-${activeTab}.csv`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ll-msg" data-testid="landlord-messages-page">
      <header className="ll-msg-header">
        <div className="ll-msg-inner ll-msg-header-inner">
          <div>
            <h1>Messages</h1>
            <p>
              Messages and communication for <strong>{userName}</strong>
            </p>
          </div>
          <div className="ll-msg-header-actions">
            {onViewSettings ? (
              <button type="button" className="ll-msg-header-icon" title="Messaging settings" onClick={onViewSettings}>
                <Settings size={18} />
              </button>
            ) : null}
            {onViewNotifications ? (
              <button type="button" className="ll-msg-header-icon" title="Notifications" onClick={onViewNotifications}>
                <Bell size={18} />
                {unreadConvs.length > 0 ? <span className="ll-msg-header-dot" /> : null}
              </button>
            ) : null}
            {onViewInsights ? (
              <button type="button" className="ll-msg-btn-insights" onClick={onViewInsights}>
                <span className="ll-msg-insights-icon">
                  <Sparkles size={12} />
                </span>
                Portfolio Insights
              </button>
            ) : null}
            {onAddTenant ? (
              <button type="button" className="ll-msg-btn-insights" onClick={onAddTenant}
                title="Add a new tenant">
                <span className="ll-msg-insights-icon">
                  <Plus size={13} strokeWidth={2.5} />
                </span>
                Add Tenant
              </button>
            ) : null}
            {/* New Message — primary orange CTA */}
            <button type="button" className="ll-msg-btn-add" onClick={handleOpenCompose}
              title="Start a new conversation">
              <Edit size={15} strokeWidth={2.5} />
              New Message
            </button>
          </div>
        </div>
      </header>

      <div className="ll-msg-inner ll-msg-body">
        <div className="ll-msg-toolbar">
          <div className="ll-msg-tabs">
            {(
              [
                { id: 'inbox', label: 'Inbox' },
                { id: 'unread', label: 'Unread' },
                { id: 'draft', label: 'Drafts' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ll-msg-tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 ? <span className="ll-msg-tab-count">{tabCounts[tab.id]}</span> : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ll-msg-export"
            onClick={exportConversations}
            disabled={filteredConvs.length === 0}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        <div className={`ll-msg-split${mobileShowThread ? ' is-thread-active' : ''}`}>
          <aside className={`ll-msg-list${mobileShowThread ? ' ll-msg-list--hidden-mobile' : ''}`} aria-label="Conversations">
            <div className="ll-msg-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
              />
            </div>

            <div className="ll-msg-convs">
              {filteredConvs.length === 0 ? (
                <EmptyState {...emptyMessages[activeTab]} />
              ) : (
                filteredConvs.map((conv) => {
                  const name = !conv.tenantId
                    ? `${conv.tenantName || 'Guest'} (Guest)`
                    : conv.tenantName || 'Tenant';
                  const property = conv.propertyTitle || conv.propertyId || '';
                  const time = formatTime(conv.lastMessageAt);
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      data-testid="conversation-list-item"
                      data-conversation-id={conv.id}
                      className={`ll-msg-conv${conv.id === activeConversationId ? ' is-active' : ''}`}
                      onClick={() => handleSelect(conv.id)}
                      aria-pressed={conv.id === activeConversationId}
                      aria-label={`Conversation with ${name} about ${property || 'a property'}`}
                    >
                      <span className={`ll-msg-avatar ${avatarTone(name)}`}>{getInitials(name)}</span>
                      <div className="ll-msg-conv-main">
                        <div className="ll-msg-conv-top">
                          <h4>{name}</h4>
                          {time.label ? (
                            <span className={`ll-msg-conv-time${time.fresh ? ' is-now' : ''}`}>{time.label}</span>
                          ) : null}
                        </div>
                        {property ? <div className="ll-msg-conv-sub">{property}</div> : null}
                        {(conv as any).lastMessagePreview ? (
                          <div className="ll-msg-conv-preview">{(conv as any).lastMessagePreview}</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="ll-msg-back">
              <button type="button" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
          </aside>

          <main className={`ll-msg-thread${mobileShowThread ? ' ll-msg-thread--active-mobile' : ''}`} aria-label="Message thread">
            {activeConversationId ? (
              <>
                <div className="ll-msg-thread-head">
                  {/* Mobile back-to-list button */}
                  <button
                    type="button"
                    className="ll-msg-back-to-list"
                    onClick={() => setMobileShowThread(false)}
                    aria-label="Back to conversations"
                  >
                    ← Back
                  </button>
                  <span className={`ll-msg-avatar ${avatarTone(activeConversation?.tenantName || 'Tenant')}`}>
                    {getInitials(activeConversation?.tenantName || 'Tenant')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{activeConversation?.tenantName || 'Tenant'}</h3>
                    <p>{activeConversation?.propertyTitle || activeConversation?.propertyId || ''}</p>
                  </div>
                  {/* Export full conversation */}
                  <button
                    type="button"
                    title="Export conversation"
                    onClick={async () => {
                      if (!activeConversationId) return;
                      const { messages: msgs } = await communicationService.getMessages(activeConversationId);
                      const rows = [
                        ['Sender', 'Role', 'Time', 'Message'],
                        ...msgs.map((m: any) => [
                          m.senderId === currentUserId ? (userName || 'Landlord') : (activeConversation?.tenantName || 'Tenant'),
                          m.senderRole || '',
                          m.sentAt ? new Date(m.sentAt).toLocaleString('en-GB') : '',
                          (m.body || '').replace(/"/g, '""'),
                        ]),
                      ];
                      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `conversation-${activeConversation?.tenantName?.replace(/\s+/g,'-') || 'export'}.csv`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    style={{ flexShrink: 0, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
                  >
                    Export
                  </button>
                </div>

                <div ref={scrollContainerRef} className="ll-msg-feed">
                  <MessageThread
                    conversationId={activeConversationId}
                    currentUserId={currentUserId}
                    onScrollRequest={scrollToBottom}
                  />
                  {(optimisticMessages[activeConversationId] ?? []).map(({ message: msg, file }) => (
                    <div key={msg.id} data-testid="optimistic-message" className="ll-msg-optimistic">
                      <div className="ll-msg-optimistic-bubble">
                        {msg.body ? <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.body}</p> : null}
                        {file ? (
                          <AttachmentPill url={URL.createObjectURL(file)} fileName={file.name} sizeBytes={file.size} isSent />
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={optimisticBottomRef} />
                </div>

                <ComposeBox
                  conversationId={activeConversationId}
                  onSend={handleSend}
                  onSendError={handleSendError}
                  senderRole="landlord"
                  recipientId={activeConversation?.tenantId}
                />
              </>
            ) : (
              <EmptyState message="Select a conversation" sub="Choose a conversation from the list to start messaging." />
            )}
          </main>
        </div>
      </div>

      {/* ── New Message compose modal ──────────────────────────────────────── */}
      {showCompose && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 30px 32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', fontFamily: 'Archivo,sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>New Message</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>Start a conversation with a tenant</p>
              </div>
              <button type="button" onClick={() => setShowCompose(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={15} />
              </button>
            </div>

            {/* Tenant picker — searchable custom dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Tenant *
              </label>
              <div style={{ position: 'relative' }}>
                {/* Search input that doubles as display */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 44, border: `2px solid ${showTenantDropdown ? '#136C9E' : '#e2e8f0'}`, borderRadius: 12, padding: '0 12px', background: '#fff', cursor: 'text', boxSizing: 'border-box' }}
                  onClick={() => setShowTenantDropdown(true)}
                >
                  {composeTenantId && !showTenantDropdown ? (
                    <span style={{ flex: 1, fontSize: 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {composeTenantName}
                    </span>
                  ) : (
                    <input
                      autoFocus={showTenantDropdown}
                      value={tenantSearch}
                      onChange={e => { setTenantSearch(e.target.value); setShowTenantDropdown(true); }}
                      onFocus={() => setShowTenantDropdown(true)}
                      placeholder={composeTenantId ? composeTenantName : 'Search tenants…'}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', minWidth: 0 }}
                    />
                  )}
                  <ChevronDown size={15} style={{ color: '#94a3b8', flexShrink: 0, transform: showTenantDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>

                {/* Dropdown list */}
                {showTenantDropdown && (
                  <div
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 220, overflowY: 'auto' }}
                    onMouseDown={e => e.preventDefault()} // prevent blur
                  >
                    {/* Select all */}
                    <div
                      style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', cursor: 'default', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>{allTenants.filter(t => !tenantSearch || t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || (t.propertyAddress || '').toLowerCase().includes(tenantSearch.toLowerCase())).length} tenant{allTenants.length !== 1 ? 's' : ''}</span>
                      {composeTenantId && (
                        <button type="button" onClick={() => { setComposeTenantId(''); setComposeTenantName(''); setComposePropertyId(''); setComposePropertyTitle(''); setTenantSearch(''); }}
                          style={{ fontSize: 11, color: '#DC5F12', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Clear
                        </button>
                      )}
                    </div>

                    {allTenants
                      .filter(t => !tenantSearch || t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || (t.propertyAddress || '').toLowerCase().includes(tenantSearch.toLowerCase()))
                      .map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setComposeTenantId(t.id);
                            setComposeTenantName(t.name);
                            setComposePropertyId(t.propertyId || '');
                            setComposePropertyTitle(t.propertyAddress || '');
                            setTenantSearch('');
                            setShowTenantDropdown(false);
                          }}
                          style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: composeTenantId === t.id ? '#f0f8fd' : 'transparent', borderLeft: composeTenantId === t.id ? '3px solid #136C9E' : '3px solid transparent' }}
                          onMouseEnter={e => { if (composeTenantId !== t.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (composeTenantId !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span style={{ width: 32, height: 32, borderRadius: '50%', background: composeTenantId === t.id ? '#136C9E' : '#eaf3f8', color: composeTenantId === t.id ? '#fff' : '#136C9E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {t.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                            {t.propertyAddress && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.propertyAddress.split(',')[0]}</p>}
                          </div>
                          {composeTenantId === t.id && <span style={{ marginLeft: 'auto', color: '#136C9E', fontSize: 16, flexShrink: 0 }}>✓</span>}
                        </div>
                      ))
                    }

                    {allTenants.filter(t => !tenantSearch || t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || (t.propertyAddress || '').toLowerCase().includes(tenantSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '16px 14px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                        No tenants found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Click-outside to close */}
              {showTenantDropdown && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowTenantDropdown(false)} />
              )}
            </div>

            {/* Property override (optional) */}
            {composeTenantId && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Property (auto-filled)
                </label>
                <input
                  type="text"
                  value={composePropertyTitle}
                  onChange={e => setComposePropertyTitle(e.target.value)}
                  placeholder="Property address"
                  style={{ width: '100%', height: 44, border: '2px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {composeError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{composeError}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowCompose(false)}
                style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 14, color: '#64748b', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={handleStartConversation}
                disabled={!composeTenantId || composeCreating}
                style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: composeCreating || !composeTenantId ? '#94a3b8' : '#136C9E', color: '#fff', fontWeight: 600, fontSize: 14, cursor: composeTenantId && !composeCreating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {composeCreating ? <><Loader2 size={15} className="animate-spin" /> Opening…</> : 'Start Conversation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
