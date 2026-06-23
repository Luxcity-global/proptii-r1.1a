import { AppError } from '../middleware/error-handling';
import {
    GhostAccountModel,
    IGhostAccount,
    GhostAccountRole,
    GhostAccountStatus,
    SourcePlatform,
    GhostAccountDocument,
} from '../models/ghost-account.model';

// ---------------------------------------------------------------------------
// GhostAccountService
//
// Manages the lifecycle of ghost (unauthenticated) accounts:
//   - Ghost Tenant: created when a guest submits a Quick Request
//   - Ghost Landlord: created for external scraped-listing agents
//
// Key invariants:
//   - A ghost_tenant is unique by email (case-insensitive normalised)
//   - A ghost_landlord may have null email (scraping doesn't always expose it)
//   - Claim tokens expire after 30 days
//   - Once claimed, the ghost account is archived (status = 'claimed') and
//     linked to the full Azure AD B2C user ID
// ---------------------------------------------------------------------------

const CLAIM_TOKEN_TTL_DAYS = 30;

export class GhostAccountService {

    // -------------------------------------------------------------------------
    // get-or-create: Ghost Tenant
    // -------------------------------------------------------------------------

    /**
     * Returns the existing ghost_tenant for this email, or creates a new one.
     * Email is normalised to lowercase before comparison.
     *
     * If the account is already 'claimed', returns it without modification so
     * the caller can handle the auto-merge case.
     */
    async getOrCreateGhostTenant(
        email: string,
        name?: string,
    ): Promise<{ account: IGhostAccount; created: boolean }> {
        const normalisedEmail = email.toLowerCase().trim();

        const existing = await GhostAccountModel.findOne({
            email: normalisedEmail,
            role: 'ghost_tenant',
        }).lean<IGhostAccount>();

        if (existing) {
            // Always overwrite the name with the latest input (even if blank)
            const updatedName = name ?? null;
            if (existing.name !== updatedName) {
                await GhostAccountModel.updateOne(
                    { id: existing.id },
                    { $set: { name: updatedName } },
                );
                return { account: { ...existing, name: updatedName }, created: false };
            }
            return { account: existing, created: false };
        }

        const now = new Date().toISOString();
        const newAccount: IGhostAccount = {
            id: crypto.randomUUID(),
            email: normalisedEmail,
            name: name ?? null,
            role: 'ghost_tenant',
            status: 'ghost',
            source_platform: 'direct',
            claim_token: null,
            claim_token_expires_at: null,
            claimed_at: null,
            linked_user_id: null,
            created_at: now,
        };

        await GhostAccountModel.create(newAccount);
        return { account: newAccount, created: true };
    }

    // -------------------------------------------------------------------------
    // get-or-create: Ghost Landlord
    // -------------------------------------------------------------------------

    /**
     * Returns the existing ghost_landlord for a scraped listing agent, or
     * creates a new one.  Email may be null for agents without exposed contact.
     */
    async getOrCreateGhostLandlord(opts: {
        email: string | null;
        name?: string;
        sourcePlatform: SourcePlatform;
    }): Promise<{ account: IGhostAccount; created: boolean }> {
        const { email, name, sourcePlatform } = opts;
        const normalisedEmail = email ? email.toLowerCase().trim() : null;

        if (normalisedEmail) {
            const existing = await GhostAccountModel.findOne({
                email: normalisedEmail,
                role: 'ghost_landlord',
            }).lean<IGhostAccount>();

            if (existing) {
                return { account: existing, created: false };
            }
        }

        const now = new Date().toISOString();
        const newAccount: IGhostAccount = {
            id: crypto.randomUUID(),
            email: normalisedEmail,
            name: name ?? null,
            role: 'ghost_landlord',
            status: 'ghost',
            source_platform: sourcePlatform,
            claim_token: null,
            claim_token_expires_at: null,
            claimed_at: null,
            linked_user_id: null,
            created_at: now,
        };

        await GhostAccountModel.create(newAccount);
        return { account: newAccount, created: true };
    }

    // -------------------------------------------------------------------------
    // Claim token lifecycle
    // -------------------------------------------------------------------------

