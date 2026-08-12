import { Controller, Post, Get, Req, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';

@Controller('auth')
export class AuthController {

  @Get('me')
  @Post('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req: any) {
    const user = req.user;
    return {
      uid: user.uid,
      email: user.email,
      role: user.role || 'tenant',
    };
  }

  @Post('role')
  @UseGuards(FirebaseAuthGuard)
  async updateRole(@Req() req: any, @Body() body: { role: string; source?: string }) {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const { role, source = 'manual_select' } = body;

    if (!role || !['tenant', 'landlord', 'agent'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be tenant, landlord, or agent.');
    }

    // Enforce Rule: Tenants CANNOT upgrade/switch to Landlord. Only Landlords can view Tenant.
    const currentRole = req.user?.role;
    if (currentRole === 'tenant' && (role === 'landlord' || role === 'agent') && source === 'manual_select') {
      throw new ForbiddenException('Tenants cannot switch to a Landlord profile.');
    }

    try {
      if (admin.apps.length) {
        await admin.firestore().collection('users').doc(uid).set({
          uid,
          email: email.toLowerCase().trim(),
          role,
          roleAssignedAt: new Date().toISOString(),
          roleSource: source,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      return {
        success: true,
        role,
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[AuthController] Error updating user role:', error);
      return {
        success: false,
        error: error?.message || 'Failed to update user role',
      };
    }
  }
}
