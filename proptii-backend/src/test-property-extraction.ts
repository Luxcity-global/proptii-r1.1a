import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const BASE_URL = 'http://localhost:3000';

async function testPropertyExtraction() {
  console.log('🧪 Testing Property Extraction Service');
  console.log('=====================================\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/api/property-extraction/health`);
    console.log('✅ Health Check:', healthResponse.data);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.response?.data || error.message);
    return;
  }

  // Test 2: Azure AI Connection Test
  console.log('\n2. Testing Azure AI Connection...');
  try {
    const connectionResponse = await axios.get(`${BASE_URL}/api/property-extraction/test`);
    console.log('✅ Azure AI Connection:', connectionResponse.data);
  } catch (error) {
    console.error('❌ Azure AI Connection Failed:', error.response?.data || error.message);
    console.log('⚠️  Make sure Azure AI Foundry is properly configured');
    return;
  }

  // Test 3: Natural Language Query
  console.log('\n3. Testing Natural Language Query...');
  try {
    const nlQueryResponse = await axios.post(`${BASE_URL}/api/property-extraction/natural-language`, {
      query: '2 bed flats in Manchester under £200k'
    });
    console.log('✅ Natural Language Query:', {
      total_results: nlQueryResponse.data.search_metadata.total_results,
      query_understood: nlQueryResponse.data.search_metadata.query_understood,
      extraction_quality: nlQueryResponse.data.search_metadata.extraction_quality,
      properties_found: nlQueryResponse.data.properties.length
    });
    
    if (nlQueryResponse.data.properties.length > 0) {
      console.log('📋 Sample Property:', {
        title: nlQueryResponse.data.properties[0].title,
        price: nlQueryResponse.data.properties[0].price,
        location: nlQueryResponse.data.properties[0].location,
        confidence: nlQueryResponse.data.properties[0].extraction_confidence
      });
    }
  } catch (error) {
    console.error('❌ Natural Language Query Failed:', error.response?.data || error.message);
  }

  // Test 4: Web Content Extraction
  console.log('\n4. Testing Web Content Extraction...');
  try {
    const webContentResponse = await axios.post(`${BASE_URL}/api/property-extraction/web-content`, {
      web_content: `
        <div class="property-listing">
          <h2>Beautiful 3-bedroom house in Manchester</h2>
          <p class="price">£250,000</p>
          <p class="location">Manchester, M1 1AA</p>
          <p class="description">Stunning 3-bedroom house with garden and garage. Features include en-suite bathroom, modern kitchen, and off-street parking.</p>
          <ul class="features">
            <li>Garden</li>
            <li>Garage</li>
            <li>En-suite</li>
            <li>Off-street parking</li>
          </ul>
          <div class="agent">
            <p>Contact: John Smith</p>
            <p>Phone: 0161 123 4567</p>
            <p>Email: john@example.com</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Web Content Extraction:', {
      total_results: webContentResponse.data.search_metadata.total_results,
      extraction_quality: webContentResponse.data.search_metadata.extraction_quality,
      properties_found: webContentResponse.data.properties.length
    });
    
    if (webContentResponse.data.properties.length > 0) {
      const property = webContentResponse.data.properties[0];
      console.log('📋 Extracted Property:', {
        title: property.title,
        price: property.price,
        price_type: property.price_type,
        location: property.location,
        postcode: property.postcode,
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        features: property.features,
        agent_name: property.agent_info.name,
        confidence: property.extraction_confidence
      });
    }
  } catch (error) {
    console.error('❌ Web Content Extraction Failed:', error.response?.data || error.message);
  }

  // Test 5: General Extraction
  console.log('\n5. Testing General Extraction...');
  try {
    const generalResponse = await axios.post(`${BASE_URL}/api/property-extraction/extract`, {
      web_content: '2 bed flat in London, £300,000, near transport links',
      user_query: 'Find affordable flats in London',
      extraction_mode: 'single_property'
    });
    
    console.log('✅ General Extraction:', {
      total_results: generalResponse.data.search_metadata.total_results,
      extraction_quality: generalResponse.data.search_metadata.extraction_quality,
      properties_found: generalResponse.data.properties.length
    });
  } catch (error) {
    console.error('❌ General Extraction Failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 Property Extraction Testing Complete!');
}

// Run the tests
testPropertyExtraction().catch(console.error); 