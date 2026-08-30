import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, MapPin, PoundSterling, Eye, Heart, Search, FileText, Calendar, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { useSavedProperties } from '../../../contexts/SavedPropertiesContext';
import BookViewingModal from '../../viewings/BookViewingModal';
import { useAuth } from '../../../contexts/AuthContext';
import { viewingService, ViewingStats } from '../../../services/viewingService';
import { firestoreService } from '../../../services/firestoreService';
import { useSignedContracts } from '../../../contexts/SignedContractsContext';
import { useIsMobile } from '../ui/use-mobile';
import { trackEvent } from '../../../utils/analytics';
import { useNavigate } from 'react-router-dom';
import communicationService from '../../../services/communicationService';

/**
 * Saved Properties section - redesigned to follow style guide
 */
const SavedProperties: React.FC = () => {
  const { savedProperties, unsaveProperty, hasMore, loadMore, isLoading } = useSavedProperties();
  const { user, isAuthenticated } = useAuth();
  const { signedContracts } = useSignedContracts();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; property: any | null }>({ open: false, property: null });
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [prefilledPropertyData, setPrefilledPropertyData] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
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
          conversation
        }
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const [viewingStats, setViewingStats] = useState<ViewingStats>({
    upcoming: 0,
    completed: 0,
    rescheduled: 0,
    total: 0
  });
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Inline copy of the Search Results Property Details modal for visual parity
  const SavedPropertyDetailsModal = ({ property, isOpen, onClose }: { property: any | null; isOpen: boolean; onClose: () => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen) {
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
        };
        const handleArrows = (e: KeyboardEvent) => {
          if (!property?.imageUrls?.length) return;
          if (e.key === 'ArrowLeft') {
            setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.imageUrls.length - 1);
          } else if (e.key === 'ArrowRight') {
            setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length);
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
      }
    }, [isOpen, onClose, property]);

    if (!isOpen || !property) return null;

    const cleanPrice = (raw: string) => {
      if (!raw) return raw;
      let cleaned = raw.replace(/Tenancy info£?/gi, '');
      cleaned = cleaned.replace(/\s*\(£[\d,]+\s*pw\)/gi, '');
      const pcm = cleaned.match(/£[\d,]+ pcm/i);
      if (pcm) return pcm[0];
      const t = cleaned.trim();
      if (t && !t.startsWith('£') && /\d/.test(t)) return `£${t}`;
      return t;
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div ref={modalRef} className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${isMobile ? 'mx-2' : ''}`} style={{ maxWidth: isMobile ? '100%' : '900px' }}>
          <div className={`sticky top-0 bg-white border-b border-gray-200 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} flex items-center justify-between`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Property Details</h2>
            <button onClick={onClose} className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors`}>
              <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {property.imageUrls && property.imageUrls.length > 0 && (
            <div className="relative">
              <div className={`${isMobile ? 'h-48' : 'h-96'} overflow-hidden`}>
                <img src={property.imageUrls[currentImageIndex]} alt={`${property.title} - Image ${currentImageIndex + 1}`} className="w-full h-full object-cover" />
              </div>
              {property.imageUrls.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.imageUrls.length - 1)} className={`absolute ${isMobile ? 'left-2' : 'left-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}>
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length)} className={`absolute ${isMobile ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors`}>
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
              {property.imageUrls.length > 1 && (
                <div className={`absolute ${isMobile ? 'bottom-2' : 'bottom-4'} left-1/2 -translate-x-1/2 flex gap-1 md:gap-2 bg-black/50 rounded-lg ${isMobile ? 'p-1' : 'p-2'}`}>
                  {property.imageUrls.slice(0, isMobile ? 4 : 8).map((img: string, index: number) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-white' : 'border-transparent'}`}>
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={isMobile ? 'p-4' : 'p-6'}>
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>{property.title}</h3>
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#E65D24] mb-4`}>{cleanPrice(property.price)}</p>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${isMobile ? 'gap-3' : 'gap-4'} mb-6`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-gray-600">{property.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg>
                <span className="text-gray-600">{property.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span className="text-gray-600">{property.propertyType}</span>
              </div>
              {property.source && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" /></svg>
                  <span className="text-gray-600">Source: {property.source}</span>
                </div>
              )}
            </div>
            {/* Availability status */}
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Available</span>
            </div>

            {/* Description */}
            <div className={`border-t border-gray-200 ${isMobile ? 'pt-4 mb-4' : 'pt-6 mb-6'}`}>
              <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>Description</h4>
              <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                {property.description || 'No description provided for this property.'}
              </p>
            </div>

            {/* Listed By / Agent */}
            {property.agent && (
              <div className={`border-t border-gray-200 ${isMobile ? 'pt-4' : 'pt-6'}`}>
                <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>Listed By</h4>
                <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                  <p className={`${isMobile ? 'text-sm' : ''} font-medium text-gray-900`}>{property.agent.name || 'Estate Agent'}</p>
                  {property.agent.company && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.company}</p>
                  )}
                  {property.agent.email && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>{property.agent.email}</p>
                  )}
                  {property.agent.phone && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>Phone: {property.agent.phone}</p>
                  )}
                  <div className={isMobile ? 'mt-1' : 'mt-2'}>
                    {property.agent.website && (
                      <a href={property.agent.website} target="_blank" rel="noopener noreferrer" className={`text-[#E65D24] hover:underline ${isMobile ? 'text-xs' : ''}`}>View Agency Website</a>
                    )}
                  </div>
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
                    <button onClick={() => handleMessageClick(property)} className={`${isMobile ? 'w-full' : 'px-4'} py-2 bg-white border border-gray-300 text-gray-700 rounded-lg ${isMobile ? 'text-sm' : ''}`}>Message</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Load viewing stats, referencing completion, and contracts count
  useEffect(() => {
    if (user?.id) {
      loadViewingStats();
      loadReferencingStatus();
    }
  }, [user?.id]);

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



  const loadReferencingStatus = async () => {
    try {
      if (!user?.id) return;
      
      const propertyId = `general_${user.id}`;
      
      const firestoreResult = await firestoreService.getReferencingForm(user.id, propertyId);
      if (!firestoreResult.success || !firestoreResult.data) return;
      
      const formData = firestoreResult.data.formData;
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
      if (formData.agentDetails?.hasAgreedToCheck) {
        completed.add('agentDetails');
      }
      
      setCompletedSections(completed);
    } catch (error) {
      console.error('Error loading referencing status:', error);
    }
  };
  
  // Force re-render when savedProperties changes
  useEffect(() => {
    // This ensures the component updates when savedProperties changes
  }, [savedProperties]);

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedProperties;
    return savedProperties.filter((p: any) => {
      const haystack = [
        p.title,
        p.location,
        p.propertyType,
        String(p.bedrooms),
        String(p.price)
      ]
        .filter(Boolean)
        .join(' ') 
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [savedProperties, searchQuery]);

  const summarySavedCount = isAuthenticated ? savedProperties.length : 0;
  const summaryViewingsCount = isAuthenticated ? (viewingStats.total || 0) : 0;
  const summaryReferencingCount = isAuthenticated ? completedSections.size : 0;
  const summaryContractsCount = isAuthenticated ? (signedContracts.length || 0) : 0;

  const displayedProperties = useMemo(() => {
    return filteredProperties.slice(0, visibleCount);
  }, [filteredProperties, visibleCount]);

  useEffect(() => {
    // reset pagination on new search or saved list changes
    setVisibleCount(6);
  }, [searchQuery, savedProperties]);

  const openDetails = (p: any) => {
    // Transform to match SearchResults PropertyDetailsModal expectations
    const modalProperty = {
      title: p.title,
      price: typeof p.price === 'string' ? p.price : `£${p.price} pcm`,
      location: p.location,
      bedrooms: Number(p.bedrooms) || 0,
      propertyType: p.propertyType,
      source: p.source,
      description: p.description,
      imageUrls: (p.imageUrls && p.imageUrls.length ? p.imageUrls : ['/images/detached-house.jpg']),
      agent: p.agent ? {
        name: p.agent.name || p.agentName || 'Estate Agent',
        email: p.agent.email || p.agentEmail || '',
        website: p.agent.website || p.agentWebsite
      } : undefined
    };
    setDetailsModal({ open: true, property: modalProperty });
    trackEvent('tenant_dashboard_saved_property_view', {
      property_id: p.id,
      location: p.location,
      source: p.source,
    });
  };

  const handleBookViewing = (property: any) => {
    // Extract location parts from the property location string
    const locationParts = property.location?.split(',').map((s: string) => s.trim()) || [];
    
    // Extract agent information from saved property structure
    const agent = property.agent || {};
    
    // Prepare property data for BookViewingModal in the same format as SearchResults
    const propertyData = {
      id: property.id || property.propertyId || `property-${Date.now()}`,
      street: locationParts[0] || property.location || '',
      town: locationParts[1] || '',
      city: locationParts[0] || property.location?.split(',')[0]?.trim() || '',
      postcode: locationParts[locationParts.length - 1] || '',
      agent: {
        id: agent.id || agent.name || property.source || `agent-${Date.now()}`,
        name: agent.name || property.source || 'Estate Agent',
        email: agent.email || '',
        phone: agent.phone || '',
        company: agent.company || property.source || 'Estate Agency'
      }
    };
    
    setPrefilledPropertyData(propertyData);
    setIsBookViewingOpen(true);
    trackEvent('tenant_dashboard_saved_property_book_viewing', {
      property_id: property.id || property.propertyId,
      has_agent_email: Boolean(agent.email),
    });
  };

  const handleDeleteProperty = (propertyId: string) => {
    setDeleteConfirm(propertyId);
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

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-4 px-4' : 'pb-8'}`} style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header */}
      <div className={isMobile ? 'mt-4' : 'mt-8'}>
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'justify-between'} ${isMobile ? 'mb-4' : 'mb-2'}`}>
          <div className="flex-1 min-w-0">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`} style={{ color: '#374957' }}>
          Saved Properties
        </h1>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
              Manage all your properties in one place.
            </p>
          </div>
            <button 
              onClick={() => window.location.href = '/'}
              className={`${isMobile ? 'px-4 py-2 text-xs whitespace-nowrap flex-shrink-0' : 'px-12 py-3'} text-white rounded-full ${isMobile ? 'text-xs' : 'text-sm'} font-medium transition-all duration-300 ${isMobile ? '' : 'hover:-translate-y-0.5'}`}
              style={{
                background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                border: '1px solid #DC5F12',
                minHeight: isMobile ? '2.5rem' : '3.5rem',
                minWidth: isMobile ? 'auto' : '180px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              Browse Properties
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
        {/* Saved Listings Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Saved Listings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-orange-100 rounded-lg flex items-center justify-center`}>
              <Building2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summarySavedCount}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>
              {summarySavedCount === 1 ? 'Saved property' : 'Saved properties'}
            </p>
          </div>
        </div>

        {/* Viewings Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Viewings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <Eye className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryViewingsCount}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Total booked</p>
          </div>
        </div>

        {/* Referencing Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Referencing</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center`}>
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryReferencingCount}/6
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Complete</p>
          </div>
        </div>

        {/* Contracts Card */}
        <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-gray-100 hover:shadow-lg transition-shadow`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Contracts</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-yellow-100 rounded-lg flex items-center justify-center`}>
              <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`} />
            </div>
          </div>
          <div className={isMobile ? 'mb-2' : 'mb-3'}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryContractsCount}
            </p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Signed Contracts</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`bg-white ${isMobile ? 'p-3' : 'p-4'} rounded-xl border border-gray-100`}>
        <div className="relative">
          <Search className={`absolute ${isMobile ? 'left-2' : 'left-3'} top-1/2 transform -translate-y-1/2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
          <input
            type="text"
            placeholder="Search properties"
            className={`w-full ${isMobile ? 'pl-8 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'} border border-gray-200 rounded-lg focus:outline-none focus:border-transparent`}
            style={{ 
              fontFamily: 'Archivo, sans-serif'
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#136C9E';
              e.target.style.boxShadow = '0 0 0 2px rgba(19, 108, 158, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
        {filteredProperties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Heart className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
            </div>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
              {searchQuery ? 'No matching properties' : 'No Saved Properties'}
            </h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-600 mb-4`}>
              {searchQuery ? 'Try a different search term.' : 'Start saving properties you like from your search results.'}
            </p>
            <button 
              className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} text-white rounded-lg font-medium transition-colors`}
              style={{ backgroundColor: '#E65D24' }}
              onClick={() => window.location.href = '/'}
            >
              Browse Properties
            </button>
          </div>
        ) : (
          displayedProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Property Image */}
            <div className="relative aspect-video overflow-hidden">
              <img 
                  src={property.imageUrls?.[0] || '/images/detached-house.jpg'} 
                  alt={property.title} 
                className="w-full h-full object-cover" 
              />
              {/* Heart Icon */}
              <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-3 right-3'}`}>
                  <button
                    onClick={() => unsaveProperty(property.id)}
                    className="bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 transition-all"
                  >
                  <Heart className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-red-500 fill-red-500`} />
                  </button>
              </div>
            </div>
            
            {/* Property Details */}
            <div className={isMobile ? 'p-3' : 'p-4'}>
              {/* Address */}
              <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-800 mb-1 truncate`}>
                  {property.title}
              </h3>
              
              {/* Property Type */}
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mb-2' : 'mb-3'} flex items-center`}>
                <MapPin className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1`} />
                  {property.location} · {property.propertyType}
              </p>
              
              {/* Price */}
              <div className={`flex items-center ${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                  {property.price}
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 ml-1`}>/month</span>
              </div>
              
              {/* Features */}
              <div className={`flex flex-wrap ${isMobile ? 'gap-1 mb-3' : 'gap-1 mb-4'}`}>
                  <span className={`inline-flex items-center ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1'} rounded-md text-xs font-medium bg-orange-100 text-orange-600`}>
                    {property.bedrooms} Bedrooms
                  </span>
                  <span className={`inline-flex items-center ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1'} rounded-md text-xs font-medium bg-orange-100 text-orange-600`}>
                    {property.propertyType}
                  </span>
                  {property.source && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1'} rounded-md text-xs font-medium bg-blue-100 text-blue-600`}>
                      {property.source}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                <button className={`flex-1 inline-flex items-center justify-center ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2'} border border-gray-300 rounded-lg ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 hover:bg-gray-50 transition-colors`} onClick={() => openDetails(property)}>
                  <Eye className={`${isMobile ? 'w-3.5 h-3.5 mr-1' : 'w-4 h-4 mr-2'}`} />
                  View
                </button>
                <button 
                  className={`${isMobile ? 'p-1.5' : 'p-2'} border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors`} 
                  onClick={() => handleBookViewing(property)}
                  title="Book Viewing"
                >
                  <Calendar className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                </button>
                <button 
                  className={`${isMobile ? 'p-1.5' : 'p-2'} border border-gray-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors`} 
                  onClick={() => handleDeleteProperty(property.id)}
                  title="Remove from saved searches"
                >
                  <Trash2 className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                </button>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Load More */}
      {(hasMore || displayedProperties.length < filteredProperties.length) && (
        <div className={`text-center ${isMobile ? 'pt-4' : 'pt-6'}`}>
          <button 
            className={`${isMobile ? 'px-4 py-2 text-xs' : 'px-6 py-3'} border border-gray-300 rounded-lg ${isMobile ? 'text-xs' : 'text-sm'} font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
            style={{ color: '#374957' }}
            disabled={isLoading}
            onClick={() => {
              if (displayedProperties.length < filteredProperties.length) {
                setVisibleCount((c) => c + 6);
              } else {
                loadMore().then(() => setVisibleCount((c) => c + 6));
              }
            }}
          >
            {isLoading ? 'Loading...' : 'Load More Properties'}
          </button>
        </div>
      )}
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

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};

export default SavedProperties;

