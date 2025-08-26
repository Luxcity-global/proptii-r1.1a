const axios = require('axios');

async function testFullRequest() {
  try {
    console.log('Testing full backend request...');
    
    const response = await axios.post('http://localhost:3001/scrape', {
      url: 'https://www.onthemarket.com/to-rent/property/nottingham/?min-bedrooms=3&max-bedrooms=3&view=grid'
    });
    
    console.log('Response status:', response.status);
    console.log('Number of properties found:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('\nFirst property details:');
      console.log('Title:', response.data[0].title);
      console.log('Price:', response.data[0].price);
      console.log('Agent:', response.data[0].agent.name);
      console.log('Agent Email:', response.data[0].agent.email);
      console.log('Agent Website:', response.data[0].agent.website);
    }
    
  } catch (error) {
    console.error('Error testing backend:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testFullRequest(); 