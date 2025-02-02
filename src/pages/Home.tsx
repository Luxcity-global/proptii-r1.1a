import React, { useState } from 'react';
import { Camera, Mic, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import createClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Check if API key exists
    const apiKey = import.meta.env.VITE_AZURE_API_KEY;
    if (!apiKey) {
      setError('API key is not configured');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting search...');
      const client = createClient(
        'https://ai-tosinai2685488296748963.openai.azure.com',
        new AzureKeyCredential(apiKey)
      );

      const response = await client.path("/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview").post({
        body: {
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that helps users find properties in the UK.
                       When users ask about properties, provide information about available listings
                       from OpenRent and Zoopla. Format the response in a clear, readable way.`
            },
            { role: "user", content: searchQuery }
          ],
          temperature: 0.7,
          max_tokens: 800
        }
      });

      console.log('API Response:', response);
      
      if (response.body) {
        setSearchResults(response.body);
      } else {
        setError('No results found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <div className="mb-8">
            <div className="inline-flex rounded-full bg-white p-1">
              <button className="px-6 py-2 rounded-full bg-primary text-white">Tenant</button>
              <button className="px-6 py-2 rounded-full text-gray-700">Agent</button>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-8 font-archive">
            Find Your Dream Home
          </h1>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            We make finding and securing your home easy, every step of the way.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-full p-2 flex items-center">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Camera className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Mic className="w-6 h-6" />
              </button>
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-transparent text-gray-900 outline-none"
                placeholder="Search for properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="bg-primary text-white p-2 rounded-full hover:bg-opacity-90"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : <Search className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Display Search Results */}
      {(isLoading || searchResults || error) && (
        <section className="py-10 bg-gray-50">
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
              <section className="py-10 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                  <h2 className="text-2xl font-bold mb-6">Available Properties</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Parse the content and map through properties */}
                    {searchResults.choices[0].message.content.split('#### ').slice(1).map((property, index) => {
                      const lines = property.split('\n').filter(line => line.trim());
                      const title = lines[0].replace(/[*]/g, '');
                      const details = lines.slice(1).reduce((acc, line) => {
                        if (line.includes('**Rent:**')) acc.rent = line.split('**Rent:**')[1].trim();
                        if (line.includes('**Location:**')) acc.location = line.split('**Location:**')[1].trim();
                        if (line.includes('**Description:**')) acc.description = line.split('**Description:**')[1].trim();
                        if (line.includes('**Features:**')) acc.features = line.split('**Features:**')[1].trim();
                        return acc;
                      }, {} as any);

                      return (
                        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                          {/* Property Image */}
                          <div className="relative h-48 bg-gray-200">
                            <img
                              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                                Highlight
                              </span>
                            </div>
                          </div>

                          {/* Property Details */}
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                  {details.rent}
                                  <span className="text-sm font-normal text-gray-600 ml-2">pcm</span>
                                </h3>
                              </div>
                              <button className="text-gray-400 hover:text-gray-500">
                                {/* Heart icon for favorites */}
                                ♡
                              </button>
                            </div>

                            <div className="mb-4">
                              <p className="text-gray-600">{details.location}</p>
                              <p className="text-gray-800 mt-2 line-clamp-2">{details.description}</p>
                            </div>

                            <div className="flex gap-2 mb-4">
                              {details.features.split(',').map((feature, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                                  {feature.trim()}
                                </span>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50">
                                Call
                              </button>
                              <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50">
                                Email
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      )}

      <FAQSection />
      <Footer />
    </div>
  );
};

export default Home;