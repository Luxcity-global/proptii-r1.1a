/**
 * MessagingContext — provides conversation list, unread count, and active
 * conversation state to the entire dashboard layout.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 15.1–15.4
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../types/messaging';
import communicationService from '../services/communicationService';
import { useAuth } from './AuthContext';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface MessagingContextType {
    conversations: Conversation[];
    unreadCount: number;
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    refreshConversations: () => Promise<void>;
    /**
     * Immediately decrements the unread badge by `by` (clamped to 0).
     * Called when a conversation is opened so the badge updates in real time
     * without waiting for the next 30-second poll.
     */
    decrementUnreadCount: (by: number) => void;
    /** Internal setter used by useMessagingPoller */
    _setConversations: (conversations: Conversation[]) => void;
    /** Internal setter used by useMessagingPoller */
    _setUnreadCount: (count: number) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const MessagingContext = createContext<MessagingContextType>({
    conversations: [],
    unreadCount: 0,
    activeConversationId: null,
    setActiveConversationId: () => { },
    refreshConversations: async () => { },
    decrementUnreadCount: () => { },
    _setConversations: () => { },
    _setUnreadCount: () => { },
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Clear state on user change to prevent data bleed
    useEffect(() => {
        setConversations([]);
        setUnreadCount(0);
        setActiveConversationId(null);
    }, [user?.id]);

    const refreshConversations = useCallback(async () => {
        try {
            const [convs, count] = await Promise.all([
                communicationService.getConversations(),
                communicationService.getUnreadCount(),
            ]);
            setConversations(convs);
            setUnreadCount(count);
        } catch {
            // Silently ignore errors during refresh — the poller will retry
        }
    }, []);

    const decrementUnreadCount = useCallback((by: number) => {
        setUnreadCount((prev) => Math.max(0, prev - by));
    }, []);

    return (
        <MessagingContext.Provider
            value={{
                conversations,
                unreadCount,
                activeConversationId,
                setActiveConversationId,
                refreshConversations,
                decrementUnreadCount,
                _setConversations: setConversations,
                _setUnreadCount: setUnreadCount,
            }}
        >
            {children}
        </MessagingContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMessagingContext(): MessagingContextType {
    return useContext(MessagingContext);
}
