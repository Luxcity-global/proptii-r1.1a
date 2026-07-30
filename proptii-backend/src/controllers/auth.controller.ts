import { Controller, Post, Req, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import * as admin from 'firebase-admin';
import { initializeFirestore } from '../config/firestore.config';

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
        return {
          success: false,
          error: 'Missing user identifier in token'
        };
      }

      // Ensure Firebase Admin is initialized
      if (!admin.apps.length) {
        await initializeFirestore();
      }

      // If Firebase Admin credentials are not configured on the server environment, handle gracefully
      if (!admin.apps.length) {
        return {
          success: false,
          message: 'Firebase Admin SDK credentials not configured on backend environment',
          firebaseToken: null
        };
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
      console.error('❌ Error generating Firebase custom token:', error);
      return {
        success: false,
        error: error?.message || 'Failed to generate Firebase custom token'
      };
    }
  }
}

