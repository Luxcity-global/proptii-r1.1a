import type {
  StreamingReportAddress,
  StreamingReportData,
  StreamingReportFrame,
  StreamingReportSource,
} from '../types/streamingReport';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

/** Backend staging base URL from Renter Report handover (Aug 2026). */
export const REPORT_BACKEND_STAGING_URL = 'https://proptii-r1-1a-1-hcw6.onrender.com';

export function resolveReportBackendOrigin(): string {
  const resolved = getResolvedApiBaseUrl();
  if (resolved) {
    return resolved.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  }
  return REPORT_BACKEND_STAGING_URL;
}

export function buildReportStreamUrl(): string {
  return `${resolveReportBackendOrigin()}/api/properties/report`;
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/x-ndjson',
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem('auth_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

function updateSourceState(
  sources: StreamingReportSource[],
  id: string,
  state: StreamingReportSource['state'],
): StreamingReportSource[] {
  return sources.map((source) => (source.id === id ? { ...source, state } : source));
}

/** Merge one module chunk into the in-flight report tree (handover §4). */
export function mergeStreamingReportChunk(
  report: StreamingReportData,
  frame: Extract<StreamingReportFrame, { type: 'chunk' }>,
): StreamingReportData {
  const next: StreamingReportData = {
    ...report,
    sources: [...(report.sources ?? [])],
    local: { ...(report.local ?? {}) },
    partB: { ...(report.partB ?? {}) },
  };

  if (frame.module === 'flood') {
    const data = frame.data as StreamingReportData['local'] extends infer L
      ? L extends { flood?: infer F }
        ? F
        : never
      : never;
    next.sources = updateSourceState(next.sources ?? [], 'flood', data ? 'clear' : 'unresolved');
    if (data) next.local = { ...next.local, flood: data };
  } else if (frame.module === 'epc') {
    const data = frame.data as StreamingReportData['partB'];
    next.sources = updateSourceState(next.sources ?? [], 'epc', data?.epcBand ? 'clear' : 'unresolved');
    if (data) next.partB = { ...next.partB, ...data };
  } else if (frame.module === 'crime') {
    const data = frame.data as StreamingReportData['local'] extends infer L
      ? L extends { crime?: infer C }
        ? C
        : never
      : never;
    const ok = Boolean(data?.month && data.month !== 'Unknown' && data.month !== 'Loading...');
    next.sources = updateSourceState(next.sources ?? [], 'crime', ok ? 'clear' : 'unresolved');
    if (data) next.local = { ...next.local, crime: data };
  } else if (frame.module === 'heritage') {
    const data = frame.data as StreamingReportData['local'] extends infer L
      ? L extends { heritage?: infer H }
        ? H
        : never
      : never;
    next.sources = updateSourceState(next.sources ?? [], 'heritage', data ? 'clear' : 'unresolved');
    if (data) next.local = { ...next.local, heritage: data };
  }

  return next;
}

export function parseStreamingReportLine(line: string): StreamingReportFrame | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as StreamingReportFrame;
  } catch {
    return null;
  }
}

export interface StreamPropertyReportOptions {
  listingId: string;
  address: StreamingReportAddress;
  onProgress?: (data: StreamingReportData) => void;
  signal?: AbortSignal;
}

/**
 * POST /api/properties/report — NDJSON streaming renter report (backend handover).
 */
export async function streamPropertyReport({
  listingId,
  address,
  onProgress,
  signal,
}: StreamPropertyReportOptions): Promise<StreamingReportData | null> {
  const response = await fetch(buildReportStreamUrl(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ listingId, address }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Report service returned ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No readable stream available in response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalData: StreamingReportData | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const frame = parseStreamingReportLine(line);
      if (!frame) continue;

      if (frame.type === 'initial') {
        finalData = frame.data;
        onProgress?.(finalData);
      } else if (frame.type === 'chunk' && finalData) {
        finalData = mergeStreamingReportChunk(finalData, frame);
        onProgress?.({ ...finalData });
      }
    }
  }

  if (buffer.trim()) {
    const frame = parseStreamingReportLine(buffer);
    if (frame?.type === 'initial') {
      finalData = frame.data;
      onProgress?.(finalData);
    } else if (frame?.type === 'chunk' && finalData) {
      finalData = mergeStreamingReportChunk(finalData, frame);
      onProgress?.({ ...finalData });
    }
  }

  return finalData;
}
