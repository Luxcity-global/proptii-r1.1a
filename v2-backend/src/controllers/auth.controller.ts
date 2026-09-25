import { Controller, Post, Get, Req, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['tenant', 'landlord', 'agent'], description: 'Desired user role' })
  role: string;

  @ApiProperty({ required: false, description: 'Source trigger for role selection', default: 'manual_select' })
  source?: string;
}

@ApiTags('Auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthController {

  @Get('me')
  @Post('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user identity and role' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile details' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  async getMe(@Req() req: any) {
    const user = req.user;
    return {
      uid: user.uid,
      email: user.email,
      role: user.role || null,
    };
  }

  @Post('role')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Assign or update authenticated user role' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role provided' })
  @ApiResponse({ status: 403, description: 'Tenants cannot switch to Landlord or Agent' })
  async updateRole(@Req() req: any, @Body() body: UpdateRoleDto) {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const { role, source = 'manual_select' } = body;

    if (!role || !['tenant', 'landlord', 'agent'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be tenant, landlord, or agent.');
    }

    // Enforce Rule: Tenants CANNOT upgrade/switch to Landlord or Agent.
    const currentRole = req.user?.role;
    if (currentRole === 'tenant' && (role === 'landlord' || role === 'agent')) {
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
