import React, { useEffect, useState } from 'react';
import {
    X,
    Search,
    MapPin,
    Phone,
    Globe,
    Star,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { resolveSearchBackendUrl } from '../../utils/searchBackendUrl';


interface VendorSearchResult {
    placeId: string;
    name: string;
    address: string;
    rating?: number;
    totalRatings?: number;
    phoneNumber?: string;
    website?: string;
    openNow?: boolean;
    types: string[];
    description?: string;
    matchesInDescription?: boolean;
    relevanceScore?: number;
}

interface VendorSearchProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    postcode?: string;
}

interface RecentSearch {
    id: string;
    label: string;
    postcode: string;
    searchTerm: string;
    timestamp: number;
}

const categorySearchTerms: Record<string, string> = {
    hvac: 'heating engineer',
    plumbing: 'plumber',
    electrical: 'electrician',
    appliance: 'appliance repair',
    exterior: 'handyman',
    interior: 'decorator',
    other: 'handyman'
};

export function VendorSearch({
    isOpen,
    onClose,
    category = 'other',
    postcode: initialPostcode = ''
}: VendorSearchProps) {
    const [postcode, setPostcode] = useState(initialPostcode);
    const [searchTerm, setSearchTerm] = useState(
        categorySearchTerms[category] || 'handyman'
    );
    const [searchResults, setSearchResults] = useState<VendorSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<{
        currentPage: number;
        pageSize: number;
        totalResults: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('vendorRecentSearches');
            if (stored) {
                const parsed = JSON.parse(stored) as RecentSearch[];
                setRecentSearches(parsed);
            }
        } catch (e) {
            console.error('Failed to load recent vendor searches', e);
        }
    }, []);

    // Reset default search term when category or dialog changes
    useEffect(() => {
        setSearchTerm(categorySearchTerms[category] || 'handyman');
    }, [category, isOpen]);

    if (!isOpen) return null;

    const suggestedTerms = Array.from(
        new Set([
            categorySearchTerms[category] || 'handyman',
            'home maintenance services',
            'property maintenance'
        ])
    );

    // Note: This is a placeholder for Google Places API integration
    // You'll need to implement the actual API call in your backend
    const handleSearch = async (page: number = 1, overridePostcode?: string, overrideSearchTerm?: string) => {
        const searchPostcode = overridePostcode || postcode;
        const searchTermValue = overrideSearchTerm || searchTerm;
        
        if (!searchPostcode.trim()) {
            setError('Please enter a postcode');
            return;
        }

        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setCurrentPage(page);

        try {
            // Format UK postcode properly (add space if missing)
            let formattedPostcode = searchPostcode.trim().toUpperCase().replace(/\s+/g, '');
            if (formattedPostcode.length >= 5) {
                // Insert space before last 3 characters (UK postcode format)
                formattedPostcode = formattedPostcode.slice(0, -3) + ' ' + formattedPostcode.slice(-3);
            }

            console.log('Searching with postcode:', formattedPostcode, 'search term:', searchTermValue, 'page:', page);

            // Call the backend API server with pagination
            const searchBackendUrl = resolveSearchBackendUrl();
            const response = await fetch(`${searchBackendUrl}/api/vendors/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `${searchTermValue} near ${formattedPostcode}`,
                    location: formattedPostcode,
                    type: searchTermValue,
                    page: page,
                    pageSize: 10
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API error:', errorData);
                throw new Error(errorData.error || 'Failed to search for vendors');
            }

            const data = await response.json();
            console.log('Search results:', data);
            console.log('First result details:', data.results?.[0]);
            console.log('Has description field?', data.results?.[0]?.description);
            console.log('Has matchesInDescription?', data.results?.[0]?.matchesInDescription);
            setSearchResults(data.results || []);
            
            // Store pagination info
            if (data.pagination) {
                setPagination(data.pagination);
            }

            // Save recent search
            const label = `${searchTermValue} in ${formattedPostcode}`;
            const newSearch: RecentSearch = {
                id: `${searchTermValue}-${formattedPostcode}`,
                label,
                postcode: formattedPostcode,
                searchTerm: searchTermValue,
                timestamp: Date.now()
            };

            setRecentSearches(prev => {
                const filtered = prev.filter(item => item.id !== newSearch.id);
                const updated = [newSearch, ...filtered]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 6);

                try {
                    localStorage.setItem('vendorRecentSearches', JSON.stringify(updated));
                } catch (e) {
                    console.error('Failed to save recent vendor searches', e);
                }

                return updated;
            });
        } catch (err) {
            console.error('Vendor search error:', err);
            console.error('Error details:', err.message);
            setError('Unable to search at this time. Please try again in a few minutes.');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneNumber = (phone: string) => {
        // Basic UK phone number formatting
        return phone.replace(/(\d{5})(\d{6})/, '$1 $2');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#374957] to-[#2c3a47] text-white p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">Find a Professional</h2>
                            <p className="text-white/90 text-sm">
                                Search for trades people in your area
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-4"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Bar & Term */}
                    <div className="space-y-3">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Enter your postcode (e.g., SW1A 1AA)"
                                    value={postcode}
                                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                                    className="w-full pl-11 pr-4 py-3 border-2 border-white/20 bg-white/10 text-white placeholder-white/60 rounded-lg focus:outline-none focus:border-white/40 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => handleSearch(1)}
                                disabled={isLoading}
                                className="px-6 py-3 bg-[#DC5F12] text-white rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                            <span className="text-white/80 md:w-28">Search for</span>
                            <div className="flex-1 flex flex-wrap gap-2">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="e.g. handyman, home maintenance services"
                                    className="min-w-[200px] flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 text-sm"
                                />
                                {suggestedTerms.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => setSearchTerm(term)}
                                        className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                                            term === searchTerm
                                                ? 'bg-white text-[#374957] border-white'
                                                : 'border-white/30 text-white/80 hover:bg-white/10'
                                        }`}
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-yellow-900 mb-1">Search Unavailable</p>
                                    <p className="text-sm text-yellow-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {hasSearched && !isLoading && searchResults.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#374957]">
                                    {pagination ? (
                                        <>
                                            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-
                                            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalResults)} of {pagination.totalResults} {searchTerm}s near {postcode}
                                        </>
                                    ) : (
                                        <>
                                            Found {searchResults.length} {searchTerm}s near {postcode}
                                        </>
                                    )}
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {searchResults.map((vendor) => (
                                    <div
                                        key={vendor.placeId}
                                        className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#DC5F12] hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-[#374957]">{vendor.name}</h4>
                                                    {vendor.matchesInDescription && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                            Matches in description
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {vendor.address}
                                                </p>
                                                {vendor.description && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-500 italic line-clamp-2">
                                                            {vendor.description}
                                                        </p>
                                                        {vendor.matchesInDescription && (
                                                            <p className="text-xs text-blue-600 mt-1">✓ Found match in business description</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {vendor.rating && (
                                                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="font-bold text-yellow-900">{vendor.rating.toFixed(1)}</span>
                                                    {vendor.totalRatings && (
                                                        <span className="text-xs text-yellow-700">({vendor.totalRatings})</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-sm">
                                            {vendor.phoneNumber && (
                                                <a
                                                    href={`tel:${vendor.phoneNumber}`}
                                                    className="flex items-center gap-2 text-[#DC5F12] hover:text-[#c54f0f] font-medium"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {formatPhoneNumber(vendor.phoneNumber)}
                                                </a>
                                            )}
                                            {vendor.website && (
                                                <a
                                                    href={vendor.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[#DC5F12] hover:text-[#c54f0f] font-medium"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                    Visit Website
                                                </a>
                                            )}
                                            {vendor.openNow !== undefined && (
                                                <span className={`flex items-center gap-1 ${vendor.openNow ? 'text-green-600' : 'text-red-600'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${vendor.openNow ? 'bg-green-600' : 'bg-red-600'}`} />
                                                    {vendor.openNow ? 'Open Now' : 'Closed'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSearch(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPreviousPage || isLoading}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                                !pagination.hasPreviousPage || isLoading
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>
                                        
                                        <span className="text-sm text-gray-600 px-4">
                                            Page {pagination.currentPage} of {pagination.totalPages}
                                        </span>
                                        
                                        <button
                                            onClick={() => handleSearch(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage || isLoading}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                                !pagination.hasNextPage || isLoading
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="text-sm text-gray-500">
                                        {pagination.totalResults} total results
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No Results */}
                    {hasSearched && !isLoading && searchResults.length === 0 && !error && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No results found</p>
                            <p className="text-sm text-gray-500 mb-4">Try a different postcode or browse the directories below</p>
                        </div>
                    )}

                    {/* Recent Searches */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-gray-300 flex-1" />
                            <h3 className="text-sm font-bold text-gray-600 uppercase">Recent searches</h3>
                            <div className="h-px bg-gray-300 flex-1" />
                        </div>

                        {recentSearches.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                Your recent vendor searches will appear here so you can quickly run them again.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {recentSearches.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setPostcode(item.postcode);
                                            setSearchTerm(item.searchTerm);
                                            // Run search again with this postcode and search term, starting at page 1
                                            handleSearch(1, item.postcode, item.searchTerm);
                                        }}
                                        className="flex items-start gap-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-left hover:border-[#DC5F12] hover:shadow-md transition-all"
                                    >
                                        <div className="mt-1">
                                            <Search className="w-4 h-4 text-[#DC5F12]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#374957]">{item.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Click to search again for this area.
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">Important</p>
                                <p className="text-sm text-blue-800">
                                    Always verify credentials, get multiple quotes, and check reviews before hiring any tradesperson.
                                    We do not endorse or guarantee any of the professionals listed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
