import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setRole } from '../services/roleService';
import type { UserRole } from '../services/roleService';

/**
 * RoleSelect — shown to authenticated users with no role assigned yet,
 * and to landlords/agents switching to tenant view from Settings.
 *
 * Design: centred card on a soft gradient background, two side-by-side
 * role panels following the Proptii brand reference.
 */
const RoleSelect: React.FC = () => {
  const { user, isLoading, patchUser } = useAuth();
  const navigate = useNavigate();
  const [saving,  setSaving]  = useState(false);
  const [hovered, setHovered] = useState<'tenant' | 'landlord' | null>(null);

  const handleSelect = async (role: UserRole) => {
    if (!user || saving) return;
    setSaving(true);

    try {
      await Promise.race([
        setRole(user.id, user.email, role, 'manual_select'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000),
        ),
      ]);
    } catch {
      // Non-fatal — persist locally so the role survives this session
      localStorage.setItem(`proptii_role_${user.id}`, role);
    }

    // Patch in-memory user BEFORE navigating so ProtectedRoute sees the new role
    patchUser({ roles: [role], roleResolved: true });

    navigate(role === 'landlord' || role === 'agent' ? '/landlord' : '/dashboard', {
      replace: true,
    });
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div style={S.loadingPage}>
        <div style={S.loadingSpinner} />
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* ── Outer card ────────────────────────────────────────────────── */}
      <div style={S.card}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.logoRow}>
            <img src="/images/Logo-only.png" alt="" style={S.logoIcon} />
            <span style={S.logoText}>proptii</span>
          </div>
          <h1 style={S.heading}>Refining the way you<br />experience property.</h1>
          <p style={S.subheading}>
            Select your profile to personalise your dashboard and tools.<br />
            This can be updated later in your account settings.
          </p>
        </div>

        {/* ── Role cards ──────────────────────────────────────────────── */}
        <div style={S.cardsRow}>

          {/* ── Tenant card ─────────────────────────────────────────── */}
          <button
            disabled={saving}
            onClick={() => handleSelect('tenant')}
            onMouseEnter={() => setHovered('tenant')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...S.roleCard,
              ...S.tenantCard,
              ...(hovered === 'tenant' ? S.tenantCardHover : {}),
              ...(saving ? S.cardDisabled : {}),
            }}
            aria-label="I'm looking for a home — tenant"
          >
            {/* Badge + CTA row */}
            <div style={S.cardTopRow}>
              <span style={{ ...S.badge, ...S.tenantBadge }}>RESIDENTIAL / EXPLORER</span>
              <span style={{ ...S.ctaPill, ...S.tenantCta }}>
                {saving ? 'Setting up…' : 'Tenant Dashboard →'}
              </span>
            </div>

            {/* Content + photo row */}
            <div style={S.cardBody}>
              <div style={S.cardText}>
                <h2 style={{ ...S.cardHeading, color: '#030712' }}>Find a home</h2>
                <p style={S.cardDesc}>
                  Browse verified listings, schedule seamless viewings, and manage
                  your rental agreements in one unified interface.
                </p>

                {/* Stats */}
                <div style={S.statsRow}>
                  <div style={S.stat}>
                    <span style={{ ...S.statValue, color: '#136C9E' }}>5k+</span>
                    <span style={S.statLabel}>live listings</span>
                  </div>
                  <div style={S.stat}>
                    <span style={{ ...S.statValue, color: '#136C9E' }}>0%</span>
                    <span style={S.statLabel}>platform fees</span>
                  </div>
                </div>
              </div>

              {/* Property photo */}
              <div style={S.photoWrap}>
                <img
                  src="/images/British-home-w2974.jpg"
                  alt=""
                  style={{
                    ...S.photo,
                    transform: hovered === 'tenant' ? 'scale(1.04)' : 'scale(1)',
                  }}
                  loading="eager"
                />
              </div>
            </div>

            {/* Saving overlay */}
            {saving && (
              <div style={S.savingOverlay}>
                <div style={S.spinnerSmall} />
              </div>
            )}
          </button>

          {/* ── Divider dot ─────────────────────────────────────────── */}
          <div style={S.dividerDot}>
            <span style={S.dot} />
          </div>

          {/* ── Landlord card ───────────────────────────────────────── */}
          <button
            disabled={saving}
            onClick={() => handleSelect('landlord')}
            onMouseEnter={() => setHovered('landlord')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...S.roleCard,
              ...S.landlordCard,
              ...(hovered === 'landlord' ? S.landlordCardHover : {}),
              ...(saving ? S.cardDisabled : {}),
            }}
            aria-label="I manage properties — landlord or agent"
          >
            {/* Badge + CTA row */}
            <div style={S.cardTopRow}>
              <span style={{ ...S.badge, ...S.landlordBadge }}>MANAGEMENT · SCALE</span>
              <span style={{ ...S.ctaPill, ...S.landlordCta }}>
                {saving ? 'Setting up…' : 'Landlord/Agent Dashboard →'}
              </span>
            </div>

            {/* Content + photo row */}
            <div style={S.cardBody}>
              <div style={S.cardText}>
                <h2 style={{ ...S.cardHeading, color: '#261A00' }}>Manage assets</h2>
                <p style={S.cardDesc}>
                  List properties, handle tenancy applications, collect references,
                  and manage your portfolio from one dashboard.
                </p>

                {/* Stats */}
                <div style={S.statsRow}>
                  <div style={S.stat}>
                    <span style={{ ...S.statValue, color: '#9A6000' }}>Enterprise</span>
                    <span style={S.statLabel}>tools</span>
                  </div>
                  <div style={S.stat}>
                    <span style={{ ...S.statValue, color: '#9A6000' }}>Real-time</span>
                    <span style={S.statLabel}>analytics</span>
                  </div>
                </div>
              </div>

              {/* Property photo */}
              <div style={S.photoWrap}>
                <img
                  src="/images/modern-building.jpg"
                  alt=""
                  style={{
                    ...S.photo,
                    transform: hovered === 'landlord' ? 'scale(1.04)' : 'scale(1)',
                  }}
                  loading="eager"
                />
              </div>
            </div>

            {/* Saving overlay */}
            {saving && (
              <div style={S.savingOverlay}>
                <div style={S.spinnerSmall} />
              </div>
            )}
          </button>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <p style={S.footer}>You can update this later in your account settings.</p>
      </div>
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const S: Record<string, React.CSSProperties> = {
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #CBE6FF 0%, #f8fbff 40%, #fff8ee 70%, #FFEFD4 100%)',
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '3px solid #E5E7EB',
    borderTopColor: '#136C9E',
    animation: 'spin 0.8s linear infinite',
  },

  // Page: soft gradient matching the reference colour stops
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(135deg, #CBE6FF 0%, #f0f7ff 35%, #fffdf8 65%, #FFEFD4 100%)',
    fontFamily: 'Archivo, Inter, sans-serif',
  },

  // Outer card — white, large radius, subtle shadow
  card: {
    background: '#ffffff',
    borderRadius: 24,
    boxShadow: '0 8px 48px rgba(54,65,83,0.12)',
    padding: '40px 36px 28px',
    maxWidth: 900,
    width: '100%',
  },

  // ── Header ──────────────────────────────────────────────────────────────

  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  logoIcon: {
    height: 24,
    width: 24,
    objectFit: 'contain',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#136C9E',
    letterSpacing: '-0.02em',
  },
  heading: {
    fontSize: 'clamp(22px, 3.5vw, 32px)',
    fontWeight: 700,
    color: '#364153',
    lineHeight: 1.2,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 1.6,
    maxWidth: 400,
    margin: '0 auto',
  },

  // ── Cards row ────────────────────────────────────────────────────────────

  cardsRow: {
    display: 'flex',
    gap: 0,
    alignItems: 'stretch',
  },

  dividerDot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 12px',
    flexShrink: 0,
  },
  dot: {
    display: 'block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#364153',
    opacity: 0.25,
  },

  // ── Shared role card ─────────────────────────────────────────────────────

  roleCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '20px 20px 16px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
  },
  cardDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  // Tenant card: #CBE6FF tint
  tenantCard: {
    background: '#EFF8FF',
  },
  tenantCardHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 32px rgba(19,108,158,0.18)',
  },

  // Landlord card: #FFEFD4 tint
  landlordCard: {
    background: '#FFFAF0',
  },
  landlordCardHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 32px rgba(154,96,0,0.18)',
  },

  // ── Card internals ───────────────────────────────────────────────────────

  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },

  badge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '3px 10px',
    borderRadius: 999,
  },
  tenantBadge: {
    background: '#8FCDFF',
    color: '#030712',
  },
  landlordBadge: {
    background: '#FEDFA0',
    color: '#261A00',
  },

  ctaPill: {
    fontSize: 12,
    fontWeight: 600,
    padding: '5px 14px',
    borderRadius: 999,
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.2s',
  },
  tenantCta: {
    background: '#CBE6FF',
    color: '#0F4A70',
  },
  landlordCta: {
    background: '#FFEFD4',
    color: '#7A4A00',
  },

  cardBody: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
    flex: 1,
  },
  cardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardHeading: {
    fontSize: 'clamp(20px, 2.5vw, 26px)',
    fontWeight: 700,
    lineHeight: 1.15,
    margin: 0,
  },
  cardDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 220,
  },

  statsRow: {
    display: 'flex',
    gap: 16,
    marginTop: 6,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  photoWrap: {
    flexShrink: 0,
    width: 130,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
    display: 'block',
  },

  savingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    backdropFilter: 'blur(2px)',
  },
  spinnerSmall: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid #E5E7EB',
    borderTopColor: '#136C9E',
    animation: 'spin 0.8s linear infinite',
  },

  // ── Footer ───────────────────────────────────────────────────────────────

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
    marginBottom: 0,
  },
};

export default RoleSelect;
