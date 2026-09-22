export type MockTestRole = 'tenant' | 'landlord' | 'agent';

export interface MockTestUserProfile {
  name: string;
  givenName: string;
  familyName: string;
  email: string;
  role: MockTestRole;
  phone?: string;
}

export const MOCK_TEST_USERS: Record<string, MockTestUserProfile> = {
  'tenant-test-001': {
    name: 'Sarah Jones',
    givenName: 'Sarah',
    familyName: 'Jones',
    email: 'tenant@test.proptii.co',
    role: 'tenant',
  },
  'tenant-test-002': {
    name: 'Emily Davis',
    givenName: 'Emily',
    familyName: 'Davis',
    email: 'tenant-two@test.proptii.co',
    role: 'tenant',
  },
  'landlord-test-001': {
    name: 'John Smith',
    givenName: 'John',
    familyName: 'Smith',
    email: 'landlord@test.proptii.co',
    role: 'landlord',
  },
  'landlord-test-002': {
    name: 'Jack Smith',
    givenName: 'Jack',
    familyName: 'Smith',
    email: 'landlord-two@test.proptii.co',
    role: 'landlord',
  },
  'agent-test-001': {
    name: 'Olivia Bennett',
    givenName: 'Olivia',
    familyName: 'Bennett',
    email: 'agent@test.proptii.co',
    role: 'agent',
    phone: '+44 161 496 0123',
  },
};

export function mockRoleFromId(id: string): MockTestRole {
  if (id.startsWith('agent-')) return 'agent';
  if (id.startsWith('landlord-')) return 'landlord';
  return 'tenant';
}

export function resolveMockTestUser(id: string): MockTestUserProfile & { id: string } {
  const profile = MOCK_TEST_USERS[id];
  const role = profile?.role ?? mockRoleFromId(id);
  return {
    id,
    name: profile?.name ?? `Test ${role}`,
    givenName: profile?.givenName ?? 'Test',
    familyName: profile?.familyName ?? role,
    email: profile?.email ?? `${role}@test.proptii.co`,
    role,
    phone: profile?.phone,
  };
}

export function isMockTestUserId(id?: string | null): boolean {
  const value = id || '';
  return (
    value.startsWith('landlord-test-') ||
    value.startsWith('tenant-test-') ||
    value.startsWith('agent-test-')
  );
}
