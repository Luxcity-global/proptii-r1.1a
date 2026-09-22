import type { Property, Tenant, CompanyProfile } from '../App';
import type { Contract } from '../components/ContractsPage';
import type { Landlord } from '../hooks/useLandlords';

export const AGENT_TEST_ID = 'agent-test-001';
export const AGENT_TEST_EMAIL = 'agent@test.proptii.co';
export const AGENT_TEST_COMPANY = 'Bennett & Co Lettings';
export const AGENT_TEST_PHONE = '+44 161 496 0123';

export const AGENT_TEST_COMPANY_PROFILE: CompanyProfile = {
  companyName: AGENT_TEST_COMPANY,
  companyDescription: 'Independent letting agency covering Greater Manchester and the North West.',
  website: 'https://bennettandco.example',
  officeAddress: '42 King Street, Manchester, M2 6AY',
  officePhone: AGENT_TEST_PHONE,
  officeEmail: AGENT_TEST_EMAIL,
};

const DUMMY_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export function isAgentTestAccount(userId?: string | null, email?: string | null): boolean {
  const id = (userId || '').trim();
  const mail = (email || '').trim().toLowerCase();
  return id === AGENT_TEST_ID || mail === AGENT_TEST_EMAIL;
}

export function mergeById<T extends { id: string }>(dummy: T[], live: T[]): T[] {
  const byId = new Map(dummy.map((item) => [item.id, item]));
  live.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values());
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function coverPhoto(id: string, url: string, filename: string) {
  return [{ id, url, filename, isCover: true }];
}

const PHOTO = {
  deansgate: '/assets/add_prp_slide/pexels-heyho-6077368.png',
  wilmslow: '/assets/add_prp_slide/pexels-lebele-11935244.png',
  king: '/assets/add_prp_slide/pexels-naimbic-2030037.png',
  chorlton: '/assets/add_prp_slide/chalcot-square-london-uk-march-people-enjoy-sun-gardens-surrounded-colorful-italianate-terraced-houses-greater-area-214905146.png',
  quay: '/assets/add_prp_slide/viewSourceImage-39-1-scaled.png',
  northern: '/assets/add_prp_slide/iStock-1974859701-1-scaled.png',
};

/** Demo landlords for Olivia Bennett so the Clients Landlords tab is populated. */
export function getAgentDummyLandlords(): Landlord[] {
  return [
    {
      id: 'agent-ll-whitaker',
      name: 'James Whitaker',
      email: 'james.whitaker@example.com',
      phone: '+44 7700 900111',
      initials: 'JW',
      propertyCount: 3,
      activeTenants: 2,
      totalValue: '£1,240,000',
      status: 'Active',
      lastActive: 'Yesterday',
      joinDate: '12 Mar 2022',
      notes: 'Prefers quarterly statements. Portfolio concentrated around Deansgate and Didsbury.',
    },
    {
      id: 'agent-ll-ellis',
      name: 'Nora Ellis',
      email: 'nora.ellis@example.com',
      phone: '+44 7700 900222',
      initials: 'NE',
      propertyCount: 2,
      activeTenants: 2,
      totalValue: '£780,000',
      status: 'Active',
      lastActive: '3 days ago',
      joinDate: '4 Sep 2023',
      notes: 'Hands-off landlord. Happy for Bennett & Co to instruct contractors under £500.',
    },
    {
      id: 'agent-ll-okonkwo',
      name: 'David Okonkwo',
      email: 'david.okonkwo@example.com',
      phone: '+44 7700 900333',
      initials: 'DO',
      propertyCount: 1,
      activeTenants: 1,
      totalValue: '£265,000',
      status: 'Pending',
      lastActive: 'Last week',
      joinDate: '18 Jan 2026',
      notes: 'New instruction. AML pack outstanding before the first disbursement.',
    },
  ];
}

