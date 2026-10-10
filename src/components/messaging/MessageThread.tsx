/**
 * MessageThread — renders a conversation's message history in chronological order.
 *
 * - Fetches messages on mount and when conversationId changes.
 * - Auto-scrolls to the bottom on load and whenever the message list grows.
 * - Marks each unread message as read after fetching.
 * - Sent messages (senderId === currentUserId) are right-aligned.
 * - Received messages are left-aligned.
 * - Shows an inline error banner on fetch failure.
 * - Renders attachment download links by fetching time-limited SAS URLs.
 *
 * Requirements: 10.3, 10.5, 11.3, 11.5, 12.1, 7.4
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Message } from '../../types/messaging';
import communicationService from '../../services/communicationService';
import sseService from '../../services/sseService';
import AttachmentPill from './AttachmentPill';
import { Pencil, Trash2, Ban } from 'lucide-react';

// ---------------------------------------------------------------------------
// InlineAttachment — renders an already-hydrated attachment object directly.
// The backend now embeds attachment metadata in each message, eliminating
// the N+1 network fetches that AttachmentLoader used to make.
// ---------------------------------------------------------------------------

interface InlineAttachmentProps {
    attachment: { id: string; filename?: string; blobUrl?: string; url?: string };
    isSent: boolean;
}

const InlineAttachment: React.FC<InlineAttachmentProps> = ({ attachment, isSent }) => {
    const url = attachment.blobUrl || attachment.url || null;
    const fileName = attachment.filename || 'Attachment';
    return <AttachmentPill url={url} fileName={fileName} isSent={isSent} isError={!url} />;
};

// ---------------------------------------------------------------------------
// AttachmentLoader — lazy fallback for messages without embedded attachments
// ---------------------------------------------------------------------------

interface AttachmentLoaderProps {
    attachmentId: string;
    conversationId: string;
    isSent: boolean;
}

const AttachmentLoader: React.FC<AttachmentLoaderProps> = ({ attachmentId, conversationId, isSent }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('Attachment');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        communicationService
            .getAttachment(attachmentId)
            .then((attachment) => {
                if (cancelled) return;
                if (attachment?.filename) setFileName(attachment.filename);
                setUrl(attachment?.blobUrl || null);
            })
            .catch(() => { if (!cancelled) setIsError(true); });
        return () => { cancelled = true; };
    }, [attachmentId, conversationId]);

    return (
        <AttachmentPill
            url={url}
            fileName={fileName}
            isSent={isSent}
            isError={isError}
        />
    );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageThreadProps {
    conversationId: string;
    currentUserId: string;
    /** Called after messages are fetched so the parent can scroll its container */
    onScrollRequest?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId, currentUserId, onScrollRequest }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEdit = async (messageId: string, currentBody: string) => {
        const newBody = window.prompt('Edit your message:', currentBody);
        if (newBody !== null && newBody.trim() !== '' && newBody !== currentBody) {
            try {
                const res = await communicationService.editMessage(messageId, newBody.trim());
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, body: res.body, editedAt: res.editedAt } : m));
            } catch (err) {
                console.error(err);
                alert('Failed to edit message.');
            }
        }
    };

    const handleDelete = async (messageId: string) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                const res = await communicationService.deleteMessage(messageId);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, deletedAt: res.deletedAt } : m));
            } catch (err) {
                console.error(err);
                alert('Failed to delete message.');
            }
        }
    };

    // Sentinel element at the bottom of the list — scrolled into view after every render
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (typeof bottomRef.current?.scrollIntoView === 'function') {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        onScrollRequest?.();
    }, [onScrollRequest]);

    const fetchAndMarkRead = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            const { messages: fetched, hasMore: more } = await communicationService.getMessages(conversationId);
            const sorted = [...fetched].sort(
                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );
            setMessages(sorted);
            setHasMore(more);

            const unread = sorted.filter(
                (m) => m.readAt === null && m.senderId !== currentUserId,
            );
            await Promise.all(
                unread.map((m) => communicationService.markRead(m.id, conversationId)),
            );
        } catch (_e) {
            setError('Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [conversationId, currentUserId]);

    const loadEarlier = useCallback(async () => {
        if (!conversationId || !messages.length || loadingMore) return;
        setLoadingMore(true);
        try {
            const oldest = messages[0]?.sentAt;
            const { messages: older, hasMore: more } = await communicationService.getMessages(conversationId, oldest);
            const sorted = [...older].sort(
                (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );
            setMessages(prev => [...sorted.filter(m => !prev.some(p => p.id === m.id)), ...prev]);
            setHasMore(more);
        } catch (_e) { /* silent */ } finally {
            setLoadingMore(false);
        }
    }, [conversationId, messages, loadingMore]);

    useEffect(() => {
        fetchAndMarkRead();
    }, [fetchAndMarkRead]);

    // Listen for new messages via SSE
    useEffect(() => {
        if (!conversationId) return;
        const unsubscribe = sseService.on('message_new', (event) => {
            const data = event.data as any;
            if (data?.conversationId === conversationId && data?.message) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
                if (data.message.senderId !== currentUserId) {
                    communicationService.markRead(data.message.id, conversationId).catch(console.error);
                }
            }
        });

        const unsubscribeTyping = sseService.on('typing_start', (event) => {
            const data = event.data as any;
            if (data?.conversationId === conversationId && data?.senderId !== currentUserId) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
        });

        const unsubscribeEdit = sseService.on('message_edit', (event) => {
            const data = event.data as any;
            if (data?.messageId) {
                setMessages((prev) => prev.map((m) =>
                    m.id === data.messageId
                        ? { ...m, body: data.body, editedAt: data.editedAt }
                        : m
                ));
            }
        });

        const unsubscribeDelete = sseService.on('message_delete', (event) => {
            const data = event.data as any;
            if (data?.messageId) {
                setMessages((prev) => prev.map((m) =>
                    m.id === data.messageId
                        ? { ...m, isDeleted: true, deletedAt: data.deletedAt }
                        : m
                ));
            }
        });

        return () => { unsubscribe(); unsubscribeTyping(); unsubscribeEdit(); unsubscribeDelete(); };
    }, [conversationId, currentUserId]);

    // Scroll to bottom whenever the message list changes (new fetch or new messages)
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    return (
        <div
            data-testid="message-thread"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}
        >
            {/* Load earlier messages button */}
            {hasMore && (
                <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                    <button
                        type="button"
                        onClick={loadEarlier}
                        disabled={loadingMore}
                        style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: '#136c9e', background: '#eaf3f8',
                            border: '1px solid #bfdbfe', borderRadius: 20,
                            padding: '5px 14px', cursor: loadingMore ? 'default' : 'pointer',
                            opacity: loadingMore ? 0.6 : 1,
                        }}
                    >
                        {loadingMore ? 'Loading…' : '↑ Load earlier messages'}
                    </button>
                </div>
            )}
            {/* Inline error banner */}
            {error && (
                <div
                    role="alert"
                    data-testid="message-thread-error"
                    style={{
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#991b1b',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && messages.length === 0 && (
                <div data-testid="message-thread-loading" style={{ textAlign: 'center', color: '#6b7280' }}>
                    Loading messages…
                </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
                const isSent = message.senderId === currentUserId;
                return (
                    <div
                        key={message.id}
                        data-testid="message-item"
                        data-sender-id={message.senderId}
                        data-sent-at={message.sentAt}
                        data-alignment={isSent ? 'right' : 'left'}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        style={{
                            display: 'flex',
                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                            position: 'relative',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '70%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                backgroundColor: isSent ? '#136C9E' : '#f3f4f6',
                                color: isSent ? '#ffffff' : '#111827',
                                textAlign: isSent ? 'right' : 'left',
                                position: 'relative',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                        >
                            {message.isDeleted ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.65, fontStyle: 'italic', color: isSent ? '#e0e0e0' : '#6b7280' }}>
                                    <Ban size={14} />
                                    <span style={{ fontSize: '0.9rem' }}>This message was deleted</span>
                                </div>
                            ) : (
                                <>
                                    {message.body ? (
                                        <p style={{ margin: 0, wordBreak: 'break-word' }}>{message.body}</p>
                                    ) : null}
                                </>
                            )}

                            {/* Attachments — use embedded data when available, lazy-load otherwise */}
                            {!message.isDeleted && message.attachmentIds && message.attachmentIds.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        marginTop: message.body ? '8px' : '0',
                                        alignItems: isSent ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {message.attachmentIds.map((attachmentId, idx) => {
                                        const embedded = (message as any).attachments?.[idx];
                                        return embedded
                                            ? <InlineAttachment key={attachmentId} attachment={embedded} isSent={isSent} />
                                            : <AttachmentLoader key={attachmentId} attachmentId={attachmentId} conversationId={message.conversationId} isSent={isSent} />;
                                    })}
                                </div>
                            )}

                            {/* Timestamp + read receipt */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isSent ? 'flex-end' : 'flex-start', marginTop: '4px' }}>
                                {message.sentAt && !isNaN(new Date(message.sentAt).getTime()) && (
                                    <time
                                        dateTime={message.sentAt}
                                        style={{ fontSize: '0.7rem', opacity: 0.65 }}
                                    >
                                        {new Date(message.sentAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {message.editedAt && !message.isDeleted && ' (edited)'}
                                    </time>
                                )}
                                
                                {/* Read receipt — only shown on sent messages */}
                                {isSent && (
                                    <span
                                        title={message.readAt ? `Read ${new Date(message.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Delivered'}
                                        style={{ fontSize: '0.65rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '1px' }}
                                    >
                                        {message.readAt ? (
                                            // Double tick — seen
                                            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" aria-label="Read">
                                                <path d="M1 5l3 3L10 1M5 5l3 3L14 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            // Single tick — delivered
                                            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" aria-label="Delivered">
                                                <path d="M1 5l3 3L8 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit/Delete Floating Action Bar */}
                        {isSent && !message.isDeleted && hoveredMessageId === message.id && (
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '16px',
                                padding: '2px 6px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                zIndex: 10,
                            }}>
                                <button 
                                    onClick={() => handleEdit(message.id, message.body)} 
                                    title="Edit Message"
                                    style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Pencil size={13} />
                                </button>
                                <div style={{ width: '1px', height: '14px', backgroundColor: '#e5e7eb', margin: '0 2px' }} />
                                <button 
                                    onClick={() => handleDelete(message.id)} 
                                    title="Delete Message"
                                    style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Empty state */}
            {!loading && !error && messages.length === 0 && (
                <div
                    data-testid="message-thread-empty"
                    style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}
                >
                    No messages yet. Start the conversation!
                </div>
            )}

            {/* Typing indicator bubble */}
            {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                        padding: '8px 14px', borderRadius: 12,
                        backgroundColor: '#f3f4f6', color: '#6b7280',
                        fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ display: 'flex', gap: 3 }}>
                            {[0,1,2].map(i => (
                                <span key={i} style={{
                                    width: 6, height: 6, borderRadius: '50%', background: '#9ca3af',
                                    animation: 'typingDot 1.2s infinite',
                                    animationDelay: `${i * 0.2}s`,
                                    display: 'inline-block',
                                }} />
                            ))}
                        </span>
                        typing…
                        <style>{`@keyframes typingDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
                    </div>
                </div>
            )}

            {/* Scroll anchor — always at the bottom of the list */}
            <div ref={bottomRef} data-testid="scroll-anchor" />
        </div>
    );
};

export default MessageThread;
