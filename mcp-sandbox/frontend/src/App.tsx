import React, { useState, useEffect } from 'react';
import './index.css';
import PropertyGrid from './components/PropertyGrid';
import PropertyDetailsModal from './components/PropertyDetailsModal';
import SmartSearchBar from './components/SmartSearchBar';
import IntelligentFilterPanel from './components/IntelligentFilterPanel';
import AIIntelligencePanel from './components/AIIntelligencePanel';
import RealTimeScrapingPanel from './components/RealTimeScrapingPanel';
import AreaInsightPanel from './components/AreaInsightPanel';
import SimpleMap from './components/SimpleMap';
import MapErrorBoundary from './components/MapErrorBoundary';
import DebugSearch from './components/DebugSearch';
import { mockProperties } from './data/mockProperties';
import { searchProperties, type SearchOptions } from './services/api';
import { areaInsightService } from './services/areaInsightService';
import type { AreaInsight } from './types/areaInsight';
import { Brain, Sparkles } from 'lucide-react';

interface MarketInsight {
  type: 'trend' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  icon: React.ReactNode;
}

interface Property {
  id: string;
  status: string;
  availableNow: boolean;
  title: string;
  price: number;
  priceUnit: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  areaUnit: string;
  images: Array<{
    src: string;
    alt: string;
    label: string;
  }>;
  isFavorited: boolean;
  agent: {
    company: string;
    name: string;
  };
  actions: Array<{ type: string; label: string }>;
  source: string;
}

