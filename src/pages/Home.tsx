import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';

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
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      executeSearch();
    }
  };

  return (
    <div className="min-h-screen font-nunito">
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
              <button className="px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all">
                Agent
              </button>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 font-archive leading-tight">
            Find Your Dream Home
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
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
          </div>
        </div>
      </section>

      {/* Display Search Results */}
      {(query || response || isLoading || error) && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <SearchResults
              searchResponse={response}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#DC5F12]">
            Our Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Viewings */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 relative">
                <img 
                  src="/images/viewing-room.jpg" 
                  alt="Modern living room" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-4 text-[#DC5F12]">Book Viewings</h3>
                <p className="text-gray-600 mb-6">
                  Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
                </p>
                <Link 
                  to="/book-viewing" 
                  className="inline-block px-6 py-3 bg-[#DC5F12] text-white font-medium rounded-lg hover:bg-[#c45510] transition-colors duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Referencing */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 relative">
                <img 
                  src="/images/referencing-person.jpg" 
                  alt="Person checking references" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-4 text-[#DC5F12]">Referencing</h3>
                <p className="text-gray-600 mb-6">
                  Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
                </p>
                <Link 
                  to="/referencing" 
                  className="inline-block px-6 py-3 bg-[#DC5F12] text-white font-medium rounded-lg hover:bg-[#c45510] transition-colors duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Contracts */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 relative">
                <img 
                  src="/images/modern-building.jpg" 
                  alt="Modern building with glass facade" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-4 text-[#DC5F12]">Contracts</h3>
                <p className="text-gray-600 mb-6">
                  Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
                </p>
                <Link 
                  to="/contracts" 
                  className="inline-block px-6 py-3 bg-[#DC5F12] text-white font-medium rounded-lg hover:bg-[#c45510] transition-colors duration-300"
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