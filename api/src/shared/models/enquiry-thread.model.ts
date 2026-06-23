import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Enquiry Thread — a lightweight conversation scoped to a ghost tenant +
// listing. Separate from the main Conversation model so ghost threads can
// exist independently of the authenticated messaging system.
//
// When a ghost account is claimed, threads are migrated into the main
// conversations collection by ConversationService.migrateGhostConversations().
//
// @collection enquiry_threads
// @partitionKey /thread_token (relay email lookup)
// ---------------------------------------------------------------------------

export type EnquiryThreadStatus = 'open' | 'replied' | 'closed' | 'archived';

export type QuickRequestCategory =
    | 'Book Viewing'
    | 'Property Price'
    | 'Availability'
    | 'Mortgage Info'
    | 'Neighbourhood Info'
    | 'Other';

export interface IEnquiryThread {
    /** UUID */
    id: string;
    /**
     * Reference to the listing. For native Proptii listings this is the
     * property UUID. For scraped listings this is the source URL (same
     * pattern used by ConversationService).
     */
    listing_id: string;
    /** Whether the listing is a native Proptii property or scraped. */
    listing_source: 'native' | 'scraped';
    /** Snapshot of the listing title for email subjects. */
    listing_title: string | null;
    /** FK to ghost_accounts (role = ghost_tenant). */
    ghost_tenant_id: string;
    /** Snapshot of the tenant's display name at submission time. */
    ghost_tenant_name: string | null;
    /**
     * FK to the landlord. For native listings this is the full Azure AD B2C
     * user ID. For unclaimed scraped listings this is a ghost_accounts ID.
     * The sentinel value 'UNCLAIMED' is NOT used here — use listing_source
     * to distinguish.
     */
    landlord_id: string;
    /**
     * Unique opaque token embedded in the reply-to address and tokenised
     * reply page URL. Format: UUID v4 (no hyphens for email safety).
     */
    thread_token: string;
    /**
     * The inbound relay address for this thread.
     * Format: reply+{thread_token}@reply.proptii.co
     */
    relay_email: string;
    /** Categories selected in the Quick Request modal. */
    categories: QuickRequestCategory[];
    status: EnquiryThreadStatus;
    /**
     * Running count of messages. Enforced hard limit of 20 for ghost threads.
     * Users must claim their account to continue past 20 messages.
     */
    message_count: number;
    /** ISO 8601 */
    created_at: string;
    /** ISO 8601 — updated on each reply. */
    last_reply_at: string | null;
}

export type EnquiryThreadDocument = IEnquiryThread & Document;

const EnquiryThreadSchema = new Schema<EnquiryThreadDocument>(
    {
        id: { type: String, required: true, unique: true },
        listing_id: { type: String, required: true, index: true },
        listing_source: {
            type: String,
            enum: ['native', 'scraped'],
            required: true,
        },
        listing_title: { type: String, default: null },
        ghost_tenant_id: { type: String, required: true, index: true },
        ghost_tenant_name: { type: String, default: null },
        landlord_id: { type: String, required: true, index: true },
        thread_token: { type: String, required: true, unique: true, index: true },
        relay_email: { type: String, required: true },
        categories: {
            type: [String],
            enum: [
                'Book Viewing',
                'Property Price',
                'Availability',
                'Mortgage Info',
                'Neighbourhood Info',
                'Other',
            ],
            default: [],
        },
        status: {
            type: String,
            enum: ['open', 'replied', 'closed', 'archived'],
            required: true,
            default: 'open',
        },
        message_count: { type: Number, required: true, default: 0 },
        created_at: { type: String, required: true },
        last_reply_at: { type: String, default: null },
    },
    { collection: 'enquiry_threads' },
);

// Look up all threads for a ghost tenant
EnquiryThreadSchema.index({ ghost_tenant_id: 1, created_at: -1 });
// Look up all threads for a landlord (claimed or ghost)
EnquiryThreadSchema.index({ landlord_id: 1, last_reply_at: -1 });

export const EnquiryThreadModel: Model<EnquiryThreadDocument> =
    mongoose.models.EnquiryThread ||
    mongoose.model<EnquiryThreadDocument>('EnquiryThread', EnquiryThreadSchema);
