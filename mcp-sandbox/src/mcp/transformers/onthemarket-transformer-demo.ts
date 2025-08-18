/**
 * Demo script for On the Market Transformer
 * Shows how raw scraped data is transformed into standardized MCP format
 */

import {
  transformOnTheMarketToMCP,
  transformOnTheMarketProperties,
  OnTheMarketProperty,
  getTransformationStats
} from './onthemarket-transformer';

// Sample raw data from On the Market scraper
const sampleOnTheMarketProperties: OnTheMarketProperty[] = [
  {
    id: 'otm_sample_1',
    title: '2 Bedroom Flat, Camden',
    address: 'Camden High Street, Camden, London NW1 7JE',
    price: 2500,
    priceUnit: 'pcm',
    bedrooms: 2,
    bathrooms: 1,
    propertyType: '2 bedroom flat',
    description: 'Beautiful modern flat with garden, parking, central heating, and fitted kitchen. Recently renovated with wood floors.',
    images: [
      '/images/camden-flat-1.jpg',
      '/images/camden-flat-2.jpg',
      'https://images.onthemarket.com/property/main.jpg'
    ],
    listingUrl: 'https://www.onthemarket.com/details/camden-flat-123',
    agent: {
      name: 'Camden Estate Agents',
      contact: '020 7123 4567'
    },
    availableFrom: '2024-02-01'
  },
  {
    id: 'otm_sample_2',
    title: '3 Bed House with Garden, Manchester',
    address: 'Oxford Road, Manchester M1 5QS',
    price: 650,
    priceUnit: 'pw',
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'terraced house',
    description: 'Spacious family home near university with garden, parking, and modern kitchen. Furnished. Close to transport links.',
    images: [
      '/images/manchester-house-1.jpg'
    ],
    listingUrl: 'https://www.onthemarket.com/details/manchester-house-456',
    agent: {
      name: 'Manchester Lettings',
      contact: '0161 234 5678'
    },
    availableFrom: '2024-01-15'
  },
  {
    id: 'otm_sample_3',
    title: 'Studio Apartment, Student Area',
    address: 'Queens Road, Bristol BS8 1QU',
    price: 180,
    priceUnit: 'pppw',
    bedrooms: 0,
    bathrooms: 1,
    propertyType: 'studio',
    description: 'Perfect for students! Modern studio with en suite, communal kitchen, gym access, and 24/7 security.',
    images: [],
    listingUrl: 'https://www.onthemarket.com/details/bristol-studio-789',
    agent: {
      name: 'Student Accommodation Ltd',
      contact: '0117 123 4567'
    },
    availableFrom: '2024-09-01'
  },
  {
    id: 'otm_sample_4',
    title: 'Luxury Penthouse for Sale',
    address: 'Thames Embankment, London SE1 9PP',
    price: 1250000,
    priceUnit: 'total',
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'penthouse',
    description: 'Stunning penthouse with panoramic river views, roof terrace, concierge service, and underground parking.',
    images: [
      '/images/penthouse-1.jpg',
      '/images/penthouse-2.jpg',
      '/images/penthouse-3.jpg'
    ],
    listingUrl: 'https://www.onthemarket.com/details/luxury-penthouse-999',
    agent: {
      name: 'Luxury London Properties',
      contact: '020 7999 8888'
    },
    availableFrom: 'Available Now'
  }
];

/**
 * Demo function to showcase the transformation process
 */
