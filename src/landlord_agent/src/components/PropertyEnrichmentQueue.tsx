/**
 * PropertyEnrichmentQueue — shown after bulk property import
 *
 * Displays each successfully imported property with a completion ring
 * showing which data is present vs missing, plus quick-action buttons
 * to enrich each property (Add Photos, Upload Docs, Edit Details).
 *
 * Design: same system — Archivo/Nunito Sans, #136C9E / #DC5F12
 */
import React, { useState } from 'react';
import {
  ArrowLeft, Camera, FileText, Edit3, CheckCircle,
  Home, ChevronDown, ChevronUp, AlertTriangle, ExternalLink,
  Image, Layers, Star,
} from 'lucide-react';
import type { Property } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichmentField {
  key: string;
  label: string;
  weight: number; // percentage contribution toward 100%
  check: (p: Property) => boolean;
}

interface PropertyEnrichmentQueueProps {
  /** IDs of properties created during the bulk import */
  importedPropertyIds: string[];
  /** Full properties list from App state (refreshed after import) */
  properties: Property[];
  onBack: () => void;
  onAddPhotos: (property: Property) => void;
  onUploadDocs: (property: Property) => void;
  onEditDetails: (property: Property) => void;
  onViewProperty: (property: Property) => void;
  onDone: () => void;
}

// ─── Completion fields ─────────────────────────────────────────────────────

const FIELDS: EnrichmentField[] = [
  { key: 'address',      label: 'Address',       weight: 15, check: p => !!p.address?.trim() },
  { key: 'type',         label: 'Type',          weight: 10, check: p => !!p.type?.trim() },
  { key: 'bedrooms',     label: 'Bedrooms',      weight: 5,  check: p => p.bedrooms > 0 },
  { key: 'rent',         label: 'Rent',          weight: 10, check: p => p.rent > 0 },
  { key: 'bathrooms',    label: 'Bathrooms',     weight: 5,  check: p => !!p.bathrooms && p.bathrooms > 0 },
  { key: 'squareFootage',label: 'Size (sq ft)',  weight: 5,  check: p => !!p.squareFootage && p.squareFootage > 0 },
  { key: 'amenities',    label: 'Amenities',     weight: 10, check: p => p.amenities?.length > 0 },
  { key: 'photos',       label: 'Photos',        weight: 25, check: p => p.photos?.filter(ph => ph.url && !ph.url.startsWith('blob:')).length > 0 },
  { key: 'documents',    label: 'Documents',     weight: 10, check: p => p.documents?.length > 0 },
  { key: 'notes',        label: 'Description',   weight: 5,  check: p => !!p.notes?.trim() },
];

function completionPct(property: Property): number {
  return FIELDS.reduce((sum, f) => sum + (f.check(property) ? f.weight : 0), 0);
}

function missingFields(property: Property): EnrichmentField[] {
  return FIELDS.filter(f => !f.check(property));
}

// ─── Completion ring (SVG) ─────────────────────────────────────────────────

