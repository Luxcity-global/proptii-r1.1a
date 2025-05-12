import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic } from 'lucide-react';
import { SearchService } from '../services/SearchService';
import { useDebounce } from '../hooks/useDebounce';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

const searchService = SearchService.getInstance();

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  isLoading = false,
  className = '',
  value,
  onChange
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Default suggestions to show when input is focused but empty
  const defaultSuggestions = [
    "2 bedroom flat in London",
    "Houses for rent in Manchester",
    "Student accommodation in Birmingham",
    "1 bedroom apartment with parking",
    "Pet-friendly rentals nearby"
  ];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length === 0) {
        setSuggestions(defaultSuggestions);
        return;
      }
      
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        console.log('Fetching suggestions for query:', debouncedQuery);
        const results = await searchService.getSuggestions(debouncedQuery);
        console.log('Received suggestions:', results);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        // Fallback to default suggestions on error
        setSuggestions(defaultSuggestions);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="bg-white rounded-full p-2 flex items-center shadow-xl">
        <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
          <Camera className="w-6 h-6" />
        </button>
        <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
          <Mic className="w-6 h-6" />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-4 py-3 bg-transparent text-gray-900 outline-none text-lg"
          placeholder="AI-enabled property search ..."
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
        />
        <button
          className={`bg-primary text-white p-3 rounded-full transition-all shadow-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
          }`}
          onClick={() => {
            setShowSuggestions(false);
            onSearch(value);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img 
              src="/images/ai-search-plane-icon-new-wht-1.png"
              alt="Search"
              className="w-9 h-9"
            />
          )}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute w-full mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 