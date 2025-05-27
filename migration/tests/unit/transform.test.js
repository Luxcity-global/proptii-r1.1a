const { transformDocument, transformCollection } = require('../../src/transform');
const { MigrationError } = require('../../src/utils/errorHandling');

describe('Transform Module', () => {
  describe('transformDocument', () => {
    test('should transform a Users document correctly', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        phoneNumber: '+1234567890',
        createdAt: { _seconds: 1609459200, _nanoseconds: 0 }, // 2021-01-01
        lastLoginAt: { _seconds: 1609545600, _nanoseconds: 0 }, // 2021-01-02
        role: 'user'
      };

      const transformed = await transformDocument(mockUser, 'Users');

      expect(transformed).toEqual({
        id: 'user123',
        _type: 'Users',
        _partitionKey: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        phoneNumber: '+1234567890',
        createdAt: '2021-01-01T00:00:00.000Z',
        lastLoginAt: '2021-01-02T00:00:00.000Z',
        role: 'user',
        _metadata: expect.objectContaining({
          createdAt: expect.any(String),
          source: 'firestore',
          originalId: 'user123'
        })
      });
    });

    test('should transform a Properties document correctly', async () => {
      const mockProperty = {
        id: 'prop123',
        title: 'Beautiful House',
        description: 'A lovely property',
        price: 500000,
        status: 'available',
        createdAt: { _seconds: 1609459200, _nanoseconds: 0 },
        address: {
          street: '123 Main St',
          city: 'Example City',
          state: 'State',
          postalCode: '12345',
          region: 'North'
        },
        coordinates: {
          _latitude: 40.7128,
          _longitude: -74.0060
        },
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        features: ['garden', 'garage'],
        images: ['image1.jpg', 'image2.jpg'],
        videos: ['video1.mp4']
      };

      const transformed = await transformDocument(mockProperty, 'Properties');

      expect(transformed).toEqual({
        id: 'prop123',
        _type: 'Properties',
        _partitionKey: 'North',
        title: 'Beautiful House',
        description: 'A lovely property',
        price: 500000,
        status: 'available',
        createdAt: '2021-01-01T00:00:00.000Z',
        address: {
          street: '123 Main St',
          city: 'Example City',
          state: 'State',
          postalCode: '12345',
          region: 'North'
        },
        coordinates: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128]
        },
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        features: ['garden', 'garage'],
        images: ['image1.jpg', 'image2.jpg'],
        videos: ['video1.mp4'],
        _metadata: expect.objectContaining({
          createdAt: expect.any(String),
          source: 'firestore',
          originalId: 'prop123'
        })
      });
    });

    test('should transform a ViewingRequests document correctly', async () => {
      const mockViewing = {
        id: 'view123',
        propertyId: {
          id: 'prop123',
          path: 'properties/prop123',
          parent: { id: 'properties' }
        },
        userId: {
          id: 'user123',
          path: 'users/user123',
          parent: { id: 'users' }
        },
        requestDate: { _seconds: 1609459200, _nanoseconds: 0 },
        status: 'pending',
        notes: 'Interested in viewing'
      };

      const transformed = await transformDocument(mockViewing, 'ViewingRequests');

      expect(transformed).toEqual({
        id: 'view123',
        _type: 'ViewingRequests',
        _partitionKey: 'prop123',
        propertyId: {
          id: 'prop123',
          path: 'properties/prop123',
          collection: 'properties'
        },
        userId: {
          id: 'user123',
          path: 'users/user123',
          collection: 'users'
        },
        requestDate: '2021-01-01T00:00:00.000Z',
        status: 'pending',
        notes: 'Interested in viewing',
        _metadata: expect.objectContaining({
          createdAt: expect.any(String),
          source: 'firestore',
          originalId: 'view123'
        })
      });
    });

    test('should handle null values correctly', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: null,
        phoneNumber: undefined,
        createdAt: null,
        role: 'user'
      };

      const transformed = await transformDocument(mockUser, 'Users');

      expect(transformed.displayName).toBeNull();
      expect(transformed.phoneNumber).toBeUndefined();
      expect(transformed.createdAt).toBeNull();
    });

    test('should throw error for unknown collection', async () => {
      const mockDoc = {
        id: 'doc123',
        field: 'value'
      };

      await expect(transformDocument(mockDoc, 'UnknownCollection'))
        .rejects
        .toThrow(MigrationError);
    });
  });

  describe('transformCollection', () => {
    test('should transform a collection of documents', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          role: 'user'
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          role: 'admin'
        }
      ];

      const result = await transformCollection(mockUsers, 'Users');

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(2);
      expect(result.summary.transformed).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.data).toHaveLength(2);
      expect(result.failedDocuments).toHaveLength(0);
    });

    test('should handle failed transformations', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          field: 'value'
        },
        {
          id: 'doc2',
          field: 'value'
        }
      ];

      const result = await transformCollection(mockDocs, 'UnknownCollection');

      expect(result.success).toBe(false);
      expect(result.summary.total).toBe(2);
      expect(result.summary.transformed).toBe(0);
      expect(result.summary.failed).toBe(2);
      expect(result.data).toHaveLength(0);
      expect(result.failedDocuments).toHaveLength(2);
    });
  });
}); 