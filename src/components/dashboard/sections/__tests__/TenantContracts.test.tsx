import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockBillingState = {
  plan: null as string | null,
  status: null as string | null,
  hasStripeCustomer: false,
  loading: true,
  error: null as string | null,
  refresh: vi.fn(),
};

vi.mock('../../../../hooks/useBillingStatus', () => ({
  useBillingStatus: () => mockBillingState,
}));

vi.mock('../../../../contexts/SignedContractsContext', () => ({
  useSignedContracts: () => ({
    signedContracts: [],
    isLoading: false,
    removeSignedContract: vi.fn(),
  }),
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'u-1', name: 'Miracle Ohuka', email: 'miracle@example.com' },
  }),
}));

vi.mock('../../../contract/ContractModal', () => ({
  default: ({ isOpen, locked }: { isOpen: boolean; locked?: boolean }) =>
    isOpen ? <div data-testid="contract-modal" data-locked={String(Boolean(locked))} /> : null,
}));

import TenantContracts from '../TenantContracts-new';

describe('TenantContracts billing loading gate', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    mockBillingState = {
      plan: null,
      status: null,
      hasStripeCustomer: false,
      loading: true,
      error: null,
      refresh: vi.fn(),
    };
  });

  it('shows skeleton instead of PlanUpgradeWall while billing status is loading', () => {
    const { container } = render(
      <MemoryRouter>
        <TenantContracts />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/contracts is a paid feature/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('contract-modal')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.tn-ct-skel').length).toBeGreaterThan(0);
  });

  it('shows PlanUpgradeWall once billing finishes loading on Explorer tier', () => {
    mockBillingState = {
      ...mockBillingState,
      plan: 'explorer',
      status: 'active',
      loading: false,
    };

    render(
      <MemoryRouter>
        <TenantContracts />
      </MemoryRouter>,
    );

    expect(screen.getByText(/contracts is a paid feature/i)).toBeInTheDocument();
  });

  it('renders contracts view immediately once billing finishes loading on Buyer Pro', () => {
    mockBillingState = {
      ...mockBillingState,
      plan: 'buyer_pro',
      status: 'active',
      loading: false,
    };

    render(
      <MemoryRouter>
        <TenantContracts />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/contracts is a paid feature/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Total Contracts/i)).toBeInTheDocument();
  });
});
