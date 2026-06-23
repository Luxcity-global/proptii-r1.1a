import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Thread Message — a single message within an EnquiryThread.
//
// @collection thread_messages
// @partitionKey /thread_id
// ---------------------------------------------------------------------------

export type ThreadMessageSenderType =
    | 'ghost_tenant'
    | 'ghost_landlord'
    | 'platform_landlord';

export type ThreadMessageSource =
    | 'web_form'       // Initial Quick Request submission
    | 'email_reply'    // Reply via inbound email relay
    | 'tokenised_page'; // Reply via /thread/{token} page

export interface IThreadMessage {
    /** UUID */
    id: string;
    /** FK to enquiry_threads */
    thread_id: string;
    sender_type: ThreadMessageSenderType;
    /** FK to ghost_accounts.id or the full Azure AD B2C user ID. */
    sender_id: string;
    /** Display name at time of sending. Captured for denormalisation. */
    sender_name: string | null;
    /** Message body — max 4000 chars. */
    body: string;
    /** How this message was submitted. */
    source: ThreadMessageSource;
    /** ISO 8601 */
    sent_at: string;
    /** ISO 8601 — when the recipient viewed this message. */
    read_at: string | null;
}

export type ThreadMessageDocument = IThreadMessage & Document;

const ThreadMessageSchema = new Schema<ThreadMessageDocument>(
    {
        id: { type: String, required: true, unique: true },
        thread_id: { type: String, required: true, index: true },
        sender_type: {
            type: String,
            enum: ['ghost_tenant', 'ghost_landlord', 'platform_landlord'],
            required: true,
        },
        sender_id: { type: String, required: true },
        sender_name: { type: String, default: null },
        body: { type: String, required: true, maxlength: 4000 },
        source: {
            type: String,
            enum: ['web_form', 'email_reply', 'tokenised_page'],
            required: true,
        },
        sent_at: { type: String, required: true },
        read_at: { type: String, default: null },
    },
    { collection: 'thread_messages' },
);

// Chronological message listing within a thread
ThreadMessageSchema.index({ thread_id: 1, sent_at: 1 });

export const ThreadMessageModel: Model<ThreadMessageDocument> =
    mongoose.models.ThreadMessage ||
    mongoose.model<ThreadMessageDocument>('ThreadMessage', ThreadMessageSchema);