function Ring({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#e11d48';

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90"
        style={{
          fill: color,
          fontSize: size < 50 ? 10 : 11,
          fontWeight: 700,
          fontFamily: 'Archivo,sans-serif',
          transform: `rotate(90deg)`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Property card ─────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onAddPhotos,
  onUploadDocs,
  onEditDetails,
  onViewProperty,
}: {
  property: Property;
  onAddPhotos: () => void;
  onUploadDocs: () => void;
  onEditDetails: () => void;
  onViewProperty: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct     = completionPct(property);
  const missing = missingFields(property);
  const hasPhotos = property.photos?.filter(p => !p.url?.startsWith('blob:')).length > 0;
  const hasDocs   = property.documents?.length > 0;

  const statusColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#e11d48';
  const statusLabel = pct >= 80 ? 'Well enriched' : pct >= 50 ? 'Partially complete' : 'Needs attention';
  const statusBg    = pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fff1f2';

  return (
    <div
      className="rounded-[20px] border transition-all"
      style={{ borderColor: pct >= 80 ? '#bbf7d0' : pct >= 50 ? '#fde68a' : '#fecdd3', background: 'white' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        <Ring pct={pct} size={52} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-[#1e293b] truncate" style={{ fontFamily: 'Archivo,sans-serif' }}>
            {property.address?.split(',')[0] || 'Unnamed Property'}
          </p>
          <p className="text-[12px] text-[#64748b] truncate mt-0.5">{property.address}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: statusBg, color: statusColor }}>
              {statusLabel}
            </span>
            <span className="text-[11px] text-[#94a3b8]">{property.type} · {property.bedrooms} bed · £{property.rent.toLocaleString()}/mo</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick action icons */}
          <button
            type="button"
            onClick={onAddPhotos}
            title={hasPhotos ? 'Manage photos' : 'Add photos — missing!'}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: hasPhotos ? '#f0fdf4' : '#fff3ed',
              border: `1.5px solid ${hasPhotos ? '#bbf7d0' : '#fed7aa'}`,
            }}
          >
            <Camera size={15} style={{ color: hasPhotos ? '#16a34a' : '#DC5F12' }} />
          </button>
          <button
            type="button"
            onClick={onUploadDocs}
            title={hasDocs ? 'Manage documents' : 'Upload documents — missing!'}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: hasDocs ? '#f0fdf4' : '#fff1f2',
              border: `1.5px solid ${hasDocs ? '#bbf7d0' : '#fecdd3'}`,
            }}
          >
            <FileText size={15} style={{ color: hasDocs ? '#16a34a' : '#e11d48' }} />
          </button>
          <button
            type="button"
            onClick={onEditDetails}
            title="Edit property details"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all hover:scale-105"
            style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}
          >
            <Edit3 size={15} style={{ color: '#0369a1' }} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all hover:bg-[#f8fafc]"
            style={{ border: '1.5px solid #e2e8f0' }}
          >
            {expanded ? <ChevronUp size={15} className="text-[#64748b]" /> : <ChevronDown size={15} className="text-[#64748b]" />}
          </button>
        </div>
      </div>

      {/* Expanded: missing fields + view link */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#f1f5f9]">
          {missing.length === 0 ? (
            <p className="text-[12px] text-[#15803d] flex items-center gap-1.5 font-semibold">
              <CheckCircle size={13} /> All fields complete — great job!
            </p>
          ) : (
            <>
              <p className="text-[11.5px] font-semibold text-[#475569] mb-2" style={{ fontFamily: 'Archivo,sans-serif' }}>
                Missing fields ({missing.length}):
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {missing.map(f => (
                  <span
                    key={f.key}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: f.key === 'photos' ? '#fff3ed' : f.key === 'documents' ? '#fff1f2' : '#f8fafc',
                      color: f.key === 'photos' ? '#DC5F12' : f.key === 'documents' ? '#e11d48' : '#475569',
                      border: `1px solid ${f.key === 'photos' ? '#fed7aa' : f.key === 'documents' ? '#fecdd3' : '#e2e8f0'}`,
                    }}
                  >
                    {f.key === 'photos' ? <Camera size={10} /> : f.key === 'documents' ? <FileText size={10} /> : <AlertTriangle size={10} />}
                    {f.label}
                  </span>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onViewProperty}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#136C9E] hover:underline"
            style={{ fontFamily: 'Archivo,sans-serif' }}
          >
            <ExternalLink size={12} /> View full property details
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function PropertyEnrichmentQueue({
  importedPropertyIds,
  properties,
  onBack,
  onAddPhotos,
  onUploadDocs,
  onEditDetails,
  onViewProperty,
  onDone,
}: PropertyEnrichmentQueueProps) {
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'complete'>('all');

  // Only show properties that were part of this import
  const importedProperties = properties.filter(p => importedPropertyIds.includes(p.id));

  const complete       = importedProperties.filter(p => completionPct(p) >= 80);
  const needsAttention = importedProperties.filter(p => completionPct(p) < 80);

  const displayed = filter === 'complete'
    ? complete
    : filter === 'needs-attention'
    ? needsAttention
    : importedProperties;

  const overallPct = importedProperties.length > 0
    ? Math.round(importedProperties.reduce((sum, p) => sum + completionPct(p), 0) / importedProperties.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7fafc', fontFamily: 'Nunito Sans,sans-serif' }}>
      {/* Navbar */}
      <header
        className="h-[68px] px-6 flex items-center justify-between sticky top-0 z-50"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(226,232,240,0.65)' }}
      >
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>
            Enrichment Queue
          </span>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="h-9 px-5 rounded-[12px] font-semibold text-[13px] text-white transition-all hover:-translate-y-px"
          style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', boxShadow: '0 3px 10px rgba(19,108,158,0.25)' }}
        >
          Done — View Properties
        </button>
      </header>

      <main className="flex-1 px-4 pt-8 pb-16 flex flex-col items-center">
        <div className="w-full max-w-[720px]">

          {/* Summary banner */}
          <div
            className="rounded-[22px] p-6 mb-7 flex items-center gap-6"
            style={{ background: 'white', boxShadow: '0 20px 45px -12px rgba(19,108,158,0.08),0 4px 16px -2px rgba(0,0,0,0.04)' }}
          >
            <Ring pct={overallPct} size={72} />
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-[#1e293b]" style={{ fontFamily: 'Archivo,sans-serif' }}>
                {importedProperties.length} properties imported
              </h1>
              <p className="text-[13px] text-[#64748b] mt-1">
                Average portfolio completion: <strong>{overallPct}%</strong>
                {needsAttention.length > 0 && (
                  <> · <span className="text-[#e11d48] font-semibold">{needsAttention.length} need enrichment</span></>
                )}
                {complete.length > 0 && (
                  <> · <span className="text-[#16a34a] font-semibold">{complete.length} complete</span></>
                )}
              </p>

              {/* What landlord needs to do */}
              <div className="flex flex-wrap gap-3 mt-4">
                {importedProperties.some(p => !p.photos?.filter(ph => !ph.url?.startsWith('blob:')).length) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: '#fff3ed', color: '#DC5F12', border: '1px solid #fed7aa' }}>
                    <Camera size={13} />
                    {importedProperties.filter(p => !p.photos?.filter(ph => !ph.url?.startsWith('blob:')).length).length} missing photos
                  </div>
                )}
                {importedProperties.some(p => !p.documents?.length) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}>
                    <FileText size={13} />
                    {importedProperties.filter(p => !p.documents?.length).length} missing documents
                  </div>
                )}
                {importedProperties.some(p => !p.amenities?.length) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                    <Layers size={13} />
                    {importedProperties.filter(p => !p.amenities?.length).length} missing amenities
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            {([
              ['all',              `All (${importedProperties.length})`],
              ['needs-attention',  `Needs Work (${needsAttention.length})`],
              ['complete',         `Complete (${complete.length})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className="px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all"
                style={{
                  background: filter === id ? '#136C9E' : 'white',
                  color: filter === id ? 'white' : '#475569',
                  border: `1.5px solid ${filter === id ? '#136C9E' : '#e2e8f0'}`,
                  fontFamily: 'Archivo,sans-serif',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* How-to hint */}
          <div className="flex items-start gap-3 p-4 rounded-[16px] mb-5"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Star size={16} className="text-[#0369a1] mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-[#0369a1]">
              <strong>Tip:</strong> Click <Camera size={11} className="inline mb-0.5" /> to add photos, <FileText size={11} className="inline mb-0.5" /> to upload EPC/gas certs and other documents, or <Edit3 size={11} className="inline mb-0.5" /> to fill in missing details. Properties with photos get significantly more tenant interest.
            </p>
          </div>

          {/* Property cards */}
          <div className="flex flex-col gap-3">
            {displayed.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8]">
                <Home size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-[14px] font-semibold">No properties in this category</p>
              </div>
            ) : (
              displayed.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onAddPhotos={() => onAddPhotos(property)}
                  onUploadDocs={() => onUploadDocs(property)}
                  onEditDetails={() => onEditDetails(property)}
                  onViewProperty={() => onViewProperty(property)}
                />
              ))
            )}
          </div>

          {/* Bottom done button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onDone}
              className="h-[50px] px-10 rounded-[16px] font-semibold text-white flex items-center gap-2 transition-all hover:-translate-y-px"
              style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif', fontSize: 15, boxShadow: '0 4px 14px rgba(19,108,158,0.28)' }}
            >
              <CheckCircle size={18} /> I'm done enriching — go to Properties
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PropertyEnrichmentQueue;
