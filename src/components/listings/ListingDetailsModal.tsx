import React, { useState, useEffect } from 'react';
import { X, MapPin, BedDouble, Bath, Square, Phone, Mail, MessageCircle, Building2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
  images: {
    src: string;
    alt: string;
    loading: string;
    sizes: string;
  }[];
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

interface ListingDetailsModalProps {
  property: Property;
  onClose: () => void;
  initialImageIndex?: number;
}

const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  property,
  onClose,
  initialImageIndex = 0,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImages('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImages('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const navigateImages = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative p-2">
          {/* Image Carousel */}
          <div className="relative h-[32rem] rounded-lg overflow-hidden">
            <img
              src={property.images[currentImageIndex].src}
              alt={property.images[currentImageIndex].alt}
              className="w-full h-full object-cover"
              loading={currentImageIndex === 0 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, 75vw"
            />
            
            {/* Property Type and Availability Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                property.type === 'rent' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-purple-500 text-white'
              }`}>
                {property.type === 'rent' ? 'To Rent' : 'For Sale'}
              </span>
              {property.isAvailableNow && (
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Available Now
                </span>
              )}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => navigateImages('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigateImages('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 px-4">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all ${
                  currentImageIndex === index
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="80px"
                />
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add margin-top to account for thumbnail strip */}
        <div className="p-6 mt-20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(property.price)}
                <span className="text-sm text-gray-500">
                  {property.type === 'rent' ? '/month' : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Location with Map Toggle */}
          <div className="flex items-center justify-between text-gray-600 mb-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{property.location.address}</span>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-primary hover:text-primary-dark"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {/* Map View */}
          {showMap && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                {/* Replace this with actual map implementation */}
                <p className="text-gray-500">Map View Coming Soon</p>
                {/* Example: */}
                {/* <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
                    property.location.address
                  )}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                /> */}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Property Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Features */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Key Features</h4>
                <ul className="space-y-2">
                  {property.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Property Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <BedDouble className="w-5 h-5 text-gray-500 mr-2" />
                    {property.bedrooms} Bedrooms
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Bath className="w-5 h-5 text-gray-500 mr-2" />
                    {property.bathrooms} Bathrooms
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Square className="w-5 h-5 text-gray-500 mr-2" />
                    800 sq ft
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Local Amenities */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Local Amenities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transport */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Transport</h4>
                <ul className="space-y-2">
                  {property.amenities.transport.map((item, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shops */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Shopping</h4>
                <ul className="space-y-2">
                  {property.amenities.shops.map((item, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Schools */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Education</h4>
                <div className="text-gray-700">
                  <p>{property.amenities.schools} schools nearby</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-lg">{property.agent.name}</p>
                  <p className="text-gray-600">{property.agent.company}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button className="flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-lg hover:bg-opacity-90">
                <MessageCircle className="w-5 h-5" />
                <span>Chat Now</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200">
                <Phone className="w-5 h-5" />
                <span>Call Agent</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200">
                <Mail className="w-5 h-5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsModal; 