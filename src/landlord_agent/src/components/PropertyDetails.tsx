/**
 * PropertyDetails — redesigned with the ll-props design system.
 *
 * Layout: sticky header → hero photo strip → two-column body
 *   Left (2/3): tab panel (Overview · Documents · Photos)
 *   Right (1/3): sticky sidebar — Quick Actions, Tenant card, Compliance, Summary
 *
 * Photos tab is fully self-contained:
 *   - Drag-and-drop / file-picker upload direct to backend storage
 *   - Room tagging per photo
 *   - Set cover photo
 *   - Drag-to-reorder
 *   - Remove photo
 *   - Unsaved-changes save banner
 *   No separate PhotoManagement page needed.
 *
 * Colours: primary blue #136C9E · accent orange #DC5F12
 * Fonts:   Archivo headings · Nunito Sans body
 */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  Upload,
  X,
  Star,
  GripVertical,
  Save,
  Loader2,
  Download,
} from "lucide-react";
import { Property, PropertyPhoto, Tenant, PropertyDocument } from "../App";
import { DocumentUploadModal } from "./DocumentUploadModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { getResolvedApiBaseUrl } from "../../../config/apiBaseUrl";
import { getAccessTokenForApiRequest } from "../../../services/msalAccessToken";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "House",
  flat: "Flat / Apartment",
  studio: "Studio",
  shared: "Room (Shared House)",
  commercial: "Commercial",
  other: "Other",
};

