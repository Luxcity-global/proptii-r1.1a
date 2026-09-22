import type { Contract } from '../components/ContractsPage';

export const LANDLORD_TWO_TEST_ID = 'landlord-test-002';
export const LANDLORD_TWO_TEST_EMAIL = 'landlord-two@test.proptii.co';

const DUMMY_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export function isLandlordTwoTestAccount(userId?: string | null, email?: string | null): boolean {
  const id = (userId || '').trim();
  const mail = (email || '').trim().toLowerCase();
  return id === LANDLORD_TWO_TEST_ID || mail === LANDLORD_TWO_TEST_EMAIL;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/** Demo rows for Jack Smith (Landlord 2) so the Contracts table is populated in local testing. */
export function getLandlordTwoDummyContracts(): Contract[] {
  return [
    {
      id: 'll2-contract-sent-1',
      title: 'Assured Shorthold Tenancy — Maple Court',
      propertyAddress: '12 Maple Court, Unit 4, Manchester, M1 4AB',
      tenantName: 'Aisha Khan',
      tenantEmail: 'aisha.khan@example.com',
      status: 'sent',
      sentDate: daysFromNow(-12),
      expiryDate: daysFromNow(320),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Maple-Court-Aisha-Khan.pdf',
    },
    {
      id: 'll2-contract-sent-2',
      title: 'Deposit Protection Certificate — King Street',
      propertyAddress: '24 King Street, Bristol, BS1 2NY',
      tenantName: 'Priya Patel',
      tenantEmail: 'priya.patel@example.com',
      status: 'sent',
      sentDate: daysFromNow(-6),
      expiryDate: daysFromNow(350),
      contractType: 'deposit-certificate',
      fileUrl: DUMMY_PDF,
      fileName: 'DPC-King-Street-Priya-Patel.pdf',
    },
    {
      id: 'll2-contract-sent-3',
      title: 'Assured Shorthold Tenancy — Harbour View',
      propertyAddress: '3 Harbour View, Liverpool, L1 8JQ',
      tenantName: 'Tom Bradley',
      tenantEmail: 'tom.bradley@example.com',
      status: 'sent',
      sentDate: daysFromNow(-3),
      expiryDate: daysFromNow(5),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Harbour-View-Tom-Bradley.pdf',
    },
    {
      id: 'll2-contract-unsigned-1',
      title: 'Assured Shorthold Tenancy — Victoria Road',
      propertyAddress: '8 Victoria Road, Flat 2, Leeds, LS1 6DW',
      tenantName: 'James Okafor',
      tenantEmail: 'james.okafor@example.com',
      status: 'unsigned',
      sentDate: daysFromNow(-18),
      expiryDate: daysFromNow(4),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Victoria-Road-James-Okafor.pdf',
    },
    {
      id: 'll2-contract-unsigned-2',
      title: 'Right to Rent Checklist — Queen Street',
      propertyAddress: '19 Queen Street, York, YO1 8QN',
      tenantName: 'Sophie Chen',
      tenantEmail: 'sophie.chen@example.com',
      status: 'unsigned',
      sentDate: daysFromNow(-9),
      expiryDate: daysFromNow(40),
      contractType: 'right-to-rent',
      fileUrl: DUMMY_PDF,
      fileName: 'RTR-Queen-Street-Sophie-Chen.pdf',
    },
    {
      id: 'll2-contract-unsigned-3',
      title: 'Assured Shorthold Tenancy — Park Lane',
      propertyAddress: '7 Park Lane, Nottingham, NG1 5DU',
      tenantName: 'Emma Collins',
      tenantEmail: 'emma.collins@example.com',
      status: 'unsigned',
      sentDate: daysFromNow(-4),
      expiryDate: daysFromNow(280),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Park-Lane-Emma-Collins.pdf',
    },
    {
      id: 'll2-contract-signed-1',
      title: 'Assured Shorthold Tenancy — Elm Avenue',
      propertyAddress: '45 Elm Avenue, Sheffield, S1 2HE',
      tenantName: 'Daniel Wright',
      tenantEmail: 'daniel.wright@example.com',
      status: 'signed',
      sentDate: daysFromNow(-60),
      signedDate: daysFromNow(-52),
      expiryDate: daysFromNow(280),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-Elm-Avenue-Daniel-Wright.pdf',
    },
    {
      id: 'll2-contract-signed-2',
      title: 'House Share Agreement — Chapel Street',
      propertyAddress: '2 Chapel Street, Newcastle, NE1 5HH',
      tenantName: 'Marcus Reid',
      tenantEmail: 'marcus.reid@example.com',
      status: 'signed',
      sentDate: daysFromNow(-40),
      signedDate: daysFromNow(-33),
      expiryDate: daysFromNow(200),
      contractType: 'other',
      fileUrl: DUMMY_PDF,
      fileName: 'Share-Chapel-Street-Marcus-Reid.pdf',
    },
    {
      id: 'll2-contract-signed-3',
      title: 'Assured Shorthold Tenancy — King Street',
      propertyAddress: '24 King Street, Bristol, BS1 2NY',
      tenantName: 'Priya Patel',
      tenantEmail: 'priya.patel@example.com',
      status: 'signed',
      sentDate: daysFromNow(-380),
      signedDate: daysFromNow(-372),
      expiryDate: daysFromNow(20),
      contractType: 'tenancy-agreement',
      fileUrl: DUMMY_PDF,
      fileName: 'AST-King-Street-Priya-Patel-renewal.pdf',
    },
  ];
}
