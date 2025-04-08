import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useState, useEffect } from 'react';

const Home = () => {
  const {
    query,
    setQuery,
    isLoading,
    error,
    response,
    loadingProgress,
    handleSearch: executeSearch,
  } = useSearch();

  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3000/health');
        setIsBackendAvailable(response.ok);
      } catch (error) {
        setIsBackendAvailable(false);
      }
    };

    checkBackend();
  }, []);

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-4">
      <div 
        className="h-full bg-orange-500 transition-all duration-300 ease-out"
        style={{ width: `${loadingProgress}%` }}
      />
    </div>
  );

  const handleSearch = (searchQuery: string) => {
    if (!isBackendAvailable) {
      alert('Search service is currently unavailable. Please try again later.');
      return;
    }
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      executeSearch();
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
      <section className="h-[80vh] relative flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/01_Lady_Child_Family_BG.jpg"
            alt="Mother and child smiling"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
          {/* User Type Selection */}
          <div className="mb-12">
            <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
              <button className="px-8 py-3 rounded-full bg-primary text-white font-semibold transition-all">
                Tenant
              </button>
              <Link
                to="/agent"
                className="px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all"
              >
                Agent
              </Link>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-archive leading-tight">
            Find Your Dream Home
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-nunito-sans" style={{ fontWeight: 400 }}>
            We make finding and securing your home easy, every step of the way.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchInput
              onSearch={handleSearch}
              isLoading={isLoading}
              value={query}
              onChange={setQuery}
            />
            {isLoading && <ProgressBar />}
            {!isBackendAvailable && (
              <p className="text-yellow-500 mt-2">
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
                searchResponse={response}
                isLoading={isLoading}
                error={error}
              />
            </ErrorBoundary>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 font-archivo" style={{ color: '#DC5F12' }}>
            Our Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Viewings */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/viewing-room.jpg" 
                alt="Book Viewings" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Book Viewings</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Save time and effort with our Al-powered booking service. Simply enter your desired property details and let our system handle the rest.
                </p>
                <Link 
                  to="/book-viewing" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Referencing */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/referencing-person.jpg" 
                alt="Referencing" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Referencing</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
                </p>
                <Link 
                  to="/referencing" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Contracts */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2">
              <img 
                src="/images/contracts-couple-agent.jpg" 
                alt="Contracts" 
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-8">
                <h3 className="text-2.5xl font-archivo mb-4" style={{ color: '#DC5F12', fontWeight: 700 }}>Contracts</h3>
                <p className="font-nunito-sans text-gray-600 mb-6" style={{ fontWeight: 400 }}>
                  Streamline your rental agreements with our digital contract management system. Sign, store, and manage all your documents in one place.
                </p>
                <Link 
                  to="/contracts" 
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-nunito-sans"
                  style={{ fontWeight: 600 }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;