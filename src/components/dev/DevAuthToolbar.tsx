/**
 * DevAuthToolbar — only rendered in development builds (import.meta.env.DEV).
 *
 * Provides one-click mock login as landlord or tenant so you can test the
 * communication module without going through MSAL / Azure B2C.
 *
 * How it works:
 *  1. Calls `loginAsMockUser(id, role)` from AuthContext, which sets
 *     `localStorage.mock_token = "mock-token-<id>"` and populates the user state.
 *  2. The Axios interceptor in msalAccessToken.ts reads `mock_token` first,
 *     so every API call carries `Authorization: Bearer mock-token-<id>`.
 *  3. The Azure Functions backend (api/src/shared/middleware/auth.ts) skips JWT
 *     validation when NODE_ENV=development and the token starts with "mock-token-".
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getResolvedApiBaseUrl } from '../../config/apiBaseUrl';

const MOCK_USERS = [
    { id: 'landlord-test-001', role: 'landlord', label: 'John Smith (Landlord 1)', color: '#1d4ed8' },
    { id: 'landlord-test-002', role: 'landlord', label: 'Jack Smith (Landlord 2)', color: '#6366f1' },
    { id: 'tenant-test-001', role: 'tenant', label: 'Sarah Jones (Tenant 1)', color: '#15803d' },
    { id: 'tenant-test-002', role: 'tenant', label: 'Emily Davis (Tenant 2)', color: '#0f766e' },
] as const;

const DevAuthToolbar: React.FC = () => {
    const { user, loginAsMockUser, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // Only render in dev
    if (!import.meta.env.DEV) return null;

    const isMock = user?.id.startsWith('landlord-test-') || user?.id.startsWith('tenant-test-');

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: 12,
            }}
        >
            {open && (
                <div
                    style={{
                        marginBottom: 8,
                        backgroundColor: '#1e293b',
                        color: '#f1f5f9',
                        borderRadius: 8,
                        padding: '12px 16px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                        minWidth: 240,
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8, color: '#94a3b8', letterSpacing: '0.05em' }}>
                        🧪 DEV AUTH BYPASS
                    </div>

                    {user ? (
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ color: '#86efac', marginBottom: 4 }}>
                                ✓ Signed in as <strong>{user.name}</strong>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                                id: {user.id}
                            </div>
                            <button
                                onClick={() => logout()}
                                style={btnStyle('#dc2626')}
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div style={{ color: '#fca5a5', marginBottom: 10 }}>✗ Not signed in</div>
                    )}

                    <div style={{ borderTop: '1px solid #334155', paddingTop: 10 }}>
                        <div style={{ color: '#94a3b8', marginBottom: 6 }}>Quick login:</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {MOCK_USERS.map(({ id, role, label, color }) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        loginAsMockUser(id, role);
                                        setOpen(false);
                                        if (role === 'landlord') {
                                            navigate('/landlord');
                                        } else {
                                            navigate('/dashboard');
                                        }
                                    }}
                                    style={btnStyle(color)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: 10, marginTop: 10 }}>
                        <div style={{ color: '#94a3b8', marginBottom: 4 }}>API endpoint:</div>
                        <div style={{ color: '#7dd3fc', wordBreak: 'break-all' }}>
                            {getResolvedApiBaseUrl()}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                title="Dev Auth Toolbar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 20,
                    border: 'none',
                    backgroundColor: isMock ? '#15803d' : '#1e293b',
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 600,
                }}
            >
                🧪 {isMock ? `${user?.name}` : 'Dev Login'}
            </button>
        </div>
    );
};

function btnStyle(bg: string): React.CSSProperties {
    return {
        padding: '5px 12px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: bg,
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
    };
}

export default DevAuthToolbar;
