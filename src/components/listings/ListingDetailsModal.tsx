import React, { useState, useEffect } from 'react';
import { X, MapPin, BedDouble, Bath, Square, Phone, MessageSquare, Building2, ChevronLeft, ChevronRight, Check, Loader2, Droplets, ShieldAlert, Zap, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMessagingContext } from '../../contexts/MessagingContext';
import communicationService from '../../services/communicationService';
import QuickRequestModal from '../enquiry/QuickRequestModal';
import { api } from '../../services/api';

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
  /** E.164-normalised phone number derived from agent.phone on the backend. */
  phone?: string;
  /** Landlord user ID, used to initiate a conversation. */
  landlordId?: string;
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
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [showUnclaimedConfirm, setShowUnclaimedConfirm] = useState(false);
  const [showQuickRequestModal, setShowQuickRequestModal] = useState(false);
  const isScrapedProperty = !property.landlordId && !!property.agent?.email;

  const [reportData, setReportData] = useState<any>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const { setActiveConversationId } = useMessagingContext();

  const handleMessageClick = async () => {
    setMessageError(null);

    if (!isAuthenticated || !user) {
      setShowQuickRequestModal(true);
      return;
    }

    if (!property.landlordId && !property.agent?.email) {
      setMessageError('Unable to message: contact information unavailable.');
      return;
    }

    // For scraped/unclaimed properties, show a confirmation notice before creating the shadow conversation
    if (isScrapedProperty && !showUnclaimedConfirm) {
      setShowUnclaimedConfirm(true);
      return;
    }

    await createConversationAndNavigate();
  };

  const createConversationAndNavigate = async () => {
    setIsMessaging(true);
    try {
      const landlordId = property.landlordId || 'UNCLAIMED';
      const isScrapedProperty = !property.landlordId;
      const agentEmail = isScrapedProperty ? property.agent?.email : undefined;
      const propertyTitle = property.title;
      const tenantName = (user as any)?.name || (user as any)?.displayName || user?.email || '';

      // Note: ListingDetailsModal shows native (Proptii-listed) properties.
      // Native properties always have a landlordId set, so isScrapedProperty
      // will be false here in normal usage. No snapshot is needed.
      const conversation = await communicationService.getOrCreateConversation({
        propertyId: property.id,
        tenantId: user!.id,
        landlordId,
        agentEmail,
        propertyTitle,
        tenantName,
      });
      setActiveConversationId(conversation.id);
      onClose();
      navigate('/dashboard/messages', {
        state: {
          prefilledMessage: !isScrapedProperty ? 'I want to make enquiries concerning this property' : undefined,
          conversationId: conversation.id,
          conversation
        }
      });
    } catch {
      setMessageError('Failed to start conversation. Please try again.');
    } finally {
      setIsMessaging(false);
    }
  };

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

  useEffect(() => {
    let mounted = true;
    
    const fetchReport = async () => {
      setIsReportLoading(true);
      setReportError(null);
      try {
        const hasPostcode = !!property.location.postcode;
        const hasCoordinates = property.location.coordinates && property.location.coordinates[0] !== 0;

        if (!hasPostcode && !hasCoordinates) {
          setReportError('No postcode or valid coordinates available to generate the area report.');
          setIsReportLoading(false);
          return;
        }

        const response = await api.getPropertyReport(property.id, {
          display: property.location.address,
          postcode: property.location.postcode,
          coordinates: hasCoordinates 
            ? { lat: property.location.coordinates[0], lng: property.location.coordinates[1] } 
            : undefined
        }, (chunkData) => {
          if (mounted) {
            setReportData({ ...chunkData });
          }
        });
        
        if (mounted && response.success) {
          // The final data is also set here for completeness
          setReportData(response.data);
        } else if (mounted && !response.success) {
          setReportError(response.error || 'Failed to load report');
        }
      } catch (err) {
        if (mounted) setReportError('Failed to load property report');
      } finally {
        if (mounted) setIsReportLoading(false);
      }
    };

    fetchReport();

    return () => { mounted = false; };
  }, [property.id, property.location.postcode]);

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
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${property.type === 'rent'
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
                className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all ${currentImageIndex === index
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
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center relative">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(property.location.address)}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0"
                  title="Property Location Map"
                />
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

          {/* Proptii Renter Report */}
          <div className="mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-1 flex items-center text-gray-900">
                Your Proptii Report <span className="ml-3 text-xs bg-[#136C9E] text-white px-3 py-1 rounded-full font-medium">Renter Report</span>
              </h3>
              <p className="text-sm text-gray-500 pb-4 border-b border-gray-200">
                Correct as of {new Date().toLocaleDateString('en-GB')} · Location checks use the postcode area, not the building footprint. UPRN / title register pending.
              </p>
            </div>
            
            {isReportLoading ? (
              <div className="bg-gray-50 p-8 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-gray-600 font-medium">Generating live property facts...</p>
                <p className="text-gray-400 text-sm mt-2">Checking EPC, Crime, and Flood Risk data.</p>
              </div>
            ) : reportError ? (
              <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p>{reportError}</p>
              </div>
            ) : reportData && reportData.sources ? (
              <div className="space-y-6">
                
                {/* What to Watch */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-900 flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[#F15A22]" /> What to watch
                  </h4>
                  <p className="text-sm text-orange-800">
                    Title register and restrictive covenants are not yet verified. Please review the local area flood and crime data below carefully.
                  </p>
                </div>

                {/* Local Area Trio */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Local Area Intelligence</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* EPC Register */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full hover:border-[#136C9E] transition-colors">
                      <div className="flex items-center mb-3">
                        <Zap className="w-5 h-5 text-[#F15A22] mr-2" />
                        <h4 className="font-medium text-gray-900">EPC Rating</h4>
                      </div>
                      <div className="mt-auto">
                        {reportData.sources.find((s: any) => s.id === 'epc')?.state === 'loading' ? (
                          <div className="flex items-center text-gray-400 text-sm py-1">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#136C9E]" />
                            <span>Checking EPC...</span>
                          </div>
                        ) : reportData.sources.find((s: any) => s.id === 'epc')?.state === 'clear' ? (
                          <div>
                            <span className="text-3xl font-bold text-gray-800">{reportData.partB?.epcBand || '?'}</span>
                            <p className="text-sm text-gray-500 mt-1">Floor Area: {reportData.partB?.floorAreaM2}m²</p>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 text-sm">
                            <Info className="w-4 h-4 mr-1" />
                            <span>Data unresolved</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flood Risk */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full hover:border-[#136C9E] transition-colors">
                      <div className="flex items-center mb-3">
                        <Droplets className="w-5 h-5 text-[#136C9E] mr-2" />
                        <h4 className="font-medium text-gray-900">Flood Risk</h4>
                      </div>
                      <div className="mt-auto">
                        {reportData.sources.find((s: any) => s.id === 'flood')?.state === 'loading' ? (
                          <div className="flex items-center text-gray-400 text-sm py-1">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#136C9E]" />
                            <span>Checking flood risk...</span>
                          </div>
                        ) : reportData.sources.find((s: any) => s.id === 'flood')?.state === 'clear' ? (
                          <div>
                            <span className="text-lg font-bold text-gray-800">{reportData.local?.flood?.headline || 'Unknown'}</span>
                            <p className="text-sm text-gray-500 mt-1">{reportData.local?.flood?.caveat}</p>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 text-sm">
                            <Info className="w-4 h-4 mr-1" />
                            <span>Data unresolved</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Crime (Police.uk) */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full hover:border-[#136C9E] transition-colors">
                      <div className="flex items-center mb-3">
                        <ShieldAlert className="w-5 h-5 text-purple-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Local Crime</h4>
                      </div>
                      <div className="mt-auto">
                        {reportData.sources.find((s: any) => s.id === 'crime')?.state === 'loading' ? (
                          <div className="flex items-center text-purple-600 text-sm py-1">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-purple-600" />
                            <span>Analyzing police records...</span>
                          </div>
                        ) : reportData.sources.find((s: any) => s.id === 'crime')?.state === 'clear' ? (
                          <div>
                            <span className="text-lg font-bold text-gray-800">{reportData.local?.crime?.count} incidents</span>
                            <p className="text-sm text-gray-500 mt-1 uppercase">in {reportData.local?.crime?.month}</p>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 text-sm">
                            <Info className="w-4 h-4 mr-1" />
                            <span>Data unresolved</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Part C Strip */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50">
                  <span className="text-gray-900 font-medium mb-1">Restrictive Covenants & Title</span>
                  <span className="text-gray-500 text-sm">To come in next release</span>
                </div>

                {/* Paid Placeholder */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50">
                  <span className="text-gray-500 text-sm text-center">Deeper legal, compliance & professional checks — paid, coming later in this journey.</span>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400 leading-relaxed max-w-2xl mx-auto">
                    Generated for a prospective renter. Not a substitute for legal advice. 
                    Location checks are postcode-area, not the building footprint. Contains public sector information licensed under the Open Government Licence v3.0, Environment Agency, and Historic England data.
                  </p>
                </div>
              </div>
            ) : null}
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

            <div className="grid grid-cols-2 gap-4">
              {property.phone ? (
                <a
                  href={`tel:${property.phone}`}
                  className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Agent</span>
                </a>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  title="Phone number unavailable"
                  className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-400 py-3 px-4 rounded-lg cursor-not-allowed opacity-70"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Agent</span>
                </button>
              )}
              <button
                onClick={handleMessageClick}
                disabled={isMessaging}
                aria-disabled={isMessaging}
                title={messageError ?? 'Message agent'}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${isMessaging
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
              >
                {isMessaging ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
                <span>Message</span>
              </button>
            </div>
            {messageError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                {messageError}
              </div>
            )}
            {showUnclaimedConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
                  <div className="flex items-center gap-3 text-amber-600 mb-3">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-bold text-gray-900">External Agent</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    This agent hasn't joined Proptii yet. Your message will be <strong>forwarded via email</strong> to them directly.
                    If they join, you'll see their reply in your Messages dashboard.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={createConversationAndNavigate}
                      disabled={isMessaging}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isMessaging ? 'Sending…' : 'Send Anyway'}
                    </button>
                    <button
                      onClick={() => setShowUnclaimedConfirm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <QuickRequestModal
              isOpen={showQuickRequestModal}
              onClose={() => setShowQuickRequestModal(false)}
              listingId={property.id}
              listingTitle={property.title}
              listingSource={property.landlordId ? 'native' : 'scraped'}
              landlordId={property.landlordId}
              agentEmail={property.agent?.email}
              agentName={property.agent?.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsModal; 