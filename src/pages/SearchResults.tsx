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
  type LucideIcon,
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

const LOCATION_PIN_PATH =
  'M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9a2 2 0 100-4 2 2 0 000 4z';

const EXAMPLE_SEARCHES = [
  { label: '2 bedroom flats in London', query: '2 bedroom flats to rent in London' },
  { label: '3 bed house in Manchester', query: '3 bedroom house to rent in Manchester' },
  { label: '1 bed apartment in Leeds', query: '1 bedroom apartment to rent in Leeds' },
  { label: 'Studio in Birmingham', query: 'studio flat to rent in Birmingham' },
  { label: 'Properties under £1500', query: 'properties to rent in London under 1500pcm' },
];

const GUIDANCE_TONES = {
  blue: 'bg-[#136C9E]/10 text-[#136C9E]',
  orange: 'bg-[#E65D24]/10 text-[#E65D24]',
  green: 'bg-green-100 text-green-700',
} as const;

const GuidanceCard: React.FC<{
  tone: keyof typeof GUIDANCE_TONES;
  iconPath: string;
  title: string;
  body: string;
}> = ({ tone, iconPath, title, body }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
    <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 ${GUIDANCE_TONES[tone]}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
    </div>
    <h3 className="font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">{body}</p>
  </div>
);

