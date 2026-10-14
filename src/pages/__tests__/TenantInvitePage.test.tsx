import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TenantInvitePage from '../TenantInvitePage';

// ── Mock AuthContext ──────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockPatchUser = vi.fn();
let mockAuth = {
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  user: null as any,
  patchUser: mockPatchUser,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

// ── Mock InvitationService ───────────────────────────────────────────────────
const mockValidateInvitation = vi.fn();
const mockClaimInvitation = vi.fn();

vi.mock('../../landlord_agent/src/services/invitationService', () => ({
  invitationService: {
    validateInvitation: (...args: any[]) => mockValidateInvitation(...args),
    claimInvitation: (...args: any[]) => mockClaimInvitation(...args),
  },
}));

describe('TenantInvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = {
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      user: null,
      patchUser: mockPatchUser,
    };
  });

  it('renders loading spinner while validating invitation token', async () => {
    mockValidateInvitation.mockReturnValue(new Promise(() => {})); // pending forever

    render(
      <MemoryRouter initialEntries={['/invite/tenant?token=tok_test_123']}>
        <TenantInvitePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifying your invitation.../i)).toBeInTheDocument();
  });

  it('renders invalid/expired state when token is rejected', async () => {
    mockValidateInvitation.mockResolvedValueOnce({
      valid: false,
      reason: 'EXPIRED',
      message: 'This invitation has expired.',
    });

    render(
      <MemoryRouter initialEntries={['/invite/tenant?token=tok_expired']}>
        <TenantInvitePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Invitation Unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/This invitation has expired/i)).toBeInTheDocument();
    });
  });

  it('renders unauthenticated invitation dossier when token is valid', async () => {
    mockValidateInvitation.mockResolvedValueOnce({
      valid: true,
      invitation: {
        id: 'inv_1',
        token: 'tok_valid',
        propertyId: 'prop_99',
        propertyAddress: '10 High Street, Flat 2',
        landlordName: 'John Smith',
        landlordEmail: 'john@example.com',
        tenantEmail: 'alex@tenant.com',
        rentAmount: 1450,
      },
    });

    render(
      <MemoryRouter initialEntries={['/invite/tenant?token=tok_valid']}>
        <TenantInvitePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You've Been Invited/i)).toBeInTheDocument();
      expect(screen.getByText(/10 High Street, Flat 2/i)).toBeInTheDocument();
      expect(screen.getByText(/John Smith/i)).toBeInTheDocument();
      expect(screen.getByText(/£1,450 \/ mo/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Account or Sign In/i)).toBeInTheDocument();
    });
  });

  it('automatically claims invitation and shows welcome screen when user is authenticated', async () => {
    mockAuth = {
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      user: { id: 'u_123', email: 'alex@tenant.com' },
      patchUser: mockPatchUser,
    };

    mockValidateInvitation.mockResolvedValueOnce({
      valid: true,
      invitation: {
        id: 'inv_1',
        token: 'tok_claim_me',
        propertyId: 'prop_99',
        propertyAddress: '10 High Street, Flat 2',
        landlordName: 'John Smith',
      },
    });

    mockClaimInvitation.mockResolvedValueOnce({
      success: true,
      propertyId: 'prop_99',
    });

    render(
      <MemoryRouter initialEntries={['/invite/tenant?token=tok_claim_me']}>
        <TenantInvitePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockClaimInvitation).toHaveBeenCalledWith('tok_claim_me');
      expect(mockPatchUser).toHaveBeenCalledWith({ roles: ['tenant'], roleResolved: true });
      expect(screen.getByText(/Welcome to Your New Home!/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Go to Tenant Dashboard/i)).toBeInTheDocument();
    });
  });
});
