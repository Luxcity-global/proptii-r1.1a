/**
 * Unit tests for DashboardSidebar component.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock react-router-dom so we don't need a Router wrapper
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

// Mock AuthContext
vi.mock('../../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

// Mock Dashboard to avoid importing the full module with all its deps
vi.mock('../Dashboard', async () => {
    const React = await import('react');
    return {
        DASHBOARD_SECTIONS: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                path: '/dashboard',
                icon: () => React.createElement('svg', { 'data-testid': 'icon-dashboard' }),
            },
            {
                id: 'messages',
                label: 'Messages',
                path: '/dashboard/messages',
                icon: () => React.createElement('svg', { 'data-testid': 'icon-messages' }),
            },
        ],
    };
});

// MessagingContext mock — we control unreadCount per test
let mockUnreadCount = 0;
vi.mock('../../../../contexts/MessagingContext', () => ({
    useMessagingContext: () => ({ unreadCount: mockUnreadCount }),
}));

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks are set up
// ---------------------------------------------------------------------------

import DashboardSidebar, { getUnreadBadgeLabel } from '../DashboardSidebar';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSidebar(unreadCount: number) {
    mockUnreadCount = unreadCount;
    return render(
        <DashboardSidebar
            activeSection="dashboard"
            onSectionChange={() => { }}
            isCollapsed={false}
            onToggleCollapse={() => { }}
        />
    );
}

// ---------------------------------------------------------------------------
// getUnreadBadgeLabel unit tests
// ---------------------------------------------------------------------------

describe('getUnreadBadgeLabel', () => {
    it('returns null when count is 0', () => {
        expect(getUnreadBadgeLabel(0)).toBeNull();
    });

    it('returns null when count is negative', () => {
        expect(getUnreadBadgeLabel(-1)).toBeNull();
    });

    it('returns the numeric string for count 1', () => {
        expect(getUnreadBadgeLabel(1)).toBe('1');
    });

    it('returns the numeric string for count 99', () => {
        expect(getUnreadBadgeLabel(99)).toBe('99');
    });

    it('returns "99+" for count 100', () => {
        expect(getUnreadBadgeLabel(100)).toBe('99+');
    });

    it('returns "99+" for count 200', () => {
        expect(getUnreadBadgeLabel(200)).toBe('99+');
    });
});

// ---------------------------------------------------------------------------
// DashboardSidebar badge rendering tests
// ---------------------------------------------------------------------------

describe('DashboardSidebar — unread badge', () => {
    it('does not render a badge when unreadCount is 0', () => {
        renderSidebar(0);
        expect(screen.queryByTestId('unread-badge')).toBeNull();
    });

    it('renders a badge with the numeric count when unreadCount is between 1 and 99', () => {
        renderSidebar(5);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('5');
    });

    it('renders a badge with "99+" when unreadCount exceeds 99', () => {
        renderSidebar(150);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('99+');
    });

    it('renders a badge with "99+" when unreadCount is exactly 100', () => {
        renderSidebar(100);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('99+');
    });

    it('renders a badge with "1" when unreadCount is 1', () => {
        renderSidebar(1);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('1');
    });

    it('renders a badge with "99" when unreadCount is 99', () => {
        renderSidebar(99);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('99');
    });

    it('badge has a red background color', () => {
        renderSidebar(3);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('badge is positioned absolutely over the icon', () => {
        renderSidebar(3);
        const badge = screen.getByTestId('unread-badge');
        expect(badge).toHaveStyle({ position: 'absolute' });
    });
});
