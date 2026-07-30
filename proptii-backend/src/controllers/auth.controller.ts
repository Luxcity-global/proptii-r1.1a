import { Controller, Post, Req, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import * as admin from 'firebase-admin';

@Controller('auth')
export class AuthController {
  @Post('firebase-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getFirebaseToken(@Req() req: any) {
    try {
      const uid = req.user?.sub;
      const role = req.user?.role || 'tenant';

      if (!uid) {
        throw new InternalServerErrorException('Missing user identifier in token');
      }

      // Generate a custom token with user's Azure B2C Object ID (uid) and claims
      const email = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username || '';
      const firebaseToken = await admin.auth().createCustomToken(uid, { 
        role, 
        email: email.toLowerCase().trim() 
      });


      return {
        success: true,
        firebaseToken,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to generate Firebase custom token: ${error.message}`);
    }
  }
}
