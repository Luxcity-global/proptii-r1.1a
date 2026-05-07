/**
 * Property-based tests for DashboardSidebar unread badge.
 *
 * Property 27: Unread badge displays correct count and hides at zero
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getUnreadBadgeLabel } from '../../DashboardSidebar';

// ---------------------------------------------------------------------------
// Property 27: Unread badge displays correct count and hides at zero
// ---------------------------------------------------------------------------

describe('Property 27: Unread badge displays correct count and hides at zero', () => {
    it('badge is hidden (null) when unreadCount is 0', () => {
        expect(getUnreadBadgeLabel(0)).toBeNull();
    });

    it('badge shows numeric value for counts 1–99', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 99 }), (count) => {
                const label = getUnreadBadgeLabel(count);
                // Badge must be visible (non-null)
                expect(label).not.toBeNull();
                // Badge must show the exact numeric count
                expect(label).toBe(String(count));
            }),
            { numRuns: 100 }
        );
    });

    it('badge shows "99+" for counts greater than 99', () => {
        fc.assert(
            fc.property(fc.integer({ min: 100, max: 200 }), (count) => {
                const label = getUnreadBadgeLabel(count);
                // Badge must be visible (non-null)
                expect(label).not.toBeNull();
                // Badge must show "99+" for any count over 99
                expect(label).toBe('99+');
            }),
            { numRuns: 100 }
        );
    });

    it('badge is hidden (null) for any non-positive count', () => {
        fc.assert(
            fc.property(fc.integer({ min: -1000, max: 0 }), (count) => {
                const label = getUnreadBadgeLabel(count);
                expect(label).toBeNull();
            }),
            { numRuns: 100 }
        );
    });
});
