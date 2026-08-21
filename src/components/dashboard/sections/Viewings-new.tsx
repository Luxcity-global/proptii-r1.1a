import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Clock, MapPin, User, Mail, CheckCircle, Eye, X, Heart, MessageCircle, Send, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { viewingService, ViewingBooking, ViewingStats } from '../../../services/viewingService';
import { bookViewingRequestService, BookViewingRequest } from '../../../services/bookViewingRequestService';
import { propertySelectionService, PropertySelection, PropertySelectionStats } from '../../../services/propertySelectionService';
import { useAuth } from '../../../contexts/AuthContext';
import BookViewingModal from '../../viewings/BookViewingModal';
import emailService from '../../../services/emailService';
import {
  generateCancelViewingEmailTemplate,
  generateRescheduleRequestEmailTemplate,
} from '../../viewings/services/emailTemplates';
import { useIsMobile } from '../ui/use-mobile';

const REQUEST_PREFIX = 'request_';
const DRAFT_PREFIX = 'draft_';

const isRequestPlaceholder = (id: string) => String(id).startsWith(REQUEST_PREFIX);
const isDraftPlaceholder = (id: string) => String(id).startsWith(DRAFT_PREFIX);

const getPropertyKey = (item: {
  propertyId?: string | null;
  property?: { street?: string; town?: string };
}) => item.propertyId || `${item.property?.street || ''}-${item.property?.town || ''}`;

const isUpcomingStatus = (status: ViewingBooking['status']) =>
  status === 'pending' || status === 'confirmed' || status === 'rescheduled';

const isPastStatus = (status: ViewingBooking['status']) =>
  status === 'completed' || status === 'cancelled';

/**
 * Viewings section - redesigned to follow style guide
 */
