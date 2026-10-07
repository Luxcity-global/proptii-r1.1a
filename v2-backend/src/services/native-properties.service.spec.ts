import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativePropertiesService } from './native-properties.service';
import { NotFoundException } from '@nestjs/common';

describe('NativePropertiesService Ownership & Persistence', () => {
  let service: NativePropertiesService;
  let propertiesMap: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();
    propertiesMap = new Map();

    service = new NativePropertiesService();

    const mockCollection = {
      doc: (id?: string) => {
        const docId = id || `prop_${Date.now()}`;
        return {
          id: docId,
          get: vi.fn().mockImplementation(async () => {
            const data = propertiesMap.get(docId);
            return {
              exists: !!data,
              data: () => data,
            };
          }),
          set: vi.fn().mockImplementation(async (data: any) => {
            propertiesMap.set(docId, { id: docId, ...data });
          }),
          update: vi.fn().mockImplementation(async (patch: any) => {
            const existing = propertiesMap.get(docId) || {};
            propertiesMap.set(docId, { ...existing, ...patch });
          }),
          delete: vi.fn().mockImplementation(async () => {
            propertiesMap.delete(docId);
          }),
        };
      },
      where: (field: string, op: string, val: any) => ({
        get: vi.fn().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [id, data] of propertiesMap.entries()) {
            if (data[field] === val) {
              docs.push({ id, data: () => data });
            }
          }
          return { docs };
        }),
      }),
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }),
    };

    vi.spyOn(service as any, 'collection', 'get').mockReturnValue(mockCollection);
  });

  describe('update property & document array synchronization', () => {
    it('allows update when owner matches via userId', async () => {
      propertiesMap.set('prop-1', {
        id: 'prop-1',
        title: 'Flat 1',
        userId: 'uid-123',
        documents: [{ id: 'doc-1', name: 'Gas Safety' }],
      });

      const updated = await service.update('prop-1', 'uid-123', 'test@example.com', {
        documents: [], // Document was deleted
      });

      expect(updated.documents).toEqual([]);
      expect(propertiesMap.get('prop-1').documents).toEqual([]);
    });

    it('allows update when owner matches via ownerEmail (case-insensitive)', async () => {
      propertiesMap.set('prop-2', {
        id: 'prop-2',
        title: 'Flat 2',
        userId: 'some-other-uid',
        ownerEmail: 'landlord@test.com',
        documents: [{ id: 'doc-to-remove', name: 'Old EPC' }],
      });

      const updated = await service.update('prop-2', 'new-uid-456', 'LANDLORD@TEST.COM', {
        documents: [],
      });

      expect(updated.documents).toEqual([]);
      expect(propertiesMap.get('prop-2').documents).toEqual([]);
    });

    it('allows update when property was created with landlordEmail or email field', async () => {
      propertiesMap.set('prop-3', {
        id: 'prop-3',
        title: 'Flat 3',
        landlordEmail: 'landlord@test.com',
        documents: [{ id: 'doc-epc', name: 'EPC' }],
      });

      const updated = await service.update('prop-3', 'different-uid', 'landlord@test.com', {
        documents: [],
      });

      expect(updated.documents).toEqual([]);
      expect(propertiesMap.get('prop-3').documents).toEqual([]);
    });

    it('rejects update when user is not authorized', async () => {
      propertiesMap.set('prop-4', {
        id: 'prop-4',
        userId: 'legitimate-owner',
        ownerEmail: 'legit@owner.com',
      });

      await expect(
        service.update('prop-4', 'intruder-uid', 'intruder@evil.com', { title: 'Hacked' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove property (deletion)', () => {
    it('deletes property when owner matches via landlordId', async () => {
      propertiesMap.set('prop-del-1', {
        id: 'prop-del-1',
        title: 'To Delete',
        landlordId: 'uid-del-1',
      });

      const res = await service.remove('prop-del-1', 'uid-del-1', 'landlord@del.com');
      expect(res).toEqual({ success: true });
      expect(propertiesMap.has('prop-del-1')).toBe(false);
    });

    it('deletes property when userId in Firestore was saved as user email', async () => {
      propertiesMap.set('prop-del-2', {
        id: 'prop-del-2',
        title: 'Email UID Property',
        userId: 'miracleohuka43@gmail.com',
      });

      // Request comes in with Firebase UID, and matching email in token
      const res = await service.remove('prop-del-2', '3EKbhObAE5dw0RZ7lP3cK4rYeSp1', 'miracleohuka43@gmail.com');
      expect(res).toEqual({ success: true });
      expect(propertiesMap.has('prop-del-2')).toBe(false);
    });

    it('rejects deletion when unauthorized', async () => {
      propertiesMap.set('prop-del-3', {
        id: 'prop-del-3',
        userId: 'owner-uid',
        ownerEmail: 'owner@test.com',
      });

      await expect(
        service.remove('prop-del-3', 'stranger-uid', 'stranger@other.com')
      ).rejects.toThrow(NotFoundException);

      expect(propertiesMap.has('prop-del-3')).toBe(true);
    });
  });

  describe('findAllByUser multi-field query', () => {
    it('finds properties across userId, landlordId, ownerEmail, and landlordEmail', async () => {
      propertiesMap.set('p1', { id: 'p1', userId: 'user-xyz' });
      propertiesMap.set('p2', { id: 'p2', landlordId: 'user-xyz' });
      propertiesMap.set('p3', { id: 'p3', ownerEmail: 'user@xyz.co' });
      propertiesMap.set('p4', { id: 'p4', landlordEmail: 'user@xyz.co' });
      propertiesMap.set('p5', { id: 'p5', userId: 'unrelated' });

      const found = await service.findAllByUser('user-xyz', 'user@xyz.co');
      expect(found).toHaveLength(4);
      const ids = found.map(p => p.id);
      expect(ids).toContain('p1');
      expect(ids).toContain('p2');
      expect(ids).toContain('p3');
      expect(ids).toContain('p4');
      expect(ids).not.toContain('p5');
    });
  });
});
