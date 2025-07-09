import { transformOpenrentToMCP, transformOpenrentProperties, getTransformationStats, OpenrentProperty } from './schemaTransformer';

// Sample Openrent properties from our scraper
const sampleOpenrentProperties: OpenrentProperty[] = [
  {
    id: 'https://www.openrent.co.uk/property-to-rent/london/2-bed-flat-bramley-court-br6/1606882',
    title: '2 Bed Flat, Bramley Court, BR6',
    address: 'Bramley Court, BR6',
    price: 1800,
    priceUnit: 'pcm',
    bedrooms: 2,
    bathrooms: 2,
    propertyType: '2 Bed Flat',
    description: 'Property: 2 Bed Flat, Bramley Court, BR6, Available to Rent in Orpington. No admin fees. £1,800.00 p/m. Furnished with parking.',
    images: [
      '//imagescdn.openrent.co.uk/listings/1606882/o_1intr4mqpbq711v915uleo2jf00.JPG',
      '//imagescdn.openrent.co.uk/listings/1606882/o_1intr4mt81oek16o777n10n715bv1.JPG'
    ],
    listingUrl: 'https://www.openrent.co.uk/property-to-rent/orpington/2-bed-flat-bramley-court-br6/1606882',
    agent: {
      name: 'OpenRent',
      contact: ''
    },
    availableFrom: 'Today'
  },
  {
    id: 'https://www.openrent.co.uk/property-to-rent/london/1-bed-flat-london-e19/2535936',
    title: '1 Bed Flat, London, E19',
    address: 'London, E19',
    price: 459,
    priceUnit: 'pw',
    bedrooms: 1,
    bathrooms: 1,
    propertyType: '1 Bed Flat',
    description: 'We are proud to offer this delightful 1 bedroom, 1 bathroom flat in a great location. Available to move in from 30 June 2025.',
    images: [],
    listingUrl: 'https://www.openrent.co.uk/property-to-rent/london/1-bed-flat-london-e19/2535936',
    agent: {
      name: 'OpenRent',
      contact: ''
    },
    availableFrom: ''
  },
  {
    id: 'https://www.openrent.co.uk/property-to-rent/london/3-bed-penthouse-bull-inn-court-wc2r/2524377',
    title: '3 Bed Penthouse, Bull Inn Court, WC2R',
    address: 'Bull Inn Court, WC2R',
    price: 1846,
    priceUnit: 'pw',
    bedrooms: 3,
    bathrooms: 3,
    propertyType: '3 Bed Penthouse',
    description: 'We are proud to offer this delightful 3 bedroom, 3 bathroom penthouse in a great location. Available to move in from 23 June 2025.',
    images: [
      '//imagescdn.openrent.co.uk/listings/2524377/o_1iu4bdfoa1onp2vr1as01d01ec20.JPG_homepage.JPG'
    ],
    listingUrl: 'https://www.openrent.co.uk/property-to-rent/london/3-bed-penthouse-bull-inn-court-wc2r/2524377',
    agent: {
      name: 'OpenRent',
      contact: ''
    },
    availableFrom: ''
  }
];

async function testSchemaTransformer() {
  console.log('🧪 Testing Schema Transformer with Sample Openrent Data\n');

  // Test single property transformation
  console.log('📋 Single Property Transformation:');
  const singleProperty = sampleOpenrentProperties[0];
  const transformedSingle = transformOpenrentToMCP(singleProperty);
  
  console.log('Original:', {
    title: singleProperty.title,
    price: `£${singleProperty.price} ${singleProperty.priceUnit}`,
    address: singleProperty.address,
    bedrooms: singleProperty.bedrooms,
    bathrooms: singleProperty.bathrooms
  });
  
  console.log('Transformed:', {
    title: transformedSingle.title,
    price: transformedSingle.price.display,
    location: {
      address: transformedSingle.location.address,
      city: transformedSingle.location.city,
      postcode: transformedSingle.location.postcode
    },
    specifications: {
      bedrooms: transformedSingle.specifications.bedrooms,
      bathrooms: transformedSingle.specifications.bathrooms,
      propertyType: transformedSingle.specifications.propertyType
    },
    features: transformedSingle.features,
    images: transformedSingle.images.length,
    agent: transformedSingle.agent.name
  });

  console.log('\n📊 Multiple Properties Transformation:');
  const transformedProperties = transformOpenrentProperties(sampleOpenrentProperties);
  const stats = getTransformationStats(sampleOpenrentProperties, transformedProperties);
  
  console.log('Transformation Statistics:', {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    successRate: `${stats.successRate.toFixed(1)}%`,
    averagePrice: `£${stats.averagePrice}`,
    propertyTypes: stats.propertyTypes,
    cities: stats.cities
  });

  console.log('\n🏠 Sample Transformed Properties:');
  transformedProperties.forEach((property, index) => {
    console.log(`${index + 1}. ${property.title}`);
    console.log(`   Price: ${property.price.display}`);
    console.log(`   Location: ${property.location.city} (${property.location.postcode || 'No postcode'})`);
    console.log(`   Type: ${property.specifications.propertyType}`);
    console.log(`   Features: ${property.features.join(', ') || 'None'}`);
    console.log(`   Images: ${property.images.length}`);
    console.log('');
  });

  console.log('✅ Schema Transformer Test Completed Successfully!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSchemaTransformer().catch(console.error);
}

export { testSchemaTransformer }; 