const Viewings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewingStats, setViewingStats] = useState<ViewingStats>({
    upcoming: 0,
    completed: 0,
    rescheduled: 0,
    total: 0
  });
  const [upcomingViewings, setUpcomingViewings] = useState<ViewingBooking[]>([]);
  const [pastViewings, setPastViewings] = useState<ViewingBooking[]>([]);
  
  // Property selections state
  const [propertySelections, setPropertySelections] = useState<PropertySelection[]>([]);
  const [selectionStats, setSelectionStats] = useState<PropertySelectionStats>({
    total: 0,
    interested: 0,
    viewingRequested: 0,
    viewingScheduled: 0,
    viewingCompleted: 0,
    rejected: 0
  });
  
  const [viewingsVersion, setViewingsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<ViewingBooking | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Pagination state
  const [currentUpcomingPage, setCurrentUpcomingPage] = useState<number>(1);
  const [currentPastPage, setCurrentPastPage] = useState<number>(1);
  
  const ITEMS_PER_PAGE = 10;
  const knownBookingKeysRef = useRef<Set<string>>(new Set());

  const selectionImageByPropertyId = useMemo(() => {
    const map = new Map<string, string>();
    propertySelections.forEach((s) => {
      const firstImage = s?.property?.images?.[0];
      if (s?.propertyId && firstImage) {
        map.set(s.propertyId, firstImage);
      }
    });
    return map;
  }, [propertySelections]);

  const getViewingImage = (viewing: ViewingBooking) => {
    const storedImage = viewing.property?.imageUrls?.find(Boolean);
    if (storedImage) {
      return storedImage;
    }
    if (viewing.propertyId && selectionImageByPropertyId.has(viewing.propertyId)) {
      return selectionImageByPropertyId.get(viewing.propertyId) as string;
    }
    const match = propertySelections.find((s) => {
      const v = viewing.property;
      const p = s.property?.location;
      return (
        !!p &&
        v.street === p.street &&
        v.town === p.town &&
        v.city === p.city &&
        v.postcode === p.postcode &&
        s.property?.images?.length
      );
    });
    if (match?.property?.images?.[0]) {
      return match.property.images[0];
    }
    try {
      const saved = JSON.parse(localStorage.getItem('savedProperties') || '[]') as Array<{ location?: string; title?: string; imageUrls?: string[] }>;
      const street = (viewing.property.street || '').toLowerCase();
      const savedMatch = saved.find((p) => {
        const loc = `${p.location || ''} ${p.title || ''}`.toLowerCase();
        return street && loc.includes(street) && p.imageUrls?.[0];
      });
      if (savedMatch?.imageUrls?.[0]) {
        return savedMatch.imageUrls[0];
      }
    } catch {
      // ignore localStorage parse errors
    }
    return '/images/detached-house.jpg';
  };

  // Load any draft viewing from sessionStorage to show an immediate placeholder
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('draft_viewing');
      if (draft) {
        const parsed = JSON.parse(draft) as ViewingBooking;
        // Only add if not already present in upcomingViewings
        setUpcomingViewings(prev => {
          const exists = prev.some(v => v.id === parsed.id);
          return exists ? prev : [parsed, ...prev];
        });
      }
    } catch (e) {
      console.warn('Failed to load draft viewing placeholder:', e);
    }
  }, []);

  // Load viewing data from Firestore
  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, skipping data load');
      setLoading(false);
      return;
    }

    console.log('Loading viewing data for user:', user.id);
    console.log('User object:', user);

    const loadViewingData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading viewing stats...');
        // Load stats
        const statsResult = await viewingService.getViewingStats(user.id);
        console.log('Stats result:', statsResult);
        if (statsResult.success && statsResult.stats) {
          setViewingStats(statsResult.stats);
        }

        // Load property selections
        console.log('Loading property selections...');
        const selectionsResult = await propertySelectionService.getUserPropertySelections(user.id);
        console.log('Property selections result:', selectionsResult);
        if (selectionsResult.success && selectionsResult.selections) {
          setPropertySelections(selectionsResult.selections);
        }

        // Load property selection stats
        console.log('Loading property selection stats...');
        const selectionStatsResult = await propertySelectionService.getPropertySelectionStats(user.id);
        console.log('Property selection stats result:', selectionStatsResult);
        if (selectionStatsResult.success && selectionStatsResult.stats) {
          setSelectionStats(selectionStatsResult.stats);
        }

        // Also try to get all bookings to see what's in Firestore
        console.log('Loading all bookings for debugging...');
        const allBookingsResult = await viewingService.getUserViewingBookings(user.id);
        console.log('All bookings result:', allBookingsResult);

        console.log('Loading upcoming viewings...');
        // Load upcoming viewings (pending, confirmed, and rescheduled)
        const upcomingResult = await viewingService.getViewingBookingsByStatus(user.id, 'pending');
        const confirmedResult = await viewingService.getViewingBookingsByStatus(user.id, 'confirmed');
        const rescheduledResult = await viewingService.getViewingBookingsByStatus(user.id, 'rescheduled');
        
        console.log('Upcoming result:', upcomingResult);
        console.log('Confirmed result:', confirmedResult);
        console.log('Rescheduled result:', rescheduledResult);
        
        let upcoming = [
          ...(upcomingResult.bookings || []),
          ...(confirmedResult.bookings || []),
          ...(rescheduledResult.bookings || [])
        ];

        // Also include Book Viewing Requests as upcoming placeholders
        const requestsResult = await bookViewingRequestService.getUserRequests(user.id);
        const requestBookings: ViewingBooking[] = (requestsResult.requests || []).map((r: BookViewingRequest) => ({
          id: `request_${r.id}`,
          userId: r.userId,
          propertyId: r.propertyId,
          property: {
            street: r.property.street,
            town: r.property.town,
            city: r.property.city,
            postcode: r.property.postcode,
            title: r.property.title,
            description: r.property.description,
            imageUrls: r.property.imageUrls,
            agent: r.property.agent
          },
          viewingDetails: {
            date: '',
            time: '',
            preference: 'In-Person Viewing',
            userDetails: { fullName: '', email: '', phoneNumber: '' }
          },
          status: 'pending',
          createdAt: undefined as any,
          updatedAt: undefined as any
        }));

        // Fallback: if status-scoped queries return nothing (e.g., missing index),
        // derive upcoming from the all-bookings list
        if (upcoming.length === 0 && (allBookingsResult.bookings || []).length > 0) {
          console.log('Using fallback from all bookings to populate upcoming');
          upcoming = (allBookingsResult.bookings || []).filter(
            (b: ViewingBooking) => isUpcomingStatus(b.status)
          );
        }

        // Only add request placeholders for properties that don't already have a booking
        const realBookingKeys = new Set<string>();
        (allBookingsResult.bookings || upcoming).forEach((b) => {
          realBookingKeys.add(getPropertyKey(b));
        });
        
        const filteredRequestBookings = requestBookings.filter((r) => {
          return !realBookingKeys.has(getPropertyKey(r));
        });
        
        // Combine real bookings with filtered request placeholders
        upcoming = [...upcoming, ...filteredRequestBookings];
        setUpcomingViewings(prev => {
          // Keep any draft at the top if present
          const draft = prev.find(v => String(v.id).startsWith('draft_'));
          const withoutDraft = upcoming.filter(v => !String(v.id).startsWith('draft_'));
          return draft ? [draft, ...withoutDraft] : upcoming;
        });
        console.log('Set upcoming viewings:', upcoming);
        console.log('Upcoming viewings count:', upcoming.length);

        console.log('Loading past viewings...');
        // Load past viewings (completed and cancelled)
        const completedResult = await viewingService.getViewingBookingsByStatus(user.id, 'completed');
        const cancelledResult = await viewingService.getViewingBookingsByStatus(user.id, 'cancelled');
        console.log('Completed result:', completedResult);
        console.log('Cancelled result:', cancelledResult);
        
        let past = [
          ...(completedResult.bookings || []),
          ...(cancelledResult.bookings || [])
        ];
        
        // Fallback: if status-scoped queries return nothing (e.g., missing index),
        // derive past from the all-bookings list
        if (past.length === 0 && (allBookingsResult.bookings || []).length > 0) {
          console.log('Using fallback from all bookings to populate past');
          past = (allBookingsResult.bookings || []).filter(
            (b: ViewingBooking) => isPastStatus(b.status)
          );
        }
        
        setPastViewings(past);

      } catch (err) {
        console.error('Error loading viewing data:', err);
        setError('Failed to load viewing data');
      } finally {
        setLoading(false);
      }
    };

    loadViewingData();
  }, [user?.id, viewingsVersion]);

  useEffect(() => {
    const keys = new Set<string>();
    upcomingViewings.forEach((viewing) => {
      if (!isRequestPlaceholder(viewing.id) && !isDraftPlaceholder(viewing.id)) {
        keys.add(getPropertyKey(viewing));
      }
    });
    pastViewings.forEach((viewing) => {
      keys.add(getPropertyKey(viewing));
    });
    knownBookingKeysRef.current = keys;
  }, [upcomingViewings, pastViewings]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeStats = viewingService.subscribeToViewingStats(
      user.id,
      (stats) => setViewingStats(stats),
      (error) => console.error('Error in stats subscription:', error)
    );

    const unsubscribeBookings = viewingService.subscribeToUserViewingBookings(
      user.id,
      (bookings) => {
        console.log('Real-time subscription received bookings:', bookings);
        const upcoming = bookings.filter((b) => isUpcomingStatus(b.status));
        const past = bookings.filter((b) => isPastStatus(b.status));
        console.log('Filtered upcoming:', upcoming);
        console.log('Filtered past:', past);
        setUpcomingViewings(prev => {
          const drafts = prev.filter((v) => isDraftPlaceholder(v.id));
          const requests = prev.filter((v) => isRequestPlaceholder(v.id));

          const realBookingKeys = new Set<string>();
          bookings.forEach((b) => {
            realBookingKeys.add(getPropertyKey(b));
          });
          knownBookingKeysRef.current = realBookingKeys;

          const filteredRequests = requests.filter((r) => !realBookingKeys.has(getPropertyKey(r)));

          const combined = [...upcoming, ...filteredRequests].filter((v) => !isDraftPlaceholder(v.id));
          return drafts.length ? [...drafts, ...combined] : combined;
        });
        setPastViewings(past);
      },
      (error) => console.error('Error in bookings subscription:', error)
    );

    const unsubscribeRequests = bookViewingRequestService.subscribeToUserRequests(
      user.id,
      (requests) => {
        const requestBookings: ViewingBooking[] = requests.map((r) => ({
          id: `request_${r.id}`,
          userId: r.userId,
          propertyId: r.propertyId,
          property: {
            street: r.property.street,
            town: r.property.town,
            city: r.property.city,
            postcode: r.property.postcode,
            title: r.property.title,
            description: r.property.description,
            imageUrls: r.property.imageUrls,
            agent: r.property.agent
          },
          viewingDetails: { date: '', time: '', preference: 'In-Person Viewing', userDetails: { fullName: '', email: '', phoneNumber: '' } },
          status: 'pending',
          createdAt: undefined as any,
          updatedAt: undefined as any
        }));
        setUpcomingViewings(prev => {
          // Get real bookings (not request placeholders)
          const realBookings = prev.filter((v) => !isRequestPlaceholder(v.id));
          
          // Only add request placeholders for properties that don't have real bookings
          const realBookingKeys = new Set<string>(knownBookingKeysRef.current);
          realBookings.forEach((b) => {
            if (!isDraftPlaceholder(b.id)) {
              realBookingKeys.add(getPropertyKey(b));
            }
          });
          
          const filteredRequestBookings = requestBookings.filter((r) => {
            return !realBookingKeys.has(getPropertyKey(r));
          });
          
          // Combine real bookings with filtered request placeholders
          return [...realBookings, ...filteredRequestBookings];
        });
      }
    );

    const unsubscribeSelections = propertySelectionService.subscribeToUserPropertySelections(
      user.id,
      (selections) => {
        console.log('Real-time subscription received property selections:', selections);
        setPropertySelections(selections);
      },
      (error) => console.error('Error in property selections subscription:', error)
    );

    const unsubscribeSelectionStats = propertySelectionService.subscribeToPropertySelectionStats(
      user.id,
      (stats) => {
        console.log('Real-time subscription received selection stats:', stats);
        setSelectionStats(stats);
      },
      (error) => console.error('Error in selection stats subscription:', error)
    );

    return () => {
      unsubscribeStats();
      unsubscribeBookings();
      unsubscribeSelections();
      unsubscribeSelectionStats();
      unsubscribeRequests();
    };
  }, [user?.id]);

  const currentViewings = activeTab === 'upcoming' ? upcomingViewings : pastViewings;
  const currentSelections = propertySelections;
  const summaryUpcomingCount = isAuthenticated ? upcomingViewings.length : 0;
  const summaryCompletedCount = isAuthenticated ? viewingStats.completed : 0;
  const summaryRescheduledCount = isAuthenticated ? viewingStats.rescheduled : 0;
  const summaryTotalCount = isAuthenticated ? viewingStats.total : 0;

  // Pagination calculations
  const totalUpcomingPages = Math.ceil(upcomingViewings.length / ITEMS_PER_PAGE);
  const upcomingStartIndex = (currentUpcomingPage - 1) * ITEMS_PER_PAGE;
  const upcomingEndIndex = upcomingStartIndex + ITEMS_PER_PAGE;
  const paginatedUpcomingViewings = useMemo(() => {
    return upcomingViewings.slice(upcomingStartIndex, upcomingEndIndex);
  }, [upcomingViewings, upcomingStartIndex, upcomingEndIndex]);

  const totalPastPages = Math.ceil(pastViewings.length / ITEMS_PER_PAGE);
  const pastStartIndex = (currentPastPage - 1) * ITEMS_PER_PAGE;
  const pastEndIndex = pastStartIndex + ITEMS_PER_PAGE;
  const paginatedPastViewings = useMemo(() => {
    return pastViewings.slice(pastStartIndex, pastEndIndex);
  }, [pastViewings, pastStartIndex, pastEndIndex]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentUpcomingPage(1);
    setCurrentPastPage(1);
  }, [activeTab]);

  // Get current paginated viewings based on active tab
  const paginatedViewings = activeTab === 'upcoming' ? paginatedUpcomingViewings : paginatedPastViewings;
  const currentPage = activeTab === 'upcoming' ? currentUpcomingPage : currentPastPage;
  const totalPages = activeTab === 'upcoming' ? totalUpcomingPages : totalPastPages;
  const startIndex = activeTab === 'upcoming' ? upcomingStartIndex : pastStartIndex;
  const endIndex = activeTab === 'upcoming' ? upcomingEndIndex : pastEndIndex;
  const totalItems = activeTab === 'upcoming' ? upcomingViewings.length : pastViewings.length;

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4 mt-4`}>
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`} style={{ fontFamily: 'Archivo, sans-serif' }}>
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} viewings
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'upcoming') {
                setCurrentUpcomingPage(Math.max(1, currentUpcomingPage - 1));
              } else {
                setCurrentPastPage(Math.max(1, currentPastPage - 1));
              }
            }}
            disabled={currentPage === 1}
            className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
              currentPage === 1 
                ? 'text-gray-400 bg-gray-50' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            <ChevronLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className={isMobile ? '' : 'hidden sm:inline'}>Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => {
                      if (activeTab === 'upcoming') {
                        setCurrentUpcomingPage(page);
                      } else {
                        setCurrentPastPage(page);
                      }
                    }}
                    className={`${isMobile ? 'min-w-[32px] px-1.5 py-1 text-xs' : 'min-w-[40px] px-2 py-1.5 text-sm'} rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className={`${isMobile ? 'px-1 text-xs' : 'px-2 text-sm'} text-gray-400`}>
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <button
            onClick={() => {
              if (activeTab === 'upcoming') {
                setCurrentUpcomingPage(Math.min(totalUpcomingPages, currentUpcomingPage + 1));
              } else {
                setCurrentPastPage(Math.min(totalPastPages, currentPastPage + 1));
              }
            }}
            disabled={currentPage === totalPages}
            className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
              currentPage === totalPages
                ? 'text-gray-400 bg-gray-50'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            <span className={isMobile ? '' : 'hidden sm:inline'}>Next</span>
            <ChevronRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    try {
      const [hour, minute] = timeString.split(':');
      const date = new Date();
      date.setHours(Number(hour), Number(minute));
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const handleReschedule = (bookingId: string) => {
    const viewing = upcomingViewings.find((v) => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
      setRescheduleMessage('');
      setIsRescheduleModalOpen(true);
    }
  };

  const handleCancel = (bookingId: string) => {
    const viewing = upcomingViewings.find((v) => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
      setCancelMessage('');
      setIsCancelModalOpen(true);
    }
  };

  const getApplicantDetails = (viewing: ViewingBooking) => {
    const details = viewing.viewingDetails?.userDetails;
    return {
      name: details?.fullName || user?.name || [user?.givenName, user?.familyName].filter(Boolean).join(' ') || '',
      email: details?.email || user?.email || '',
      phoneNumber: details?.phoneNumber || user?.phone || '',
    };
  };

  const persistRenterViewingStatus = async (
    viewing: ViewingBooking,
    status: 'cancelled' | 'rescheduled',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const viewingId = String(viewing.id);

    if (isDraftPlaceholder(viewingId)) {
      if (status === 'cancelled') {
        try {
          sessionStorage.removeItem('draft_viewing');
        } catch {
          // ignore storage errors
        }
      }
      return { success: true };
    }

    if (isRequestPlaceholder(viewingId)) {
      const requestId = viewingId.slice(REQUEST_PREFIX.length);
      if (status === 'cancelled') {
        const deleteResult = await bookViewingRequestService.deleteRequest(requestId);
        if (!deleteResult.success) {
          return deleteResult;
        }
        if (user?.id) {
          const all = await viewingService.getUserViewingBookings(user.id);
          const key = getPropertyKey(viewing);
          const linked = (all.bookings || []).filter(
            (booking) => getPropertyKey(booking) === key && isUpcomingStatus(booking.status)
          );
          await Promise.all(
            linked.map((booking) => viewingService.updateViewingStatus(booking.id, 'cancelled', notes))
          );
        }
      }
      return { success: true };
    }

    const updateResult = await viewingService.updateViewingStatus(viewing.id, status, notes);
    if (!updateResult.success) {
      return updateResult;
    }

    if (status === 'cancelled' && user?.id) {
      await bookViewingRequestService.deleteRequestsForProperty(user.id, {
        propertyId: viewing.propertyId,
        street: viewing.property?.street,
        town: viewing.property?.town,
      });
    }

    return { success: true };
  };

  const applyOptimisticStatus = (viewing: ViewingBooking, status: 'cancelled' | 'rescheduled') => {
    if (status === 'cancelled') {
      setUpcomingViewings((prev) => prev.filter((item) => item.id !== viewing.id));
      if (!isRequestPlaceholder(viewing.id) && !isDraftPlaceholder(viewing.id)) {
        setPastViewings((prev) => [{ ...viewing, status: 'cancelled' }, ...prev]);
      }
      knownBookingKeysRef.current.add(getPropertyKey(viewing));
    } else if (!isRequestPlaceholder(viewing.id) && !isDraftPlaceholder(viewing.id)) {
      setUpcomingViewings((prev) =>
        prev.map((item) => (item.id === viewing.id ? { ...item, status: 'rescheduled' } : item))
      );
    }
  };

  const notifyAgentOfViewingChange = async (
    viewing: ViewingBooking,
    emailType: 'viewing-reschedule' | 'viewing-cancel',
    message: string
  ): Promise<{ success: boolean; skipped?: boolean; error?: string }> => {
    const agentEmail = viewing.property?.agent?.email?.trim();
    if (!agentEmail) {
      return { success: true, skipped: true };
    }

    const applicant = getApplicantDetails(viewing);
    const propertyAddress = [viewing.property?.street, viewing.property?.town, viewing.property?.city]
      .filter(Boolean)
      .join(', ');
    const templateData = {
      property: viewing.property,
      viewing: viewing.viewingDetails,
      user: applicant,
      message,
    };
    const html =
      emailType === 'viewing-reschedule'
        ? generateRescheduleRequestEmailTemplate(templateData)
        : generateCancelViewingEmailTemplate(templateData);

    return emailService.sendEmail({
      to: agentEmail,
      subject:
        emailType === 'viewing-reschedule'
          ? `Viewing Reschedule Request - ${propertyAddress}`
          : `Viewing Cancellation - ${propertyAddress}`,
      formData: {
        property: {
          street: viewing.property?.street,
          town: viewing.property?.town,
          city: viewing.property?.city,
          postcode: viewing.property?.postcode || '',
          agent: {
            name: viewing.property?.agent?.name,
            email: agentEmail,
          },
        },
        viewing: {
          date: viewing.viewingDetails?.date,
          time: viewing.viewingDetails?.time,
          preference: viewing.viewingDetails?.preference || 'in-person',
          ...(emailType === 'viewing-reschedule'
            ? { rescheduleMessage: message }
            : { cancelMessage: message }),
        },
        user: {
          name: applicant.name,
          email: applicant.email,
        },
      },
      html,
      attachments: [],
      emailType,
    });
  };

  const sendRescheduleEmail = async () => {
    if (!selectedViewing || !rescheduleMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSendingEmail(true);
    try {
      const persistResult = await persistRenterViewingStatus(
        selectedViewing,
        'rescheduled',
        `Reschedule requested: ${rescheduleMessage}`
      );

      if (!persistResult.success) {
        alert(persistResult.error || 'Failed to reschedule this viewing. Please try again.');
        return;
      }

      const emailResult = await notifyAgentOfViewingChange(
        selectedViewing,
        'viewing-reschedule',
        rescheduleMessage
      );

      applyOptimisticStatus(selectedViewing, 'rescheduled');
      setIsRescheduleModalOpen(false);
      setRescheduleMessage('');
      setSelectedViewing(null);

      if (emailResult.success && !emailResult.skipped) {
        alert('Reschedule request sent successfully!');
      } else if (emailResult.skipped) {
        alert('Viewing marked as rescheduled. We could not email the agent because no agent email was on file.');
      } else {
        alert('Viewing marked as rescheduled, but the email to the agent could not be sent. Please contact them directly if needed.');
      }
    } catch (error) {
      console.error('Error sending reschedule email:', error);
      alert('An error occurred while sending the reschedule request. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendCancelEmail = async () => {
    if (!selectedViewing) {
      return;
    }

    setIsSendingEmail(true);
    try {
      const persistResult = await persistRenterViewingStatus(
        selectedViewing,
        'cancelled',
        cancelMessage ? `Cancelled: ${cancelMessage}` : undefined
      );

      if (!persistResult.success) {
        alert(persistResult.error || 'Failed to cancel this viewing. Please try again.');
        return;
      }

      const emailResult = await notifyAgentOfViewingChange(
        selectedViewing,
        'viewing-cancel',
        cancelMessage
      );

      applyOptimisticStatus(selectedViewing, 'cancelled');
      setIsCancelModalOpen(false);
      setCancelMessage('');
      setSelectedViewing(null);

      if (emailResult.success && !emailResult.skipped) {
        alert('Cancellation notice sent successfully!');
      } else if (emailResult.skipped) {
        alert('Viewing cancelled. We could not email the agent because no agent email was on file.');
      } else {
        alert('Viewing cancelled, but the email to the agent could not be sent. Please contact them directly if needed.');
      }
    } catch (error) {
      console.error('Error sending cancel email:', error);
      alert('An error occurred while sending the cancellation notice. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleBookAgain = async (bookingId: string) => {
    // TODO: Implement book again functionality
    console.log('Book again:', bookingId);
  };

  const handleViewProperty = (bookingId: string) => {
    // TODO: Implement view property functionality
    console.log('View property:', bookingId);
  };

  // Test function to create a sample viewing
  const createTestViewing = async () => {
    if (!user?.id) {
      console.log('No user ID for test');
      return;
    }

    try {
      const testProperty = {
        street: '123 Test Street',
        town: 'Test Town',
        city: 'Test City',
        postcode: 'TE1 1ST',
        agent: {
          id: 'test-agent-1',
          name: 'Test Agent',
          email: 'test@agent.com',
          phone: '01234567890',
          company: 'Test Estate Agents'
        }
      };

      const testViewingDetails = {
        date: '2024-12-25',
        time: '14:00',
        preference: 'In-Person Viewing',
        userDetails: {
          fullName: 'Test User',
          email: 'test@user.com',
          phoneNumber: '09876543210'
        }
      };

      console.log('Creating test viewing...');
      const result = await viewingService.saveViewingBooking(
        user.id,
        testProperty,
        testViewingDetails,
        'test-property-1',
        {
          landlordId: testProperty.agent?.id || null,
          agentId: testProperty.agent?.id || null,
        }
      );

      console.log('Test viewing result:', result);

      // Immediately try to retrieve it
      if (result.success) {
        console.log('Test viewing created successfully, now trying to retrieve it...');
        const retrieveResult = await viewingService.getUserViewingBookings(user.id);
        console.log('Retrieve result after test creation:', retrieveResult);
      }
    } catch (error) {
      console.error('Error creating test viewing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading viewings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 pb-8 px-4 sm:px-0`} style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header */}
      <div className={`${isMobile ? 'mt-4' : 'mt-8'}`}>
        <div className={`flex ${isMobile ? 'flex-row items-start justify-between gap-3' : 'items-center justify-between'} mb-2`}>
          <div className="flex-1 min-w-0">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`} style={{ color: '#374957' }}>
          Property Viewings
        </h1>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
              Manage and track all your property viewings
            </p>
          </div>
        <button 
            className={`${isMobile ? 'px-4 py-2 text-xs whitespace-nowrap flex-shrink-0' : 'px-12 py-3 text-sm'} text-white rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5`}
            style={{
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              border: '1px solid #DC5F12',
              minHeight: isMobile ? '2.5rem' : '3.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => setIsBookViewingOpen(true)}
          >
            Request Viewing
        </button>
        
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Upcoming Viewings Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Upcoming Viewings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </div>
          <div className="mb-3">
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryUpcomingCount}
              </p>
            </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>As of 8/10/2025</p>
          </div>
        </div>

        {/* Completed Viewings Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Completed Viewings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
            </div>
          </div>
          <div className="mb-3">
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryCompletedCount}
              </p>
            </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Total Completed</p>
          </div>
        </div>

        {/* Rescheduled Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Rescheduled</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`} />
            </div>
          </div>
          <div className="mb-3">
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryRescheduledCount}
            </p>
          </div>
            <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Past 30 days</p>
          </div>
        </div>

        {/* Total Viewings Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#374957' }}>Total Viewings</h3>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Eye className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
            </div>
          </div>
          <div className="mb-3">
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#374957' }}>
              {summaryTotalCount}
              </p>
            </div>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#717182' }}>Total Viewings</p>
            </div>
          </div>
      </div>

      {/* Tabs Section */}
      <div>
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div className="bg-white rounded-full border border-gray-100 p-1 inline-flex w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium transition-colors rounded-l-full whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
              style={{
                backgroundColor: activeTab === 'upcoming' ? '#DC5F12' : 'transparent'
              }}
            >
              Upcoming ({upcomingViewings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium transition-colors rounded-r-full whitespace-nowrap ${
                activeTab === 'past'
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
              style={{
                backgroundColor: activeTab === 'past' ? '#DC5F12' : 'transparent'
              }}
            >
              Past ({pastViewings.length})
            </button>
        </div>
      </div>

        {/* Viewings List */}
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-4 sm:gap-6`}>
          {currentViewings.length === 0 ? (
              <div className="col-span-full text-center py-8 sm:py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto`} />
                </div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-600 mb-2`}>
                  No viewings scheduled
                </h3>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                  Viewings you've requested will appear here.
                </p>
              </div>
            ) : (
              paginatedViewings.map((viewing) => (
            <div key={viewing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                    src={getViewingImage(viewing)} 
                    alt={`${viewing.property.street}, ${viewing.property.town}`} 
                  className="w-full h-full object-cover" 
                />
        </div>
        
              {/* Property Details */}
              <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
                {/* Address */}
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-800 mb-1 truncate`}>
                    {viewing.property.street}
                    </h3>
                
                {/* Location */}
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 mb-3 flex items-center`}>
                  <MapPin className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                    <span className="truncate">{viewing.property.town}, {viewing.property.city} {viewing.property.postcode}</span>
                </p>
                
                {/* Date and Time */}
                <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-4'} ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 mb-3`}>
                  <div className="flex items-center">
                    <Calendar className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                      {formatDate(viewing.viewingDetails.date)}
                    </div>
                  <div className="flex items-center">
                    <Clock className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                      {formatTime(viewing.viewingDetails.time)}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium ${
                      viewing.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : viewing.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : viewing.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : viewing.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : viewing.status === 'rescheduled'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                    </span>
                  </div>

                {/* Estate Agent Details */}
                <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                  <h4 className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-gray-600 mb-2`}>Estate Agent Details</h4>
                  <div className={`flex items-center ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 mb-1`}>
                    <User className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                      <span className="truncate">{viewing.property.agent.name}</span>
                    </div>
                  <div className={`flex items-center ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600`}>
                    <Mail className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1 flex-shrink-0`} />
                      <span className="truncate">{viewing.property.agent.email}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeTab === 'upcoming' ? (
                    <>
                        <button 
                          type="button"
                          onClick={() => handleReschedule(viewing.id)}
                          className={`flex-1 inline-flex items-center justify-center ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-white rounded-lg font-medium hover:opacity-90 transition-colors`} 
                          style={{ backgroundColor: '#136C9E' }}
                        >
                        Reschedule
                      </button>
                        <button 
                          type="button"
                          onClick={() => handleCancel(viewing.id)}
                          className={`flex-1 inline-flex items-center justify-center ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors`}
                        >
                        <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
                        {!isMobile && 'Cancel Viewing'}
                        {isMobile && 'Cancel'}
                      </button>
                    </>
                  ) : (
                    <>
                        <button 
                          onClick={() => handleBookAgain(viewing.id)}
                          className={`flex-1 inline-flex items-center justify-center ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-white rounded-lg font-medium hover:opacity-90 transition-colors`} 
                          style={{ backgroundColor: '#DC5F12' }}
                        >
                        Book Again
                      </button>
                        <button 
                          onClick={() => handleViewProperty(viewing.id)}
                          className={`flex-1 inline-flex items-center justify-center ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors`}
                        >
                        <Eye className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
                        {!isMobile && 'View Property'}
                        {isMobile && 'View'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
        
        {/* Pagination Controls */}
        {currentViewings.length > 0 && <PaginationControls />}
      </div>
      <BookViewingModal
        open={isBookViewingOpen}
        onClose={() => setIsBookViewingOpen(false)}
        onSubmissionComplete={() => {
          setIsBookViewingOpen(false);
          setViewingsVersion((v) => v + 1);
        }}
      />

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Reschedule Viewing</h3>
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleMessage('');
                    setSelectedViewing(null);
                  }}
                  className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0`}
                >
                  <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              </div>
              
              <div className="mb-4">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  Property: <strong>{selectedViewing.property.street}, {selectedViewing.property.town}</strong>
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  Current Date: <strong>{selectedViewing.viewingDetails.date}</strong>
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>
                  Current Time: <strong>{selectedViewing.viewingDetails.time}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                  Message to Agent/Landlord <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rescheduleMessage}
                  onChange={(e) => setRescheduleMessage(e.target.value)}
                  placeholder="Please explain why you need to reschedule and suggest alternative dates/times..."
                  rows={isMobile ? 4 : 6}
                  className={`w-full ${isMobile ? 'px-2.5 py-2 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                />
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
                  This message will be sent via email to {selectedViewing.property.agent?.email || 'the agent'}
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col-reverse' : 'items-center justify-end'} ${isMobile ? 'gap-2' : 'space-x-3'}`}>
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleMessage('');
                    setSelectedViewing(null);
                  }}
                  className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors`}
                  disabled={isSendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={sendRescheduleEmail}
                  disabled={isSendingEmail || !rescheduleMessage.trim()}
                  className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`flex ${isMobile ? 'items-start' : 'items-center'} ${isMobile ? 'gap-2' : 'space-x-3'} mb-4`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-red-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <AlertCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Cancel Viewing</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  Property: <strong>{selectedViewing.property.street}, {selectedViewing.property.town}</strong>
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  Date: <strong>{selectedViewing.viewingDetails.date}</strong>
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>
                  Time: <strong>{selectedViewing.viewingDetails.time}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                  Optional Message to Agent/Landlord
                </label>
                <textarea
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  placeholder="Let them know why you're cancelling (optional)..."
                  rows={isMobile ? 3 : 4}
                  className={`w-full ${isMobile ? 'px-2.5 py-2 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                />
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
                  This message will be sent via email to {selectedViewing.property.agent?.email || 'the agent'}
                </p>
              </div>

              <p className={`text-gray-700 ${isMobile ? 'mb-4' : 'mb-6'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Are you sure you want to cancel this viewing? An email notification will be sent to the agent/landlord.
              </p>

              <div className={`flex ${isMobile ? 'flex-col-reverse' : 'items-center justify-end'} ${isMobile ? 'gap-2' : 'space-x-3'}`}>
                <button
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setCancelMessage('');
                    setSelectedViewing(null);
                  }}
                  className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors`}
                  disabled={isSendingEmail}
                >
                  Keep Viewing
                </button>
                <button
                  onClick={sendCancelEmail}
                  disabled={isSendingEmail}
                  className={`${isMobile ? 'w-full' : ''} ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Cancel Viewing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewings;

