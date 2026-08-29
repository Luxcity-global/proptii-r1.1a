import type {
  Audience,
  FactFlag,
  LocalAreaCheck,
  PropertyReportResponse,
  ReportLens,
  ReportSource,
} from '../types/govData';
import type { StreamingReportData, StreamingReportSource } from '../types/streamingReport';
import { defaultRenterContent } from '../data/renterReportFixtures';
import { mockReportLens } from '../data/reportLensFixtures';

const UNRESOLVED = 'Data unresolved — register did not return a value for this module.';

function sourceTitle(source: StreamingReportSource): string {
  return source.label?.trim() || source.id;
}

function sourceDetail(source: StreamingReportSource): string {
  if (source.state === 'loading') return 'Checking register…';
  if (source.state === 'unresolved') return 'Could not resolve from open data at this postcode.';
  return 'Register check complete.';
}

export function mapStreamingSources(sources?: StreamingReportSource[]): ReportSource[] {
  if (!sources?.length) return [];
  return sources.map((source) => ({
    id: source.id,
    title: sourceTitle(source),
    detail: sourceDetail(source),
    state: source.state,
  }));
}

function moduleTone(
  state: StreamingReportSource['state'] | undefined,
): 'resolved' | 'note' | 'pending' {
  if (state === 'unresolved') return 'pending';
  if (state === 'loading') return 'note';
  return 'resolved';
}

function buildPartBBody(partB?: StreamingReportData['partB']): string {
  if (!partB?.epcBand) return UNRESOLVED;
  const area =
    typeof partB.floorAreaM2 === 'number' && partB.floorAreaM2 > 0
      ? ` (${partB.floorAreaM2} m²)`
      : '';
  const lodged = partB.lodged ? ` Lodged ${partB.lodged}.` : '';
  const winter = partB.winterNote ? ` ${partB.winterNote}` : '';
  return `Current EPC rating is Band ${partB.epcBand}${area}.${lodged}${winter}`.trim();
}

function buildLocalArea(data: StreamingReportData): LocalAreaCheck[] {
  const sources = data.sources ?? [];
  const byId = Object.fromEntries(sources.map((s) => [s.id, s.state]));

  const flood = data.local?.flood;
  const floodState = byId.flood;
  const floodFinding =
    floodState === 'unresolved' || !flood?.headline || flood.headline === 'Loading...'
      ? UNRESOLVED
      : `${flood.headline} river/sea risk; groundwater ${flood.groundwater ?? 'unknown'}. ${flood.caveat ?? ''}`.trim();

  const crime = data.local?.crime;
  const crimeState = byId.crime;
  const crimeUnresolved =
    crimeState === 'unresolved' ||
    !crime?.month ||
    crime.month === 'Loading...' ||
    crime.month === 'Unknown';
  const crimeFinding = crimeUnresolved
    ? UNRESOLVED
    : `${crime.count ?? 0} incidents in ${crime.month}${
        crime.topCategories?.length ? ` (${crime.topCategories.slice(0, 3).join(', ')})` : ''
      }`;

  const heritage = data.local?.heritage;
  const heritageState = byId.heritage;
  const heritageUnresolved =
    heritageState === 'unresolved' ||
    heritage?.caveat === 'loading' ||
    (!heritage?.listed && !heritage?.conservationArea && heritage?.caveat === 'loading');
  let heritageFinding = UNRESOLVED;
  if (!heritageUnresolved && heritage) {
    if (heritage.listed) {
      heritageFinding = `Listed building${heritage.grade ? ` (Grade ${heritage.grade})` : ''}.`;
    } else if (heritage.conservationArea) {
      heritageFinding = `Conservation area${heritage.name ? `: ${heritage.name}` : ''} — exterior changes may need consent.`;
    } else {
      heritageFinding = 'Not individually listed; no conservation area recorded at postcode centroid.';
    }
  }

  return [
    {
      id: 'flood-risk',
      title: 'Flood Risk',
      status: floodState === 'clear' ? 'Clear' : floodState === 'loading' ? 'Loading' : 'Unresolved',
      tone: moduleTone(floodState),
      surface: 'seal',
      finding: floodFinding,
      source: 'EA flood CSV (OGL)',
    },
    {
      id: 'crime-safety',
      title: 'Crime & Safety',
      status: crimeState === 'clear' ? 'Recorded' : crimeState === 'loading' ? 'Loading' : 'Unresolved',
      tone: moduleTone(crimeState),
      surface: 'ink',
      finding: crimeFinding,
      source: 'police.uk (Home Office)',
    },
    {
      id: 'heritage-conservation',
      title: 'Heritage & Conservation',
      status: heritageState === 'clear' ? 'Note' : heritageState === 'loading' ? 'Loading' : 'Unresolved',
      tone: heritage?.conservationArea || heritage?.listed ? 'note' : moduleTone(heritageState),
      surface: 'stamp',
      finding: heritageFinding,
      source: 'Planning Data / Historic England NHLE',
    },
  ];
}

