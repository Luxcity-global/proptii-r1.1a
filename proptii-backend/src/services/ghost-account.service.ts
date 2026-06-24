import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/app-error';
import {
  GhostAccount,
  GhostAccountDocument,
  GhostAccountRole,
  GhostAccountStatus,
  SourcePlatform,
} from '../schemas/ghost-account.schema';

const CLAIM_TOKEN_TTL_DAYS = 30;

@Injectable()
export class GhostAccountService {
  constructor(
    @InjectModel(GhostAccount.name)
    private readonly ghostAccountModel: Model<GhostAccountDocument>,
  ) {}

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
  ): Promise<{ account: GhostAccount; created: boolean }> {
    const normalisedEmail = email.toLowerCase().trim();

    const existing = await this.ghostAccountModel
      .findOne({
        email: normalisedEmail,
        role: 'ghost_tenant',
      })
      .lean<GhostAccount>();

    if (existing) {
      // Always overwrite the name with the latest input (even if blank)
      const updatedName = name ?? null;
      if (existing.name !== updatedName) {
        await this.ghostAccountModel.updateOne(
          { id: existing.id },
          { $set: { name: updatedName } },
        );
        return { account: { ...existing, name: updatedName }, created: false };
      }
      return { account: existing, created: false };
    }

    const now = new Date().toISOString();
    const newAccount: GhostAccount = {
      id: randomUUID(),
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

    await this.ghostAccountModel.create(newAccount);
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
  }): Promise<{ account: GhostAccount; created: boolean }> {
    const { email, name, sourcePlatform } = opts;
    const normalisedEmail = email ? email.toLowerCase().trim() : null;

    if (normalisedEmail) {
      const existing = await this.ghostAccountModel
        .findOne({
          email: normalisedEmail,
          role: 'ghost_landlord',
        })
        .lean<GhostAccount>();

      if (existing) {
        return { account: existing, created: false };
      }
    }

    const now = new Date().toISOString();
    const newAccount: GhostAccount = {
      id: randomUUID(),
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

    await this.ghostAccountModel.create(newAccount);
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
  async issueClaimToken(ghostAccountId: string): Promise<GhostAccount> {
    const account = await this.ghostAccountModel
      .findOne({ id: ghostAccountId })
      .lean<GhostAccount>();

    if (!account) {
      throw new AppError(404, 'Ghost account not found', 'GHOST_ACCOUNT_NOT_FOUND');
    }

    if (account.status === 'claimed') {
      throw new AppError(409, 'Account already claimed', 'GHOST_ACCOUNT_ALREADY_CLAIMED');
    }

    // Generate a compact token (UUID without hyphens for email-address safety)
    const rawToken = randomUUID().replace(/-/g, '');
    const expiresAt = new Date(
      Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const updated = await this.ghostAccountModel
      .findOneAndUpdate(
        { id: ghostAccountId },
        {
          $set: {
            claim_token: rawToken,
            claim_token_expires_at: expiresAt,
            status: 'claim_email_sent' as GhostAccountStatus,
          },
        },
        { new: true },
      )
      .lean<GhostAccount>();

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
  async validateClaimToken(token: string): Promise<GhostAccount> {
    const account = await this.ghostAccountModel
      .findOne({
        claim_token: token,
      })
      .lean<GhostAccount>();

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
   * Invalidate the claim token.
   */
  async claimAccount(token: string, fullUserId: string): Promise<GhostAccount> {
    // Validate first (throws if invalid/expired)
    const account = await this.validateClaimToken(token);

    const now = new Date().toISOString();

    const claimed = await this.ghostAccountModel
      .findOneAndUpdate(
        { id: account.id },
        {
          $set: {
            status: 'claimed' as GhostAccountStatus,
            linked_user_id: fullUserId,
            claimed_at: now,
            claim_token: null, // invalidate token
            claim_token_expires_at: null,
          },
        },
        { new: true },
      )
      .lean<GhostAccount>();

    if (!claimed) {
      throw new AppError(500, 'Failed to claim account', 'CLAIM_ACCOUNT_FAILED');
    }

    return claimed;
  }

  /**
   * Re-issues a claim token for an existing ghost account by email.
   * Used when the original link has expired.
   */
  async resendClaimToken(
    email: string,
    role: GhostAccountRole = 'ghost_tenant',
  ): Promise<GhostAccount> {
    const normalisedEmail = email.toLowerCase().trim();

    const account = await this.ghostAccountModel
      .findOne({
        email: normalisedEmail,
        role,
      })
      .lean<GhostAccount>();

    if (!account) {
      // Return a generic error to avoid email enumeration
      throw new AppError(404, 'No account found for this email', 'GHOST_ACCOUNT_NOT_FOUND');
    }

    if (account.status === 'claimed') {
      throw new AppError(
        409,
        'Account already claimed — please log in',
        'GHOST_ACCOUNT_ALREADY_CLAIMED',
      );
    }

    return this.issueClaimToken(account.id);
  }

  // -------------------------------------------------------------------------
  // Lookup helpers
  // -------------------------------------------------------------------------

  async findById(id: string): Promise<GhostAccount | null> {
    return this.ghostAccountModel.findOne({ id }).lean<GhostAccount>();
  }

  async findByEmail(email: string, role: GhostAccountRole): Promise<GhostAccount | null> {
    return this.ghostAccountModel
      .findOne({
        email: email.toLowerCase().trim(),
        role,
      })
      .lean<GhostAccount>();
  }

  /**
   * Finds an unclaimed ghost_tenant by email that can be auto-merged when
   * a user registers with the same address.
   */
  async findMergeCandidate(email: string): Promise<GhostAccount | null> {
    return this.ghostAccountModel
      .findOne({
        email: email.toLowerCase().trim(),
        role: 'ghost_tenant',
        status: { $in: ['ghost', 'claim_email_sent'] },
      })
      .lean<GhostAccount>();
  }

  /**
   * Finds all ghost accounts associated with an email address.
   */
  async findGhostAccountsByEmail(email: string): Promise<GhostAccount[]> {
    return this.ghostAccountModel
      .find({
        email: email.toLowerCase().trim(),
      })
      .lean<GhostAccount[]>();
  }

  /**
   * Directly marks a ghost account as claimed and links it to the user ID.
   */
  async claimAccountDirect(ghostAccountId: string, fullUserId: string): Promise<GhostAccount> {
    const now = new Date().toISOString();
    const claimed = await this.ghostAccountModel
      .findOneAndUpdate(
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
      )
      .lean<GhostAccount>();

    if (!claimed) {
      throw new AppError(500, 'Failed to claim account directly', 'CLAIM_ACCOUNT_FAILED');
    }

    return claimed;
  }
}
