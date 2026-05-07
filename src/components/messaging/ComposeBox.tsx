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

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { Message } from '../../types/messaging';
import communicationService from '../../services/communicationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 4000;
const ALLOWED_ACCEPT = '.pdf,.doc,.docx,.txt';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ComposeBoxProps {
    conversationId: string;
    onSend: (message: Message) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ComposeBox: React.FC<ComposeBoxProps> = ({ conversationId, onSend }) => {
    const [body, setBody] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const charCount = body.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isSubmitDisabled = sending || isOverLimit || (body.trim().length === 0 && !selectedFile);

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitDisabled) return;

        setSending(true);

        try {
            let attachmentIds: string[] = [];

            // Upload attachment first if one is selected
            if (selectedFile) {
                try {
                    const attachment = await communicationService.uploadAttachment(
                        selectedFile,
                        conversationId,
                    );
                    attachmentIds = [attachment.id];
                } catch {
                    toast.error('File upload failed. Please try again.');
                    setSending(false);
                    return; // Do not submit the message if upload fails
                }
            }

            const message = await communicationService.sendMessage(conversationId, {
                body: body.trim(),
                attachmentIds,
                senderRole: 'tenant', // Default; pages can override via context if needed
            });

            onSend(message);

            // Reset form
            setBody('');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <form
            data-testid="compose-box"
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}
        >
            {/* Textarea */}
            <div style={{ position: 'relative' }}>
                <textarea
                    data-testid="compose-textarea"
                    value={body}
                    onChange={handleBodyChange}
                    placeholder="Type a message…"
                    rows={4}
                    aria-label="Message body"
                    aria-describedby="char-counter"
                    aria-invalid={isOverLimit}
                    style={{
                        width: '100%',
                        resize: 'vertical',
                        padding: '10px',
                        borderRadius: '6px',
                        border: isOverLimit ? '1px solid #ef4444' : '1px solid #d1d5db',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* Character counter */}
            <div
                id="char-counter"
                data-testid="char-counter"
                style={{
                    fontSize: '0.75rem',
                    textAlign: 'right',
                    color: isOverLimit ? '#ef4444' : '#6b7280',
                    fontWeight: isOverLimit ? 600 : 400,
                }}
                aria-live="polite"
            >
                {charCount}/{MAX_CHARS}
                {isOverLimit && (
                    <span
                        data-testid="char-limit-error"
                        style={{ marginLeft: '8px' }}
                        role="alert"
                    >
                        Message is too long
                    </span>
                )}
            </div>

            {/* Selected file indicator */}
            {selectedFile && (
                <div
                    data-testid="selected-file"
                    style={{ fontSize: '0.75rem', color: '#374151' }}
                >
                    📎 {selectedFile.name}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        style={{
                            marginLeft: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                        }}
                        aria-label="Remove attachment"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Action row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

                {/* Attachment button */}
                <button
                    type="button"
                    onClick={handleAttachClick}
                    data-testid="attach-button"
                    aria-label="Attach file"
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                    }}
                >
                    📎 Attach
                </button>

                {/* Submit button */}
                <button
                    type="submit"
                    data-testid="send-button"
                    disabled={isSubmitDisabled}
                    aria-disabled={isSubmitDisabled}
                    style={{
                        marginLeft: 'auto',
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isSubmitDisabled ? '#9ca3af' : '#3b82f6',
                        color: '#ffffff',
                        cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                    }}
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </div>
        </form>
    );
};

export default ComposeBox;
