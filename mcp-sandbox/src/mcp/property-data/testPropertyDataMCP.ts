import { PropertyDataMCP } from './PropertyDataMCP';

async function testPropertyDataMCP() {
  console.log('🧪 Testing Enhanced PropertyDataMCP with Real Scraping\n');

  const propertyMCP = new PropertyDataMCP();

  // Test 1: Get scraping status
  console.log('📊 Test 1: Scraping Status');
  const status = await propertyMCP.getScrapingStatus();
  console.log('Status:', status);
  console.log('');

  // Test 2: Mock data search (default behavior)
  console.log('📋 Test 2: Mock Data Search');
  try {
    const mockResults = await propertyMCP.searchProperties('London', { bedrooms: 2 }, false);
    console.log(`✅ Mock search successful: ${mockResults.length} properties`);
    console.log('Sample property:', {
      id: mockResults[0]?.id,
      title: mockResults[0]?.title,
      price: mockResults[0]?.price?.display,
      source: mockResults[0]?.metadata?.source
    });
  } catch (error) {
    console.error('❌ Mock search failed:', error);
  }
  console.log('');

  // Test 3: Real data search (if enabled)
  console.log('🏠 Test 3: Real Data Search');
  try {
    const realResults = await propertyMCP.searchProperties('London', { bedrooms: 2 }, true);
    console.log(`✅ Real search successful: ${realResults.length} properties`);
    if (realResults.length > 0) {
      console.log('Sample property:', {
        id: realResults[0]?.id,
        title: realResults[0]?.title,
        price: realResults[0]?.price?.display,
        source: realResults[0]?.metadata?.source,
        location: realResults[0]?.location?.city
      });
    }
  } catch (error) {
    console.error('❌ Real search failed:', error);
  }
  console.log('');

  // Test 4: Direct Openrent scraping
  console.log('🔍 Test 4: Direct Openrent Scraping');
  try {
    const openrentResults = await propertyMCP.scrapeOpenrent('London');
    console.log(`✅ Openrent scraping successful: ${openrentResults.length} properties`);
    if (openrentResults.length > 0) {
      console.log('Sample Openrent property:', {
        id: openrentResults[0]?.id,
        title: openrentResults[0]?.title,
        price: openrentResults[0]?.price?.display,
        source: openrentResults[0]?.metadata?.source,
        features: openrentResults[0]?.features?.slice(0, 3)
      });
    }
  } catch (error) {
    console.error('❌ Openrent scraping failed:', error);
  }
  console.log('');

  // Test 5: Enhanced search with real data
  console.log('🚀 Test 5: Enhanced Search with Real Data');
  try {
    const enhancedResults = await propertyMCP.searchPropertiesWithRealData('London', { 
      minPrice: 1000, 
      maxPrice: 3000,
      bedrooms: 1 
    }, true);
    console.log(`✅ Enhanced search successful: ${enhancedResults.length} properties`);
    if (enhancedResults.length > 0) {
      console.log('Sample enhanced property:', {
        id: enhancedResults[0]?.id,
        title: enhancedResults[0]?.title,
        price: enhancedResults[0]?.price?.display,
        searchScore: enhancedResults[0]?.metadata?.searchScore,
        source: enhancedResults[0]?.metadata?.source
      });
    }
  } catch (error) {
    console.error('❌ Enhanced search failed:', error);
  }
  console.log('');

  // Test 6: Paginated scraping
  console.log('📄 Test 6: Paginated Scraping');
  try {
    const paginatedResults = await propertyMCP.scrapeWithPagination('openrent', 'London', 2);
    console.log(`✅ Paginated scraping successful: ${paginatedResults.length} properties`);
    if (paginatedResults.length > 0) {
      console.log('Sample paginated property:', {
        id: paginatedResults[0]?.id,
        title: paginatedResults[0]?.title,
        price: paginatedResults[0]?.price?.display,
        source: paginatedResults[0]?.metadata?.source
      });
    }
  } catch (error) {
    console.error('❌ Paginated scraping failed:', error);
  }
  console.log('');

  // Test 7: Cache operations
  console.log('💾 Test 7: Cache Operations');
  try {
    const testProperties = [
      {
        id: 'test-1',
        title: 'Test Property 1',
        price: { amount: 1500, currency: 'GBP', type: 'rent' as const, display: '£1,500 pcm' },
        location: { address: 'Test Address', city: 'London', postcode: 'SW1A 1AA' },
        specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'Flat' },
        features: ['Furnished'],
        description: 'Test description',
        images: [],
        agent: { name: 'Test Agent', company: 'Test Company' },
        amenities: { nearby: [], onsite: [] },
        status: 'available' as const,
        metadata: { createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), searchScore: 85, viewCount: 0, source: 'test' }
      }
    ];

    await propertyMCP.updatePropertyCache('test', testProperties);
    console.log('✅ Cache update successful');

    // Test cache retrieval
    const cachedProperties = await propertyMCP.getRealPropertyData('test', false);
    console.log(`✅ Cache retrieval successful: ${cachedProperties.length} properties`);
  } catch (error) {
    console.error('❌ Cache operations failed:', error);
  }
  console.log('');

  // Test 8: Property by ID
  console.log('🔍 Test 8: Property by ID');
  try {
    const property = await propertyMCP.getPropertyById('rightmove-1');
    if (property) {
      console.log('✅ Property by ID successful:', {
        id: property.id,
        title: property.title,
        price: property.price.display,
        source: property.metadata.source
      });
    } else {
      console.log('⚠️ Property not found');
    }
  } catch (error) {
    console.error('❌ Property by ID failed:', error);
  }
  console.log('');

  console.log('✅ PropertyDataMCP Testing Completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPropertyDataMCP().catch(console.error);
}

export { testPropertyDataMCP }; 