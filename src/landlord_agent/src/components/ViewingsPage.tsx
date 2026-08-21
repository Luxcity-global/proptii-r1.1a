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
  ChevronRight
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
import { generateTenantViewingUpdateEmailTemplate } from '../../../components/viewings/services/emailTemplates';

// ViewingsPage component for managing property viewings and requests

type TabKey = 'requests' | 'upcoming' | 'completed' | 'past';

interface ViewingsPageProps {
  managerId: string | null;
  managerName?: string;
  managerEmail?: string;
  userProfile?: UserProfile | null;
  properties?: Property[];
  onAddProperty?: () => void;
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

function bookingMatchesRequest(booking: ViewingBooking, request: BookViewingRequest) {
  if (booking.sourceRequestId && booking.sourceRequestId === request.id) {
    return true;
  }

  const propertyMatch =
    (request.propertyId && booking.propertyId && booking.propertyId === request.propertyId) ||
    (booking.property?.street || '').toLowerCase() === (request.property?.street || '').toLowerCase();

  if (!propertyMatch) return false;

  if (booking.userId && request.userId && booking.userId !== request.userId) {
    return false;
  }

  return true;
}

function findMatchingBooking(
  request: BookViewingRequest,
  bookings: ViewingBooking[],
  includeCancelled = false
) {
  const isEligible = (booking: ViewingBooking) =>
    includeCancelled || booking.status !== 'cancelled';

  const direct = bookings.find(
    (booking) => isEligible(booking) && bookingMatchesRequest(booking, request)
  );
  if (direct) return direct;

  if (!request.propertyId) return undefined;

  const byProperty = bookings.filter(
    (booking) =>
      isEligible(booking) &&
      booking.propertyId === request.propertyId &&
      booking.status === 'pending'
  );
  if (byProperty.length === 1) return byProperty[0];

  return undefined;
}

function getRequestApplicantName(request: BookViewingRequest, bookings: ViewingBooking[]) {
  if (request.applicantName?.trim()) return request.applicantName.trim();
  const match = findMatchingBooking(request, bookings, true);
  return match?.viewingDetails?.userDetails?.fullName?.trim() || 'Applicant request';
}

function getRequestApplicantEmail(request: BookViewingRequest, bookings: ViewingBooking[]) {
  if (request.applicantEmail?.trim()) return request.applicantEmail.trim();
  const match = findMatchingBooking(request, bookings, true);
  return match?.viewingDetails?.userDetails?.email?.trim() || '';
}

function formatCreatedAt(value: BookViewingRequest['createdAt']) {
  try {
    const date = typeof (value as { toDate?: () => Date })?.toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as unknown as string);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function timestampFromValue(value: unknown): number {
  if (!value) return 0;
  const record = value as { toMillis?: () => number; toDate?: () => Date };
  if (typeof record.toMillis === 'function') return record.toMillis();
  if (typeof record.toDate === 'function') return record.toDate().getTime();
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function viewingDateTimeMs(viewing: ViewingBooking): number {
  const date = viewing.viewingDetails?.date?.trim();
  const time = viewing.viewingDetails?.time?.trim();
  if (date) {
    const candidate = time
      ? (/am|pm/i.test(time) ? `${date} ${time}` : `${date}T${time.length === 5 ? `${time}:00` : time}`)
      : date;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return timestampFromValue(viewing.updatedAt) || timestampFromValue(viewing.createdAt);
}

function requestDateTimeMs(request: BookViewingRequest): number {
  return timestampFromValue(request.createdAt) || timestampFromValue(request.updatedAt);
}

function sortByLatest<T>(items: T[], getMs: (item: T) => number): T[] {
  return [...items].sort((a, b) => getMs(b) - getMs(a));
}

type RequestTabRow =
  | { kind: 'request'; id: string; request: BookViewingRequest }
  | { kind: 'pending'; id: string; viewing: ViewingBooking };

const VIEWINGS_GRID_CLASS = 'grid gap-3 items-center min-w-0';
const VIEWINGS_GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: '44px minmax(0,1.3fr) minmax(0,1.1fr) 108px minmax(0,1fr) minmax(0,1.2fr) 252px',
};

const ViewingsPage: React.FC<ViewingsPageProps> = ({ managerId, managerName, managerEmail, userProfile, properties = [], onAddProperty }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [requests, setRequests] = useState<BookViewingRequest[]>([]);
  const [bookings, setBookings] = useState<ViewingBooking[]>([]);
  const [stats, setStats] = useState<ViewingStats>({ upcoming: 0, completed: 0, rescheduled: 0, total: 0 });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookViewingRequest | null>(null);
  const [selectedViewing, setSelectedViewing] = useState<ViewingBooking | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(initialScheduleForm);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>(initialRescheduleForm);
  const [cancelMessage, setCancelMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'date' | 'status'>('all');
  const [selectedViewings, setSelectedViewings] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();
  const isAuthenticatedUser = Boolean(userProfile);
  
  // Pagination state for each tab
  const [currentRequestsPage, setCurrentRequestsPage] = useState<number>(1);
  const [currentUpcomingPage, setCurrentUpcomingPage] = useState<number>(1);
  const [currentCompletedPage, setCurrentCompletedPage] = useState<number>(1);
  const [currentPastPage, setCurrentPastPage] = useState<number>(1);
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!isAuthenticatedUser) {
      setLoading(false);
      return;
    }

    if (!managerEmail) {
      setError('Unable to determine your email. Please sign in again.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    const bookingsById = new Map<string, ViewingBooking>();
    const requestsById = new Map<string, BookViewingRequest>();
    let receivedSnapshot = false;

    const markReady = () => {
      if (receivedSnapshot || cancelled) return;
      receivedSnapshot = true;
      setLoading(false);
    };

    const publishBookings = () => {
      if (cancelled) return;
      const next = Array.from(bookingsById.values());
      setBookings(next);
      setStats(next.reduce<ViewingStats>((acc, booking) => {
        acc.total++;
        if (['pending', 'confirmed'].includes(booking.status)) acc.upcoming++;
        if (booking.status === 'completed') acc.completed++;
        if (booking.status === 'rescheduled') acc.rescheduled++;
        return acc;
      }, { upcoming: 0, completed: 0, rescheduled: 0, total: 0 }));
      markReady();
    };

    const publishRequests = () => {
      if (cancelled) return;
      setRequests(Array.from(requestsById.values()));
      markReady();
    };

    const mergeBookings = (items: ViewingBooking[]) => {
      items.forEach((item) => bookingsById.set(item.id, item));
      publishBookings();
    };

    const mergeRequests = (items: BookViewingRequest[]) => {
      items.forEach((item) => requestsById.set(item.id, item));
      publishRequests();
    };

    setLoading(true);
    setError(null);
    const normalizedEmail = managerEmail.toLowerCase().trim();

    unsubscribers.push(
      viewingService.subscribeToViewingBookingsByEmail(
        normalizedEmail,
        mergeBookings,
        (err) => console.error('Viewing bookings subscription error (email-based):', err)
      )
    );
    unsubscribers.push(
      bookViewingRequestService.subscribeToRequestsByEmail(
        normalizedEmail,
        mergeRequests,
        (err) => console.error('Viewing requests subscription error (email-based):', err)
      )
    );

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2500);

    void (async () => {
      let landlordUserId = managerId;
      try {
        const lookup = await landlordUserService.getLandlordUserByEmail(managerEmail);
        if (lookup.success && lookup.user?.id) {
          landlordUserId = lookup.user.id;
        }
      } catch {
        // keep managerId fallback
      }
      if (cancelled || !landlordUserId) return;
      unsubscribers.push(
        viewingService.subscribeToManagerViewingBookings(
          landlordUserId,
          mergeBookings,
          (err) => console.error('Viewing bookings subscription error (ID-based):', err)
        )
      );
      unsubscribers.push(
        bookViewingRequestService.subscribeToManagerRequests(
          landlordUserId,
          mergeRequests,
          (err) => console.error('Viewing requests subscription error (ID-based):', err)
        )
      );
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [managerId, managerEmail, isAuthenticatedUser]);

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
      sortByLatest(
        bookings.filter((viewing) => ['confirmed', 'rescheduled'].includes(viewing.status)),
        viewingDateTimeMs
      ),
    [bookings]
  );

  const pendingViewings = useMemo(
    () =>
      sortByLatest(
        bookings.filter((viewing) => viewing.status === 'pending'),
        viewingDateTimeMs
      ),
    [bookings]
  );

  const openRequests = useMemo(
    () =>
      sortByLatest(
        requests.filter((request) => !findMatchingBooking(request, bookings)),
        requestDateTimeMs
      ),
    [requests, bookings]
  );

  const completedViewings = useMemo(
    () =>
      sortByLatest(
        bookings.filter((viewing) => viewing.status === 'completed'),
        viewingDateTimeMs
      ),
    [bookings]
  );

  const pastViewings = useMemo(
    () =>
      sortByLatest(
        bookings.filter((viewing) => viewing.status === 'cancelled'),
        viewingDateTimeMs
      ),
    [bookings]
  );

  const summaryCards = useMemo(() => {
    const cancelledCount = bookings.filter((viewing) => viewing.status === 'cancelled').length;
    const completedCount = bookings.filter((viewing) => viewing.status === 'completed').length;
    return [
      {
        title: 'Pending Requests',
        value: openRequests.length + pendingViewings.length,
        icon: <Mail className="w-5 h-5 text-[#136C9E]" />,
        accent: 'bg-[#E8F3F9]'
      },
      {
        title: 'Scheduled Viewings',
        value: upcomingViewings.length,
        icon: <Calendar className="w-5 h-5 text-orange-600" />,
        accent: 'bg-orange-100'
      },
      {
        title: 'Completed Viewings',
        value: completedCount || stats.completed,
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        accent: 'bg-green-100'
      },
      {
        title: 'Cancelled Viewings',
        value: cancelledCount,
        icon: <X className="w-5 h-5 text-red-600" />,
        accent: 'bg-red-100'
      }
    ];
  }, [openRequests.length, pendingViewings.length, upcomingViewings.length, stats.completed, bookings]);

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

  const filteredUpcomingViewings = useMemo(
    () => sortByLatest(filterItems(upcomingViewings), viewingDateTimeMs),
    [upcomingViewings, filterQuery, filterType]
  );
  const filteredPendingViewings = useMemo(
    () => sortByLatest(filterItems(pendingViewings), viewingDateTimeMs),
    [pendingViewings, filterQuery, filterType]
  );
  const filteredCompletedViewings = useMemo(
    () => sortByLatest(filterItems(completedViewings), viewingDateTimeMs),
    [completedViewings, filterQuery, filterType]
  );
  const filteredPastViewings = useMemo(
    () => sortByLatest(filterItems(pastViewings), viewingDateTimeMs),
    [pastViewings, filterQuery, filterType]
  );

  // Pagination for requests tab (combines requests and pending viewings)
  const allRequestsCount = openRequests.length + filteredPendingViewings.length;
  const totalRequestsPages = Math.ceil(allRequestsCount / ITEMS_PER_PAGE);
  const requestsStartIndex = (currentRequestsPage - 1) * ITEMS_PER_PAGE;
  const requestsEndIndex = requestsStartIndex + ITEMS_PER_PAGE;
  
  const sortedRequestRows = useMemo(() => {
    const rows: RequestTabRow[] = [
      ...openRequests.map((request) => ({ kind: 'request' as const, id: request.id, request })),
      ...filteredPendingViewings.map((viewing) => ({ kind: 'pending' as const, id: viewing.id, viewing })),
    ];
    return rows.sort((a, b) => {
      const aMs = a.kind === 'request' ? requestDateTimeMs(a.request) : viewingDateTimeMs(a.viewing);
      const bMs = b.kind === 'request' ? requestDateTimeMs(b.request) : viewingDateTimeMs(b.viewing);
      return bMs - aMs;
    });
  }, [openRequests, filteredPendingViewings]);

  const paginatedRequestRows = sortedRequestRows.slice(requestsStartIndex, requestsEndIndex);

  const totalUpcomingPages = Math.ceil(filteredUpcomingViewings.length / ITEMS_PER_PAGE);
  const upcomingStartIndex = (currentUpcomingPage - 1) * ITEMS_PER_PAGE;
  const upcomingEndIndex = upcomingStartIndex + ITEMS_PER_PAGE;
  const paginatedUpcomingViewings = filteredUpcomingViewings.slice(upcomingStartIndex, upcomingEndIndex);

  const totalCompletedPages = Math.ceil(filteredCompletedViewings.length / ITEMS_PER_PAGE);
  const completedStartIndex = (currentCompletedPage - 1) * ITEMS_PER_PAGE;
  const completedEndIndex = completedStartIndex + ITEMS_PER_PAGE;
  const paginatedCompletedViewings = filteredCompletedViewings.slice(completedStartIndex, completedEndIndex);

  const totalPastPages = Math.ceil(filteredPastViewings.length / ITEMS_PER_PAGE);
  const pastStartIndex = (currentPastPage - 1) * ITEMS_PER_PAGE;
  const pastEndIndex = pastStartIndex + ITEMS_PER_PAGE;
  const paginatedPastViewings = filteredPastViewings.slice(pastStartIndex, pastEndIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentRequestsPage(1);
    setCurrentUpcomingPage(1);
    setCurrentCompletedPage(1);
    setCurrentPastPage(1);
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
    const matching = findMatchingBooking(request, bookings, true);
    setSelectedRequest(request);
    setScheduleForm({
      ...initialScheduleForm,
      date: matching?.viewingDetails?.date || '',
      time: matching?.viewingDetails?.time || '',
      preference: matching?.viewingDetails?.preference || 'In-Person Viewing',
      tenantName: matching?.viewingDetails?.userDetails?.fullName || request.applicantName || '',
      tenantEmail: matching?.viewingDetails?.userDetails?.email || request.applicantEmail || '',
      tenantPhone: matching?.viewingDetails?.userDetails?.phoneNumber || request.applicantPhone || ''
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

      const matching = findMatchingBooking(selectedRequest, bookings, true);
      let persistOk = false;
      if (matching && matching.status !== 'cancelled') {
        const result = await viewingService.updateViewingStatus(
          matching.id,
          'confirmed',
          undefined,
          undefined,
          { viewingDetails }
        );
        persistOk = result.success;
        if (!result.success) {
          throw new Error(result.error || 'Failed to schedule viewing');
        }
      } else {
        const result = await viewingService.saveViewingBooking(
          selectedRequest.userId,
          selectedRequest.property,
          viewingDetails,
          selectedRequest.propertyId,
          { landlordId: managerId, agentId: managerId }
        );
        persistOk = result.success;
        if (!result.success) {
          throw new Error(result.error || 'Failed to schedule viewing');
        }
      }

      await bookViewingRequestService.deleteRequest(selectedRequest.id);

      if (persistOk && scheduleForm.tenantEmail) {
        await emailService.sendEmail({
          to: scheduleForm.tenantEmail,
          subject: `Viewing Scheduled - ${selectedRequest.property.street}`,
          html: generateTenantViewingUpdateEmailTemplate({
            tenantName: scheduleForm.tenantName,
            propertyStreet: selectedRequest.property.street,
            date: scheduleForm.date,
            time: scheduleForm.time,
            intro: 'Your viewing has been scheduled.',
          }),
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
      await bookViewingRequestService.deleteRequest(request.id);
      const matching = findMatchingBooking(request, bookings, true);
      if (matching && matching.status !== 'cancelled') {
        await viewingService.updateViewingStatus(matching.id, 'cancelled', 'Declined by agent');
      }
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
      const result = await viewingService.updateViewingStatus(viewing.id, 'confirmed');
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm viewing');
      }

      const tenantEmail = viewing.viewingDetails?.userDetails?.email;
      const tenantName = viewing.viewingDetails?.userDetails?.fullName;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Confirmed - ${viewing.property.street}`,
          html: generateTenantViewingUpdateEmailTemplate({
            tenantName,
            propertyStreet: viewing.property.street,
            date: viewing.viewingDetails?.date,
            time: viewing.viewingDetails?.time,
            intro: 'Your viewing has been confirmed.',
          }),
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
    setRescheduleForm({
      date: viewing.viewingDetails?.date || '',
      time: viewing.viewingDetails?.time || '',
      message: ''
    });
    setIsRescheduleModalOpen(true);
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

      const result = await viewingService.updateViewingStatus(
        selectedViewing.id,
        'rescheduled',
        rescheduleForm.message ? `Reschedule requested: ${rescheduleForm.message}` : undefined,
        undefined,
        { viewingDetails: updatedDetails }
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to reschedule viewing');
      }

      const tenantEmail = selectedViewing.viewingDetails?.userDetails?.email;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Rescheduled - ${selectedViewing.property.street}`,
          html: generateTenantViewingUpdateEmailTemplate({
            tenantName: selectedViewing.viewingDetails?.userDetails?.fullName,
            propertyStreet: selectedViewing.property.street,
            date: rescheduleForm.date,
            time: rescheduleForm.time,
            intro: 'Your viewing has been rescheduled.',
            extra: rescheduleForm.message,
          }),
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
      const result = await viewingService.updateViewingStatus(
        selectedViewing.id,
        'cancelled',
        cancelMessage ? `Cancelled: ${cancelMessage}` : undefined,
        undefined
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel viewing');
      }

      if (selectedViewing.userId) {
        await bookViewingRequestService.deleteRequestsForProperty(selectedViewing.userId, {
          propertyId: selectedViewing.propertyId,
          street: selectedViewing.property?.street,
          town: selectedViewing.property?.town,
        });
      }

      trackEvent('landlord_viewing_cancelled');
      const tenantEmail = selectedViewing.viewingDetails?.userDetails?.email;
      if (tenantEmail) {
        await emailService.sendEmail({
          to: tenantEmail,
          subject: `Viewing Cancelled - ${selectedViewing.property.street}`,
          html: generateTenantViewingUpdateEmailTemplate({
            tenantName: selectedViewing.viewingDetails?.userDetails?.fullName,
            propertyStreet: selectedViewing.property.street,
            date: selectedViewing.viewingDetails?.date,
            time: selectedViewing.viewingDetails?.time,
            intro: 'Your viewing has been cancelled.',
            extra: cancelMessage,
          }),
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading viewings...</p>
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
      <div className="max-w-4xl mx-auto bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load viewings</h2>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-[#136C9E] text-white rounded-lg hover:bg-[#0f5a84]"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden w-full" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Viewings & Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage incoming requests, schedule property viewings, and keep tenants informed.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">{card.title}</h3>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.accent} flex-shrink-0`}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Selection Bar */}
      {selectedViewings.size > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-orange-800" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {selectedViewings.size} viewing{selectedViewings.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
              onClick={handleClearSelection}
              disabled={isDeleting}
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Clear Selection
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <div className="mb-6 flex flex-col gap-4">
          {/* Tabs */}
          <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('requests');
                setSelectedViewings(new Set()); // Clear selection when switching tabs
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'requests' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Requests ({requests.length + pendingViewings.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('upcoming');
                setSelectedViewings(new Set()); // Clear selection when switching tabs
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'upcoming' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Scheduled ({upcomingViewings.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('completed');
                setSelectedViewings(new Set()); // Clear selection when switching tabs
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'completed' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Completed ({completedViewings.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('past');
                setSelectedViewings(new Set()); // Clear selection when switching tabs
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'past' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Past ({pastViewings.length})
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-[#f3f3f3] rounded-lg p-4 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search viewings..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'name' | 'email' | 'date' | 'status')}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer w-full sm:w-[140px] min-w-[120px]"
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {allRequestsCount === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No pending requests</h3>
                <p className="text-sm text-gray-500">New viewing requests will appear here for approval.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile && (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className={`${VIEWINGS_GRID_CLASS} text-sm font-semibold text-gray-700`} style={VIEWINGS_GRID_STYLE}>
                        <div className="min-w-0 overflow-hidden">Select</div>
                        <div className="min-w-0 overflow-hidden">Property</div>
                        <div className="min-w-0 overflow-hidden">Date & Time</div>
                        <div className="min-w-0 overflow-hidden">Status</div>
                        <div className="min-w-0 overflow-hidden">Tenant Name</div>
                        <div className="min-w-0 overflow-hidden">Tenant Email</div>
                        <div className="min-w-0 overflow-hidden text-right">Actions</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {/* Unscheduled Requests */}
                  {paginatedRequestRows.map((row) => row.kind === 'request' ? ((request) => (
                    <div key={request.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={VIEWINGS_GRID_CLASS} style={VIEWINGS_GRID_STYLE}>
                        {/* Checkbox */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={request.property.street}>
                            {request.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {request.property.town}, {request.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-0 overflow-hidden">
                          {formatCreatedAt(request.createdAt) ? (
                            <span className="text-xs text-gray-600">{formatCreatedAt(request.createdAt)}</span>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Awaiting schedule</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-[#E8F3F9] text-[#136C9E]">
                            New Request
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="block min-w-0 truncate text-sm text-gray-900" title={getRequestApplicantName(request, bookings)}>
                            {getRequestApplicantName(request, bookings)}
                          </span>
                        </div>

                        {/* Tenant Email */}
                        <div className="min-w-0 overflow-hidden">
                          {getRequestApplicantEmail(request, bookings) ? (
                            <span className="block min-w-0 truncate text-sm text-gray-600" title={getRequestApplicantEmail(request, bookings)}>
                              {getRequestApplicantEmail(request, bookings)}
                            </span>
                          ) : (
                            <span className="block min-w-0 truncate text-sm text-gray-500" title="Email not provided">Not provided</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="min-w-0 overflow-hidden flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg bg-[#136C9E] text-white text-xs font-medium hover:bg-[#0f5a84] transition whitespace-nowrap"
                            onClick={() => handleScheduleRequest(request)}
                            title="Schedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Schedule</span>
                          </button>
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
                            onClick={() => handleDeclineRequest(request)}
                            title="Decline request"
                          >
                            <X className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))(row.request) : ((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={VIEWINGS_GRID_CLASS} style={VIEWINGS_GRID_STYLE}>
                        {/* Checkbox */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={viewing.property.street}>
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="min-w-0 truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-orange-100 text-orange-700">
                            Pending
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.email || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="min-w-0 overflow-hidden flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleConfirmViewing(viewing)}
                            disabled={isProcessing}
                            title="Confirm viewing"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Confirm</span>
                          </button>
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg border border-[#136C9E] text-xs font-medium text-[#136C9E] hover:bg-[#E8F3F9] transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Reschedule</span>
                          </button>
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                            title="Cancel viewing"
                          >
                            <X className="w-3.5 h-3.5 flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))(row.viewing))}
                    </div>
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
                  <div className="space-y-4 p-4">
                    {/* Unscheduled Requests */}
                    {paginatedRequestRows.map((row) => row.kind === 'request' ? ((request) => (
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
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-[#E8F3F9] text-[#136C9E]">
                                New Request
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <p className="text-gray-700">{formatCreatedAt(request.createdAt) || 'Awaiting schedule'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tenant:</span>
                            <p className="text-gray-700">{getRequestApplicantName(request, bookings)}</p>
                            {getRequestApplicantEmail(request, bookings) && (
                              <p className="text-sm text-gray-600 truncate">{getRequestApplicantEmail(request, bookings)}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <button
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-[#136C9E] text-white text-sm font-medium hover:bg-[#0f5a84] transition"
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
                    ))(row.request) : ((viewing) => (
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
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {viewing.property.street}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {viewing.property.town}, {viewing.property.city}
                              </p>
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
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[#136C9E] text-sm font-medium text-[#136C9E] hover:bg-[#E8F3F9] transition disabled:opacity-50"
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
                    ))(row.viewing))}
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredUpcomingViewings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {filterQuery ? 'No matching viewings' : 'No scheduled viewings'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filterQuery ? 'Try adjusting your search filters' : 'Scheduled viewings will appear here once you confirm requests.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile && (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className={`${VIEWINGS_GRID_CLASS} text-sm font-semibold text-gray-700`} style={VIEWINGS_GRID_STYLE}>
                        <div className="min-w-0 overflow-hidden">Select</div>
                        <div className="min-w-0 overflow-hidden">Property</div>
                        <div className="min-w-0 overflow-hidden">Date & Time</div>
                        <div className="min-w-0 overflow-hidden">Status</div>
                        <div className="min-w-0 overflow-hidden">Tenant Name</div>
                        <div className="min-w-0 overflow-hidden">Tenant Email</div>
                        <div className="min-w-0 overflow-hidden text-right">Actions</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {paginatedUpcomingViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={VIEWINGS_GRID_CLASS} style={VIEWINGS_GRID_STYLE}>
                        {/* Checkbox */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={viewing.property.street}>
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="min-w-0 truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.email || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="min-w-0 overflow-hidden flex items-center justify-end gap-1.5 flex-nowrap">
                          {viewing.status !== 'confirmed' && (
                            <button
                              className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                              onClick={() => handleConfirmViewing(viewing)}
                              disabled={isProcessing}
                              title="Confirm viewing"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              <span className="hidden sm:inline">Confirm</span>
                            </button>
                          )}
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg border border-[#136C9E] text-xs font-medium text-[#136C9E] hover:bg-[#E8F3F9] transition disabled:opacity-50 whitespace-nowrap"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Reschedule</span>
                          </button>
                          <button
                            className="inline-flex shrink-0 items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 whitespace-nowrap"
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
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
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
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {viewing.property.street}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {viewing.property.town}, {viewing.property.city}
                              </p>
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
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[#136C9E] text-sm font-medium text-[#136C9E] hover:bg-[#E8F3F9] transition disabled:opacity-50"
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredCompletedViewings.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {filterQuery ? 'No matching viewings' : 'No completed viewings'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filterQuery ? 'Try adjusting your search filters' : 'Completed viewings will appear here once viewings are finished.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile && (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className={`${VIEWINGS_GRID_CLASS} text-sm font-semibold text-gray-700`} style={VIEWINGS_GRID_STYLE}>
                        <div className="min-w-0 overflow-hidden">Select</div>
                        <div className="min-w-0 overflow-hidden">Property</div>
                        <div className="min-w-0 overflow-hidden">Date & Time</div>
                        <div className="min-w-0 overflow-hidden">Status</div>
                        <div className="min-w-0 overflow-hidden">Tenant Name</div>
                        <div className="min-w-0 overflow-hidden">Tenant Email</div>
                        <div className="min-w-0 overflow-hidden">Notes</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {paginatedCompletedViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={VIEWINGS_GRID_CLASS} style={VIEWINGS_GRID_STYLE}>
                        {/* Checkbox */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={viewing.property.street}>
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="min-w-0 truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-100 text-green-700">
                            Completed
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.email || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="text-xs text-gray-500 truncate">
                            {viewing.notes || viewing.agentNotes || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
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
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {viewing.property.street}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {viewing.property.town}, {viewing.property.city}
                              </p>
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

        {activeTab === 'past' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredPastViewings.length === 0 ? (
              <div className="p-12 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {filterQuery ? 'No matching viewings' : 'No cancelled viewings'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filterQuery ? 'Try adjusting your search filters' : 'Cancelled viewings will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile && (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className={`${VIEWINGS_GRID_CLASS} text-sm font-semibold text-gray-700`} style={VIEWINGS_GRID_STYLE}>
                        <div className="min-w-0 overflow-hidden">Select</div>
                        <div className="min-w-0 overflow-hidden">Property</div>
                        <div className="min-w-0 overflow-hidden">Date & Time</div>
                        <div className="min-w-0 overflow-hidden">Status</div>
                        <div className="min-w-0 overflow-hidden">Tenant Name</div>
                        <div className="min-w-0 overflow-hidden">Tenant Email</div>
                        <div className="min-w-0 overflow-hidden">Notes</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                  {paginatedPastViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={VIEWINGS_GRID_CLASS} style={VIEWINGS_GRID_STYLE}>
                        {/* Checkbox */}
                        <div className="min-w-0 overflow-hidden">
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
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={viewing.property.street}>
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="min-w-0 truncate">{formatDate(viewing.viewingDetails?.date || '')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0 overflow-hidden">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              viewing.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : viewing.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Tenant Email */}
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center min-w-0 text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="min-w-0 truncate" title={viewing.viewingDetails?.userDetails?.email || 'Not provided'}>
                              {viewing.viewingDetails?.userDetails?.email || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="min-w-0 overflow-hidden">
                          <span className="text-xs text-gray-500 truncate">
                            {viewing.notes || viewing.agentNotes || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
                  <div className="space-y-4 p-4">
                    {paginatedPastViewings.map((viewing) => (
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
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {viewing.property.street}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {viewing.property.town}, {viewing.property.city}
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  viewing.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : viewing.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
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
            
            {/* Pagination Controls for Past Tab */}
            <PaginationControls
              currentPage={currentPastPage}
              totalPages={totalPastPages}
              onPageChange={setCurrentPastPage}
              startIndex={pastStartIndex}
              endIndex={pastEndIndex}
              totalItems={filteredPastViewings.length}
              itemName="viewings"
            />
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Viewing</h3>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSelectedRequest(null);
                  setScheduleForm(initialScheduleForm);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Viewing Preference</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={scheduleForm.preference}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, preference: e.target.value }))}
                >
                  <option>In-Person Viewing</option>
                  <option>Virtual Viewing</option>
                  <option>Phone Consultation</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={scheduleForm.tenantName}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={scheduleForm.tenantPhone}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={scheduleForm.tenantEmail}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, tenantEmail: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="px-4 py-2 rounded-lg bg-[#136C9E] text-white hover:bg-[#0f5a84] flex items-center gap-2"
                onClick={handleScheduleSubmit}
                disabled={isProcessing}
              >
                {isProcessing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Schedule Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reschedule Viewing</h3>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                onClick={() => {
                  setIsRescheduleModalOpen(false);
                  setSelectedViewing(null);
                  setRescheduleForm(initialRescheduleForm);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to Tenant (optional)</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  value={rescheduleForm.message}
                  onChange={(e) => setRescheduleForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="px-4 py-2 rounded-lg bg-[#136C9E] text-white hover:bg-[#0f5a84] flex items-center gap-2"
                onClick={handleRescheduleSubmit}
                disabled={isProcessing}
              >
                {isProcessing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Send Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Viewing</h3>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedViewing(null);
                  setCancelMessage('');
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              An email notification will be sent to the tenant letting them know this viewing has been cancelled.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Optional message to tenant</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                onClick={handleCancelSubmit}
                disabled={isProcessing}
              >
                {isProcessing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Cancel Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewingsPage;