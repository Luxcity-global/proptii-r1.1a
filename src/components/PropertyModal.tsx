import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: any;
  selectedProperty: 'openrent' | 'zoopla' | null;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ 
  isOpen, 
  onClose, 
  searchQuery, 
  searchResults,
  selectedProperty 
}) => {
  if (!isOpen || !selectedProperty) return null;

  // Parse the URLs from the API response
  const parseResults = (content: string) => {
    const sections = content.split('###').filter(section => section.trim());
    const results: { [key: string]: string } = {
      openrent: '',
      zoopla: ''
    };

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const siteTitle = lines[0].trim().toLowerCase();
      
      if (siteTitle.includes('openrent')) {
        const urlLine = lines.find(line => line.includes('openrent.co.uk'));
        results.openrent = urlLine ? urlLine.match(/https?:\/\/[^\s\]]+/)?.[0] || '' : '';
      } else if (siteTitle.includes('zoopla')) {
        const urlLine = lines.find(line => line.includes('zoopla.co.uk'));
        results.zoopla = urlLine ? urlLine.match(/https?:\/\/[^\s\]]+/)?.[0] || '' : '';
      }
    });

    return results;
  };

  const urls = searchResults?.choices?.[0]?.message?.content 
    ? parseResults(searchResults.choices[0].message.content)
    : { openrent: '', zoopla: '' };

  // Handle opening in new tab
  const handleViewListings = () => {
    const url = urls[selectedProperty];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-[600px] bg-white rounded-lg shadow-2xl flex flex-col mx-auto my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center space-x-4">
            <img
              src={`/images/${selectedProperty}-logo.png`}
              alt={selectedProperty === 'openrent' ? 'OpenRent' : 'Zoopla'}
              className="h-8"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">
            View Properties on {selectedProperty === 'openrent' ? 'OpenRent' : 'Zoopla'}
          </h3>
          <p className="text-gray-600 mb-6">
            You will be redirected to {selectedProperty === 'openrent' ? 'OpenRent' : 'Zoopla'} to view properties matching your search:
            <br />
            <span className="font-semibold">"{searchQuery}"</span>
          </p>
          <button
            onClick={handleViewListings}
            className="bg-primary text-white px-8 py-3 rounded-full hover:bg-opacity-90 transition-all text-center inline-flex items-center gap-2"
          >
            View Listings
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyModal; 