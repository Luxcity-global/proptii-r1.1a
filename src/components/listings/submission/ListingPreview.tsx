import React, { useState } from 'react';
import { Building2, BedDouble, Bath, Calendar, MapPin } from 'lucide-react';
import { PropertyFormData } from './SubmissionForm';

interface ListingPreviewProps {
  data: PropertyFormData;
  imagePreviews: string[]; // Only need image previews
}

const ListingPreview: React.FC<ListingPreviewProps> = ({ data, imagePreviews }) => {
  // Add state to track the currently selected image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Gallery */}
      <div className="relative">
        {imagePreviews.length > 0 ? (
          <div className="aspect-video bg-gray-100">
            <img
              src={imagePreviews[selectedImageIndex]}
              alt="Property main image"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Image count badge */}
        {imagePreviews.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
            {imagePreviews.length} Photos
          </div>
        )}
      </div>

      {/* Clickable Thumbnail gallery */}
      {imagePreviews.length > 1 && (
        <div className="flex gap-2 p-2 bg-gray-50 overflow-x-auto">
          {imagePreviews.map((preview, index) => (
            <div 
              key={index} 
              className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer transition-all
                ${selectedImageIndex === index ? 'border-primary' : 'border-gray-200 opacity-80 hover:opacity-100'}`}
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
            <p className="text-gray-600 mt-1">{data.address}, {data.city}, {data.postcode}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatPrice(data.price)}</p>
            <p className="text-gray-600 text-sm">
              {data.type === 'rent' ? 'per month' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 py-4 border-y border-gray-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">
              {data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">
              {data.bedrooms} {data.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">
              {data.bathrooms} {data.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
            </span>
          </div>
          {data.isAvailableNow && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Available Now</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">About This Property</h2>
          <p className="text-gray-700 whitespace-pre-line">{data.description}</p>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Location</h2>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <p className="text-gray-700">
              {data.address}, {data.city}, {data.postcode}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-semibold mb-3">Contact Agent</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{data.agentName}</p>
            <p className="text-gray-600">{data.agentCompany}</p>
            <div className="mt-2 space-y-1">
              <p className="text-gray-700">{data.contactEmail}</p>
              <p className="text-gray-700">{data.contactPhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPreview;