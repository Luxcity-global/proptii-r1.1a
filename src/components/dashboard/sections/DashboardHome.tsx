import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Home,
  User,
} from 'lucide-react';
import ReferencingModal from '../../ReferencingModalLegacy';
import { firestoreService } from '../../../services/firestoreService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSavedProperties, SavedProperty } from '../../../contexts/SavedPropertiesContext';
import { fileService, FileItem } from '../../../services/fileService';
import { contractService } from '../../../services/contractService';
import { useSignedContracts } from '../../../contexts/SignedContractsContext';
import { viewingService, ViewingStats, ViewingBooking } from '../../../services/viewingService';
import FilePreviewModal from './FilePreviewModal';
import { trackEvent } from '../../../utils/analytics';
import AgentQuotaWidget from '../AgentQuotaWidget';
import TenantPageHeader from '../ui/TenantPageHeader';
import '../../../styles/tenantDashboard.css';

const REF_PILLARS = [
  { key: 'identity', step: 1, label: 'IDENTITY', nextLabel: 'Fill in your identity details' },
  { key: 'employment', step: 2, label: 'WORK', nextLabel: 'Fill in your employment details' },
  { key: 'residential', step: 3, label: 'ADDRESS', nextLabel: 'Fill in your address details' },
  { key: 'financial', step: 4, label: 'FINANCE', nextLabel: 'Fill in your financial details' },
  { key: 'guarantor', step: 5, label: 'GUARANTOR', nextLabel: 'Fill in your guarantor details' },
] as const;

type PropertyFilter = 'all' | 'latest' | 'highest' | 'lowest';

function displayName(user: { name?: string; givenName?: string; familyName?: string; email?: string } | null): string {
  if (!user) return 'there';
  if (user.name?.trim()) return user.name.trim();
  const joined = [user.givenName, user.familyName].filter(Boolean).join(' ').trim();
  if (joined) return joined;
  return user.email?.split('@')[0] || 'there';
}

