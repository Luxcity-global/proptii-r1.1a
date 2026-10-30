import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Car,
  Loader2,
  MessageSquare,
  PawPrint,
  Sparkles,
  Trees,
  X as XIcon,
  Zap,
} from 'lucide-react';
import { useSearchBackend, type Property } from '../hooks/useSearchBackend';
import { useSavedProperties } from '../contexts/SavedPropertiesContext';
import { useGovDataLayer } from '../contexts/GovDataLayerContext';
import { useBatchedPropertyFacts } from '../hooks/useBatchedPropertyFacts';
import { useClassifyQuery } from '../hooks/useClassifyQuery';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { SearchFilterBar } from '../components/search/SearchFilterBar';
import Footer from '../components/Footer';
import { SearchLoadingAnimation } from '../components/SearchLoadingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { useMessagingContext } from '../contexts/MessagingContext';
import communicationService from '../services/communicationService';
import QuickRequestModal from '../components/enquiry/QuickRequestModal';
import { SearchMap } from '../components/search/SearchMap';
import { SearchResultsList } from '../components/search/SearchResultsList';
import { LocationInsights, extractLocationLabel } from '../components/search/LocationInsights';
import { PropertyDetailsModal } from '../components/search/PropertyDetailsModal';
import { SearchPageHeader, type SortOption } from '../components/search/SearchPageHeader';
import '../styles/searchResults.css';

