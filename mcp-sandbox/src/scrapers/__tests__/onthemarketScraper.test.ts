import { parseOnTheMarketListings, scrapeOnTheMarketWithQuery } from '../onthemarketScraper';
import { parseSearchQuery, buildOnTheMarketUrl } from '../../utils/queryParser';

describe('OnTheMarket Scraper', () => {
  describe('URL Building', () => {
    test('should build correct URL for basic query', () => {
      const query = parseSearchQuery('2 bedroom flat in London');
      const url = buildOnTheMarketUrl(query);
      
      expect(url).toContain('onthemarket.com');
      expect(url).toContain('to-rent');
      expect(url).toContain('flats-apartments'); // Property type is now in URL path
      expect(url).toContain('london');
      expect(url).toContain('min-bedrooms=2');
      expect(url).toContain('max-bedrooms=2');
      expect(url).toContain('view=map-list');
    });

    test('should build URL with price range', () => {
      const query = parseSearchQuery('3 bed house in Manchester under 2000');
      const url = buildOnTheMarketUrl(query);
      
      expect(url).toContain('manchester');
      expect(url).toContain('houses'); // Property type is now in URL path
      expect(url).toContain('min-bedrooms=3');
      expect(url).toContain('max-price=2000');
    });

    test('should handle price range with min and max', () => {
      const query = parseSearchQuery('studio between 1000 and 1500');
      const url = buildOnTheMarketUrl(query);
      
      expect(url).toContain('min-price=1000');
      expect(url).toContain('max-price=1500');
    });
  });

  describe('HTML Parsing', () => {
    test('should parse empty HTML gracefully', () => {
      const html = '<html><body></body></html>';
      const properties = parseOnTheMarketListings(html);
      
      expect(properties).toEqual([]);
    });

    test('should parse sample property HTML', () => {
      const sampleHtml = `
        <div class="property-result">
          <h3><a href="/details/property123">2 Bedroom Flat, London</a></h3>
          <div class="property-address">Camden, London NW1</div>
          <div class="property-price">£2,500 pcm</div>
          <div class="property-details">
            <li>2 bedrooms</li>
            <li>1 bathroom</li>
          </div>
          <div class="property-description">Beautiful modern flat in Camden</div>
          <img src="/images/property123.jpg" alt="Property photo" />
        </div>
      `;
      
      const properties = parseOnTheMarketListings(sampleHtml);
      
      expect(properties).toHaveLength(1);
      
      const property = properties[0];
      expect(property.title).toBe('2 Bedroom Flat, London');
      expect(property.address).toBe('Camden, London NW1');
      expect(property.price).toBe(2500);
      expect(property.priceUnit).toBe('pcm');
      expect(property.bedrooms).toBe(2);
      expect(property.bathrooms).toBe(1);
      expect(property.propertyType).toContain('2');
      expect(property.description).toBe('Beautiful modern flat in Camden');
      expect(property.listingUrl).toContain('onthemarket.com/details/property123');
      expect(property.images).toHaveLength(1);
      expect(property.images[0]).toContain('onthemarket.com/images/property123.jpg');
    });

    test('should handle multiple property cards', () => {
      const multiplePropertiesHtml = `
        <div class="property-result">
          <h3><a href="/details/prop1">1 Bed Flat, Area 1</a></h3>
          <div class="property-price">£1,800 pcm</div>
        </div>
        <div class="property-result">
          <h3><a href="/details/prop2">3 Bed House, Area 2</a></h3>
          <div class="property-price">£3,200 pcm</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(multiplePropertiesHtml);
      
      expect(properties).toHaveLength(2);
      expect(properties[0].listingUrl).toContain('prop1');
      expect(properties[1].listingUrl).toContain('prop2');
    });

    test('should handle different price units', () => {
      const htmlWithDifferentPrices = `
        <div class="property-result">
          <h3><a href="/details/weekly">Weekly Rental</a></h3>
          <div class="property-price">£500 pw</div>
        </div>
        <div class="property-result">
          <h3><a href="/details/sale">For Sale Property</a></h3>
          <div class="property-price">£450,000</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(htmlWithDifferentPrices);
      
      expect(properties).toHaveLength(2);
      expect(properties[0].priceUnit).toBe('pw');
      expect(properties[1].priceUnit).toBe('total');
    });

    test('should deduplicate identical URLs', () => {
      const duplicateHtml = `
        <div class="property-result">
          <h3><a href="/details/same-property">Property 1</a></h3>
          <div class="property-price">£2,000 pcm</div>
        </div>
        <div class="property-result">
          <h3><a href="/details/same-property">Property 1 Again</a></h3>
          <div class="property-price">£2,000 pcm</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(duplicateHtml);
      
      expect(properties).toHaveLength(1);
    });

    test('should skip properties missing essential data', () => {
      const incompleteHtml = `
        <div class="property-result">
          <!-- Missing href link -->
          <h3><a>No Link Property</a></h3>
          <div class="property-price">£2,000 pcm</div>
        </div>
        <div class="property-result">
          <h3><a href="/details/valid">Valid Property</a></h3>
          <div class="property-price">£1,800 pcm</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(incompleteHtml);
      
      expect(properties).toHaveLength(1);
      expect(properties[0].listingUrl).toContain('valid');
    });
  });

  describe('Property Type Extraction', () => {
    test('should extract property types from titles', () => {
      const testCases = [
        { title: '2 bedroom flat in London', expected: '2 bedroom flat' },
        { title: '3 bed house Camden', expected: '3 bed house' },
        { title: 'Studio apartment available', expected: 'studio' },
        { title: 'Beautiful penthouse suite', expected: 'penthouse' },
        { title: 'Terraced house with garden', expected: 'terraced house' }
      ];

      testCases.forEach(({ title, expected }) => {
        const html = `
          <div class="property-result">
            <h3><a href="/details/test">${title}</a></h3>
            <div class="property-price">£2,000 pcm</div>
          </div>
        `;
        
        const properties = parseOnTheMarketListings(html);
        expect(properties[0].propertyType.toLowerCase()).toContain(expected.toLowerCase().split(' ')[0]);
      });
    });
  });

  describe('Agent Information', () => {
    test('should extract agent information when available', () => {
      const htmlWithAgent = `
        <div class="property-result">
          <h3><a href="/details/agent-test">Property with Agent</a></h3>
          <div class="property-price">£2,000 pcm</div>
          <div class="agent-name">Premium Estate Agents</div>
          <div class="agent-phone">020 1234 5678</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(htmlWithAgent);
      
      expect(properties[0].agent.name).toBe('Premium Estate Agents');
      expect(properties[0].agent.contact).toBe('020 1234 5678');
    });

    test('should default to On the Market when no agent info', () => {
      const htmlNoAgent = `
        <div class="property-result">
          <h3><a href="/details/no-agent">Property without Agent</a></h3>
          <div class="property-price">£2,000 pcm</div>
        </div>
      `;
      
      const properties = parseOnTheMarketListings(htmlNoAgent);
      
      expect(properties[0].agent.name).toBe('On the Market');
      expect(properties[0].agent.contact).toBe('');
    });
  });
});

// Integration test (commented out to avoid actual HTTP requests in unit tests)
/*
describe('OnTheMarket Integration', () => {
  test('should scrape live data', async () => {
    const properties = await scrapeOnTheMarketWithQuery('2 bedroom flat in London');
    
    expect(Array.isArray(properties)).toBe(true);
    
    if (properties.length > 0) {
      const property = properties[0];
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('price');
      expect(property).toHaveProperty('listingUrl');
      expect(property.listingUrl).toContain('onthemarket.com');
    }
  }, 30000); // 30 second timeout for network requests
});
*/ 