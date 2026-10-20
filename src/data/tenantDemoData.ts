import type { ViewingBooking } from '../services/viewingService';
import type { SignedContractData } from '../services/signedContractsFirestoreService';
import type { SavedProperty } from '../contexts/SavedPropertiesContext';

const TENANT_ID = 'tenant-test-001';
const TENANT_NAME = 'Sarah Jones';
const TENANT_EMAIL = 'tenant@test.proptii.co';
const TENANT_PHONE = '+44 7700 900321';
const DEMO_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const VIEWING_PREFIX = 'tenant-demo-vw-';
const CONTRACT_PREFIX = 'tenant-demo-ct-';
const SAVED_PREFIX = 'tenant-demo-saved-';

/** True only while signed in through Dev Login as Sarah Jones. */
export function isTenantDemoSession(): boolean {
  try {
    return localStorage.getItem('mock_token') === `mock-token-${TENANT_ID}`;
  } catch {
    return false;
  }
}

export const isTenantDemoViewing = (id?: string | null) => Boolean(id?.startsWith(VIEWING_PREFIX));
export const isTenantDemoContract = (id?: string | null) => Boolean(id?.startsWith(CONTRACT_PREFIX));
export const isTenantDemoSavedProperty = (id?: string | null) => Boolean(id?.startsWith(SAVED_PREFIX));

const dayOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const OLIVIA = {
  id: 'agent-test-001',
  name: 'Olivia Bennett',
  email: 'agent@test.proptii.co',
  phone: '+44 161 496 0123',
  company: 'Bennett & Co Lettings',
};
const JOHN = {
  id: 'landlord-test-001',
  name: 'John Smith',
  email: 'landlord@test.proptii.co',
  phone: '+44 20 7946 0011',
  company: 'Smith Property Lettings',
};

function viewing(
  key: string,
  status: ViewingBooking['status'],
  days: number,
  time: string,
  place: { street: string; town: string; city: string; postcode: string; propertyId: string },
  agent: typeof OLIVIA,
  extra: Partial<ViewingBooking> = {},
): ViewingBooking {
  const created = dayOffset(Math.min(days, 0) - 5).toISOString();
  return {
    id: `${VIEWING_PREFIX}${key}`,
    userId: TENANT_ID,
    propertyId: place.propertyId,
    agentId: agent.id,
    agentEmail: agent.email,
    property: {
      street: place.street,
      town: place.town,
      city: place.city,
      postcode: place.postcode,
      agent,
    },
    viewingDetails: {
      date: ymd(dayOffset(days)),
      time,
      preference: 'In-Person Viewing',
      userDetails: { fullName: TENANT_NAME, email: TENANT_EMAIL, phoneNumber: TENANT_PHONE },
    },
    status,
    createdAt: created,
    updatedAt: created,
    ...extra,
  };
}

const KING = { street: '8 King Street, Flat 12', town: 'Manchester', city: 'Manchester', postcode: 'M2 6AQ', propertyId: 'agent-prop-king' };
const QUAY = { street: '6 Quay Street', town: 'Salford', city: 'Manchester', postcode: 'M3 5FZ', propertyId: 'agent-prop-quay' };
const NORTHERN = { street: '19 Stevenson Square', town: 'Northern Quarter', city: 'Manchester', postcode: 'M1 1FB', propertyId: 'agent-prop-northern' };
const ANCOATS = { street: '3 Cotton Field Wharf', town: 'Ancoats', city: 'Manchester', postcode: 'M4 6DL', propertyId: 'landlord-prop-ancoats' };
const OXFORD = { street: '27 Oxford Road, Flat 4', town: 'Manchester', city: 'Manchester', postcode: 'M1 5QA', propertyId: 'landlord-prop-oxford' };

let viewings: ViewingBooking[] | null = null;

