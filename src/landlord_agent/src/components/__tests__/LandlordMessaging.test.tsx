import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MessagingProvider, MessagingContext } from '../../../../contexts/MessagingContext';
import { TenantInbox } from '../TenantInbox';
import { MainLayout } from '../MainLayout';
import { Dashboard } from '../Dashboard';
import communicationService from '../../../../services/communicationService';

vi.mock('../../../../services/communicationService', () => ({
  default: {
    getConversations: vi.fn(),
    getUnreadCount: vi.fn(),
    getOrCreateConversation: vi.fn(),
    getMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false }),
    markRead: vi.fn().mockResolvedValue({ success: true }),
    sendMessage: vi.fn(),
  },
}));

vi.mock('../../../../services/viewingService', () => ({
  default: {
    getViewingsByProperty: vi.fn().mockResolvedValue([]),
    getAllViewings: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../../services/viewingInboxService', () => ({
  listViewingsForLandlord: vi.fn().mockResolvedValue({ viewings: [] }),
}));

vi.mock('../../../../services/msalAccessToken', () => ({
  getAccessTokenForApiRequest: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../../config/apiBaseUrl', () => ({
  getResolvedApiBaseUrl: vi.fn().mockReturnValue('https://api.proptii-test.com/api'),
}));

vi.mock('../ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <>{children}</>,
}));

vi.mock('../ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => ({ state: 'expanded', toggleSidebar: vi.fn() }),
}));

vi.mock('../ui/sheet', () => ({
  Sheet: ({ children }: any) => <>{children}</>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

import AuthContext from '../../../../contexts/AuthContext';

describe('Landlord Messaging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  const mockUserProfile = {
    name: 'Sarah Landlord',
    email: 'sarah@example.com',
    phone: '07123456789',
    id: 'landlord_123',
  };

  const mockAuthValue: any = {
    user: mockUserProfile,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  it('renders conversations in TenantInbox when wrapped in MessagingProvider', async () => {
    const mockConvs = [
      {
        id: 'conv_1',
        tenantId: 'tenant_1',
        tenantName: 'John Doe',
        landlordId: 'landlord_123',
        propertyId: 'prop_1',
        propertyTitle: '12 Baker Street',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Hello, is this available?',
        unreadForLandlord: 1,
        unreadForTenant: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    (communicationService.getConversations as any).mockResolvedValue(mockConvs);
    (communicationService.getUnreadCount as any).mockResolvedValue(1);

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <MessagingProvider>
            <TenantInbox
              userProfile={mockUserProfile}
              onViewInsights={vi.fn()}
              onViewSettings={vi.fn()}
              onViewNotifications={vi.fn()}
            />
          </MessagingProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Initial heading should be visible
    expect(screen.getByText('Messages')).toBeInTheDocument();

    // Conversation should appear once fetched
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('12 Baker Street')).toBeInTheDocument();
    });
  });

  it('shows live unread indicator in MainLayout when unreadCount > 0', () => {
    const mockContextValue: any = {
      conversations: [],
      unreadCount: 3,
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

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <MessagingContext.Provider value={mockContextValue}>
            <MainLayout
              currentScreen="dashboard"
              onNavigate={vi.fn()}
              userProfile={mockUserProfile}
              userRole="landlord"
              isAuthenticated={true}
            >
              <div>Dashboard Content</div>
            </MainLayout>
          </MessagingContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Messages button in sidebar
    const messagesButtons = screen.getAllByRole('button', { name: /messages/i });
    expect(messagesButtons.length).toBeGreaterThan(0);

    // Should have notification dot element rendered for Messages
    const dotElements = document.querySelectorAll('.ll-sidebar-nav-dot');
    expect(dotElements.length).toBeGreaterThan(0);
  });

  it('renders Messages header button on Dashboard and navigates on click', () => {
    const onViewMessages = vi.fn();

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <MessagingProvider>
            <Dashboard
              properties={[]}
              unassignedDocuments={[]}
              tenants={[]}
              userProfile={mockUserProfile}
              isAuthenticated={true}
              onAddProperty={vi.fn()}
              onViewProperty={vi.fn()}
              onManageDocuments={vi.fn()}
              onManagePhotos={vi.fn()}
              onViewInsights={vi.fn()}
              onViewMessages={onViewMessages}
              marketInsights={[]}
            />
          </MessagingProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const msgBtn = screen.getByTitle('Messages');
    expect(msgBtn).toBeInTheDocument();

    fireEvent.click(msgBtn);
    expect(onViewMessages).toHaveBeenCalled();
  });
});
