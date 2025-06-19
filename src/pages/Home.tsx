//import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';
import ErrorBoundary from '../components/ErrorBoundary';

import { useState, useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();

  const {
    query,
    setQuery,
    isLoading,
    error,
    response,
    handleSearch: executeSearch,
  } = useSearch();

  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [hasResults, setHasResults] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        // Remove /api from the end if it exists
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        const response = await fetch(`${baseUrl}/api/health`);
        setIsBackendAvailable(response.ok);
      } catch (error) {
        console.error('Backend health check failed:', error);
        setIsBackendAvailable(false);
      }
    };

    checkBackend();
  }, []);

  // Progress bar component (removed loadingProgress)

  const handleSearch = async (searchQuery: string) => {
    if (!isBackendAvailable) {
      alert('Search service is currently unavailable. Please try again later.');
      return;
    }
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      try {
        const results = await executeSearch();
        setHasResults(Boolean(results && results.length > 0));
      } catch (error) {
        setHasResults(false);
      }
    }
  };

  // Search results fallback UI
  const SearchResultsFallback = () => (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Unable to display search results
      </h3>
      <p className="text-gray-600 mb-6">
        We encountered an issue while displaying the search results. The data might be in an unexpected format.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-nunito">
      <Navbar />

      {/* Hero Section */}
      <section className={`${(query || response || isLoading || error) ? 'h-auto min-h-[60vh] py-8' : 'h-[80vh]'} relative flex items-center pt-20 md:pt-0`}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Hero background"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full py-8 md:py-0">
          {/* User Type Selection */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <button className="px-6 md:px-8 py-3 rounded-full bg-primary text-white font-semibold transition-all text-sm md:text-base">
                Tenant
              </button>
              <Link
                to="/Agent"
                className="px-6 md:px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all text-sm md:text-base"
              >
                Agent
              </Link>
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 font-archive leading-tight">
            Find Your Dream Home
          </h3>

          {/* Subheading */}
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4">
            We make finding and securing your home easy, every step of the way.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto px-4 md:px-0">
            <SearchInput
              onSearch={handleSearch}
              value={query}
              onChange={setQuery}
              hasResults={hasResults}
            />
            {!isBackendAvailable && (
              <p className="text-yellow-500 mt-2 text-sm md:text-base">
                Search service is currently unavailable. Please try again later.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Display Search Results */}
      {(query || response || isLoading || error) && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <ErrorBoundary fallback={<SearchResultsFallback />}>
              <SearchResults
                searchResponse={response || []}
                isLoading={isLoading}
                error={error}
              />
            </ErrorBoundary>
          </div>
        </section>
      )}

      {/**The new services section */}
      <section className="relative py-16 md:py-20 bg-[#f9f5f0]">
        {/* Background Image (Blobs) */}
        <img
          src="/images/middle-section.png"
          alt="Background design"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Book Viewing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/viewing-room.jpg"
                  alt="Viewing room"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Book Viewing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
              </p>
              <button
                onClick={() => navigate('/bookviewing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Referencing Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/referencing-person.jpg"
                  alt="Referencing process"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Referencing</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
              </p>
              <button
                onClick={() => navigate('/referencing')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>

            {/* Contract Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-7 flex flex-col h-full">
              <div className="mb-5 md:mb-6">
                <img
                  src="/images/modern-building.jpg"
                  alt="Modern building"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-[#E65D24] text-2xl md:text-3xl font-bold mb-3 md:mb-4">Contract</h3>
              <p className="text-gray-600 mb-5 md:mb-6 flex-grow text-sm md:text-base leading-relaxed">
                Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
              </p>
              <button
                onClick={() => navigate('/contracts')}
                className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-base md:text-lg font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/**End of the new services section */}

      <FAQSection />
      <Footer />

    </div>
  );
};

export default Home;