function parseLeaseAmount(price: string): number {
  const n = Number(String(price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatLeasePrice(price: string): string {
  const amount = parseLeaseAmount(price);
  if (amount > 0) return `£${amount.toLocaleString()}`;
  const raw = String(price || '').trim();
  return raw || '—';
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

function formatViewingDateTime(date: string, time: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return time ? `${date} at ${time}` : date;
  const stamped = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return time ? `${stamped} at ${time}` : stamped;
}

function viewingAddress(booking: ViewingBooking): string {
  return [booking.property?.street, booking.property?.town, booking.property?.city, booking.property?.postcode]
    .filter(Boolean)
    .join(', ') || 'Property viewing';
}

function fileExtLabel(file: FileItem): { label: string; tone: 'blue' | 'orange' | 'red' | 'green' } {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (file.type === 'application/pdf' || extension === 'pdf') return { label: 'PDF', tone: 'red' };
  if (['xls', 'xlsx', 'csv'].includes(extension)) return { label: 'XLS', tone: 'green' };
  if (['doc', 'docx'].includes(extension)) return { label: 'DOC', tone: 'blue' };
  if (['txt', 'rtf'].includes(extension)) return { label: 'TXT', tone: 'orange' };
  if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return { label: 'IMG', tone: 'blue' };
  }
  return { label: (extension || 'FILE').slice(0, 4).toUpperCase(), tone: 'orange' };
}

function truncateName(name: string, max = 14): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { savedProperties } = useSavedProperties();
  const { signedContracts } = useSignedContracts();

  const [isReferencingModalOpen, setIsReferencingModalOpen] = useState(false);
  const [referencingStep, setReferencingStep] = useState(1);
  const selectedPropertyId = user?.id ? `general_${user.id}` : null;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [referencingFiles, setReferencingFiles] = useState<FileItem[]>([]);
  const [contractFiles, setContractFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewingStats, setViewingStats] = useState<ViewingStats>({
    upcoming: 0,
    completed: 0,
    rescheduled: 0,
    total: 0,
  });
  const [upcomingViewings, setUpcomingViewings] = useState<ViewingBooking[]>([]);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [referencingStartedAt, setReferencingStartedAt] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [docOffset, setDocOffset] = useState(0);
  const [imageIndexById, setImageIndexById] = useState<Record<string, number>>({});
  const [donutHover, setDonutHover] = useState<'completed' | 'upcoming' | null>(null);

  const userId = user?.id ?? null;
  const welcomeName = displayName(user);

  React.useEffect(() => {
    trackEvent('tenant_dashboard_home_view', {
      user_id_present: Boolean(userId),
    });
  }, [userId]);

  React.useEffect(() => {
    if (location.hash !== '#tenant-insights') return;
    const el = document.getElementById('tenant-insights');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  React.useEffect(() => {
    loadFiles();
    loadViewingStats();
    loadUpcomingViewings();
  }, [user?.id]);

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      fileService.setCurrentUser(user?.id || null);
      const loadedFiles = await fileService.getFiles();
      setFiles(loadedFiles);
      if (user?.id) {
        await loadReferencingFiles();
        await loadContractFiles();
      }
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const loadReferencingFiles = async () => {
    try {
      if (!user?.id) return;
      const propertyId = `general_${user.id}`;
      const result = await firestoreService.getReferencingForm(user.id, propertyId);
      if (result.success && result.data) {
        const referencingFilesList: FileItem[] = [];
        const formData = result.data.formData;
        const sections = [
          { section: 'identity', field: 'identityProof', category: 'Identity' },
          { section: 'employment', field: 'proofDocument', category: 'Employment' },
          { section: 'residential', field: 'proofDocument', category: 'Residential' },
          { section: 'financial', field: 'proofOfIncomeDocument', category: 'Financial' },
          { section: 'guarantor', field: 'identityDocument', category: 'Guarantor' },
        ];
        sections.forEach(({ section, field, category }) => {
          const sectionData = (formData as Record<string, any>)[section];
          if (sectionData && sectionData[field]) {
            const document = sectionData[field];
            if (document && (document.name || document.url || document.dataUrl) && (document.dataUrl || document.url)) {
              referencingFilesList.push({
                id: Date.now() + Math.random(),
                name: document.name || `${category} Document`,
                category,
                type: document.type || 'application/pdf',
                size: document.size || 0,
                uploadDate: new Date(document.lastModified || Date.now()).toLocaleDateString(),
                url: document.dataUrl || document.url,
              });
            }
          }
        });
        setReferencingFiles(referencingFilesList);
      }
    } catch (error) {
      console.error('Error loading referencing files:', error);
    }
  };

  const loadContractFiles = async () => {
    try {
      if (!user?.id) return;
      const result = await contractService.getUserContractTemplates(user.id);
      if (result.success && result.templates) {
        const contractFilesList: FileItem[] = result.templates.map((contract, index) => ({
          id: Date.now() + Math.random() + index as number,
          name: contract.name,
          category: 'Contracts',
          type: contract.fileType,
          size: contract.fileSize,
          uploadDate: contract.uploadDate,
          url: contract.fileUrl || `data:${contract.fileType};base64,${contract.fileData}`,
          firestoreId: contract.id,
        }));
        setContractFiles(contractFilesList);
      }
    } catch (error) {
      console.error('Error loading contract files:', error);
    }
  };

  const loadViewingStats = async () => {
    try {
      if (!user?.id) return;
      const result = await viewingService.getViewingStats(user.id);
      if (result.success && result.stats) {
        setViewingStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading viewing stats:', error);
    }
  };

  const loadUpcomingViewings = async () => {
    try {
      if (!user?.id) return;
      const result = await viewingService.getUserViewingBookings(user.id);
      if (result.success && result.bookings) {
        const upcoming = result.bookings
          .filter((b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'rescheduled')
          .sort((a, b) => {
            const da = new Date(`${a.viewingDetails?.date || ''} ${a.viewingDetails?.time || ''}`).getTime();
            const db = new Date(`${b.viewingDetails?.date || ''} ${b.viewingDetails?.time || ''}`).getTime();
            return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
          });
        setUpcomingViewings(upcoming);
      }
    } catch (error) {
      console.error('Error loading viewings:', error);
    }
  };

  const handleView = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await fileService.downloadFile(file);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const REFERENCING_STEPS = [1, 2, 3, 4, 5] as const;
  const totalSections = REFERENCING_STEPS.length;
  const completedCount = completedSections.size;
  const allCompleted = completedCount === totalSections;
  const referencingPercent = Math.round((completedCount / totalSections) * 100);
  const referencingStarted = Boolean(referencingStartedAt) || completedCount > 0;

  React.useEffect(() => {
    const loadFormStatus = async () => {
      if (!userId || !selectedPropertyId) return;
      try {
        const firestoreResult = await firestoreService.getReferencingForm(userId, selectedPropertyId);
        if (firestoreResult.success && firestoreResult.data) {
          const formData = firestoreResult.data.formData;
          const createdAt = (firestoreResult.data as any).createdAt;
          if (createdAt) {
            const ts = createdAt?.toDate?.() ?? createdAt?._seconds
              ? new Date(createdAt._seconds * 1000)
              : typeof createdAt === 'string' ? new Date(createdAt) : null;
            if (ts) setReferencingStartedAt(ts.toISOString());
          }

          const completed = new Set<string>();
          if (formData.identity?.firstName && formData.identity?.lastName && formData.identity?.email) {
            completed.add('identity');
          }
          if (formData.employment?.employmentStatus) {
            completed.add('employment');
          }
          if (formData.residential?.currentAddress) {
            completed.add('residential');
          }
          if (formData.financial?.proofOfIncomeType?.trim()) {
            completed.add('financial');
          }
          if (
            formData.guarantor?.firstName?.trim() &&
            formData.guarantor?.lastName?.trim() &&
            formData.guarantor?.email?.trim()
          ) {
            completed.add('guarantor');
          }
          setCompletedSections(completed);
        }
      } catch (error) {
        console.error('Error loading referencing form status:', error);
      }
    };

    loadFormStatus();
  }, [userId, selectedPropertyId, isReferencingModalOpen]);

  const openReferencingModal = (step: number) => {
    setReferencingStep(step);
    setIsReferencingModalOpen(true);
    trackEvent('tenant_dashboard_referencing_step_opened', { step });
  };

  const closeReferencingModal = () => {
    setIsReferencingModalOpen(false);
  };

  const nextPillar = REF_PILLARS.find((p) => !completedSections.has(p.key));

  const allFiles = [...files, ...referencingFiles, ...contractFiles];
  const recentFiles = useMemo(
    () =>
      [...allFiles]
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()),
    [files, referencingFiles, contractFiles]
  );

  const visibleDocs = recentFiles.length
    ? Array.from({ length: Math.min(4, recentFiles.length) }, (_, i) => recentFiles[(docOffset + i) % recentFiles.length])
    : [];

  const filteredProperties = useMemo(() => {
    const list = [...savedProperties];
    if (propertyFilter === 'latest') {
      list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } else if (propertyFilter === 'highest') {
      list.sort((a, b) => parseLeaseAmount(b.price) - parseLeaseAmount(a.price));
    } else if (propertyFilter === 'lowest') {
      list.sort((a, b) => parseLeaseAmount(a.price) - parseLeaseAmount(b.price));
    }
    return list.slice(0, 3);
  }, [savedProperties, propertyFilter]);

  const latestSavedId = useMemo(() => {
    if (!savedProperties.length) return null;
    return [...savedProperties].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0]?.id;
  }, [savedProperties]);

  const highestLeaseId = useMemo(() => {
    if (!savedProperties.length) return null;
    return [...savedProperties].sort((a, b) => parseLeaseAmount(b.price) - parseLeaseAmount(a.price))[0]?.id;
  }, [savedProperties]);

  const openSavedProperty = (property: SavedProperty) => {
    if (property.id) {
      navigate(`/search?propertyId=${encodeURIComponent(property.id)}`);
      return;
    }
    navigate('/dashboard/saved-searches');
  };

  const cyclePropertyImage = (property: SavedProperty) => {
    const count = property.imageUrls?.length || 0;
    if (count < 2) return;
    setImageIndexById((prev) => ({
      ...prev,
      [property.id]: ((prev[property.id] || 0) + 1) % count,
    }));
  };

  const viewingTotal = viewingStats.total || 0;
  const viewingCompleted = viewingStats.completed || 0;
  const viewingUpcoming = viewingStats.upcoming || 0;
  const completedPct = viewingTotal ? viewingCompleted / viewingTotal : 0;
  const circ = 2 * Math.PI * 72;
  const completedLen = circ * completedPct;
  const upcomingLen = circ - completedLen;

  const listedViewings = upcomingViewings.slice(0, 2);
  const contractAlerts = signedContracts.slice(0, 3);

  const isGloballyEmpty =
    savedProperties.length === 0 &&
    allFiles.length === 0 &&
    viewingTotal === 0 &&
    signedContracts.length === 0 &&
    !referencingStarted &&
    !filesLoading;

  const scrollToInsights = () => {
    const el = document.getElementById('tenant-insights');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="tn-dash">
      <TenantPageHeader
        title={<>Welcome, <span>{welcomeName}</span></>}
        subtitle="Here's the latest update on your portfolio today."
        primaryLabel="Find Listing"
        primaryIcon={<Search size={16} strokeWidth={2.5} />}
        onPrimary={() => navigate('/search')}
        onInsights={isGloballyEmpty ? () => navigate('/dashboard/tenant-referencing') : scrollToInsights}
      />

      <div className="tn-dash-body">
        <div className="tn-dash-quota">
          <AgentQuotaWidget />
        </div>

        {isGloballyEmpty ? (
          <div className="tn-dash-empty-global">
            <div className="tn-dash-empty-global-icon">
              <Home size={36} />
            </div>
            <h2>Welcome to your Tenant Portfolio!</h2>
            <p>
              You don't have any active tenancies or saved listings yet. Explore available listings or complete your
              referencing profile to start managing your tenancies.
            </p>
            <div className="tn-dash-empty-global-actions">
              <button type="button" className="tn-dash-empty-btn primary" onClick={() => navigate('/search')}>
                Explore Properties
              </button>
              <button type="button" className="tn-dash-empty-btn" onClick={() => openReferencingModal(1)}>
                Resume Referencing
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="tn-dash-top">
              <div className="tn-dash-stat tn-dash-profile">
                {user ? (
                  <>
                    <div className="tn-dash-profile-info">
                      <div className="tn-dash-avatar-wrap">
                        <div className="tn-dash-avatar">
                          <User size={28} />
                        </div>
                        <div className="tn-dash-avatar-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                      <h3>{welcomeName}</h3>
                      {user.email && <div className="tn-dash-profile-email">{user.email}</div>}
                      {user.phone && <div className="tn-dash-profile-phone">{user.phone}</div>}
                    </div>
                    <div className="tn-dash-pills">
                      <div className="tn-dash-pill">
                        <span className="tn-dash-pill-icon">
                          <Home size={20} />
                        </span>
                        <div>
                          <div className="tn-dash-pill-label">Saved Listings</div>
                          <div className="tn-dash-pill-val">{savedProperties.length}</div>
                        </div>
                      </div>
                      <div className="tn-dash-pill">
                        <span className="tn-dash-pill-icon is-pink">
                          <FileText size={20} />
                        </span>
                        <div>
                          <div className="tn-dash-pill-label">Contracts</div>
                          <div className="tn-dash-pill-val">{signedContracts.length}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="tn-dash-empty">
                    <div className="tn-dash-empty-icon">
                      <User size={22} />
                    </div>
                    <div className="tn-dash-empty-title">No Active Tenant</div>
                    <div className="tn-dash-empty-desc">Sign in to view your profile and saved listings.</div>
                  </div>
                )}
              </div>

              <div className="tn-dash-stat tn-dash-ref" id="tenant-insights" style={{ scrollMarginTop: 96 }}>
                {referencingStarted ? (
                  <>
                    <div>
                      <div className="tn-dash-ref-head">
                        <div className="label">REFERENCING SUMMARY</div>
                        <div className="tn-dash-ref-badge" title="Referencing Status">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="14" y2="12" />
                            <line x1="4" y1="18" x2="18" y2="18" />
                          </svg>
                        </div>
                      </div>
                      <div className="tn-dash-ref-score">
                        <div className="tn-dash-ref-pct">
                          {referencingPercent}<span>%</span>
                        </div>
                        <div className="tn-dash-ref-sub">{completedCount} out of {totalSections} completed</div>
                      </div>
                      <div className="tn-dash-ref-track">
                        <div className="tn-dash-ref-fill" style={{ width: `${referencingPercent}%` }} />
                      </div>
                      <div className="tn-dash-ref-pills">
                        {REF_PILLARS.map((pillar) => {
                          const complete = completedSections.has(pillar.key);
                          const isNext = nextPillar?.key === pillar.key;
                          const state = complete ? 'completed' : isNext ? 'active' : 'pending';
                          return (
                            <button
                              key={pillar.key}
                              type="button"
                              className={`tn-dash-ref-pill ${state}`}
                              onClick={() => openReferencingModal(pillar.step)}
                            >
                              <span>
                                {complete ? (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : isNext ? (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" fill="#2563eb" />
                                  </svg>
                                ) : (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="9" />
                                  </svg>
                                )}
                              </span>
                              {pillar.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tn-dash-ref-cta"
                      onClick={() => (allCompleted ? navigate('/dashboard/tenant-referencing') : openReferencingModal(nextPillar?.step || 1))}
                    >
                      <span>
                        {allCompleted
                          ? 'View referencing passport'
                          : `Next: ${nextPillar?.nextLabel || 'Continue referencing'}`}
                      </span>
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </>
                ) : (
                  <div className="tn-dash-empty">
                    <div className="tn-dash-empty-icon">
                      <FileText size={22} />
                    </div>
                    <div className="tn-dash-empty-title">No Referencing Underway</div>
                    <div className="tn-dash-empty-desc">You haven't begun referencing yet. Start your application to qualify for tenancies.</div>
                    <button type="button" className="tn-dash-empty-btn" onClick={() => openReferencingModal(1)}>
                      Start Referencing
                    </button>
                  </div>
                )}
              </div>

              <div className="tn-dash-stat tn-dash-viewings-card">
                {viewingTotal > 0 ? (
                  <>
                    <div>
                      <div className="tn-dash-occ-head">
                        <span className="label">VIEWINGS</span>
                        <div className="tn-dash-occ-badge" title="Viewings Overview">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                      </div>
                      <div className="tn-dash-occ-body">
                        <div
                          className="tn-dash-donut"
                          onClick={() => navigate('/dashboard/viewings')}
                          onMouseEnter={() => setDonutHover('completed')}
                          onMouseLeave={() => setDonutHover(null)}
                        >
                          <div className="tn-dash-donut-tip">
                            {donutHover === 'upcoming'
                              ? `Upcoming: ${viewingUpcoming} viewings`
                              : `Completed: ${viewingCompleted} viewings`}
                          </div>
                          <svg viewBox="0 0 200 200">
                            <circle
                              cx="100"
                              cy="100"
                              r="72"
                              fill="none"
                              stroke="#165c40"
                              strokeWidth="38"
                              strokeLinecap="round"
                              strokeDasharray={`${completedLen} ${circ}`}
                              transform="rotate(-90 100 100)"
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="72"
                              fill="none"
                              stroke="#f2fbf7"
                              strokeWidth="38"
                              strokeLinecap="round"
                              strokeDasharray={`${upcomingLen} ${circ}`}
                              strokeDashoffset={-completedLen}
                              transform="rotate(-90 100 100)"
                            />
                          </svg>
                        </div>
                        <div className="tn-dash-occ-meta">
                          <span className="meta-label">Total Viewings</span>
                          <span className="meta-val">{viewingTotal}</span>
                        </div>
                      </div>
                    </div>
                    <div className="tn-dash-occ-legend">
                      <div className="tn-dash-legend-item">
                        <span className="tn-dash-legend-box completed" />
                        <span>Completed - {viewingCompleted}</span>
                      </div>
                      <div
                        className="tn-dash-legend-item"
                        onMouseEnter={() => setDonutHover('upcoming')}
                        onMouseLeave={() => setDonutHover(null)}
                      >
                        <span className="tn-dash-legend-box upcoming" />
                        <span>Upcoming - {viewingUpcoming}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="tn-dash-empty">
                    <div className="tn-dash-empty-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="tn-dash-empty-title">No Viewings Recorded</div>
                    <div className="tn-dash-empty-desc">Book your first property viewing to see scheduling metrics.</div>
                    <button type="button" className="tn-dash-empty-btn" onClick={() => navigate('/search')}>
                      Book a Viewing
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="tn-dash-mid">
              <div className="tn-dash-mid-left">
                <div className="tn-dash-box">
                  {recentFiles.length > 0 ? (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Your Documents</h3>
                        <button type="button" className="tn-dash-link" onClick={() => navigate('/dashboard/your-files')}>
                          View all
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="tn-dash-docs">
                        {visibleDocs.map((file) => {
                          const kind = fileExtLabel(file);
                          return (
                            <button
                              key={file.id}
                              type="button"
                              className="tn-dash-doc"
                              onClick={() => handleView(file)}
                            >
                              <div className={`tn-dash-doc-icon ${kind.tone}`}>{kind.label}</div>
                              <div className="tn-dash-doc-info">
                                <div className="tn-dash-doc-name">{truncateName(file.name)}</div>
                                <div className="tn-dash-doc-meta">
                                  {kind.label} · {fileService.formatFileSize(file.size || 0)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {recentFiles.length > 4 && (
                          <button
                            type="button"
                            className="tn-dash-carousel-btn"
                            title="Next Document"
                            onClick={() => setDocOffset((prev) => (prev + 1) % recentFiles.length)}
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Your Documents</h3>
                      </div>
                      <div className="tn-dash-empty" style={{ padding: '24px 16px', minHeight: 140 }}>
                        <div className="tn-dash-empty-icon">
                          <FileText size={22} />
                        </div>
                        <div className="tn-dash-empty-title">No documents uploaded yet</div>
                        <div className="tn-dash-empty-desc">Upload identity papers, agreements, or referencing receipts.</div>
                        <button type="button" className="tn-dash-empty-btn primary" onClick={() => navigate('/dashboard/your-files')}>
                          + Upload Document
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="tn-dash-box">
                  {savedProperties.length > 0 ? (
                    <>
                      <div className="tn-dash-props-head">
                        <h2>Properties</h2>
                        <button type="button" className="tn-dash-link" onClick={() => navigate('/dashboard/saved-searches')}>
                          View Saved Listings
                          <ExternalLink size={14} />
                        </button>
                      </div>
                      <div className="tn-dash-filters">
                        {([
                          ['all', 'All listings'],
                          ['latest', 'Latest Save'],
                          ['highest', 'Highest Lease'],
                          ['lowest', 'Lowest Lease'],
                        ] as const).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            className={`tn-dash-filter${propertyFilter === id ? ' active' : ''}`}
                            onClick={() => setPropertyFilter(id)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="tn-dash-prop-grid">
                        {filteredProperties.map((property) => {
                          const imgIndex = imageIndexById[property.id] || 0;
                          const images = property.imageUrls?.length ? property.imageUrls : [];
                          const src = images[imgIndex] || images[0];
                          const badge =
                            property.id === latestSavedId
                              ? { cls: 'latest', label: 'Latest' }
                              : property.id === highestLeaseId
                                ? { cls: 'highest', label: 'Highest Lease' }
                                : null;
                          return (
                            <article key={property.id} className="tn-dash-prop">
                              <div className="tn-dash-prop-img">
                                {src ? (
                                  <img src={src} alt={property.title} />
                                ) : (
                                  <div className="tn-dash-prop-placeholder">
                                    <Home size={28} />
                                  </div>
                                )}
                                {badge && (
                                  <div className={`tn-dash-badge ${badge.cls}`}>
                                    <span className="tn-dash-badge-dot" />
                                    {badge.label}
                                  </div>
                                )}
                                {images.length > 1 && (
                                  <div className="tn-dash-dots">
                                    {images.slice(0, 4).map((_, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        className={`tn-dash-dot${i === imgIndex ? ' active' : ''}`}
                                        onClick={() => setImageIndexById((prev) => ({ ...prev, [property.id]: i }))}
                                        aria-label={`Photo ${i + 1}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="tn-dash-prop-body">
                                <div className="tn-dash-price-row">
                                  <div className="tn-dash-price">
                                    {formatLeasePrice(property.price)} <span>/ month</span>
                                  </div>
                                  <div className="tn-dash-ago">{timeAgo(property.savedAt)}</div>
                                </div>
                                <div className="tn-dash-prop-name">{property.title}</div>
                                <div className="tn-dash-prop-addr">{property.location}</div>
                                <div className="tn-dash-specs">
                                  {property.bedrooms && (
                                    <div className="tn-dash-spec">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                        <path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                                        <line x1="2" y1="20" x2="22" y2="20" />
                                      </svg>
                                      {String(property.bedrooms).toLowerCase().includes('bed')
                                        ? property.bedrooms
                                        : `${property.bedrooms} Bedrooms`}
                                    </div>
                                  )}
                                  {property.propertyType && (
                                    <div className="tn-dash-spec">
                                      <Home size={14} />
                                      {property.propertyType}
                                    </div>
                                  )}
                                </div>
                                {property.propertyType && (
                                  <div className="tn-dash-tags">
                                    <span className="tn-dash-tag">{property.propertyType}</span>
                                  </div>
                                )}
                                <div className="tn-dash-prop-actions">
                                  <button type="button" className="tn-dash-view-btn" onClick={() => openSavedProperty(property)}>
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    className="tn-dash-icon-sq"
                                    title="Photos"
                                    onClick={() => cyclePropertyImage(property)}
                                  >
                                    <ImageIcon size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="tn-dash-icon-sq"
                                    title="Documents"
                                    onClick={() => navigate('/dashboard/your-files')}
                                  >
                                    <FileText size={15} />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tn-dash-props-head">
                        <h2>Properties</h2>
                      </div>
                      <div className="tn-dash-empty" style={{ padding: '40px 16px' }}>
                        <div className="tn-dash-empty-icon">
                          <Home size={22} />
                        </div>
                        <div className="tn-dash-empty-title">No saved properties found</div>
                        <div className="tn-dash-empty-desc">You haven't bookmarked any listings yet. Browse available homes to save them here.</div>
                        <button type="button" className="tn-dash-empty-btn primary" onClick={() => navigate('/search')}>
                          Find Properties
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="tn-dash-mid-right">
                <div className="tn-dash-box">
                  {listedViewings.length > 0 ? (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Viewings</h3>
                        <button type="button" className="tn-dash-link" onClick={() => navigate('/dashboard/viewings')}>
                          See all
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="tn-dash-viewings-list">
                        {listedViewings.map((booking) => (
                          <div key={booking.id} className="tn-dash-viewing">
                            <div className="tn-dash-viewing-thumb">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <div className="tn-dash-viewing-details">
                              <div className="tn-dash-viewing-dt">
                                {formatViewingDateTime(booking.viewingDetails?.date, booking.viewingDetails?.time)}
                              </div>
                              <div className="tn-dash-viewing-addr">{viewingAddress(booking)}</div>
                              <div className="tn-dash-viewing-actions">
                                <button type="button" className="tn-dash-pill-btn" onClick={() => navigate('/dashboard/viewings')}>
                                  Reschedule
                                </button>
                                <button type="button" className="tn-dash-pill-btn cancel" onClick={() => navigate('/dashboard/viewings')}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Viewings</h3>
                      </div>
                      <div className="tn-dash-empty" style={{ padding: '24px 16px', minHeight: 140 }}>
                        <div className="tn-dash-empty-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div className="tn-dash-empty-title">No viewings booked</div>
                        <div className="tn-dash-empty-desc">Schedule a visit to see homes in person.</div>
                        <button type="button" className="tn-dash-empty-btn primary" onClick={() => navigate('/search')}>
                          Book a Viewing
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="tn-dash-box">
                  {contractAlerts.length > 0 ? (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Contract Alerts</h3>
                        <button type="button" className="tn-dash-link" onClick={() => navigate('/dashboard/tenant-contracts')}>
                          See all
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="tn-dash-alerts">
                        {contractAlerts.map((contract: any) => {
                          const status = String(contract.status || 'signed').toLowerCase();
                          const theme = status === 'signed' ? 'green' : status === 'sent' || status === 'delivered' ? 'yellow' : 'green';
                          const title = status === 'signed' ? 'Signed' : status === 'sent' ? 'Sent' : status === 'delivered' ? 'Delivered' : 'Contract';
                          return (
                            <div key={contract.id} className={`tn-dash-alert ${theme}`}>
                              <div className="tn-dash-alert-icon">
                                {theme === 'green' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <polyline points="9 12 11 14 15 10" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                  </svg>
                                )}
                              </div>
                              <div className="tn-dash-alert-body">
                                <div className="tn-dash-alert-title">{title}</div>
                                <div className="tn-dash-alert-desc">
                                  {contract.documentName || contract.propertyName || contract.propertyAddress || 'Tenancy agreement'}
                                </div>
                                <div className="tn-dash-alert-time">
                                  {contract.signedDate ? timeAgo(contract.signedDate) : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="tn-dash-alert-link"
                                onClick={() => navigate('/dashboard/tenant-contracts')}
                              >
                                View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tn-dash-box-head">
                        <h3 className="tn-dash-box-title">Contract Alerts</h3>
                      </div>
                      <div className="tn-dash-empty" style={{ padding: '24px 16px', minHeight: 140 }}>
                        <div className="tn-dash-empty-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <div className="tn-dash-empty-title">No Contract Alerts</div>
                        <div className="tn-dash-empty-desc">All tenancies, payments, and contract signatures are up to date.</div>
                        <button type="button" className="tn-dash-empty-btn" onClick={() => navigate('/dashboard/tenant-contracts')}>
                          View Contracts
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ReferencingModal
        isOpen={isReferencingModalOpen}
        onClose={closeReferencingModal}
        initialStep={referencingStep}
      />

      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default DashboardHome;
