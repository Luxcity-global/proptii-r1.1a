/**
 * TenantMessages — tenant inbox at /dashboard/messages.
 * Requirements: 10.1–10.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, MessageSquare, Search } from 'lucide-react';
import { useMessagingContext } from '../../contexts/MessagingContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageThread from '../../components/messaging/MessageThread';
import ComposeBox from '../../components/messaging/ComposeBox';
import AttachmentPill from '../../components/messaging/AttachmentPill';
import TenantPageHeader from '../../components/dashboard/ui/TenantPageHeader';
import type { Conversation, Message } from '../../types/messaging';
import '../../styles/tenantMessages.css';
import '../../styles/tenantModals.css';

type TabId = 'inbox' | 'read' | 'draft' | 'external';

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
  return conv.lastMessageAt !== null &&
    (cursor === null || new Date(conv.lastMessageAt) > new Date(cursor));
}

function participantName(conv: Conversation): string {
  return conv.landlordId === 'UNCLAIMED' ? 'External Agent' : 'Landlord';
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

const EmptyState: React.FC<{ message: string; sub: string }> = ({ message, sub }) => (
  <div className="tn-msg-empty">
    <div className="tn-msg-empty-icon">
      <MessageSquare size={28} />
    </div>
    <h3>{message}</h3>
    <p>{sub}</p>
  </div>
);

const TenantMessages: React.FC = () => {
  const { conversations, activeConversationId, setActiveConversationId, _setConversations, decrementUnreadCount, refreshConversations } = useMessagingContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabId>('inbox');
  const [search, setSearch] = useState('');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Record<string, Array<{ message: Message; file?: File }>>>({});
  const [readCursors, setReadCursors] = useState<Record<string, string | null>>({});
  const [prefilledDrafts, setPrefilledDrafts] = useState<Record<string, string>>({});
  const pendingConversationRef = useRef<{ id: string; conversation?: Conversation; prefilledMessage?: string } | null>(null);

  useEffect(() => {
    const state = location.state as { prefilledMessage?: string; conversationId?: string; conversation?: Conversation } | null;
    if (state?.conversationId) {
      const convId = state.conversationId;
      pendingConversationRef.current = {
        id: convId,
        conversation: state.conversation,
        prefilledMessage: state.prefilledMessage,
      };

      if (state.conversation) {
        _setConversations((prev) => {
          if (prev.some((c) => c.id === state.conversation!.id)) return prev;
          return [state.conversation!, ...prev];
        });
      }

      setActiveConversationId(convId);
      const isUnclaimed = state.conversation?.landlordId === 'UNCLAIMED';
      setActiveTab(isUnclaimed ? 'external' : 'inbox');

      if (state.prefilledMessage) {
        setPrefilledDrafts((prev) => ({ ...prev, [convId]: state.prefilledMessage! }));
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, setActiveConversationId, _setConversations]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const optimisticBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    optimisticBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    refreshConversations().then(() => {
      const pending = pendingConversationRef.current;
      if (pending) {
        setActiveConversationId(pending.id);
        const isUnclaimed = pending.conversation?.landlordId === 'UNCLAIMED';
        setActiveTab(isUnclaimed ? 'external' : 'inbox');
      }
    }).catch(() => { /* silent — poller will retry */ });
  }, [refreshConversations, setActiveConversationId]);

  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (activeConv) {
        if (activeConv.landlordId === 'UNCLAIMED') {
          setActiveTab('external');
        } else if (!activeConv.lastMessageAt) {
          setActiveTab('draft');
        } else if (isUnread(activeConv, readCursors[activeConv.id] ?? null)) {
          setActiveTab('inbox');
        } else {
          setActiveTab('read');
        }
      }
    }
  }, [activeConversationId, conversations, readCursors]);

  const handleSelect = useCallback((id: string) => {
    setActiveConversationId(id);
    setOptimisticMessages((prev) => ({ ...prev, [id]: [] }));

    if (activeConversationId) {
      setPrefilledDrafts((prev) => {
        const next = { ...prev };
        delete next[activeConversationId];
        return next;
      });
    }

    const conv = conversations.find((c) => c.id === id);
    const prevCursor = readCursors[id] ?? null;
    if (conv && isUnread(conv, prevCursor)) decrementUnreadCount(1);
    setReadCursors((prev) => ({ ...prev, [id]: new Date().toISOString() }));
  }, [activeConversationId, setActiveConversationId, conversations, readCursors, decrementUnreadCount]);

  const handleSend = useCallback((message: Message, file?: File) => {
    if (!activeConversationId) return;
    setOptimisticMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] ?? []), { message, file }],
    }));
    setPrefilledDrafts((prev) => {
      const next = { ...prev };
      delete next[activeConversationId];
      return next;
    });
    setTimeout(scrollToBottom, 0);
  }, [activeConversationId, scrollToBottom]);

  const currentUserId = user?.id ?? '';
  const userName = (user as { name?: string; displayName?: string } | null)?.name
    ?? (user as { displayName?: string } | null)?.displayName
    ?? 'Tenant';
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const inboxConvs = conversations.filter((c) => c.landlordId !== 'UNCLAIMED' && isUnread(c, readCursors[c.id] ?? null));
  const readConvs = conversations.filter((c) => c.landlordId !== 'UNCLAIMED' && c.lastMessageAt && !isUnread(c, readCursors[c.id] ?? null));
  const draftConvs = conversations.filter((c) => c.landlordId !== 'UNCLAIMED' && !c.lastMessageAt);
  const externalConvs = conversations.filter((c) => c.landlordId === 'UNCLAIMED');

  const tabCounts: Record<TabId, number> = {
    inbox: inboxConvs.length,
    read: readConvs.length,
    draft: draftConvs.length,
    external: externalConvs.length,
  };

  const byTime = (a: Conversation, b: Conversation) =>
    new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();

  const visibleConvs: Conversation[] =
    activeTab === 'inbox' ? [...inboxConvs].sort(byTime) :
      activeTab === 'read' ? [...readConvs].sort(byTime) :
        activeTab === 'draft' ? draftConvs :
          [...externalConvs].sort(byTime);

  const filteredConvs = visibleConvs.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = participantName(conv).toLowerCase();
    const property = (conv.propertyTitle || conv.propertyId || '').toLowerCase();
    return name.includes(q) || property.includes(q);
  });

  const emptyMessages: Record<TabId, { message: string; sub: string }> = {
    inbox: { message: 'No unread messages', sub: 'New messages will appear here.' },
    read: { message: 'No read messages', sub: 'Messages you have read will appear here.' },
    draft: { message: 'No drafts', sub: 'Conversations without messages will appear here.' },
    external: { message: 'No external messages', sub: 'Messages to external agents will appear here.' },
  };

  const exportConversations = () => {
    const rows = [
      ['Name', 'Property', 'Last message', 'Tab'],
      ...filteredConvs.map((conv) => [
        participantName(conv),
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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'read', label: 'Read' },
    { id: 'draft', label: 'Drafts' },
    { id: 'external', label: 'External' },
  ];

  return (
    <div className="tn-msg" data-testid="tenant-messages-page">
      <TenantPageHeader
        title="Messages"
        subtitle={
          <>
            Messages and communication for <span style={{ color: '#136C9E', fontWeight: 600 }}>{userName}</span>
          </>
        }
        primaryLabel="Find Listing"
        primaryIcon={<Search size={16} />}
        onPrimary={() => navigate('/search')}
        onInsights={() => setIsInsightsOpen(true)}
      />

      <div className="tn-msg-body">
        <div className="tn-msg-toolbar">
          <div className="tn-msg-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tn-msg-tab${activeTab === tab.id ? ' is-on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 ? <span className="tn-msg-tab-count">{tabCounts[tab.id]}</span> : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tn-msg-export"
            onClick={exportConversations}
            disabled={filteredConvs.length === 0}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        <div className="tn-msg-split">
          <aside className="tn-msg-list" aria-label="Conversations">
            <div className="tn-msg-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
              />
            </div>

            <div className="tn-msg-convs">
              {filteredConvs.length === 0 ? (
                <EmptyState {...emptyMessages[activeTab]} />
              ) : (
                filteredConvs.map((conv) => {
                  const name = participantName(conv);
                  const property = conv.propertyTitle || conv.propertyId || '';
                  const time = formatTime(conv.lastMessageAt);
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      data-testid="conversation-list-item"
                      data-conversation-id={conv.id}
                      className={`tn-msg-conv${conv.id === activeConversationId ? ' is-on' : ''}`}
                      onClick={() => handleSelect(conv.id)}
                      aria-pressed={conv.id === activeConversationId}
                      aria-label={`Conversation with ${name} about ${property || 'a property'}`}
                    >
                      <span className={`tn-msg-avatar ${avatarTone(name + property)}`}>{getInitials(name)}</span>
                      <div className="tn-msg-conv-main">
                        <div className="tn-msg-conv-top">
                          <h4>{name}</h4>
                          {time.label ? (
                            <span className={`tn-msg-conv-time${time.fresh ? ' is-now' : ''}`}>{time.label}</span>
                          ) : null}
                        </div>
                        {property ? <div className="tn-msg-conv-sub">{property}</div> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="tn-msg-back">
              <button type="button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </aside>

          <main className="tn-msg-thread" aria-label="Message thread">
            {activeConversationId ? (
              <>
                <div className="tn-msg-thread-head">
                  <span className={`tn-msg-avatar ${avatarTone(activeConversation ? participantName(activeConversation) : 'Landlord')}`}>
                    {getInitials(activeConversation ? participantName(activeConversation) : 'Landlord')}
                  </span>
                  <div>
                    <h3>{activeConversation ? participantName(activeConversation) : 'Landlord'}</h3>
                    <p>{activeConversation?.propertyTitle || activeConversation?.propertyId || ''}</p>
                  </div>
                </div>

                {activeConversation?.landlordId === 'UNCLAIMED' && (
                  <div className="tn-msg-unclaimed">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>We've forwarded your message via email. We're waiting for the agent to join Proptii to reply directly here.</span>
                  </div>
                )}

                <div ref={scrollContainerRef} className="tn-msg-feed">
                  <MessageThread conversationId={activeConversationId} currentUserId={currentUserId} onScrollRequest={scrollToBottom} />
                  {(optimisticMessages[activeConversationId] ?? []).map(({ message: msg, file }) => (
                    <div key={msg.id} data-testid="optimistic-message" className="tn-msg-optimistic">
                      <div className="tn-msg-optimistic-bubble">
                        {msg.body ? <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.body}</p> : null}
                        {file && <AttachmentPill url={URL.createObjectURL(file)} fileName={file.name} sizeBytes={file.size} isSent />}
                      </div>
                    </div>
                  ))}
                  <div ref={optimisticBottomRef} />
                </div>

                <ComposeBox
                  conversationId={activeConversationId}
                  onSend={handleSend}
                  senderRole="tenant"
                  recipientId={activeConversation?.landlordId}
                  agentEmail={activeConversation?.agentEmail}
                  propertyTitle={activeConversation?.propertyTitle}
                  initialBody={prefilledDrafts[activeConversationId]}
                />
              </>
            ) : (
              <EmptyState message="Select a conversation" sub="Choose a conversation from the list to start messaging." />
            )}
          </main>
        </div>
      </div>

      {isInsightsOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInsightsOpen(false); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-msg-insights">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico blue">★</span>
                <div>
                  <h3 id="tn-msg-insights">Portfolio Insights</h3>
                  <p>Counts from your conversations</p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsInsightsOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <div className="tn-insights-grid">
                <div className="tn-insights-card">
                  <span>Conversations</span>
                  <p>{conversations.length}</p>
                  <em>In your inbox</em>
                </div>
                <div className="tn-insights-card">
                  <span>Unread</span>
                  <p>{inboxConvs.length}</p>
                  <em>Awaiting a read</em>
                </div>
                <div className="tn-insights-card">
                  <span>Drafts</span>
                  <p>{draftConvs.length}</p>
                  <em>No messages yet</em>
                </div>
                <div className="tn-insights-card">
                  <span>External</span>
                  <p>{externalConvs.length}</p>
                  <em>Outside Proptii</em>
                </div>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-blue" onClick={() => setIsInsightsOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantMessages;
