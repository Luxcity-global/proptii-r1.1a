import React, { useState, useEffect } from 'react';
import { X, MapPin, BedDouble, Bath, Square, Phone, Mail, MessageCircle, Building2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { ProptiiModule } from '../proptii/ProptiiModule';
import { ReportDiagnostic } from '../report/ReportDiagnostic';
import { ProptiiReportModal } from '../report/ProptiiReportModal';
import { FactsOnlyExportModal } from '../export/FactsOnlyExportModal';
import { DisclosureRecordModal } from '../export/DisclosureRecordModal';
import { AudienceLens } from '../../data/audienceLensCopy';

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

interface ListingDetailsModalProps {
  property: Property;
  onClose: () => void;
  initialImageIndex?: number;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  property,
  onClose,
  initialImageIndex = 0,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [showMap, setShowMap] = useState(false);
  const [activeAudience, setActiveAudience] = useState<AudienceLens>('tenant');
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFactsExportOpen, setIsFactsExportOpen] = useState(false);
  const [isDisclosureExportOpen, setIsDisclosureExportOpen] = useState(false);

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

  const handleOpenReport = (lens: AudienceLens) => {
    setActiveAudience(lens);
    setIsDiagnosticRunning(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 font-nunito">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="relative p-2">
            {/* Image Carousel */}
            <div className="relative h-[30rem] rounded-2xl overflow-hidden">
              <img
                src={property.images[currentImageIndex]}
                alt={`Property view ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  property.type === 'rent' 
                    ? 'bg-[#136C9E] text-white shadow-md' 
                    : 'bg-purple-600 text-white shadow-md'
                }`}>
                  {property.type === 'rent' ? 'To Rent' : 'For Sale'}
                </span>
                {property.isAvailableNow && (
                  <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                    Available Now
                  </span>
                )}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => navigateImages('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateImages('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex justify-center gap-2 px-4 mt-3">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all ${
                    currentImageIndex === index
                      ? 'ring-2 ring-[#136C9E] ring-offset-2 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-archivo">{property.title}</h2>
                <div className="flex items-center text-gray-500 text-xs mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  <span>{property.location.address}</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#F15A22]">
                {formatPrice(property.price)}
                <span className="text-xs text-gray-500 font-normal">
                  {property.type === 'rent' ? ' pcm' : ''}
                </span>
              </p>
            </div>

            {/* Sprint 3.1: Embedded Promoted Proptii Module */}
            <div className="my-6">
              <ProptiiModule
                propertyTitle={property.title}
                propertyAddress={property.location.address}
                price={property.price}
                currentAudience={activeAudience}
                onOpenReport={handleOpenReport}
              />
            </div>

            {/* Property Features */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 font-archivo">
                Property Features & Key Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <ul className="space-y-2">
                    {property.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs text-gray-700">
                        <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <ul className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-center">
                      <BedDouble className="w-4 h-4 text-gray-500 mr-2" />
                      <strong>{property.bedrooms}</strong>&nbsp;Bedrooms
                    </li>
                    <li className="flex items-center">
                      <Bath className="w-4 h-4 text-gray-500 mr-2" />
                      <strong>{property.bathrooms}</strong>&nbsp;Bathrooms
                    </li>
                    <li className="flex items-center">
                      <Square className="w-4 h-4 text-gray-500 mr-2" />
                      <strong>800</strong>&nbsp;sq ft approx.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Agent block */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm font-archivo">{property.agent.company}</p>
                  <p className="text-xs text-gray-500">Contact: {property.agent.name}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-[#136C9E] text-white text-xs font-bold rounded-full hover:bg-[#0d4f74] shadow-md">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-200">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sprint 3.2: Report Diagnostic Screen */}
      {isDiagnosticRunning && (
        <ReportDiagnostic
          propertyTitle={property.title}
          audienceLens={activeAudience}
          onComplete={() => {
            setIsDiagnosticRunning(false);
            setIsReportModalOpen(true);
          }}
          onCancel={() => setIsDiagnosticRunning(false)}
        />
      )}

      {/* Sprint 3.2: Proptii Report Modal */}
      {isReportModalOpen && (
        <ProptiiReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          propertyTitle={property.title}
          propertyAddress={property.location.address}
          price={property.price}
          initialAudience={activeAudience}
          onOpenFactsExport={() => setIsFactsExportOpen(true)}
          onOpenDisclosureExport={() => setIsDisclosureExportOpen(true)}
        />
      )}

      {/* Sprint 3.3: Facts-Only Export Modal */}
      {isFactsExportOpen && (
        <FactsOnlyExportModal
          isOpen={isFactsExportOpen}
          onClose={() => setIsFactsExportOpen(false)}
          propertyTitle={property.title}
          propertyAddress={property.location.address}
          price={property.price}
        />
      )}

      {/* Sprint 3.3: Disclosure Record Modal */}
      {isDisclosureExportOpen && (
        <DisclosureRecordModal
          isOpen={isDisclosureExportOpen}
          onClose={() => setIsDisclosureExportOpen(false)}
          propertyTitle={property.title}
          propertyAddress={property.location.address}
          price={property.price}
        />
      )}
    </>
  );
};

export default ListingDetailsModal;