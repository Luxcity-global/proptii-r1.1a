/**
 * PropertyDetails — redesigned with the ll-props design system.
 *
 * Layout: sticky header → hero photo strip → two-column body
 *   Left (2/3): tab panel (Overview · Documents · Photos)
 *   Right (1/3): sticky sidebar — Quick Actions, Tenant card, Compliance, Summary
 *
 * Colours: primary blue #136C9E · accent orange #DC5F12
 * Fonts:   Archivo headings · Nunito Sans body
 */
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Edit3,
  MoreHorizontal,
  BedDouble,
  Bath,
  Maximize2,
  PoundSterling,
  Calendar,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  User,
  UserPlus,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Eye,
  Camera,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Property, Tenant } from '../App';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'House', flat: 'Flat / Apartment', studio: 'Studio',
  shared: 'Room (Shared House)', commercial: 'Commercial', other: 'Other',
};

function fmtType(type?: string | null): string {
  if (!type) return '—';
  return PROPERTY_TYPE_LABELS[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const secs = v._seconds ?? v.seconds;
  if (typeof secs === 'number') return new Date(secs * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(v: any): string {
  const d = toDate(v);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function coverUrl(property: Property): string | null {
  const valid = (property.photos ?? []).filter(p => p?.url && !p.url.startsWith('blob:'));
  return valid.find(p => p.isCover)?.url ?? valid[0]?.url ?? null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusKey = 'occupied' | 'vacant' | 'under-renovation';

const STATUS_META: Record<StatusKey, { label: string; dot: string; bg: string; text: string }> = {
  'occupied':         { label: 'Occupied',          dot: '#10b981', bg: '#dcfce7', text: '#15803d' },
  'vacant':           { label: 'Vacant',             dot: '#f43f5e', bg: '#fee2e2', text: '#b91c1c' },
  'under-renovation': { label: 'Under Renovation',   dot: '#f59e0b', bg: '#fef9c3', text: '#92400e' },
};

function StatusPill({ status }: { status: Property['status'] }) {
  const meta = STATUS_META[status as StatusKey] ?? { label: status, dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
      style={{ background: meta.bg, color: meta.text, fontFamily: 'Archivo,sans-serif' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

// ─── Document helpers ─────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  'epc': 'EPC Certificate', 'gas-cert': 'Gas Safety Certificate',
  'tenancy-agreement': 'Tenancy Agreement', 'insurance': 'Insurance Policy', 'other': 'Other',
};

function DocStatusIcon({ status }: { status: string }) {
  if (status === 'valid')         return <CheckCircle size={15} className="text-green-600 shrink-0" />;
  if (status === 'expiring-soon') return <Clock       size={15} className="text-amber-500 shrink-0" />;
  if (status === 'expired')       return <AlertTriangle size={15} className="text-red-500 shrink-0" />;
  return                                 <Clock       size={15} className="text-gray-400 shrink-0" />;
}

// ─── Shared card shell ────────────────────────────────────────────────────────

function SCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[20px] border border-[#e2e8f0] ${className}`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PropertyDetailsProps {
  property: Property | null;
  tenants?: Tenant[];
  onBack: () => void;
  onEdit: (property: Property) => void;
  onManageDocuments: () => void;
  onManagePhotos: () => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  onViewTenant?: (tenantId: string) => void;
  onAddTenant?: () => void;
  onSelectExistingTenant?: (tenantId: string) => void;
  onRemoveTenant?: (tenantId: string, propertyId: string) => void;
  onChangeTenant?: (propertyId: string, newTenantId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyDetails({
  property, tenants = [], onBack, onEdit,
  onManageDocuments, onManagePhotos, updateProperty,
  onViewTenant, onAddTenant, onSelectExistingTenant,
  onRemoveTenant, onChangeTenant,
}: PropertyDetailsProps) {
  const [activeTab,              setActiveTab]              = useState<'overview'|'documents'|'photos'>('overview');
  const [photoIdx,               setPhotoIdx]               = useState(0);
  const [showChangeTenantDialog, setShowChangeTenantDialog] = useState(false);
  const [newTenantId,            setNewTenantId]            = useState('');

  const availableTenants = useMemo(() =>
    tenants.filter(t => !t.propertyId || t.propertyId === '' || t.propertyId !== property?.id),
    [tenants, property?.id],
  );
  const swappableTenants = useMemo(() =>
    property?.tenant ? [property.tenant, ...availableTenants] : availableTenants,
    [availableTenants, property?.tenant],
  );

  const dates = useMemo(() => {
    if (!property) return {} as Record<string, any>;
    return {
      createdAt: fmt(property.createdAt),
      leaseEnd:  fmt(property.tenant?.leaseEnd),
      lastPaid:  fmt(property.tenant?.lastPaymentDate),
      docs: Object.fromEntries(
        (property.documents ?? []).map(d => [d.id, { issue: fmt(d.issueDate), expiry: d.expiryDate ? fmt(d.expiryDate) : null }])
      ),
    };
  }, [property]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#f8fafc', fontFamily: 'Nunito Sans,sans-serif' }}>
        <div className="text-center space-y-4">
          <p className="text-[#64748b]">Property not found.</p>
          <button type="button" onClick={onBack}
            className="px-5 py-2.5 rounded-[12px] text-white text-sm font-semibold"
            style={{ background: '#136C9E' }}>
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const validPhotos = (property.photos ?? []).filter(p => p?.url && !p.url.startsWith('blob:'));
  const expiredDocCount = (property.documents ?? []).filter(d => d.status === 'expiring-soon' || d.status === 'expired').length;

  const TAB_CLASS = (t: typeof activeTab) =>
    `px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer border-0 outline-none ${
      activeTab === t
        ? 'bg-white text-[#136C9E] shadow-sm'
        : 'text-[#64748b] hover:text-[#1e293b]'
    }`;

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', fontFamily: 'Nunito Sans,sans-serif' }}>

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-[64px] flex items-center justify-between px-5"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack}
            className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div className="hidden sm:block">
            <p className="text-[15px] font-bold text-[#1e293b] leading-tight"
              style={{ fontFamily: 'Archivo,sans-serif' }}>
              {(property.address.split(',')[0] ?? property.address).trim()}
            </p>
            <p className="text-[12px] text-[#64748b] leading-tight mt-0.5">{property.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={property.status} />
          <button type="button" onClick={() => onEdit(property)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: '#136C9E', color: 'white', fontFamily: 'Archivo,sans-serif', boxShadow: '0 2px 8px rgba(19,108,158,0.25)' }}>
            <Edit3 size={14} /> Edit
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button"
                className="w-9 h-9 rounded-[10px] border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[14px] border-[#e2e8f0] p-1.5 min-w-[180px]">
              <DropdownMenuItem className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => onManagePhotos()}>
                <Camera size={14} className="mr-2 text-[#64748b]" /> Manage Photos
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => onManageDocuments()}>
                <FileText size={14} className="mr-2 text-[#64748b]" /> Manage Documents
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => updateProperty(property.id, { status: 'under-renovation' })}>
                <Archive size={14} className="mr-2 text-[#64748b]" /> Mark as Renovation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Hero photo strip ──────────────────────────────────────────────── */}
      {validPhotos.length > 0 ? (
        <div className="relative bg-[#1e293b]" style={{ height: 320 }}>
          <img src={validPhotos[photoIdx]?.url} alt="Property cover"
            className="w-full h-full object-cover opacity-95" />
          {/* Counter */}
          <span className="absolute bottom-4 right-4 text-[12px] font-semibold text-white px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            {photoIdx + 1} / {validPhotos.length}
          </span>
          {/* Prev/next */}
          {validPhotos.length > 1 && (
            <>
              <button type="button"
                onClick={() => setPhotoIdx(i => (i - 1 + validPhotos.length) % validPhotos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/30"
                style={{ background: 'rgba(0,0,0,0.30)' }}>
                <ChevronLeft size={18} />
              </button>
              <button type="button"
                onClick={() => setPhotoIdx(i => (i + 1) % validPhotos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/30"
                style={{ background: 'rgba(0,0,0,0.30)' }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {/* Thumbnail strip */}
          {validPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {validPhotos.slice(0, 8).map((p, i) => (
                <button key={p.id} type="button" onClick={() => setPhotoIdx(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.45)' }} />
              ))}
            </div>
          )}
          {/* Manage Photos shortcut */}
          <button type="button" onClick={onManagePhotos}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[10px] text-white transition-all hover:bg-white/25"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', fontFamily: 'Archivo,sans-serif' }}>
            <Camera size={13} /> Manage Photos
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center"
          style={{ height: 220, background: 'linear-gradient(135deg,#1e3a4f 0%,#0f1e2e 100%)' }}>
          <button type="button" onClick={onManagePhotos}
            className="flex flex-col items-center gap-3 text-white/70 hover:text-white transition-colors">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Camera size={24} />
            </div>
            <span className="text-[13px] font-semibold" style={{ fontFamily: 'Archivo,sans-serif' }}>
              Add Photos
            </span>
          </button>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1120px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: tabs ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 rounded-[14px] bg-[#f1f5f9]" style={{ width: 'fit-content' }}>
              <button className={TAB_CLASS('overview')}   onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={TAB_CLASS('documents')}  onClick={() => setActiveTab('documents')}>
                Documents
                {expiredDocCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {expiredDocCount}
                  </span>
                )}
              </button>
              <button className={TAB_CLASS('photos')}     onClick={() => setActiveTab('photos')}>
                Photos ({validPhotos.length})
              </button>
            </div>

            {/* ── Overview tab ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Key specs */}
                <SCard>
                  <div className="px-5 pt-5 pb-1">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-4"
                      style={{ fontFamily: 'Archivo,sans-serif' }}>Property Specifications</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#f1f5f9]">
                    {[
                      { icon: BedDouble,      label: 'Bedrooms',    value: String(property.bedrooms) },
                      { icon: Bath,           label: 'Bathrooms',   value: typeof (property as any).bathrooms === 'number' ? String((property as any).bathrooms) : '—' },
                      { icon: Maximize2,      label: 'Size',        value: typeof (property as any).squareFootage === 'number' ? `${(property as any).squareFootage} sq ft` : '—' },
                      { icon: PoundSterling,  label: 'Monthly Rent', value: `£${(property.rent ?? 0).toLocaleString()}` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-white px-5 py-4 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                          style={{ background: '#eaf3f8' }}>
                          <Icon size={17} style={{ color: '#136C9E' }} />
                        </span>
                        <div>
                          <p className="text-[11px] text-[#94a3b8] font-semibold uppercase tracking-wide">{label}</p>
                          <p className="text-[14px] font-bold text-[#1e293b] mt-0.5"
                            style={{ fontFamily: 'Archivo,sans-serif' }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 flex items-center gap-2 text-[13px] text-[#64748b] border-t border-[#f1f5f9]">
                    <MapPin size={14} className="text-[#94a3b8] shrink-0" />
                    {property.address}
                    <span className="ml-auto text-[12px]">Added {dates.createdAt}</span>
                  </div>
                </SCard>

                {/* Amenities */}
                {(property.amenities ?? []).length > 0 && (
                  <SCard className="px-5 py-5">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3"
                      style={{ fontFamily: 'Archivo,sans-serif' }}>Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map(a => (
                        <span key={a} className="text-[12px] font-semibold px-3 py-1 rounded-full capitalize"
                          style={{ background: '#eaf3f8', color: '#136C9E', border: '1px solid rgba(19,108,158,0.15)' }}>
                          {a.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </SCard>
                )}

                {/* Notes */}
                {property.notes && (
                  <SCard className="px-5 py-5">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-2"
                      style={{ fontFamily: 'Archivo,sans-serif' }}>Notes</p>
                    <p className="text-[13.5px] text-[#475569] leading-relaxed">{property.notes}</p>
                  </SCard>
                )}
              </div>
            )}

            {/* ── Documents tab ────────────────────────────────────────── */}
            {activeTab === 'documents' && (
              <SCard>
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <p className="text-[14px] font-bold text-[#1e293b]"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Property Documents</p>
                  <button type="button" onClick={onManageDocuments}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] transition-all hover:bg-[#eaf3f8]"
                    style={{ color: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>
                    <Plus size={14} /> Upload Document
                  </button>
                </div>
                {(property.documents ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-5">
                    <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
                      style={{ background: '#f1f5f9' }}>
                      <FileText size={24} className="text-[#94a3b8]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1e293b] mb-1">No documents yet</p>
                    <p className="text-[13px] text-[#64748b] mb-4">Upload EPC certificates, gas safety checks and tenancy agreements.</p>
                    <button type="button" onClick={onManageDocuments}
                      className="text-[13px] font-semibold px-4 py-2.5 rounded-[12px] transition-all hover:opacity-90"
                      style={{ background: '#136C9E', color: 'white', fontFamily: 'Archivo,sans-serif' }}>
                      Upload Documents
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#f1f5f9]">
                    {property.documents.map(doc => (
                      <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                        <DocStatusIcon status={doc.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#1e293b] truncate">{doc.name}</p>
                          <p className="text-[11.5px] text-[#64748b]">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                        </div>
                        <div className="text-right text-[11.5px] text-[#94a3b8] shrink-0">
                          <p>Issued {dates.docs[doc.id]?.issue ?? '—'}</p>
                          {doc.expiryDate && <p>Expires {dates.docs[doc.id]?.expiry ?? '—'}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SCard>
            )}

            {/* ── Photos tab ───────────────────────────────────────────── */}
            {activeTab === 'photos' && (
              <SCard>
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <p className="text-[14px] font-bold text-[#1e293b]"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Property Photos</p>
                  <button type="button" onClick={onManagePhotos}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] transition-all hover:bg-[#eaf3f8]"
                    style={{ color: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>
                    <Camera size={14} /> Manage Photos
                  </button>
                </div>
                {validPhotos.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-5">
                    <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
                      style={{ background: '#f1f5f9' }}>
                      <ImageIcon size={24} className="text-[#94a3b8]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1e293b] mb-1">No photos yet</p>
                    <p className="text-[13px] text-[#64748b] mb-4">Properties with photos attract significantly more enquiries.</p>
                    <button type="button" onClick={onManagePhotos}
                      className="text-[13px] font-semibold px-4 py-2.5 rounded-[12px] transition-all hover:opacity-90"
                      style={{ background: '#136C9E', color: 'white', fontFamily: 'Archivo,sans-serif' }}>
                      Add Photos
                    </button>
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {validPhotos.map((photo, i) => (
                      <button key={photo.id} type="button"
                        onClick={() => { setPhotoIdx(i); setActiveTab('overview'); }}
                        className="relative group rounded-[12px] overflow-hidden aspect-video bg-[#f1f5f9] block">
                        <img src={photo.url} alt={photo.room ?? 'Property'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {photo.isCover && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>Cover</span>
                        )}
                        {photo.room && (
                          <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'rgba(0,0,0,0.5)' }}>{photo.room}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </SCard>
            )}
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────── */}
          <div className="w-full lg:w-[300px] shrink-0 space-y-4 lg:sticky lg:top-[80px]">

            {/* Quick actions */}
            <SCard className="p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1"
                style={{ fontFamily: 'Archivo,sans-serif' }}>Quick Actions</p>
              <div className="space-y-2">
                {[
                  { label: 'Edit Property',     icon: Edit3,     action: () => onEdit(property) },
                  { label: 'Manage Photos',      icon: Camera,    action: onManagePhotos },
                  { label: 'Manage Documents',   icon: FileText,  action: onManageDocuments },
                ].map(({ label, icon: Icon, action }) => (
                  <button key={label} type="button" onClick={action}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#334155] transition-all hover:bg-[#f1f5f9] hover:text-[#136C9E] text-left"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>
                    <Icon size={15} className="text-[#64748b] shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </SCard>

            {/* Tenant card — occupied */}
            {(property.status === 'occupied' || property.tenant) && property.tenant && (
              <SCard className="overflow-hidden">
                <div className="px-4 py-3.5" style={{ background: 'linear-gradient(135deg,#136C9E 0%,#0e5a87 100%)' }}>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-white/70 mb-2"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Current Tenant</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold text-white"
                      style={{ background: 'rgba(255,255,255,0.2)' }}>
                      {initials(property.tenant.name ?? '')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-white truncate"
                        style={{ fontFamily: 'Archivo,sans-serif' }}>{property.tenant.name}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        property.tenant.paymentStatus === 'current'  ? 'bg-green-400/30 text-green-100' :
                        property.tenant.paymentStatus === 'overdue'  ? 'bg-red-400/30 text-red-100' :
                                                                       'bg-amber-400/30 text-amber-100'
                      }`}>
                        {property.tenant.paymentStatus === 'current' ? '✓ Up to date' :
                         property.tenant.paymentStatus === 'overdue' ? '⚠ Overdue' : 'Payment plan'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {property.tenant.email && (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                      <Mail size={13} className="text-[#94a3b8] shrink-0" />
                      <span className="truncate">{property.tenant.email}</span>
                    </div>
                  )}
                  {property.tenant.phone && (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                      <Phone size={13} className="text-[#94a3b8] shrink-0" />
                      {property.tenant.phone}
                    </div>
                  )}
                  {property.tenant.rentAmount && (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                      <PoundSterling size={13} className="text-[#94a3b8] shrink-0" />
                      £{(property.tenant.rentAmount ?? 0).toLocaleString()} / month
                    </div>
                  )}
                  {dates.leaseEnd !== '—' && (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                      <Calendar size={13} className="text-[#94a3b8] shrink-0" />
                      Lease ends {dates.leaseEnd}
                    </div>
                  )}

                  {/* Overdue alert */}
                  {property.tenant.paymentStatus === 'overdue' && (property.tenant as any).overdueAmount && (
                    <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-red-50 border border-red-200">
                      <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-red-700">
                          £{(property.tenant as any).overdueAmount.toLocaleString()} overdue
                        </p>
                        {dates.lastPaid !== '—' && (
                          <p className="text-[11px] text-red-500">Last paid {dates.lastPaid}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tenant action buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    {onViewTenant && property.tenant.id && (
                      <button type="button" onClick={() => onViewTenant(property.tenant!.id)}
                        className="w-full h-9 rounded-[10px] border border-[#e2e8f0] flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-all"
                        style={{ fontFamily: 'Archivo,sans-serif' }}>
                        <Eye size={13} /> View Tenant Details
                      </button>
                    )}
                    <div className="flex gap-2">
                      {onChangeTenant && property.tenant.id && (
                        <button type="button" onClick={() => setShowChangeTenantDialog(true)}
                          className="flex-1 h-9 rounded-[10px] border border-[#e2e8f0] flex items-center justify-center gap-1 text-[12px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-all"
                          style={{ fontFamily: 'Archivo,sans-serif' }}>
                          <UserCheck size={13} /> Change
                        </button>
                      )}
                      {onRemoveTenant && property.tenant.id && (
                        <button type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${property.tenant?.name} from this property?`)) {
                              onRemoveTenant(property.tenant!.id, property.id);
                            }
                          }}
                          className="flex-1 h-9 rounded-[10px] border flex items-center justify-center gap-1 text-[12px] font-semibold transition-all hover:bg-red-50"
                          style={{ borderColor: '#fca5a5', color: '#dc2626', fontFamily: 'Archivo,sans-serif' }}>
                          <UserX size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SCard>
            )}

            {/* Vacant card */}
            {property.status === 'vacant' && !property.tenant && (
              <SCard className="p-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                    style={{ background: '#f1f5f9' }}>
                    <User size={22} className="text-[#94a3b8]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1e293b] mb-1"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Property is Vacant</p>
                  <p className="text-[12.5px] text-[#64748b] mb-4">Ready to welcome a new tenant.</p>
                  {onAddTenant && (
                    <button type="button" onClick={onAddTenant}
                      className="w-full h-[42px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 mb-2"
                      style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif', boxShadow: '0 3px 10px rgba(220,95,18,0.25)' }}>
                      <UserPlus size={15} /> Add New Tenant
                    </button>
                  )}
                  {availableTenants.length > 0 && onSelectExistingTenant && (
                    <div className="mt-3">
                      <p className="text-[11px] text-[#94a3b8] font-semibold mb-2">Or assign existing tenant</p>
                      <Select onValueChange={onSelectExistingTenant}>
                        <SelectTrigger className="w-full rounded-[10px] border-[#e2e8f0] text-[13px]">
                          <SelectValue placeholder="Select tenant…" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTenants.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </SCard>
            )}

            {/* Renovation card */}
            {property.status === 'under-renovation' && (
              <SCard className="p-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                    style={{ background: '#fef9c3' }}>
                    <Clock size={22} className="text-amber-500" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1e293b] mb-1"
                    style={{ fontFamily: 'Archivo,sans-serif' }}>Under Renovation</p>
                  <p className="text-[12.5px] text-[#64748b]">Not available for tenants until works complete.</p>
                </div>
              </SCard>
            )}

            {/* Compliance */}
            {(property.documents ?? []).length > 0 && (
              <SCard className="p-4">
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1"
                  style={{ fontFamily: 'Archivo,sans-serif' }}>Compliance</p>
                <ul className="space-y-2.5">
                  {property.documents.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between">
                      <span className="text-[12.5px] text-[#334155] truncate">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <DocStatusIcon status={doc.status} />
                        <span className="text-[11.5px] text-[#64748b] capitalize">{doc.status.replace('-', ' ')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </SCard>
            )}

            {/* Property summary */}
            <SCard className="p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1"
                style={{ fontFamily: 'Archivo,sans-serif' }}>Summary</p>
              <ul className="space-y-2.5">
                {[
                  ['Type',      fmtType(property.type)],
                  ['Bedrooms',  String(property.bedrooms)],
                  ['Bathrooms', typeof (property as any).bathrooms === 'number' ? String((property as any).bathrooms) : '—'],
                  ['Sq Ft',     typeof (property as any).squareFootage === 'number' ? `${(property as any).squareFootage}` : '—'],
                  ['Monthly Rent', `£${(property.rent ?? 0).toLocaleString()}`],
                  ['Photos',    String(validPhotos.length)],
                  ['Documents', String((property.documents ?? []).length)],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between">
                    <span className="text-[12.5px] text-[#64748b]">{label}</span>
                    <span className="text-[12.5px] font-semibold text-[#1e293b]">{value}</span>
                  </li>
                ))}
              </ul>
            </SCard>
          </div>
        </div>
      </div>

      {/* ── Change Tenant Dialog ──────────────────────────────────────────── */}
      <Dialog open={showChangeTenantDialog} onOpenChange={setShowChangeTenantDialog}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Archivo,sans-serif' }}>Change Tenant</DialogTitle>
            <DialogDescription>
              Select a tenant to assign to this property. The current tenant's assignment will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={newTenantId} onValueChange={setNewTenantId}>
              <SelectTrigger className="w-full rounded-[12px] border-[#e2e8f0]">
                <SelectValue placeholder="Select a tenant…" />
              </SelectTrigger>
              <SelectContent>
                {swappableTenants.length === 0 ? (
                  <div className="p-3 text-sm text-center text-[#64748b]">No available tenants</div>
                ) : (
                  swappableTenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.propertyId === property.id ? ' (current)' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button type="button"
              onClick={() => { setShowChangeTenantDialog(false); setNewTenantId(''); }}
              className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-all">
              Cancel
            </button>
            <button type="button" disabled={!newTenantId}
              onClick={() => {
                if (newTenantId && onChangeTenant) {
                  onChangeTenant(property.id, newTenantId);
                  setShowChangeTenantDialog(false);
                  setNewTenantId('');
                }
              }}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: '#136C9E', fontFamily: 'Archivo,sans-serif' }}>
              Confirm Change
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PropertyDetails;