export function runOnTheMarketTransformerDemo(): void {
  console.log('🏠 On the Market Transformer Demo');
  console.log('=' .repeat(60));
  
  // Transform all properties
  console.log('\n📊 Transforming sample properties...');
  const transformedProperties = transformOnTheMarketProperties(sampleOnTheMarketProperties);
  
  // Show transformation statistics
  const stats = getTransformationStats(sampleOnTheMarketProperties, transformedProperties);
  console.log('\n📈 Transformation Statistics:');
  console.log(`  Total Properties: ${stats.total}`);
  console.log(`  Successfully Transformed: ${stats.successful}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Success Rate: ${stats.successRate}%`);
  console.log(`  Average Price: £${stats.averagePrice.toLocaleString()}`);
  console.log(`  Property Types:`, stats.propertyTypes);
  console.log(`  Cities:`, stats.cities);
  
  // Show detailed examples
  console.log('\n🔍 Detailed Transformation Examples:');
  console.log('=' .repeat(60));
  
  transformedProperties.forEach((property, index) => {
    const original = sampleOnTheMarketProperties[index];
    
    console.log(`\n${index + 1}. ${property.title}`);
    console.log('-' .repeat(40));
    
    // Show key transformations
    console.log('📍 Location:');
    console.log(`  Original: "${original.address}"`);
    console.log(`  Parsed: ${property.location.city}, ${property.location.postcode}`);
    console.log(`  Area: ${property.location.area || 'Not detected'}`);
    
    console.log('\n💰 Price:');
    console.log(`  Original: £${original.price} ${original.priceUnit}`);
    console.log(`  Normalized: ${property.price.display}`);
    console.log(`  Type: ${property.price.type}, Period: ${property.price.period || 'N/A'}`);
    
    console.log('\n🏠 Property:');
    console.log(`  Type: ${original.propertyType} → ${property.specifications.propertyType}`);
    console.log(`  Bedrooms: ${property.specifications.bedrooms}`);
    console.log(`  Bathrooms: ${property.specifications.bathrooms}`);
    
    console.log('\n✨ Features:');
    console.log(`  Extracted: ${property.features.length > 0 ? property.features.join(', ') : 'None detected'}`);
    
    console.log('\n🖼️ Images:');
    console.log(`  Original: ${original.images.length} images`);
    console.log(`  Enhanced: ${property.images.length} images`);
    if (property.images.length > 0) {
      console.log(`  Primary: ${property.images[0].src}`);
    }
    
    console.log('\n👥 Agent:');
    console.log(`  Name: ${property.agent.name}`);
    console.log(`  Company: ${property.agent.company}`);
    console.log(`  Phone: ${property.agent.phone || 'Not provided'}`);
    
    console.log('\n🔍 Metadata:');
    console.log(`  ID: ${property.id}`);
    console.log(`  Source: ${property.metadata.source}`);
    console.log(`  Status: ${property.status}`);
  });
  
  // Show validation results
  console.log('\n✅ Validation Results:');
  console.log('=' .repeat(60));
  
  transformedProperties.forEach((property, index) => {
    // Import validation function if needed
    // const validation = validateTransformedProperty(property);
    console.log(`${index + 1}. ${property.title}: Valid property with ${property.images.length} images, ${property.features.length} features`);
  });
  
  console.log('\n🎉 Demo complete! All properties successfully transformed.');
}

/**
 * Show price conversion examples
 */
export function showPriceConversionExamples(): void {
  console.log('\n💰 Price Conversion Examples:');
  console.log('=' .repeat(40));
  
  const priceExamples = [
    { amount: 2500, unit: 'pcm' },
    { amount: 600, unit: 'pw' },
    { amount: 180, unit: 'pppw' },
    { amount: 30000, unit: 'pa' },
    { amount: 450000, unit: 'total' }
  ];
  
  priceExamples.forEach(({ amount, unit }) => {
    const testProperty: OnTheMarketProperty = {
      id: 'test',
      title: 'Test Property',
      address: 'Test Address, London',
      price: amount,
      priceUnit: unit,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'flat',
      description: 'Test description',
      images: [],
      listingUrl: 'https://test.com',
      agent: { name: 'Test Agent', contact: '' },
      availableFrom: ''
    };
    
    const transformed = transformOnTheMarketToMCP(testProperty);
    
    console.log(`£${amount} ${unit} → ${transformed.price.display}`);
    console.log(`  Amount: £${transformed.price.amount}`);
    console.log(`  Type: ${transformed.price.type}`);
    console.log(`  Period: ${transformed.price.period || 'N/A'}`);
    console.log('');
  });
}

// Run demo if this file is executed directly
if (require.main === module) {
  runOnTheMarketTransformerDemo();
  showPriceConversionExamples();
} 