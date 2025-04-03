import React from 'react';
import { X } from 'lucide-react';

interface SearchResult {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: SearchResult | null;
  selectedProperty: 'openrent' | 'zoopla' | null;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  searchResults,
  selectedProperty
}) => {
  if (!isOpen || !searchResults) return null;

  // Extract content from search results
  const content = searchResults.choices[0]?.message?.content || '';

  // Function to extract the relevant section based on selected property
  const extractSection = (content: string, property: 'openrent' | 'zoopla' | null) => {
    if (!property) return content;

    const sections: Record<string, string> = {};
    
    // Extract OpenRent section
    const openrentMatch = content.match(/### OPENRENT LISTINGS([\s\S]*?)(?=### ZOOPLA LISTINGS|$)/);
    if (openrentMatch) {
      sections.openrent = openrentMatch[1].trim();
    }
    
    // Extract Zoopla section
    const zooplaMatch = content.match(/### ZOOPLA LISTINGS([\s\S]*?)$/);
    if (zooplaMatch) {
      sections.zoopla = zooplaMatch[1].trim();
    }
    
    return sections[property] || 'No listings found for this provider.';
  };

  const sectionContent = extractSection(content, selectedProperty);

  // Convert markdown to HTML (basic implementation)
  const formatContent = (text: string) => {
    return text
      .replace(/#### (.*)/g, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>')
      .replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
      .split('\n').map(line => line.trim() ? `<p class="my-2">${line}</p>` : '').join('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedProperty === 'openrent' ? 'OpenRent' : 'Zoopla'} Listings
            {searchQuery && <span className="text-lg font-normal ml-2 text-gray-600">for "{searchQuery}"</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(sectionContent) }}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal; 