interface Filters {
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  minBedrooms?: number;
  propertyType?: 'rent' | 'sale';
  location?: string;
  sortBy?: 'date' | 'price' | 'popularity';
}

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  start: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const [areaInsight, setAreaInsight] = useState<AreaInsight | null>(null);
  const [areaInsightLoading, setAreaInsightLoading] = useState(false);
  const [areaInsightError, setAreaInsightError] = useState<string | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Utility to shuffle an array
  function shuffleArray(array: Property[]) {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  // Apply filters to properties
  const applyFilters = (properties: Property[], filters: Filters): Property[] => {
    let filtered = [...properties];

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.beds === filters.bedrooms);
    }

    if (filters.minBedrooms) {
      filtered = filtered.filter(p => p.beds >= filters.minBedrooms!);
    }

    if (filters.propertyType) {
      const isRent = filters.propertyType === 'rent';
      filtered = filtered.filter(p => 
        (isRent && p.priceUnit === 'pcm') || (!isRent && p.priceUnit !== 'pcm')
      );
    }

    if (filters.location) {
      filtered = filtered.filter(p => 
        p.address.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.sortBy === 'date') {
      // Sort by ID (simulating date) - newer properties have higher IDs
      filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }

    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    }

    return filtered;
  };

  const handlePropertyClick = (property: Property) => {
    console.log('🎯 [APP] Property clicked:', property);
    setSelectedProperty(property);
  };

  const handleCloseModal = () => {
    console.log('🎯 [APP] Closing modal');
    setSelectedProperty(null);
  };

  const handleSearch = async (query: string, filters?: Filters) => {
    console.log('🎯 [APP] Smart search initiated:', query, filters);
    
    if (!query.trim()) {
      console.log('⚠️ [APP] Empty query - resetting state');
      setSearchPerformed(false);
      setFilteredProperties([]);
      setError(null);
      return;
    }
    
    console.log('🚀 [APP] Starting smart search process...');
    setSearchPerformed(true);
    setCurrentPage(1);
    setLoading(true);
    setError(null);
    setAreaInsightLoading(true);
    setAreaInsightError(null);
    setAreaInsight(null); // Clear previous area insight for new search
    
    // Save to recent searches
    saveRecentSearch(query);
    
    const searchStartTime = Date.now();
    
    try {
      console.log('📞 [APP] Calling searchProperties API...');
      const searchOptions = {
        useRealData: true, // Force real data usage
        filters: filters || {},
        sources: ['openrent'],
        page: 1,
        limit: 20
      };
      
      const results = await searchProperties(query.trim(), searchOptions as SearchOptions);
      const searchEndTime = Date.now();
      
      console.log('✅ [APP] Search completed successfully');
      console.log('⏱️ [APP] Total search time:', searchEndTime - searchStartTime, 'ms');
      console.log('🏠 [APP] Results received:', results);
      console.log('📊 [APP] Results count:', results.properties?.length || 0);
      
      if (results.properties && Array.isArray(results.properties)) {
        console.log('🏠 [APP] First result sample:', results.properties[0] || 'No results');
        
        // Apply filters if provided
        let filteredResults = results.properties;
        if (filters && Object.keys(filters).length > 0) {
          console.log('🎯 [APP] Applying filters:', filters);
          filteredResults = applyFilters(results.properties, filters);
          console.log('🎯 [APP] Filtered results count:', filteredResults.length);
        }
        
        setFilteredProperties(filteredResults);
        console.log('✅ [APP] State updated with filtered results');
        
        // Log metadata if available
        if (results.metadata) {
          console.log('📊 [APP] Search metadata:', results.metadata);
        }
        
        // Fetch area insights asynchronously (don't block main search)
        setTimeout(async () => {
          try {
            console.log('🏘️ [APP] Fetching area insights for:', query);
            const insight = await areaInsightService.getAreaInsight({
              location: query,
              propertyType: filters?.propertyType,
              bedrooms: filters?.bedrooms
            });
            
            if (insight) {
              console.log('✅ [APP] Area insight received:', insight);
              setAreaInsight(insight);
              setAreaInsightError(null);
            } else {
              console.log('⚠️ [APP] No area insight available for:', query);
              setAreaInsight(null);
              setAreaInsightError('Area insights not available for this location');
            }
          } catch (insightError) {
            console.error('❌ [APP] Area insight fetch failed:', insightError);
            setAreaInsightError('Unable to load area information');
            setAreaInsight(null);
          } finally {
            setAreaInsightLoading(false);
          }
        }, 100); // Small delay to let main search complete first
      }
      
    } catch (err: any) {
      const searchEndTime = Date.now();
      console.error('💥 [APP] Search failed after:', searchEndTime - searchStartTime, 'ms');
      console.error('💥 [APP] Error details:', err);
      
      // Fallback to mock data if backend fails
      console.log('🔄 [APP] Falling back to mock data...');
      const q = query.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      console.log('🔍 [APP] Fallback search words:', words);
      
      const shuffled = shuffleArray(mockProperties);
      console.log('🔄 [APP] Shuffled mock properties count:', shuffled.length);
      
      const filtered = shuffled.filter((p) => {
        const title = p.title.toLowerCase();
        const address = (p.address || '').toLowerCase();
        const matches = words.some((word: string) => title.includes(word) || address.includes(word));
        return matches;
      });
      
      console.log('🏠 [APP] Fallback filtered results:', filtered.length);
      
      // Apply filters to fallback results
      let finalResults = filtered;
      if (filters && Object.keys(filters).length > 0) {
        console.log('🎯 [APP] Applying filters to fallback results:', filters);
        finalResults = applyFilters(filtered, filters);
        console.log('🎯 [APP] Final filtered results count:', finalResults.length);
      }
      
      setFilteredProperties(finalResults);
      setError('Backend unavailable, showing demo results.');
      console.log('⚠️ [APP] Error state set with fallback message');
    } finally {
      setLoading(false);
      setAreaInsightLoading(false);
      console.log('🏁 [APP] Search process completed, loading set to false');
    }
  };

  const handleVoiceSearch = () => {
    console.log('🎯 [APP] Voice search activated');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-GB';
      
      recognition.onstart = () => {
        console.log('🎤 [APP] Voice recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 [APP] Voice transcript:', transcript);
        setSearchQuery(transcript);
        handleSearch(transcript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 [APP] Voice recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('🎤 [APP] Voice recognition ended');
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      console.log('🎤 [APP] Speech recognition not supported');
      alert('Voice search is not supported in this browser');
    }
  };

  const handleFiltersChange = (filters: Filters) => {
    console.log('🎯 [APP] Filters changed:', filters);
    
    // Re-apply search with new filters
    if (searchQuery) {
      handleSearch(searchQuery, filters);
    }
  };

  // Dynamic title
  const getResultsTitle = () => {
    if (!searchQuery.trim()) return '';
    return `Properties for rent in ${searchQuery.trim()}`;
  };

  const handleInsightAction = (insight: MarketInsight) => {
    console.log('🎯 [APP] AI insight action:', insight);
    
    switch (insight.action) {
      case 'View all properties':
        // Already showing all properties
        break;
      case 'Expand search':
        // Could trigger a broader search
        break;
      case 'View Bromley properties':
        handleSearch('Bromley');
        break;
      case 'Set up alerts':
        // Could open alert setup
        break;
      case 'View similar properties':
        // Could refine search
        break;
      case 'View family homes':
        handleSearch('3 bedroom properties');
        break;
      default:
        break;
    }
    
    setShowAIInsights(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f8fa',
        padding: 0,
        margin: 0,
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >

      {/* Centered initial state */}
      {!searchPerformed ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#23272f',
            textAlign: 'center',
            letterSpacing: '-0.01em',
            marginBottom: 40,
          }}>
            Let's Get You into Your New Home
          </h1>
          <SmartSearchBar
            onSearch={handleSearch}
            onVoiceSearch={handleVoiceSearch}
            isListening={isListening}
            recentSearches={recentSearches}
            isLoading={loading}
          />
        </div>
      ) : (
        <>
          {/* Search Bar at the top after search */}
          <div
            style={{
              maxWidth: 960,
              width: '100%',
              padding: '32px 16px 0 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <SmartSearchBar
              onSearch={handleSearch}
              onVoiceSearch={handleVoiceSearch}
              isListening={isListening}
              recentSearches={recentSearches}
              isLoading={loading}
            />
          </div>
          
          {/* Title and Property Grid (only after search) */}
          <div style={{ width: '100%', maxWidth: 1200, margin: '32px auto 0 auto', padding: '0 16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#23272f', margin: 0 }}>
                  {getResultsTitle()}
                </h2>
                {filteredProperties.length > 0 && (
                  <p style={{ fontSize: 16, color: '#6b7280', margin: '4px 0 0 0' }}>
                    {filteredProperties.length} Search results
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Sort by:</span>
                  <select
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#6b7280',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    defaultValue="newest"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popularity">Popularity</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowAIInsights(true)}
                    style={{
                      background: 'linear-gradient(135deg, #E65D24 0%, #FF6B35 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(230, 93, 36, 0.3)',
                    }}
                  >
                    <Brain style={{ width: 16, height: 16 }} />
                    AI Insights
                  </button>
                  <button
                    onClick={() => setShowFilters(true)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#23272f',
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="#E65D24" strokeWidth="2" viewBox="0 0 24 24">
                      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                    </svg>
                    Smart Filters
                  </button>
                </div>
              </div>
            </div>
            
            {/* Map Section - Always show when search is performed */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: (areaInsight || areaInsightLoading || areaInsightError) ? '1fr 1fr' : '1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {/* Area Insight Panel - Optional enhancement */}
              {(areaInsight || areaInsightLoading || areaInsightError) && (
                <AreaInsightPanel
                  areaInsight={areaInsight}
                  loading={areaInsightLoading}
                  error={areaInsightError}
                />
              )}
              
              {/* Map - Always show when search is performed */}
              <MapErrorBoundary fallbackMessage="Unable to load the map. Please check your internet connection and try again.">
                <SimpleMap
                  location={searchQuery}
                  properties={filteredProperties.map(p => ({
                    id: p.id,
                    address: p.address,
                    price: p.price,
                    beds: p.beds,
                    baths: p.baths
                  }))}
                />
              </MapErrorBoundary>
            </div>
            
            
            {loading ? (
              <div style={{ color: '#888', fontSize: 20, margin: '48px 0', textAlign: 'center' }}>
                Loading results...
              </div>
            ) : error ? (
              <div style={{ color: '#E65D24', fontSize: 20, margin: '48px 0', textAlign: 'center' }}>
                {error}
              </div>
            ) : filteredProperties.length > 0 ? (
              <PropertyGrid
                properties={filteredProperties}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPropertyClick={handlePropertyClick}
              />
            ) : (
              <div style={{ color: '#888', fontSize: 20, margin: '48px 0', textAlign: 'center' }}>
                No results found
              </div>
            )}
          </div>
          
          {/* Property Details Modal */}
          {selectedProperty && (
            <PropertyDetailsModal
              property={selectedProperty}
              onClose={handleCloseModal}
            />
          )}
          
          {/* Intelligent Filter Panel */}
          <IntelligentFilterPanel
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            propertyCount={filteredProperties.length}
            isVisible={showFilters}
            onClose={() => setShowFilters(false)}
          />
          
          {/* AI Intelligence Panel */}
          <AIIntelligencePanel
            searchQuery={searchQuery}
            propertyCount={filteredProperties.length}
            isVisible={showAIInsights}
            onClose={() => setShowAIInsights(false)}
            onInsightAction={handleInsightAction}
          />
        </>
      )}

      {/* Real-time Scraping Panel */}
      <RealTimeScrapingPanel />

      {/* Debug Search Panel */}
      <DebugSearch
        searchPerformed={searchPerformed}
        loading={loading}
        error={error}
        filteredProperties={filteredProperties}
        searchQuery={searchQuery}
      />

      {/* Floating AI Assistant Button */}
      {searchPerformed && (
        <button
          onClick={() => setShowAIInsights(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '80px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E65D24 0%, #FF6B35 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(230, 93, 36, 0.4)',
            zIndex: 100,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(230, 93, 36, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 93, 36, 0.4)';
          }}
          title="AI Market Intelligence"
        >
          <Sparkles style={{ width: 24, height: 24, color: '#fff' }} />
        </button>
      )}
    </div>
  );
}

export default App;
