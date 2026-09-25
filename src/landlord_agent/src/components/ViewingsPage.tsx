import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  X,
  Send,
  Mail,
  User,
  Eye,
  MapPin,
  Search,
  Filter,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Bell,
  Sparkles,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';
import viewingService, { ViewingBooking, ViewingStats } from '../../../services/viewingService';
import {
  bookViewingRequestService,
  BookViewingRequest
} from '../../../services/bookViewingRequestService';
import emailService from '../../../services/emailService';
import landlordUserService from '../../../services/landlordUserService';
import { useIsMobile } from './ui/use-mobile';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { trackEvent } from '../../../utils/analytics';
import { LandlordPageEmptyShell } from './LandlordPageEmptyShell';
import { isNewPortfolioUser } from '../utils/portfolioStatus';
import { Property, UserProfile } from '../App';
import {
  getAgentDummyViewingRequests,
  getAgentDummyViewings,
  isAgentTestAccount,
  mergeById,
} from '../data/agentTestPersona';
import '../styles/viewingsPage.css';

// ViewingsPage component for managing property viewings and requests

type TabKey = 'requests' | 'upcoming' | 'completed' | 'calendar';
type DisplayStyle = 'grid' | 'table';

interface ViewingsPageProps {
  managerId: string | null;
  managerName?: string;
  managerEmail?: string;
  userProfile?: UserProfile | null;
  properties?: Property[];
  onAddProperty?: () => void;
  onRefresh?: () => void;
  onViewSettings?: () => void;
  onViewNotifications?: () => void;
  onViewInsights?: () => void;
}

interface ScheduleFormState {
  date: string;
  time: string;
  preference: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
}

interface RescheduleFormState {
  date: string;
  time: string;
  message: string;
}

interface RequestViewingFormState {
  propertyId: string;
  date: string;
  time: string;
  preference: 'In-Person Viewing' | 'Virtual Viewing';
  notes: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
}

const initialScheduleForm: ScheduleFormState = {
  date: '',
  time: '',
  preference: 'In-Person Viewing',
  tenantName: '',
  tenantEmail: '',
  tenantPhone: ''
};

const initialRescheduleForm: RescheduleFormState = {
  date: '',
  time: '',
  message: ''
};

const initialRequestForm: RequestViewingFormState = {
  propertyId: '',
  date: '',
  time: '14:00',
  preference: 'In-Person Viewing',
  notes: '',
  tenantName: '',
  tenantEmail: '',
  tenantPhone: ''
};

const VIEWING_TIME_SLOTS = [
  { value: '10:00', label: '10:00 AM – 10:45 AM' },
  { value: '11:30', label: '11:30 AM – 12:15 PM' },
  { value: '14:00', label: '02:00 PM – 02:45 PM' },
  { value: '16:00', label: '04:00 PM – 04:45 PM' },
  { value: '18:00', label: '06:00 PM – 06:45 PM (Evening)' },
];

const CALENDAR_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const CALENDAR_EVENT_COLORS = ['#136C9E', '#7c3aed', '#DC5F12', '#059669', '#0369a1'];

function propertyStreet(address?: string): string {
  if (!address) return 'Property';
  return (address.split(',')[0] || address).trim();
}

function statusDisplayLabel(status: ViewingBooking['status']): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed by Agent';
    case 'pending':
      return 'Awaiting Confirmation';
    case 'rescheduled':
      return 'Reschedule Proposed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function formatLongDate(date: string) {
  if (!date) return 'TBD';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDateKey(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const normalized = a.includes('T') ? a.slice(0, 10) : a.slice(0, 10);
  return normalized === b;
}

function parseViewingHour(time?: string): number | null {
  if (!time) return null;
  const trimmed = time.trim();
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    if (Number.isFinite(hour)) return hour;
  }
  const twelve = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelve) {
    let hour = Number(twelve[1]);
    const meridiem = twelve[3].toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour;
  }
  return null;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function calendarEventColor(index: number): string {
  return CALENDAR_EVENT_COLORS[index % CALENDAR_EVENT_COLORS.length];
}

function formatDate(date: string) {
  if (!date) return 'TBD';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return date;
  }
}

function formatTime(time: string) {
  if (!time) return 'TBD';
  try {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute));
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return time;
  }
}

