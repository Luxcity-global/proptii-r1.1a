import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ViewingRequestService } from './viewing-request.service';

const h = vi.hoisted(() => {
  const docs = new Map<string, Map<string, Record<string, any>>>();
  const bucket = (name: string) => {
    let col = docs.get(name);
    if (!col) {
      col = new Map();
      docs.set(name, col);
    }
    return col;
  };
  const readPath = (data: any, field: string) =>
    field.split('.').reduce((current, key) => current?.[key], data);
  const refFor = (col: string, id: string) => ({
    path: `${col}/${id}`,
    update: async (patch: Record<string, any>) => {
      const current = bucket(col).get(id);
      if (!current) throw new Error(`missing ${col}/${id}`);
      Object.assign(current, patch);
    },
    get: async () => {
      const data = bucket(col).get(id);
      return {
        id,
        ref: refFor(col, id),
        exists: data !== undefined,
        data: () => data,
      };
    },
  });
  const query = (name: string, filters: Array<[string, unknown]>) => {
    const api = {
      where: (field: string, _op: string, value: unknown) => query(name, [...filters, [field, value]]),
      orderBy: () => api,
      limit: () => api,
      get: async () => {
        const rows = Array.from(bucket(name).entries())
          .filter(([, data]) => filters.every(([field, value]) => readPath(data, field) === value))
          .map(([id]) => ({
            id,
            ref: refFor(name, id),
            exists: true,
            data: () => bucket(name).get(id),
          }));
        return { docs: rows, empty: rows.length === 0, forEach: (fn: (doc: any) => void) => rows.forEach(fn) };
      },
    };
    return api;
  };
  const collection = (name: string) => ({
    doc: (id: string) => refFor(name, id),
    where: (field: string, op: string, value: unknown) => query(name, [[field, value]]),
    orderBy: () => query(name, []),
    limit: () => query(name, []),
  });
  return { docs, bucket, collection };
});

vi.mock('firebase-admin', () => ({
  apps: [{ name: 'test' }],
  firestore: () => ({ collection: h.collection }),
  auth: () => ({
    getUser: async () => {
      throw new Error('missing');
    },
    getUserByEmail: async () => {
      throw new Error('missing');
    },
  }),
}));

describe('ViewingRequestService delete', () => {
  const service = new ViewingRequestService();
  const landlord = { uid: 'landlord-1', email: 'landlord@test.com', role: 'landlord' };

  beforeEach(() => {
    h.docs.clear();
  });

  it('removes an older booking stored only in viewingBookings under a different document id', async () => {
    h.bucket('viewingBookings').set('auto-doc', {
      id: 'legacy-viewing',
      landlordId: 'landlord-1',
      status: 'completed',
      propertyTitle: '14 Deansgate',
    });

    const result = await service.cancelViewing('legacy-viewing', landlord.uid, landlord);

    expect(result.success).toBe(true);
    expect(h.bucket('viewingBookings').get('auto-doc')).toMatchObject({
      deleted: true,
      status: 'cancelled',
    });
    const listed = await service.getViewingRequests(landlord.uid, 'landlord', landlord.email);
    expect(listed.map((row) => row.id)).not.toContain('legacy-viewing');
  });

  it('hides the same booking from both the current and the legacy collection', async () => {
    h.bucket('viewings').set('legacy-viewing', {
      id: 'legacy-viewing',
      landlordId: 'landlord-1',
      status: 'completed',
    });
    h.bucket('viewingBookings').set('legacy-viewing', {
      id: 'legacy-viewing',
      landlordId: 'landlord-1',
      status: 'completed',
    });

    await service.cancelViewing('legacy-viewing', landlord.uid, landlord);

    expect(h.bucket('viewings').get('legacy-viewing')?.deleted).toBe(true);
    expect(h.bucket('viewingBookings').get('legacy-viewing')?.deleted).toBe(true);
  });

  it('does not remove a viewing that belongs to someone else', async () => {
    h.bucket('viewings').set('secret', {
      id: 'secret',
      landlordId: 'someone-else',
      tenantId: 'tenant-9',
      status: 'completed',
      propertyTitle: 'Secret House',
    });

    await expect(service.cancelViewing('secret', landlord.uid, landlord)).rejects.toBeInstanceOf(ForbiddenException);
    expect(h.bucket('viewings').get('secret')?.deleted).toBeUndefined();
  });
});
