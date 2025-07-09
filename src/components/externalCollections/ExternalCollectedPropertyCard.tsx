import React, { useState } from 'react';
import { Bed, Bath, Car, MapPin, ExternalLink, Phone, Mail, Eye } from 'lucide-react';
import { ExternalCollectedProperty } from '../../types/externalCollections';
import FeatureGate from '../common/FeatureGate';
import { EXTERNAL_COLLECTIONS_FEATURES } from '../../config/featureFlags';

interface ExternalCollectedPropertyCardProps {
  property: ExternalCollectedProperty;
  viewMode: 'grid' | 'list';
  onContactAgent: (propertyId: string) => void;
  onViewDetails: (propertyId: string) => void;
}

const ExternalCollectedPropertyCard: React.FC<ExternalCollectedPropertyCardProps> = ({
  property,
  viewMode,
  onContactAgent,
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const getSourceLogo = (source: string) => {
    const logos = {
      rightmove: '/images/rightmove-logo.png',
      zoopla: '/images/zoopla-logo.png',
      openrent: '/images/openrent-logo.png',
      onthemarket: '/images/onthemarket-logo.png',
      mock: '/images/proptii-logo.png'
    };
    return logos[source as keyof typeof logos] || logos.mock;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      rightmove: 'bg-blue-100 text-blue-800',
      zoopla: 'bg-purple-100 text-purple-800',
      openrent: 'bg-green-100 text-green-800',
      onthemarket: 'bg-orange-100 text-orange-800',
      mock: 'bg-gray-100 text-gray-800'
    };
    return colors[source as keyof typeof colors] || colors.mock;
  };

  const formatPrice = (price: ExternalCollectedProperty['price']) => {
    if (price.type === 'rent') {
      return `${price.display}`;
    }
    return price.display;
  };

  const isGrid = viewMode === 'grid';

  return (
    <FeatureGate externalCollectionsFeature={EXTERNAL_COLLECTIONS_FEATURES.ENABLE_RESULTS}>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
        isGrid ? 'h-full' : 'flex'
      }`}>
        {/* Image Section */}
        <div className={`relative ${isGrid ? 'h-48' : 'w-64 h-48'}`}>
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          )}
          
          {!imageError ? (
            <img
              src={property.images[0]?.src || '/images/listings/property-main.jpg'}
              alt={property.images[0]?.alt || property.title}
              className={`w-full h-full object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400">Image unavailable</div>
            </div>
          )}

          {/* Source Badge */}
          <div className="absolute top-2 left-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(property.source)}`}>
              {property.source}
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              property.status === 'available' ? 'bg-green-100 text-green-800' :
              property.status === 'under-offer' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {property.status.replace('-', ' ')}
            </div>
          </div>

          {/* View Details Button */}
          <div className="absolute bottom-2 right-2">
            <button
              onClick={() => onViewDetails?.(property.id)}
              className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
              title="View details"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className={`p-4 ${isGrid ? 'flex-1' : 'flex-1'}`}>
          {/* Header */}
          <div className="mb-3">
            <h3 className={`font-semibold text-gray-900 mb-1 ${
              isGrid ? 'text-lg' : 'text-xl'
            }`}>
              {property.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location.address}, {property.location.city}
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(property.price)}
            </div>
          </div>

          {/* Specifications */}
          <div className="flex items-center gap-4 mb-3 text-gray-600">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span className="text-sm">{property.specifications.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span className="text-sm">{property.specifications.bathrooms}</span>
            </div>
            {property.specifications.parkingSpaces && property.specifications.parkingSpaces > 0 && (
              <div className="flex items-center gap-1">
                <Car className="w-4 h-4" />
                <span className="text-sm">{property.specifications.parkingSpaces}</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {property.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
              {property.features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{property.features.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Agent Info */}
          <div className="border-t pt-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{property.agent.name}</p>
                <p className="text-xs text-gray-600">{property.agent.company}</p>
              </div>
              <img
                src={getSourceLogo(property.source)}
                alt={`${property.source} logo`}
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <FeatureGate externalCollectionsFeature={EXTERNAL_COLLECTIONS_FEATURES.ENABLE_CONTACT}>
              <button
                onClick={() => onContactAgent?.(property.id)}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Contact Agent
              </button>
            </FeatureGate>
            
            {property.propertyUrl && (
              <a
                href={property.propertyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default ExternalCollectedPropertyCard; 