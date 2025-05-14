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
import { Container } from '../components/layout/Container';
import { ResponsiveGrid } from '../components/layout/ResponsiveGrid';
import { H1, H2, Body, Small } from '../components/typography/ResponsiveText';
import { useResponsive } from '../hooks/useResponsive';

import { useState, useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

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
      <section className="relative h-[80vh] bg-secondary">
        <Container className="h-full flex items-center">
          <div className="max-w-2xl">
            <H1 className="text-white mb-6">
              Find Your Perfect Property with Proptii
            </H1>
            <Body className="text-white mb-8">
              Browse through thousands of properties, connect with trusted agents,
              and find your dream home today.
            </Body>
            <button className="bg-primary text-white px-8 py-3 rounded-md hover:bg-opacity-90">
              Get Started
            </button>
          </div>
        </Container>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <Container>
          <H2 className="mb-8">Featured Properties</H2>
          <ResponsiveGrid
            cols={{
              xs: 1,
              sm: 2,
              lg: 3
            }}
            gap="6"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={`/placeholder-property-${index + 1}.jpg`}
                  alt="Property"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <H2 className="mb-2">Beautiful Property</H2>
                  <Body className="mb-2">
                    3 bed • 2 bath • 1,500 sqft
                  </Body>
                  <Small className="text-primary">$350,000</Small>
                </div>
              </div>
            ))}
          </ResponsiveGrid>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <H2 className="text-center mb-12">Why Choose Proptii?</H2>
          <ResponsiveGrid
            cols={{
              xs: 1,
              md: 3
            }}
            gap="8"
          >
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <H2 className="mb-2">Expert Agents</H2>
              <Body>Connect with professional agents who know your market.</Body>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <H2 className="mb-2">Easy Process</H2>
              <Body>Simple and streamlined property search and booking.</Body>
            </div>

            <div className="text-center">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <H2 className="mb-2">Trusted Reviews</H2>
              <Body>Real reviews from verified property buyers.</Body>
            </div>
          </ResponsiveGrid>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <Container>
          <div className="bg-secondary rounded-lg p-8 md:p-12 text-center">
            <H1 className="text-white mb-4">Ready to Find Your Dream Home?</H1>
            <Body className="text-white mb-8">
              Join thousands of happy homeowners who found their perfect property with Proptii.
            </Body>
            <button className="bg-primary text-white px-8 py-3 rounded-md hover:bg-opacity-90">
              Start Searching
            </button>
          </div>
        </Container>
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

      {/**The new services section */}
<section className="relative py-20 bg-[#f9f5f0]">
  {/* Background Image (Blobs) */}
  <img 
    src="/images/middle-section.png" 
    alt="Decorative background"
    className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
  />

  <div className="max-w-7xl mx-auto px-4 relative z-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Book Viewing Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/viewing-room.jpg"
            alt="Modern living room"
            className="w-full h-64 object-cover rounded-2xl"
            style={{ objectPosition: 'center 30%' }}
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Book Viewing</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Save time and effort with our AI-powered booking service. Simply enter your desired property details and let our system handle the rest.
        </p>
        <button 
        onClick={() => navigate('/bookviewing')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
          Learn More
        </button>
      </div>

      {/* Referencing Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/referencing-person.jpg"
            alt="Professional woman with tablet"
            className="w-full h-64 object-cover rounded-2xl"
            style={{ objectPosition: 'center 20%' }}
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Referencing</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Ensure peace of mind for both landlords and tenants. Our rigorous referencing process verifies renter or buyer identity, financial stability, and rental history.
        </p>
        <button 
        onClick={() => navigate('/referencing')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
          Learn More
        </button>
      </div>

      {/* Contract Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col">
        <div className="mb-8">
          <img
            src="/images/modern-building.jpg"
            alt="Modern glass building"
            className="w-full h-64 object-cover rounded-2xl"
          />
        </div>
        <h3 className="text-[#E65D24] text-3xl font-bold mb-4">Contract</h3>
        <p className="text-gray-600 mb-8 flex-grow">
          Save time and reduce errors with our contract management solution. We offer a range of customizable lease agreement templates to suit your specific needs.
        </p>
        <button 
        onClick={() => navigate('/contracts')}
        className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
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