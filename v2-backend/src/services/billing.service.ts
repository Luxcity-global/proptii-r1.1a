import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

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

  async getBillingStatus(userId: string) {
    const col = this.collection;
    if (!col) {
      return {
        hasActiveSubscription: true,
        planId: 'pro',
        status: 'active',
        currentPeriodEnd: null,
      };
    }

    try {
      const doc = await col.doc(userId).get();
      if (!doc.exists) {
        return {
          hasActiveSubscription: true,
          planId: 'free',
          status: 'active',
          currentPeriodEnd: null,
        };
      }
      const data = doc.data();
      return {
        hasActiveSubscription: data?.status === 'active' || data?.status === 'trialing',
        planId: data?.planId || 'free',
        status: data?.status || 'active',
        currentPeriodEnd: data?.currentPeriodEnd || null,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch billing status for ${userId}: ${err?.message || err}`);
      return {
        hasActiveSubscription: true,
        planId: 'free',
        status: 'active',
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
    };
  }

  async createPortalSession(userId: string, email: string) {
    return {
      portalUrl: '/dashboard/settings',
    };
  }

  async confirmCheckoutSession(userId: string, sessionId: string) {
    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({
          userId,
          status: 'active',
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch {}
    }

    return {
      success: true,
      message: 'Subscription confirmed successfully',
    };
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
