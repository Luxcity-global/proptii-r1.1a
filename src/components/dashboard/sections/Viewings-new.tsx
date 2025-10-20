import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Mail, CheckCircle, Eye, X } from 'lucide-react';

/**
 * Viewings section - redesigned to follow style guide
 */
const Viewings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  // Mock data for summary cards
  const viewingStats = {
    upcoming: 5,
    completed: 5,
    rescheduled: 2,
    total: 8
  };

  // Mock data for property viewings
  const upcomingViewings = [
    {
      id: 1,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'upcoming',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    },
    {
      id: 2,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'upcoming',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    },
    {
      id: 3,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'upcoming',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    },
    {
      id: 4,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'upcoming',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    },
    {
      id: 5,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'upcoming',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    }
  ];

  const pastViewings = [
    {
      id: 6,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'past',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    },
    {
      id: 7,
      address: 'Flat 3A, 12 High Street, Manchester',
      location: 'Manchester, M4 4BT',
      date: '2023-12-15',
      time: '14:00',
      status: 'past',
      agent: 'Aisha Daodu',
      email: 'aisha@listings.com',
      image: '/images/detached-house.jpg'
    }
  ];

  const currentViewings = activeTab === 'upcoming' ? upcomingViewings : pastViewings;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

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
              {viewingStats.upcoming}
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
              Upcoming (5)
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
              Past (2)
            </button>
        </div>
      </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentViewings.map((viewing) => (
            <div key={viewing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={viewing.image} 
                  alt={viewing.address} 
                  className="w-full h-full object-cover" 
                />
        </div>
        
              {/* Property Details */}
              <div className="p-4">
                {/* Address */}
                <h3 className="text-base font-bold text-gray-800 mb-1 truncate">
                  {viewing.address}
                    </h3>
                
                {/* Location */}
                <p className="text-xs text-gray-600 mb-3 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {viewing.location}
                </p>
                
                {/* Date and Time */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {viewing.date}
                    </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                      {viewing.time}
                    </div>
                  </div>

                {/* Estate Agent Details */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Estate Agent Details</h4>
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <User className="w-3 h-3 mr-1" />
                      {viewing.agent}
                    </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Mail className="w-3 h-3 mr-1" />
                      {viewing.email}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeTab === 'upcoming' ? (
                    <>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#136C9E' }}>
                        Reschedule
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                        <X className="w-4 h-4 mr-2" />
                        Cancel Viewing
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#DC5F12' }}>
                        Book Again
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Property
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Viewings;

