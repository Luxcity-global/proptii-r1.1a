import type { FactFlag, ReportSource, RenterReportContent } from '../types/govData';

/** Demo diagnostic steps when Nest is offline or `sources[]` is empty. */
export const DEFAULT_REPORT_SOURCES: ReportSource[] = [
  {
    id: 'listing-terms',
    title: 'Reading listing financial & transactional terms',
    detail: 'Asking rent, deposit scheme, and council tax as listed by the agent...',
  },
  {
    id: 'epc',
    title: 'Validating National EPC Register & MEES Benchmarks',
    detail: 'Cross-referencing thermal efficiency ratings and estimated running costs...',
  },
  {
    id: 'postcode',
    title: 'Resolving postcode centroid via postcodes.io',
    detail: 'Location checks use the postcode area, not the building footprint. UPRN pending...',
  },
  {
    id: 'local-area',
    title: 'Correlating flood, crime and heritage open data',
    detail: 'EA flood CSV, police.uk, and Historic England NHLE at the postcode centroid...',
  },
  {
    id: 'lens',
    title: 'Structuring Intelligence for Audience Lens',
    detail: 'Applying statutory rights, compliance rules, and recommended action steps...',
  },
];

export const DEFAULT_EMBED_QUERY = 'Falcon Road, Clapham Junction, London SW11 2LN';

export const DEFAULT_PRECISION_LINE =
  'Location checks use the postcode area, not the building footprint.';

export const defaultRenterContent = (facts?: FactFlag[] | null): RenterReportContent => {
  const epcDetail =
    facts?.find((f) => f.id === 'epc')?.detail ||
    'Current EPC rating is Band C (69). Compliant with MEES standards with estimated bills ~£85/mo.';

  return {
    precisionLine: DEFAULT_PRECISION_LINE,
    whatToWatchTitle: 'What to watch',
    whatToWatchBody:
      'A conservation area designation applies near this postcode, which may restrict exterior changes. Title register and covenant checks are not in this report — see Part C. Flood and crime context at this postcode are clear.',
    partATitle: 'Financial & Transactional Terms',
    partARows: [
      { label: 'Price / Rent', value: '£2,150 pcm' },
      { label: 'Council Tax Band', value: 'Band C', qualifier: 'as listed by agent' },
      { label: 'Tenure / Term', value: 'Residential Tenancy / Freehold' },
      { label: 'Deposit', value: '5 Weeks (£2,480.76)', qualifier: 'TDS Protected' },
    ],
    partANote: 'Asking rent and terms from the listing. Sold-price history is not shown on a renter report.',
    partASource: 'Listing agent',
    partBTitle: 'Utilities & EPC',
    partBBody: epcDetail,
    partBSource: 'MHCLG National EPC Register',
    partCTitle: 'Restrictive Covenants & Title',
    partCBody:
      'Title register and covenant text are not in this report. Heritage and conservation below still apply.',
    partCStatus: 'To come in next release',
    partCSource: 'pending — HM Land Registry title register (not yet accessible)',
    localIntro: 'All three checks below are evaluated at the postcode centroid, not the exact building.',
    localArea: [
      {
        id: 'flood-risk',
        title: 'Flood Risk',
        status: 'Clear',
        tone: 'resolved',
        surface: 'seal',
        finding: 'Very low risk from rivers/sea; low risk of surface water',
        source: 'EA flood CSV (OGL)',
      },
      {
        id: 'crime-safety',
        title: 'Crime & Safety',
        status: 'Average',
        tone: 'resolved',
        surface: 'ink',
        finding: '12 crimes within 0.25mi last month, in line with Wandsworth average',
        source: 'police.uk (Home Office)',
      },
      {
        id: 'heritage-conservation',
        title: 'Heritage & Conservation',
        status: 'Note',
        tone: 'note',
        surface: 'stamp',
        finding:
          'Not individually listed; sits in the Latchmere Conservation Area — exterior work typically needs consent, independent of any lease terms',
        source: 'Planning Data / Historic England NHLE',
      },
    ],
    paidCopy: 'Deeper legal, compliance & professional checks — paid, coming later in this journey',
    mapSource: '',
    steps: [
      'Request written landlord pet policy consent before contract signing.',
      'Verify deposit is protected in a government-authorized tenancy deposit scheme (TDS).',
      'Review inventory check-in report against existing exterior fixtures.',
      'Check with the local authority conservation team before any exterior change — title and covenant checks come in a later release.',
    ],
    footerAudience: 'Generated for a prospective renter. Not a substitute for legal advice.',
  };
};
