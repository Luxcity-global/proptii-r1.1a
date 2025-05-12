import React, { useState } from 'react';
import { Heart, Share2, MapPin, BedDouble, Bath, Square, Phone, Mail, MessageCircle, Building2 } from 'lucide-react';
import ListingDetailsModal from './ListingDetailsModal';

interface Property {
  id: string;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  location: {
    address: string;
    city: string;
    postcode: string;
    coordinates: [number, number];
  };
  images: string[];
  features: string[];
  description: string;
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  amenities: {
    schools: number;
    transport: string[];
    shops: string[];
  };
  createdAt: string;
  updatedAt: string;
  isAvailableNow?: boolean;
}

interface ListingCardProps {
  property: Property;
  viewMode: 'grid' | 'list';
}

const ListingCard: React.FC<ListingCardProps> = ({ property, viewMode }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Placeholder image paths - these will be replaced with actual images
  const imagePaths = {
    main: '/images/listings/property-main.jpg',
    side1: '/images/listings/property-living.jpg',
    side2: '/images/listings/property-kitchen.jpg',
    side3: '/images/listings/property-garden.jpg',
    // Additional images for the modal
    bedroom: '/images/listings/property-bedroom.jpg',
    bathroom: '/images/listings/property-bathroom.jpg',
    dining: '/images/listings/property-dining.jpg',
    exterior: '/images/listings/property-exterior.jpg'
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setShowModal(true);
  };

  const cardContent = (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
        viewMode === 'list' ? 'flex' : ''
      }`}
    >
      <div 
        className={`relative ${viewMode === 'list' ? 'w-1/2' : 'w-full'}`}
      >
        <div className="flex h-64 p-2 gap-2">
          {/* Main large image */}
          <div className="w-2/3 h-full relative rounded-lg overflow-hidden" onClick={(e) => handleImageClick(0, e)}>
            <img
              src={imagePaths.main}
              alt="Main property view"
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
            <div className="absolute top-2 left-2 flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                property.type === 'rent' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-purple-500 text-white'
              }`}>
                {property.type === 'rent' ? 'To Rent' : 'For Sale'}
              </span>
              {property.isAvailableNow && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Available Now
                </span>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              Main View
            </div>
          </div>

          {/* Side images */}
          <div className="w-1/3 h-full flex flex-col gap-2">
            <div className="h-1/3 relative rounded-lg overflow-hidden" onClick={(e) => handleImageClick(1, e)}>
              <img
                src={imagePaths.side1}
                alt="Living room"
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                Living
              </div>
            </div>
            <div className="h-1/3 relative rounded-lg overflow-hidden" onClick={(e) => handleImageClick(2, e)}>
              <img
                src={imagePaths.side2}
                alt="Kitchen"
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                Kitchen
              </div>
            </div>
            <div className="h-1/3 relative rounded-lg overflow-hidden" onClick={(e) => handleImageClick(3, e)}>
              <img
                src={imagePaths.side3}
                alt="Garden"
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                Garden
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 flex space-x-2 bg-white bg-opacity-90 rounded-full p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className={`p-1.5 rounded-full ${
              isSaved ? 'text-red-500' : 'text-gray-600'
            } hover:bg-gray-100`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Implement share functionality
            }}
            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rest of the card content */}
      <div 
        className={`p-4 ${viewMode === 'list' ? 'w-1/2' : ''}`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
            <p className="text-xl font-bold text-primary">
              {formatPrice(property.price)}
              <span className="text-sm text-gray-500">
                {property.type === 'rent' ? '/month' : ''}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.location.address}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-gray-600 mb-4">
          <div className="flex items-center">
            <BedDouble className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span className="text-sm">800 sq ft</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{property.agent.company}</p>
              <p>{property.agent.name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Implement chat functionality
                }}
                className="flex items-center space-x-1 px-2 py-1 bg-primary text-white rounded-lg hover:bg-opacity-90"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Chat</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Implement call functionality
                }}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">Call</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Implement email functionality
                }}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs">Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {cardContent}
      {showModal && (
        <ListingDetailsModal
          property={{
            ...property,
            images: Object.values(imagePaths)
          }}
          initialImageIndex={selectedImageIndex}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ListingCard; 