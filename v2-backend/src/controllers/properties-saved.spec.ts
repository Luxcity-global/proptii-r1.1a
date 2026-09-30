import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativePropertiesController } from './native-properties.controller';
import { NativePropertiesService } from '../services/native-properties.service';
import { SavedPropertiesController } from './saved-properties.controller';
import { SavedPropertiesService } from '../services/saved-properties.service';
import { NotFoundException } from '@nestjs/common';

describe('Section 3 & 10: Native Properties & Saved Properties Endpoints', () => {
  describe('NativePropertiesController', () => {
    let controller: NativePropertiesController;
    let service: any;

    beforeEach(() => {
      service = {
        searchPublic: vi.fn(),
        findAllByUser: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      };
      controller = new NativePropertiesController(service);
    });

    it('[GET /native-properties/search] normalises search results with public formatting', async () => {
      service.searchPublic.mockResolvedValue([
        {
          id: 'prop-1',
          userId: 'll-1',
          title: 'Modern 2 Bed Apartment',
          price: '2100',
          address: '42 High St',
          city: 'London',
          postcode: 'E1 6AN',
          bedrooms: 2,
          bathrooms: 2,
          propertyType: 'Flat',
          notes: 'Bright and spacious',
          photos: ['https://storage.proptii.co/photo1.jpg'],
          status: 'vacant',
        },
      ]);

      const res = await controller.search('London', 'vacant', '10');
      expect(res.total).toBe(1);
      expect(res.query).toBe('London');
      expect(res.results[0]).toEqual({
        id: 'prop-1',
        source: 'native',
        landlordId: 'll-1',
        title: 'Modern 2 Bed Apartment',
        price: '2100',
        location: '42 High St, London, E1 6AN',
        bedrooms: 2,
        bathrooms: 2,
        propertyType: 'Flat',
        description: 'Bright and spacious',
        squareFootage: undefined,
        amenities: [],
        imageUrls: ['https://storage.proptii.co/photo1.jpg'],
        agent: {
          id: 'll-1',
          name: 'Proptii Landlord',
          email: '',
          phone: undefined,
          company: undefined,
        },
        street: '42 High St',
        city: 'London',
        postcode: 'E1 6AN',
        status: 'vacant',
      });
      expect(service.searchPublic).toHaveBeenCalledWith('London', 10);
    });

    it('[GET /native-properties] lists properties filtered by landlord user ID or email', async () => {
      service.findAllByUser.mockResolvedValue([{ id: 'prop-1', title: 'Property 1' }]);
      const res = await controller.list('user-123', 'landlord@test.com');
      expect(service.findAllByUser).toHaveBeenCalledWith('user-123', 'landlord@test.com');
      expect(res).toHaveLength(1);
    });

    it('[GET /native-properties/:id] returns single property or throws NotFoundException', async () => {
      service.findById.mockResolvedValueOnce({ id: 'prop-1', title: 'Prop 1' });
      const found = await controller.getById('prop-1');
      expect(found).toEqual({ id: 'prop-1', title: 'Prop 1' });

      service.findById.mockResolvedValueOnce(null);
      await expect(controller.getById('prop-none')).rejects.toThrow(NotFoundException);
    });

    it('[POST /native-properties] creates property listing with landlord credentials', async () => {
      service.create.mockImplementation(async (data: any) => ({ id: 'new-prop-id', ...data }));
      const req = { user: { uid: 'll-99', email: 'Landlord@Test.COM' } };
      const body = { title: 'New Flat', price: '1500', address: '1 Test St' };

      const res = await controller.create(req, body);
      expect(res.id).toBe('new-prop-id');
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Flat',
          price: '1500',
          userId: 'll-99',
          landlordId: 'll-99',
          ownerEmail: 'landlord@test.com',
        }),
      );
    });

    it('[PUT /native-properties/:id] updates property with user ownership verification', async () => {
      service.update.mockResolvedValue({ id: 'prop-1', price: '2500' });
      const req = { user: { uid: 'll-99', email: 'landlord@test.com' } };

      const res = await controller.update(req, 'prop-1', { price: '2500' });
      expect(service.update).toHaveBeenCalledWith('prop-1', 'll-99', 'landlord@test.com', { price: '2500' });
      expect(res).toEqual({ id: 'prop-1', price: '2500' });
    });

    it('[DELETE /native-properties/:id] deletes property', async () => {
      service.remove.mockResolvedValue(undefined);
      const req = { user: { uid: 'll-99', email: 'landlord@test.com' } };

      const res = await controller.remove(req, 'prop-1');
      expect(service.remove).toHaveBeenCalledWith('prop-1', 'll-99', 'landlord@test.com');
      expect(res).toEqual({ message: 'Property deleted' });
    });
  });

  describe('SavedPropertiesController', () => {
    let controller: SavedPropertiesController;
    let service: any;

    beforeEach(() => {
      service = {
        getSavedProperties: vi.fn(),
        saveProperty: vi.fn(),
        unsaveProperty: vi.fn(),
      };
      controller = new SavedPropertiesController(service);
    });

    it('[GET /saved-properties] fetches saved properties with optional pagination', async () => {
      service.getSavedProperties.mockResolvedValue({ items: [{ id: 'saved-1', propertyId: 'prop-10' }], total: 1 });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.getSavedProperties(req, '20', 'last-key');
      expect(service.getSavedProperties).toHaveBeenCalledWith('tenant-1', 20, 'last-key');
      expect(res.items).toHaveLength(1);
    });

    it('[POST /saved-properties] bookmarks property extracting propertyId from body', async () => {
      service.saveProperty.mockResolvedValue({ success: true, id: 'saved-99' });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.saveProperty(req, { propertyId: 'prop-abc', notes: 'Interested' });
      expect(service.saveProperty).toHaveBeenCalledWith('tenant-1', 'prop-abc', { propertyId: 'prop-abc', notes: 'Interested' });
      expect(res.success).toBe(true);
    });

    it('[DELETE /saved-properties/:propertyId] removes saved property bookmark', async () => {
      service.unsaveProperty.mockResolvedValue({ success: true });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.unsaveProperty(req, 'prop%2F123');
      expect(service.unsaveProperty).toHaveBeenCalledWith('tenant-1', 'prop/123');
      expect(res.success).toBe(true);
    });
  });
});
