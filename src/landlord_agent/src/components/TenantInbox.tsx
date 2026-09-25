/**
 * LandlordMessages — landlord inbox at /landlord/messages.
 * Requirements: 11.1–11.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Download, MessageSquare, Plus, Search, Settings, Sparkles } from 'lucide-react';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../contexts/AuthContext';
import communicationService from '../../../services/communicationService';
import MessageThread from '../../../components/messaging/MessageThread';
import ComposeBox from '../../../components/messaging/ComposeBox';
import AttachmentPill from '../../../components/messaging/AttachmentPill';
import type { Conversation, Message } from '../../../types/messaging';
import type { UserProfile } from '../App';
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const optimisticBottomRef = useRef<HTMLDivElement>(null);
  // Track last seen lastMessageAt per conversation to detect when real messages arrive
  const lastSeenAt = useRef<Record<string, string | null>>({});

  const scrollToBottom = useCallback(() => {
    optimisticBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // When the active conversation receives a new real message (lastMessageAt advances),
  // clear the optimistic messages for that conversation to prevent double-rendering.
  useEffect(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;
    const prev = lastSeenAt.current[activeConversationId];
    const now = conv.lastMessageAt;
    if (now && prev !== null && now !== prev) {
      setOptimisticMessages((m) => ({ ...m, [activeConversationId]: [] }));
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
      setOptimisticMessages((prev) => ({ ...prev, [id]: [] }));
      const conv = conversations.find((c) => c.id === id);
      const prevCursor = readCursors[id] ?? null;
      if (conv && isUnread(conv, prevCursor)) decrementUnreadCount(1);
      setReadCursors((prev) => ({ ...prev, [id]: new Date().toISOString() }));
    },
    [setActiveConversationId, conversations, readCursors, decrementUnreadCount],
  );

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

  const currentUserId = user?.id ?? '';
  const userName = userProfile?.name || (user as { name?: string; displayName?: string } | null)?.name || (user as { displayName?: string } | null)?.displayName || 'Landlord';
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

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
              <button type="button" className="ll-msg-btn-add" onClick={onAddTenant}>
                <Plus size={16} strokeWidth={2.5} />
                Add Tenant
              </button>
            ) : null}
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

        <div className="ll-msg-split">
          <aside className="ll-msg-list" aria-label="Conversations">
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

          <main className="ll-msg-thread" aria-label="Message thread">
            {activeConversationId ? (
              <>
                <div className="ll-msg-thread-head">
                  <span className={`ll-msg-avatar ${avatarTone(activeConversation?.tenantName || 'Tenant')}`}>
                    {getInitials(activeConversation?.tenantName || 'Tenant')}
                  </span>
                  <div>
                    <h3>{activeConversation?.tenantName || 'Tenant'}</h3>
                    <p>{activeConversation?.propertyTitle || activeConversation?.propertyId || ''}</p>
                  </div>
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
    </div>
  );
};
