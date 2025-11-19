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
  MapPin
} from 'lucide-react';
import viewingService, { ViewingBooking, ViewingStats } from '../../../services/viewingService';
import {
  bookViewingRequestService,
  BookViewingRequest
} from '../../../services/bookViewingRequestService';
import emailService from '../../../services/emailService';

// Module-level log to confirm file is loaded
console.log('📦 ViewingsPage.tsx MODULE LOADED');

type TabKey = 'requests' | 'upcoming' | 'past';

interface ViewingsPageProps {
  managerId: string | null;
  managerName?: string;
  managerEmail?: string;
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

const ViewingsPage: React.FC<ViewingsPageProps> = ({ managerId, managerName, managerEmail }) => {
  console.log('🟢 ViewingsPage component RENDERED');
  console.log('🟢 Props received:', { managerId, managerName, managerEmail });
  console.log('🟢 About to declare useState hooks...');
  
  const [loading, setLoading] = useState(true);
  console.log('🟢 useState hooks declared, loading state:', loading);
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

  console.log('🟢 All state hooks declared, about to declare useEffect...');
  console.log('🟢 managerEmail at useEffect declaration time:', managerEmail);
  
  // Test useEffect with empty deps to see if ANY useEffect runs
  useEffect(() => {
    console.log('🧪🧪🧪 TEST: useEffect with empty deps executed! 🧪🧪🧪');
  }, []);

  useEffect(() => {
    console.log('🔵🔵🔵 ViewingsPage useEffect TRIGGERED 🔵🔵🔵');
    console.log('🔵 managerEmail prop:', managerEmail);
    console.log('🔵 managerEmail type:', typeof managerEmail);
    console.log('🔵 managerEmail truthy?', !!managerEmail);
    console.log('🔵 managerId prop:', managerId);
    console.log('🔵 managerName prop:', managerName);
    
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeRequests: (() => void) | undefined;
    let unsubscribeStats: (() => void) | undefined;

    // Use email for filtering instead of managerId
    if (!managerEmail) {
      console.warn('⚠️⚠️⚠️ No managerEmail provided, cannot load viewings ⚠️⚠️⚠️');
      setLoading(false);
      setError('Unable to determine your email. Please sign in again.');
      return;
    }
    
    console.log('✅✅✅ managerEmail is available, proceeding with email-based filtering ✅✅✅');
    console.log('✅ managerEmail value:', managerEmail);

    const loadInitialData = async () => {
      console.log('📥 loadInitialData function called');
      console.log('📥 About to call service methods with email:', managerEmail);
      try {
        setLoading(true);
        setError(null);

        console.log('📥 Getting ALL viewingBookings for email (will filter by status)...');
        const allBookingsPromise = viewingService.getViewingBookingsByEmail(managerEmail);
        console.log('📥 Calling getViewingStatsByEmail...');
        const statsPromise = viewingService.getViewingStatsByEmail(managerEmail);
        
        console.log('📥 Waiting for Promise.all...');
        // Use email-based filtering on viewingBookings collection only
        const [allBookingsResult, statsResult] = await Promise.all([
          allBookingsPromise,
          statsPromise
        ]);
        
        // Filter bookings by status: 'pending' = requests, others = bookings
        const requests: BookViewingRequest[] = [];
        const bookings: ViewingBooking[] = [];
        
        if (allBookingsResult.success && allBookingsResult.bookings) {
          allBookingsResult.bookings.forEach((booking) => {
            if (booking.status === 'pending') {
              // Convert ViewingBooking to BookViewingRequest format for pending requests
              requests.push({
                id: booking.id,
                userId: booking.userId,
                propertyId: booking.propertyId || '',
                landlordId: booking.landlordId,
                agentId: booking.agentId,
                property: booking.property,
                status: 'requested' as const,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt
              });
            } else {
              bookings.push(booking);
            }
          });
        }
        
        const requestsResult = { success: true, requests };
        const bookingsResult = { success: true, bookings };
        
        console.log('📥 Promise.all completed');
        console.log('📥 requestsResult:', requestsResult);
        console.log('📥 bookingsResult:', bookingsResult);
        console.log('📥 statsResult:', statsResult);

        if (requestsResult.success && requestsResult.requests) {
          console.log('✅ Setting requests:', requestsResult.requests.length);
          setRequests(requestsResult.requests);
        } else {
          console.warn('⚠️ requestsResult not successful:', requestsResult);
        }

        if (bookingsResult.success && bookingsResult.bookings) {
          console.log('✅ Setting bookings:', bookingsResult.bookings.length);
          setBookings(bookingsResult.bookings);
        } else {
          console.warn('⚠️ bookingsResult not successful:', bookingsResult);
        }

        if (statsResult.success && statsResult.stats) {
          console.log('✅ Setting stats:', statsResult.stats);
          setStats(statsResult.stats);
        } else {
          console.warn('⚠️ statsResult not successful:', statsResult);
        }

        setLoading(false);
        console.log('✅✅✅ loadInitialData completed successfully ✅✅✅');
      } catch (err) {
        console.error('❌❌❌ Error loading manager viewings:', err);
        console.error('❌ Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError('Failed to load viewings data. Please try again later.');
        setLoading(false);
      }
    };

    console.log('📞 Calling loadInitialData...');
    loadInitialData();

    // Use email-based subscriptions for real-time updates (all from viewingBookings)
    console.log('📡 Setting up subscriptions with email:', managerEmail);
    
    console.log('📡 Subscribing to ALL viewingBookings (will filter by status)...');
    unsubscribeBookings = viewingService.subscribeToViewingBookingsByEmail(
      managerEmail,
      (allItems) => {
        console.log('📡 All viewingBookings subscription callback received:', allItems.length, 'items');
        
        // Filter by status: pending = requests, others = bookings
        const pendingRequests: BookViewingRequest[] = [];
        const confirmedBookings: ViewingBooking[] = [];
        
        allItems.forEach((item) => {
          if (item.status === 'pending') {
            pendingRequests.push({
              id: item.id,
              userId: item.userId,
              propertyId: item.propertyId || '',
              landlordId: item.landlordId,
              agentId: item.agentId,
              property: item.property,
              status: 'requested' as const,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          } else {
            confirmedBookings.push(item);
          }
        });
        
        console.log('📡 Filtered to', pendingRequests.length, 'requests and', confirmedBookings.length, 'bookings');
        setRequests(pendingRequests);
        setBookings(confirmedBookings);
      },
      (err) => {
        console.error('❌ Viewing bookings subscription error:', err);
      }
    );

    console.log('📡 Subscribing to viewing stats...');
    unsubscribeStats = viewingService.subscribeToViewingStatsByEmail(
      managerEmail,
      (nextStats) => {
        console.log('📡 Viewing stats subscription callback received:', nextStats);
        setStats(nextStats);
      },
      (err) => {
        console.error('❌ Viewing stats subscription error:', err);
      }
    );
    
    // No separate subscription for requests - they come from the same subscription
    unsubscribeRequests = undefined;
    
    console.log('✅✅✅ All subscriptions set up ✅✅✅');

    return () => {
      unsubscribeBookings?.();
      unsubscribeRequests?.();
      unsubscribeStats?.();
    };
  }, [managerEmail]);

  const upcomingViewings = useMemo(
    () =>
      bookings.filter((viewing) =>
        ['pending', 'confirmed', 'rescheduled'].includes(viewing.status)
      ),
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
        value: requests.length,
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
  }, [requests.length, upcomingViewings.length, stats.completed, bookings]);

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
          emailType: 'viewing-user'
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
        <div className="mb-6 inline-flex rounded-full border border-gray-200 p-1 bg-white">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              activeTab === 'requests' ? 'bg-orange-500 text-white' : 'text-gray-600'
            }`}
          >
            Requests ({requests.length})
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

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No pending requests</h3>
                <p className="text-sm text-gray-500">New viewing requests will appear here for approval.</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {request.property.street}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {request.property.town}, {request.property.city} {request.property.postcode}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 tracking-wide uppercase mb-2">Agent</h4>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      <span className="flex items-center"><User className="w-4 h-4 mr-2" />{request.property.agent.name}</span>
                      <span className="flex items-center"><Mail className="w-4 h-4 mr-2" />{request.property.agent.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                      onClick={() => handleScheduleRequest(request)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Schedule Viewing
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => handleDeclineRequest(request)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {upcomingViewings.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No scheduled viewings</h3>
                <p className="text-sm text-gray-500">Scheduled viewings will appear here once you confirm requests.</p>
              </div>
            ) : (
              upcomingViewings.map((viewing) => (
                <div key={viewing.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {viewing.property.street}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(viewing.viewingDetails?.date || '')}
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(viewing.viewingDetails?.time || '')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
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

                  <div className="grid grid-cols-1 gap-3 mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {viewing.viewingDetails?.userDetails?.fullName || 'Tenant name unavailable'}
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {viewing.viewingDetails?.userDetails?.email || 'Email unavailable'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {viewing.status !== 'confirmed' && (
                      <button
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                        onClick={() => handleConfirmViewing(viewing)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm
                      </button>
                    )}
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-300 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                      onClick={() => handleOpenReschedule(viewing)}
                      disabled={isProcessing}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Reschedule
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                      onClick={() => handleOpenCancel(viewing)}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pastViewings.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No past viewings</h3>
                <p className="text-sm text-gray-500">Completed and cancelled viewings will appear here.</p>
              </div>
            ) : (
              pastViewings.map((viewing) => (
                <div key={viewing.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {viewing.property.street}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(viewing.viewingDetails?.date || '')}
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(viewing.viewingDetails?.time || '')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewing.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
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