const ViewingsPage: React.FC<ViewingsPageProps> = ({
  managerId,
  managerName,
  managerEmail,
  userProfile,
  properties = [],
  onAddProperty,
  onRefresh,
  onViewSettings,
  onViewNotifications,
  onViewInsights,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState<BookViewingRequest[]>([]);
  const [bookings, setBookings] = useState<ViewingBooking[]>([]);
  const [stats, setStats] = useState<ViewingStats>({ upcoming: 0, completed: 0, rescheduled: 0, total: 0 });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookViewingRequest | null>(null);
  const [selectedViewing, setSelectedViewing] = useState<ViewingBooking | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(initialScheduleForm);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>(initialRescheduleForm);
  const [requestForm, setRequestForm] = useState<RequestViewingFormState>(initialRequestForm);
  const [cancelMessage, setCancelMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'date' | 'status'>('all');
  const [selectedViewings, setSelectedViewings] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();
  const isAuthenticatedUser = Boolean(userProfile);
  const showAsTable = displayStyle === 'table' && !isMobile;
  const isAgentPersona = isAgentTestAccount(managerId, managerEmail);

  const withAgentDummyRequests = (live: BookViewingRequest[]) =>
    isAgentPersona ? mergeById(getAgentDummyViewingRequests(), live) : live;

  const withAgentDummyBookings = (live: ViewingBooking[]) =>
    isAgentPersona ? mergeById(getAgentDummyViewings(), live) : live;

  const statsFromBookings = (items: ViewingBooking[]): ViewingStats =>
    items.reduce<ViewingStats>(
      (acc, booking) => {
        acc.total++;
        if (['pending', 'confirmed'].includes(booking.status)) acc.upcoming++;
        if (booking.status === 'completed') acc.completed++;
        if (booking.status === 'rescheduled') acc.rescheduled++;
        return acc;
      },
      { upcoming: 0, completed: 0, rescheduled: 0, total: 0 },
    );

  const handleHeaderRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedViewings(new Set());
  };
  
  // Pagination state for each tab
  const [currentRequestsPage, setCurrentRequestsPage] = useState<number>(1);
  const [currentUpcomingPage, setCurrentUpcomingPage] = useState<number>(1);
  const [currentCompletedPage, setCurrentCompletedPage] = useState<number>(1);
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeRequests: (() => void) | undefined;
    let unsubscribeStats: (() => void) | undefined;

    if (!isAuthenticatedUser) {
      // Don't proceed if not authenticated - empty state is shown instead
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Look up the landlordUser record by email to get the correct landlordUser ID
        // This is important because the auth user ID might be different from the landlordUser ID
        let landlordUserId: string | null = null;
        let foundLandlordUser: any = null;
        
        if (managerEmail) {
          const lookupResult = await landlordUserService.getLandlordUserByEmail(managerEmail);
          if (lookupResult.success && lookupResult.user?.id) {
            landlordUserId = lookupResult.user.id;
            foundLandlordUser = lookupResult.user;
          }
        }

        // If we still don't have an ID after email lookup, use the managerId as fallback
        if (!landlordUserId) {
          landlordUserId = managerId;
        }

        if (!managerEmail) {
          if (isAgentPersona) {
            const dummyBookings = getAgentDummyViewings();
            setRequests(getAgentDummyViewingRequests());
            setBookings(dummyBookings);
            setStats(statsFromBookings(dummyBookings));
            setLoading(false);
            return;
          }
          setError('Unable to determine your email. Please sign in again.');
          setLoading(false);
          return;
        }

        const normalizedEmail = managerEmail.toLowerCase().trim();

        // PRIORITY: Always query by email first since it's more reliable
        // Email-based queries will find records regardless of ID mismatches
        const emailRequestsResult = await bookViewingRequestService.getRequestsByEmail(normalizedEmail);
        const emailBookingsResult = await viewingService.getViewingBookingsByEmail(normalizedEmail);

        // Also try ID-based queries (will be merged with email results)
        let requestsResultById: { success: boolean; requests?: BookViewingRequest[]; error?: string } = { success: true, requests: [] };
        let bookingsResultById: { success: boolean; bookings?: ViewingBooking[]; error?: string } = { success: true, bookings: [] };
        let statsResultById: { success: boolean; stats?: ViewingStats; error?: string } = { success: true, stats: { upcoming: 0, completed: 0, rescheduled: 0, total: 0 } };

        if (landlordUserId) {
          requestsResultById = await bookViewingRequestService.getManagerRequests(landlordUserId);
          bookingsResultById = await viewingService.getManagerViewingBookings(landlordUserId);
          statsResultById = await viewingService.getManagerViewingStats(landlordUserId);
        }

        // Merge email-based and ID-based results
        // Merge requests
        const requestsMap = new Map<string, BookViewingRequest>();
        if (emailRequestsResult.success && emailRequestsResult.requests) {
          emailRequestsResult.requests.forEach(req => requestsMap.set(req.id, req));
        }
        if (landlordUserId && requestsResultById?.success && requestsResultById.requests) {
          requestsResultById.requests.forEach(req => requestsMap.set(req.id, req));
        }

        // Merge bookings
        const bookingsMap = new Map<string, ViewingBooking>();
        if (emailBookingsResult.success && emailBookingsResult.bookings) {
          emailBookingsResult.bookings.forEach(booking => bookingsMap.set(booking.id, booking));
        }
        if (landlordUserId && bookingsResultById?.success && bookingsResultById.bookings) {
          bookingsResultById.bookings.forEach(booking => bookingsMap.set(booking.id, booking));
        }

        const mergedRequests = withAgentDummyRequests(Array.from(requestsMap.values()));
        const mergedBookings = withAgentDummyBookings(Array.from(bookingsMap.values()));

        // Calculate stats from merged bookings
        const stats = statsFromBookings(mergedBookings);

        const requestsResult = { success: true, requests: mergedRequests };
        const bookingsResult = { success: true, bookings: mergedBookings };
        const statsResult = { success: true, stats };

        if (requestsResult.success && requestsResult.requests) {
          setRequests(requestsResult.requests);
        }

        if (bookingsResult.success && bookingsResult.bookings) {
          setBookings(bookingsResult.bookings);
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }

        setLoading(false);

        // Set up real-time subscriptions using both ID-based and email-based queries
        const bookingUnsubscribers: (() => void)[] = [];
        const requestUnsubscribers: (() => void)[] = [];
        const statsUnsubscribers: (() => void)[] = [];

        // ID-based subscriptions
        if (landlordUserId) {
          bookingUnsubscribers.push(
            viewingService.subscribeToManagerViewingBookings(
              landlordUserId,
              (items) => {
                // Merge with email-based results if available
                setBookings(prevBookings => {
                  const merged = new Map<string, ViewingBooking>();
                  // Add existing bookings from email subscription
                  prevBookings.forEach(b => merged.set(b.id, b));
                  // Add/update with ID-based bookings
                  items.forEach(b => merged.set(b.id, b));
                  return withAgentDummyBookings(Array.from(merged.values()));
                });
              },
              (err) => {
                console.error('Viewing bookings subscription error (ID-based):', err);
              }
            )
          );

          statsUnsubscribers.push(
            viewingService.subscribeToManagerViewingStats(
              landlordUserId,
              (nextStats) => {
                setStats(nextStats);
              },
              (err) => console.error('Viewing stats subscription error (ID-based):', err)
            )
          );

          requestUnsubscribers.push(
            bookViewingRequestService.subscribeToManagerRequests(
              landlordUserId,
              (items) => {
                // Merge with email-based results if available
                setRequests(prevRequests => {
                  const merged = new Map<string, BookViewingRequest>();
                  // Add existing requests from email subscription
                  prevRequests.forEach(r => merged.set(r.id, r));
                  // Add/update with ID-based requests
                  items.forEach(r => merged.set(r.id, r));
                  return withAgentDummyRequests(Array.from(merged.values()));
                });
              },
              (err) => console.error('Viewing requests subscription error (ID-based):', err)
            )
          );
        }

        // Email-based subscriptions as fallback/additional coverage
        if (managerEmail) {
          const normalizedEmailForSub = managerEmail.toLowerCase().trim();
          bookingUnsubscribers.push(
            viewingService.subscribeToViewingBookingsByEmail(
              normalizedEmailForSub,
              (items) => {
                // Merge with ID-based results
                setBookings(prevBookings => {
                  const merged = new Map<string, ViewingBooking>();
                  // Add existing bookings from ID subscription
                  prevBookings.forEach(b => merged.set(b.id, b));
                  // Add/update with email-based bookings
                  items.forEach(b => merged.set(b.id, b));
                  return withAgentDummyBookings(Array.from(merged.values()));
                });
              },
              (err) => {
                console.error('Viewing bookings subscription error (email-based):', err);
              }
            )
          );

          statsUnsubscribers.push(
            viewingService.subscribeToViewingStatsByEmail(
              normalizedEmailForSub,
              (nextStats) => {
                // Use email-based stats if ID-based stats are empty
                setStats(prevStats => {
                  if (prevStats.total === 0 && nextStats.total > 0) {
                    return nextStats;
                  }
                  return prevStats;
                });
              },
              (err) => console.error('Viewing stats subscription error (email-based):', err)
            )
          );

          requestUnsubscribers.push(
            bookViewingRequestService.subscribeToRequestsByEmail(
              normalizedEmailForSub,
              (items) => {
                // Merge with ID-based results
                setRequests(prevRequests => {
                  const merged = new Map<string, BookViewingRequest>();
                  // Add existing requests from ID subscription
                  prevRequests.forEach(r => merged.set(r.id, r));
                  // Add/update with email-based requests
                  items.forEach(r => merged.set(r.id, r));
                  return withAgentDummyRequests(Array.from(merged.values()));
                });
              },
              (err) => console.error('Viewing requests subscription error (email-based):', err)
            )
          );
        }

        // Create combined unsubscribe functions
        unsubscribeBookings = () => {
          bookingUnsubscribers.forEach(unsub => unsub());
        };

        unsubscribeStats = () => {
          statsUnsubscribers.forEach(unsub => unsub());
        };

        unsubscribeRequests = () => {
          requestUnsubscribers.forEach(unsub => unsub());
        };
      } catch (err) {
        console.error('Error loading manager viewings:', err);
        if (isAgentPersona) {
          const dummyBookings = getAgentDummyViewings();
          setError(null);
          setRequests(getAgentDummyViewingRequests());
          setBookings(dummyBookings);
          setStats(statsFromBookings(dummyBookings));
        } else {
          setError('Failed to load viewings data. Please try again later.');
        }
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      unsubscribeBookings?.();
      unsubscribeRequests?.();
      unsubscribeStats?.();
    };
  }, [managerId, managerEmail, isAuthenticatedUser, isAgentPersona]);

  // Function to check if a viewing date/time has passed
  const isViewingDatePassed = (viewing: ViewingBooking): boolean => {
    if (!viewing.viewingDetails?.date || !viewing.viewingDetails?.time) {
      return false;
    }

    try {
      // Combine date and time
      const dateStr = viewing.viewingDetails.date;
      const timeStr = viewing.viewingDetails.time;
      
      // Parse date (assuming format YYYY-MM-DD)
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      
      const viewingDateTime = new Date(year, month - 1, day, hour, minute);
      const now = new Date();
      
      return viewingDateTime < now;
    } catch (error) {
      console.error('Error parsing viewing date/time:', error);
      return false;
    }
  };

  // Auto-update past scheduled viewings to completed
  useEffect(() => {
    const updatePastViewings = async () => {
      const pastViewingsToUpdate = bookings.filter(
        (viewing) =>
          (viewing.status === 'confirmed' || viewing.status === 'rescheduled') &&
          isViewingDatePassed(viewing)
      );

      if (pastViewingsToUpdate.length > 0) {
        console.log(`🔄 Found ${pastViewingsToUpdate.length} past viewings to auto-complete`);
        
        // Update each past viewing to completed status
        const updatePromises = pastViewingsToUpdate.map((viewing) =>
          viewingService.updateViewingStatus(viewing.id, 'completed', undefined, 'Auto-completed: Viewing date has passed')
        );

        try {
          await Promise.all(updatePromises);
          console.log(`✅ Auto-completed ${pastViewingsToUpdate.length} past viewings`);
          
          // Refresh bookings to reflect updated statuses
          // The subscriptions will automatically update the state
        } catch (error) {
          console.error('Error auto-completing past viewings:', error);
        }
      }
    };

    // Only check if we have bookings and loading is complete
    if (!loading && bookings.length > 0) {
      updatePastViewings();
    }
  }, [bookings, loading]);

  const upcomingViewings = useMemo(
    () =>
      bookings.filter((viewing) =>
        ['confirmed', 'rescheduled'].includes(viewing.status)
      ),
    [bookings]
  );

  const pendingViewings = useMemo(
    () =>
      bookings.filter((viewing) => viewing.status === 'pending'),
    [bookings]
  );

  const completedViewings = useMemo(
    () =>
      bookings.filter((viewing) => viewing.status === 'completed'),
    [bookings]
  );

  const calendarViewings = useMemo(
    () =>
      bookings.filter((viewing) =>
        ['confirmed', 'rescheduled', 'pending'].includes(viewing.status),
      ),
    [bookings],
  );

  const calendarDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(calendarWeekStart, index)),
    [calendarWeekStart],
  );

  const calendarMonthLabel = useMemo(() => {
    const end = addDays(calendarWeekStart, 6);
    const startLabel = calendarWeekStart.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const endLabel = end.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  }, [calendarWeekStart]);

  const calendarWeekEvents = useMemo(() => {
    const dayKeys = new Set(calendarDays.map(toDateKey));
    return calendarViewings
      .filter((viewing) => {
        const date = viewing.viewingDetails?.date;
        if (!date) return false;
        const key = date.includes('T') ? date.slice(0, 10) : date.slice(0, 10);
        return dayKeys.has(key);
      })
      .filter((viewing) => {
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase();
        const propertyText = `${viewing.property.street} ${viewing.property.town || ''} ${viewing.property.city || ''}`.toLowerCase();
        const tenant = viewing.viewingDetails?.userDetails?.fullName?.toLowerCase() || '';
        return propertyText.includes(query) || tenant.includes(query);
      });
  }, [calendarViewings, calendarDays, filterQuery]);

  const summaryCards = useMemo(() => {
    const completedCount = bookings.filter((viewing) => viewing.status === 'completed').length;
    const rescheduledCount =
      bookings.filter((viewing) => viewing.status === 'rescheduled').length || stats.rescheduled;
    return [
      {
        key: 'requests' as TabKey,
        title: 'Pending Requests',
        value: requests.length + pendingViewings.length,
        hint: 'Awaiting your approval',
        icon: <Clock size={16} />,
        tone: 'is-amber',
      },
      {
        key: 'upcoming' as TabKey,
        title: 'Upcoming / Confirmed',
        value: upcomingViewings.length,
        hint: 'Next scheduled visits',
        icon: <Calendar size={16} />,
        tone: 'is-blue',
      },
      {
        key: 'completed' as TabKey,
        title: 'Completed',
        value: completedCount || stats.completed,
        hint: 'Total visits done',
        icon: <CheckCircle size={16} />,
        tone: 'is-green',
      },
      {
        key: 'upcoming' as TabKey,
        title: 'Rescheduled',
        value: rescheduledCount,
        hint: 'Needs new time slot',
        icon: <RotateCcw size={16} />,
        tone: 'is-orange',
      },
    ];
  }, [
    requests.length,
    pendingViewings.length,
    upcomingViewings.length,
    stats.completed,
    stats.rescheduled,
    bookings,
  ]);

  // Filter function
  const filterItems = <T extends { 
    property: { street: string; town: string; city: string }; 
    viewingDetails?: { date?: string; userDetails?: { fullName?: string; email?: string } };
    status?: string;
  }>(items: T[]) => {
    if (!filterQuery) return items;

    const query = filterQuery.toLowerCase();
    return items.filter((item) => {
      const propertyText = `${item.property.street} ${item.property.town} ${item.property.city}`.toLowerCase();
      const tenantName = item.viewingDetails?.userDetails?.fullName?.toLowerCase() || '';
      const tenantEmail = item.viewingDetails?.userDetails?.email?.toLowerCase() || '';
      const date = item.viewingDetails?.date || '';
      const status = (item as any).status?.toLowerCase() || '';

      switch (filterType) {
        case 'name':
          return tenantName.includes(query);
        case 'email':
          return tenantEmail.includes(query);
        case 'date':
          return date.includes(query);
        case 'status':
          return status.includes(query);
        case 'all':
        default:
          return propertyText.includes(query) || 
                 tenantName.includes(query) || 
                 tenantEmail.includes(query) || 
                 date.includes(query) || 
                 status.includes(query);
      }
    });
  };

  const filteredUpcomingViewings = useMemo(() => filterItems(upcomingViewings), [upcomingViewings, filterQuery, filterType]);
  const filteredPendingViewings = useMemo(() => filterItems(pendingViewings), [pendingViewings, filterQuery, filterType]);
  const filteredCompletedViewings = useMemo(() => filterItems(completedViewings), [completedViewings, filterQuery, filterType]);

  // Pagination for requests tab (combines requests and pending viewings)
  const allRequestsCount = requests.length + filteredPendingViewings.length;
  const totalRequestsPages = Math.ceil(allRequestsCount / ITEMS_PER_PAGE);
  const requestsStartIndex = (currentRequestsPage - 1) * ITEMS_PER_PAGE;
  const requestsEndIndex = requestsStartIndex + ITEMS_PER_PAGE;
  
  // Paginate requests and pending viewings separately but show together
  const paginatedRequests = useMemo(() => {
    if (requestsStartIndex < requests.length) {
      const requestsEnd = Math.min(requests.length, requestsEndIndex);
      const requestsSlice = requests.slice(requestsStartIndex, requestsEnd);
      const remainingSlots = ITEMS_PER_PAGE - requestsSlice.length;
      
      if (remainingSlots > 0 && requestsEndIndex > requests.length) {
        const pendingStart = Math.max(0, requestsStartIndex - requests.length);
        const pendingEnd = Math.min(filteredPendingViewings.length, pendingStart + remainingSlots);
        const pendingSlice = filteredPendingViewings.slice(pendingStart, pendingEnd);
        return { requests: requestsSlice, pendingViewings: pendingSlice };
      }
      return { requests: requestsSlice, pendingViewings: [] };
    } else {
      const pendingStart = requestsStartIndex - requests.length;
      const pendingEnd = Math.min(filteredPendingViewings.length, requestsEndIndex - requests.length);
      const pendingSlice = filteredPendingViewings.slice(pendingStart, pendingEnd);
      return { requests: [], pendingViewings: pendingSlice };
    }
  }, [requests, filteredPendingViewings, requestsStartIndex, requestsEndIndex]);

  const totalUpcomingPages = Math.ceil(filteredUpcomingViewings.length / ITEMS_PER_PAGE);
  const upcomingStartIndex = (currentUpcomingPage - 1) * ITEMS_PER_PAGE;
  const upcomingEndIndex = upcomingStartIndex + ITEMS_PER_PAGE;
  const paginatedUpcomingViewings = filteredUpcomingViewings.slice(upcomingStartIndex, upcomingEndIndex);

  const totalCompletedPages = Math.ceil(filteredCompletedViewings.length / ITEMS_PER_PAGE);
  const completedStartIndex = (currentCompletedPage - 1) * ITEMS_PER_PAGE;
  const completedEndIndex = completedStartIndex + ITEMS_PER_PAGE;
  const paginatedCompletedViewings = filteredCompletedViewings.slice(completedStartIndex, completedEndIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentRequestsPage(1);
    setCurrentUpcomingPage(1);
    setCurrentCompletedPage(1);
  }, [filterQuery, filterType, activeTab]);

  // Pagination component helper
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    startIndex, 
    endIndex, 
    totalItems,
    itemName = 'items'
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    startIndex: number;
    endIndex: number;
    totalItems: number;
    itemName?: string;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#f3f3f3] rounded-lg p-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} {itemName}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="text-muted-foreground px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleScheduleRequest = (request: BookViewingRequest) => {
    setSelectedRequest(request);
    setScheduleForm({
      ...initialScheduleForm,
      tenantName: '',
      tenantEmail: '',
      tenantPhone: ''
    });
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async () => {
    if (!selectedRequest || !managerId) {
      return;
    }

    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.tenantEmail) {
      setFeedback({ type: 'error', message: 'Please provide date, time, and tenant email.' });
      return;
    }

    setIsProcessing(true);
    try {
      const viewingDetails: ViewingBooking['viewingDetails'] = {
        date: scheduleForm.date,
        time: scheduleForm.time,
        preference: scheduleForm.preference,
        userDetails: {
          fullName: scheduleForm.tenantName,
          email: scheduleForm.tenantEmail,
          phoneNumber: scheduleForm.tenantPhone
        }
      };

      // Update the existing viewing booking from 'pending' to 'confirmed' with new details
      const result = await viewingService.updateViewingStatus(
        selectedRequest.id,
        'confirmed',
        undefined,
        undefined,
        { viewingDetails }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule viewing');
      }

      if (scheduleForm.tenantEmail) {
        await emailService.sendEmail({
          to: scheduleForm.tenantEmail,
          subject: `Viewing Scheduled - ${selectedRequest.property.street}`,
          formData: {
            property: selectedRequest.property,
            viewing: viewingDetails,
            manager: {
              name: managerName,
              email: managerEmail
            },
            user: {
              name: scheduleForm.tenantName,
              email: scheduleForm.tenantEmail
            }
          },
          attachments: [],
          emailType: 'viewing-confirmed'
        });
      }

      trackEvent('landlord_viewing_scheduled');
      setFeedback({ type: 'success', message: 'Viewing scheduled and notification sent to tenant.' });
      setIsScheduleModalOpen(false);
      setSelectedRequest(null);
      setScheduleForm(initialScheduleForm);
    } catch (err) {
      console.error('Failed to schedule viewing request:', err);
      setFeedback({ type: 'error', message: 'Failed to schedule viewing. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineRequest = async (request: BookViewingRequest) => {
    try {
      // Update status from 'pending' to 'cancelled' in viewingBookings
      await viewingService.updateViewingStatus(request.id, 'cancelled', 'Declined by agent');
      trackEvent('landlord_viewing_declined');
      setFeedback({ type: 'success', message: 'Viewing request declined.' });
    } catch (err) {
      console.error('Failed to decline viewing request:', err);
      setFeedback({ type: 'error', message: 'Failed to decline request. Please try again.' });
    }
  };

  const handleConfirmViewing = async (viewing: ViewingBooking) => {
    try {
      setIsProcessing(true);
      await viewingService.updateViewingStatus(viewing.id, 'confirmed');

      const tenantEmail = viewing.viewingDetails?.userDetails?.email;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Confirmed - ${viewing.property.street}`,
          formData: {
            property: viewing.property,
            viewing: viewing.viewingDetails,
            manager: {
              name: managerName,
              email: managerEmail
            },
            user: {
              name: viewing.viewingDetails?.userDetails?.fullName,
              email: tenantEmail
            }
          },
          attachments: [],
          emailType: 'viewing-user'
        });
      }

      trackEvent('landlord_viewing_confirmed');
      setFeedback({ type: 'success', message: 'Viewing confirmed and tenant notified.' });
    } catch (err) {
      console.error('Failed to confirm viewing:', err);
      setFeedback({ type: 'error', message: 'Failed to confirm viewing. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReschedule = (viewing: ViewingBooking) => {
    setSelectedViewing(viewing);
    setIsEventDetailOpen(false);
    setRescheduleForm({
      date: viewing.viewingDetails?.date || '',
      time: viewing.viewingDetails?.time || '',
      message: ''
    });
    setIsRescheduleModalOpen(true);
  };

  const handleOpenEventDetail = (viewing: ViewingBooking) => {
    setSelectedViewing(viewing);
    setIsEventDetailOpen(true);
  };

  const handleOpenRequestModal = (
    propertyId?: string,
    slot?: { date?: string; time?: string },
  ) => {
    const list = properties || [];
    setRequestForm({
      ...initialRequestForm,
      propertyId: propertyId || list[0]?.id || '',
      date: slot?.date || new Date().toISOString().slice(0, 10),
      time: slot?.time || '14:00',
    });
    setIsRequestModalOpen(true);
  };

  const handleRequestViewingSubmit = async () => {
    const property = (properties || []).find((p) => p.id === requestForm.propertyId);
    if (!property) {
      setFeedback({ type: 'error', message: 'Please select a property for the viewing.' });
      return;
    }
    if (!requestForm.date || !requestForm.time) {
      setFeedback({ type: 'error', message: 'Please provide a preferred date and time slot.' });
      return;
    }

    const addressParts = property.address.split(',').map((part) => part.trim());
    const viewingDetails: ViewingBooking['viewingDetails'] = {
      date: requestForm.date,
      time: requestForm.time,
      preference: requestForm.preference,
      userDetails: {
        fullName: requestForm.tenantName || 'Prospective Tenant',
        email: requestForm.tenantEmail,
        phoneNumber: requestForm.tenantPhone,
      },
    };

    const propertyPayload: ViewingBooking['property'] = {
      street: addressParts[0] || property.address,
      town: addressParts[1],
      city: addressParts[2] || addressParts[1],
      postcode: addressParts[addressParts.length - 1],
      agent: {
        id: managerId || 'agent',
        name: managerName || userProfile?.name || 'Agent',
        email: managerEmail || userProfile?.email || '',
        phone: '',
        company: '',
      },
    };

    setIsProcessing(true);
    try {
      if (isAgentPersona) {
        const localBooking: ViewingBooking = {
          id: `demo-viewing-req-${Date.now()}`,
          userId: managerId || 'agent-demo',
          propertyId: property.id,
          agentId: managerId,
          agentEmail: managerEmail || null,
          property: propertyPayload,
          viewingDetails,
          status: 'confirmed',
          notes: requestForm.notes || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
        };
        setBookings((prev) => [localBooking, ...prev]);
        setStats((prev) => ({
          ...prev,
          upcoming: prev.upcoming + 1,
          total: prev.total + 1,
        }));
      } else {
        if (!managerId) {
          throw new Error('Missing manager id');
        }
        const saveResult = await viewingService.saveViewingBooking(
          managerId,
          propertyPayload,
          viewingDetails,
          property.id,
          { agentId: managerId, landlordId: null },
        );
        if (!saveResult.success || !saveResult.bookingId) {
          throw new Error(saveResult.error || 'Failed to create viewing request');
        }
        await viewingService.updateViewingStatus(
          saveResult.bookingId,
          'confirmed',
          requestForm.notes || undefined,
          undefined,
          { viewingDetails },
        );
        if (requestForm.tenantEmail) {
          await emailService.sendEmail({
            to: requestForm.tenantEmail,
            subject: `Viewing Scheduled - ${propertyStreet(property.address)}`,
            formData: {
              property: propertyPayload,
              viewing: viewingDetails,
              manager: {
                name: managerName,
                email: managerEmail,
              },
              user: {
                name: requestForm.tenantName,
                email: requestForm.tenantEmail,
              },
            },
            attachments: [],
            emailType: 'viewing-user',
          });
        }
      }

      trackEvent('landlord_viewing_requested');
      setFeedback({
        type: 'success',
        message: 'Viewing request submitted and appointment confirmed.',
      });
      setIsRequestModalOpen(false);
      setRequestForm(initialRequestForm);
      switchTab('upcoming');
    } catch (err) {
      console.error('Failed to request viewing:', err);
      setFeedback({ type: 'error', message: 'Failed to submit viewing request. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedViewing) return;
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setFeedback({ type: 'error', message: 'Please provide the new date and time.' });
      return;
    }

    setIsProcessing(true);
    try {
      const updatedDetails: ViewingBooking['viewingDetails'] = {
        ...selectedViewing.viewingDetails,
        date: rescheduleForm.date,
        time: rescheduleForm.time
      };

      await viewingService.updateViewingStatus(
        selectedViewing.id,
        'rescheduled',
        rescheduleForm.message ? `Reschedule requested: ${rescheduleForm.message}` : undefined,
        undefined,
        { viewingDetails: updatedDetails }
      );

      const tenantEmail = selectedViewing.viewingDetails?.userDetails?.email;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Rescheduled - ${selectedViewing.property.street}`,
          formData: {
            property: selectedViewing.property,
            viewing: {
              ...updatedDetails,
              rescheduleMessage: rescheduleForm.message
            },
            manager: {
              name: managerName,
              email: managerEmail
            },
            user: {
              name: selectedViewing.viewingDetails?.userDetails?.fullName,
              email: tenantEmail
            }
          },
          attachments: [],
          emailType: 'viewing-reschedule'
        });
      }

      trackEvent('landlord_viewing_rescheduled');
      setFeedback({ type: 'success', message: 'Reschedule request sent to tenant.' });
      setIsRescheduleModalOpen(false);
      setSelectedViewing(null);
      setRescheduleForm(initialRescheduleForm);
    } catch (err) {
      console.error('Failed to reschedule viewing:', err);
      setFeedback({ type: 'error', message: 'Failed to reschedule viewing. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCancel = (viewing: ViewingBooking) => {
    setSelectedViewing(viewing);
    setCancelMessage('');
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedViewing) return;

    setIsProcessing(true);
    try {
      await viewingService.updateViewingStatus(
        selectedViewing.id,
        'cancelled',
        cancelMessage ? `Cancelled: ${cancelMessage}` : undefined,
        undefined
      );

      trackEvent('landlord_viewing_cancelled');
      const tenantEmail = selectedViewing.viewingDetails?.userDetails?.email;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Cancelled - ${selectedViewing.property.street}`,
          formData: {
            property: selectedViewing.property,
            viewing: {
              ...selectedViewing.viewingDetails,
              cancelMessage
            },
            manager: {
              name: managerName,
              email: managerEmail
            },
            user: {
              name: selectedViewing.viewingDetails?.userDetails?.fullName,
              email: tenantEmail
            }
          },
          attachments: [],
          emailType: 'viewing-cancel'
        });
      }

      setFeedback({ type: 'success', message: 'Viewing cancelled and tenant notified.' });
      setIsCancelModalOpen(false);
      setSelectedViewing(null);
      setCancelMessage('');
    } catch (err) {
      console.error('Failed to cancel viewing:', err);
      setFeedback({ type: 'error', message: 'Failed to cancel viewing. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSelect = (viewingId: string) => {
    setSelectedViewings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(viewingId)) {
        newSet.delete(viewingId);
      } else {
        newSet.add(viewingId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (viewingsList: ViewingBooking[]) => {
    const allSelected = viewingsList.every(v => selectedViewings.has(v.id));
    if (allSelected) {
      // Deselect all in this list
      setSelectedViewings(prev => {
        const newSet = new Set(prev);
        viewingsList.forEach(v => newSet.delete(v.id));
        return newSet;
      });
    } else {
      // Select all in this list
      setSelectedViewings(prev => {
        const newSet = new Set(prev);
        viewingsList.forEach(v => newSet.add(v.id));
        return newSet;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedViewings(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedViewings.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedViewings.size} viewing(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedViewings).map(async (itemId) => {
        // Check if it's a request or a booking
        const isRequest = requests.some(r => r.id === itemId);
        
        if (isRequest) {
          // Delete as a request
          return bookViewingRequestService.deleteRequest(itemId).catch(err => {
            console.error(`Error deleting request ${itemId}:`, err);
            return { success: false, error: err };
          });
        } else {
          // Delete as a booking
          return viewingService.deleteViewingBooking(itemId).catch(err => {
            console.error(`Error deleting viewing ${itemId}:`, err);
            return { success: false, error: err };
          });
        }
      });

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        setFeedback({ 
          type: 'error', 
          message: `Failed to delete ${failed.length} viewing(s). Please try again.` 
        });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Successfully deleted ${selectedViewings.size} viewing(s).` 
        });
      }
      
      // Clear selection
      setSelectedViewings(new Set());
    } catch (err) {
      console.error('Error deleting viewings:', err);
      setFeedback({ type: 'error', message: 'Failed to delete viewings. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Show 4 summary cards + empty state for unauthenticated users
  if (!isAuthenticatedUser) {
    return <LandlordPageEmptyShell page="viewings" variant="guest" />;
  }

  if (isNewPortfolioUser(properties)) {
    return (
      <LandlordPageEmptyShell
        page="viewings"
        variant="new-user"
        onAddProperty={onAddProperty}
        userName={userProfile?.name}
      />
    );
  }

  if (loading) {
    return (
      <div className="ll-vw">
        <div className="ll-vw-loading">
          <div className="ll-vw-loading-inner">
            <div className="ll-vw-spinner" />
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Loading viewings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // If error is about authentication, keep users inside the unauthenticated empty state
    if (error.includes('Unable to determine your email') || error.includes('sign in') || error.includes('sign-in')) {
      return <LandlordPageEmptyShell page="viewings" variant="guest" />;
    }

    // For other errors, show the standard error message
    return (
      <div className="ll-vw">
        <div className="ll-vw-error">
          <h2>Unable to load viewings</h2>
          <p>{error}</p>
          <button type="button" className="ll-vw-btn-cta" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ll-vw">
      <header className="ll-vw-header">
        <div className="ll-vw-inner ll-vw-header-inner">
          <div className="ll-vw-header-copy">
            <h1>Viewings</h1>
            <p>Manage incoming requests, schedule property viewings, and keep tenants informed.</p>
          </div>

          <div className="ll-vw-header-actions">
            <button
              type="button"
              className={`ll-vw-header-icon${isRefreshing ? ' refreshing' : ''}`}
              title="Refresh Portfolio Data"
              onClick={handleHeaderRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="ll-vw-header-icon"
              title="Settings"
              onClick={onViewSettings}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="ll-vw-header-icon"
              title="Notifications"
              onClick={onViewNotifications}
            >
              <Bell size={18} />
              <span className="ll-vw-header-dot" />
            </button>
            <button
              type="button"
              className="ll-vw-btn-insights"
              onClick={() => setIsInsightsModalOpen(true)}
            >
              <span className="ll-vw-insights-icon">
                <Sparkles size={12} />
              </span>
              <span className="hide-sm">Portfolio Insights</span>
            </button>
            <button
              type="button"
              className="ll-vw-btn-cta"
              onClick={() => handleOpenRequestModal()}
              disabled={(properties || []).length === 0}
            >
              <Eye size={16} />
              Request Viewing
            </button>
          </div>
        </div>
      </header>

      <div className="ll-vw-inner ll-vw-body">
      {feedback && (
        <div
          className={`ll-vw-feedback ${
            feedback.type === 'success' ? 'is-success' : 'is-error'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="ll-vw-kpi-grid">
        {summaryCards.map((card) => (
          <button
            key={card.title}
            type="button"
            className={`ll-vw-kpi${activeTab === card.key ? ' is-active' : ''}`}
            onClick={() => switchTab(card.key)}
          >
            <div className="ll-vw-kpi-top">
              <span className="ll-vw-kpi-label">{card.title}</span>
              <span className={`ll-vw-kpi-icon ${card.tone}`}>{card.icon}</span>
            </div>
            <div className="ll-vw-kpi-value">{card.value}</div>
            <div className="ll-vw-kpi-hint">{card.hint}</div>
          </button>
        ))}
      </div>

      {selectedViewings.size > 0 && (
        <div className="ll-vw-bulk">
          <div className="ll-vw-bulk-left">
            {selectedViewings.size} viewing{selectedViewings.size !== 1 ? 's' : ''} selected
          </div>
          <div className="ll-vw-bulk-actions">
            <button
              type="button"
              className="ll-vw-ghost-btn"
              onClick={handleClearSelection}
              disabled={isDeleting}
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="ll-vw-danger-btn"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete Selected</span>
                  <span className="sm:hidden">Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-5 flex flex-col gap-4">
          <div className="ll-vw-tabs">
            <div className="ll-vw-tabs-row" role="tablist" aria-label="Viewing sections">
              <button
                type="button"
                data-tab="requests"
                role="tab"
                aria-selected={activeTab === 'requests'}
                onClick={() => switchTab('requests')}
                className={`ll-vw-tab${activeTab === 'requests' ? ' is-active' : ''}`}
              >
                <span>Pending Requests</span>
                <span className="ll-vw-tab-count">{requests.length + pendingViewings.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                onClick={() => switchTab('upcoming')}
                className={`ll-vw-tab${activeTab === 'upcoming' ? ' is-active' : ''}`}
              >
                <span>Upcoming</span>
                <span className="ll-vw-tab-count">{upcomingViewings.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'completed'}
                onClick={() => switchTab('completed')}
                className={`ll-vw-tab${activeTab === 'completed' ? ' is-active' : ''}`}
              >
                <span>Past/Completed</span>
                <span className="ll-vw-tab-count">{completedViewings.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'calendar'}
                onClick={() => switchTab('calendar')}
                className={`ll-vw-tab${activeTab === 'calendar' ? ' is-active' : ''}`}
              >
                <span>Calendar View</span>
                <span className="ll-vw-tab-count">{calendarWeekEvents.length}</span>
              </button>
            </div>
          </div>

          <div className="ll-vw-toolbar">
            <div className="ll-vw-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by applicant, property, or time..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                aria-label="Search viewings"
              />
            </div>
            <div className="ll-vw-toolbar-right">
              <div className="ll-vw-filter-wrap">
                <select
                  className="ll-vw-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'name' | 'email' | 'date' | 'status')}
                  aria-label="Filter field"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="status">Status</option>
                </select>
                <Filter size={14} />
              </div>
              {activeTab !== 'calendar' && (
                <div className="ll-vw-display" role="group" aria-label="Display style">
                  <button
                    type="button"
                    className={`ll-vw-display-btn${displayStyle === 'grid' ? ' is-active' : ''}`}
                    onClick={() => setDisplayStyle('grid')}
                  >
                    <LayoutGrid size={14} />
                    <span className="hide-sm">Grid</span>
                  </button>
                  <button
                    type="button"
                    className={`ll-vw-display-btn${displayStyle === 'table' ? ' is-active' : ''}`}
                    onClick={() => setDisplayStyle('table')}
                  >
                    <List size={14} />
                    <span className="hide-sm">Table</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'requests' && (
          <div className="ll-vw-panel">
            {allRequestsCount === 0 ? (
              <div className="ll-vw-empty">
                <div className="ll-vw-empty-icon">
                  <Mail size={24} />
                </div>
                <h3>No pending requests</h3>
                <p>New viewing requests will appear here for approval.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {showAsTable && (
                  <>
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                        <div className="col-span-1">Select</div>
                        <div className="col-span-2">Property</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Tenant Name</div>
                        <div className="col-span-2">Tenant Email</div>
                        <div className="col-span-2 text-center whitespace-nowrap">Actions</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {/* Unscheduled Requests */}
                  {paginatedRequests.requests.map((request) => (
                    <div key={request.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleToggleSelect(request.id)}
                            className="flex items-center justify-center"
                            title={selectedViewings.has(request.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedViewings.has(request.id) ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                            )}
                          </button>
                        </div>
                        {/* Property */}
                        <div className="col-span-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {request.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {request.property.town}, {request.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500 italic">Not scheduled yet</span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-700">
                            New Request
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500 italic">Not provided</span>
                        </div>

                        {/* Tenant Email */}
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500 italic">Not provided</span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-center gap-1.5 flex-nowrap">
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap"
                            onClick={() => handleScheduleRequest(request)}
                            title="Schedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Schedule</span>
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
                            onClick={() => handleDeclineRequest(request)}
                            title="Decline request"
                          >
                            <X className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pending Viewings (Scheduled but not confirmed) */}
                  {paginatedRequests.pendingViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleToggleSelect(viewing.id)}
                            className="flex items-center justify-center"
                            title={selectedViewings.has(viewing.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedViewings.has(viewing.id) ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                            )}
                          </button>
                        </div>
                        {/* Property */}
                        <div className="col-span-2">
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={() => handleOpenEventDetail(viewing)}
                          >
                            <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-[#136C9E]">
                              {viewing.property.street}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {viewing.property.town}, {viewing.property.city}
                            </p>
                          </button>
                        </div>

                        {/* Date & Time */}
                        <div className="col-span-2">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-orange-100 text-orange-700">
                            Pending
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-center gap-1.5 flex-nowrap">
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleConfirmViewing(viewing)}
                            disabled={isProcessing}
                            title="Confirm viewing"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Confirm</span>
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-blue-300 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Reschedule</span>
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                            title="Cancel viewing"
                          >
                            <X className="w-3.5 h-3.5 flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </>
                )}

                {/* Mobile Card View */}
                {!showAsTable && (
                  <div className="space-y-4 p-4">
                    {/* Unscheduled Requests */}
                    {paginatedRequests.requests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`bg-white border rounded-lg p-4 ${selectedViewings.has(request.id) ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleSelect(request.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {selectedViewings.has(request.id) ? (
                                <CheckSquare className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {request.property.street}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {request.property.town}, {request.property.city}
                              </p>
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                New Request
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <p className="text-gray-500 italic">Not scheduled yet</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tenant:</span>
                            <p className="text-gray-500 italic">Not provided</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <button
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                            onClick={() => handleScheduleRequest(request)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Schedule
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            onClick={() => handleDeclineRequest(request)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pending Viewings */}
                    {paginatedRequests.pendingViewings.map((viewing) => (
                      <div 
                        key={viewing.id} 
                        className={`bg-white border rounded-lg p-4 ${selectedViewings.has(viewing.id) ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleSelect(viewing.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {selectedViewings.has(viewing.id) ? (
                                <CheckSquare className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                className="text-left w-full"
                                onClick={() => handleOpenEventDetail(viewing)}
                              >
                                <h3 className="text-sm font-semibold text-gray-900 mb-1 hover:text-[#136C9E]">
                                  {viewing.property.street}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">
                                  {viewing.property.town}, {viewing.property.city}
                                </p>
                              </button>
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Pending
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatDate(viewing.viewingDetails?.date || '')}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatTime(viewing.viewingDetails?.time || '')}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tenant:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm text-gray-600 truncate">{viewing.viewingDetails?.userDetails?.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <button
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                            onClick={() => handleConfirmViewing(viewing)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-blue-300 text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Pagination Controls for Requests Tab */}
            <PaginationControls
              currentPage={currentRequestsPage}
              totalPages={totalRequestsPages}
              onPageChange={setCurrentRequestsPage}
              startIndex={requestsStartIndex}
              endIndex={requestsEndIndex}
              totalItems={allRequestsCount}
              itemName="requests"
            />
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="ll-vw-panel">
            {filteredUpcomingViewings.length === 0 ? (
              <div className="ll-vw-empty">
                <div className="ll-vw-empty-icon">
                  <Calendar size={24} />
                </div>
                <h3>
                  {filterQuery ? 'No matching viewings' : 'No scheduled viewings'}
                </h3>
                <p>
                  {filterQuery
                    ? 'Try adjusting your search filters'
                    : 'Scheduled viewings will appear here once you confirm requests.'}
                </p>
                {!filterQuery && (properties || []).length > 0 && (
                  <button
                    type="button"
                    className="ll-vw-btn-cta"
                    style={{ marginTop: 12 }}
                    onClick={() => handleOpenRequestModal()}
                  >
                    <Eye size={16} />
                    Request Viewing
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {showAsTable && (
                  <>
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                        <div className="col-span-1">Select</div>
                        <div className="col-span-2">Property</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Tenant Name</div>
                        <div className="col-span-2">Tenant Email</div>
                        <div className="col-span-2 text-center whitespace-nowrap">Actions</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {paginatedUpcomingViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleToggleSelect(viewing.id)}
                            className="flex items-center justify-center"
                            title={selectedViewings.has(viewing.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedViewings.has(viewing.id) ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                            )}
                          </button>
                        </div>
                        {/* Property */}
                        <div className="col-span-2">
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={() => handleOpenEventDetail(viewing)}
                          >
                            <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-[#136C9E]">
                              {viewing.property.street}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {viewing.property.town}, {viewing.property.city}
                            </p>
                          </button>
                        </div>

                        {/* Date & Time */}
                        <div className="col-span-2">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              viewing.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : viewing.status === 'rescheduled'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-center gap-1.5 flex-nowrap">
                          {viewing.status !== 'confirmed' && (
                            <button
                              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                              onClick={() => handleConfirmViewing(viewing)}
                              disabled={isProcessing}
                              title="Confirm viewing"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              <span className="hidden sm:inline">Confirm</span>
                            </button>
                          )}
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-blue-300 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Reschedule</span>
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                            title="Cancel viewing"
                          >
                            <X className="w-3.5 h-3.5 flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </>
                )}

                {/* Mobile Card View */}
                {!showAsTable && (
                  <div className="space-y-4 p-4">
                    {paginatedUpcomingViewings.map((viewing) => (
                      <div 
                        key={viewing.id} 
                        className={`bg-white border rounded-lg p-4 ${selectedViewings.has(viewing.id) ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleSelect(viewing.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {selectedViewings.has(viewing.id) ? (
                                <CheckSquare className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                className="text-left w-full"
                                onClick={() => handleOpenEventDetail(viewing)}
                              >
                                <h3 className="text-sm font-semibold text-gray-900 mb-1 hover:text-[#136C9E]">
                                  {viewing.property.street}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">
                                  {viewing.property.town}, {viewing.property.city}
                                </p>
                              </button>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  viewing.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : viewing.status === 'rescheduled'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatDate(viewing.viewingDetails?.date || '')}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatTime(viewing.viewingDetails?.time || '')}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tenant:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm text-gray-600 truncate">{viewing.viewingDetails?.userDetails?.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          {viewing.status !== 'confirmed' && (
                            <button
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                              onClick={() => handleConfirmViewing(viewing)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm
                            </button>
                          )}
                          <button
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-blue-300 text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Pagination Controls for Upcoming Tab */}
            <PaginationControls
              currentPage={currentUpcomingPage}
              totalPages={totalUpcomingPages}
              onPageChange={setCurrentUpcomingPage}
              startIndex={upcomingStartIndex}
              endIndex={upcomingEndIndex}
              totalItems={filteredUpcomingViewings.length}
              itemName="viewings"
            />
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="ll-vw-panel">
            {filteredCompletedViewings.length === 0 ? (
              <div className="ll-vw-empty">
                <div className="ll-vw-empty-icon">
                  <CheckCircle size={24} />
                </div>
                <h3>
                  {filterQuery ? 'No matching viewings' : 'No completed viewings'}
                </h3>
                <p>
                  {filterQuery ? 'Try adjusting your search filters' : 'Completed viewings will appear here once viewings are finished.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {showAsTable && (
                  <>
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                        <div className="col-span-1">Select</div>
                        <div className="col-span-2">Property</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Tenant Name</div>
                        <div className="col-span-2">Tenant Email</div>
                        <div className="col-span-2">Notes</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {paginatedCompletedViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <button
                            onClick={() => handleToggleSelect(viewing.id)}
                            className="flex items-center justify-center"
                            title={selectedViewings.has(viewing.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedViewings.has(viewing.id) ? (
                              <CheckSquare className="w-5 h-5 text-orange-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                            )}
                          </button>
                        </div>
                        {/* Property */}
                        <div className="col-span-2">
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={() => handleOpenEventDetail(viewing)}
                          >
                            <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-[#136C9E]">
                              {viewing.property.street}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {viewing.property.town}, {viewing.property.city}
                            </p>
                          </button>
                        </div>

                        {/* Date & Time */}
                        <div className="col-span-2">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-100 text-green-700">
                            Completed
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="truncate">
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500 truncate">
                            {viewing.notes || viewing.agentNotes || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </>
                )}

                {/* Mobile Card View */}
                {!showAsTable && (
                  <div className="space-y-4 p-4">
                    {paginatedCompletedViewings.map((viewing) => (
                      <div 
                        key={viewing.id} 
                        className={`bg-white border rounded-lg p-4 ${selectedViewings.has(viewing.id) ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleSelect(viewing.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {selectedViewings.has(viewing.id) ? (
                                <CheckSquare className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 border-2 border-gray-400 rounded" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                className="text-left w-full"
                                onClick={() => handleOpenEventDetail(viewing)}
                              >
                                <h3 className="text-sm font-semibold text-gray-900 mb-1 hover:text-[#136C9E]">
                                  {viewing.property.street}
                                </h3>
                                <p className="text-xs text-gray-500 mb-2">
                                  {viewing.property.town}, {viewing.property.city}
                                </p>
                              </button>
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatDate(viewing.viewingDetails?.date || '')}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{formatTime(viewing.viewingDetails?.time || '')}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tenant:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="font-medium">{viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm text-gray-600 truncate">{viewing.viewingDetails?.userDetails?.email || 'Not provided'}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Notes:</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {viewing.notes || viewing.agentNotes || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Pagination Controls for Completed Tab */}
            <PaginationControls
              currentPage={currentCompletedPage}
              totalPages={totalCompletedPages}
              onPageChange={setCurrentCompletedPage}
              startIndex={completedStartIndex}
              endIndex={completedEndIndex}
              totalItems={filteredCompletedViewings.length}
              itemName="viewings"
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="ll-vw-calendar">
            <div className="ll-vw-calendar-head">
              <h2>{calendarMonthLabel}</h2>
              <div className="ll-vw-calendar-nav">
                <button
                  type="button"
                  aria-label="Previous week"
                  onClick={() => setCalendarWeekStart((prev) => addDays(prev, -7))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="is-today"
                  onClick={() => setCalendarWeekStart(startOfWeekMonday(new Date()))}
                >
                  Today
                </button>
                <button
                  type="button"
                  aria-label="Next week"
                  onClick={() => setCalendarWeekStart((prev) => addDays(prev, 7))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="ll-vw-calendar-scroll">
              <div className="ll-vw-calendar-grid">
                <div className="ll-vw-calendar-weekdays">
                  <div className="ll-vw-calendar-time-label">Time</div>
                  {calendarDays.map((day) => {
                    const key = toDateKey(day);
                    const isToday = key === toDateKey(new Date());
                    return (
                      <div key={key} className="ll-vw-calendar-weekday">
                        <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <strong className={isToday ? 'is-today' : undefined}>
                          {day.getDate()}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                <div className="ll-vw-calendar-hours">
                  {CALENDAR_HOURS.map((hour) => (
                    <div key={hour} className="ll-vw-calendar-row">
                      <div className="ll-vw-calendar-hour">{formatHourLabel(hour)}</div>
                      {calendarDays.map((day) => {
                        const dayKey = toDateKey(day);
                        const slotEvents = calendarWeekEvents.filter((viewing) => {
                          const viewingHour = parseViewingHour(viewing.viewingDetails?.time);
                          return (
                            sameDateKey(viewing.viewingDetails?.date, dayKey) &&
                            viewingHour === hour
                          );
                        });
                        return (
                          <div
                            key={`${dayKey}-${hour}`}
                            className="ll-vw-calendar-cell"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (slotEvents[0]) {
                                handleOpenEventDetail(slotEvents[0]);
                                return;
                              }
                              handleOpenRequestModal(undefined, {
                                date: dayKey,
                                time: `${String(hour).padStart(2, '0')}:00`,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (slotEvents[0]) {
                                  handleOpenEventDetail(slotEvents[0]);
                                  return;
                                }
                                handleOpenRequestModal(undefined, {
                                  date: dayKey,
                                  time: `${String(hour).padStart(2, '0')}:00`,
                                });
                              }
                            }}
                          >
                            {slotEvents.map((viewing, index) => (
                              <button
                                key={viewing.id}
                                type="button"
                                className="ll-vw-calendar-event"
                                style={{ background: calendarEventColor(index + hour) }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEventDetail(viewing);
                                }}
                              >
                                <strong>{viewing.property.street}</strong>
                                <em>
                                  <Clock size={11} />
                                  {formatTime(viewing.viewingDetails?.time || '')}
                                </em>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {calendarWeekEvents.length === 0 && (
              <p className="ll-vw-calendar-empty">
                No viewings scheduled this week. Click an empty slot to request a viewing.
              </p>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedRequest && (
        <div className="ll-vw-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ll-vw-modal ll-vw-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head">
              <div className="ll-vw-modal-head-copy">
                <div className="ll-vw-modal-icon is-blue">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3>Schedule Viewing</h3>
                  <p>Confirm a slot for {selectedRequest.property.street}</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSelectedRequest(null);
                  setScheduleForm(initialScheduleForm);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <label className="ll-vw-field">
                <span>Date</span>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
              <label className="ll-vw-field">
                <span>Time</span>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                />
              </label>
              <label className="ll-vw-field">
                <span>Viewing Preference</span>
                <select
                  value={scheduleForm.preference}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, preference: e.target.value }))}
                >
                  <option>In-Person Viewing</option>
                  <option>Virtual Viewing</option>
                  <option>Phone Consultation</option>
                </select>
              </label>
              <div className="ll-vw-field-grid">
                <label className="ll-vw-field">
                  <span>Tenant Name</span>
                  <input
                    type="text"
                    value={scheduleForm.tenantName}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantName: e.target.value }))}
                  />
                </label>
                <label className="ll-vw-field">
                  <span>Tenant Phone</span>
                  <input
                    type="tel"
                    value={scheduleForm.tenantPhone}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantPhone: e.target.value }))}
                  />
                </label>
              </div>
              <label className="ll-vw-field">
                <span>Tenant Email *</span>
                <input
                  type="email"
                  value={scheduleForm.tenantEmail}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantEmail: e.target.value }))}
                />
              </label>
            </div>
            <div className="ll-vw-modal-footer">
              <button
                type="button"
                className="ll-vw-modal-secondary"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSelectedRequest(null);
                  setScheduleForm(initialScheduleForm);
                }}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ll-vw-modal-primary"
                onClick={handleScheduleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Scheduling…' : 'Schedule Viewing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedViewing && (
        <div className="ll-vw-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ll-vw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head is-amber">
              <div className="ll-vw-modal-head-copy">
                <div className="ll-vw-modal-icon is-amber">
                  <Clock size={16} />
                </div>
                <div>
                  <h3>Propose Alternative Time</h3>
                  <p>Suggest a revised slot for this viewing request</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => {
                  setIsRescheduleModalOpen(false);
                  setSelectedViewing(null);
                  setRescheduleForm(initialRescheduleForm);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <div className="ll-vw-modal-info">
                <span>Applicant & Property</span>
                <strong>
                  {selectedViewing.viewingDetails?.userDetails?.fullName || 'Applicant'} ·{' '}
                  {selectedViewing.property.street}
                </strong>
              </div>
              <label className="ll-vw-field">
                <span>Proposed New Date</span>
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
              <label className="ll-vw-field">
                <span>Proposed Time Slot</span>
                <select
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                >
                  <option value="">Select a time</option>
                  {VIEWING_TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                  {rescheduleForm.time &&
                    !VIEWING_TIME_SLOTS.some((slot) => slot.value === rescheduleForm.time) && (
                      <option value={rescheduleForm.time}>{rescheduleForm.time}</option>
                    )}
                </select>
              </label>
              <label className="ll-vw-field">
                <span>Message to Applicant</span>
                <textarea
                  rows={2}
                  placeholder="I have another viewing booked then, would this alternative work for you?"
                  value={rescheduleForm.message}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </label>
            </div>
            <div className="ll-vw-modal-footer is-split">
              <button
                type="button"
                className="ll-vw-modal-secondary"
                onClick={() => {
                  setIsRescheduleModalOpen(false);
                  setSelectedViewing(null);
                  setRescheduleForm(initialRescheduleForm);
                }}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ll-vw-modal-cta"
                onClick={handleRescheduleSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Sending…' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && selectedViewing && (
        <div className="ll-vw-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ll-vw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head">
              <div className="ll-vw-modal-head-copy">
                <div className="ll-vw-modal-icon is-red">
                  <X size={16} />
                </div>
                <div>
                  <h3>Cancel Viewing</h3>
                  <p>Notify the tenant that this appointment will not go ahead</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedViewing(null);
                  setCancelMessage('');
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <p className="ll-vw-modal-note">
                An email notification will be sent to the tenant letting them know this viewing has been
                cancelled.
              </p>
              <label className="ll-vw-field">
                <span>Optional message to tenant</span>
                <textarea
                  rows={3}
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                />
              </label>
            </div>
            <div className="ll-vw-modal-footer">
              <button
                type="button"
                className="ll-vw-modal-secondary"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedViewing(null);
                  setCancelMessage('');
                }}
                disabled={isProcessing}
              >
                Keep Viewing
              </button>
              <button
                type="button"
                className="ll-vw-modal-danger"
                onClick={handleCancelSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Cancelling…' : 'Cancel Viewing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Viewing Modal */}
      {isRequestModalOpen && (
        <div
          className="ll-vw-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsRequestModalOpen(false)}
        >
          <div className="ll-vw-modal ll-vw-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head">
              <div className="ll-vw-modal-head-copy">
                <div className="ll-vw-modal-icon is-orange">
                  <Eye size={16} />
                </div>
                <div>
                  <h3>Request a Property Viewing</h3>
                  <p>Coordinate an in-person or virtual walkthrough with a lettings agent</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => setIsRequestModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <label className="ll-vw-field">
                <span>Select Property</span>
                <select
                  value={requestForm.propertyId}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, propertyId: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    Choose a property
                  </option>
                  {(properties || []).map((property) => (
                    <option key={property.id} value={property.id}>
                      {propertyStreet(property.address)} — {property.address} (£
                      {property.rent.toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </label>
              <div className="ll-vw-field-grid">
                <label className="ll-vw-field">
                  <span>Preferred Date</span>
                  <input
                    type="date"
                    value={requestForm.date}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>
                <label className="ll-vw-field">
                  <span>Time Slot</span>
                  <select
                    value={requestForm.time}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, time: e.target.value }))}
                  >
                    {VIEWING_TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="ll-vw-field">
                <span>Viewing Type</span>
                <div className="ll-vw-type-grid">
                  <label
                    className={`ll-vw-type-option${
                      requestForm.preference === 'In-Person Viewing' ? ' is-active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="viewingType"
                      checked={requestForm.preference === 'In-Person Viewing'}
                      onChange={() =>
                        setRequestForm((prev) => ({ ...prev, preference: 'In-Person Viewing' }))
                      }
                    />
                    <span>In-Person Accompanied</span>
                  </label>
                  <label
                    className={`ll-vw-type-option${
                      requestForm.preference === 'Virtual Viewing' ? ' is-active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="viewingType"
                      checked={requestForm.preference === 'Virtual Viewing'}
                      onChange={() =>
                        setRequestForm((prev) => ({ ...prev, preference: 'Virtual Viewing' }))
                      }
                    />
                    <span>Live Virtual Tour</span>
                  </label>
                </div>
              </div>
              <div className="ll-vw-field-grid">
                <label className="ll-vw-field">
                  <span>Applicant Name</span>
                  <input
                    type="text"
                    value={requestForm.tenantName}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, tenantName: e.target.value }))
                    }
                  />
                </label>
                <label className="ll-vw-field">
                  <span>Applicant Phone</span>
                  <input
                    type="tel"
                    value={requestForm.tenantPhone}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, tenantPhone: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="ll-vw-field">
                <span>Applicant Email</span>
                <input
                  type="email"
                  value={requestForm.tenantEmail}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, tenantEmail: e.target.value }))
                  }
                />
              </label>
              <label className="ll-vw-field">
                <span>Special Instructions or Notes</span>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring floorplans, tenant interested in 12-month AST with break clause..."
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="ll-vw-modal-footer">
              <button
                type="button"
                className="ll-vw-modal-secondary"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ll-vw-modal-cta"
                onClick={handleRequestViewingSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Submitting…' : 'Submit Viewing Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Appointment Dossier Modal */}
      {isEventDetailOpen && selectedViewing && (
        <div
          className="ll-vw-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsEventDetailOpen(false)}
        >
          <div className="ll-vw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head">
              <div className="ll-vw-modal-head-copy">
                <span className={`ll-vw-event-dot is-${selectedViewing.status}`} />
                <div>
                  <h3>Viewing Appointment</h3>
                  <p>{selectedViewing.property.street}</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => setIsEventDetailOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <div className="ll-vw-event-summary">
                <div>
                  <span>Date</span>
                  <strong>{formatLongDate(selectedViewing.viewingDetails?.date || '')}</strong>
                </div>
                <div>
                  <span>Time Slot</span>
                  <strong>{formatTime(selectedViewing.viewingDetails?.time || '')}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <em className={`ll-vw-event-status is-${selectedViewing.status}`}>
                    {statusDisplayLabel(selectedViewing.status)}
                  </em>
                </div>
              </div>

              <div className="ll-vw-field">
                <span>Applicant</span>
                <div className="ll-vw-agent-card">
                  <div className="ll-vw-agent-avatar">
                    {(selectedViewing.viewingDetails?.userDetails?.fullName || 'TN')
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>
                      {selectedViewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                    </strong>
                    <span>
                      {selectedViewing.viewingDetails?.userDetails?.email || 'No email'}
                      {selectedViewing.viewingDetails?.userDetails?.phoneNumber
                        ? ` · ${selectedViewing.viewingDetails.userDetails.phoneNumber}`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ll-vw-field">
                <span>Assigned Lettings Agent</span>
                <div className="ll-vw-agent-card">
                  <div className="ll-vw-agent-avatar is-agent">
                    {(managerName || selectedViewing.property.agent?.name || 'AG')
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>{managerName || selectedViewing.property.agent?.name || 'Agent'}</strong>
                    <span>
                      {managerEmail || selectedViewing.property.agent?.email || 'No email on file'}
                      {selectedViewing.property.agent?.phone
                        ? ` · ${selectedViewing.property.agent.phone}`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="ll-vw-modal-footer is-split"
                style={{ padding: 0, border: 0, background: 'transparent' }}
              >
                <button
                  type="button"
                  className="ll-vw-modal-secondary"
                  onClick={() => handleOpenReschedule(selectedViewing)}
                  disabled={isProcessing}
                >
                  Reschedule
                </button>
                {selectedViewing.status !== 'confirmed' && selectedViewing.status !== 'completed' && (
                  <button
                    type="button"
                    className="ll-vw-modal-primary"
                    onClick={async () => {
                      await handleConfirmViewing(selectedViewing);
                      setIsEventDetailOpen(false);
                    }}
                    disabled={isProcessing}
                  >
                    Check In
                  </button>
                )}
                {(selectedViewing.status === 'confirmed' ||
                  selectedViewing.status === 'rescheduled') && (
                  <button
                    type="button"
                    className="ll-vw-modal-primary"
                    onClick={() => {
                      setIsEventDetailOpen(false);
                      handleOpenCancel(selectedViewing);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Insights Modal */}
      {isInsightsModalOpen && (
        <div
          className="ll-vw-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsInsightsModalOpen(false)}
        >
          <div className="ll-vw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-vw-modal-head is-insights">
              <div className="ll-vw-modal-head-copy">
                <div className="ll-vw-modal-icon is-insights">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3>Portfolio Insights</h3>
                  <p>Algorithmic viewing demand telemetry</p>
                </div>
              </div>
              <button
                type="button"
                className="ll-vw-modal-close"
                onClick={() => setIsInsightsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ll-vw-modal-body">
              <div className="ll-vw-insights-banner">
                <strong>
                  {(properties || [])[0]
                    ? `${propertyStreet((properties || [])[0].address)} is generating elevated inquiry volume`
                    : 'Viewing demand is tracking above baseline'}
                </strong>{' '}
                this month, with {requests.length} open request
                {requests.length === 1 ? '' : 's'} and {stats.upcoming} upcoming appointment
                {stats.upcoming === 1 ? '' : 's'} across the portfolio.
              </div>
              <div className="ll-vw-insights-grid">
                <div>
                  <span>Average Inquiries / Day</span>
                  <strong>
                    {(Math.max(requests.length, bookings.length) / 7).toFixed(1)} inquiries
                  </strong>
                </div>
                <div>
                  <span>Viewing-to-Offer Rate</span>
                  <strong>
                    {bookings.length
                      ? `${
                          Math.round(
                            (bookings.filter((b) => b.status === 'completed').length /
                              Math.max(bookings.length, 1)) *
                              1000,
                          ) / 10
                        }%`
                      : '0%'}
                  </strong>
                </div>
              </div>
            </div>
            <div className="ll-vw-modal-footer">
              {onViewInsights && (
                <button
                  type="button"
                  className="ll-vw-modal-secondary"
                  onClick={() => {
                    setIsInsightsModalOpen(false);
                    onViewInsights();
                  }}
                >
                  Open full insights
                </button>
              )}
              <button
                type="button"
                className="ll-vw-modal-primary"
                onClick={() => setIsInsightsModalOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewingsPage;