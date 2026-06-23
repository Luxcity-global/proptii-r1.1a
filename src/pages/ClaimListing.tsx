import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAccessTokenForApiRequest } from '../services/msalAccessToken';

const FUNCTIONS_BASE = (import.meta.env.VITE_API_ENDPOINT || 'http://localhost:7071').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
const CheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const AlertIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const SpinnerIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ClaimListing: React.FC = () => {
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const { isAuthenticated, user, login } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Don't re-run if we've already started/finished claiming
        if (status !== 'idle') return;

        if (!propertyId) {
            setStatus('error');
            setErrorMessage('Invalid property link. Missing property ID.');
            return;
        }

        if (isAuthenticated && user) {
            handleClaim(propertyId);
        }
    }, [isAuthenticated, user, propertyId, status]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClaim = async (propId: string) => {
        setStatus('claiming');
        try {
            const token = await getAccessTokenForApiRequest();
            const response = await fetch(`${FUNCTIONS_BASE}/api/properties/${propId}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data = await response.json();

            if (response.status === 409) {
                setStatus('error');
                setErrorMessage('This property has already been claimed by another user.');
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to claim property');
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'An error occurred while claiming the property.');
        }
    };

    const handleLogin = () => {
        // Store the full claim URL so AuthRedirectHandler brings us back here after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        login();
    };

    // Shared card container
    const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)', padding: '20px',
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', padding: '48px 40px',
                maxWidth: '480px', width: '100%', textAlign: 'center',
                boxShadow: '0 8px 40px rgba(59,130,246,0.12)', border: '1px solid #e5e7eb',
            }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                {children}
            </div>
        </div>
    );

    if (status === 'error') {
        return (
            <Card>
                <AlertIcon />
                <h1 style={{ color: '#ef4444', margin: '20px 0 12px', fontSize: '1.5rem', fontWeight: 700 }}>
                    Cannot Claim Property
                </h1>
                <p style={{ color: '#6b7280', marginBottom: '32px', lineHeight: 1.6 }}>{errorMessage}</p>
                <button onClick={() => navigate('/')} style={btnStyle('#3b82f6')}>
                    Return Home
                </button>
            </Card>
        );
    }

    if (status === 'success') {
        return (
            <Card>
                <CheckIcon />
                <h1 style={{ color: '#111827', margin: '20px 0 12px', fontSize: '1.5rem', fontWeight: 700 }}>
                    Property Claimed! 🎉
                </h1>
                <p style={{ color: '#6b7280', marginBottom: '32px', lineHeight: 1.6 }}>
                    You now own this listing on Proptii. Any messages sent by interested tenants are waiting in your inbox.
                </p>
                <button onClick={() => navigate('/landlord/messages')} style={btnStyle('#3b82f6')}>
                    View My Messages
                </button>
            </Card>
        );
    }

    if (status === 'claiming') {
        return (
            <Card>
                <SpinnerIcon />
                <h2 style={{ color: '#3b82f6', margin: '24px 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>
                    Verifying your claim…
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Checking your email against this listing. This will only take a moment.
                </p>
            </Card>
        );
    }

    // Default state: not authenticated
    return (
        <Card>
            <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            </div>
            <h1 style={{ color: '#111827', marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>
                Claim Your Property
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '8px', lineHeight: 1.6 }}>
                A tenant is interested in your listing on Proptii. Log in or create an account using the email address we contacted you with to:
            </p>
            <ul style={{ textAlign: 'left', color: '#374151', margin: '16px 0 32px', padding: '0 0 0 20px', lineHeight: 2 }}>
                <li>Claim ownership of the property</li>
                <li>Read the tenant's message</li>
                <li>Reply directly through the platform</li>
                <li>Manage your leads going forward</li>
            </ul>
            <button onClick={handleLogin} style={btnStyle('#3b82f6')}>
                Log In / Register to Claim
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.8125rem', color: '#9ca3af' }}>
                Your account email must match the agent email on this listing.
            </p>
        </Card>
    );
};

function btnStyle(bg: string): React.CSSProperties {
    return {
        display: 'inline-block', width: '100%', padding: '13px 24px',
        background: bg, color: '#fff', border: 'none', borderRadius: '10px',
        cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
        boxShadow: `0 4px 14px ${bg}44`, transition: 'all 0.15s',
    };
}

export default ClaimListing;
