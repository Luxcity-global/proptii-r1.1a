// Feature: proptii-communication, Property 3: Call CTA renders as tel: anchor for valid E.164 numbers

/**
 * Validates: Requirements 2.3
 *
 * Property 3: Call CTA renders as tel: anchor for valid E.164 numbers
 *
 * For any valid E.164 phone number, ListingCard must render an <a> element
 * whose href attribute equals `tel:{e164}`.
 */

import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import ListingCard from '../../ListingCard';

// Mock AuthContext so the component doesn't need a real MSAL provider
vi.mock('../../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        editProfile: vi.fn(),
        refreshUserData: vi.fn(),
    }),
}));

// Mock MessagingContext
vi.mock('../../../../contexts/MessagingContext', () => ({
    useMessagingContext: () => ({
        conversations: [],
        unreadCount: 0,
        activeConversationId: null,
        setActiveConversationId: vi.fn(),
        refreshConversations: vi.fn(),
    }),
}));

/** Minimal valid Property object with a given phone value */
function makeProperty(phone: string) {
    return {
        id: 'test-id',
        title: 'Test Property',
        price: 1500,
        type: 'rent' as const,
        bedrooms: 2,
        bathrooms: 1,
        location: {
            address: '1 Test Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            coordinates: [51.5, -0.1] as [number, number],
        },
        images: [
            { src: '/img1.jpg', alt: 'Main', loading: 'lazy', sizes: '100vw' },
            { src: '/img2.jpg', alt: 'Side 1', loading: 'lazy', sizes: '100vw' },
            { src: '/img3.jpg', alt: 'Side 2', loading: 'lazy', sizes: '100vw' },
            { src: '/img4.jpg', alt: 'Side 3', loading: 'lazy', sizes: '100vw' },
        ],
        features: [],
        description: 'A test property',
        agent: {
            name: 'Agent Name',
            company: 'Test Agency',
            phone: phone,
            email: 'agent@test.com',
        },
        amenities: {
            schools: 2,
            transport: ['Bus'],
            shops: ['Supermarket'],
        },
        phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

describe('Property 3: Call CTA renders as tel: anchor for valid E.164 numbers', () => {
    it('renders <a href="tel:{e164}"> for any valid E.164 phone number', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^\+[1-9]\d{6,14}$/),
                (e164) => {
                    const { unmount } = render(
                        <MemoryRouter>
                            <ListingCard property={makeProperty(e164)} viewMode="grid" />
                        </MemoryRouter>
                    );

                    const anchor = screen.getByRole('link', { name: /call/i });
                    const href = anchor.getAttribute('href');

                    unmount();

                    return href === `tel:${e164}`;
                }
            ),
            { numRuns: 25 }
        );
    });
});