const REMOVE_FILTER_TONES = {
  gray: { button: 'bg-gray-100 text-gray-700 hover:bg-gray-200', icon: 'text-gray-500', close: 'text-gray-500' },
  amber: { button: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100', icon: 'text-amber-700', close: 'text-amber-600' },
  blue: { button: 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100', icon: 'text-blue-700', close: 'text-blue-600' },
  teal: { button: 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100', icon: 'text-teal-700', close: 'text-teal-600' },
  indigo: { button: 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100', icon: 'text-indigo-700', close: 'text-indigo-600' },
} as const;

const RemoveFilterButton: React.FC<{
  onClick: () => void;
  tone?: keyof typeof REMOVE_FILTER_TONES;
  icon?: LucideIcon;
  children: React.ReactNode;
}> = ({ onClick, tone = 'gray', icon: Icon, children }) => {
  const styles = REMOVE_FILTER_TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${styles.button}`}
    >
      {Icon && <Icon className={`w-3.5 h-3.5 ${styles.icon}`} aria-hidden />}
      <span>{children}</span>
      <XIcon className={`w-3.5 h-3.5 ${styles.close}`} aria-hidden />
    </button>
  );
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
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const urlBeds = searchParams.get('beds');
  const urlMinPrice = searchParams.get('minPrice');
  const urlMaxPrice = searchParams.get('maxPrice');
  const urlTypes = searchParams.get('types');
  const urlTenure = searchParams.get('tenure');
  const classifiedLocation = classification?.entities?.location;

  const macroFilters = useMemo(() => {
    const f: Record<string, any> = {};
    if (urlBeds && urlBeds !== 'any') {
      const bedList = urlBeds.split(',').map((b) => parseInt(b, 10)).filter(Number.isFinite);
      if (bedList.length === 1) {
        f.minBeds = bedList[0];
        f.maxBeds = bedList[0];
        f.bedrooms = bedList[0];
      } else if (bedList.length > 1) {
        f.minBeds = Math.min(...bedList);
        f.maxBeds = Math.max(...bedList);
      }
    }
    if (urlMinPrice) f.minPrice = parseInt(urlMinPrice, 10);
    if (urlMaxPrice) f.maxPrice = parseInt(urlMaxPrice, 10);
    if (urlTypes) f.propertyType = urlTypes.split(',')[0];
    if (urlTenure) f.channel = urlTenure;
    if (classifiedLocation) f.location = classifiedLocation;
    return f;
  }, [urlBeds, urlMinPrice, urlMaxPrice, urlTypes, urlTenure, classifiedLocation]);

  // Must match the macroSignature format written to sessionStorage by useSearchBackend.
  const macroSignature = useMemo(
    () =>
      `${searchQuery.trim().toLowerCase()}|${searchTypeParam}|beds:${urlBeds || ''}|minP:${urlMinPrice || ''}|maxP:${urlMaxPrice || ''}|types:${urlTypes || ''}|tenure:${urlTenure || ''}|loc:${classifiedLocation || ''}`,
    [searchQuery, searchTypeParam, urlBeds, urlMinPrice, urlMaxPrice, urlTypes, urlTenure, classifiedLocation]
  );

  const lastExecutedMacroSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!searchQuery) return;
    if (lastExecutedMacroSigRef.current === macroSignature) return;

    const timer = setTimeout(() => {
      lastExecutedMacroSigRef.current = macroSignature;

      const cachedData = sessionStorage.getItem('searchResults');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (
            parsed.query?.toLowerCase() === searchQuery.toLowerCase() &&
            parsed.searchType === searchTypeParam &&
            parsed.macroSignature === macroSignature &&
            Array.isArray(parsed.results) &&
            parsed.results.length > 0
          ) {
            return;
          }
        } catch {
          // fall through to a fresh search
        }
      }

      searchProperties(searchQuery, searchType, macroFilters);
    }, 450);

    return () => clearTimeout(timer);
  }, [macroSignature, searchQuery, searchTypeParam, searchType, macroFilters, searchProperties]);

  const queryLocationMatch = searchQuery.match(/\b(?:in|at|near)\s+([A-Za-z\s,]+)/i);
  const queryLocation = (queryLocationMatch?.[1]?.trim() || '').replace(/\s{2,}/g, ' ');
  const hasQueryLocation = Boolean(queryLocation);
  const popularSearchLocation = hasQueryLocation ? queryLocation : 'London';
  const popularSearches = [
    { label: '1 Bed Apartments', query: `1 bedroom apartments to rent in ${popularSearchLocation}` },
    { label: '2 Bed Houses', query: `2 bedroom houses to rent in ${popularSearchLocation}` },
    { label: 'Studio Flats', query: `studio flats to rent in ${popularSearchLocation}` },
    { label: 'Properties under £1500', query: `properties to rent in ${popularSearchLocation} under 1500pcm` },
    { label: 'Central London', query: 'properties to rent in Central London' },
    { label: 'Pet-Friendly', query: `pet friendly properties to rent in ${popularSearchLocation}` },
  ];

  const runSuggestedSearch = (query: string) => {
    clearCache();
    navigate(`/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(searchType)}`);
  };

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

            {isFormatError && (
              <>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GuidanceCard
                    tone="blue"
                    iconPath="M4 6h16M4 12h10M4 18h16"
                    title="Include Property Details"
                    body="Specify bedrooms, property type (flat, house, apartment), and location in your search."
                  />
                  <GuidanceCard
                    tone="orange"
                    iconPath={LOCATION_PIN_PATH}
                    title="Add a Location"
                    body={'Always include a location like "in London", "in Manchester", or "in Leeds" to get relevant results.'}
                  />
                  <GuidanceCard
                    tone="green"
                    iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    title="Use Natural Language"
                    body={'Write your search like you\'re talking: "2 bedroom flats to rent in London" works perfectly.'}
                  />
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-center text-sm text-gray-500 mb-4">Try these example searches:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXAMPLE_SEARCHES.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => runSuggestedSearch(chip.query)}
                        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isNetworkError && (
              <>
                <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Troubleshooting Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    {[
                      'Check your internet connection and try again',
                      'Refresh the page or wait a moment and retry',
                      'Try a different search query with proper format',
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 max-w-2xl mx-auto">
                  <p className="text-center text-sm font-medium text-gray-700 mb-4">Try this: correct method</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {EXAMPLE_SEARCHES.slice(0, 3).map((example) => (
                      <button
                        key={example.label}
                        type="button"
                        onClick={() => runSuggestedSearch(example.query)}
                        className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-[#E65D24] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E65D24]/10 group-hover:text-[#E65D24] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <p className="flex-1 text-sm font-medium text-gray-900 group-hover:text-[#E65D24] transition-colors">
                            {example.label}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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

              {isNetworkError && (
                <button
                  type="button"
                  onClick={() => {
                    clearCache();
                    searchProperties(searchQuery, searchType, macroFilters);
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
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
            <div className="py-16 sm:py-20">
              <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-[#136C9E]/10 to-[#E65D24]/10 flex items-center justify-center shadow-sm">
                    <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#136C9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="mt-6 text-2xl sm:text-4xl font-bold" style={{ color: '#23272f' }}>
                    No Properties Found
                  </h2>
                  <p className="mt-3 max-w-2xl text-gray-600">
                    We couldn&apos;t find any properties matching your search criteria. Don&apos;t worry though – there are plenty of options available!
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GuidanceCard
                    tone="blue"
                    iconPath="M4 6h16M4 12h10M4 18h16"
                    title="Adjust Your Filters"
                    body="Try broadening your search criteria like price range, number of bedrooms, or apartment type."
                  />
                  <GuidanceCard
                    tone="orange"
                    iconPath={LOCATION_PIN_PATH}
                    title="Try Different Location"
                    body="Consider searching in nearby areas or neighborhoods that might have similar properties."
                  />
                  <GuidanceCard
                    tone="green"
                    iconPath="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    title="Check Back Later"
                    body="New properties are added daily. Save your search and we'll notify you when new matches appear."
                  />
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearCache();
                      navigate(`/?q=${encodeURIComponent(searchQuery)}&type=proptii`);
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Start New Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPlatform = searchType === 'proptii' ? 'onthemarket' : 'proptii';
                      clearCache();
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${nextPlatform}`);
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 10a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm14-5a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V9z" />
                    </svg>
                    {searchType === 'proptii' ? 'Try On The Market' : 'Try Proptii'}
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-center text-sm text-gray-500 mb-4">
                    Popular searches{hasQueryLocation ? ` in ${popularSearchLocation}` : ''}:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => runSuggestedSearch(chip.query)}
                        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-16 sm:py-20">
              <div className="max-w-xl mx-auto px-4 text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#136C9E]/10 text-[#136C9E] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  No Properties Match Your Active Filters
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We found {results.length} {results.length === 1 ? 'property' : 'properties'} for this search, but none match your current filter criteria.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                    {filters.bedrooms !== 'any' && Array.isArray(filters.bedrooms) && (
                      <RemoveFilterButton onClick={() => removeFilter('bedrooms')}>
                        Remove {filters.bedrooms.join('/')} bed filter
                      </RemoveFilterButton>
                    )}
                    {filters.maxPrice !== null && (
                      <RemoveFilterButton onClick={() => removeFilter('price')}>
                        Remove max £{filters.maxPrice.toLocaleString('en-GB')} filter
                      </RemoveFilterButton>
                    )}
                    {filters.propertyTypes.length > 0 && (
                      <RemoveFilterButton onClick={() => removeFilter('propertyTypes')}>
                        Remove {filters.propertyTypes.join(', ')} filter
                      </RemoveFilterButton>
                    )}
                    {filters.isPetFriendly && (
                      <RemoveFilterButton tone="amber" icon={PawPrint} onClick={() => removeFilter('pets')}>
                        Remove Pet Friendly filter
                      </RemoveFilterButton>
                    )}
                    {filters.billsIncluded && (
                      <RemoveFilterButton tone="blue" icon={Zap} onClick={() => removeFilter('bills')}>
                        Remove Bills Included filter
                      </RemoveFilterButton>
                    )}
                    {filters.hasBalconyOrGarden && (
                      <RemoveFilterButton tone="teal" icon={Trees} onClick={() => removeFilter('outside')}>
                        Remove Balcony/Garden filter
                      </RemoveFilterButton>
                    )}
                    {filters.hasParking && (
                      <RemoveFilterButton tone="indigo" icon={Car} onClick={() => removeFilter('parking')}>
                        Remove Parking filter
                      </RemoveFilterButton>
                    )}
                    {Boolean(filters.keywords) && (
                      <RemoveFilterButton onClick={() => removeFilter('keywords')}>
                        Remove &quot;{filters.keywords}&quot; filter
                      </RemoveFilterButton>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#136C9E] to-[#0F5A8A] hover:opacity-95 transition-all shadow-sm text-sm w-full sm:w-auto"
                    >
                      Clear All Filters & Show All {results.length} Properties
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearCache();
                        searchProperties(searchQuery, searchType, {
                          ...macroFilters,
                          pet_friendly: filters.isPetFriendly ? true : undefined,
                          bills_included: filters.billsIncluded ? true : undefined,
                          balcony_or_garden: filters.hasBalconyOrGarden ? true : undefined,
                          parking: filters.hasParking ? true : undefined,
                          keywords: filters.keywords || undefined,
                        });
                      }}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E65D24] to-[#D54D14] hover:opacity-95 transition-all shadow-sm text-sm w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4 mr-2" aria-hidden />
                      Re-query Portals With These Filters
                    </button>
                  </div>
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
