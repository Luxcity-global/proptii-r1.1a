import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Calendar, AlertCircle, Image as ImageIcon, Heart, Home, LayoutGrid, List } from 'lucide-react';
import { useSavedProperties, SavedProperty } from '../../../contexts/SavedPropertiesContext';
import BookViewingModal from '../../viewings/BookViewingModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useIsMobile } from '../ui/use-mobile';
import { trackEvent } from '../../../utils/analytics';
import { useNavigate } from 'react-router-dom';
import communicationService from '../../../services/communicationService';
import TenantPageHeader from '../ui/TenantPageHeader';
import '../../../styles/tenantSaved.css';
import '../../../styles/tenantModals.css';

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

function locationCity(location?: string): string {
  const parts = String(location || '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || location || '';
}

const SavedProperties: React.FC = () => {
  const { savedProperties, unsaveProperty, hasMore, loadMore, isLoading } = useSavedProperties();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState<'all' | 'latest' | 'highest' | 'lowest'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [visibleCount, setVisibleCount] = useState(8);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; property: SavedProperty | null }>({
    open: false,
    property: null,
  });
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [prefilledPropertyData, setPrefilledPropertyData] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchBudget, setSearchBudget] = useState('3000');
  const [searchBeds, setSearchBeds] = useState('2');
  const [imageIndexById, setImageIndexById] = useState<Record<string, number>>({});

  const handleMessageClick = async (property: any) => {
    if (!user) return;
    try {
      const landlordId = property.source === 'native' ? property.userId : 'UNCLAIMED';
      const agentEmail = property.source === 'scraped' ? property.agent?.email : undefined;
      const tenantName = (user as any)?.name || (user as any)?.displayName || user?.email || '';
      const conversation = await communicationService.getOrCreateConversation({
        propertyId: property.id,
        tenantId: user.id,
        landlordId,
        agentEmail,
        propertyTitle: property.title,
        tenantName,
      });
      navigate('/dashboard/messages', {
        state: {
          prefilledMessage: property.source === 'native' ? 'I want to make enquiries concerning this property' : undefined,
          conversationId: conversation.id,
          conversation,
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const SavedPropertyDetailsModal = ({
    property,
    isOpen,
    onClose,
  }: {
    property: SavedProperty | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!isOpen) return;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      const handleArrows = (e: KeyboardEvent) => {
        if (!property?.imageUrls?.length) return;
        if (e.key === 'ArrowLeft') {
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : property.imageUrls.length - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
        }
      };
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleArrows);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleArrows);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose, property]);

    if (!isOpen || !property) return null;

    const cleanPrice = (raw: string) => {
      if (!raw) return raw;
      let cleaned = raw.replace(/Tenancy info£?/gi, '');
      cleaned = cleaned.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
      const pcm = cleaned.match(/£[\d,]+\s*pcm/i);
      if (pcm) return pcm[0];
      const t = cleaned.trim();
      if (t && !t.startsWith('£') && /\d/.test(t)) return `£${t}`;
      return t;
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${isMobile ? 'mx-2' : ''}`}
          style={{ maxWidth: isMobile ? '100%' : '900px' }}
        >
          <div className={`sticky top-0 bg-white border-b border-gray-200 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} flex items-center justify-between`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Property Details</h2>
            <button
              onClick={onClose}
              className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors`}
            >
              <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {property.imageUrls && property.imageUrls.length > 0 && (
            <div className="relative">
              <div className={`${isMobile ? 'h-48' : 'h-96'} overflow-hidden`}>
                <img
                  src={property.imageUrls[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : property.imageUrls.length - 1))
                    }
                    className={`absolute ${isMobile ? 'left-2' : 'left-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length)}
                    className={`absolute ${isMobile ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          <div className={isMobile ? 'p-4' : 'p-6'}>
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>{property.title}</h3>
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#E65D24] mb-4`}>{cleanPrice(property.price)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{property.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{property.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{property.propertyType}</span>
              </div>
              {property.source && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Source: {property.source}</span>
                </div>
              )}
            </div>
            <div className={`border-t border-gray-200 ${isMobile ? 'pt-4 mb-4' : 'pt-6 mb-6'}`}>
              <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                Description
              </h4>
              <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                {property.description || 'No description provided for this property.'}
              </p>
            </div>
            {property.agent && (
              <div className={`border-t border-gray-200 ${isMobile ? 'pt-4' : 'pt-6'}`}>
                <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                  Listed By
                </h4>
                <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                  <p className={`${isMobile ? 'text-sm' : ''} font-medium text-gray-900`}>
                    {property.agent.name || 'Estate Agent'}
                  </p>
                  {property.agent.company && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.company}</p>
                  )}
                  {property.agent.email && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.email}</p>
                  )}
                  {property.agent.phone && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>Phone: {property.agent.phone}</p>
                  )}
                  <div className={`${isMobile ? 'mt-3 flex-col' : 'mt-4 flex'} items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                    {property.agent.phone ? (
                      <a
                        href={`tel:${property.agent.phone}`}
                        className={`${isMobile ? 'w-full text-center block' : 'px-4 inline-block'} py-2 bg-green-600 text-white rounded-lg ${isMobile ? 'text-sm' : ''}`}
                      >
                        Call
                      </a>
                    ) : (
                      <button
                        disabled
                        aria-disabled="true"
                        title="Phone number unavailable"
                        className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-green-600/50 text-white rounded-lg ${isMobile ? 'text-sm' : ''} cursor-not-allowed`}
                      >
                        Call
                      </button>
                    )}
                    <button
                      onClick={() => handleMessageClick(property)}
                      className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-white border border-gray-300 text-gray-700 rounded-lg ${isMobile ? 'text-sm' : ''}`}
                    >
                      Message
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        handleBookViewing(property);
                      }}
                      className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-[#DC5F12] text-white rounded-lg ${isMobile ? 'text-sm' : ''}`}
                    >
                      Book Viewing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const locations = useMemo(() => {
    const set = new Set<string>();
    savedProperties.forEach((p) => {
      const city = locationCity(p.location);
      if (city) set.add(city);
    });
    return Array.from(set).sort();
  }, [savedProperties]);

  const propertyTypes = useMemo(() => {
    const set = new Set<string>();
    savedProperties.forEach((p) => {
      if (p.propertyType) set.add(p.propertyType);
    });
    return Array.from(set).sort();
  }, [savedProperties]);

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = savedProperties.filter((p) => {
      if (locationFilter !== 'all' && locationCity(p.location) !== locationFilter) return false;
      if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
      if (!q) return true;
      const haystack = [p.title, p.location, p.propertyType, String(p.bedrooms), String(p.price)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    if (sortFilter === 'latest') {
      list = [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } else if (sortFilter === 'highest') {
      list = [...list].sort((a, b) => parseLeaseAmount(b.price) - parseLeaseAmount(a.price));
    } else if (sortFilter === 'lowest') {
      list = [...list].sort((a, b) => parseLeaseAmount(a.price) - parseLeaseAmount(b.price));
    }
    return list;
  }, [savedProperties, searchQuery, locationFilter, typeFilter, sortFilter]);

  const displayedProperties = useMemo(
    () => filteredProperties.slice(0, visibleCount),
    [filteredProperties, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(8);
  }, [searchQuery, savedProperties, locationFilter, typeFilter, sortFilter]);

  const latestSavedId = useMemo(() => {
    if (!savedProperties.length) return null;
    return [...savedProperties].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0]?.id;
  }, [savedProperties]);

  const highestLeaseId = useMemo(() => {
    if (!savedProperties.length) return null;
    return [...savedProperties].sort((a, b) => parseLeaseAmount(b.price) - parseLeaseAmount(a.price))[0]?.id;
  }, [savedProperties]);

  const insights = useMemo(() => {
    const amounts = savedProperties.map((p) => parseLeaseAmount(p.price)).filter((n) => n > 0);
    const avg = amounts.length ? Math.round(amounts.reduce((s, n) => s + n, 0) / amounts.length) : 0;
    return {
      saved: savedProperties.length,
      locations: locations.length,
      types: propertyTypes.length,
      avgRent: avg,
    };
  }, [savedProperties, locations.length, propertyTypes.length]);

  const openDetails = (p: SavedProperty) => {
    setDetailsModal({ open: true, property: p });
    trackEvent('tenant_dashboard_saved_property_view', {
      property_id: p.id,
      location: p.location,
      source: p.source,
    });
  };

  const handleBookViewing = (property: SavedProperty) => {
    const locationParts = property.location?.split(',').map((s: string) => s.trim()) || [];
    const agent = property.agent || ({} as SavedProperty['agent']);
    const propertyData = {
      id: property.id || `property-${Date.now()}`,
      street: locationParts[0] || property.location || '',
      town: locationParts[1] || '',
      city: locationParts[0] || property.location?.split(',')[0]?.trim() || '',
      postcode: locationParts[locationParts.length - 1] || '',
      agent: {
        id: agent.id || agent.name || property.source || `agent-${Date.now()}`,
        name: agent.name || property.source || 'Estate Agent',
        email: agent.email || '',
        phone: agent.phone || '',
        company: agent.company || property.source || 'Estate Agency',
      },
    };
    setPrefilledPropertyData(propertyData);
    setIsBookViewingOpen(true);
    trackEvent('tenant_dashboard_saved_property_book_viewing', {
      property_id: property.id,
      has_agent_email: Boolean(agent.email),
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      unsaveProperty(deleteConfirm);
      setDeleteConfirm(null);
      trackEvent('tenant_dashboard_saved_property_removed', {
        property_id: deleteConfirm,
      });
    }
  };

  const cyclePropertyImage = (property: SavedProperty) => {
    const count = property.imageUrls?.length || 0;
    if (count < 2) {
      openDetails(property);
      return;
    }
    setImageIndexById((prev) => ({
      ...prev,
      [property.id]: ((prev[property.id] || 0) + 1) % count,
    }));
  };

  const runProptiiSearch = () => {
    const city = searchCity.trim();
    const beds = searchBeds ? `${searchBeds} bedroom` : '';
    const place = city || 'UK';
    let q = `${beds} property to rent in ${place}`.replace(/\s+/g, ' ').trim();
    if (searchBudget) q += ` under ${searchBudget}pcm`;
    setIsSearchModalOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const showEmpty = !isLoading && savedProperties.length === 0;
  const showNoMatches = !showEmpty && filteredProperties.length === 0;

  const renderCard = (property: SavedProperty) => {
    const imgIndex = imageIndexById[property.id] || 0;
    const images = property.imageUrls?.length ? property.imageUrls : [];
    const src = images[imgIndex] || images[0];
    const badge =
      property.id === latestSavedId
        ? { cls: '', label: '★ Latest' }
        : property.id === highestLeaseId
          ? { cls: 'highest', label: '★ Highest Lease' }
          : null;

    return (
      <article key={property.id} className="tn-sp-card">
        <div className="tn-sp-card-img">
          {src ? (
            <img src={src} alt={property.title} />
          ) : (
            <div className="tn-sp-card-placeholder">
              <Home size={28} />
            </div>
          )}
          {badge && <div className={`tn-sp-badge ${badge.cls}`}>{badge.label}</div>}
          <button
            type="button"
            className="tn-sp-heart"
            title="Remove from saved"
            onClick={() => setDeleteConfirm(property.id)}
          >
            <Heart size={14} fill="currentColor" />
          </button>
          {images.length > 1 && (
            <div className="tn-sp-dots">
              {images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`tn-sp-dot${i === imgIndex ? ' is-on' : ''}`}
                  onClick={() => setImageIndexById((prev) => ({ ...prev, [property.id]: i }))}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="tn-sp-card-body">
          <div>
            <div className="tn-sp-price-row">
              <div className="tn-sp-price">
                {formatLeasePrice(property.price)} <span>/ month</span>
              </div>
              <span className="tn-sp-ago">{timeAgo(property.savedAt)}</span>
            </div>
            <h4 className="tn-sp-title">{property.title}</h4>
            <p className="tn-sp-addr">{property.location}</p>
            <div className="tn-sp-specs">
              {property.bedrooms && (
                <span className="tn-sp-spec">
                  {String(property.bedrooms).toLowerCase().includes('bed')
                    ? property.bedrooms
                    : `${property.bedrooms} Bed`}
                </span>
              )}
              {property.propertyType && <span className="tn-sp-spec">{property.propertyType}</span>}
            </div>
            <div className="tn-sp-tags">
              {property.propertyType && <span className="tn-sp-tag">{property.propertyType}</span>}
              {property.source && <span className="tn-sp-tag">{property.source}</span>}
            </div>
          </div>
          <div className="tn-sp-actions">
            <button type="button" className="tn-sp-view" onClick={() => openDetails(property)}>
              View Details
            </button>
            <button type="button" className="tn-sp-icon" title="Photos" onClick={() => cyclePropertyImage(property)}>
              <ImageIcon size={14} />
            </button>
            <button type="button" className="tn-sp-icon" title="Book viewing" onClick={() => handleBookViewing(property)}>
              <Calendar size={14} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="tn-sp">
      <TenantPageHeader
        title="Saved Properties"
        subtitle="Here's the latest update on your portfolio today."
        primaryLabel="Proptii Search"
        primaryIcon={<Search size={16} />}
        onPrimary={() => setIsSearchModalOpen(true)}
        onInsights={() => setIsInsightsOpen(true)}
      />

      <div className="tn-sp-body">
        <div className="tn-sp-toolbar">
          <div className="tn-sp-pill">
            <span>Saved Properties</span>
            <span className={`tn-sp-pill-count${savedProperties.length === 0 ? ' is-zero' : ''}`}>
              {savedProperties.length}
            </span>
          </div>
          <div className="tn-sp-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search Properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="tn-sp-tools">
            <select
              className="tn-sp-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="all">Location ▾</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <select className="tn-sp-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Property type ▾</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="tn-sp-select"
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value as typeof sortFilter)}
            >
              <option value="all">Sort ▾</option>
              <option value="latest">Latest save</option>
              <option value="highest">Highest rent</option>
              <option value="lowest">Lowest rent</option>
            </select>
            <div className="tn-sp-toggle">
              <button
                type="button"
                className={viewMode === 'grid' ? 'is-active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                type="button"
                className={viewMode === 'table' ? 'is-active' : ''}
                onClick={() => setViewMode('table')}
              >
                <List size={14} />
                Table
              </button>
            </div>
          </div>
        </div>

        {isLoading && savedProperties.length === 0 ? (
          <div className="tn-sp-skel-grid">
            <div className="tn-sp-skel" />
            <div className="tn-sp-skel" />
            <div className="tn-sp-skel" />
            <div className="tn-sp-skel" />
          </div>
        ) : showEmpty ? (
          <>
            <div className="tn-sp-empty">
              <div className="tn-sp-empty-icon">
                <Home size={22} />
              </div>
              <h2>No properties saved yet</h2>
              <p>Once you save a property, it appears here. You can find properties through our search</p>
              <div className="tn-sp-steps">
                <div className="tn-sp-step">
                  <span className="tn-sp-step-num">1</span>
                  Find a listing
                </div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>→</span>
                <div className="tn-sp-step">
                  <span className="tn-sp-step-num">2</span>
                  Save property
                </div>
              </div>
              <button type="button" className="tn-sp-empty-cta" onClick={() => navigate('/search')}>
                Find a Listing
              </button>
            </div>
            <div className="tn-sp-rec-head">
              <div>
                <h3>Recommended Properties</h3>
                <p>Browse live listings to save homes you like</p>
              </div>
              <button type="button" className="tn-sp-rec-link" onClick={() => navigate('/search')}>
                Browse All Listings →
              </button>
            </div>
          </>
        ) : showNoMatches ? (
          <div className="tn-sp-none">No saved properties found matching “{searchQuery || 'your filters'}”.</div>
        ) : viewMode === 'table' ? (
          <div className="tn-sp-table-wrap">
            <div style={{ overflowX: 'auto' }}>
              <table className="tn-sp-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Rent</th>
                    <th>Specs</th>
                    <th>Saved</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProperties.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <div className="tn-sp-table-prop">
                          {property.imageUrls?.[0] ? (
                            <img src={property.imageUrls[0]} alt="" />
                          ) : (
                            <div className="tn-sp-table-ph" />
                          )}
                          <div>
                            <strong>{property.title}</strong>
                            <span>{property.location}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{formatLeasePrice(property.price)}</strong>
                      </td>
                      <td>
                        {property.bedrooms ? `${property.bedrooms} ` : ''}
                        {property.propertyType || ''}
                      </td>
                      <td>{timeAgo(property.savedAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="tn-sp-view" style={{ display: 'inline-flex' }} onClick={() => openDetails(property)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="tn-sp-grid">{displayedProperties.map(renderCard)}</div>
        )}

        {!showEmpty && (hasMore || displayedProperties.length < filteredProperties.length) && (
          <div className="tn-sp-more">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (displayedProperties.length < filteredProperties.length) {
                  setVisibleCount((c) => c + 8);
                } else {
                  loadMore().then(() => setVisibleCount((c) => c + 8));
                }
              }}
            >
              {isLoading ? 'Loading...' : 'Load More Properties'}
            </button>
          </div>
        )}
      </div>

      {detailsModal.open && detailsModal.property && (
        <SavedPropertyDetailsModal
          property={detailsModal.property}
          isOpen={detailsModal.open}
          onClose={() => setDetailsModal({ open: false, property: null })}
        />
      )}

      <BookViewingModal
        open={isBookViewingOpen}
        onClose={() => {
          setIsBookViewingOpen(false);
          setPrefilledPropertyData(null);
        }}
        onSubmissionComplete={() => {
          setIsBookViewingOpen(false);
          setPrefilledPropertyData(null);
        }}
        prefilledPropertyData={prefilledPropertyData}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl shadow-xl ${isMobile ? 'w-full' : 'max-w-md w-full'} ${isMobile ? 'mx-2' : 'mx-4'}`}>
            <div className={isMobile ? 'p-4' : 'p-6'}>
              <div className={`flex items-center ${isMobile ? 'space-x-2 mb-3' : 'space-x-3 mb-4'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-red-100 rounded-full flex items-center justify-center`}>
                  <AlertCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`} />
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Remove Property</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>This action cannot be undone</p>
                </div>
              </div>
              <p className={`${isMobile ? 'text-sm' : ''} text-gray-700 ${isMobile ? 'mb-4' : 'mb-6'}`}>
                Are you sure you want to remove this property from your saved searches? This action cannot be undone.
              </p>
              <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-end space-x-3'}`}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className={`${isMobile ? 'w-full' : 'px-4'} py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${isMobile ? 'text-sm' : ''}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${isMobile ? 'text-sm' : ''}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isInsightsOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInsightsOpen(false); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-saved-insights">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico blue">📊</span>
                <div>
                  <h3 id="tn-saved-insights">Saved Properties Insights</h3>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsInsightsOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
                Counts from the listings currently in your saved list.
              </p>
              <div className="tn-insights-grid">
                <div className="tn-insights-card">
                  <span>Saved listings</span>
                  <p>{insights.saved}</p>
                  <em>In your shortlist</em>
                </div>
                <div className="tn-insights-card">
                  <span>Locations</span>
                  <p>{insights.locations}</p>
                  <em>Distinct areas</em>
                </div>
                <div className="tn-insights-card">
                  <span>Property types</span>
                  <p>{insights.types}</p>
                  <em>From saved listings</em>
                </div>
                <div className="tn-insights-card">
                  <span>Average rent</span>
                  <p>{insights.avgRent ? `£${insights.avgRent.toLocaleString()}` : '—'}</p>
                  <em>Per month</em>
                </div>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-blue" onClick={() => setIsInsightsOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {isSearchModalOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsSearchModalOpen(false); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-proptii-search" style={{ maxWidth: 512 }}>
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-sp-search-modal-ico">
                  <Search size={16} />
                </span>
                <div>
                  <h3 id="tn-proptii-search">Proptii Property Search</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    Discover residential lettings across the UK
                  </p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsSearchModalOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <label className="tn-sp-field" htmlFor="tn-sp-city">Target UK City or Postcode</label>
              <input
                id="tn-sp-city"
                className="tn-sp-input"
                placeholder="e.g. Manchester, M1 4BT, or Leeds City Centre"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
              <div className="tn-sp-form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="tn-sp-field" htmlFor="tn-sp-budget">Max Budget (£/month)</label>
                  <input
                    id="tn-sp-budget"
                    className="tn-sp-input"
                    type="number"
                    value={searchBudget}
                    onChange={(e) => setSearchBudget(e.target.value)}
                  />
                </div>
                <div>
                  <label className="tn-sp-field" htmlFor="tn-sp-beds">Min Bedrooms</label>
                  <select
                    id="tn-sp-beds"
                    className="tn-sp-input"
                    value={searchBeds}
                    onChange={(e) => setSearchBeds(e.target.value)}
                  >
                    <option value="1">1+ Beds</option>
                    <option value="2">2+ Beds</option>
                    <option value="3">3+ Beds</option>
                    <option value="4">4+ Beds</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-cancel" onClick={() => setIsSearchModalOpen(false)}>Cancel</button>
              <button type="button" className="tn-modal-primary" onClick={runProptiiSearch}>Search Available Listings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedProperties;
