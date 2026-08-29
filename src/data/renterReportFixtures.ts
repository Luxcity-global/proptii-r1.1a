import type { FactFlag, ReportSource, RenterReportContent } from '../types/govData';

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

export const DEFAULT_EMBED_QUERY = '';

export const DEFAULT_PRECISION_LINE =
  'Location checks use the postcode area, not the building footprint.';

export const defaultRenterContent = (facts?: FactFlag[] | null): RenterReportContent => {
  const epcDetail =
    facts?.find((f) => f.id === 'epc')?.detail ||
    'Data unresolved — register did not return a value for this module.';

  return {
    precisionLine: DEFAULT_PRECISION_LINE,
    whatToWatchTitle: 'What to watch',
    whatToWatchBody:
      'Statutory and open government checks evaluated. Title register and covenant checks are pending live Land Registry integration.',
    partATitle: 'Financial & Transactional Terms',
    partARows: [],
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
    localArea: [],
    paidCopy: 'Deeper legal, compliance & professional checks — paid, coming later in this journey',
    mapSource: '',
    steps: [
      'Request written landlord pet policy consent before contract signing.',
      'Verify deposit is protected in a government-authorized tenancy deposit scheme (TDS).',
      'Review inventory check-in report against existing exterior fixtures.',
    ],
    footerAudience: 'Generated for a prospective renter. Not a substitute for legal advice.',
  };
};
