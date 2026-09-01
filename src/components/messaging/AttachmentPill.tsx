/**
 * AttachmentPill — styled attachment link used in both MessageThread (SAS URL)
 * and optimistic previews (local blob URL).
 *
 * Blue/white design system:
 *  - Sent bubble (isSent=true): white-on-blue glass card
 *  - Received bubble (isSent=false): blue-accent card on white
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function extLabel(fileName: string): string {
    return fileExtension(fileName).slice(0, 4).toUpperCase() || 'FILE';
}

function extColor(fileName: string): { bg: string; text: string } {
    switch (fileExtension(fileName)) {
        case 'pdf': return { bg: '#ef4444', text: '#fff' };
        case 'doc':
        case 'docx': return { bg: '#2563eb', text: '#fff' };
        case 'txt': return { bg: '#6b7280', text: '#fff' };
        default: return { bg: '#3b82f6', text: '#fff' };
    }
}

// ---------------------------------------------------------------------------
// Download icon
// ---------------------------------------------------------------------------

const DownloadIcon = ({ color }: { color: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AttachmentPillProps {
    url: string | null;
    fileName: string;
    sizeBytes?: number;
    isSent?: boolean;
    isError?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AttachmentPill: React.FC<AttachmentPillProps> = ({
    url,
    fileName,
    sizeBytes,
    isSent = false,
    isError = false,
}) => {
    // Colour tokens
    const card = isSent ? 'rgba(255,255,255,0.18)' : '#f0f7ff';
    const border = isSent ? 'rgba(255,255,255,0.28)' : '#bfdbfe';
    const name = isSent ? '#ffffff' : '#1d4ed8';
    const meta = isSent ? 'rgba(255,255,255,0.72)' : '#60a5fa';
    const dlColor = isSent ? 'rgba(255,255,255,0.85)' : '#3b82f6';

    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '12px',
        background: card,
        border: `1px solid ${border}`,
        maxWidth: '260px',
        minWidth: '180px',
        backdropFilter: isSent ? 'blur(4px)' : undefined,
    };

    // ── Error ────────────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div style={baseStyle}>
                <AlertTriangle style={{ width: 18, height: 18, color: '#f59e0b' }} />
                <span style={{ fontSize: '0.78rem', color: meta }}>
                    Attachment unavailable
                </span>
            </div>
        );
    }

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (!url) {
        return (
            <div style={baseStyle}>
                {/* Ext badge placeholder */}
                <div style={{
                    width: '32px', height: '36px', borderRadius: '6px',
                    background: isSent ? 'rgba(255,255,255,0.2)' : '#dbeafe',
                    flexShrink: 0,
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{
                        height: '10px', borderRadius: '4px', width: '110px',
                        background: isSent ? 'rgba(255,255,255,0.25)' : '#dbeafe',
                    }} />
                    <div style={{
                        height: '8px', borderRadius: '4px', width: '60px',
                        background: isSent ? 'rgba(255,255,255,0.15)' : '#eff6ff',
                    }} />
                </div>
            </div>
        );
    }

    // ── Loaded ───────────────────────────────────────────────────────────────
    const { bg: badgeBg, text: badgeText } = extColor(fileName);

    return (
        <>
            <style>{`
                .attachment-pill-link:hover {
                    filter: brightness(0.96);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59,130,246,0.18);
                }
                .attachment-pill-link:active {
                    transform: translateY(0);
                    box-shadow: none;
                }
            `}</style>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                data-testid="attachment-pill"
                className="attachment-pill-link"
                style={{
                    ...baseStyle,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'filter 0.15s, transform 0.15s, box-shadow 0.15s',
                }}
            >
                {/* File type badge */}
                <div style={{
                    width: '32px',
                    height: '36px',
                    borderRadius: '6px',
                    background: badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: badgeText,
                    letterSpacing: '0.04em',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}>
                    {extLabel(fileName)}
                </div>

                {/* Name + size */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: name,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '160px',
                        lineHeight: 1.3,
                    }} title={fileName}>
                        {fileName}
                    </span>
                    {sizeBytes !== undefined && (
                        <span style={{
                            fontSize: '0.7rem',
                            color: meta,
                            marginTop: '2px',
                            lineHeight: 1,
                        }}>
                            {formatBytes(sizeBytes)}
                        </span>
                    )}
                </div>

                {/* Download icon */}
                <DownloadIcon color={dlColor} />
            </a>
        </>
    );
};

export default AttachmentPill;
