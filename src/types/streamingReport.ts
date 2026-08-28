/** Backend NDJSON streaming report contract (Renter Report handover). */

export type ReportModuleState = 'loading' | 'clear' | 'unresolved';

export interface StreamingReportSource {
  id: string;
  label: string;
  state: ReportModuleState;
}

export interface StreamingReportAddress {
  display: string;
  street?: string | null;
  postcode?: string | null;
  coordinates?: { lat: number; lng: number };
}

export interface StreamingReportPayload {
  listingId: string;
  address: StreamingReportAddress;
}

export interface StreamingReportMatch {
  status: string;
  lat?: number;
  lng?: number;
}

export interface StreamingReportPartA {
  listingPrice?: string;
}

export interface StreamingReportPartB {
  epcBand?: string | null;
  floorAreaM2?: number | null;
  lodged?: string;
  winterNote?: string;
}

export interface StreamingReportPartC {
  status?: string;
  message?: string;
}

export interface StreamingReportLocalFlood {
  headline?: string;
  groundwater?: string;
  caveat?: string;
}

export interface StreamingReportLocalCrime {
  month?: string;
  count?: number;
  topCategories?: string[];
}

export interface StreamingReportLocalHeritage {
  listed?: boolean;
  grade?: string | null;
  conservationArea?: boolean;
  name?: string | null;
  caveat?: string;
}

export interface StreamingReportData {
  generatedAt?: string;
  audience?: string;
  match?: StreamingReportMatch;
  sources?: StreamingReportSource[];
  partA?: StreamingReportPartA;
  partB?: StreamingReportPartB;
  partC?: StreamingReportPartC;
  local?: {
    flood?: StreamingReportLocalFlood;
    crime?: StreamingReportLocalCrime;
    heritage?: StreamingReportLocalHeritage;
  };
  map?: { embedQuery?: string | null };
  steps?: string[];
}

export type StreamingReportFrame =
  | { type: 'initial'; data: StreamingReportData }
  | { type: 'chunk'; module: 'flood' | 'epc' | 'crime' | 'heritage'; data: unknown };
