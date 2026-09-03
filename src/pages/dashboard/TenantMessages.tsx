/**
 * TenantMessages — tenant inbox at /dashboard/messages.
 * Requirements: 10.1–10.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessagingContext } from '../../contexts/MessagingContext';
import { useAuth } from '../../contexts/AuthContext';
import communicationService from '../../services/communicationService';
import ConversationListItem from '../../components/messaging/ConversationListItem';
import MessageThread from '../../components/messaging/MessageThread';
import ComposeBox from '../../components/messaging/ComposeBox';
import AttachmentPill from '../../components/messaging/AttachmentPill';
import type { Conversation, Message } from '../../types/messaging';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type TabId = 'inbox' | 'read' | 'draft' | 'external';

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isUnread(conv: Conversation, cursor: string | null): boolean {
    return conv.lastMessageAt !== null &&
        (cursor === null || new Date(conv.lastMessageAt) > new Date(cursor));
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
const BackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
interface TabBarProps {
    activeTab: TabId;
    onTabChange: (t: TabId) => void;
    counts: Record<TabId, number>;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, counts }) => {
    const tabs: { id: TabId; label: string }[] = [
        { id: 'inbox', label: 'Inbox' },
        { id: 'read', label: 'Read' },
        { id: 'draft', label: 'Draft' },
        { id: 'external', label: 'External' },
    ];
    return (
        <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 16px',
            gap: '4px',
            flexShrink: 0,
            background: '#ffffff',
        }}>
            {tabs.map(({ id, label }) => {
                const active = activeTab === id;
                const count = counts[id];
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onTabChange(id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 4px', background: 'none', border: 'none',
                            borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                            marginBottom: '-1px', cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: active ? 700 : 500,
                            color: active ? '#3b82f6' : '#6b7280',
                            transition: 'color 0.15s, border-color 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                        {count > 0 && (
                            <span style={{
                                minWidth: '18px', height: '18px', borderRadius: '9px',
                                background: active ? '#3b82f6' : '#e5e7eb',
                                color: active ? '#ffffff' : '#6b7280',
                                fontSize: '0.65rem', fontWeight: 700,
                                display: 'inline-flex', alignItems: 'center',
                                justifyContent: 'center', padding: '0 5px',
                                transition: 'background 0.15s, color 0.15s',
                            }}>
                                {count > 99 ? '99+' : count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
const EmptyState: React.FC<{ message: string; sub: string }> = ({ message, sub }) => (
    <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', gap: '12px', textAlign: 'center',
    }}>
        <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        </div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>{message}</p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280', maxWidth: '220px' }}>{sub}</p>
    </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TenantMessages: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversationId, _setConversations, decrementUnreadCount, refreshConversations } = useMessagingContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<TabId>('inbox');
    const [optimisticMessages, setOptimisticMessages] = useState<Record<string, Array<{ message: Message; file?: File }>>>({});
    const [readCursors, setReadCursors] = useState<Record<string, string | null>>({});
    const [prefilledDrafts, setPrefilledDrafts] = useState<Record<string, string>>({});
    // Pending conversation to activate once the context is populated (avoids race on first render)
    const pendingConversationRef = useRef<{ id: string; conversation?: Conversation; prefilledMessage?: string } | null>(null);

    useEffect(() => {
        const state = location.state as { prefilledMessage?: string; conversationId?: string; conversation?: Conversation } | null;
        if (state?.conversationId) {
            const convId = state.conversationId;

            // Store the pending activation so the tab-selection effect can retry after conversations load
            pendingConversationRef.current = {
                id: convId,
                conversation: state.conversation,
                prefilledMessage: state.prefilledMessage,
            };

            // Optimistically insert the conversation so it appears immediately
            if (state.conversation) {
                _setConversations((prev) => {
                    if (prev.some((c) => c.id === state.conversation!.id)) return prev;
                    return [state.conversation!, ...prev];
                });
            }

            setActiveConversationId(convId);

            // For UNCLAIMED (scraped) conversations jump straight to External tab
            const isUnclaimed = state.conversation?.landlordId === 'UNCLAIMED';
            setActiveTab(isUnclaimed ? 'external' : 'inbox');

            if (state.prefilledMessage) {
                setPrefilledDrafts((prev) => ({ ...prev, [convId]: state.prefilledMessage! }));
            }

            // Do NOT call refreshConversations() here — it would overwrite the optimistically
            // inserted conversation with the API response before the backend has propagated it.
            // The 30-second poller in MessagingContext handles eventual sync.

            // Clear router state so F5 doesn't re-trigger
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate, setActiveConversationId, _setConversations]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const optimisticBottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        optimisticBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        // Refresh conversations on mount. After refresh completes, re-apply any pending
        // navigation activation (in case the API response includes the just-created conversation).
        refreshConversations().then(() => {
            const pending = pendingConversationRef.current;
            if (pending) {
                // Re-activate — the refreshed list should now include the conversation
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

        // Clear the prefilled draft for the active conversation when switching
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
        // Clear prefilled draft for active conversation
        setPrefilledDrafts((prev) => {
            const next = { ...prev };
            delete next[activeConversationId];
            return next;
        });
        setTimeout(scrollToBottom, 0);
    }, [activeConversationId, scrollToBottom]);

    const currentUserId = user?.id ?? '';
    const userName = (user as any)?.name ?? (user as any)?.displayName ?? 'Tenant';
    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    // Bucket into tabs
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

    const emptyMessages: Record<TabId, { message: string; sub: string }> = {
        inbox: { message: 'No unread messages', sub: 'New messages will appear here.' },
        read: { message: 'No read messages', sub: 'Messages you have read will appear here.' },
        draft: { message: 'No drafts', sub: 'Conversations without messages will appear here.' },
        external: { message: 'No external messages', sub: 'Messages to external agents will appear here.' },
    };

    return (
        <>
            <style>{`
                .msg-back-btn:hover { background: #eff6ff !important; color: #2563eb !important; border-color: #bfdbfe !important; }
            `}</style>

            <div
                data-testid="tenant-messages-page"
                style={{
                    display: 'flex',
                    height: 'calc(100vh - 80px)',
                    minHeight: '500px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    marginTop: '16px',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                }}
            >
                {/* ── Left sidebar ─────────────────────────────────────────── */}
                <aside aria-label="Conversations" style={{
                    width: '300px', flexShrink: 0, borderRight: '1px solid #e5e7eb',
                    display: 'flex', flexDirection: 'column', background: '#ffffff',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 16px 14px', borderBottom: '1px solid #f3f4f6',
                        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#3b82f6', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
                        }}>
                            {getInitials(userName)}
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                            Messages
                        </p>
                    </div>

                    {/* Tabs */}
                    <TabBar activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {visibleConvs.length === 0 ? (
                            <EmptyState {...emptyMessages[activeTab]} />
                        ) : (
                            visibleConvs.map((conv) => (
                                <ConversationListItem
                                    key={conv.id}
                                    conversation={conv}
                                    isActive={conv.id === activeConversationId}
                                    onClick={handleSelect}
                                    participantName={conv.landlordId === 'UNCLAIMED' ? 'External Agent' : 'Landlord'}
                                    propertyAddress={conv.propertyTitle || conv.propertyId}
                                    lastReadAt={readCursors[conv.id] ?? null}
                                />
                            ))
                        )}
                    </div>

                    {/* Back button */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
                        <button type="button" className="msg-back-btn" onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
                                background: '#ffffff', color: '#374151', cursor: 'pointer',
                                fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.15s', justifyContent: 'center',
                            }}>
                            <BackIcon />
                            Back to Dashboard
                        </button>
                    </div>
                </aside>

                {/* ── Right panel ──────────────────────────────────────────── */}
                <main aria-label="Message thread"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafbff' }}>
                    {activeConversationId ? (
                        <>
                            <div style={{
                                padding: '14px 20px', borderBottom: '1px solid #e5e7eb',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                background: '#ffffff', flexShrink: 0,
                            }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: '#3b82f6', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {getInitials('Landlord')}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                                        {activeConversation?.landlordId === 'UNCLAIMED' ? 'External Agent' : 'Landlord'}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{activeConversation?.propertyTitle || activeConversation?.propertyId || ''}</p>
                                </div>
                            </div>
                            
                            {activeConversation?.landlordId === 'UNCLAIMED' && (
                                <div style={{
                                    background: '#fffbeb', padding: '10px 20px', borderBottom: '1px solid #fef3c7',
                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#b45309'
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>We've forwarded your message via email. We're waiting for the agent to join Proptii to reply directly here.</span>
                                </div>
                            )}

                            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto' }}>
                                <MessageThread conversationId={activeConversationId} currentUserId={currentUserId} onScrollRequest={scrollToBottom} />
                                {(optimisticMessages[activeConversationId] ?? []).map(({ message: msg, file }) => (
                                    <div key={msg.id} data-testid="optimistic-message"
                                        style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 20px' }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px',
                                            background: '#3b82f6', color: '#fff', opacity: 0.88,
                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px',
                                        }}>
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
        </>
    );
};

export default TenantMessages;