/** Demo tenants managed by Bennett & Co Lettings. */
export function getAgentDummyTenants(): Tenant[] {
  return [
    {
      id: 'agent-tn-aisha',
      name: 'Aisha Khan',
      email: 'aisha.khan@example.com',
      phone: '+44 7700 900441',
      propertyAddress: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
      propertyId: 'agent-prop-deansgate',
      rentAmount: 1450,
      leaseStart: daysFromNow(-210),
      leaseEnd: daysFromNow(155),
      status: 'active',
      referencingStatus: 'complete',
      paymentStatus: 'current',
      paymentFrequency: 'monthly',
      lastPaymentDate: daysFromNow(-12),
      emergencyContact: { name: 'Imran Khan', relationship: 'Spouse', phone: '+44 7700 900551' },
      notes: 'Reliable tenant. Prefers WhatsApp for maintenance and pays by standing order.',
    },
    {
      id: 'agent-tn-tom',
      name: 'Tom Bradley',
      email: 'tom.bradley@example.com',
      phone: '+44 7700 900442',
      propertyAddress: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
      propertyId: 'agent-prop-wilmslow',
      rentAmount: 1850,
      leaseStart: daysFromNow(-400),
      leaseEnd: daysFromNow(18),
      status: 'active',
      referencingStatus: 'in-progress',
      paymentStatus: 'overdue',
      paymentFrequency: 'monthly',
      lastPaymentDate: daysFromNow(-41),
      overdueAmount: 1850,
      emergencyContact: { name: 'Helen Bradley', relationship: 'Mother', phone: '+44 7700 900552' },
      notes: 'Chasing September rent. Tenant asked for a short payment plan while changing jobs.',
    },
    {
      id: 'agent-tn-priya',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+44 7700 900443',
      propertyAddress: '41 Chorlton Green, Manchester, M21 9HS',
      propertyId: 'agent-prop-chorlton',
      rentAmount: 1350,
      leaseStart: daysFromNow(-90),
      leaseEnd: daysFromNow(275),
      status: 'active',
      referencingStatus: 'complete',
      paymentStatus: 'current',
      paymentFrequency: 'monthly',
      lastPaymentDate: daysFromNow(-8),
      emergencyContact: { name: 'Raj Patel', relationship: 'Brother', phone: '+44 7700 900553' },
      notes: 'Quiet tenancy. Interested in renewing at the same rent next spring.',
    },
    {
      id: 'agent-tn-marcus',
      name: 'Marcus Reid',
      email: 'marcus.reid@example.com',
      phone: '+44 7700 900444',
      propertyAddress: '6 Quay Street, Salford, M3 5FZ',
      propertyId: 'agent-prop-quay',
      rentAmount: 1280,
      leaseStart: daysFromNow(12),
      leaseEnd: daysFromNow(377),
      status: 'pending',
      referencingStatus: 'not-started',
      paymentStatus: 'current',
      paymentFrequency: 'monthly',
      emergencyContact: { name: 'Chloe Reid', relationship: 'Partner', phone: '+44 7700 900554' },
      notes: 'Move-in scheduled. Referencing not started — send pack before keys are released.',
    },
    {
      id: 'agent-tn-sophie',
      name: 'Sophie Chen',
      email: 'sophie.chen@example.com',
      phone: '+44 7700 900445',
      propertyAddress: '19 Stevenson Square, Northern Quarter, Manchester, M1 1FB',
      propertyId: 'agent-prop-northern',
      rentAmount: 995,
      leaseStart: daysFromNow(-60),
      leaseEnd: daysFromNow(70),
      status: 'active',
      referencingStatus: 'complete',
      paymentStatus: 'payment-plan',
      paymentFrequency: 'monthly',
      lastPaymentDate: daysFromNow(-20),
      overdueAmount: 420,
      emergencyContact: { name: 'David Chen', relationship: 'Father', phone: '+44 7700 900555' },
      notes: 'On a payment plan for remaining arrears. Check-in due at the end of the month.',
    },
  ];
}