function viewingStore(): ViewingBooking[] {
  if (!viewings) {
    viewings = [
      viewing('king', 'confirmed', 2, '10:30', KING, OLIVIA, { notes: 'Bring photo ID. Concierge will let you in.' }),
      viewing('ancoats', 'pending', 5, '17:30', ANCOATS, JOHN),
      viewing('quay', 'rescheduled', 8, '12:00', QUAY, OLIVIA, { notes: 'Agent moved this from Tuesday to the following week.' }),
      viewing('northern', 'pending', 12, '14:00', NORTHERN, OLIVIA),
      viewing('oxford', 'completed', -9, '11:00', OXFORD, JOHN, { notes: 'Loved the natural light. Applied the same day.' }),
      viewing('deansgate', 'completed', -21, '16:00', { ...KING, street: '14 Deansgate, Apt 3', postcode: 'M3 1AZ', propertyId: 'agent-prop-deansgate' }, OLIVIA),
      viewing('chorlton', 'cancelled', -4, '09:30', { street: '41 Chorlton Green', town: 'Manchester', city: 'Manchester', postcode: 'M21 9HS', propertyId: 'agent-prop-chorlton' }, OLIVIA, { notes: 'Cancelled by Sarah after securing Oxford Road.' }),
    ];
  }
  return viewings;
}

export function getTenantDemoViewings(): ViewingBooking[] {
  return viewingStore().map((v) => ({ ...v, viewingDetails: { ...v.viewingDetails } }));
}

export function updateTenantDemoViewing(
  id: string,
  status: ViewingBooking['status'],
  details?: ViewingBooking['viewingDetails'],
): void {
  const item = viewingStore().find((v) => v.id === id);
  if (!item) return;
  item.status = status;
  item.updatedAt = new Date().toISOString();
  if (details) item.viewingDetails = { ...details };
}

export function removeTenantDemoViewing(id: string): void {
  viewings = viewingStore().filter((v) => v.id !== id);
}

function contract(
  key: string,
  status: SignedContractData['status'],
  days: number,
  fields: { name: string; template: string; property: string; address: string; party: typeof OLIVIA; size: number },
): SignedContractData {
  const at = dayOffset(days);
  return {
    id: `${CONTRACT_PREFIX}${key}`,
    userId: TENANT_ID,
    templateId: `tpl-${key}`,
    templateName: fields.template,
    propertyName: fields.property,
    propertyAddress: fields.address,
    agentName: fields.party.name,
    agentEmail: fields.party.email,
    tenantName: TENANT_NAME,
    tenantEmail: TENANT_EMAIL,
    signedDate: at.toISOString(),
    documentUrl: DEMO_PDF,
    documentName: fields.name,
    documentSize: fields.size,
    documentType: 'application/pdf',
    status,
    emailSent: true,
    emailSentDate: at.toISOString(),
    createdAt: at,
    updatedAt: at,
  };
}

let contracts: SignedContractData[] | null = null;

function contractStore(): SignedContractData[] {
  if (!contracts) {
    contracts = [
      contract('oxford-ast', 'signed', -6, {
        name: 'Oxford Road AST - 12 months.pdf',
        template: 'Assured Shorthold Tenancy (12 months)',
        property: '27 Oxford Road, Flat 4',
        address: '27 Oxford Road, Flat 4, Manchester, M1 5QA',
        party: JOHN,
        size: 248_000,
      }),
      contract('oxford-inventory', 'signed', -5, {
        name: 'Oxford Road inventory and schedule of condition.pdf',
        template: 'Inventory & Check-in Report',
        property: '27 Oxford Road, Flat 4',
        address: '27 Oxford Road, Flat 4, Manchester, M1 5QA',
        party: JOHN,
        size: 1_420_000,
      }),
      contract('oxford-deposit', 'signed', -5, {
        name: 'Deposit protection certificate (DPS).pdf',
        template: 'Deposit Protection Certificate',
        property: '27 Oxford Road, Flat 4',
        address: '27 Oxford Road, Flat 4, Manchester, M1 5QA',
        party: JOHN,
        size: 96_000,
      }),
      contract('oxford-pets', 'sent', -1, {
        name: 'Pet addendum - small dog.pdf',
        template: 'Pet Clause Addendum',
        property: '27 Oxford Road, Flat 4',
        address: '27 Oxford Road, Flat 4, Manchester, M1 5QA',
        party: JOHN,
        size: 64_000,
      }),
      contract('king-holding', 'sent', -2, {
        name: 'King Street holding deposit agreement.pdf',
        template: 'Holding Deposit Agreement',
        property: '8 King Street, Flat 12',
        address: '8 King Street, Flat 12, Manchester, M2 6AQ',
        party: OLIVIA,
        size: 112_000,
      }),
      contract('deansgate-old', 'signed', -400, {
        name: 'Deansgate tenancy 2025 (ended).pdf',
        template: 'Assured Shorthold Tenancy (12 months)',
        property: '14 Deansgate, Apt 3',
        address: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
        party: OLIVIA,
        size: 231_000,
      }),
    ];
  }
  return contracts;
}

