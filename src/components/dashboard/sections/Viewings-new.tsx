import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, User, Mail, CheckCircle, Eye, X, Heart, MessageCircle, Send, AlertCircle } from 'lucide-react';
import { viewingService, ViewingBooking, ViewingStats } from '../../../services/viewingService';
import { bookViewingRequestService, BookViewingRequest } from '../../../services/bookViewingRequestService';
import { propertySelectionService, PropertySelection, PropertySelectionStats } from '../../../services/propertySelectionService';
import { useAuth } from '../../../contexts/AuthContext';
import BookViewingModal from '../../viewings/BookViewingModal';
import emailService from '../../../services/emailService';

/**
 * Viewings section - redesigned to follow style guide
 */
const Viewings: React.FC = () => {
  const { user } = useAuth();
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<ViewingBooking | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

        // Merge requests placeholders, dedupe by propertyId
        const mergedMap = new Map<string, ViewingBooking>();
        [...requestBookings, ...upcoming].forEach(b => {
          const key = b.propertyId || `${b.property.street}-${b.property.town}`;
          if (!mergedMap.has(key)) mergedMap.set(key, b);
        });
        upcoming = Array.from(mergedMap.values());
        setUpcomingViewings(prev => {
          // Keep any draft at the top if present
          const draft = prev.find(v => String(v.id).startsWith('draft_'));
          const withoutDraft = upcoming.filter(v => !String(v.id).startsWith('draft_'));
          return draft ? [draft, ...withoutDraft] : upcoming;
        });
        console.log('Set upcoming viewings:', upcoming);
        console.log('Upcoming viewings count:', upcoming.length);

        console.log('Loading past viewings...');
        // Load past viewings (completed)
        const completedResult = await viewingService.getViewingBookingsByStatus(user.id, 'completed');
        console.log('Completed result:', completedResult);
        setPastViewings(completedResult.bookings || []);

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
        const past = bookings.filter(b => b.status === 'completed');
        console.log('Filtered upcoming:', upcoming);
        console.log('Filtered past:', past);
        setUpcomingViewings(prev => {
          // keep any request placeholders already shown
          const requests = prev.filter(v => String(v.id).startsWith('request_'));
          const dedupMap = new Map<string, ViewingBooking>();
          [...requests, ...upcoming].forEach(b => {
            const key = b.propertyId || `${b.property.street}-${b.property.town}`;
            if (!dedupMap.has(key)) dedupMap.set(key, b);
          });
          return Array.from(dedupMap.values());
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
          const dedupMap = new Map<string, ViewingBooking>();
          [...requestBookings, ...prev].forEach(b => {
            const key = b.propertyId || `${b.property.street}-${b.property.town}`;
            if (!dedupMap.has(key)) dedupMap.set(key, b);
          });
          return Array.from(dedupMap.values());
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const handleReschedule = async (bookingId: string) => {
    const viewing = upcomingViewings.find(v => v.id === bookingId);
    if (viewing) {
      setSelectedViewing(viewing);
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

    setIsSendingEmail(true);
    try {
      // Structure data for reschedule email (only to agent, not user confirmation)
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
          rescheduleMessage: rescheduleMessage
        },
        user: {
          name: selectedViewing.viewingDetails.userDetails.fullName,
          email: selectedViewing.viewingDetails.userDetails.email
        }
      };

      const propertyAddress = `${selectedViewing.property.street}, ${selectedViewing.property.town}, ${selectedViewing.property.city}`;

      // Send reschedule-specific email directly to agent (not using viewingEmailService which sends both agent and user emails)
      const result = await emailService.sendEmail({
        to: selectedViewing.property.agent.email,
        subject: `Viewing Reschedule Request - ${propertyAddress}`,
        formData: formData,
        attachments: [],
        emailType: 'viewing-reschedule'
      });

      if (result.success) {
        await viewingService.updateViewingStatus(
          selectedViewing.id,
          'rescheduled',
          `Reschedule requested: ${rescheduleMessage}`
        );

        alert('Reschedule request sent successfully!');
        setIsRescheduleModalOpen(false);
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
        'test-property-1'
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
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
        <h1 className="text-2xl font-semibold" style={{ color: '#374957' }}>
          Property Viewings
        </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track all your property viewings
            </p>
          </div>
        <button 
            className="px-12 py-3 text-white rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              border: '1px solid #DC5F12',
              minHeight: '3.5rem',
              minWidth: '180px',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Upcoming Viewings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Upcoming Viewings</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
              <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {upcomingViewings.length}
              </p>
            </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>As of 8/10/2025</p>
          </div>
        </div>

        {/* Completed Viewings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Completed Viewings</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-3">
              <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {viewingStats.completed}
              </p>
            </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Total Completed</p>
          </div>
        </div>

        {/* Rescheduled Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Rescheduled</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {viewingStats.rescheduled}
            </p>
          </div>
            <div>
            <p className="text-sm" style={{ color: '#717182' }}>Past 30 days</p>
          </div>
        </div>

        {/* Total Viewings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Total Viewings</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mb-3">
              <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {viewingStats.total}
              </p>
            </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Total Viewings</p>
            </div>
          </div>
      </div>

      {/* Tabs Section */}
      <div>
        <div className="mb-6">
          <div className="bg-white rounded-full border border-gray-100 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-full ${
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
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-full ${
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentViewings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No viewings scheduled
                </h3>
                <p className="text-gray-500">
                  Viewings you've requested will appear here.
                </p>
              </div>
            ) : (
              currentViewings.map((viewing) => (
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
              <div className="p-4">
                {/* Address */}
                <h3 className="text-base font-bold text-gray-800 mb-1 truncate">
                    {viewing.property.street}
                    </h3>
                
                {/* Location */}
                <p className="text-xs text-gray-600 mb-3 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                    {viewing.property.town}, {viewing.property.city} {viewing.property.postcode}
                </p>
                
                {/* Date and Time */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(viewing.viewingDetails.date)}
                    </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                      {viewing.viewingDetails.time}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      viewing.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : viewing.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : viewing.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                    </span>
                  </div>

                {/* Estate Agent Details */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Estate Agent Details</h4>
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <User className="w-3 h-3 mr-1" />
                      {viewing.property.agent.name}
                    </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Mail className="w-3 h-3 mr-1" />
                      {viewing.property.agent.email}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeTab === 'upcoming' ? (
                    <>
                        <button 
                          onClick={() => handleReschedule(viewing.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" 
                          style={{ backgroundColor: '#136C9E' }}
                        >
                        Reschedule
                      </button>
                        <button 
                          onClick={() => handleCancel(viewing.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Viewing
                      </button>
                    </>
                  ) : (
                    <>
                        <button 
                          onClick={() => handleBookAgain(viewing.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" 
                          style={{ backgroundColor: '#DC5F12' }}
                        >
                        Book Again
                      </button>
                        <button 
                          onClick={() => handleViewProperty(viewing.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                        <Eye className="w-4 h-4 mr-2" />
                        View Property
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
      <BookViewingModal
        open={isBookViewingOpen}
        onClose={() => setIsBookViewingOpen(false)}
        onSubmissionComplete={() => {
          // After successful submission, close modal and refresh data via existing subscriptions
          setIsBookViewingOpen(false);
        }}
      />

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reschedule Viewing</h3>
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleMessage('');
                    setSelectedViewing(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Property: <strong>{selectedViewing.property.street}, {selectedViewing.property.town}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Current Date: <strong>{selectedViewing.viewingDetails.date}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Current Time: <strong>{selectedViewing.viewingDetails.time}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Agent/Landlord <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rescheduleMessage}
                  onChange={(e) => setRescheduleMessage(e.target.value)}
                  placeholder="Please explain why you need to reschedule and suggest alternative dates/times..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent via email to {selectedViewing.property.agent.email}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleMessage('');
                    setSelectedViewing(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={sendRescheduleEmail}
                  disabled={isSendingEmail || !rescheduleMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Viewing</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Property: <strong>{selectedViewing.property.street}, {selectedViewing.property.town}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Date: <strong>{selectedViewing.viewingDetails.date}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Time: <strong>{selectedViewing.viewingDetails.time}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional Message to Agent/Landlord
                </label>
                <textarea
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  placeholder="Let them know why you're cancelling (optional)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent via email to {selectedViewing.property.agent.email}
                </p>
              </div>

              <p className="text-gray-700 mb-6 text-sm">
                Are you sure you want to cancel this viewing? An email notification will be sent to the agent/landlord.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setCancelMessage('');
                    setSelectedViewing(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSendingEmail}
                >
                  Keep Viewing
                </button>
                <button
                  onClick={sendCancelEmail}
                  disabled={isSendingEmail}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
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

