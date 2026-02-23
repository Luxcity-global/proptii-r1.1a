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
  Filter
} from 'lucide-react';
import viewingService, { ViewingBooking, ViewingStats } from '../../../services/viewingService';
import {
  bookViewingRequestService,
  BookViewingRequest
} from '../../../services/bookViewingRequestService';
import emailService from '../../../services/emailService';
import landlordUserService from '../../../services/landlordUserService';
import { LandlordEmptyState } from './LandlordEmptyState';

// ViewingsPage component for managing property viewings and requests

type TabKey = 'requests' | 'upcoming' | 'past';

interface ViewingsPageProps {
  managerId: string | null;
  managerName?: string;
  managerEmail?: string;
  userProfile?: { name?: string; email?: string } | null;
  onSignIn?: () => void;
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

const ViewingsPage: React.FC<ViewingsPageProps> = ({ managerId, managerName, managerEmail, userProfile, onSignIn }) => {
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
  const [filterType, setFilterType] = useState<'all' | 'name' | 'email' | 'date'>('all');

  useEffect(() => {
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeRequests: (() => void) | undefined;
    let unsubscribeStats: (() => void) | undefined;

    if (!managerId && !managerEmail) {
      setLoading(false);
      setError('Unable to determine your email. Please sign in again.');
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Look up the landlordUser record by email to get the correct landlordUser ID
        // This is important because the auth user ID might be different from the landlordUser ID
        let landlordUserId: string | null = null;
        
        if (managerEmail) {
          console.log('🔍 Looking up landlord user by email:', managerEmail);
          const lookupResult = await landlordUserService.getLandlordUserByEmail(managerEmail);
          if (lookupResult.success && lookupResult.user?.id) {
            landlordUserId = lookupResult.user.id;
            console.log('✅ Found landlord user ID:', landlordUserId, '(from email lookup)');
          } else {
            console.log('⚠️ No landlord user found with email:', managerEmail);
            console.log('ℹ️ Falling back to managerId from auth:', managerId);
          }
        }

        // If we still don't have an ID after email lookup, use the managerId as fallback
        if (!landlordUserId) {
          landlordUserId = managerId;
          console.log('ℹ️ Using managerId as fallback:', landlordUserId);
        }

        if (!landlordUserId) {
          setError('Unable to find your landlord/agent profile. Please make sure you are registered.');
          setLoading(false);
          return;
        }

        console.log('📊 Loading viewings for landlord user ID:', landlordUserId);

        const [requestsResult, bookingsResult, statsResult] = await Promise.all([
          bookViewingRequestService.getManagerRequests(landlordUserId),
          viewingService.getManagerViewingBookings(landlordUserId),
          viewingService.getManagerViewingStats(landlordUserId)
        ]);

        console.log('📋 Requests result:', requestsResult);
        console.log('📋 Bookings result:', bookingsResult);
        console.log('📋 Stats result:', statsResult);

        if (requestsResult.success && requestsResult.requests) {
          setRequests(requestsResult.requests);
        }

        if (bookingsResult.success && bookingsResult.bookings) {
          setBookings(bookingsResult.bookings);
          console.log('✅ Set bookings:', bookingsResult.bookings.length, 'bookings');
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
        setLoading(false);

        // Set up real-time subscriptions using the landlordUser ID
        unsubscribeBookings = viewingService.subscribeToManagerViewingBookings(
          landlordUserId,
          (items) => {
            console.log('📡 Real-time bookings update:', items.length, 'bookings');
            setBookings(items);
          },
          (err) => {
            console.error('Viewing bookings subscription error:', err);
          }
        );

        unsubscribeStats = viewingService.subscribeToManagerViewingStats(
          landlordUserId,
          (nextStats) => setStats(nextStats),
          (err) => console.error('Viewing stats subscription error:', err)
        );

        unsubscribeRequests = bookViewingRequestService.subscribeToManagerRequests(
          landlordUserId,
          (items) => setRequests(items),
          (err) => console.error('Viewing requests subscription error:', err)
        );
      } catch (err) {
        console.error('Error loading manager viewings:', err);
        setError('Failed to load viewings data. Please try again later.');
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      unsubscribeBookings?.();
      unsubscribeRequests?.();
      unsubscribeStats?.();
    };
  }, [managerId, managerEmail]);

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

  const pastViewings = useMemo(
    () =>
      bookings.filter((viewing) =>
        ['completed', 'cancelled'].includes(viewing.status)
      ),
    [bookings]
  );

  const summaryCards = useMemo(() => {
    const cancelledCount = bookings.filter((viewing) => viewing.status === 'cancelled').length;
    return [
      {
        title: 'Pending Requests',
        value: requests.length + pendingViewings.length,
        icon: <Mail className="w-5 h-5 text-blue-600" />,
        accent: 'bg-blue-100'
      },
      {
        title: 'Scheduled Viewings',
        value: upcomingViewings.length,
        icon: <Calendar className="w-5 h-5 text-orange-600" />,
        accent: 'bg-orange-100'
      },
      {
        title: 'Completed Viewings',
        value: stats.completed,
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
  }, [requests.length, pendingViewings.length, upcomingViewings.length, stats.completed, bookings]);

  // Filter function
  const filterItems = <T extends { property: { street: string; town: string; city: string }; viewingDetails?: { date?: string; userDetails?: { fullName?: string; email?: string } } }>(items: T[]) => {
    if (!filterQuery) return items;

    const query = filterQuery.toLowerCase();
    return items.filter((item) => {
      const propertyText = `${item.property.street} ${item.property.town} ${item.property.city}`.toLowerCase();
      const tenantName = item.viewingDetails?.userDetails?.fullName?.toLowerCase() || '';
      const tenantEmail = item.viewingDetails?.userDetails?.email?.toLowerCase() || '';
      const date = item.viewingDetails?.date || '';

      switch (filterType) {
        case 'name':
          return tenantName.includes(query);
        case 'email':
          return tenantEmail.includes(query);
        case 'date':
          return date.includes(query);
        case 'all':
        default:
          return propertyText.includes(query) || tenantName.includes(query) || tenantEmail.includes(query) || date.includes(query);
      }
    });
  };

  const filteredUpcomingViewings = useMemo(() => filterItems(upcomingViewings), [upcomingViewings, filterQuery, filterType]);
  const filteredPendingViewings = useMemo(() => filterItems(pendingViewings), [pendingViewings, filterQuery, filterType]);
  const filteredPastViewings = useMemo(() => filterItems(pastViewings), [pastViewings, filterQuery, filterType]);

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

  // Guest view: show layout with empty state in table area
  if (!userProfile && onSignIn) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Viewings & Requests</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage incoming requests, schedule property viewings, and keep tenants informed.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { title: 'Pending Requests', value: 0, accent: 'bg-blue-100' },
            { title: 'Scheduled Viewings', value: 0, accent: 'bg-orange-100' },
            { title: 'Completed Viewings', value: 0, accent: 'bg-green-100' },
            { title: 'Cancelled Viewings', value: 0, accent: 'bg-red-100' }
          ].map((card) => (
            <div key={card.title} className={`rounded-xl border border-[#f3f3f3] p-6 ${card.accent}`}>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#f3f3f3] bg-white p-12">
          <LandlordEmptyState onSignIn={onSignIn} />
        </div>
      </div>
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
    return (
      <div className="max-w-4xl mx-auto bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load viewings</h2>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Viewings & Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage incoming requests, schedule property viewings, and keep tenants informed.
          </p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.accent}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-6 flex items-center justify-between">
          {/* Tabs */}
          <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === 'requests' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Requests ({requests.length + pendingViewings.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === 'upcoming' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Scheduled ({upcomingViewings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === 'past' ? 'bg-orange-500 text-white' : 'text-gray-600'
              }`}
            >
              Past ({pastViewings.length})
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search viewings..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'name' | 'email' | 'date')}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {requests.length === 0 && filteredPendingViewings.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No pending requests</h3>
                <p className="text-sm text-gray-500">New viewing requests will appear here for approval.</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">Property</div>
                    <div className="col-span-2">Date & Time</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Tenant Name</div>
                    <div className="col-span-2">Tenant Email</div>
                    <div className="col-span-3 text-center">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {/* Unscheduled Requests */}
                  {requests.map((request) => (
                    <div key={request.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
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
                        <div className="col-span-3 flex items-center justify-center gap-2">
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
                            onClick={() => handleScheduleRequest(request)}
                            title="Schedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Schedule
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                            onClick={() => handleDeclineRequest(request)}
                            title="Decline request"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pending Viewings (Scheduled but not confirmed) */}
                  {filteredPendingViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Property */}
                        <div className="col-span-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
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
                        <div className="col-span-3 flex items-center justify-center gap-2">
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                            onClick={() => handleConfirmViewing(viewing)}
                            disabled={isProcessing}
                            title="Confirm viewing"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Confirm
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-blue-300 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Reschedule
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                            title="Cancel viewing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">Property</div>
                    <div className="col-span-2">Date & Time</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Tenant Name</div>
                    <div className="col-span-2">Tenant Email</div>
                    <div className="col-span-3 text-center">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {filteredUpcomingViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Property */}
                        <div className="col-span-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
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
                        <div className="col-span-3 flex items-center justify-center gap-2">
                          {viewing.status !== 'confirmed' && (
                            <button
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                              onClick={() => handleConfirmViewing(viewing)}
                              disabled={isProcessing}
                              title="Confirm viewing"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Confirm
                            </button>
                          )}
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-blue-300 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                            onClick={() => handleOpenReschedule(viewing)}
                            disabled={isProcessing}
                            title="Reschedule viewing"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Reschedule
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            onClick={() => handleOpenCancel(viewing)}
                            disabled={isProcessing}
                            title="Cancel viewing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredPastViewings.length === 0 ? (
              <div className="p-12 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {filterQuery ? 'No matching viewings' : 'No past viewings'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filterQuery ? 'Try adjusting your search filters' : 'Completed and cancelled viewings will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">Property</div>
                    <div className="col-span-2">Date & Time</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Tenant Name</div>
                    <div className="col-span-2">Tenant Email</div>
                    <div className="col-span-3">Notes</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {filteredPastViewings.map((viewing) => (
                    <div key={viewing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Property */}
                        <div className="col-span-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {viewing.property.street}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {viewing.property.town}, {viewing.property.city}
                          </p>
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
                        <div className="col-span-3">
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
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
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

