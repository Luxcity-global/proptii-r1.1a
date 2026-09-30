import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingController } from './billing.controller';
import { InsightsController } from './insights.controller';
import { TenantDashboardController } from './tenant-dashboard.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import * as admin from 'firebase-admin';

describe('Section 15, 16, 17 & 18: Billing, Insights, Dashboards Endpoints', () => {
  describe('BillingController', () => {
    let controller: BillingController;
    let service: any;

    beforeEach(() => {
      service = {
        getPlans: vi.fn(),
        getBillingStatus: vi.fn(),
        createCheckoutSession: vi.fn(),
      };
      controller = new BillingController(service);
    });

    it('[GET /billing/plans] lists available subscription plans and feature pricing tiers', async () => {
      service.getPlans.mockResolvedValue([
        { id: 'plan-basic', name: 'Starter', price: 0 },
        { id: 'plan-pro', name: 'Professional', price: 29 },
      ]);

      const res = await controller.getPlans();
      expect(res).toHaveLength(2);
      expect(res[1].name).toBe('Professional');
    });

    it('[GET /billing/status] returns user current subscription tier, quota, and billing status', async () => {
      service.getBillingStatus.mockResolvedValue({
        tier: 'pro',
        status: 'active',
        features: ['unlimited_listings', 'full_referencing'],
      });
      const req = { user: { uid: 'u-1', email: 'u1@test.com', role: 'landlord' } };

      const res = await controller.getStatus(req);
      expect(service.getBillingStatus).toHaveBeenCalledWith('u-1', 'u1@test.com', 'landlord');
      expect(res.tier).toBe('pro');
    });

    it('[POST /billing/checkout] creates Stripe checkout session for chosen tier', async () => {
      service.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      });
      const req = { user: { uid: 'u-1', email: 'u1@test.com' } };
      const dto = { planId: 'pro', cycle: 'yearly' };

      const res = await controller.createCheckout(req, dto);
      expect(service.createCheckoutSession).toHaveBeenCalledWith('u-1', 'u1@test.com', dto);
      expect(res.url).toContain('checkout.stripe.com');
    });
  });

  describe('InsightsController', () => {
    let controller: InsightsController;
    let service: any;

    beforeEach(() => {
      service = {
        getMarketInsights: vi.fn(),
        getPriceTrends: vi.fn(),
        getDemandMetrics: vi.fn(),
      };
      controller = new InsightsController(service);
    });

    it('[GET /insights] gets general property market insights', async () => {
      service.getMarketInsights.mockResolvedValue({ marketTrend: 'rising', averageYield: 5.2 });
      const res = await controller.getInsights('flats', 'Camden');
      expect(service.getMarketInsights).toHaveBeenCalledWith('flats', 'Camden');
      expect(res.marketTrend).toBe('rising');
    });

    it('[GET /insights/price-trends] gets rental and sale price trends by postcode', async () => {
      service.getPriceTrends.mockResolvedValue({ postcode: 'SW1A', avgRent: 3500 });
      const res = await controller.getPriceTrends('SW1A');
      expect(service.getPriceTrends).toHaveBeenCalledWith('SW1A');
      expect(res.avgRent).toBe(3500);
    });

    it('[GET /insights/demand] gets rental demand metrics by location', async () => {
      service.getDemandMetrics.mockResolvedValue({ demandScore: 88, searchesLastWeek: 1200 });
      const res = await controller.getDemand('Hackney');
      expect(service.getDemandMetrics).toHaveBeenCalledWith('Hackney');
      expect(res.demandScore).toBe(88);
    });
  });

  describe('TenantDashboardController', () => {
    let controller: TenantDashboardController;

    beforeEach(() => {
      controller = new TenantDashboardController();

      const mockSnap = { size: 5 };
      const mockCol = {
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(mockSnap),
      };

      vi.spyOn(admin, 'firestore').mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCol),
      } as any);
    });

    it('[GET /tenant-dashboard/summary] returns aggregate summary statistics for tenant', async () => {
      const req = { user: { uid: 'tenant-10', email: 't10@test.com', role: 'tenant' } };
      const res = await controller.getSummary(req);

      expect(res.savedCount).toBe(5);
      expect(res.viewingsCount).toBe(5);
      expect(res.referencingCount).toBe(5);
      expect(res.user.uid).toBe('tenant-10');
    });
  });

  describe('AdminDashboardController', () => {
    let controller: AdminDashboardController;
    let service: any;

    beforeEach(() => {
      service = {
        listCustomers: vi.fn(),
        overview: vi.fn(),
      };
      controller = new AdminDashboardController(service);
    });

    it('[GET /admin/customers] lists customers with enriched subscription details', async () => {
      service.listCustomers.mockResolvedValue([
        { id: 'c-1', email: 'customer@test.com', subscription: 'pro' },
      ]);
      const req = { user: { email: 'admin@proptii.co' } };

      const res = await controller.listCustomers(req);
      expect(service.listCustomers).toHaveBeenCalledWith('admin@proptii.co');
      expect(res).toHaveLength(1);
    });

    it('[GET /admin/overview] retrieves platform-wide overview statistics', async () => {
      service.overview.mockResolvedValue({ totalUsers: 1450, activeListings: 320 });
      const req = { user: { email: 'admin@proptii.co' } };

      const res = await controller.overview(req);
      expect(service.overview).toHaveBeenCalledWith('admin@proptii.co');
      expect(res.totalUsers).toBe(1450);
    });
  });
});
