import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GhostAccountService } from '../services/ghost-account.service';
import { EnquiryThreadService } from '../services/enquiry-thread.service';
import { EmailRelayService } from '../services/email-relay.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AppError } from '../utils/app-error';
import { QuickRequestCategory } from '../schemas/enquiry-thread.schema';
import { SourcePlatform } from '../schemas/ghost-account.schema';
import { MongoUser, MongoUserDocument } from '../schemas/mongo-user.schema';
import { NativeProperty } from '../schemas/native-property.schema';
import { GuestEnquiryExceptionFilter } from './guest-enquiry-exception.filter';

const VALID_CATEGORIES: QuickRequestCategory[] = [
  'Book Viewing',
  'Property Price',
  'Availability',
  'Mortgage Info',
  'Neighbourhood Info',
  'Other',
];

@Controller('guest')
@UseFilters(GuestEnquiryExceptionFilter)
export class GuestEnquiryController {
  private readonly logger = new Logger(GuestEnquiryController.name);

  constructor(
    private readonly ghostAccountService: GhostAccountService,
    private readonly enquiryThreadService: EnquiryThreadService,
    private readonly emailRelayService: EmailRelayService,
    @InjectModel(MongoUser.name)
    private readonly mongoUserModel: Model<MongoUserDocument>,
    @InjectModel(NativeProperty.name)
    private readonly nativePropertyModel: Model<NativeProperty>,
  ) {}

  private sanitiseCategories(raw: unknown): QuickRequestCategory[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((c): c is QuickRequestCategory => VALID_CATEGORIES.includes(c as any));
  }

  // POST /api/guest/enquiry
  @Post('enquiry')
  @HttpCode(HttpStatus.CREATED)
  async submitEnquiry(
    @Body()
    body: {
      email?: string;
      name?: string;
      message?: string;
      categories?: unknown;
      listingId?: string;
      listingTitle?: string;
      listingSource?: string;
      landlordId?: string;
      agentEmail?: string;
      agentName?: string;
      sourcePlatform?: string;
      gdprConsent?: boolean;
    },
  ) {
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      throw new AppError(422, 'A valid email address is required', 'INVALID_EMAIL');
    }
    if (!body.message || body.message.trim().length < 10) {
      throw new AppError(422, 'Message must be at least 10 characters', 'MESSAGE_TOO_SHORT');
    }
    if (body.message.trim().length > 1000) {
      throw new AppError(422, 'Message must be 1000 characters or fewer', 'MESSAGE_TOO_LONG');
    }
    if (!body.listingId) {
      throw new AppError(422, 'listingId is required', 'MISSING_LISTING_ID');
    }
    if (!body.gdprConsent) {
      throw new AppError(422, 'GDPR consent is required', 'GDPR_CONSENT_REQUIRED');
    }

    const listingSource = body.listingSource === 'scraped' ? 'scraped' : 'native';
    const categories = this.sanitiseCategories(body.categories);

    const { account: ghostTenant, created: tenantCreated } =
      await this.ghostAccountService.getOrCreateGhostTenant(body.email.trim(), body.name?.trim());

    let landlordId: string;
    const hasAgentEmail = listingSource === 'scraped' ? !!body.agentEmail : true;

    if (listingSource === 'scraped') {
      const sourcePlatform = (
        ['onthemove', 'rightmarket'].includes(body.sourcePlatform ?? '')
          ? body.sourcePlatform
          : 'direct'
      ) as SourcePlatform;
      const { account: ghostLandlord } =
        await this.ghostAccountService.getOrCreateGhostLandlord({
          email: body.agentEmail ?? null,
          name: body.agentName,
          sourcePlatform,
        });
      landlordId = ghostLandlord.id;
    } else {
      const property = await this.nativePropertyModel.findOne({ id: body.listingId }).lean() as any;
      if (!property) {
        throw new AppError(404, 'Native property not found', 'PROPERTY_NOT_FOUND');
      }
      landlordId = property.userId;
    }

    const { thread, messages } = await this.enquiryThreadService.createThread({
      listingId: body.listingId,
      listingSource,
      listingTitle: body.listingTitle ?? null,
      ghostTenantId: ghostTenant.id,
      ghostTenantName: ghostTenant.name,
      landlordId,
      categories,
      firstMessage: { body: body.message.trim(), senderName: ghostTenant.name },
    });

