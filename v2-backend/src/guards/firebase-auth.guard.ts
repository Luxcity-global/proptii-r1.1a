import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

function ensureFirebaseInitialized() {
  if (admin.apps.length) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  try {
    if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp();
    }
  } catch (e) {
    console.error('[FirebaseAuthGuard] Failed to initialize Firebase Admin SDK:', e);
  }
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    // Support local dev mock tokens
    if (token.startsWith('mock-') || token.startsWith('mock_')) {
      const mockId = token.replace('mock-token-', '').replace('mock-', '');
      const mockRole = mockId.includes('landlord') ? 'landlord' : 'tenant';
      request.user = {
        uid: mockId || 'dev-user-id',
        sub: mockId || 'dev-user-id',
        email: `${mockRole}@test.proptii.co`,
        role: mockRole,
      };
      return true;
    }

    ensureFirebaseInitialized();

    try {
      if (!admin.apps.length) {
        throw new Error('Firebase Admin SDK is not properly initialized');
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      
      let role = decodedToken.role;
      if (!role) {
        try {
          const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
          if (userDoc.exists) {
            role = userDoc.data()?.role;
          }
        } catch {}
      }

      request.user = {
        uid: decodedToken.uid,
        sub: decodedToken.uid,
        email: decodedToken.email,
        role: role || 'tenant',
        ...decodedToken,
      };

      return true;
    } catch (error: any) {
      console.error('[FirebaseAuthGuard] Verification failed:', error?.message || error);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
