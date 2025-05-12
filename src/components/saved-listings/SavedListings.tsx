import React from 'react';

const SavedListings: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Saved Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for saved listings */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500">No saved listings yet</p>
        </div>
      </div>
    </div>
  );
};

export default SavedListings; 