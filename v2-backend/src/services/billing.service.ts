import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  complimentaryBillingPayload,
  isComplimentaryAccessEmail,
} from '../utils/complimentary-access';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('subscriptions') : null;
  }

  async getBillingStatus(userId: string, email?: string, role?: string) {
    if (isComplimentaryAccessEmail(email)) {
      return complimentaryBillingPayload(role);
    }

    const db = this.db;
    if (!db) {
      return {
        dashboard: (role || '').toLowerCase() === 'landlord' ? 'landlord' : 'consumer',
        hasActiveSubscription: true,
        planId: 'pro',
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: null,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        fitChecksUsed: 0,
        fitChecksQuota: null,
        pendingPlan: null,
        pendingCycle: null,
        billingCadence: 'monthly',
        hasStripeCustomer: false,
      };
    }

    try {
      const col = db.collection('subscriptions');
      let doc = await col.doc(userId).get();
      let data = doc.exists ? doc.data() : null;

      if (!data && email) {
        const mailSnap = await col.where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (!mailSnap.empty) {
          data = mailSnap.docs[0].data();
        }
      }

      // Check users collection as fallback for entitlement
      if (!data) {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          if (u?.subscriptionTier || u?.plan || u?.subscriptionStatus) {
            data = {
              planId: u.subscriptionTier || u.plan,
              status: u.subscriptionStatus || 'active',
              cycle: u.billingCadence || 'monthly',
            };
          }
        }
      }

      const planId = data?.planId || data?.plan || 'free';
      const status = data?.status || 'active';
      const isActive = status === 'active' || status === 'trialing';

      return {
        dashboard: (role || '').toLowerCase() === 'landlord' || planId.startsWith('landlord') ? 'landlord' : 'consumer',
        hasActiveSubscription: isActive,
        planId,
        plan: planId,
        status,
        currentPeriodEnd: data?.currentPeriodEnd || null,
        trialEndsAt: data?.trialEndsAt || null,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
        fitChecksUsed: data?.fitChecksUsed ?? 0,
        fitChecksQuota: data?.fitChecksQuota ?? null,
        pendingPlan: data?.pendingPlanId || null,
        pendingCycle: data?.pendingCycle || null,
        billingCadence: data?.cycle || data?.billingCadence || 'monthly',
        hasStripeCustomer: Boolean(data?.stripeCustomerId || data?.hasStripeCustomer),
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch billing status for ${userId}: ${err?.message || err}`);
      return {
        dashboard: (role || '').toLowerCase() === 'landlord' ? 'landlord' : 'consumer',
        hasActiveSubscription: true,
        planId: 'free',
        plan: 'free',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        fitChecksUsed: 0,
        fitChecksQuota: null,
        pendingPlan: null,
        pendingCycle: null,
        billingCadence: 'monthly',
        hasStripeCustomer: false,
      };
    }
  }

  async createCheckoutSession(userId: string, email: string, dto: any) {
    const planId = dto.planId || 'renter_pro';
    const cycle = dto.cycle || 'monthly';
    const mockSessionId = `cs_mock_${Date.now()}`;

    // Update pending subscription in Firestore
    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({
          userId,
          email,
          planId,
          cycle,
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (err: any) {
        this.logger.warn(`Failed to save checkout state: ${err?.message || err}`);
      }
    }

    return {
      sessionId: mockSessionId,
      url: `/billing/confirmed?session_id=${mockSessionId}&plan=${planId}`,
      checkoutUrl: `/billing/confirmed?session_id=${mockSessionId}&plan=${planId}`,
    };
  }

  async createPortalSession(userId: string, email: string) {
    return {
      portalUrl: '/dashboard/settings',
    };
  }

  async confirmCheckoutSession(userId: string, sessionId: string, email?: string) {
    const db = this.db;
    if (!db) {
      this.logger.error(`Failed to confirm checkout for ${userId}: Database connection is unavailable.`);
      throw new InternalServerErrorException('Database connection is unavailable. Entitlement records failed to persist.');
    }

    try {
      const subRef = db.collection('subscriptions').doc(userId);
      const userRef = db.collection('users').doc(userId);

      const [subSnap, userSnap] = await Promise.all([
        subRef.get(),
        userRef.get(),
      ]);

      const subData = subSnap.exists ? subSnap.data() : null;
      const userData = userSnap.exists ? userSnap.data() : null;

      const planId = subData?.pendingPlanId || subData?.planId || userData?.pendingPlan || userData?.plan || 'renter_pro';
      const cycle = subData?.pendingCycle || subData?.cycle || 'monthly';
      const userEmail = email || subData?.email || userData?.email || '';

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Batch write to ensure atomic persistence to both subscriptions and users
      const batch = db.batch();

      batch.set(subRef, {
        userId,
        email: userEmail,
        planId,
        plan: planId,
        cycle,
        status: 'active',
        confirmedAt: now,
        updatedAt: now,
        sessionId: sessionId || null,
      }, { merge: true });

      batch.set(userRef, {
        subscriptionStatus: 'active',
        subscriptionTier: planId,
        plan: planId,
        isSubscribed: true,
        billingCadence: cycle,
        updatedAt: now,
      }, { merge: true });

      await batch.commit();

      this.logger.log(`[BillingService] Successfully persisted entitlement for ${userId}: plan=${planId}`);

      return {
        dashboard: planId.startsWith('landlord') ? 'landlord' : 'consumer',
        plan: planId,
        planId,
        status: 'active',
        hasActiveSubscription: true,
        currentPeriodEnd: null,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        fitChecksUsed: 0,
        fitChecksQuota: null,
        pendingPlan: null,
        pendingCycle: null,
        billingCadence: cycle,
        hasStripeCustomer: true,
        success: true,
        message: 'Subscription confirmed successfully',
      };
    } catch (err: any) {
      this.logger.error(`[BillingService] Entitlement persistence failed for ${userId}: ${err?.message || err}`);
      throw new InternalServerErrorException(`Failed to persist user entitlement records: ${err?.message || err}`);
    }
  }

  async getPlans() {
    return [
      {
        id: 'free',
        name: 'Explorer (Free)',
        priceMonthly: 0,
        priceAnnual: 0,
        features: ['Search Properties', 'Basic Referencing', 'Guest Enquiries'],
      },
      {
        id: 'renter_pro',
        name: 'Renter Pro',
        priceMonthly: 9.99,
        priceAnnual: 99.00,
        features: ['Priority Referencing', 'Unlimited Viewing Requests', 'Document Vault'],
      },
      {
        id: 'landlord_pro',
        name: 'Landlord Pro',
        priceMonthly: 29.99,
        priceAnnual: 299.00,
        features: ['Unlimited Property Listings', 'Digital Contracts', 'Tenant Screening'],
      },
    ];
  }

  async setPendingPlan(userId: string, email: string, planId: string, cycle: string) {
    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({
          userId,
          email,
          pendingPlanId: planId,
          pendingCycle: cycle,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch {}
    }
    return { success: true, planId, cycle };
  }

  async downgradeToFree(userId: string) {
    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({
          userId,
          planId: 'free',
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch {}
    }
    return { success: true, planId: 'free' };
  }
}