    let claimToken: string | null = null;
    if (ghostTenant.status !== 'claimed') {
      try {
        const updatedTenant = await this.ghostAccountService.issueClaimToken(ghostTenant.id);
        claimToken = updatedTenant.claim_token;
      } catch (claimErr) {
        this.logger.warn('Failed to issue immediate claim token:', claimErr);
      }
    }

    if (listingSource === 'scraped' && !hasAgentEmail) {
      await this.enquiryThreadService.addReply({
        threadToken: thread.thread_token,
        senderType: 'platform_landlord', // Use platform generic to represent system
        senderId: 'SYSTEM',
        senderName: 'Proptii System',
        body: 'Proptii was unable to find contact details for this agent. Your message could not be delivered to them.',
        source: 'web_form',
      });
      // Archive it so it doesn't show as active
      await this.enquiryThreadService['enquiryThreadModel'].updateOne(
        { id: thread.id },
        { $set: { status: 'archived' } }
      );
    }

    this.emailRelayService
      .sendEnquiryEmails({
        thread,
        firstMessage: messages[0],
        ghostTenant,
        listingSource,
        agentEmail: body.agentEmail ?? null,
        agentName: body.agentName ?? null,
        landlordId,
        claimToken,
      })
      .catch((err) => this.logger.error('sendEnquiryEmails failed:', err));

    const agentDelivery = hasAgentEmail ? 'sent' : 'no_contact_email';