/** Demo stock for the agent dashboard, Properties, and Clients. */
export function getAgentDummyProperties(): Property[] {
  const tenants = getAgentDummyTenants();
  const byPropertyId = new Map(tenants.map((tenant) => [tenant.propertyId, tenant]));

  const base: Property[] = [
    {
      id: 'agent-prop-deansgate',
      address: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
      type: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      rent: 1450,
      status: 'occupied',
      amenities: ['Furnished', 'Lift', 'City centre'],
      notes: 'Managed for James Whitaker. Popular with young professionals.',
      photos: coverPhoto('agent-photo-deansgate', PHOTO.deansgate, 'deansgate.jpg'),
      documents: [],
      createdAt: daysFromNow(-400),
      tenantId: 'agent-tn-aisha',
    },
    {
      id: 'agent-prop-wilmslow',
      address: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
      type: 'Terraced house',
      bedrooms: 3,
      bathrooms: 2,
      rent: 1850,
      status: 'occupied',
      amenities: ['Garden', 'Parking', 'Unfurnished'],
      notes: 'Managed for James Whitaker. Lease ending soon.',
      photos: coverPhoto('agent-photo-wilmslow', PHOTO.wilmslow, 'wilmslow.jpg'),
      documents: [],
      createdAt: daysFromNow(-520),
      tenantId: 'agent-tn-tom',
    },
    {
      id: 'agent-prop-king',
      address: '8 King Street, Flat 12, Manchester, M2 6AQ',
      type: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      rent: 1100,
      status: 'vacant',
      amenities: ['Furnished', 'Concierge'],
      notes: 'Managed for James Whitaker. Ready to let.',
      photos: coverPhoto('agent-photo-king', PHOTO.king, 'king-street.jpg'),
      documents: [],
      createdAt: daysFromNow(-180),
    },
    {
      id: 'agent-prop-chorlton',
      address: '41 Chorlton Green, Manchester, M21 9HS',
      type: 'Semi-detached',
      bedrooms: 2,
      bathrooms: 1,
      rent: 1350,
      status: 'occupied',
      amenities: ['Garden', 'Pets considered'],
      notes: 'Managed for Nora Ellis.',
      photos: coverPhoto('agent-photo-chorlton', PHOTO.chorlton, 'chorlton.jpg'),
      documents: [],
      createdAt: daysFromNow(-260),
      tenantId: 'agent-tn-priya',
    },
    {
      id: 'agent-prop-quay',
      address: '6 Quay Street, Salford, M3 5FZ',
      type: 'Apartment',
      bedrooms: 2,
      bathrooms: 2,
      rent: 1280,
      status: 'occupied',
      amenities: ['Balcony', 'Parking'],
      notes: 'Managed for Nora Ellis. Incoming tenant pending move-in.',
      photos: coverPhoto('agent-photo-quay', PHOTO.quay, 'quay-street.jpg'),
      documents: [],
      createdAt: daysFromNow(-95),
      tenantId: 'agent-tn-marcus',
    },
    {
      id: 'agent-prop-northern',
      address: '19 Stevenson Square, Northern Quarter, Manchester, M1 1FB',
      type: 'Studio',
      bedrooms: 1,
      bathrooms: 1,
      rent: 995,
      status: 'occupied',
      amenities: ['Furnished', 'Bills included'],
      notes: 'Managed for David Okonkwo.',
      photos: coverPhoto('agent-photo-northern', PHOTO.northern, 'northern-quarter.jpg'),
      documents: [],
      createdAt: daysFromNow(-140),
      tenantId: 'agent-tn-sophie',
    },
  ];

  return base.map((property) => ({
    ...property,
    tenant: byPropertyId.get(property.id),
  }));
}

export type PassportStepStatus = 'Filled' | 'Progress Saved' | 'Not Started';

export interface PassportStep {
  step: string;
  title: string;
  status: PassportStepStatus;
  downloadUrl?: string;
}

export interface AgentDummyReceivedShare {
  id: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  notes: string;
  status: 'sent' | 'viewed' | 'claimed';
  viewToken: string;
  claimToken: string;
  expiresAt: string;
  claimedBy: string | null;
  createdAt: string;
  phone?: string;
  score?: number;
  checks: { label: string; passed: boolean }[];
  steps: PassportStep[];
}

const FILLED: PassportStepStatus = 'Filled';
const SAVED: PassportStepStatus = 'Progress Saved';
const IDLE: PassportStepStatus = 'Not Started';

