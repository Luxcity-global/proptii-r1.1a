/**
 * Unit tests for ComposeBox component.
 *
 * Requirements: 10.4, 11.4, 12.2, 12.4, 12.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeBox from '../ComposeBox';
import type { Message } from '../../../types/messaging';

// ---------------------------------------------------------------------------
// Mock communicationService
// ---------------------------------------------------------------------------

vi.mock('../../../services/communicationService', () => ({
    default: {
        sendMessage: vi.fn(),
        uploadAttachment: vi.fn(),
    },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

import communicationService from '../../../services/communicationService';

const mockSendMessage = communicationService.sendMessage as ReturnType<typeof vi.fn>;
const mockUploadAttachment = communicationService.uploadAttachment as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-a',
        senderRole: 'tenant',
        body: 'Hello!',
        attachmentIds: [],
        sentAt: new Date().toISOString(),
        readAt: null,
        isDeleted: false,
        deletedAt: null,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComposeBox', () => {
    beforeEach(() => {
        mockSendMessage.mockClear();
        mockUploadAttachment.mockClear();
    });

    it('renders a textarea', () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        expect(screen.getByTestId('compose-textarea')).toBeInTheDocument();
    });

    it('renders a character counter showing 0/4000 initially', () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        expect(screen.getByTestId('char-counter')).toHaveTextContent('0/4000');
    });

    it('updates character counter as user types', async () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const textarea = screen.getByTestId('compose-textarea');
        await userEvent.type(textarea, 'Hello');
        expect(screen.getByTestId('char-counter')).toHaveTextContent('5/4000');
    });

    it('disables submit button when textarea is empty', () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const sendButton = screen.getByTestId('send-button');
        expect(sendButton).toBeDisabled();
    });

    it('enables submit button when textarea has content within limit', async () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const textarea = screen.getByTestId('compose-textarea');
        await userEvent.type(textarea, 'Hello world');
        const sendButton = screen.getByTestId('send-button');
        expect(sendButton).not.toBeDisabled();
    });

    it('disables submit button when character limit is exceeded', async () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const textarea = screen.getByTestId('compose-textarea');
        // Simulate typing over 4000 chars by setting value directly
        fireEvent.change(textarea, { target: { value: 'x'.repeat(4001) } });
        const sendButton = screen.getByTestId('send-button');
        expect(sendButton).toBeDisabled();
    });

    it('shows error state when character limit is exceeded', async () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const textarea = screen.getByTestId('compose-textarea');
        fireEvent.change(textarea, { target: { value: 'x'.repeat(4001) } });
        expect(screen.getByTestId('char-limit-error')).toBeInTheDocument();
    });

    it('renders file attachment button', () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        expect(screen.getByTestId('attach-button')).toBeInTheDocument();
    });

    it('renders file input with correct accept attribute', () => {
        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);
        const fileInput = screen.getByTestId('file-input');
        expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx,.txt');
    });

    it('calls sendMessage and onSend on successful submission', async () => {
        const sentMessage = makeMessage({ body: 'Hello!' });
        mockSendMessage.mockResolvedValueOnce(sentMessage);

        const onSend = vi.fn();
        render(<ComposeBox conversationId="conv-1" onSend={onSend} />);

        const textarea = screen.getByTestId('compose-textarea');
        await userEvent.type(textarea, 'Hello!');

        const sendButton = screen.getByTestId('send-button');
        await userEvent.click(sendButton);

        await waitFor(() => {
            expect(mockSendMessage).toHaveBeenCalledWith('conv-1', {
                body: 'Hello!',
                attachmentIds: [],
                senderRole: 'tenant',
            });
            expect(onSend).toHaveBeenCalledWith(sentMessage);
        });
    });

    it('clears textarea after successful send', async () => {
        mockSendMessage.mockResolvedValueOnce(makeMessage());

        render(<ComposeBox conversationId="conv-1" onSend={() => { }} />);

        const textarea = screen.getByTestId('compose-textarea');
        await userEvent.type(textarea, 'Hello!');
        await userEvent.click(screen.getByTestId('send-button'));

        await waitFor(() => {
            expect(textarea).toHaveValue('');
        });
    });

    it('calls uploadAttachment before sendMessage when a file is selected', async () => {
        const attachment = {
            id: 'att-1',
            conversationId: 'conv-1',
            messageId: '',
            uploaderId: 'user-a',
            fileName: 'test.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1024,
            blobPath: '/blobs/test.pdf',
            uploadedAt: new Date().toISOString(),
        };
        mockUploadAttachment.mockResolvedValueOnce(attachment);
        mockSendMessage.mockResolvedValueOnce(makeMessage({ attachmentIds: ['att-1'] }));

        const onSend = vi.fn();
        render(<ComposeBox conversationId="conv-1" onSend={onSend} />);

        const textarea = screen.getByTestId('compose-textarea');
        await userEvent.type(textarea, 'See attached');

        // Simulate file selection
        const fileInput = screen.getByTestId('file-input');
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        await userEvent.upload(fileInput, file);

        await userEvent.click(screen.getByTestId('send-button'));

        await waitFor(() => {
            expect(mockUploadAttachment).toHaveBeenCalledWith(file, 'conv-1');
            expect(mockSendMessage).toHaveBeenCalledWith('conv-1', {
                body: 'See attached',
                attachmentIds: ['att-1'],
                senderRole: 'tenant',
            });
        });
    });
});