function fmtType(type?: string | null): string {
  if (!type) return "—";
  return (
    PROPERTY_TYPE_LABELS[type.toLowerCase()] ??
    type.charAt(0).toUpperCase() + type.slice(1)
  );
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const secs = v._seconds ?? v.seconds;
  if (typeof secs === "number") return new Date(secs * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(v: any): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusKey = "occupied" | "vacant" | "under-renovation" | "draft";

const STATUS_META: Record<
  StatusKey,
  { label: string; dot: string; bg: string; text: string }
> = {
  occupied: {
    label: "Occupied",
    dot: "#10b981",
    bg: "#dcfce7",
    text: "#15803d",
  },
  vacant: { label: "Vacant", dot: "#f43f5e", bg: "#fee2e2", text: "#b91c1c" },
  "under-renovation": {
    label: "Under Renovation",
    dot: "#f59e0b",
    bg: "#fef9c3",
    text: "#92400e",
  },
  draft: {
    label: "Draft",
    dot: "#94a3b8",
    bg: "#f1f5f9",
    text: "#475569",
  },
};

function StatusPill({ status }: { status: Property["status"] }) {
  const meta = STATUS_META[status as StatusKey] ?? {
    label: status,
    dot: "#94a3b8",
    bg: "#f1f5f9",
    text: "#475569",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
      style={{
        background: meta.bg,
        color: meta.text,
        fontFamily: "Archivo,sans-serif",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </span>
  );
}

// ─── Document helpers ─────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  epc: "EPC Certificate",
  "gas-cert": "Gas Safety Certificate",
  "tenancy-agreement": "Tenancy Agreement",
  insurance: "Insurance Policy",
  other: "Other",
};

function DocStatusIcon({ status }: { status: string }) {
  if (status === "valid")
    return <CheckCircle size={15} className="text-green-600 shrink-0" />;
  if (status === "expiring-soon")
    return <Clock size={15} className="text-amber-500 shrink-0" />;
  if (status === "expired")
    return <AlertTriangle size={15} className="text-red-500 shrink-0" />;
  return <Clock size={15} className="text-gray-400 shrink-0" />;
}

// ─── Shared card shell ────────────────────────────────────────────────────────

function SCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[20px] border border-[#e2e8f0] ${className}`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {children}
    </div>
  );
}

// ─── Room types ───────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Dining Room",
  "Exterior",
  "Garden",
  "Parking",
  "Other",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PropertyDetailsProps {
  property: Property | null;
  tenants?: Tenant[];
  onBack: () => void;
  onEdit: (property: Property) => void;
  onManageDocuments: () => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  onViewTenant?: (tenantId: string) => void;
  onAddTenant?: () => void;
  onSelectExistingTenant?: (tenantId: string) => void;
  onRemoveTenant?: (tenantId: string, propertyId: string) => void;
  onChangeTenant?: (propertyId: string, newTenantId: string) => void;
  onDocumentUpload?: (
    propertyId: string,
    doc: { name: string; type: string; file: File; expiryDate?: string }
  ) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyDetails({
  property,
  tenants = [],
  onBack,
  onEdit,
  onManageDocuments,
  updateProperty,
  onViewTenant,
  onAddTenant,
  onSelectExistingTenant,
  onRemoveTenant,
  onChangeTenant,
  onDocumentUpload,
}: PropertyDetailsProps) {
  // ── Tab & hero state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "photos"
  >("overview");
  const [heroIdx, setHeroIdx] = useState(0);
  const [showChangeTenantDialog, setShowChangeTenantDialog] = useState(false);
  const [newTenantId, setNewTenantId] = useState("");

  // ── Photo management state ─────────────────────────────────────────────────
  const [localPhotos, setLocalPhotos] = useState<PropertyPhoto[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photoSaveError, setPhotoSaveError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<PropertyPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipSyncRef = useRef(false);

  // ── Document upload modal state ──────────────────────────────────────────
  const [isDocUploadOpen, setIsDocUploadOpen]   = useState(false);
  const [isUploadingDoc,  setIsUploadingDoc]    = useState(false);
  const [docUploadError,  setDocUploadError]    = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc]           = useState<PropertyDocument | null>(null);

  async function handleDocUpload(doc: { name: string; type: string; file: File; expiryDate?: string }) {
    if (!property || !onDocumentUpload) return;
    setIsUploadingDoc(true);
    setDocUploadError(null);
    try {
      await onDocumentUpload(property.id, doc);
      setIsDocUploadOpen(false);
    } catch (err: any) {
      setDocUploadError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploadingDoc(false);
    }
  }

  // Sync photos from prop whenever property changes (not during unsaved edits)
  useEffect(() => {
    if (!property) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (!hasChanges)
      setLocalPhotos(
        (property.photos ?? []).filter(
          (p) => p?.url && !p.url.startsWith("blob:"),
        ),
      );
  }, [property?.id, property?.photos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset hero index when photos change
  useEffect(() => {
    setHeroIdx(0);
  }, [property?.id]);

  // ── Tenant helpers ─────────────────────────────────────────────────────────
  const availableTenants = useMemo(
    () =>
      tenants.filter(
        (t) =>
          !t.propertyId || t.propertyId === "" || t.propertyId !== property?.id,
      ),
    [tenants, property?.id],
  );
  const swappableTenants = useMemo(
    () =>
      property?.tenant
        ? [property.tenant, ...availableTenants]
        : availableTenants,
    [availableTenants, property?.tenant],
  );
  const dates = useMemo(() => {
    if (!property) return {} as Record<string, any>;
    return {
      createdAt: fmt(property.createdAt),
      leaseEnd: fmt(property.tenant?.leaseEnd),
      lastPaid: fmt(property.tenant?.lastPaymentDate),
      docs: Object.fromEntries(
        (property.documents ?? []).map((d) => [
          d.id,
          {
            issue: fmt(d.issueDate),
            expiry: d.expiryDate ? fmt(d.expiryDate) : null,
          },
        ]),
      ),
    };
  }, [property]);

  // ── Photo upload ──────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !property) return;
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      setUploadingCount((n) => n + arr.length);
      const apiBase = getResolvedApiBaseUrl();

      for (let i = 0; i < arr.length; i++) {
        const file = arr[i];
        try {
          const fd = new FormData();
          fd.append("file", file, file.name);
          fd.append("folder", "properties/photos");
          const token = await getAccessTokenForApiRequest().catch(() => null);
          const headers: Record<string, string> = token
            ? { Authorization: `Bearer ${token}` }
            : {};
          const res = await fetch(`${apiBase}/storage/upload`, {
            method: "POST",
            headers,
            body: fd,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          const data = await res.json();
          if (!data.url) throw new Error("No URL returned");
          const newPhoto: PropertyPhoto = {
            id: `${Date.now()}-${i}`,
            url: data.url,
            filename: file.name,
            isCover: false,
            room: undefined,
          };
          setLocalPhotos((prev) => {
            const updated = [...prev, newPhoto];
            // Auto-set cover if this is the first photo
            if (!updated.some((p) => p.isCover))
              updated[0] = { ...updated[0], isCover: true };
            return updated;
          });
          setHasChanges(true);
        } catch (err: any) {
          setPhotoSaveError(`Upload failed for ${file.name}: ${err.message}`);
          setTimeout(() => setPhotoSaveError(null), 5000);
        } finally {
          setUploadingCount((n) => n - 1);
        }
      }
    },
    [property],
  );

  const removePhoto = useCallback((id: string) => {
    setLocalPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length > 0 && !next.some((p) => p.isCover))
        next[0] = { ...next[0], isCover: true };
      return next;
    });
    setHasChanges(true);
  }, []);

  const setRoom = useCallback((id: string, room: string) => {
    setLocalPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, room: room === "none" ? undefined : room } : p,
      ),
    );
    setHasChanges(true);
  }, []);

  const setCover = useCallback((id: string) => {
    setLocalPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.id === id })));
    setHasChanges(true);
  }, []);

  const savePhotos = useCallback(async () => {
    if (!property) return;
    setIsSavingPhotos(true);
    setPhotoSaveError(null);
    try {
      await updateProperty(property.id, { photos: localPhotos });
      setHasChanges(false);
      skipSyncRef.current = true;
    } catch (err: any) {
      setPhotoSaveError(err?.message || "Failed to save photos");
    } finally {
      setIsSavingPhotos(false);
    }
  }, [property, localPhotos, updateProperty]);

  // Drag-to-reorder
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnter = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setLocalPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDraggedIdx(idx);
    setHasChanges(true);
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!property) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f8fafc", fontFamily: "Nunito Sans,sans-serif" }}
      >
        <div className="text-center space-y-4">
          <p className="text-[#64748b]">Property not found.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-[12px] text-white text-sm font-semibold"
            style={{ background: "#136C9E" }}
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const validPhotos = localPhotos.filter(
    (p) => p?.url && !p.url.startsWith("blob:"),
  );
  const expiredDocCount = (property.documents ?? []).filter(
    (d) => d.status === "expiring-soon" || d.status === "expired",
  ).length;



  // ── Hero photo helpers ────────────────────────────────────────────────────
  const heroPhotos = validPhotos.length > 0 ? validPhotos : [];
  const heroPhoto = heroPhotos[heroIdx] ?? null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#f8fafc", fontFamily: "Nunito Sans,sans-serif" }}
    >
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        className="static md:sticky top-0 z-30 h-[60px] flex items-center justify-between px-6"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
          </button>
          <div>
            <p
              className="text-[14px] font-bold text-[#1e293b] leading-tight"
              style={{ fontFamily: "Archivo,sans-serif" }}
            >
              {property.address}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusPill status={property.status} />
              <span className="text-[12px] text-[#64748b]">
                {fmtType(property.type)}
                {property.bedrooms ? ` · ${property.bedrooms} beds` : ""}
                {typeof (property as any).bathrooms === "number"
                  ? ` · ${(property as any).bathrooms} baths`
                  : ""}
                {typeof (property as any).squareFootage === "number"
                  ? ` · ${(property as any).squareFootage} sq ft`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(property)}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-[9px] text-[12.5px] font-semibold transition-all border border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f1f5f9]"
            style={{ fontFamily: "Archivo,sans-serif" }}
          >
            <Edit3 size={13} /> Edit
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-[9px] border border-[#e2e8f0] bg-white flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[14px] border-[#e2e8f0] p-1.5 min-w-[180px]">
              <DropdownMenuItem
                className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => setActiveTab("photos")}
              >
                <Camera size={14} className="mr-2 text-[#64748b]" /> Manage Photos
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => onManageDocuments()}
              >
                <FileText size={14} className="mr-2 text-[#64748b]" /> Manage Documents
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-[10px] cursor-pointer text-[13px]"
                onSelect={() => updateProperty(property.id, { status: "under-renovation" })}
              >
                <Archive size={14} className="mr-2 text-[#64748b]" /> Mark as Renovation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }}
      />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-[1160px] mx-auto px-6 py-6">

        {/* ── Two-column body ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: hero + tabs ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Hero photo strip */}
            <div>
              {heroPhotos.length > 0 ? (
                <div>
                  <div className="relative w-full rounded-[16px] overflow-hidden bg-[#0f172a] aspect-[16/9] max-h-[340px]">
                    <img
                      src={heroPhoto!.url}
                      alt={heroPhoto!.room ?? "Property"}
                      className="w-full h-full object-contain"
                    />
                    {heroPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setHeroIdx((i) => Math.max(0, i - 1))}
                          disabled={heroIdx === 0}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all disabled:opacity-30"
                        >
                          <ChevronLeft size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroIdx((i) => Math.min(heroPhotos.length - 1, i + 1))}
                          disabled={heroIdx === heroPhotos.length - 1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all disabled:opacity-30"
                        >
                          <ChevronRight size={17} />
                        </button>
                        <span
                          className="absolute bottom-3 right-3 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
                        >
                          {heroIdx + 1} / {heroPhotos.length}
                        </span>
                      </>
                    )}
                  </div>
                  {heroPhotos.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                      {heroPhotos.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setHeroIdx(i)}
                          className="shrink-0 rounded-[10px] overflow-hidden transition-all"
                          style={{
                            width: 72,
                            height: 52,
                            outline: i === heroIdx ? "2.5px solid #136C9E" : "2px solid transparent",
                            opacity: i === heroIdx ? 1 : 0.65,
                          }}
                        >
                          <img src={p.url} alt={p.room ?? `Photo ${i + 1}`} className="w-full h-full object-contain bg-[#0f172a]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-full rounded-[16px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#e2e8f0] cursor-pointer hover:border-[#136C9E] hover:bg-[#f0f8fd] transition-all"
                  style={{ height: "220px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={32} className="text-[#94a3b8]" />
                  <p className="text-[13.5px] font-semibold text-[#64748b]">Click to add photos</p>
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 rounded-[12px] bg-[#f1f5f9]" style={{ width: "fit-content" }}>
              {(
                [
                  { key: "overview" as const, label: "Details" },
                  { key: "documents" as const, label: "Documents", badge: expiredDocCount > 0 ? expiredDocCount : null },
                  { key: "photos" as const, label: `Photos (${validPhotos.length})` },
                ]
              ).map(({ key, label, badge }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-3.5 py-2 rounded-[9px] text-[13px] font-semibold transition-all border-0 outline-none ${
                    activeTab === key
                      ? "bg-white text-[#136C9E] shadow-sm"
                      : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/60"
                  }`}
                >
                  {label}
                  {badge != null && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Details tab ─────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <SCard className="px-5 py-5">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-4" style={{ fontFamily: "Archivo,sans-serif" }}>
                      Basic Information
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <MapPin size={14} className="text-[#94a3b8] shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <BedDouble size={14} className="text-[#94a3b8] shrink-0" />
                        {property.bedrooms} bedroom{property.bedrooms !== 1 ? "s" : ""}
                      </li>
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <Bath size={14} className="text-[#94a3b8] shrink-0" />
                        {typeof (property as any).bathrooms === "number"
                          ? `${(property as any).bathrooms} bathroom${(property as any).bathrooms !== 1 ? "s" : ""}`
                          : "—"}
                      </li>
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <Maximize2 size={14} className="text-[#94a3b8] shrink-0" />
                        {typeof (property as any).squareFootage === "number"
                          ? `${(property as any).squareFootage} sq ft`
                          : "—"}
                      </li>
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <PoundSterling size={14} className="text-[#94a3b8] shrink-0" />
                        £{(property.rent ?? 0).toLocaleString()} per month
                      </li>
                      <li className="flex items-center gap-2.5 text-[13px] text-[#475569]">
                        <Calendar size={14} className="text-[#94a3b8] shrink-0" />
                        Added {dates.createdAt}
                      </li>
                    </ul>
                  </SCard>

                  {/* Amenities + Notes */}
                  <div className="space-y-4">
                    {(property.amenities ?? []).length > 0 && (
                      <SCard className="px-5 py-5">
                        <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3" style={{ fontFamily: "Archivo,sans-serif" }}>
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((a) => (
                            <span
                              key={a}
                              className="text-[12px] font-semibold px-3 py-1 rounded-full capitalize"
                              style={{ background: "#eaf3f8", color: "#136C9E", border: "1px solid rgba(19,108,158,0.15)" }}
                            >
                              {a.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      </SCard>
                    )}
                    {property.notes && (
                      <SCard className="px-5 py-5">
                        <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-2" style={{ fontFamily: "Archivo,sans-serif" }}>
                          Notes
                        </p>
                        <p className="text-[13.5px] text-[#475569] leading-relaxed">{property.notes}</p>
                      </SCard>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Documents tab ────────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <SCard>
                <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <p className="text-[14px] font-bold text-[#1e293b]" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Property Documents
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDocUploadOpen(true)}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] transition-all hover:bg-[#eaf3f8]"
                    style={{ color: "#136C9E", fontFamily: "Archivo,sans-serif" }}
                  >
                    <Plus size={14} /> Upload Document
                  </button>
                </div>
                {(property.documents ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-5">
                    <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4" style={{ background: "#f1f5f9" }}>
                      <FileText size={24} className="text-[#94a3b8]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1e293b] mb-1">No documents yet</p>
                    <p className="text-[13px] text-[#64748b] mb-4">
                      Upload EPC certificates, gas safety checks and tenancy agreements.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDocUploadOpen(true)}
                      className="text-[13px] font-semibold px-4 py-2.5 rounded-[12px] transition-all hover:opacity-90"
                      style={{ background: "#136C9E", color: "white", fontFamily: "Archivo,sans-serif" }}
                    >
                      Upload Documents
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#f1f5f9]">
                    {property.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f8fafc] transition-colors" onClick={() => setSelectedDoc(doc)}>
                        <DocStatusIcon status={doc.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#1e293b] truncate">{doc.name}</p>
                          <p className="text-[11.5px] text-[#64748b]">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                        </div>
                        <div className="text-right text-[11.5px] text-[#94a3b8] shrink-0">
                          <p>Issued {dates.docs[doc.id]?.issue ?? "—"}</p>
                          {doc.expiryDate && <p>Expires {dates.docs[doc.id]?.expiry ?? "—"}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SCard>
            )}

            {/* ── Photos tab ──────────────────────────────────────────────── */}
            {activeTab === "photos" && (
              <div className="space-y-4">
                {photoSaveError && (
                  <div className="flex items-center gap-2 p-3 rounded-[12px] border border-red-200 bg-red-50 text-[13px] text-red-700">
                    <AlertTriangle size={15} className="shrink-0" />
                    {photoSaveError}
                  </div>
                )}

                {/* Upload zone */}
                <SCard>
                  <div
                    className="m-5 border-2 border-dashed rounded-[16px] p-8 text-center cursor-pointer transition-all hover:border-[#136C9E] hover:bg-[#f0f8fd]"
                    style={{ borderColor: "#e2e8f0" }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
                  >
                    {uploadingCount > 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={28} className="text-[#136C9E] animate-spin" />
                        <p className="text-[13px] font-semibold text-[#136C9E]">
                          Uploading {uploadingCount} photo{uploadingCount > 1 ? "s" : ""}…
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto mb-3 text-[#94a3b8]" />
                        <p className="text-[14px] font-semibold text-[#334155]" style={{ fontFamily: "Archivo,sans-serif" }}>
                          Drag & drop or click to upload
                        </p>
                        <p className="text-[12px] text-[#64748b] mt-1">JPG, PNG, HEIC — max 10 MB each</p>
                      </>
                    )}
                  </div>
                </SCard>

                {/* Photo grid */}
                {validPhotos.length === 0 && uploadingCount === 0 ? (
                  <SCard className="flex flex-col items-center py-12 text-center px-5">
                    <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4" style={{ background: "#f1f5f9" }}>
                      <ImageIcon size={24} className="text-[#94a3b8]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#1e293b] mb-1">No photos yet</p>
                    <p className="text-[13px] text-[#64748b]">Properties with photos attract significantly more enquiries.</p>
                  </SCard>
                ) : (
                  <SCard className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[13px] font-bold text-[#1e293b]" style={{ fontFamily: "Archivo,sans-serif" }}>
                        {validPhotos.length} photo{validPhotos.length !== 1 ? "s" : ""}
                        {hasChanges && (
                          <span className="ml-2 text-[11px] text-amber-500 font-semibold">• unsaved changes</span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-[10px] transition-all hover:bg-[#eaf3f8]"
                        style={{ color: "#136C9E", fontFamily: "Archivo,sans-serif" }}
                      >
                        <Plus size={14} /> Add More
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {validPhotos.map((photo, i) => (
                        <div
                          key={photo.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragEnter={(e) => handleDragEnter(e, i)}
                          onDragEnd={() => setDraggedIdx(null)}
                          className="group relative rounded-[12px] overflow-hidden bg-[#f1f5f9] cursor-grab active:cursor-grabbing"
                          style={{ opacity: draggedIdx === i ? 0.5 : 1 }}
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={photo.url}
                              alt={photo.room ?? "Property"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical size={14} className="text-white drop-shadow" />
                            </div>
                            {photo.isCover && (
                              <span
                                className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ background: "#136C9E", fontFamily: "Archivo,sans-serif" }}
                              >
                                <Star size={9} fill="currentColor" /> Cover
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                title="Preview"
                                onClick={(e) => { e.stopPropagation(); setPreviewPhoto(photo); }}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                title="Download"
                                onClick={(e) => { e.stopPropagation(); window.open(photo.url, "_blank", "noopener"); }}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                type="button"
                                title="Remove"
                                onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                                className="w-8 h-8 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center text-white transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="p-2 space-y-1.5 bg-white border-t border-[#f1f5f9]">
                            <Select value={photo.room || "none"} onValueChange={(v: string) => setRoom(photo.id, v)}>
                              <SelectTrigger className="h-7 text-[11px] rounded-[8px] border-[#e2e8f0] px-2">
                                <SelectValue placeholder="Tag room" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No tag</SelectItem>
                                {ROOM_TYPES.map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!photo.isCover && (
                              <button
                                type="button"
                                onClick={() => setCover(photo.id)}
                                className="w-full h-6 text-[10.5px] font-semibold rounded-[8px] border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] flex items-center justify-center gap-1 transition-all"
                              >
                                <Star size={9} /> Set as cover
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SCard>
                )}

                {/* Unsaved changes save bar */}
                {hasChanges && (
                  <div
                    className="flex items-center justify-between p-4 rounded-[16px] border"
                    style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <p className="text-[13px] font-semibold text-amber-800">You have unsaved photo changes</p>
                    </div>
                    <button
                      type="button"
                      onClick={savePhotos}
                      disabled={isSavingPhotos}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                      style={{ background: "#DC5F12", fontFamily: "Archivo,sans-serif" }}
                    >
                      {isSavingPhotos ? (
                        <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      ) : (
                        <><Save size={14} /> Save Photos</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: sidebar ──────────────────────────────────────────── */}
          <div className="w-full lg:w-[300px] shrink-0 space-y-4 lg:sticky lg:top-[68px]">

            {/* Quick Actions */}
            <SCard className="p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                Quick Actions
              </p>
              <div className="space-y-1">
                {[
                  { label: "Edit Property", icon: Edit3, action: () => onEdit(property) },
                  { label: "Manage Photos", icon: Camera, action: () => setActiveTab("photos") },
                  { label: "Manage Documents", icon: FileText, action: onManageDocuments },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#334155] transition-all hover:bg-[#f1f5f9] hover:text-[#136C9E] text-left"
                    style={{ fontFamily: "Archivo,sans-serif" }}
                  >
                    <Icon size={15} className="text-[#64748b] shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </SCard>

            {/* Current Tenant */}
            {(property.status === "occupied" || property.tenant) && property.tenant && (
              <SCard className="overflow-hidden">
                <div className="px-4 py-3.5" style={{ background: "linear-gradient(135deg,#136C9E 0%,#0e5a87 100%)" }}>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-white/70 mb-2" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Current Tenant
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold text-white"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {initials(property.tenant.name ?? "")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-white truncate" style={{ fontFamily: "Archivo,sans-serif" }}>
                        {property.tenant.name}
                      </p>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          property.tenant.paymentStatus === "current"
                            ? "bg-green-400/30 text-green-100"
                            : property.tenant.paymentStatus === "overdue"
                              ? "bg-red-400/30 text-red-100"
                              : "bg-amber-400/30 text-amber-100"
                        }`}
                      >
                        {property.tenant.paymentStatus === "current"
                          ? "✓ Up to date"
                          : property.tenant.paymentStatus === "overdue"
                            ? "⚠ Overdue"
                            : "Payment plan"}
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
                  {dates.leaseEnd !== "—" && (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#475569]">
                      <Calendar size={13} className="text-[#94a3b8] shrink-0" />
                      Lease until {dates.leaseEnd}
                    </div>
                  )}
                  {property.tenant.paymentStatus === "overdue" && (property.tenant as any).overdueAmount && (
                    <div className="flex items-start gap-2 p-2.5 rounded-[10px] bg-red-50 border border-red-200">
                      <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-red-700">
                          £{(property.tenant as any).overdueAmount.toLocaleString()} overdue
                        </p>
                        {dates.lastPaid !== "—" && (
                          <p className="text-[11px] text-red-500">Last paid {dates.lastPaid}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-1">
                    {onViewTenant && property.tenant.id && (
                      <button
                        type="button"
                        onClick={() => onViewTenant(property.tenant!.id)}
                        className="w-full h-9 rounded-[10px] border border-[#e2e8f0] flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-all"
                        style={{ fontFamily: "Archivo,sans-serif" }}
                      >
                        <Eye size={13} /> View Tenant Details
                      </button>
                    )}
                    <div className="flex gap-2">
                      {onChangeTenant && property.tenant.id && (
                        <button
                          type="button"
                          onClick={() => setShowChangeTenantDialog(true)}
                          className="flex-1 h-9 rounded-[10px] border border-[#e2e8f0] flex items-center justify-center gap-1 text-[12px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-all"
                          style={{ fontFamily: "Archivo,sans-serif" }}
                        >
                          <UserCheck size={13} /> Change
                        </button>
                      )}
                      {onRemoveTenant && property.tenant.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${property.tenant?.name} from this property?`)) {
                              onRemoveTenant(property.tenant!.id, property.id);
                            }
                          }}
                          className="flex-1 h-9 rounded-[10px] border flex items-center justify-center gap-1 text-[12px] font-semibold transition-all hover:bg-red-50"
                          style={{ borderColor: "#fca5a5", color: "#dc2626", fontFamily: "Archivo,sans-serif" }}
                        >
                          <UserX size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </SCard>
            )}

            {/* Vacant card */}
            {property.status === "vacant" && !property.tenant && (
              <SCard className="p-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3" style={{ background: "#f1f5f9" }}>
                    <User size={22} className="text-[#94a3b8]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1e293b] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Property is Vacant
                  </p>
                  <p className="text-[12.5px] text-[#64748b] mb-4">Ready to welcome a new tenant.</p>
                  {onAddTenant && (
                    <button
                      type="button"
                      onClick={onAddTenant}
                      className="w-full h-[42px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 mb-2"
                      style={{ background: "#DC5F12", fontFamily: "Archivo,sans-serif", boxShadow: "0 3px 10px rgba(220,95,18,0.25)" }}
                    >
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
                          {availableTenants.map((t) => (
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
            {property.status === "under-renovation" && (
              <SCard className="p-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3" style={{ background: "#fef9c3" }}>
                    <Clock size={22} className="text-amber-500" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1e293b] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Under Renovation
                  </p>
                  <p className="text-[12.5px] text-[#64748b]">Not available for tenants until works complete.</p>
                </div>
              </SCard>
            )}

            {/* Compliance Status */}
            <SCard className="p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                Compliance Status
              </p>
              {(property.documents ?? []).length === 0 ? (
                <p className="text-[12.5px] text-[#64748b] leading-relaxed">
                  No documents uploaded.{" "}
                  <button
                    type="button"
                    onClick={() => setIsDocUploadOpen(true)}
                    className="underline text-[#136C9E] font-semibold"
                  >
                    Upload compliance documents
                  </button>{" "}
                  to track their status.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {property.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between">
                      <span className="text-[12.5px] text-[#334155] truncate">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <DocStatusIcon status={doc.status} />
                        <span className="text-[11.5px] text-[#64748b] capitalize">{doc.status.replace("-", " ")}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SCard>

            {/* Property Summary */}
            <SCard className="p-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-3 px-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                Property Summary
              </p>
              <ul className="space-y-2.5">
                {[
                  ["Type", fmtType(property.type)],
                  ["Bedrooms", String(property.bedrooms)],
                  ["Bathrooms", typeof (property as any).bathrooms === "number" ? String((property as any).bathrooms) : "—"],
                  ["Square footage", typeof (property as any).squareFootage === "number" ? `${(property as any).squareFootage} sq ft` : "—"],
                  ["Monthly rent", `£${(property.rent ?? 0).toLocaleString()}`],
                  ["Photos", String(validPhotos.length)],
                  ["Documents", String((property.documents ?? []).length)],
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

      {/* ── Document Details Drawer ─────────────────────────────────────── */}
      {selectedDoc && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setSelectedDoc(null)}
          />
          {/* Panel */}
          <aside
            className="fixed right-0 top-0 h-full z-50 w-[340px] max-w-full flex flex-col"
            style={{
              background: "white",
              borderLeft: "1px solid #e2e8f0",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <p
                className="text-[15px] font-bold text-[#1e293b] truncate"
                style={{ fontFamily: "Archivo,sans-serif" }}
              >
                {selectedDoc.name}
              </p>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Document Type
                </p>
                <p className="text-[13.5px] text-[#334155]">{DOC_TYPE_LABELS[selectedDoc.type] ?? selectedDoc.type}</p>
              </div>
              {/* Status */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1.5" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Status
                </p>
                <span className="inline-flex items-center gap-1.5">
                  <DocStatusIcon status={selectedDoc.status} />
                  <span className="text-[13px] text-[#334155] capitalize">{selectedDoc.status.replace("-", " ")}</span>
                </span>
              </div>
              {/* Issued date */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Issued
                </p>
                <p className="text-[13.5px] text-[#334155]">{dates.docs[selectedDoc.id]?.issue ?? "—"}</p>
              </div>
              {/* Expiry date (if present) */}
              {selectedDoc.expiryDate && (
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Expires
                  </p>
                  <p className="text-[13.5px] text-[#334155]">{dates.docs[selectedDoc.id]?.expiry ?? "—"}</p>
                </div>
              )}
            </div>
            {/* Footer — download */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                onClick={() => window.open(selectedDoc.url, "_blank", "noopener")}
                className="w-full h-[44px] rounded-[12px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "#136C9E", color: "white", fontFamily: "Archivo,sans-serif" }}
              >
                <Download size={16} /> Download Document
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Document Upload Modal ────────────────────────────────────────── */}
      <DocumentUploadModal
        isOpen={isDocUploadOpen}
        isUploading={isUploadingDoc}
        uploadError={docUploadError}
        onClose={() => { setIsDocUploadOpen(false); setDocUploadError(null); }}
        onUpload={handleDocUpload}
      />

      {/* ── Change Tenant Dialog ─────────────────────────────────────────── */}
      <Dialog open={showChangeTenantDialog} onOpenChange={setShowChangeTenantDialog}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Archivo,sans-serif" }}>Change Tenant</DialogTitle>
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
                  swappableTenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.propertyId === property.id ? " (current)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => { setShowChangeTenantDialog(false); setNewTenantId(""); }}
              className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newTenantId}
              onClick={() => {
                if (newTenantId && onChangeTenant) {
                  onChangeTenant(property.id, newTenantId);
                  setShowChangeTenantDialog(false);
                  setNewTenantId("");
                }
              }}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "#136C9E", fontFamily: "Archivo,sans-serif" }}
            >
              Confirm Change
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Photo preview lightbox ──────────────────────────────────────── */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl rounded-[20px] p-0 overflow-hidden">
          {previewPhoto && (
            <div className="relative bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.filename}
                className="w-full max-h-[70vh] object-contain"
              />
              <div
                className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}
              >
                <div className="text-white">
                  <p className="text-[13px] font-semibold">{previewPhoto.filename}</p>
                  {previewPhoto.room && <p className="text-[11px] text-white/70">{previewPhoto.room}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => window.open(previewPhoto.url, "_blank", "noopener")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PropertyDetails;
