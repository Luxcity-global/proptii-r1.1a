import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Search, Sparkles, Filter, X } from 'lucide-react';

interface SearchSuggestion {
  text: string;
  type: 'location' | 'property_type' | 'price_range' | 'bedrooms';
  confidence: number;
}

interface SmartSearchBarProps {
  onSearch: (query: string, filters?: any) => void;
  onVoiceSearch?: () => void;
  isListening?: boolean;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  isLoading?: boolean;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onSearch,
  onVoiceSearch,
  isListening = false,
  suggestions = [],
  recentSearches = [],
  isLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart suggestions based on query
  const getSmartSuggestions = (input: string): SearchSuggestion[] => {
    if (!input.trim()) return [];
    
    const suggestions: SearchSuggestion[] = [];
    const lowerInput = input.toLowerCase();
    
    // Location suggestions
    const locations = ['Bromley', 'Orpington', 'London', 'Swiss Cottage', 'Camden'];
    locations.forEach(location => {
      if (location.toLowerCase().includes(lowerInput)) {
        suggestions.push({
          text: `Properties in ${location}`,
          type: 'location',
          confidence: 0.9
        });
      }
    });
    
    // Property type suggestions
    if (lowerInput.includes('rent') || lowerInput.includes('let')) {
      suggestions.push({
        text: 'Properties to rent',
        type: 'property_type',
        confidence: 0.95
      });
    }
    if (lowerInput.includes('buy') || lowerInput.includes('sale')) {
      suggestions.push({
        text: 'Properties for sale',
        type: 'property_type',
        confidence: 0.95
      });
    }
    
    // Bedroom suggestions
    const bedroomMatch = lowerInput.match(/(\d+)\s*(bed|bedroom)/);
    if (bedroomMatch) {
      const beds = bedroomMatch[1];
      suggestions.push({
        text: `${beds} bedroom properties`,
        type: 'bedrooms',
        confidence: 0.8
      });
    }
    
    // Price suggestions
    const priceMatch = lowerInput.match(/£?(\d+)(k|m)?/i);
    if (priceMatch) {
      const amount = priceMatch[1];
      const unit = priceMatch[2]?.toLowerCase() || '';
      suggestions.push({
        text: `Properties under £${amount}${unit === 'k' ? 'k' : unit === 'm' ? 'm' : ''}`,
        type: 'price_range',
        confidence: 0.7
      });
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };

  const currentSuggestions = getSmartSuggestions(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('🎯 [SMART_SEARCH] Submitting query:', query);
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    console.log('🎯 [SMART_SEARCH] Suggestion clicked:', suggestion);
    setQuery(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < currentSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(currentSuggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setActiveSuggestionIndex(-1);
  };

  const handleVoiceSearch = () => {
    console.log('🎯 [SMART_SEARCH] Voice search activated');
    if (onVoiceSearch) {
      onVoiceSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          background: '#fff',
          borderRadius: 40,
          boxShadow: '0 8px 24px 0 rgba(44,62,80,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          height: 64,
          position: 'relative',
          border: isFocused ? '2px solid #E65D24' : '2px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {/* AI Icon */}
        <Sparkles 
          style={{ 
            width: 24, 
            height: 24, 
            color: '#E65D24', 
            marginRight: 16,
            animation: isLoading ? 'pulse 2s infinite' : 'none'
          }} 
        />
        
        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(query.length > 0);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="AI-powered property search... Try '2 bed flat in Bromley' or 'rent under £1500'"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 18,
            background: 'transparent',
            color: '#23272f',
            padding: '0 8px',
          }}
        />
        
        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <X style={{ width: 18, height: 18, color: '#888' }} />
          </button>
        )}
        
        {/* Voice Search Button */}
        <button
          type="button"
          onClick={handleVoiceSearch}
          style={{
            background: isListening ? '#E65D24' : 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: 16,
            transition: 'all 0.2s ease',
          }}
          title={isListening ? 'Listening...' : 'Voice search'}
        >
          {isListening ? (
            <MicOff style={{ width: 20, height: 20, color: '#fff' }} />
          ) : (
            <Mic style={{ width: 20, height: 20, color: '#A0AEC0' }} />
          )}
        </button>
        
        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: '#E65D24',
            border: 'none',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px 0 rgba(44,62,80,0.10)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
          aria-label="Search"
        >
          <img
            src="/images/ai-search-plane-icon-new-wht-1.png"
            alt="Search"
            style={{ width: 24, height: 24, display: 'block' }}
          />
        </button>
      </form>

      {/* Smart Suggestions Dropdown */}
      {showSuggestions && (currentSuggestions.length > 0 || recentSearches.length > 0) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginTop: 8,
          zIndex: 1000,
          maxHeight: 400,
          overflow: 'auto',
        }}>
          {/* AI Suggestions */}
          {currentSuggestions.length > 0 && (
            <div style={{ padding: '16px 0' }}>
              <div style={{
                padding: '0 20px 8px 20px',
                fontSize: 12,
                fontWeight: 600,
                color: '#E65D24',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                AI Suggestions
              </div>
              {currentSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: activeSuggestionIndex === index ? '#f8f9fa' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  <Sparkles style={{ width: 16, height: 16, color: '#E65D24' }} />
                  <span style={{ fontSize: 14, color: '#23272f' }}>
                    {suggestion.text}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 12,
                    color: '#888',
                    background: '#f1f3f4',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}>
                    {suggestion.type}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div style={{ 
              padding: '16px 0',
              borderTop: currentSuggestions.length > 0 ? '1px solid #eee' : 'none'
            }}>
              <div style={{
                padding: '0 20px 8px 20px',
                fontSize: 12,
                fontWeight: 600,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Recent Searches
              </div>
              {recentSearches.slice(0, 3).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    onSearch(search);
                    setShowSuggestions(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Search style={{ width: 16, height: 16, color: '#888' }} />
                  <span style={{ fontSize: 14, color: '#23272f' }}>
                    {search}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SmartSearchBar; 