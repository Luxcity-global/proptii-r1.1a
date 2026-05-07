/**
 * Barrel export for shared messaging UI components.
 *
 * Requirements: 12.6
 */

export { default as MessageThread } from './MessageThread';
export type { MessageThreadProps } from './MessageThread';

export { default as ComposeBox } from './ComposeBox';
export type { ComposeBoxProps } from './ComposeBox';

export { default as ConversationListItem, truncatePreview } from './ConversationListItem';
export type { ConversationListItemProps } from './ConversationListItem';
