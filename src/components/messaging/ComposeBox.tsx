/**
 * ComposeBox — text input and file attachment UI for sending messages.
 *
 * - Renders a <textarea> with a 4,000-character limit and a visible counter.
 * - Disables the submit button and shows an error state when the limit is exceeded.
 * - Renders a file attachment button restricted to .pdf, .doc, .docx, .txt.
 * - When a file is selected, calls communicationService.uploadAttachment before sendMessage.
 * - Shows a toast on upload failure without submitting the message.
 * - Calls onSend with the created message on success.
 *
 * Requirements: 10.4, 11.4, 12.2, 12.4, 12.5
 */

import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Message } from '../../types/messaging';
import communicationService from '../../services/communicationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 4000;
const ALLOWED_ACCEPT = '.pdf,.doc,.docx,.txt';
const MAX_ATTACHMENT_MB = 5; // Must match AttachmentService.MAX_FILE_SIZE_BYTES

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ComposeBoxProps {
    conversationId: string;
    onSend: (message: Message, attachedFile?: File) => void;
    senderRole?: 'tenant' | 'landlord';
    recipientId?: string;
    agentEmail?: string;
    propertyTitle?: string;
    initialBody?: string;
}

// ---------------------------------------------------------------------------
// Icons (inline SVG — no extra deps)
// ---------------------------------------------------------------------------

const PaperclipIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SpinnerIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        aria-hidden="true"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ComposeBox: React.FC<ComposeBoxProps> = ({
    conversationId,
    onSend,
    senderRole = 'tenant',
    recipientId,
    agentEmail,
    propertyTitle,
    initialBody,
}) => {
    const [body, setBody] = useState(initialBody ?? '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [focused, setFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setBody(initialBody ?? '');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [conversationId]);

    const charCount = body.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isSubmitDisabled = sending || isOverLimit || (body.trim().length === 0 && !selectedFile);
    const charPct = Math.min(charCount / MAX_CHARS, 1);

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
            toast.error(`File is too large. Maximum attachment size is ${MAX_ATTACHMENT_MB} MB.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitDisabled) return;
        setSending(true);

        try {
            let attachmentIds: string[] = [];

            if (selectedFile) {
                try {
                    const attachment = await communicationService.uploadAttachment(selectedFile, conversationId);
                    attachmentIds = [attachment.id];
                } catch {
                    toast.error('File upload failed. Please try again.');
                    setSending(false);
                    return;
                }
            }

            const message = await communicationService.sendMessage(conversationId, {
                body: body.trim(),
                attachmentIds,
                senderRole,
                recipientId,
                agentEmail,
                propertyTitle,
            });

            if (selectedFile) {
                onSend(message, selectedFile);
            } else {
                onSend(message);
            }
            setBody('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // Progress ring for char counter
    const radius = 9;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - charPct);

    return (
        <>
            {/* Keyframe injection */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .compose-attach-btn:hover {
                    background: #eff6ff !important;
                    border-color: #93c5fd !important;
                    color: #2563eb !important;
                }
                .compose-send-btn:hover:not(:disabled) {
                    background: #2563eb !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59,130,246,0.4) !important;
                }
                .compose-send-btn:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: none !important;
                }
                .compose-file-chip:hover .compose-file-remove {
                    opacity: 1 !important;
                }
            `}</style>

            <form
                data-testid="compose-box"
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    background: '#ffffff',
                    borderTop: '1px solid #e5e7eb',
                }}
            >
                {/* Selected file chip */}
                {selectedFile && (
                    <div
                        style={{
                            padding: '10px 16px 0',
                            animation: 'fadeSlideIn 0.15s ease',
                        }}
                    >
                        <div
                            className="compose-file-chip"
                            data-testid="selected-file"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '5px 10px 5px 8px',
                                borderRadius: '20px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.8125rem',
                                color: '#1d4ed8',
                                fontWeight: 500,
                                maxWidth: '100%',
                            }}
                        >
                            {/* File type dot */}
                            <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                background: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '0.6rem',
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase',
                            }}>
                                {selectedFile.name.split('.').pop()?.slice(0, 3) ?? '?'}
                            </span>

                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                            }}>
                                {selectedFile.name}
                            </span>

                            <span style={{ color: '#60a5fa', fontSize: '0.7rem', flexShrink: 0 }}>
                                {selectedFile.size < 1024 * 1024
                                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                    : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                            </span>

                            <button
                                type="button"
                                className="compose-file-remove"
                                onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                aria-label="Remove attachment"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#bfdbfe',
                                    color: '#1d4ed8',
                                    cursor: 'pointer',
                                    padding: 0,
                                    flexShrink: 0,
                                    opacity: 0.7,
                                    transition: 'opacity 0.15s, background 0.15s',
                                }}
                            >
                                <XIcon />
                            </button>
                        </div>
                    </div>
                )}

                {/* Textarea */}
                <div style={{ padding: '10px 16px 0', position: 'relative' }}>
                    <textarea
                        data-testid="compose-textarea"
                        value={body}
                        onChange={handleBodyChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Type a message…"
                        rows={3}
                        aria-label="Message body"
                        aria-describedby="char-counter"
                        aria-invalid={isOverLimit}
                        style={{
                            width: '100%',
                            resize: 'none',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: isOverLimit
                                ? '1.5px solid #ef4444'
                                : focused
                                    ? '1.5px solid #3b82f6'
                                    : '1.5px solid #e5e7eb',
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            color: '#111827',
                            background: '#f9fafb',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s, background 0.15s',
                            boxShadow: focused && !isOverLimit
                                ? '0 0 0 3px rgba(59,130,246,0.1)'
                                : 'none',
                        }}
                    />
                </div>

                {/* Toolbar row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px 12px',
                }}>
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_ACCEPT}
                        onChange={handleFileChange}
                        data-testid="file-input"
                        style={{ display: 'none' }}
                        aria-label="Attach file"
                    />

                    {/* Attach button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="attach-button"
                        aria-label="Attach file"
                        className="compose-attach-btn"
                        title={`Attach PDF, DOC, DOCX or TXT (max ${MAX_ATTACHMENT_MB} MB)`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '20px',
                            border: selectedFile ? '1.5px solid #93c5fd' : '1.5px solid #e5e7eb',
                            background: selectedFile ? '#eff6ff' : '#ffffff',
                            color: selectedFile ? '#2563eb' : '#6b7280',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <PaperclipIcon />
                        Attach
                    </button>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Char counter ring & text */}
                    <div
                        id="char-counter"
                        data-testid="char-counter"
                        aria-live="polite"
                        title={`${charCount}/${MAX_CHARS} characters`}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span style={{ fontSize: '0.75rem', color: isOverLimit ? '#ef4444' : '#6b7280' }}>
                            {charCount}/{MAX_CHARS}
                        </span>
                        {charCount > 0 && (
                            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                                {/* Track */}
                                <circle cx="11" cy="11" r={radius}
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="2.5"
                                />
                                {/* Progress */}
                                <circle cx="11" cy="11" r={radius}
                                    fill="none"
                                    stroke={isOverLimit ? '#ef4444' : charPct > 0.8 ? '#f59e0b' : '#3b82f6'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90 11 11)"
                                    style={{ transition: 'stroke-dashoffset 0.2s, stroke 0.2s' }}
                                />
                            </svg>
                        )}
                        {isOverLimit && (
                            <span
                                data-testid="char-limit-error"
                                role="alert"
                                style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}
                            >
                                {charCount - MAX_CHARS} over
                            </span>
                        )}
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        data-testid="send-button"
                        disabled={isSubmitDisabled}
                        aria-disabled={isSubmitDisabled}
                        className="compose-send-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '8px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            background: isSubmitDisabled ? '#e5e7eb' : '#3b82f6',
                            color: isSubmitDisabled ? '#9ca3af' : '#ffffff',
                            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            transition: 'all 0.15s',
                            boxShadow: isSubmitDisabled ? 'none' : '0 2px 8px rgba(59,130,246,0.25)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {sending ? <SpinnerIcon /> : <SendIcon />}
                        {sending ? 'Sending…' : 'Send'}
                    </button>
                </div>
            </form>
        </>
    );
};

export default ComposeBox;
