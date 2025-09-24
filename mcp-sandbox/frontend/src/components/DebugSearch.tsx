import React from 'react';

interface DebugSearchProps {
  searchPerformed: boolean;
  loading: boolean;
  error: string | null;
  filteredProperties: any[];
  searchQuery: string;
}

const DebugSearch: React.FC<DebugSearchProps> = ({ 
  searchPerformed, 
  loading, 
  error, 
  filteredProperties, 
  searchQuery 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: 10,
      borderRadius: 5,
      fontSize: 12,
      zIndex: 1000,
      minWidth: 200
    }}>
      <h4>Debug Info</h4>
      <div>Search Performed: {searchPerformed ? 'Yes' : 'No'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Error: {error || 'None'}</div>
      <div>Properties Count: {filteredProperties.length}</div>
      <div>Search Query: "{searchQuery}"</div>
      {filteredProperties.length > 0 && (
        <div>First Property: {filteredProperties[0]?.title || 'No title'}</div>
      )}
    </div>
  );
};

export default DebugSearch;