import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDocs } from 'firebase/firestore';
import { forgetViewing, listViewingsForLandlord, rememberViewings } from './viewingInboxService';

vi.mock('../config/firebaseConfig', () => ({
  auth: { currentUser: null },
  db: { kind: 'test' },
}));

vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  getDocs: vi.fn(async () => ({ docs: [] })),
}));

const oldViewing = {
  id: 'legacy-viewing',
  status: 'completed',
  landlordId: 'landlord-1',
  propertyTitle: '14 Deansgate',
  property: { street: '14 Deansgate', agent: { email: 'landlord@test.com' } },
};

describe('removing a viewing from the landlord list', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
  });

  it('does not bring a removed local copy back on the next load', async () => {
    rememberViewings([oldViewing]);
    expect((await listViewingsForLandlord({
      uid: 'landlord-1',
      email: 'landlord@test.com',
    })).map((row) => row.id)).toContain('legacy-viewing');

    forgetViewing('legacy-viewing');
    rememberViewings([oldViewing]);

    expect((await listViewingsForLandlord({
      uid: 'landlord-1',
      email: 'landlord@test.com',
    })).map((row) => row.id)).not.toContain('legacy-viewing');
  });

  it('drops a local copy when the saved booking is marked deleted', async () => {
    rememberViewings([oldViewing]);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{
        id: 'auto-doc',
        data: () => ({ ...oldViewing, deleted: true, status: 'cancelled' }),
      }],
    } as any);

    const visible = await listViewingsForLandlord({
      uid: 'landlord-1',
      email: 'landlord@test.com',
    });

    expect(visible.map((row) => row.id)).not.toContain('legacy-viewing');
  });
});