function buildFacts(data: StreamingReportData): FactFlag[] {
  const sources = data.sources ?? [];
  return sources
    .filter((s) => s.id !== 'postcodes')
    .map((source) => ({
      id: source.id,
      label: sourceTitle(source),
      state: source.state === 'clear' ? 'clear' : source.state === 'loading' ? 'unresolved' : 'unresolved',
      detail: sourceDetail(source),
    })) as FactFlag[];
}

function calculateDeposit(priceStr: string, isRental: boolean): { value: string; qualifier?: string } {
  if (!isRental) {
    return { value: '10% Exchange Deposit', qualifier: 'Standard Law Society Contract' };
  }

  const cleanNum = priceStr.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!cleanNum) {
    return { value: '5 Weeks Rent', qualifier: 'TDS Protected (Statutory Max)' };
  }

  const amount = parseFloat(cleanNum[0]);
  if (isNaN(amount) || amount <= 0) {
    return { value: '5 Weeks Rent', qualifier: 'TDS Protected' };
  }

  let fiveWeeks = 0;
  if (/pw|per\s*week/i.test(priceStr)) {
    fiveWeeks = Math.round(amount * 5);
  } else {
    // Standard UK pcm calculation: (pcm * 12 / 52) * 5
    fiveWeeks = Math.round(((amount * 12) / 52) * 5);
  }

  return {
    value: `5 Weeks (£${fiveWeeks.toLocaleString()})`,
    qualifier: 'TDS Protected (Statutory Max)',
  };
}

function resolveTenure(priceStr: string, audience: Audience | null): { value: string; qualifier?: string } {
  const isRental = /pcm|pw|to\s*rent|rent/i.test(priceStr) || audience === 'tenant';
  if (isRental) {
    return {
      value: 'Assured Shorthold Tenancy (AST)',
      qualifier: 'Standard Private Rented Sector Term',
    };
  }

  return {
    value: 'Freehold / Leasehold',
    qualifier: 'Pending HM Land Registry title check',
  };
}

function buildDynamicPartARows(
  listingPrice: string,
  audience: Audience | null,
): { label: string; value: string; qualifier?: string }[] {
  const isRental = /pcm|pw|to\s*rent|rent/i.test(listingPrice) || audience === 'tenant';
  const depositInfo = calculateDeposit(listingPrice, isRental);
  const tenureInfo = resolveTenure(listingPrice, audience);

  return [
    {
      label: 'Price / Rent',
      value: listingPrice || 'Price on application',
    },
    {
      label: 'Council Tax Band',
      value: 'To be confirmed by agent',
      qualifier: 'Check with local authority',
    },
    {
      label: 'Tenure / Term',
      value: tenureInfo.value,
      qualifier: tenureInfo.qualifier,
    },
    {
      label: isRental ? 'Deposit' : 'Exchange Deposit',
      value: depositInfo.value,
      qualifier: depositInfo.qualifier,
    },
  ];
}

function buildWhatToWatch(data: StreamingReportData): { title: string; body: string } {
  const heritage = data.local?.heritage;
  const flood = data.local?.flood;
  const parts: string[] = [];

  if (heritage?.conservationArea) {
    parts.push('A conservation area designation applies near this postcode centroid.');
  }
  if (flood?.headline && flood.headline !== 'Loading...' && flood.headline !== 'Unknown') {
    parts.push(`Flood context: ${flood.headline.toLowerCase()} risk at postcode centroid.`);
  }
  if (data.partC?.message) {
    parts.push(data.partC.message);
  }

  const body =
    parts.length > 0
      ? `${parts.join(' ')} Title register and covenant checks are not in this report — see Part C.`
      : 'Statutory and open government checks evaluated. Title register and covenant checks are pending live Land Registry integration.';

  return { title: 'What to watch', body };
}

export function mapStreamingReportToPropertyReport(
  data: StreamingReportData,
  audience: Audience | null,
  options?: { listingPrice?: string; addressLabel?: string },
): PropertyReportResponse {
  const defaults = defaultRenterContent();
  const watch = buildWhatToWatch(data);
  const partBBody = buildPartBBody(data.partB);
  const listingPrice = options?.listingPrice?.trim() || data.partA?.listingPrice?.trim() || '';

  const partARows = buildDynamicPartARows(listingPrice, audience);

  const partCStatus =
    data.partC?.message?.trim() ||
    (data.partC?.status === 'pending_nps' ? 'To come in next release' : 'To come in next release');

  const lens: ReportLens = {
    ...mockReportLens(audience),
    steps: data.steps?.length ? data.steps : mockReportLens(audience).steps,
  };

  return {
    facts: buildFacts(data),
    lens,
    generatedFor: (data.audience as Audience) || audience || 'tenant',
    sources: mapStreamingSources(data.sources),
    map: {
      embedQuery:
        data.map?.embedQuery ||
        (options?.addressLabel ? decodeURIComponent(options.addressLabel) : null),
    },
    reportHint: null,
    renter: {
      ...defaults,
      whatToWatchTitle: watch.title,
      whatToWatchBody: watch.body,
      partARows,
      partBBody,
      partCBody: data.partC?.message || defaults.partCBody,
      partCStatus,
      localArea: buildLocalArea(data),
      steps: data.steps?.length ? data.steps : defaults.steps,
      mapSource: '',
    },
  };
}
