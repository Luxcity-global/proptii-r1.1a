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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';

/**
 * Lightweight controller for tracking tenant invitations sent by landlords/agents.
 * Stores invitation records in the `tenant_invitations` Firestore collection so that
 * sent invitations are visible in the dashboard rather than being fire-and-forget.
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

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Record a sent tenant invitation' })
  @ApiResponse({ status: 201, description: 'Invitation record created' })
  async createInvitation(@Req() req: any, @Body() body: any) {
    const col = this.col;
    const docId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = {
      id: docId,
      ...body,
      landlordId: body.landlordId || req.user?.uid || '',
      landlordEmail: body.landlordEmail || req.user?.email || '',
      sentAt: body.sentAt || new Date().toISOString(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (col) {
      try {
        await col.doc(docId).set(payload);
      } catch (err: any) {
        this.logger.warn(`createInvitation error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId };
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
