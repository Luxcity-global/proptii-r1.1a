import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

/**
 * Controller for managing tenant invitations.
 * Handles:
 *  1. POST /tenant-invitations (Landlord creates tokenized invitation record)
 *  2. GET /tenant-invitations/validate?token=... (Public validation of invitation token)
 *  3. POST /tenant-invitations/claim (Authenticated tenant claims account and links tenancy)
 *  4. GET /tenant-invitations (Landlord lists invitations)
 *  5. PUT /tenant-invitations/:id (Status update)
 */
@ApiTags('Tenant Invitations')
@Controller('tenant-invitations')
export class TenantInvitationsController {
  private readonly logger = new Logger(TenantInvitationsController.name);

  private get col() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore().collection('tenant_invitations');
    } catch {
      return null;
    }
  }

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Record a sent tenant invitation with secure token' })
  @ApiResponse({ status: 201, description: 'Invitation record created' })
  async createInvitation(@Req() req: any, @Body() body: any) {
    const col = this.col;
    const docId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const token = body.token || crypto.randomBytes(24).toString('hex');
    const tenantEmail = (body.email || body.tenantEmail || '').toLowerCase().trim();
    const expiresAt = body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      id: docId,
      token,
      ...body,
      tenantEmail,
      landlordId: body.landlordId || req.user?.uid || '',
      landlordEmail: body.landlordEmail || req.user?.email || '',
      landlordName: body.landlordName || req.user?.name || req.user?.displayName || '',
      propertyId: body.propertyId || '',
      propertyAddress: body.propertyAddress || '',
      tenantName: body.name || body.tenantName || '',
      rentAmount: body.rentAmount !== undefined ? Number(body.rentAmount) : undefined,
      leaseStart: body.leaseStart || undefined,
      customMessage: body.customMessage || undefined,
      sentAt: body.sentAt || new Date().toISOString(),
      expiresAt,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (col) {
      try {
        await col.doc(docId).set(payload);
        this.logger.log(`Created invitation ${docId} with token for ${tenantEmail}`);
      } catch (err: any) {
        this.logger.warn(`createInvitation error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, token, invitation: payload };
  }

  /**
   * Public endpoint to validate an invitation token before login/signup.
   * GET /api/tenant-invitations/validate?token=...
   */
  @Get('validate')
  @ApiOperation({ summary: 'Validate a tenant invitation token (Public)' })
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateToken(@Query('token') token?: string) {
    if (!token) {
      return { valid: false, reason: 'MISSING_TOKEN', message: 'No invitation token was provided.' };
    }

    const col = this.col;
    if (!col) {
      return { valid: false, reason: 'SERVICE_UNAVAILABLE', message: 'Database service is currently unavailable.' };
    }

    try {
      const snap = await col.where('token', '==', token).limit(1).get();
      if (snap.empty) {
        return { valid: false, reason: 'NOT_FOUND', message: 'This invitation link is invalid or does not exist.' };
      }

      const doc = snap.docs[0];
      const data = doc.data();

      if (data.status === 'accepted') {
        return { valid: false, reason: 'ALREADY_ACCEPTED', message: 'This invitation has already been accepted.' };
      }

      if (data.status === 'revoked') {
        return { valid: false, reason: 'REVOKED', message: 'This invitation has been revoked.' };
      }

      if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
        return { valid: false, reason: 'EXPIRED', message: 'This invitation has expired.' };
      }

      // Return sanitized invitation metadata
      return {
        valid: true,
        invitation: {
          id: doc.id,
          token: data.token,
          propertyId: data.propertyId || '',
          propertyAddress: data.propertyAddress || '',
          landlordName: data.landlordName || '',
          landlordEmail: data.landlordEmail || '',
          tenantEmail: data.tenantEmail || '',
          tenantName: data.tenantName || '',
          rentAmount: data.rentAmount ?? null,
          leaseStart: data.leaseStart ?? null,
          customMessage: data.customMessage ?? null,
          expiresAt: data.expiresAt || '',
        },
      };
    } catch (err: any) {
      this.logger.error(`validateToken error: ${err?.message || err}`);
      return { valid: false, reason: 'ERROR', message: 'Failed to validate invitation token.' };
    }
  }

  /**
   * Authenticated endpoint to claim an invitation and link the tenant account.
   * POST /api/tenant-invitations/claim
   */
  @Post('claim')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Claim a tenant invitation and link profile to property' })
  @ApiResponse({ status: 200, description: 'Invitation successfully claimed' })
  async claimInvitation(@Req() req: any, @Body() body: { token: string }) {
    const token = body?.token;
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }

    const col = this.col;
    const db = this.db;
    if (!col || !db) {
      throw new BadRequestException('Database service is currently unavailable');
    }

    const snap = await col.where('token', '==', token).limit(1).get();
    if (snap.empty) {
      throw new NotFoundException('Invitation not found or invalid');
    }

    const invDoc = snap.docs[0];
    const inv = invDoc.data();

    if (inv.status === 'accepted') {
      return { success: true, message: 'Invitation was already accepted', propertyId: inv.propertyId };
    }

    if (inv.status === 'revoked') {
      throw new BadRequestException('This invitation has been revoked');
    }

    if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('This invitation link has expired');
    }

    const userUid = req.user?.uid || req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userName = req.user?.name || req.user?.displayName || inv.tenantName || 'Tenant';

    // 1. Update invitation status to accepted
    await col.doc(invDoc.id).set(
      {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedByUid: userUid,
        acceptedByEmail: userEmail,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // 2. Persist tenant role into canonical users collection
    try {
      const rolesUnion = typeof admin.firestore?.FieldValue?.arrayUnion === 'function'
        ? admin.firestore.FieldValue.arrayUnion('tenant')
        : ['tenant'];
      await db.collection('users').doc(userUid).set(
        {
          role: 'tenant',
          roles: rolesUnion,
          primaryRole: 'tenant',
          email: userEmail,
          displayName: userName,
          roleSource: 'invitation_claim',
          roleAssignedAt: new Date().toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (uErr: any) {
      this.logger.warn(`Could not update users collection for ${userUid}: ${uErr?.message}`);
    }

    // 3. Update or create record in tenants collection
    let tenantId = '';
    try {
      const tenantsCol = db.collection('tenants');
      // Look for a pending tenant record for this property and email
      const tSnap = await tenantsCol
        .where('propertyId', '==', inv.propertyId)
        .where('email', '==', inv.tenantEmail)
        .limit(1)
        .get();

      if (!tSnap.empty) {
        const tDoc = tSnap.docs[0];
        tenantId = tDoc.id;
        await tenantsCol.doc(tenantId).set(
          {
            status: 'active',
            authUid: userUid,
            tenantUserId: userUid,
            name: userName,
            email: userEmail,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } else {
        // Create new tenant record
        tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await tenantsCol.doc(tenantId).set({
          id: tenantId,
          propertyId: inv.propertyId,
          propertyAddress: inv.propertyAddress || '',
          userId: inv.landlordId || '',
          authUid: userUid,
          tenantUserId: userUid,
          email: userEmail,
          name: userName,
          rentAmount: inv.rentAmount || 0,
          status: 'active',
          paymentFrequency: 'monthly',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (tErr: any) {
      this.logger.warn(`Could not update tenants record: ${tErr?.message}`);
    }

    // 4. Update property status to occupied
    if (inv.propertyId && tenantId) {
      try {
        await db.collection('properties').doc(inv.propertyId).set(
          {
            status: 'occupied',
            tenantId,
            tenantName: userName,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (pErr: any) {
        this.logger.warn(`Could not update property ${inv.propertyId}: ${pErr?.message}`);
      }
    }

    // 5. Ensure conversation thread exists between Landlord and Tenant
    let conversationId = '';
    if (inv.propertyId && inv.landlordId) {
      try {
        const convCol = db.collection('conversations');
        const cSnap = await convCol
          .where('propertyId', '==', inv.propertyId)
          .where('tenantId', '==', userUid)
          .limit(1)
          .get();

        // Resolve landlordName
        let landlordName = inv.landlordName || '';
        if (!landlordName && inv.landlordId) {
          try {
            const lUserDoc = await db.collection('users').doc(inv.landlordId).get();
            if (lUserDoc.exists) {
              const lData = lUserDoc.data();
              landlordName = lData?.name || lData?.displayName || lData?.fullName || '';
            }
          } catch (_) {}
        }
        if (!landlordName && inv.landlordEmail) {
          landlordName = inv.landlordEmail.split('@')[0];
        }

        // Resolve propertyAddress and propertyTitle
        let propertyAddress = inv.propertyAddress || '';
        let propertyTitle = inv.propertyAddress || '';
        if ((!propertyAddress || !propertyTitle) && inv.propertyId) {
          try {
            const pDoc = await db.collection('properties').doc(inv.propertyId).get();
            if (pDoc.exists) {
              const pData = pDoc.data();
              propertyAddress = propertyAddress || pData?.address || pData?.title || '';
              propertyTitle = propertyTitle || pData?.title || pData?.address || '';
            }
          } catch (_) {}
        }

        const nowIso = new Date().toISOString();
        const welcomeText = inv.customMessage
          ? `Welcome to your new home at ${propertyAddress || 'the property'}!\n\n${inv.customMessage}`
          : `Welcome to your new home at ${propertyAddress || 'the property'}! Feel free to reach out here if you have any questions.`;

        if (!cSnap.empty) {
          conversationId = cSnap.docs[0].id;
          const existingData = cSnap.docs[0].data();
          const patch: any = {};
          if ((!existingData.landlordName || existingData.landlordName === 'Landlord') && landlordName) {
            patch.landlordName = landlordName;
          }
          if (!existingData.propertyAddress && propertyAddress) {
            patch.propertyAddress = propertyAddress;
          }
          if (!existingData.propertyTitle && (propertyTitle || propertyAddress)) {
            patch.propertyTitle = propertyTitle || propertyAddress;
          }
          if (Object.keys(patch).length > 0) {
            await convCol.doc(conversationId).set(patch, { merge: true });
          }
        } else {
          conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

          // Create welcome message in messages collection so thread has content and is active
          const msgCol = db.collection('messages');
          const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          await msgCol.doc(msgId).set({
            id: msgId,
            conversationId,
            senderId: inv.landlordId,
            senderRole: 'landlord',
            body: welcomeText,
            attachmentIds: [],
            sentAt: nowIso,
            readAt: null,
            isDeleted: false,
          });

          await convCol.doc(conversationId).set({
            id: conversationId,
            propertyId: inv.propertyId,
            propertyAddress: propertyAddress || '',
            propertyTitle: propertyTitle || propertyAddress || 'Property Listing',
            landlordId: inv.landlordId,
            landlordName: landlordName || 'Landlord',
            landlordEmail: inv.landlordEmail || '',
            tenantId: userUid,
            tenantEmail: userEmail,
            tenantName: userName,
            lastMessage: welcomeText,
            lastMessagePreview: 'Welcome to your new home!',
            lastMessageAt: nowIso,
            unreadForTenant: 1,
            unreadForLandlord: 0,
            unreadCountTenant: 1,
            unreadCountLandlord: 0,
            isDeleted: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      } catch (cErr: any) {
        this.logger.warn(`Could not create initial conversation: ${cErr?.message}`);
      }
    }

    return {
      success: true,
      message: 'Invitation claimed successfully',
      propertyId: inv.propertyId,
      propertyAddress: inv.propertyAddress,
      tenantId,
      conversationId,
    };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List pending invitations for a landlord' })
  @ApiQuery({ name: 'landlordId', required: false })
  @ApiResponse({ status: 200, description: 'Array of invitations' })
  async getInvitations(@Req() req: any, @Query('landlordId') landlordId?: string) {
    const col = this.col;
    if (!col) return { invitations: [] };
    const uid = landlordId || req.user?.uid || '';
    try {
      const snap = await col
        .where('landlordId', '==', uid)
        .orderBy('sentAt', 'desc')
        .limit(100)
        .get();
      const invitations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { invitations };
    } catch (err: any) {
      this.logger.warn(`getInvitations error: ${err?.message || err}`);
      return { invitations: [] };
    }
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update invitation status (e.g. mark as accepted)' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Updated' })
  async updateInvitation(@Param('id') id: string, @Body() body: { status: string }) {
    const col = this.col;
    if (!col) return { success: true };
    try {
      await col.doc(id).set(
        { status: body.status, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updateInvitation error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }
}
