import React, { useState } from 'react';
import { Building2, BedDouble, Bath, Calendar, MapPin, Heart, Share2, Mail, Phone } from 'lucide-react';
import { FaLink, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { PropertyFormData } from './SubmissionForm';

interface ListingPreviewProps {
  data: PropertyFormData;
  imagePreviews: string[]; // Only need image previews
}

const ListingPreview: React.FC<ListingPreviewProps> = ({ data, imagePreviews }) => {
  // Add state to track the currently selected image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Add state for favorites functionality
  const [isFavorite, setIsFavorite] = useState(false);
  // Add state for share modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle thumbnail click to change the main image
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Toggle share modal
  const toggleShareModal = () => {
    setIsShareModalOpen(!isShareModalOpen);
  };

  // Share options
  const shareOptions = [
    { 
      name: 'Copy Link', 
      icon: <FaLink className="text-xl text-gray-700" />, 
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
        setIsShareModalOpen(false);
      }
    },
    { 
      name: 'Email', 
      icon: <FaEnvelope className="text-xl text-gray-700" />, 
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent('Check out this property: ' + window.location.href)}`;
        setIsShareModalOpen(false);
      }
    },
    { 
      name: 'WhatsApp', 
      icon: <FaWhatsapp className="text-xl text-green-600" />, 
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(data.title + ': ' + window.location.href)}`, '_blank');
        setIsShareModalOpen(false);
      }
    }
  ];

  // Format property type for display
  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // For sale or for rent badge
  const listingBadge = data.type === 'rent' ? 'FOR RENT' : 'FOR SALE';
  const listingBadgeColor = data.type === 'rent' ? 'bg-[#136C9E]' : 'bg-primary';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Image Gallery with enhanced controls */}
      <div className="relative">
        {imagePreviews.length > 0 ? (
          <div className="aspect-video bg-gray-100 relative">
            <img
              src={imagePreviews[selectedImageIndex]}
              alt="Property main image"
              className="w-full h-full object-cover"
            />
            
            {/* Type badge (For Sale/For Rent) */}
            <div className={`absolute top-4 left-4 ${listingBadgeColor} text-white px-4 py-1 rounded-md font-medium text-sm`}>
              {listingBadge}
            </div>
            
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={toggleFavorite}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm transition"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} 
                />
              </button>
              <button 
                onClick={toggleShareModal}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm text-gray-700 hover:text-primary transition"
                aria-label="Share this listing"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            {/* Image navigation indicators */}
            {imagePreviews.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {imagePreviews.map((_, index) => (
                  <div 
                    key={index} 
                    className={`h-2 rounded-full transition-all ${
                      selectedImageIndex === index ? 'w-6 bg-white' : 'w-2 bg-white bg-opacity-60'
                    }`}
                    onClick={() => handleThumbnailClick(index)}
                    role="button"
                    aria-label={`View property image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Image count badge */}
        {imagePreviews.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
            {selectedImageIndex + 1}/{imagePreviews.length} Photos
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Share This Property</h3>
              <button 
                onClick={toggleShareModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {shareOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-3 text-xl">{option.icon}</span>
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clickable Thumbnail gallery */}
      {imagePreviews.length > 1 && (
        <div className="flex gap-2 p-3 bg-gray-50 overflow-x-auto">
          {imagePreviews.map((preview, index) => (
            <div 
              key={index} 
              className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all ${
                selectedImageIndex === index 
                  ? 'border-2 border-primary shadow-md scale-105' 
                  : 'border border-gray-200 opacity-80 hover:opacity-100'
              }`}
              onClick={() => handleThumbnailClick(index)}
              role="button"
              aria-label={`View property image ${index + 1}`}
            >
              <img
                src={preview}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Property Details */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
            <div className="flex items-center mt-1 text-gray-600">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <p className="truncate">{data.address}, {data.city}, {data.postcode}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatPrice(data.price)}</p>
            <p className="text-gray-600 text-sm">
              {data.type === 'rent' ? 'per month' : ''}
            </p>
          </div>
        </div>

        {/* Key features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-gray-700 font-medium">
                {formatPropertyType(data.propertyType)}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-primary" />
              <span className="text-gray-700 font-medium">
                {data.bedrooms} {data.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Bath className="w-5 h-5 text-primary" />
              <span className="text-gray-700 font-medium">
                {data.bathrooms} {data.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </span>
            </div>
          </div>
          {data.isAvailableNow && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-gray-700 font-medium">Available Now</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">About This Property</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">{data.description}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Location</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700 font-medium">
                  {data.address}
                </p>
                <p className="text-gray-600">
                  {data.city}, {data.postcode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-semibold mb-3">Contact Agent</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="bg-primary bg-opacity-10 rounded-full p-3 mr-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">{data.agentName}</p>
                <p className="text-gray-600">{data.agentCompany}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-primary mr-2" />
                <a href={`mailto:${data.contactEmail}`} className="text-gray-700 hover:text-primary">
                  {data.contactEmail}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-primary mr-2" />
                <a href={`tel:${data.contactPhone}`} className="text-gray-700 hover:text-primary">
                  {data.contactPhone}
                </a>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a 
                href={`tel:${data.contactPhone}`}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Agent
              </a>
              <a 
                href={`mailto:${data.contactEmail}`}
                className="border border-primary text-primary py-2 px-4 rounded-lg hover:bg-primary hover:bg-opacity-10 transition-colors flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Agent
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPreview;