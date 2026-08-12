import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

function ensureFirebaseInitialized() {
  if (admin.apps.length) return;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    // Raw JSON string (production Render env var)
    if (serviceAccountEnv && serviceAccountEnv.trim().startsWith('{')) {
      const obj = JSON.parse(serviceAccountEnv);
      if (obj.type === 'authorized_user' || obj.refresh_token) {
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const tmp = path.join(os.tmpdir(), 'gcp_adc_guard.json');
        fs.writeFileSync(tmp, JSON.stringify(obj));
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tmp;
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      } else {
        if (!obj.project_id) obj.project_id = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
        admin.initializeApp({ credential: admin.credential.cert(obj) });
      }
      return;
    }

    // File path (local dev)
    if (serviceAccountEnv && require('fs').existsSync(serviceAccountEnv)) {
      const serviceAccount = require(serviceAccountEnv);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return;
    }

    // Individual credential vars
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'proptii-16946';
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      return;
    }

    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'proptii-16946' });
  } catch (e) {
    console.error('[FirebaseAuthGuard] Failed to initialize Firebase Admin SDK:', e);
  }
}

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
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
      if (admin.apps.length) {
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
          role: role || null,
          ...decodedToken,
        };

        return true;
      }
    } catch (error: any) {
      // Fallback: Check MSAL / Azure B2C JWT token payload
      const msalPayload = parseJwtPayload(token);
      if (msalPayload && (msalPayload.iss?.includes('b2clogin') || msalPayload.iss?.includes('microsoft') || msalPayload.sub || msalPayload.oid)) {
        const uid = msalPayload.oid || msalPayload.sub || msalPayload.emails?.[0];
        const email = msalPayload.emails?.[0] || msalPayload.email || `${uid}@proptii.co`;
        
        let role = msalPayload.role;
        if (!role && admin.apps.length) {
          try {
            const userDoc = await admin.firestore().collection('users').doc(uid).get();
            if (userDoc.exists) {
              role = userDoc.data()?.role;
            }
          } catch {}
        }

        request.user = {
          uid,
          sub: uid,
          email,
          role: role || null,
          name: msalPayload.name,
        };
        return true;
      }

      console.error('[FirebaseAuthGuard] Verification failed:', error?.message || error);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Fallback if admin.apps.length is 0 but valid MSAL JWT is passed
    const msalPayload = parseJwtPayload(token);
    if (msalPayload && (msalPayload.sub || msalPayload.oid)) {
      const uid = msalPayload.oid || msalPayload.sub;
      const email = msalPayload.emails?.[0] || msalPayload.email || `${uid}@proptii.co`;
      request.user = {
        uid,
        sub: uid,
        email,
        role: null,
        name: msalPayload.name,
      };
      return true;
    }

    throw new UnauthorizedException('Invalid or expired authentication token');
  }
}
