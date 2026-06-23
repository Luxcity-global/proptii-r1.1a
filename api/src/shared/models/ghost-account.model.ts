import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Ghost Account — temporary soft account for unauthenticated enquirers.
//
// A ghost_tenant is created when an unauthenticated user submits a Quick
// Request. A ghost_landlord is created for external scraped-property agents
// who have not yet registered on Proptii.
//
// @collection ghost_accounts
// @partitionKey /email (sparse — ghost_landlords may not have email)
// ---------------------------------------------------------------------------

export type GhostAccountRole = 'ghost_tenant' | 'ghost_landlord';
export type GhostAccountStatus = 'ghost' | 'claim_email_sent' | 'claimed';
export type SourcePlatform = 'onthemove' | 'rightmarket' | 'direct' | null;

export interface IGhostAccount {
    /** UUID */
    id: string;
    /**
     * Email address. Required for ghost_tenant (used as identity).
     * Optional for ghost_landlord (scraped agents may not expose email).
     */
    email: string | null;
    name: string | null;
    role: GhostAccountRole;
    status: GhostAccountStatus;
    /** Where the listing was sourced from (null = direct Proptii listing). */
    source_platform: SourcePlatform;
    /**
     * Secure UUID v4 token sent in the claim email link.
     * Null until `issueClaimToken()` is called.
     */
    claim_token: string | null;
    /** ISO 8601 — 30 days from token issuance. */
    claim_token_expires_at: string | null;
    /** ISO 8601 — set when the account is claimed. */
    claimed_at: string | null;
    /** The full Azure AD B2C user ID after claiming. */
    linked_user_id: string | null;
    /** ISO 8601 */
    created_at: string;
}

export type GhostAccountDocument = IGhostAccount & Document;

const GhostAccountSchema = new Schema<GhostAccountDocument>(
    {
        id: { type: String, required: true, unique: true },
        email: { type: String, default: null, index: true, sparse: true },
        name: { type: String, default: null },
        role: {
            type: String,
            enum: ['ghost_tenant', 'ghost_landlord'],
            required: true,
        },
        status: {
            type: String,
            enum: ['ghost', 'claim_email_sent', 'claimed'],
            required: true,
            default: 'ghost',
        },
        source_platform: {
            type: String,
            enum: ['onthemove', 'rightmarket', 'direct', null],
            default: null,
        },
        claim_token: { type: String, default: null, index: true, sparse: true },
        claim_token_expires_at: { type: String, default: null },
        claimed_at: { type: String, default: null },
        linked_user_id: { type: String, default: null, index: true, sparse: true },
        created_at: { type: String, required: true },
    },
    { collection: 'ghost_accounts' },
);

// Compound index: look up unclaimed ghost tenant by email
GhostAccountSchema.index({ email: 1, role: 1, status: 1 });

export const GhostAccountModel: Model<GhostAccountDocument> =
    mongoose.models.GhostAccount ||
    mongoose.model<GhostAccountDocument>('GhostAccount', GhostAccountSchema);