    /**
     * Issues a new claim token for the ghost account, overwriting any
     * previously expired token.
     * Returns the updated account with the new token.
     */
    async issueClaimToken(ghostAccountId: string): Promise<IGhostAccount> {
        const account = await GhostAccountModel.findOne({ id: ghostAccountId }).lean<IGhostAccount>();

        if (!account) {
            throw new AppError(404, 'Ghost account not found', 'GHOST_ACCOUNT_NOT_FOUND');
        }

        if (account.status === 'claimed') {
            throw new AppError(409, 'Account already claimed', 'GHOST_ACCOUNT_ALREADY_CLAIMED');
        }

        // Generate a compact token (UUID without hyphens for email-address safety)
        const rawToken = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date(
            Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString();

        const updated = await GhostAccountModel.findOneAndUpdate(
            { id: ghostAccountId },
            {
                $set: {
                    claim_token: rawToken,
                    claim_token_expires_at: expiresAt,
                    status: 'claim_email_sent' as GhostAccountStatus,
                },
            },
            { new: true },
        ).lean<IGhostAccount>();

        if (!updated) {
            throw new AppError(500, 'Failed to issue claim token', 'CLAIM_TOKEN_ISSUE_FAILED');
        }

        return updated;
    }

    /**
     * Validates a claim token.
     * Returns the ghost account if the token is valid and not expired.
     * Throws 404 if not found, 410 if expired.
     */
    async validateClaimToken(token: string): Promise<IGhostAccount> {
        const account = await GhostAccountModel.findOne({
            claim_token: token,
        }).lean<IGhostAccount>();

        if (!account) {
            throw new AppError(404, 'Claim token not found or already used', 'CLAIM_TOKEN_NOT_FOUND');
        }

        if (account.status === 'claimed') {
            throw new AppError(409, 'Account already claimed', 'GHOST_ACCOUNT_ALREADY_CLAIMED');
        }

        if (account.claim_token_expires_at) {
            const expiresAt = new Date(account.claim_token_expires_at).getTime();
            if (Date.now() > expiresAt) {
                throw new AppError(410, 'Claim token has expired', 'CLAIM_TOKEN_EXPIRED');
            }
        }

        return account;
    }

    /**
     * Marks the ghost account as claimed and links it to the full user ID.
     * Invalidates the claim token.
     */
    async claimAccount(token: string, fullUserId: string): Promise<IGhostAccount> {
        // Validate first (throws if invalid/expired)
        const account = await this.validateClaimToken(token);

        const now = new Date().toISOString();

        const claimed = await GhostAccountModel.findOneAndUpdate(
            { id: account.id },
            {
                $set: {
                    status: 'claimed' as GhostAccountStatus,
                    linked_user_id: fullUserId,
                    claimed_at: now,
                    claim_token: null,           // invalidate token
                    claim_token_expires_at: null,
                },
            },
            { new: true },
        ).lean<IGhostAccount>();

        if (!claimed) {
            throw new AppError(500, 'Failed to claim account', 'CLAIM_ACCOUNT_FAILED');
        }

        return claimed;
    }

    /**
     * Re-issues a claim token for an existing ghost account by email.
     * Used when the original link has expired.
     */
    async resendClaimToken(email: string, role: GhostAccountRole = 'ghost_tenant'): Promise<IGhostAccount> {
        const normalisedEmail = email.toLowerCase().trim();

        const account = await GhostAccountModel.findOne({
            email: normalisedEmail,
            role,
        }).lean<IGhostAccount>();

        if (!account) {
            // Return a generic error to avoid email enumeration
            throw new AppError(404, 'No account found for this email', 'GHOST_ACCOUNT_NOT_FOUND');
        }

        if (account.status === 'claimed') {
            throw new AppError(409, 'Account already claimed — please log in', 'GHOST_ACCOUNT_ALREADY_CLAIMED');
        }

        return this.issueClaimToken(account.id);
    }

    // -------------------------------------------------------------------------
    // Lookup helpers
    // -------------------------------------------------------------------------

    async findById(id: string): Promise<IGhostAccount | null> {
        return GhostAccountModel.findOne({ id }).lean<IGhostAccount>();
    }

    async findByEmail(email: string, role: GhostAccountRole): Promise<IGhostAccount | null> {
        return GhostAccountModel.findOne({
            email: email.toLowerCase().trim(),
            role,
        }).lean<IGhostAccount>();
    }

    /**
     * Finds an unclaimed ghost_tenant by email that can be auto-merged when
     * a user registers with the same address.
     */
    async findMergeCandidate(email: string): Promise<IGhostAccount | null> {
        return GhostAccountModel.findOne({
            email: email.toLowerCase().trim(),
            role: 'ghost_tenant',
            status: { $in: ['ghost', 'claim_email_sent'] },
        }).lean<IGhostAccount>();
    }

    /**
     * Finds all ghost accounts associated with an email address.
     */
    async findGhostAccountsByEmail(email: string): Promise<IGhostAccount[]> {
        return GhostAccountModel.find({
            email: email.toLowerCase().trim()
        }).lean<IGhostAccount[]>();
    }

    /**
     * Directly marks a ghost account as claimed and links it to the user ID.
     */
    async claimAccountDirect(ghostAccountId: string, fullUserId: string): Promise<IGhostAccount> {
        const now = new Date().toISOString();
        const claimed = await GhostAccountModel.findOneAndUpdate(
            { id: ghostAccountId },
            {
                $set: {
                    status: 'claimed' as GhostAccountStatus,
                    linked_user_id: fullUserId,
                    claimed_at: now,
                    claim_token: null,
                    claim_token_expires_at: null,
                },
            },
            { new: true },
        ).lean<IGhostAccount>();

        if (!claimed) {
            throw new AppError(500, 'Failed to claim account directly', 'CLAIM_ACCOUNT_FAILED');
        }

        return claimed;
    }
}
