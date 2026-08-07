import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setRole } from '../services/roleService';
import type { UserRole } from '../services/roleService';

/**
 * RoleSelect
 *
 * Shown to authenticated users whose role has not yet been resolved,
 * and to landlords/agents switching roles from DashboardSettings.
 *
 * After the user picks a role:
 *   1. Write to Firestore via setRole() (3-second timeout; falls back to
 *      localStorage so the app still works if Firestore is unreachable).
 *   2. Patch the in-memory AuthContext user immediately via patchUser() so
 *      the updated role is visible to every component in the tree before we
 *      navigate — no full page reload, no re-run of resolveRole() with stale
 *      Firestore data, no MSAL redirect loop.
 *   3. Use React Router navigate() (soft navigation) to reach the dashboard.
 */
const RoleSelect: React.FC = () => {
  const { user, isLoading, patchUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<'tenant' | 'landlord' | null>(null);

  const handleSelect = async (role: UserRole) => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      // Write to Firestore (race against 3 s so we never hang indefinitely).
      await Promise.race([
        setRole(user.id, user.email, role, 'manual_select'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 3000),
        ),
      ]);
    } catch (err) {
      // Non-fatal: persist locally so the role survives the session even if
      // Firestore is offline or security rules block the write.
      console.warn('[RoleSelect] setRole timed out or failed — falling back to localStorage:', err);
      localStorage.setItem(`proptii_role_${user.id}`, role);
    }

    // Update the in-memory user BEFORE navigating so ProtectedRoute sees
    // the new role immediately and never redirects back to /login or /select-role.
    patchUser({ roles: [role], roleResolved: true });

    // Soft navigation — React Router keeps the app mounted; no page reload,
    // no re-run of resolveRole(), no MSAL redirect.
    if (role === 'landlord' || role === 'agent') {
      navigate('/landlord', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
    // Reset saving state — the component stays mounted briefly during navigation.
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Subtle background blobs */}
      <div style={styles.blob1} aria-hidden="true" />
      <div style={styles.blob2} aria-hidden="true" />

      <div style={styles.card}>
        {/* Logo */}
        <img
          src="/images/proptii-logo.png"
          alt="Proptii"
          style={styles.logo}
        />

        <h1 style={styles.heading}>Welcome to Proptii</h1>
        <p style={styles.subheading}>
          Tell us how you'll be using the platform so we can set up
          the right experience for you.
        </p>

        <div style={styles.optionsRow}>
          {/* Tenant card */}
          <button
            id="role-select-tenant"
            disabled={saving}
            onClick={() => handleSelect('tenant')}
            onMouseEnter={() => setHovered('tenant')}
            onMouseLeave={() => setHovered(null)}
            aria-label="I'm looking for a home — select tenant role"
            style={{
              ...styles.optionCard,
              ...(hovered === 'tenant' ? styles.optionCardHover : {}),
              ...(saving ? styles.optionCardDisabled : {}),
            }}
          >
            <div style={{ ...styles.optionIcon, background: 'linear-gradient(135deg, #136C9E22, #136C9E44)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
                  stroke="#136C9E" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 21V12h6v9" stroke="#136C9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={styles.optionTitle}>I'm looking for a home</h2>
            <p style={styles.optionDesc}>
              Search listings, book viewings, sign contracts, and manage
              your entire rental journey in one place.
            </p>
            <div style={{ ...styles.optionBadge, borderColor: '#136C9E', color: '#136C9E' }}>
              Tenant dashboard →
            </div>
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLabel}>or</span>
          </div>

          {/* Landlord card */}
          <button
            id="role-select-landlord"
            disabled={saving}
            onClick={() => handleSelect('landlord')}
            onMouseEnter={() => setHovered('landlord')}
            onMouseLeave={() => setHovered(null)}
            aria-label="I manage properties — select landlord role"
            style={{
              ...styles.optionCard,
              ...(hovered === 'landlord' ? styles.optionCardHover : {}),
              ...(saving ? styles.optionCardDisabled : {}),
            }}
          >
            <div style={{ ...styles.optionIcon, background: 'linear-gradient(135deg, #DC5F1222, #DC5F1244)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="20" height="14" rx="1" stroke="#DC5F12" strokeWidth="1.8" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#DC5F12" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 12v4M10 14h4" stroke="#DC5F12" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={styles.optionTitle}>I manage properties</h2>
            <p style={styles.optionDesc}>
              List properties, handle tenancy applications, collect references,
              and manage your portfolio from one dashboard.
            </p>
            <div style={{ ...styles.optionBadge, borderColor: '#DC5F12', color: '#DC5F12' }}>
              Landlord / Agent dashboard →
            </div>
          </button>
        </div>

        {saving && (
          <div style={styles.savingBar}>
            <div style={styles.savingSpinner} />
            <span style={{ color: '#555', fontSize: 14 }}>Setting up your account…</span>
          </div>
        )}

        {error && (
          <p style={styles.error} role="alert">{error}</p>
        )}

        <p style={styles.footer}>
          You can update this later in your account settings.
        </p>
      </div>
    </div>
  );
};

/* ─── styles ────────────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    fontFamily: 'Archivo, Inter, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px 16px',
  },
  blob1: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #136C9E18, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-100px',
    left: '-100px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #DC5F1218, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    padding: '48px 40px 36px',
    maxWidth: '820px',
    width: '100%',
    position: 'relative',
    textAlign: 'center',
  },
  logo: {
    height: '40px',
    marginBottom: '32px',
    objectFit: 'contain',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F2537',
    marginBottom: '12px',
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '40px',
    maxWidth: '480px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6,
  },
  optionsRow: {
    display: 'flex',
    gap: '0',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  optionCard: {
    flex: '1 1 260px',
    maxWidth: '320px',
    border: '2px solid #E5E7EB',
    borderRadius: '16px',
    padding: '32px 24px',
    cursor: 'pointer',
    background: '#fff',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  optionCardHover: {
    borderColor: '#003450',
    boxShadow: '0 4px 20px rgba(0,52,80,0.12)',
    transform: 'translateY(-3px)',
  },
  optionCardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  optionIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
    flexShrink: 0,
  },
  optionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F2537',
    margin: '0',
  },
  optionDesc: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: 1.6,
    margin: '0',
    flexGrow: 1,
  },
  optionBadge: {
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid',
    borderRadius: '20px',
    padding: '6px 16px',
    marginTop: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    color: '#D1D5DB',
    fontSize: '13px',
    flexShrink: 0,
  },
  dividerLabel: {
    padding: '0 4px',
    color: '#9CA3AF',
    fontWeight: 500,
  },
  savingBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '24px',
  },
  savingSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid #E5E7EB',
    borderTop: '2px solid #003450',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    color: '#DC2626',
    fontSize: '14px',
    marginTop: '16px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 16px',
  },
  footer: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '28px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E5E7EB',
    borderTop: '3px solid #003450',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default RoleSelect;
