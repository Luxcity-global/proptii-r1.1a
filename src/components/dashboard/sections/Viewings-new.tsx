import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, CheckCircle, Eye, X, Send, AlertCircle, ChevronLeft, ChevronRight, Search, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { maskEmail } from '../../../utils/formatters';
import { viewingService, ViewingBooking, ViewingStats } from '../../../services/viewingService';
import { bookViewingRequestService, BookViewingRequest } from '../../../services/bookViewingRequestService';
import { propertySelectionService, PropertySelection, PropertySelectionStats } from '../../../services/propertySelectionService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSavedProperties } from '../../../contexts/SavedPropertiesContext';
import BookViewingModal from '../../viewings/BookViewingModal';
import emailService from '../../../services/emailService';
import { useIsMobile } from '../ui/use-mobile';
import TenantPageHeader from '../ui/TenantPageHeader';
import '../../../styles/tenantViewings.css';
import '../../../styles/tenantModals.css';

type ViewingsTab = 'upcoming' | 'past' | 'calendar';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const CAL_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function viewingYmd(v: ViewingBooking): string {
  const raw = v.viewingDetails?.date || '';
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : ymd(parsed);
}

function viewingHour(v: ViewingBooking): number | null {
  const t = v.viewingDetails?.time || '';
  const h = Number(String(t).split(':')[0]);
  return Number.isFinite(h) ? h : null;
}

function viewingSortTime(v: ViewingBooking): number {
  const d = viewingYmd(v);
  const t = v.viewingDetails?.time || '00:00';
  if (!d) return 0;
  const ms = new Date(`${d}T${t.length >= 5 ? t.slice(0, 5) : '00:00'}`).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function viewingAddress(v: ViewingBooking): string {
  return [v.property.street, v.property.town, v.property.city, v.property.postcode].filter(Boolean).join(', ');
}

function statusClass(status: string): string {
  if (status === 'pending' || status === 'confirmed' || status === 'completed' || status === 'cancelled' || status === 'rescheduled') {
    return status;
  }
  return 'pending';
}

function statusLabel(status: string): string {
  if (status === 'pending') return 'Pending';
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'rescheduled') return 'Rescheduled';
  return status;
}

/**
 * Viewings section - redesigned to follow style guide
 */
