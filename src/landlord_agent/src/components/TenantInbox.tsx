/**
 * LandlordMessages — landlord inbox at /landlord/messages.
 * Requirements: 11.1–11.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessagingContext } from '../../../contexts/MessagingContext';
import { useAuth } from '../../../contexts/AuthContext';
import communicationService from '../../../services/communicationService';
import { useMessagingPoller } from '../../../hooks/useMessagingPoller';
import ConversationListItem from '../../../components/messaging/ConversationListItem';
import MessageThread from '../../../components/messaging/MessageThread';
import ComposeBox from '../../../components/messaging/ComposeBox';
import AttachmentPill from '../../../components/messaging/AttachmentPill';
import type { Conversation, Message } from '../../../types/messaging';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type TabId = 'inbox' | 'read' | 'draft';

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
    ];
    return (
        <div style={{
            display: 'flex', borderBottom: '1px solid #e5e7eb',
            padding: '0 16px', gap: '4px', flexShrink: 0, background: '#ffffff',
        }}>
            {tabs.map(({ id, label }) => {
                const active = activeTab === id;
                const count = counts[id];
                return (
                    <button key={id} type="button" onClick={() => onTabChange(id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 4px', background: 'none', border: 'none',
                            borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                            marginBottom: '-1px', cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: active ? 700 : 500,
                            color: active ? '#3b82f6' : '#6b7280',
                            transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
                        }}>
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

export const TenantInbox: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversationId, _setConversations, decrementUnreadCount } = useMessagingContext();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Poller is already started by LandlordDemoInner — do not start a second one here.

    const [activeTab, setActiveTab] = useState<TabId>('inbox');
    const [optimisticMessages, setOptimisticMessages] = useState<Record<string, Array<{ message: Message; file?: File }>>>({});
    const [readCursors, setReadCursors] = useState<Record<string, string | null>>({});

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const optimisticBottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        optimisticBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (conversations.length === 0) {
            communicationService.getConversations()
                .then((convs) => { if (convs.length > 0) _setConversations(convs); })
                .catch(() => { });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = useCallback((id: string) => {
        setActiveConversationId(id);
        setOptimisticMessages((prev) => ({ ...prev, [id]: [] }));
        const conv = conversations.find((c) => c.id === id);
        const prevCursor = readCursors[id] ?? null;
        if (conv && isUnread(conv, prevCursor)) decrementUnreadCount(1);
        setReadCursors((prev) => ({ ...prev, [id]: new Date().toISOString() }));
    }, [setActiveConversationId, conversations, readCursors, decrementUnreadCount]);

    const handleSend = useCallback((message: Message, file?: File) => {
        if (!activeConversationId) return;
        setOptimisticMessages((prev) => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] ?? []), { message, file }],
        }));
        setTimeout(scrollToBottom, 0);
    }, [activeConversationId, scrollToBottom]);

    const currentUserId = user?.id ?? '';
    const userName = (user as any)?.name ?? (user as any)?.displayName ?? 'Landlord';
    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    // Bucket into tabs
    const inboxConvs = conversations.filter((c) => isUnread(c, readCursors[c.id] ?? null));
    const readConvs = conversations.filter((c) => c.lastMessageAt && !isUnread(c, readCursors[c.id] ?? null));
    const draftConvs = conversations.filter((c) => !c.lastMessageAt);

    const tabCounts: Record<TabId, number> = {
        inbox: inboxConvs.length,
        read: readConvs.length,
        draft: draftConvs.length,
    };

    const byTime = (a: Conversation, b: Conversation) =>
        new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();

    const visibleConvs: Conversation[] =
        activeTab === 'inbox' ? [...inboxConvs].sort(byTime) :
            activeTab === 'read' ? [...readConvs].sort(byTime) :
                draftConvs;

    const emptyMessages: Record<TabId, { message: string; sub: string }> = {
        inbox: { message: 'No unread messages', sub: 'New messages from tenants will appear here.' },
        read: { message: 'No read messages', sub: 'Messages you have read will appear here.' },
        draft: { message: 'No drafts', sub: 'Conversations without messages will appear here.' },
    };

    return (
        <>
            <style>{`
                .msg-back-btn-ll:hover { background: #eff6ff !important; color: #2563eb !important; border-color: #bfdbfe !important; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
                <div
                    data-testid="landlord-messages-page"
                    style={{
                        display: 'flex', flex: 1, margin: '24px',
                        borderRadius: '16px', overflow: 'hidden',
                        border: '1px solid #e5e7eb', background: '#ffffff',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                        minHeight: 'calc(100vh - 48px)',
                    }}
                >
                    {/* ── Left sidebar ─────────────────────────────────────── */}
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
                                            participantName={conv.tenantName || 'Tenant'}
                                            propertyAddress={conv.propertyTitle || conv.propertyId}
                                            lastReadAt={readCursors[conv.id] ?? null}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Back button */}
                            <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
                                <button type="button" className="msg-back-btn-ll" onClick={() => navigate('/landlord/dashboard')}
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

                        {/* ── Right panel ──────────────────────────────────────── */}
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
                                            {getInitials(activeConversation?.tenantName || 'Tenant')}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>{activeConversation?.tenantName || 'Tenant'}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{activeConversation?.propertyTitle || activeConversation?.propertyId || ''}</p>
                                        </div>
                                    </div>

                                    <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto' }}>
                                    <MessageThread conversationId={activeConversationId} currentUserId={currentUserId} onScrollRequest={scrollToBottom} />
                                    {(optimisticMessages[activeConversationId] ?? []).map(({ message: msg, file }) => (
                                        <div key={msg.id} data-testid="optimistic-message"
                                            style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 20px' }}>
                                            <div style={{
                                                maxWidth: '70%', padding: '10px 14px',
                                                borderRadius: '16px 16px 4px 16px',
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

                                <ComposeBox conversationId={activeConversationId} onSend={handleSend} senderRole="landlord" recipientId={activeConversation?.tenantId} />
                            </>
                        ) : (
                            <EmptyState message="Select a conversation" sub="Choose a conversation from the list to start messaging." />
                        )}
                    </main>
                </div>
            </div>
        </>
    );
};


