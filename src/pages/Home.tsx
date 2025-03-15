import React, { useState, useCallback, useEffect } from 'react';
import { Camera, Mic, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { AzureKeyCredential } from "@azure/core-auth";
import PropertyModal from '../components/PropertyModal';
import AISearchIcon from '../components/icons/AISearchIcon';
import OpenRentLogo from '/images/openrent-logo.png';
import ZooplaLogo from '/images/zoopla-logo.png';

// Import the OpenAI client
import OpenAI from "openai";

interface SearchResult {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<'openrent' | 'zoopla' | null>(null);

  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  const handleSearch = useCallback(async (): Promise<void> => {
    if (!searchQuery.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults(null); // Clear previous results
    
    const apiKey = import.meta.env.VITE_AZURE_API_KEY;
    if (!apiKey) {
      setError('API key is not configured');
      setIsLoading(false);
      return;
    }

    try {
      // Create the OpenAI client with Azure configuration
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://ai-tosinai2685488296748963.openai.azure.com/openai/deployments/gpt-4o',
        defaultQuery: { 'api-version': '2024-02-15-preview' },
        defaultHeaders: { 'api-key': apiKey }
      });

      console.log('Sending request with query:', searchQuery);
      
      // Use the chat completions API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // This is ignored for Azure, but required by the client
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that helps users find properties in the UK.
                     When users ask about properties, search and provide listings from both OpenRent and Zoopla.
                     Format the response in two clear sections, one for each website.
                     Start each section with the site name:
                     
                     ### OPENRENT LISTINGS
                     [Include OpenRent URL: https://www.openrent.co.uk/properties-to-rent/{SEARCH_TERM}]
                     
                     ### ZOOPLA LISTINGS
                     [Include Zoopla URL: https://www.zoopla.co.uk/to-rent/property/{SEARCH_TERM}]
                     
                     For each property listing use:
                     #### [Property Title]
                     **Rent:**
                     **Location:**
                     **Description:**
                     **Features:**
                     **Link:** [Include the full property URL]`
          },
          { role: "user", content: searchQuery }
        ],
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      console.log('Received response:', response);

      if (!response) {
        throw new Error('No response received from the API');
      }

      // Convert the response to match our SearchResult type
      const typedResponse: SearchResult = {
        choices: response.choices.map((choice: any) => ({
          message: {
            content: choice.message.content || ''
          }
        }))
      };
      
      setSearchResults(typedResponse);
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isLoading]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewResults = () => {
    setIsModalOpen(true);
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
            <div className="bg-white rounded-full p-2 flex items-center shadow-xl">
              <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
                <Camera className="w-6 h-6" />
              </button>
              <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
                <Mic className="w-6 h-6" />
              </button>
              <input
                type="text"
                className="flex-1 px-4 py-3 bg-transparent text-gray-900 outline-none text-lg"
                placeholder="Search for properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className={`bg-primary text-white p-3 rounded-full transition-all shadow-md ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AISearchIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Display Search Results */}
      {(isLoading || searchResults || error) && (
        <section className="py-20 bg-[#F6F5F4]">
          <div className="max-w-7xl mx-auto px-4">
            {isLoading && (
              <div className="text-center">
                <p className="text-lg">Searching for properties...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 text-sm text-red-700 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {searchResults && searchResults.choices && searchResults.choices[0]?.message?.content && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* OpenRent Column */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="h-[120px] flex items-center justify-center mb-6">
                    <img 
                      src={OpenRentLogo} 
                      alt="OpenRent" 
                      className="w-[170px] h-auto"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProperty('openrent');
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all font-medium"
                  >
                    View Listings
                  </button>
                </div>

                {/* Zoopla Column */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="h-[120px] flex items-center justify-center mb-6">
                    <img 
                      src={ZooplaLogo} 
                      alt="Zoopla" 
                      className="w-[140px] h-auto"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProperty('zoopla');
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-primary text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all font-medium"
                  >
                    View Listings
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
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
              <button className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
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
              <button className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
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
              <button className="bg-[#E65D24] text-white px-6 py-3 rounded-full hover:bg-opacity-90 transition-all text-lg font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <Footer />

      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
        searchQuery={searchQuery}
        searchResults={searchResults}
        selectedProperty={selectedProperty}
      />
    </div>
  );
};

export default Home;