const Viewings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { savedProperties } = useSavedProperties();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewingsTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [calendarDetail, setCalendarDetail] = useState<ViewingBooking | null>(null);
  const [bookAgainPrefill, setBookAgainPrefill] = useState<{
    id?: string;
    street: string;
    agent: { id: string; name: string; email: string; phone: string; company: string };
  } | null>(null);
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<ViewingBooking | null>(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState('');
  const [rescheduleNewTime, setRescheduleNewTime] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // State for pre-filling the booking modal from search results navigation
  const [prefilledPropertyData, setPrefilledPropertyData] = useState<any>(null);

  const location = useLocation();

  // When navigated here from search results ("Book Viewing" click), auto-open
  // the booking modal with the property pre-filled.
  useEffect(() => {
    // Check router state first (preferred, no serialization)
    const navState = location.state as { openBookingModal?: boolean; prefilledProperty?: any } | null;
    if (navState?.openBookingModal && navState.prefilledProperty) {
      setPrefilledPropertyData(navState.prefilledProperty);
      setIsBookViewingOpen(true);
      return;
    }
    // Fallback: sessionStorage (written by handleBookViewingClick)
    try {
      const stored = sessionStorage.getItem('prefilledProperty');
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.removeItem('prefilledProperty');
        setPrefilledPropertyData(parsed);
        setIsBookViewingOpen(true);
      }
    } catch {
      sessionStorage.removeItem('prefilledProperty');
    }
  }, []);
  
  // Pagination state
  const [currentUpcomingPage, setCurrentUpcomingPage] = useState<number>(1);
  const [currentPastPage, setCurrentPastPage] = useState<number>(1);
  
  const ITEMS_PER_PAGE = 10;

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
    return (match?.property?.images?.[0]) || '/images/detached-house.jpg';
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
        // Load upcoming viewings (pending and confirmed)
        const upcomingResult = await viewingService.getViewingBookingsByStatus(user.id, 'pending');
        const confirmedResult = await viewingService.getViewingBookingsByStatus(user.id, 'confirmed');
        
        console.log('Upcoming result:', upcomingResult);
        console.log('Confirmed result:', confirmedResult);
        
        let upcoming = [
          ...(upcomingResult.bookings || []),
          ...(confirmedResult.bookings || [])
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
            (b: any) => b.status === 'pending' || b.status === 'confirmed'
          );
        }

        // Only add request placeholders for properties that don't have real bookings
        const realBookingKeys = new Set<string>();
        upcoming.forEach(b => {
          const key = b.propertyId || `${b.property.street}-${b.property.town}`;
          realBookingKeys.add(key);
        });
        
        const filteredRequestBookings = requestBookings.filter(r => {
          const key = r.propertyId || `${r.property.street}-${r.property.town}`;
          return !realBookingKeys.has(key);
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
            (b: any) => b.status === 'completed' || b.status === 'cancelled'
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
  }, [user?.id]);

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
        const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
        const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
        console.log('Filtered upcoming:', upcoming);
        console.log('Filtered past:', past);
        setUpcomingViewings(prev => {
          // Get request placeholders from previous state
          const requests = prev.filter(v => String(v.id).startsWith('request_'));
          
          // Only keep request placeholders that don't have real bookings
          const realBookingKeys = new Set<string>();
          upcoming.forEach(b => {
            const key = b.propertyId || `${b.property.street}-${b.property.town}`;
            realBookingKeys.add(key);
          });
          
          const filteredRequests = requests.filter(r => {
            const key = r.propertyId || `${r.property.street}-${r.property.town}`;
            return !realBookingKeys.has(key);
          });
          
          // Combine real bookings with filtered request placeholders
          return [...upcoming, ...filteredRequests];
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
            agent: r.property.agent
          },
          viewingDetails: { date: '', time: '', preference: 'In-Person Viewing', userDetails: { fullName: '', email: '', phoneNumber: '' } },
          status: 'pending',
          createdAt: undefined as any,
          updatedAt: undefined as any
        }));
        setUpcomingViewings(prev => {
          // Get real bookings (not request placeholders)
          const realBookings = prev.filter(v => !String(v.id).startsWith('request_'));
          
          // Only add request placeholders for properties that don't have real bookings
          const realBookingKeys = new Set<string>();
          realBookings.forEach(b => {
            const key = b.propertyId || `${b.property.street}-${b.property.town}`;
            realBookingKeys.add(key);
          });
          
          const filteredRequestBookings = requestBookings.filter(r => {
            const key = r.propertyId || `${r.property.street}-${r.property.town}`;
            return !realBookingKeys.has(key);
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

  const pendingCount = isAuthenticated ? upcomingViewings.filter((v) => v.status === 'pending').length : 0;
  const confirmedCount = isAuthenticated ? upcomingViewings.filter((v) => v.status === 'confirmed').length : 0;
  const summaryUpcomingCount = isAuthenticated ? upcomingViewings.length : 0;
  const summaryCompletedCount = isAuthenticated ? viewingStats.completed : 0;
  const summaryRescheduledCount = isAuthenticated ? viewingStats.rescheduled : 0;
  const summaryTotalCount = isAuthenticated ? viewingStats.total : 0;
  const recommendedSaved = savedProperties.slice(0, 3);
  const hasAnyViewings = upcomingViewings.length > 0 || pastViewings.length > 0;

  const { filteredUpcoming, filteredPast } = useMemo(() => {
    const run = (list: ViewingBooking[]) => {
      const q = searchQuery.trim().toLowerCase();
      let next = list.filter((v) => {
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        if (!q) return true;
        const hay = `${viewingAddress(v)} ${v.property.agent?.name || ''}`.toLowerCase();
        return hay.includes(q);
      });
      next = [...next].sort((a, b) => {
        const diff = viewingSortTime(a) - viewingSortTime(b);
        return sortOrder === 'newest' ? -diff : diff;
      });
      return next;
    };
    return { filteredUpcoming: run(upcomingViewings), filteredPast: run(pastViewings) };
  }, [upcomingViewings, pastViewings, searchQuery, statusFilter, sortOrder]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const allDatedViewings = useMemo(
    () => [...upcomingViewings, ...pastViewings].filter((v) => viewingYmd(v)),
    [upcomingViewings, pastViewings]
  );
  const weekViewings = useMemo(() => {
    const keys = new Set(weekDays.map(ymd));
    const q = searchQuery.trim().toLowerCase();
    return allDatedViewings.filter((v) => {
      if (!keys.has(viewingYmd(v))) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (!q) return true;
      return `${viewingAddress(v)} ${v.property.agent?.name || ''}`.toLowerCase().includes(q);
    });
  }, [allDatedViewings, weekDays, searchQuery, statusFilter]);

  const totalUpcomingPages = Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE);
  const upcomingStartIndex = (currentUpcomingPage - 1) * ITEMS_PER_PAGE;
  const upcomingEndIndex = upcomingStartIndex + ITEMS_PER_PAGE;
  const paginatedUpcomingViewings = useMemo(() => {
    return filteredUpcoming.slice(upcomingStartIndex, upcomingEndIndex);
  }, [filteredUpcoming, upcomingStartIndex, upcomingEndIndex]);

  const totalPastPages = Math.ceil(filteredPast.length / ITEMS_PER_PAGE);
  const pastStartIndex = (currentPastPage - 1) * ITEMS_PER_PAGE;
  const pastEndIndex = pastStartIndex + ITEMS_PER_PAGE;
  const paginatedPastViewings = useMemo(() => {
    return filteredPast.slice(pastStartIndex, pastEndIndex);
  }, [filteredPast, pastStartIndex, pastEndIndex]);

  useEffect(() => {
    setCurrentUpcomingPage(1);
    setCurrentPastPage(1);
  }, [activeTab, searchQuery, statusFilter, sortOrder]);

  const paginatedViewings = activeTab === 'upcoming' ? paginatedUpcomingViewings : paginatedPastViewings;
  const filteredCurrent = activeTab === 'past' ? filteredPast : filteredUpcoming;
  const currentPage = activeTab === 'upcoming' ? currentUpcomingPage : currentPastPage;
  const totalPages = activeTab === 'upcoming' ? totalUpcomingPages : totalPastPages;
  const startIndex = activeTab === 'upcoming' ? upcomingStartIndex : pastStartIndex;
  const endIndex = activeTab === 'upcoming' ? upcomingEndIndex : pastEndIndex;
  const totalItems = activeTab === 'upcoming' ? filteredUpcoming.length : filteredPast.length;

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="tn-vw-pager">
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

  const handleReschedule = async (bookingId: string) => {
    const viewing = upcomingViewings.find(v => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
      setRescheduleNewDate('');
      setRescheduleNewTime('');
      setRescheduleMessage('');
      setIsRescheduleModalOpen(true);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const viewing = upcomingViewings.find(v => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
      setCancelMessage('');
      setIsCancelModalOpen(true);
    }
  };

  const sendRescheduleEmail = async () => {
    if (!selectedViewing || !rescheduleMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    if (!rescheduleNewDate || !rescheduleNewTime) {
      alert('Please select the new date and time for the reschedule');
      return;
    }

    setIsSendingEmail(true);
    try {
      const formData = {
        property: {
          street: selectedViewing.property.street,
          town: selectedViewing.property.town,
          city: selectedViewing.property.city,
          postcode: selectedViewing.property.postcode || '',
          agent: {
            name: selectedViewing.property.agent.name,
            email: selectedViewing.property.agent.email
          }
        },
        viewing: {
          date: rescheduleNewDate,
          time: rescheduleNewTime,
          preference: selectedViewing.viewingDetails.preference || 'in-person',
          rescheduleMessage: rescheduleMessage
        },
        user: {
          name: selectedViewing.viewingDetails.userDetails.fullName,
          email: selectedViewing.viewingDetails.userDetails.email
        }
      };

      const propertyAddress = `${selectedViewing.property.street}, ${selectedViewing.property.town}, ${selectedViewing.property.city}`;

      const result = await emailService.sendEmail({
        to: selectedViewing.property.agent.email,
        subject: `Viewing Reschedule Request - ${propertyAddress}`,
        formData: formData,
        attachments: [],
        emailType: 'viewing-reschedule'
      });

      if (result.success) {
        // P2-1: Store the new date and time in Firestore so the card updates
        await viewingService.updateViewingStatus(
          selectedViewing.id,
          'rescheduled',
          `Reschedule requested: ${rescheduleMessage}`,
          undefined,
          {
            viewingDetails: {
              ...selectedViewing.viewingDetails,
              date: rescheduleNewDate,
              time: rescheduleNewTime,
            }
          }
        );

        alert('Reschedule request sent successfully!');
        setIsRescheduleModalOpen(false);
        setRescheduleNewDate('');
        setRescheduleNewTime('');
        setRescheduleMessage('');
        setSelectedViewing(null);
      } else {
        alert('Failed to send reschedule request. Please try again.');
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
      // Structure data for cancel email (only to agent, not user confirmation)
      const formData = {
        property: {
          street: selectedViewing.property.street,
          town: selectedViewing.property.town,
          city: selectedViewing.property.city,
          postcode: selectedViewing.property.postcode || '',
          agent: {
            name: selectedViewing.property.agent.name,
            email: selectedViewing.property.agent.email
          }
        },
        viewing: {
          date: selectedViewing.viewingDetails.date,
          time: selectedViewing.viewingDetails.time,
          preference: selectedViewing.viewingDetails.preference || 'in-person',
          cancelMessage: cancelMessage || ''
        },
        user: {
          name: selectedViewing.viewingDetails.userDetails.fullName,
          email: selectedViewing.viewingDetails.userDetails.email
        }
      };

      const propertyAddress = `${selectedViewing.property.street}, ${selectedViewing.property.town}, ${selectedViewing.property.city}`;
      const agentEmail = selectedViewing.property.agent.email;

      // Log the email details for debugging
      console.log('Sending cancellation email:', {
        to: agentEmail,
        property: propertyAddress,
        viewingDate: selectedViewing.viewingDetails.date,
        viewingTime: selectedViewing.viewingDetails.time,
        userMessage: cancelMessage || 'No message provided'
      });

      // Send cancel-specific email directly to agent (not using viewingEmailService which sends both agent and user emails)
      const result = await emailService.sendEmail({
        to: agentEmail,
        subject: `Viewing Cancellation - ${propertyAddress}`,
        formData: formData,
        attachments: [],
        emailType: 'viewing-cancel'
      });

      console.log('Cancellation email result:', result);

      if (result.success) {
        await viewingService.updateViewingStatus(selectedViewing.id, 'cancelled');

        alert('Cancellation notice sent successfully!');
        setIsCancelModalOpen(false);
        setCancelMessage('');
        setSelectedViewing(null);
      } else {
        alert('Failed to send cancellation notice. Please try again.');
      }
    } catch (error) {
      console.error('Error sending cancel email:', error);
      alert('An error occurred while sending the cancellation notice. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const openBookViewing = (prefill?: typeof bookAgainPrefill) => {
    setBookAgainPrefill(prefill || null);
    setIsBookViewingOpen(true);
  };

  const handleBookAgain = async (bookingId: string) => {
    const viewing = pastViewings.find(v => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
      openBookViewing({
        id: viewing.propertyId || undefined,
        street: viewing.property.street,
        agent: viewing.property.agent,
      });
      return;
    }
    openBookViewing();
  };

  const handleViewProperty = (bookingId: string) => {
    const viewing = pastViewings.find(v => v.id === bookingId);
    if (!viewing) return;
    const propertyId = viewing.propertyId;
    if (propertyId) {
      navigate(`/search?propertyId=${encodeURIComponent(propertyId)}`);
    } else {
      const query = [viewing.property.street, viewing.property.town, viewing.property.city]
        .filter(Boolean)
        .join(', ');
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
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

  const formatHourLabel = (hour: number) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h} ${suffix}`;
  };

  const renderViewingActions = (viewing: ViewingBooking, upcoming: boolean) => (
    <div className="tn-vw-actions">
      {upcoming ? (
        <>
          <button type="button" className="tn-vw-act-blue" onClick={() => handleReschedule(viewing.id)}>
            Reschedule
          </button>
          <button type="button" className="tn-vw-act-red" onClick={() => handleCancel(viewing.id)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button type="button" className="tn-vw-act-orange" onClick={() => handleBookAgain(viewing.id)}>
            Book Again
          </button>
          <button type="button" className="tn-vw-act-ghost" onClick={() => handleViewProperty(viewing.id)}>
            View Property
          </button>
        </>
      )}
    </div>
  );

  const renderViewingCard = (viewing: ViewingBooking, upcoming: boolean) => (
    <article key={viewing.id} className="tn-vw-card">
      <div className="tn-vw-card-img">
        <img src={getViewingImage(viewing)} alt={viewing.property.street} />
        <span className={`tn-vw-badge ${statusClass(viewing.status)}`}>{statusLabel(viewing.status)}</span>
      </div>
      <div className="tn-vw-card-body">
        <div className="tn-vw-when">
          {formatDate(viewing.viewingDetails.date)} · {formatTime(viewing.viewingDetails.time)}
        </div>
        <h3>{viewing.property.street}</h3>
        <p className="tn-vw-addr">
          <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
          {viewingAddress(viewing)}
        </p>
        {viewing.property.agent?.name && (
          <div className="tn-vw-agent">
            <User size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
            Agent: <strong>{viewing.property.agent.name}</strong>
            {viewing.property.agent.company ? ` · ${viewing.property.agent.company}` : ''}
          </div>
        )}
        {renderViewingActions(viewing, upcoming)}
      </div>
    </article>
  );

  return (
    <div className="tn-vw">
      <TenantPageHeader
        title="Viewings"
        subtitle="Here's the latest update on your portfolio today."
        primaryLabel="Request Viewing"
        primaryIcon={<Eye size={16} />}
        onPrimary={() => openBookViewing()}
        onInsights={() => setIsInsightsOpen(true)}
      />

      <div className="tn-vw-body">
        {loading ? (
          <div className="tn-vw-kpis">
            <div className="tn-vw-skel" />
            <div className="tn-vw-skel" />
            <div className="tn-vw-skel" />
            <div className="tn-vw-skel" />
          </div>
        ) : error ? (
          <div className="tn-vw-none">
            <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>
            <button type="button" className="tn-vw-btn-blue" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="tn-vw-kpis">
              <div className="tn-vw-kpi">
                <div className="tn-vw-kpi-top">
                  <span>Pending Confirmation</span>
                  <div className="tn-vw-kpi-ico amber"><Clock size={16} /></div>
                </div>
                <p>{pendingCount}</p>
                <em>Awaiting agent response</em>
              </div>
              <div className="tn-vw-kpi">
                <div className="tn-vw-kpi-top">
                  <span>Upcoming / Confirmed</span>
                  <div className="tn-vw-kpi-ico blue"><Calendar size={16} /></div>
                </div>
                <p>{confirmedCount}</p>
                <em>Next 30 days</em>
              </div>
              <div className="tn-vw-kpi">
                <div className="tn-vw-kpi-top">
                  <span>Completed</span>
                  <div className="tn-vw-kpi-ico green"><CheckCircle size={16} /></div>
                </div>
                <p>{summaryCompletedCount}</p>
                <em>Total visits done</em>
              </div>
              <div className="tn-vw-kpi">
                <div className="tn-vw-kpi-top">
                  <span>Rescheduled</span>
                  <div className="tn-vw-kpi-ico orange"><RotateCcw size={16} /></div>
                </div>
                <p>{summaryRescheduledCount}</p>
                <em>Needs new time slot</em>
              </div>
            </div>

            <div className="tn-vw-toolbar">
              <div className="tn-vw-tabs">
                <button
                  type="button"
                  className={`tn-vw-tab${activeTab === 'upcoming' ? ' is-on' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                  <span className="tn-vw-tab-count">{upcomingViewings.length}</span>
                </button>
                <button
                  type="button"
                  className={`tn-vw-tab${activeTab === 'past' ? ' is-on' : ''}`}
                  onClick={() => setActiveTab('past')}
                >
                  Past/Completed
                  <span className="tn-vw-tab-count">{pastViewings.length}</span>
                </button>
                <button
                  type="button"
                  className={`tn-vw-tab${activeTab === 'calendar' ? ' is-on' : ''}`}
                  onClick={() => setActiveTab('calendar')}
                >
                  Calendar View
                  <span className="tn-vw-tab-count">{allDatedViewings.length}</span>
                </button>
              </div>
              <div className="tn-vw-tools">
                <div className="tn-vw-search">
                  <Search size={14} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Properties..."
                  />
                </div>
                <select
                  className="tn-vw-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  aria-label="Filter"
                >
                  <option value="all">Filter: All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  className="tn-vw-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  aria-label="Sort"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
                {activeTab !== 'calendar' && (
                  <div className="tn-vw-toggle">
                    <button type="button" className={viewMode === 'grid' ? 'is-on' : ''} onClick={() => setViewMode('grid')}>
                      <LayoutGrid size={14} /> Grid
                    </button>
                    <button type="button" className={viewMode === 'table' ? 'is-on' : ''} onClick={() => setViewMode('table')}>
                      <List size={14} /> Table
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!hasAnyViewings ? (
              <>
                <div className="tn-vw-empty">
                  <div className="tn-vw-empty-icon"><Eye size={22} /></div>
                  <h2>No viewings scheduled yet</h2>
                  <p>
                    Once you request a viewing, it appears here. You can book <strong>in-person walkthroughs</strong> or{' '}
                    <strong>virtual tours</strong> — agents typically confirm within 2–4 hours. Automated SMS and email
                    reminders keep you on track.
                  </p>
                  <div className="tn-vw-steps">
                    <span className="tn-vw-step"><span className="tn-vw-step-num">1</span> Find a listing</span>
                    <span aria-hidden="true">→</span>
                    <span className="tn-vw-step"><span className="tn-vw-step-num">2</span> Request a viewing</span>
                    <span aria-hidden="true">→</span>
                    <span className="tn-vw-step"><span className="tn-vw-step-num">3</span> Agent confirms</span>
                    <span aria-hidden="true">→</span>
                    <span className="tn-vw-step"><span className="tn-vw-step-num">4</span> Visit & decide</span>
                  </div>
                  <div className="tn-vw-empty-actions">
                    <button type="button" className="tn-vw-btn-orange" onClick={() => navigate('/search')}>
                      Browse Available Listings
                    </button>
                    <button type="button" className="tn-vw-btn-blue" onClick={() => openBookViewing()}>
                      Book Viewing
                    </button>
                  </div>
                </div>
                {recommendedSaved.length > 0 && (
                  <>
                    <div className="tn-vw-rec-head">
                      <div>
                        <h3>Recommended Properties</h3>
                        <p>From your saved properties</p>
                      </div>
                      <button type="button" className="tn-vw-rec-link" onClick={() => navigate('/dashboard/saved-searches')}>
                        Browse All Listings →
                      </button>
                    </div>
                    <div className="tn-vw-rec-grid">
                      {recommendedSaved.map((property) => (
                        <article key={property.id} className="tn-vw-rec-card">
                          <img src={property.imageUrls?.[0] || '/images/detached-house.jpg'} alt={property.title} />
                          <div className="tn-vw-rec-body">
                            <h4>{property.title}</h4>
                            <p>{property.location}</p>
                            <button
                              type="button"
                              className="tn-vw-btn-orange"
                              onClick={() => navigate(`/search?propertyId=${encodeURIComponent(property.id)}`)}
                            >
                              View Details
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : activeTab === 'calendar' ? (
              <div className="tn-vw-cal">
                <div className="tn-vw-cal-head">
                  <h2>
                    {weekStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="tn-vw-cal-nav">
                    <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
                      <ChevronLeft size={16} />
                    </button>
                    <button type="button" className="today" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
                      Today
                    </button>
                    <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="tn-vw-cal-scroll">
                  <div className="tn-vw-cal-grid">
                    <div />
                    {weekDays.map((day) => {
                      const today = ymd(day) === ymd(new Date());
                      return (
                        <div key={ymd(day)} className={`tn-vw-cal-day${today ? ' is-today' : ''}`}>
                          <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <strong>{day.getDate()}</strong>
                        </div>
                      );
                    })}
                    {CAL_HOURS.map((hour) => (
                      <React.Fragment key={hour}>
                        <div className="tn-vw-cal-time">{formatHourLabel(hour)}</div>
                        {weekDays.map((day) => {
                          const key = ymd(day);
                          const slotViewings = weekViewings.filter(
                            (v) => viewingYmd(v) === key && viewingHour(v) === hour
                          );
                          return (
                            <div
                              key={`${key}-${hour}`}
                              className="tn-vw-cal-cell"
                              onClick={() => {
                                if (slotViewings.length === 0) openBookViewing();
                              }}
                            >
                              {slotViewings.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  className="tn-vw-cal-chip"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCalendarDetail(v);
                                  }}
                                >
                                  {v.property.street}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredCurrent.length === 0 ? (
              <div className="tn-vw-none">
                {activeTab === 'past'
                  ? 'No past viewings match these filters.'
                  : 'No upcoming viewings match these filters.'}
              </div>
            ) : viewMode === 'table' ? (
              <>
                <div className="tn-vw-table-wrap">
                  <table className="tn-vw-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Agent</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedViewings.map((viewing) => (
                        <tr key={viewing.id}>
                          <td>
                            <strong>{viewing.property.street}</strong>
                            <div style={{ color: '#64748b', marginTop: 2 }}>{viewingAddress(viewing)}</div>
                          </td>
                          <td>{formatDate(viewing.viewingDetails.date)}</td>
                          <td>{formatTime(viewing.viewingDetails.time)}</td>
                          <td>
                            <span className={`tn-vw-pill ${statusClass(viewing.status)}`}>
                              {statusLabel(viewing.status)}
                            </span>
                          </td>
                          <td>{viewing.property.agent?.name || '—'}</td>
                          <td>{renderViewingActions(viewing, activeTab === 'upcoming')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredCurrent.length > 0 && <PaginationControls />}
              </>
            ) : (
              <>
                <div className="tn-vw-grid">
                  {paginatedViewings.map((viewing) => renderViewingCard(viewing, activeTab === 'upcoming'))}
                </div>
                {filteredCurrent.length > 0 && <PaginationControls />}
              </>
            )}
          </>
        )}
      </div>


      <BookViewingModal
        open={isBookViewingOpen}
        onClose={() => {
          setIsBookViewingOpen(false);
          setBookAgainPrefill(null);
          setPrefilledPropertyData(null);
        }}
        prefilledPropertyData={bookAgainPrefill || prefilledPropertyData}
        onSubmissionComplete={() => {
          setIsBookViewingOpen(false);
          setBookAgainPrefill(null);
          setPrefilledPropertyData(null);
        }}
      />

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Reschedule Viewing</h3>
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleNewDate('');
                    setRescheduleNewTime('');
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

              {/* New date/time — stored in Firestore on submit (P2-1) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                    New Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={rescheduleNewDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRescheduleNewDate(e.target.value)}
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                    New Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={rescheduleNewTime}
                    onChange={(e) => setRescheduleNewTime(e.target.value)}
                    className={`w-full ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
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
                  This message will be sent via email to{' '}
                  <span className="font-mono tracking-wide">{maskEmail(selectedViewing.property.agent.email)}</span>
                </p>
              </div>

              <div className={`flex ${isMobile ? 'flex-col-reverse' : 'items-center justify-end'} ${isMobile ? 'gap-2' : 'space-x-3'}`}>
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleNewDate('');
                    setRescheduleNewTime('');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  This message will be sent via email to{' '}
                  <span className="font-mono tracking-wide">{maskEmail(selectedViewing.property.agent.email)}</span>
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

      {isInsightsOpen && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInsightsOpen(false); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-vw-insights">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico blue">★</span>
                <div>
                  <h3 id="tn-vw-insights">Portfolio Insights</h3>
                  <p>Counts from your viewing activity</p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setIsInsightsOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <div className="tn-insights-grid">
                <div className="tn-insights-card">
                  <span>Pending</span>
                  <p>{pendingCount}</p>
                  <em>Awaiting confirmation</em>
                </div>
                <div className="tn-insights-card">
                  <span>Upcoming</span>
                  <p>{summaryUpcomingCount}</p>
                  <em>Pending + confirmed</em>
                </div>
                <div className="tn-insights-card">
                  <span>Completed</span>
                  <p>{summaryCompletedCount}</p>
                  <em>Visits done</em>
                </div>
                <div className="tn-insights-card">
                  <span>Total</span>
                  <p>{summaryTotalCount}</p>
                  <em>All recorded viewings</em>
                </div>
              </div>
            </div>
            <div className="tn-modal-foot">
              <button type="button" className="tn-modal-blue" onClick={() => setIsInsightsOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {calendarDetail && (
        <div className="tn-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCalendarDetail(null); }}>
          <div className="tn-modal" role="dialog" aria-labelledby="tn-vw-cal-detail">
            <div className="tn-modal-head">
              <div className="tn-drawer-head-main">
                <span className="tn-modal-ico blue"><Calendar size={16} /></span>
                <div>
                  <h3 id="tn-vw-cal-detail">{calendarDetail.property.street}</h3>
                  <p>{statusLabel(calendarDetail.status)}</p>
                </div>
              </div>
              <button type="button" className="tn-modal-x" onClick={() => setCalendarDetail(null)} aria-label="Close">✕</button>
            </div>
            <div className="tn-modal-body">
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>
                Date: <strong>{formatDate(calendarDetail.viewingDetails.date)}</strong>
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>
                Time: <strong>{formatTime(calendarDetail.viewingDetails.time)}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                {viewingAddress(calendarDetail)}
              </p>
              {calendarDetail.property.agent?.name && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: '#475569' }}>
                  Agent: <strong>{calendarDetail.property.agent.name}</strong>
                  {calendarDetail.property.agent.email ? ` · ${calendarDetail.property.agent.email}` : ''}
                </p>
              )}
            </div>
            <div className="tn-modal-foot">
              {(calendarDetail.status === 'pending' || calendarDetail.status === 'confirmed') ? (
                <>
                  <button
                    type="button"
                    className="tn-modal-cancel"
                    onClick={() => {
                      const id = calendarDetail.id;
                      setCalendarDetail(null);
                      handleReschedule(id);
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className="tn-modal-primary"
                    onClick={() => {
                      const id = calendarDetail.id;
                      setCalendarDetail(null);
                      handleCancel(id);
                    }}
                  >
                    Cancel Viewing
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="tn-modal-blue"
                  onClick={() => {
                    const id = calendarDetail.id;
                    setCalendarDetail(null);
                    handleViewProperty(id);
                  }}
                >
                  View Property
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewings;