export function getTenantDemoContracts(): SignedContractData[] {
  return contractStore().map((c) => ({ ...c }));
}

export function getTenantDemoContract(id: string): SignedContractData | undefined {
  const found = contractStore().find((c) => c.id === id);
  return found ? { ...found } : undefined;
}

export function removeTenantDemoContract(id: string): void {
  contracts = contractStore().filter((c) => c.id !== id);
}

const img = (photo: string) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=70`;

export function getTenantDemoSavedProperties(): SavedProperty[] {
  return [
    {
      id: `${SAVED_PREFIX}king`,
      title: '1 bed apartment, 8 King Street',
      price: '£1,395 pcm',
      location: 'King Street, Manchester M2 6AQ',
      bedrooms: '1',
      bathrooms: 1,
      squareFootage: '540 sq ft',
      propertyType: 'Flat',
      amenities: ['Concierge', 'Lift', 'Balcony'],
      imageUrls: [img('photo-1522708323590-d24dbb6b0267'), img('photo-1502672260266-1c1ef2d93688')],
      agent: { ...OLIVIA },
      source: 'Proptii',
      description: 'Bright top-floor flat with skyline views, two minutes from St Ann\'s Square.',
      savedAt: dayOffset(-3).toISOString(),
    },
    {
      id: `${SAVED_PREFIX}ancoats`,
      title: '2 bed loft, Cotton Field Wharf',
      price: '£1,750 pcm',
      location: 'Ancoats, Manchester M4 6DL',
      bedrooms: '2',
      bathrooms: 2,
      squareFootage: '820 sq ft',
      propertyType: 'Apartment',
      amenities: ['Canal view', 'Bike store', 'Gym'],
      imageUrls: [img('photo-1493809842364-78817add7ffb'), img('photo-1484154218962-a197022b5858')],
      agent: { ...JOHN },
      source: 'Proptii',
      description: 'Converted mill loft overlooking the marina with exposed brick and high ceilings.',
      savedAt: dayOffset(-6).toISOString(),
    },
    {
      id: `${SAVED_PREFIX}didsbury`,
      title: '3 bed terrace, Fog Lane',
      price: '£2,100 pcm',
      location: 'Didsbury, Manchester M20 6AS',
      bedrooms: '3',
      bathrooms: 1,
      squareFootage: '1,050 sq ft',
      propertyType: 'House',
      amenities: ['Garden', 'Parking', 'Pets considered'],
      imageUrls: [img('photo-1568605114967-8130f3a36994')],
      agent: { name: 'Hannah Price', email: 'hannah@didsburylets.example', company: 'Didsbury Lets' },
      source: 'Rightmove',
      description: 'Victorian terrace with a south-facing garden, close to Fog Lane Park.',
      savedAt: dayOffset(-10).toISOString(),
    },
    {
      id: `${SAVED_PREFIX}salford`,
      title: 'Studio, MediaCityUK',
      price: '£1,050 pcm',
      location: 'Salford Quays M50 2EQ',
      bedrooms: 'Studio',
      bathrooms: 1,
      squareFootage: '410 sq ft',
      propertyType: 'Studio',
      amenities: ['Furnished', 'Bills included'],
      imageUrls: [img('photo-1505691938895-1758d7feb511')],
      agent: { ...OLIVIA },
      source: 'Proptii',
      description: 'Furnished studio on the quays with bills included and a tram stop outside.',
      savedAt: dayOffset(-14).toISOString(),
    },
  ];
}
