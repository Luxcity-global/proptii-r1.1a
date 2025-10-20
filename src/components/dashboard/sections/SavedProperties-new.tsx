import React from 'react';
import { Building2, MapPin, PoundSterling, Eye, Heart, Search, FileText, Calendar, AlertTriangle } from 'lucide-react';

/**
 * Saved Properties section - redesigned to follow style guide
 */
const SavedProperties: React.FC = () => {
  // Mock data for summary cards
  const dashboardSummary = {
    savedSearches: { count: 3 },
    viewings: { total: 8 },
    referencing: { completedSteps: 6, totalSteps: 6 },
    contracts: { pending: 0, total: 1, requested: 0 }
  };

  // Mock data for saved searches
  const savedSearches = [
    {
      id: 1,
      address: '123 Regent Street, London W1B 4EA',
      propertyType: '2 Bedroom Apartment',
      bedrooms: 2,
      price: 2400,
      features: ['Central Heating', 'Double Glazing', 'Balcony'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 2,
      address: '45 Victoria Park Road, London E9 7JN',
      propertyType: '3 Bedroom House',
      bedrooms: 3,
      price: 2100,
      features: ['Garden', 'Parking', 'Central Heating'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 3,
      address: '78 Oak Gardens, London SW4 9AL',
      propertyType: '1 Bedroom Flat',
      bedrooms: 1,
      price: 2800,
      features: ['Concierge', 'Gym Access', 'Balcony'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 4,
      address: '92 Baker Street, London NW1 6XE',
      propertyType: '2 Bedroom Apartment',
      bedrooms: 2,
      price: 2200,
      features: ['Central Heating', 'Double Glazing', 'Parking'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 5,
      address: '156 King\'s Road, London SW3 4TP',
      propertyType: '3 Bedroom House',
      bedrooms: 3,
      price: 3500,
      features: ['Garden', 'Parking', 'Balcony'],
      image: '/images/detached-house.jpg'
    },
    {
      id: 6,
      address: '203 High Street, London W1C 1AP',
      propertyType: '1 Bedroom Flat',
      bedrooms: 1,
      price: 1900,
      features: ['Central Heating', 'Concierge', 'Gym Access'],
      image: '/images/detached-house.jpg'
    }
  ];

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
        <h1 className="text-2xl font-semibold" style={{ color: '#374957' }}>
          Saved Properties
        </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all your properties in one place.
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
            Browse Properties
        </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saved Listings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Saved Listings</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.savedSearches.count || 3}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Active searches</p>
          </div>
        </div>

        {/* Viewings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Viewings</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.viewings.total || 8}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Total booked</p>
          </div>
        </div>

        {/* Referencing Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Referencing</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.referencing.completedSteps || 6}/{dashboardSummary?.referencing.totalSteps || 6}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Complete</p>
          </div>
        </div>

        {/* Contracts Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Contracts</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>
              {dashboardSummary?.contracts.total || 1}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>As of 09/10/2025</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-transparent"
            style={{ 
              fontFamily: 'Archivo, sans-serif'
            }}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {savedSearches.map((search) => (
          <div key={search.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Property Image */}
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={search.image} 
                alt={search.address} 
                className="w-full h-full object-cover" 
              />
              {/* Heart Icon */}
              <div className="absolute top-3 right-3">
                <div className="bg-white bg-opacity-80 rounded-full p-1">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </div>
              </div>
            </div>
            
            {/* Property Details */}
            <div className="p-4">
              {/* Address */}
              <h3 className="text-base font-bold text-gray-800 mb-1 truncate">
                {search.address}
              </h3>
              
              {/* Property Type */}
              <p className="text-xs text-gray-600 mb-3 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                London · {search.propertyType}
              </p>
              
              {/* Price */}
              <div className="flex items-center text-lg font-bold text-gray-900 mb-3">
                {formatCurrency(search.price)}
                <span className="text-sm text-gray-500 ml-1">/month</span>
              </div>
              
              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {search.features.slice(0, 3).map((feature, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 cursor-pointer transition-colors"
                  >
                    {feature}
                  </span>
                ))}
                {search.features.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 cursor-pointer transition-colors">
                    +{search.features.length - 3} more
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </button>
                <button className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-6">
        <button 
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ color: '#374957' }}
        >
          Load More Properties
        </button>
      </div>
    </div>
  );
};

export default SavedProperties;