const parsePriceValue = (price: string): number => {
  if (!price) return 0;
  const match = price.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const rawSearchTypeParam = searchParams.get('type');
  const searchTypeParam =
    rawSearchTypeParam === 'proptii' || rawSearchTypeParam === 'onthemarket'
      ? rawSearchTypeParam
      : 'onthemarket';
  const searchType = searchTypeParam as 'onthemarket' | 'proptii';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isNavigatingToBooking, setIsNavigatingToBooking] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'booking' | 'chat'>('booking');
  const [quickRequestProperty, setQuickRequestProperty] = useState<Property | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchSaved, setSearchSaved] = useState(false);
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const [sortOption, setSortOption] = useState<SortOption>('Relevance');
  const { isPropertySaved, toggleSaveProperty } = useSavedProperties();
  const { isAuthenticated, user, login } = useAuth();
  const { setActiveConversationId } = useMessagingContext();
  const { enabled: govDataEnabled, audience, setAudience } = useGovDataLayer();
  const {
    results: rawResults,
    isLoading,
    error,
    searchProperties,
    resolvedLocation,
    clearCache,
  } = useSearchBackend();

  const results = useMemo(() => (Array.isArray(rawResults) ? rawResults : []), [rawResults]);

  const { classification, isClassifying } = useClassifyQuery({
    enabled: Boolean(searchQuery.trim().length >= 2),
    query: searchQuery,
  });

  const {
    filters,
    setPriceRange,
    toggleBedroom,
    setBedrooms,
    togglePropertyType,
    setFurnishing,
    toggleParking,
    toggleBalconyOrGarden,
    setSortBy,
    resetFilters,
    removeFilter,
    filteredProperties,
    counts: filterCounts,
  } = usePropertyFilters(results, classification?.entities);

  const [showMap, setShowMap] = useState(false);

  const { getFlagsFor, getHintFor, isFactsLoading, isUnresolved } = useBatchedPropertyFacts(
    Boolean(govDataEnabled),
    results
  );

  useEffect(() => {
    if (searchQuery) {
      searchProperties(searchQuery, searchType);
    }
  }, [searchQuery, searchType, searchProperties]);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const locationLabel = extractLocationLabel(searchQuery);
  const isCached = Boolean(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('searchResults')
  );

  const displayedResults = useMemo(() => {
    const list = [...filteredProperties];
    if (sortOption === 'Price (low)') {
      list.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
    } else if (sortOption === 'Price (high)') {
      list.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
    }
    return list;
  }, [filteredProperties, sortOption]);

  const notify = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  const handleSubmitSearch = () => {
    const nextQuery = draftQuery.trim();
    if (!nextQuery) return;
    clearCache();
    const typeParam = rawSearchTypeParam ? `&type=${encodeURIComponent(rawSearchTypeParam)}` : '';
    navigate(`/search?q=${encodeURIComponent(nextQuery)}${typeParam}`);
  };

  const handleApplyFilters = useCallback(
    (nextQuery: string, matchCount: number) => {
      setDraftQuery(nextQuery);
      clearCache();
      const typeParam = rawSearchTypeParam ? `&type=${encodeURIComponent(rawSearchTypeParam)}` : '';
      navigate(`/search?q=${encodeURIComponent(nextQuery)}${typeParam}`);
      notify(`Showing ${matchCount} ${matchCount === 1 ? 'property' : 'properties'} matching all filters`);
    },
    [clearCache, navigate, rawSearchTypeParam]
  );

  const handleSaveSearch = () => {
    if (!searchQuery.trim()) return;
    const localStorageService = LocalStorageService.getInstance();
    const historyKey = 'search_history';
    const history = localStorageService.get<string[]>(historyKey) || [];
    const nextHistory = [searchQuery, ...history.filter((q) => q !== searchQuery)].slice(0, 10);
    localStorageService.set(historyKey, nextHistory);
    setSearchSaved(true);
    notify('Saved search to your proptii account');
  };

  const openModal = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleBookViewingClick = async (property: Property) => {
    if (!isAuthenticated) {
      setLoginPromptAction('booking');
      setIsLoginPromptOpen(true);
      return;
    }

    setIsNavigatingToBooking(true);
    const propertyData = {
      id: property.title || `property-${Date.now()}`,
      street: property.street || property.location?.split(',')[0]?.trim() || property.location || '',
      town: property.town || property.location?.split(',')[1]?.trim() || '',
      city: property.city || property.location?.split(',')[0]?.trim() || property.location || '',
      postcode: property.postcode || property.location?.split(',')[2]?.trim() || '',
      title: property.title,
      description: property.description,
      imageUrls: property.imageUrls || [],
      agent: {
        id: property.agent?.id || property.agent?.name || `agent-${Date.now()}`,
        name: property.agent?.name || property.source || 'Estate Agent',
        email: property.agent?.email || '',
        phone: property.agent?.phone || '',
        company: property.agent?.company || property.source || 'Estate Agency',
      },
    };

    sessionStorage.setItem('prefilledProperty', JSON.stringify(propertyData));
    await new Promise((resolve) => setTimeout(resolve, 600));
    navigate('/dashboard/viewings', {
      state: { openBookingModal: true, prefilledProperty: propertyData },
    });
  };

  const handleChatClick = async (property: Property) => {
    if (!isAuthenticated || !user) {
      setQuickRequestProperty(property);
      return;
    }

    setChatError(null);
    setIsChatLoading(true);

    try {
      const landlordId = property.agent?.id || 'UNCLAIMED';
      const isUnclaimed = !property.agent?.id;
      const agentEmail = isUnclaimed ? property.agent?.email || undefined : undefined;

      const conversation = await communicationService.getOrCreateConversation({
        propertyId:
          property.id ||
          property.url ||
          `scraped-${encodeURIComponent(property.title || Date.now().toString())}`,
        tenantId: user.id,
        landlordId,
        agentEmail,
        propertyTitle: property.title,
        tenantName: user.name || user.email,
        scrapedPropertySnapshot: isUnclaimed
          ? {
              url: property.url || '',
              title: property.title,
              location: property.location,
              price: property.price,
              bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : undefined,
              bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : undefined,
              propertyType: property.propertyType,
              imageUrls: property.imageUrls,
              agent: {
                name: property.agent?.name,
                email: property.agent?.email || '',
                website: property.agent?.website,
              },
            }
          : undefined,
      });

      setActiveConversationId(conversation.id);
      setIsModalOpen(false);
      setSelectedProperty(null);

      navigate('/dashboard/messages', {
        state: {
          conversationId: conversation.id,
          conversation,
          prefilledMessage: 'I would like to enquire about this property.',
        },
      });
    } catch {
      setChatError('Could not start a conversation. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const headerProps = {
    searchQuery,
    draftQuery,
    onDraftQueryChange: setDraftQuery,
    onSubmitSearch: handleSubmitSearch,
    onSaveSearch: handleSaveSearch,
    searchSaved,
    resultsCount: displayedResults.length,
    locationLabel,
    isCached,
    isLoading,
    onRefresh: () => searchProperties(searchQuery, searchType),
    showMap,
    onToggleMap: () => {
      setShowMap((prev) => {
        const next = !prev;
        if (next) {
          setTimeout(() => {
            document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        return next;
      });
    },
    sortOption,
    onSortChange: setSortOption,
    classificationEntities: classification?.entities,
    isClassifying,
    results,
    onApplyFilters: handleApplyFilters,
  };

  if (isLoading && results.length === 0) {
    return (
      <div className="sr-page">
        <SearchPageHeader {...headerProps} showMeta={false} />
        <div className="flex-1 flex">
          <SearchLoadingAnimation query={searchQuery} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error && results.length === 0) {
    const isNetworkError =
      error.includes('Network connection') ||
      error.includes('Failed to fetch') ||
      error.includes('ERR_CONNECTION_REFUSED') ||
      error.includes('timeout') ||
      error.includes('connect') ||
      error.includes('500') ||
      error.includes('Internal Server') ||
      error.includes('503') ||
      error.includes('502');

    const isFormatError =
      !isNetworkError &&
      (error.toLowerCase().includes('format') ||
        error.toLowerCase().includes('invalid query') ||
        error.toLowerCase().includes('enter a search query'));

    return (
      <div className="sr-page">
        <SearchPageHeader {...headerProps} showMeta={false} />
        <div className="flex-1 sr-main">
          <div className="sr-inner sr-empty">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#136C9E]/10 to-[#E65D24]/10 flex items-center justify-center shadow-sm">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 text-[#136C9E]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h2 className="mt-6 text-2xl sm:text-4xl font-bold" style={{ color: '#23272f' }}>
                {isFormatError
                  ? 'Please Use the Correct Search Format'
                  : isNetworkError
                  ? 'Search Service Unavailable'
                  : 'No Results Found'}
              </h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                {isFormatError
                  ? "We couldn't process your search. Please try using a clear property search format with location, bedrooms, and property type."
                  : isNetworkError
                  ? error
                  : "We couldn't find properties matching your search right now. Try refining your search or try again in a moment."}
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={() => {
                  clearCache();
                  navigate(`/?q=${encodeURIComponent(searchQuery)}&type=proptii`);
                }}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-md"
              >
                Start New Search
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="sr-page">
      <SearchPageHeader {...headerProps} />

      <div className="sr-main">
        <div className="sr-inner">
          {results.length > 0 && (
            <div className="mb-8">
              <SearchFilterBar
                filters={filters}
                counts={filterCounts}
                setPriceRange={setPriceRange}
                toggleBedroom={toggleBedroom}
                setBedrooms={setBedrooms}
                togglePropertyType={togglePropertyType}
                setFurnishing={setFurnishing}
                toggleParking={toggleParking}
                toggleBalconyOrGarden={toggleBalconyOrGarden}
                setSortBy={setSortBy}
                resetFilters={resetFilters}
                removeFilter={removeFilter}
              />
            </div>
          )}

          {results.length === 0 ? (
            <div className="py-16 sm:py-20 text-center">
              <h2 className="text-2xl font-bold text-gray-800">No Properties Found</h2>
              <p className="mt-2 text-gray-600">Try broadening your search criteria or adjusting your filters.</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-16 sm:py-20">
              <div className="max-w-xl mx-auto px-4 text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  No Properties Match Your Active Filters
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We found {results.length} {results.length === 1 ? 'property' : 'properties'} for this search, but none match your current filter criteria.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-sm text-sm"
                  >
                    Clear All Filters & Show All {results.length} Properties
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showMap && (
                <div className="sr-map-collapse">
                  <div className="sr-map-intel">
                    <SearchMap
                      showMap={showMap}
                      properties={filteredProperties}
                      searchQuery={searchQuery}
                      locationLabel={locationLabel}
                      resolvedLocation={resolvedLocation}
                      onPropertySelect={openModal}
                    />
                    <LocationInsights searchQuery={searchQuery} propertyCount={results.length} />
                  </div>
                </div>
              )}

              <SearchResultsList
                properties={displayedResults}
                selectedProperty={selectedProperty}
                onSelectProperty={openModal}
                isPropertySaved={(id) => isPropertySaved(id)}
                onToggleSave={(prop) => {
                  const pid = `${prop.title}-${prop.location}-${prop.price}`;
                  const wasSaved = isPropertySaved(pid);
                  toggleSaveProperty(prop);
                  notify(wasSaved ? 'Property removed from saved' : 'Saved to your favourites');
                }}
                govDataEnabled={govDataEnabled}
                getFlagsFor={getFlagsFor}
                isFactsLoading={isFactsLoading}
                isUnresolved={isUnresolved}
                getHintFor={getHintFor}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>

      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
        onBookClick={handleBookViewingClick}
        onChatClick={handleChatClick}
        isNavigatingToBooking={isNavigatingToBooking}
        isChatLoading={isChatLoading}
        chatError={chatError}
        isAuthenticated={isAuthenticated}
        govDataEnabled={govDataEnabled}
        audience={audience}
        onAudienceChange={setAudience}
      />

      {isLoginPromptOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLoginPromptOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl border border-gray-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLoginPromptOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#136C9E] flex items-center justify-center mb-5">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              {loginPromptAction === 'chat' ? 'Sign in to chat with the agent' : 'Sign in to book a viewing'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Create a free account to message agents directly and track your property applications in one place.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoginPromptOpen(false);
                void login();
              }}
              className="w-full py-3 px-6 rounded-full bg-[#F15A22] text-white font-bold text-sm"
            >
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {quickRequestProperty && (
        <QuickRequestModal
          isOpen={Boolean(quickRequestProperty)}
          onClose={() => setQuickRequestProperty(null)}
          listingId={quickRequestProperty.url || quickRequestProperty.title || `property-${Date.now()}`}
          listingTitle={quickRequestProperty.title}
          listingSource={quickRequestProperty.agent?.id ? 'native' : 'scraped'}
          landlordId={quickRequestProperty.agent?.id}
          agentEmail={quickRequestProperty.agent?.email}
          agentName={quickRequestProperty.agent?.name}
          sourcePlatform={quickRequestProperty.source}
        />
      )}

      {showToast && (
        <div className="sr-toast">
          <span className="sr-toast-dot" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setShowToast(false)} aria-label="Dismiss notification">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SearchResults;
