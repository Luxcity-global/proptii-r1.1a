import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileController } from './user-profile.controller';
import { ReportController } from './report.controller';
import { UserProfileService } from '../services/user-profile.service';
import { ReportAssembleService } from '../gov-data/services/report-assemble.service';

describe('Section 22 & 23: User Profile, Reviews & Property Report Endpoints', () => {
  describe('UserProfileController', () => {
    let controller: UserProfileController;
    let service: any;

    beforeEach(() => {
      service = {
        getProfile: vi.fn(),
        updateProfile: vi.fn(),
        getReviews: vi.fn(),
        createReview: vi.fn(),
        getReviewStats: vi.fn(),
      };
      controller = new UserProfileController(service);
    });

    it('[GET /users/profile] returns authenticated user profile', async () => {
      service.getProfile.mockResolvedValue({ uid: 'u-1', name: 'Alice' });
      const req = { user: { uid: 'u-1' } };

      const res = await controller.getOwnProfile(req);
      expect(service.getProfile).toHaveBeenCalledWith('u-1');
      expect(res.name).toBe('Alice');
    });

    it('[PUT /users/profile] updates profile and strips unauthorized role alteration', async () => {
      service.updateProfile.mockResolvedValue({ success: true });
      const req = { user: { uid: 'u-1', email: 'user@test.com', role: 'tenant' } };
      const body = { name: 'Alice B', role: 'admin', admin: true };

      const res = await controller.updateOwnProfile(req, body);
      expect(service.updateProfile).toHaveBeenCalledWith(
        'u-1',
        expect.not.objectContaining({ role: 'admin', admin: true }),
      );
      expect(res.success).toBe(true);
    });

    it('[GET /reviews] lists reviews optionally filtered by propertyId', async () => {
      service.getReviews.mockResolvedValue([{ id: 'rev-1', rating: 5 }]);

      const res = await controller.getReviews('prop-100');
      expect(service.getReviews).toHaveBeenCalledWith('prop-100');
      expect(res).toHaveLength(1);
    });

    it('[POST /reviews] creates property review for current user', async () => {
      service.createReview.mockResolvedValue({ id: 'rev-2' });
      const req = { user: { uid: 'u-1' } };
      const body = { propertyId: 'prop-100', rating: 4, comment: 'Great location' };

      const res = await controller.createReview(req, body);
      expect(service.createReview).toHaveBeenCalledWith('u-1', body);
      expect(res.id).toBe('rev-2');
    });

    it('[GET /reviews/stats] returns rating aggregates for a property', async () => {
      service.getReviewStats.mockResolvedValue({ averageRating: 4.8, totalReviews: 12 });

      const res = await controller.getReviewStats('prop-100');
      expect(service.getReviewStats).toHaveBeenCalledWith('prop-100');
      expect(res.averageRating).toBe(4.8);
    });
  });

  describe('ReportController', () => {
    let controller: ReportController;
    let assembleService: any;

    beforeEach(() => {
      assembleService = {
        streamReport: vi.fn().mockResolvedValue(undefined),
      };
      controller = new ReportController(assembleService);
    });

    it('[POST /properties/report] extracts UK postcode from display string and initiates streaming report', async () => {
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        flush: vi.fn(),
      } as any;

      const dto = {
        listingId: 'listing-456',
        address: {
          display: '10 Downing St, London SW1A 2AA, UK',
        },
      };

      await controller.getReport(dto as any, mockRes);
      expect(dto.address.postcode).toBe('SW1A 2AA');
      expect(assembleService.streamReport).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: 'listing-456',
          address: expect.objectContaining({
            postcode: 'SW1A 2AA',
          }),
        }),
        mockRes,
      );
    });
  });
});