function passportSteps(
  statuses: [PassportStepStatus, PassportStepStatus, PassportStepStatus, PassportStepStatus, PassportStepStatus],
): PassportStep[] {
  const titles = ['Identity', 'Employment', 'Residential History', 'Income & Financials', 'Guarantor'];
  return titles.map((title, index) => ({
    step: `Step ${index + 1} of 5`,
    title,
    status: statuses[index],
  }));
}

function atDaysAgo(days: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/** Demo received passports from the HTML mock, mapped onto Olivia Bennett's stock. */
export function getAgentDummyReceivedShares(): AgentDummyReceivedShare[] {
  return [
    {
      id: 'agent-pass-oliver',
      tenantName: 'Oliver Brooks',
      tenantEmail: 'o.brooks@gmail.com',
      propertyAddress: '8 King Street, Flat 12, Manchester, M2 6AQ',
      notes: 'This is my pasport',
      phone: '+44 7700 900144',
      score: 92,
      status: 'viewed',
      viewToken: 'agent-dummy-view-oliver',
      claimToken: 'agent-dummy-claim-oliver',
      expiresAt: daysFromNow(21).toISOString(),
      claimedBy: null,
      createdAt: atDaysAgo(0, 9, 14),
      checks: [
        { label: 'ID Verified', passed: true },
        { label: 'Credit Check', passed: true },
        { label: 'Employment', passed: true },
        { label: 'Rental History', passed: true },
      ],
      steps: passportSteps([FILLED, FILLED, FILLED, FILLED, FILLED]),
    },
    {
      id: 'agent-pass-priya',
      tenantName: 'Priya Rajan',
      tenantEmail: 'priya.r@outlook.com',
      propertyAddress: '41 Chorlton Green, Manchester, M21 9HS',
      notes: 'All references confirmed with current employer.',
      phone: '+44 7700 900145',
      score: 78,
      status: 'viewed',
      viewToken: 'agent-dummy-view-priya',
      claimToken: 'agent-dummy-claim-priya',
      expiresAt: daysFromNow(18).toISOString(),
      claimedBy: null,
      createdAt: atDaysAgo(1, 15, 40),
      checks: [
        { label: 'ID Verified', passed: true },
        { label: 'Credit Check', passed: true },
        { label: 'Employment', passed: true },
        { label: 'Rental History', passed: true },
      ],
      steps: passportSteps([FILLED, FILLED, FILLED, SAVED, FILLED]),
    },
    {
      id: 'agent-pass-tom',
      tenantName: 'Tom Mitchell',
      tenantEmail: 'tmitchell@domain.com',
      propertyAddress: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
      notes: 'Awaiting final residential landlord reference confirmation.',
      phone: '+44 7700 900146',
      score: 51,
      status: 'sent',
      viewToken: 'agent-dummy-view-tom',
      claimToken: 'agent-dummy-claim-tom',
      expiresAt: daysFromNow(12).toISOString(),
      claimedBy: null,
      createdAt: atDaysAgo(2, 11, 5),
      checks: [
        { label: 'ID Verified', passed: true },
        { label: 'Credit Check', passed: false },
        { label: 'Employment', passed: true },
        { label: 'Rental History', passed: false },
      ],
      steps: passportSteps([FILLED, FILLED, SAVED, SAVED, IDLE]),
    },
    {
      id: 'agent-pass-aisha',
      tenantName: 'Aisha Khan',
      tenantEmail: 'aisha.khan@example.com',
      propertyAddress: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
      notes: 'Relocating for senior software engineering placement.',
      phone: '+44 7700 900441',
      score: 85,
      status: 'claimed',
      viewToken: 'agent-dummy-view-aisha',
      claimToken: 'agent-dummy-claim-aisha',
      expiresAt: daysFromNow(25).toISOString(),
      claimedBy: AGENT_TEST_ID,
      createdAt: atDaysAgo(3, 10, 22),
      checks: [
        { label: 'ID Verified', passed: true },
        { label: 'Credit Check', passed: true },
        { label: 'Employment', passed: true },
        { label: 'Rental History', passed: true },
      ],
      steps: passportSteps([FILLED, FILLED, FILLED, FILLED, FILLED]),
    },
    {
      id: 'agent-pass-luca',
      tenantName: 'Luca Ferrari',
      tenantEmail: 'luca.f@gmail.com',
      propertyAddress: '19 Stevenson Square, Northern Quarter, Manchester, M1 1FB',
      notes: 'Previous tenancy completed. Document share expired.',
      phone: '+44 7700 900148',
      score: 34,
      status: 'sent',
      viewToken: 'agent-dummy-view-luca',
      claimToken: 'agent-dummy-claim-luca',
      expiresAt: daysFromNow(-2).toISOString(),
      claimedBy: null,
      createdAt: atDaysAgo(5, 16, 8),
      checks: [
        { label: 'ID Verified', passed: false },
        { label: 'Credit Check', passed: false },
        { label: 'Employment', passed: true },
        { label: 'Rental History', passed: false },
      ],
      steps: passportSteps([SAVED, FILLED, IDLE, IDLE, IDLE]),
    },
  ];
}

/** Demo contracts so the agent Contracts page is populated in local testing. */
export function getAgentDummyContracts(): Contract[] {
  return [
    {
      id: 'agent-ct-sent-1',
      title: 'Assured Shorthold Tenancy — Deansgate',
      propertyAddress: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
      tenantName: 'Aisha Khan',
      tenantEmail: 'aisha.khan@example.com',
      status: 'sent',
      sentDate: daysFromNow(-9),
      expiryDate: daysFromNow(155),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Deansgate-Aisha-Khan.pdf',
    },
    {
      id: 'agent-ct-sent-2',
      title: 'Deposit Protection Certificate — Chorlton Green',
      propertyAddress: '41 Chorlton Green, Manchester, M21 9HS',
      tenantName: 'Priya Patel',
      tenantEmail: 'priya.patel@example.com',
      status: 'sent',
      sentDate: daysFromNow(-4),
      expiryDate: daysFromNow(275),
      contractType: 'deposit-certificate',
      fileUrl: DUMMY_PDF,
      fileName: 'DPC-Chorlton-Priya-Patel.pdf',
    },
    {
      id: 'agent-ct-unsigned-1',
      title: 'Assured Shorthold Tenancy — Quay Street',
      propertyAddress: '6 Quay Street, Salford, M3 5FZ',
      tenantName: 'Marcus Reid',
      tenantEmail: 'marcus.reid@example.com',
      status: 'unsigned',
      sentDate: daysFromNow(-6),
      expiryDate: daysFromNow(8),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Quay-Street-Marcus-Reid.pdf',
    },
    {
      id: 'agent-ct-unsigned-2',
      title: 'Right to Rent Checklist — Wilmslow Road',
      propertyAddress: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
      tenantName: 'Tom Bradley',
      tenantEmail: 'tom.bradley@example.com',
      status: 'unsigned',
      sentDate: daysFromNow(-14),
      expiryDate: daysFromNow(3),
      contractType: 'right-to-rent',
      fileUrl: DUMMY_PDF,
      fileName: 'RTR-Wilmslow-Tom-Bradley.pdf',
    },
    {
      id: 'agent-ct-signed-1',
      title: 'Assured Shorthold Tenancy — Stevenson Square',
      propertyAddress: '19 Stevenson Square, Northern Quarter, Manchester, M1 1FB',
      tenantName: 'Sophie Chen',
      tenantEmail: 'sophie.chen@example.com',
      status: 'signed',
      sentDate: daysFromNow(-70),
      signedDate: daysFromNow(-62),
      expiryDate: daysFromNow(70),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Stevenson-Sophie-Chen.pdf',
    },
    {
      id: 'agent-ct-signed-2',
      title: 'Assured Shorthold Tenancy — Wilmslow Road',
      propertyAddress: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
      tenantName: 'Tom Bradley',
      tenantEmail: 'tom.bradley@example.com',
      status: 'signed',
      sentDate: daysFromNow(-410),
      signedDate: daysFromNow(-398),
      expiryDate: daysFromNow(18),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Wilmslow-Tom-Bradley.pdf',
    },
  ];
}
