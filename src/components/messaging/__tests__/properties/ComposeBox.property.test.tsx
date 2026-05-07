// Feature: proptii-communication, Property 23: ComposeBox enforces 4,000-character limit

/**
 * Validates: Requirements 12.2
 *
 * Property 23: ComposeBox enforces 4,000-character limit
 *
 * For any input string of length greater than 4,000 characters, the ComposeBox
 * component SHALL prevent form submission and SHALL display a character counter
 * indicating the limit has been exceeded.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import ComposeBox from '../../ComposeBox';

// ---------------------------------------------------------------------------
// Mock communicationService (not called when over limit)
// ---------------------------------------------------------------------------

vi.mock('../../../../services/communicationService', () => ({
    default: {
        sendMessage: vi.fn(),
        uploadAttachment: vi.fn(),
    },
}));

// ---------------------------------------------------------------------------
// Property 23: ComposeBox enforces 4,000-character limit
// Validates: Requirements 12.2
// ---------------------------------------------------------------------------

describe('Property 23: ComposeBox enforces 4,000-character limit', () => {
    it('disables submit button and shows exceeded state for any input longer than 4,000 characters', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 4001, maxLength: 5000 }),
                (longInput) => {
                    const onSend = vi.fn();

                    const { unmount } = render(
                        <ComposeBox conversationId="conv-test" onSend={onSend} />
                    );

                    const textarea = screen.getByTestId('compose-textarea');
                    const sendButton = screen.getByTestId('send-button');

                    // Use fireEvent.change to set the value directly (avoids per-keypress overhead)
                    fireEvent.change(textarea, { target: { value: longInput } });

                    // Assert submit button is disabled
                    const isDisabled =
                        sendButton.hasAttribute('disabled') ||
                        sendButton.getAttribute('aria-disabled') === 'true';

                    // Assert character counter shows exceeded state
                    const counter = screen.getByTestId('char-counter');
                    const counterText = counter.textContent ?? '';
                    const showsExceeded = counterText.includes(`${longInput.length}/4000`);

                    // Assert error indicator is shown
                    const errorEl = screen.queryByTestId('char-limit-error');
                    const hasError = errorEl !== null;

                    unmount();

                    return isDisabled && showsExceeded && hasError;
                },
            ),
            { numRuns: 10 },
        );
    });

    it('enables submit button for any input within the 4,000-character limit', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 4000 }),
                (validInput) => {
                    const onSend = vi.fn();

                    const { unmount } = render(
                        <ComposeBox conversationId="conv-test" onSend={onSend} />
                    );

                    const textarea = screen.getByTestId('compose-textarea');
                    const sendButton = screen.getByTestId('send-button');

                    // Use fireEvent.change to set the value directly
                    fireEvent.change(textarea, { target: { value: validInput } });

                    // Submit button should NOT be disabled (assuming non-empty input)
                    const isEnabled =
                        !sendButton.hasAttribute('disabled') &&
                        sendButton.getAttribute('aria-disabled') !== 'true';

                    // No error indicator should be shown
                    const errorEl = screen.queryByTestId('char-limit-error');
                    const noError = errorEl === null;

                    unmount();

                    return isEnabled && noError;
                },
            ),
            { numRuns: 10 },
        );
    });
});
