import React from 'react';
import { Bed, Bath, Home, MapPin, Calendar, Check } from 'lucide-react';
import { PropertyFormData } from '@/components/listings/submission/SubmissionForm';

interface ListingPreviewProps {
  data: PropertyFormData;
  images: File[];
}

const ListingPreview: React.FC<ListingPreviewProps> = ({ data, images }) => {
  // Generate preview URLs for images
  const imageUrls = images.map(file => URL.createObjectURL(file));

  // Cleanup function to revoke object URLs
  React.useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Carousel */}
      <div className="relative h-64 bg-gray-100">
        {images.length > 0 ? (
          <div className="relative h-full">
            <img
              src={imageUrls[0]}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {images.length} images
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {data.title}
          </h3>
          <div className="text-lg font-bold text-primary whitespace-nowrap ml-2">
            £{data.price.toLocaleString()}
            {data.type === 'rent' && <span className="text-sm font-normal">/month</span>}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">
            {data.address}, {data.city}, {data.postcode}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center text-gray-600">
            <Bed className="h-4 w-4 mr-1" />
            <span>{data.bedrooms} {data.bedrooms === 1 ? 'bed' : 'beds'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Bath className="h-4 w-4 mr-1" />
            <span>{data.bathrooms} {data.bathrooms === 1 ? 'bath' : 'baths'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Home className="h-4 w-4 mr-1" />
            <span className="capitalize">{data.propertyType}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {data.description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            data.type === 'rent' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {data.type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          {data.isAvailableNow && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Available Now
            </span>
          )}
        </div>

        {/* Contact Info */}
        <div className="border-t pt-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium">{data.agentName}</p>
            <p>{data.agentCompany}</p>
            <p>{data.contactEmail}</p>
            <p>{data.contactPhone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPreview; 