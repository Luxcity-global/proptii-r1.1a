import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MessagingContext } from '../../../../contexts/MessagingContext';
import AuthContext from '../../../../contexts/AuthContext';

let mockLandlordBilling = {
  plan: 'landlord_pro' as string | null,
  status: 'active' as string | null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  pendingPlan: null,
  pendingCycle: null,
  billingCadence: 'monthly',
  fitChecksUsed: null,
  fitChecksQuota: null,
  hasStripeCustomer: true,
  loading: false,
  error: null,
  refresh: vi.fn(),
};

vi.mock('../../hooks/useLandlordBillingStatus', () => ({
  useLandlordBillingStatus: () => mockLandlordBilling,
}));

vi.mock('../LandlordPlanCompareModal', () => ({
  default: ({ open, defaultAudience }: { open: boolean; defaultAudience?: string }) =>
    open ? <div data-testid="landlord-plan-compare-modal" data-audience={defaultAudience} /> : null,
}));

vi.mock('../ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ state: 'expanded', toggleSidebar: vi.fn() }),
}));

vi.mock('../ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { MainLayout } from '../MainLayout';

const mockMessagingValue: any = {
  conversations: [],
  unreadCount: 0,
  onlineUsers: {},
  activeConversationId: null,
  setActiveConversationId: vi.fn(),
  refreshConversations: vi.fn(),
  markConversationAsRead: vi.fn(),
  decrementUnreadCount: vi.fn(),
  _setConversations: vi.fn(),
  _setUnreadCount: vi.fn(),
  _setOnlineUsers: vi.fn(),
};

describe('MainLayout landlord sidebar profile, tier pill & actions', () => {
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

    mockLandlordBilling = {
      ...mockLandlordBilling,
      plan: 'landlord_pro',
      status: 'active',
      loading: false,
      hasStripeCustomer: true,
    };
  });

  it('renders user photo, platform-blue Landlord Pro badge, and Upgrade button', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: { id: 'll-1', name: 'Sarah Landlord', email: 'sarah@example.com', photoURL: 'https://example.com/ll.jpg', roles: ['landlord'], roleResolved: true },
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
          } as any}
        >
          <MessagingContext.Provider value={mockMessagingValue}>
            <MainLayout
              currentScreen="dashboard"
              onNavigate={vi.fn()}
              userProfile={{ id: 'll-1', name: 'Sarah Landlord', email: 'sarah@example.com', phone: '', photoURL: 'https://example.com/ll.jpg' }}
              userRole="landlord"
              isAuthenticated={true}
            >
              <div>Body</div>
            </MainLayout>
          </MessagingContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    const imgs = screen.getAllByAltText('Sarah Landlord') as HTMLImageElement[];
    expect(imgs[0].src).toBe('https://example.com/ll.jpg');

    const badges = screen.getAllByTestId('landlord-sidebar-tier-badge');
    expect(badges[0]).toHaveTextContent('Landlord Pro');
    expect(badges[0]).toHaveStyle({ backgroundColor: '#E6F3FF', color: '#136C9E' });

    const upgradeBtns = screen.getAllByRole('button', { name: /upgrade/i });
    fireEvent.click(upgradeBtns[0]);
    expect(screen.getByTestId('landlord-plan-compare-modal')).toHaveAttribute('data-audience', 'landlords');
  });

  it('renders Manage button for top-tier Elite plan and navigates to settings', () => {
    mockLandlordBilling = {
      ...mockLandlordBilling,
      plan: 'elite',
      status: 'active',
    };
    const onNavigate = vi.fn();

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn() } as any}>
          <MessagingContext.Provider value={mockMessagingValue}>
            <MainLayout
              currentScreen="dashboard"
              onNavigate={onNavigate}
              userProfile={{ id: 'll-1', name: 'Sarah Landlord', email: 'sarah@example.com', phone: '' }}
              userRole="landlord"
              isAuthenticated={true}
            >
              <div>Body</div>
            </MainLayout>
          </MessagingContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId('landlord-sidebar-tier-badge')[0]).toHaveTextContent('Elite');
    const manageBtns = screen.getAllByRole('button', { name: /manage/i });
    fireEvent.click(manageBtns[0]);
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('falls back to Explorer and Upgrade when landlord subscription is canceled', () => {
    mockLandlordBilling = {
      ...mockLandlordBilling,
      plan: 'landlord_pro',
      status: 'canceled',
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn() } as any}>
          <MessagingContext.Provider value={mockMessagingValue}>
            <MainLayout
              currentScreen="dashboard"
              onNavigate={vi.fn()}
              userProfile={{ id: 'll-1', name: 'Sarah Landlord', email: 'sarah@example.com', phone: '' }}
              userRole="agent"
              isAuthenticated={true}
            >
              <div>Body</div>
            </MainLayout>
          </MessagingContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    const badge = screen.getAllByTestId('landlord-sidebar-tier-badge')[0];
    expect(badge).toHaveTextContent('Explorer');
    expect(badge).toHaveStyle({ backgroundColor: '#F1F5F9', color: '#475569' });
    expect(screen.getAllByRole('button', { name: /upgrade/i }).length).toBeGreaterThan(0);
  });
});