    return {
      data: {
        threadToken: thread.thread_token,
        ghostTenantId: ghostTenant.id,
        confirmationSent: true,
        agentDelivery,
      },
    };
  }

  // GET /api/guest/thread/{token}
  @Get('thread/:token')
  async getThread(@Param('token') token: string) {
    if (!token) {
      throw new AppError(400, 'Thread token is required', 'MISSING_TOKEN');
    }

    const result = await this.enquiryThreadService.getThreadByToken(token);
    if (!result) {
      throw new AppError(404, 'Thread not found', 'THREAD_NOT_FOUND');
    }

    return {
      data: {
        thread: {
          id: result.thread.id,
          listing_title: result.thread.listing_title,
          categories: result.thread.categories,
          status: result.thread.status,
          message_count: result.thread.message_count,
          created_at: result.thread.created_at,
          last_reply_at: result.thread.last_reply_at,
          limit_reached: result.thread.message_count >= 20,
          ghost_tenant_id: result.thread.ghost_tenant_id,
          ghost_tenant_name: result.thread.ghost_tenant_name ?? null,
          landlord_id: result.thread.landlord_id,
        },
        messages: result.messages.map((m) => ({
          id: m.id,
          sender_type: m.sender_type,
          sender_name: m.sender_name || 'User',
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
        })),
      },
    };
  }

  // POST /api/guest/thread/{token}/reply
  @Post('thread/:token/reply')
  @HttpCode(HttpStatus.CREATED)
  async addReply(
    @Param('token') token: string,
    @Body()
    body: {
      message?: string;
      senderType?: string;
      senderId?: string;
      senderName?: string;
    },
  ) {
    if (!token) {
      throw new AppError(400, 'Thread token is required', 'MISSING_TOKEN');
    }
    if (!body.message || body.message.trim().length < 1) {
      throw new AppError(422, 'Message is required', 'MESSAGE_REQUIRED');
    }

    const allowedSenderTypes = ['ghost_tenant', 'ghost_landlord', 'platform_landlord'];
    if (!body.senderType || !allowedSenderTypes.includes(body.senderType)) {
      throw new AppError(422, 'Valid senderType is required', 'INVALID_SENDER_TYPE');
    }
    if (!body.senderId) {
      throw new AppError(422, 'senderId is required', 'MISSING_SENDER_ID');
    }

    const thread = await this.enquiryThreadService.getThreadByToken(token);
    if (!thread) {
      throw new AppError(404, 'Thread not found', 'THREAD_NOT_FOUND');
    }

    if (body.senderType === 'ghost_tenant' && body.senderId !== thread.thread.ghost_tenant_id) {
      throw new AppError(403, 'Sender ID does not match this thread', 'SENDER_MISMATCH');
    }
    if (body.senderType === 'ghost_landlord' && body.senderId !== thread.thread.landlord_id) {
      throw new AppError(403, 'Sender ID does not match this thread', 'SENDER_MISMATCH');
    }

    const message = await this.enquiryThreadService.addReply({
      threadToken: token,
      senderType: body.senderType as any,
      senderId: body.senderId,
      senderName: body.senderName ?? null,
      body: body.message.trim(),
      source: 'tokenised_page',
    });

    this.emailRelayService
      .sendReplyNotification(token, message)
      .catch((err) => this.logger.error('sendReplyNotification failed:', err));

    return {
      data: {
        id: message.id,
        sent_at: message.sent_at,
      },
    };
  }

  // POST /api/guest/claim/validate
  @Post('claim/validate')
  async validateClaimToken(@Body() body: { token?: string }) {
    if (!body.token) {
      throw new AppError(400, 'token is required', 'MISSING_TOKEN');
    }

    const account = await this.ghostAccountService.validateClaimToken(body.token);
    return {
      data: {
        email: account.email,
        name: account.name,
        role: account.role,
        expires_at: account.claim_token_expires_at,
      },
    };
  }

  // POST /api/guest/claim/resend
  @Post('claim/resend')
  async resendClaimToken(@Body() body: { email?: string }) {
    if (!body.email) {
      throw new AppError(400, 'email is required', 'MISSING_EMAIL');
    }

    try {
      const updated = await this.ghostAccountService.resendClaimToken(body.email.trim());
      this.emailRelayService
        .sendClaimEmail(updated)
        .catch((err) => this.logger.error('sendClaimEmail failed:', err));
    } catch {
      // Swallow — always return 200 to avoid email enumeration
    }

    return {
      data: {
        sent: true,
      },
    };
  }

  // POST /api/guest/claim/confirm
  @Post('claim/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async confirmClaim(@CurrentUser() user: Record<string, any>, @Body() body: { token?: string }) {
    const userId = user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.token) {
      throw new AppError(400, 'token is required', 'MISSING_TOKEN');
    }

    const ghostAccount = await this.ghostAccountService.claimAccount(body.token, userId);

    const role = ghostAccount.role === 'ghost_landlord' ? 'landlord' : 'tenant';
    const migratedCount = await this.enquiryThreadService.migrateThreadsToUser(
      ghostAccount.id,
      userId,
      role,
    );

    // Sync user to Mongo users collection
    await this.mongoUserModel.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          id: userId,
          email: ghostAccount.email,
          firstName: ghostAccount.name?.split(' ')[0] ?? '',
          lastName: ghostAccount.name?.split(' ').slice(1).join(' ') ?? '',
          ghostAccountId: ghostAccount.id,
        },
      },
      { upsert: true },
    );

    return {
      data: {
        success: true,
        migratedCount,
        ghostAccount,
      },
    };
  }

  // POST /api/guest/claim/auto-merge
  @Post('claim/auto-merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async autoMerge(@CurrentUser() user: Record<string, any>, @Body() body: { email?: string }) {
    const userId = user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.email) {
      throw new AppError(400, 'email is required', 'MISSING_EMAIL');
    }

    const tokenEmail = user?.emails?.[0] || user?.email || user?.preferred_username;
    if (!tokenEmail || tokenEmail.toLowerCase() !== body.email.trim().toLowerCase()) {
      throw new AppError(403, 'Email in request does not match authenticated user', 'EMAIL_MISMATCH');
    }

    const ghostAccounts = await this.ghostAccountService.findGhostAccountsByEmail(
      body.email.trim(),
    );
    let totalMigrated = 0;

    for (const ghostAccount of ghostAccounts) {
      if (ghostAccount.status !== 'claimed') {
        // Update state to claimed
        await this.ghostAccountService.claimAccountDirect(ghostAccount.id, userId);

        const role = ghostAccount.role === 'ghost_landlord' ? 'landlord' : 'tenant';
        const migrated = await this.enquiryThreadService.migrateThreadsToUser(
          ghostAccount.id,
          userId,
          role,
        );
        totalMigrated += migrated;
      }
    }

    if (ghostAccounts.length > 0) {
      // Sync user to Mongo users collection
      await this.mongoUserModel.findOneAndUpdate(
        { id: userId },
        {
          $set: {
            id: userId,
            email: body.email.trim(),
            ghostAccountId: ghostAccounts[0].id,
          },
        },
        { upsert: true },
      );
    }

    return {
      data: {
        success: true,
        migratedCount: totalMigrated,
      },
    };
  }
}
