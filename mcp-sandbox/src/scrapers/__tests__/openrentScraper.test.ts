import { parseOpenrentListings, extractPropertyFromHtml } from '../openrentScraper';
import { Property } from '../openrentScraper';

describe('Openrent Scraper Tests', () => {
  describe('parseOpenrentListings', () => {
    it('should parse a complete property listing correctly', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">2 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Beautiful 2-bedroom flat in central London</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£2,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>2 Beds</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
          <div class="lpcc">
            <div class="lpc listingPic">
              <img class="propertyPic or-lazy-image" data-src="//test-image.jpg" />
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'https://www.openrent.co.uk/property-to-rent/london/test-property/123456',
        title: '2 Bed Flat, Test Street, W1',
        address: 'Test Street, W1',
        price: 2500,
        priceUnit: 'pcm',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: '2 Bed Flat',
        description: 'Beautiful 2-bedroom flat in central London',
        images: ['//test-image.jpg'],
        listingUrl: 'https://www.openrent.co.uk/property-to-rent/london/test-property/123456',
        agent: { name: 'OpenRent', contact: '' },
        availableFrom: '',
      });
    });

    it('should handle per week pricing correctly', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Test description</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="piw pl-title"><h2>£500 <span>per week</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(500);
      expect(result[0].priceUnit).toBe('pw');
    });

    it('should handle studio/shared flats with 0 bedrooms', () => {
      const html = `
        <a href="/property-to-rent/london/studio-test/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">Studio Flat, Test Street, W1</span>
                <p class="listing-desc">Studio apartment</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£400 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].bedrooms).toBe(0);
      expect(result[0].bathrooms).toBe(1);
      expect(result[0].title).toContain('Studio');
    });

    it('should handle missing images gracefully', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Test description</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual([]);
    });

    it('should handle missing href attribute', () => {
      const html = `
        <div class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
          </div>
        </div>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(0);
    });

    it('should handle missing title gracefully', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('');
      expect(result[0].address).toBe('');
    });

    it('should handle missing price gracefully', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Test description</p>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(0);
    });

    it('should handle missing description gracefully', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('');
    });

    it('should handle multiple images correctly', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">2 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Test description</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£2,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>2 Beds</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
          <div class="lpcc">
            <div class="lpc listingPic">
              <img class="propertyPic or-lazy-image" data-src="//image1.jpg" />
              <img class="propertyPic or-lazy-image" data-src="//image2.jpg" />
              <img class="propertyPic or-lazy-image" src="//image3.jpg" />
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['//image1.jpg', '//image2.jpg', '//image3.jpg']);
    });

    it('should handle duplicate listings by URL', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">1 Bed Flat, Test Street, W1</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£1,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>1 Bed</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1); // Only one should be returned due to deduplication
    });

    it('should handle empty HTML gracefully', () => {
      const result = parseOpenrentListings('');
      expect(result).toEqual([]);
    });

    it('should handle HTML with no property listings', () => {
      const html = '<div class="other-content">No properties here</div>';
      const result = parseOpenrentListings(html);
      expect(result).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<div class="pli clearfix"><a href="/test">Incomplete';
      const result = parseOpenrentListings(html);
      expect(result).toEqual([]);
    });

    it('should extract address from title correctly', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">3 Bed House, Baker Street, NW1</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£3,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>3 Beds</span></li>
                <li><span>2 Baths</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('Baker Street, NW1');
    });

    it('should handle title without comma correctly', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">Studio Flat</span>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£800 <span>per month</span></h2></div>
              </div>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('');
    });
  });

  describe('extractPropertyFromHtml', () => {
    it('should extract property details from individual listing page', () => {
      const html = `
        <html>
          <head><title>2 Bed Flat, Test Street, W1</title></head>
          <body>
            <h1>2 Bed Flat, Test Street, W1</h1>
            <p class="mb-1 fs-d-3 fw-semibold lh-1">£2,500.00</p>
            <p class="mb-0 fs-body-small-1 lh-1 text-secondary">per month</p>
            <dl class="or-legacy-feature-table grid column-gap-1 row-gap-0">
              <div>
                <dt>Bedrooms</dt>
                <dd>2</dd>
              </div>
              <div>
                <dt>Bathrooms</dt>
                <dd>1</dd>
              </div>
            </dl>
            <div class="property-description">Beautiful 2-bedroom flat in central London</div>
            <img src="//test-image1.jpg" />
            <img src="//test-image2.jpg" />
            <div>Available: Today</div>
          </body>
        </html>
      `;

      const result = extractPropertyFromHtml(html, 'https://www.openrent.co.uk/test');

      expect(result).toEqual({
        id: 'https://www.openrent.co.uk/test',
        title: '2 Bed Flat, Test Street, W1',
        address: 'Test Street, W1',
        price: 2500,
        priceUnit: 'pcm',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Flat',
        description: 'Beautiful 2-bedroom flat in central London',
        images: ['//test-image1.jpg', '//test-image2.jpg'],
        listingUrl: 'https://www.openrent.co.uk/test',
        agent: { name: 'OpenRent', contact: '' },
        availableFrom: 'Today',
      });
    });

    it('should handle missing fields in individual listing page', () => {
      const html = `
        <html>
          <head><title>Test Property</title></head>
          <body>
            <h1>Test Property</h1>
            <p class="mb-1 fs-d-3 fw-semibold lh-1">£1,500.00</p>
          </body>
        </html>
      `;

      const result = extractPropertyFromHtml(html, 'https://www.openrent.co.uk/test');

      expect(result).toEqual({
        id: 'https://www.openrent.co.uk/test',
        title: 'Test Property',
        address: '',
        price: 1500,
        priceUnit: 'pcm',
        bedrooms: 0,
        bathrooms: 0,
        propertyType: '',
        description: '',
        images: [],
        listingUrl: 'https://www.openrent.co.uk/test',
        agent: { name: 'OpenRent', contact: '' },
        availableFrom: '',
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate property schema structure', () => {
      const html = `
        <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
          <div class="listing-info">
            <div class="location-description">
              <div class="ldc">
                <span class="banda pt listing-title">2 Bed Flat, Test Street, W1</span>
                <p class="listing-desc">Test description</p>
              </div>
            </div>
            <div class="price-location clearfix">
              <div class="pl-cont">
                <div class="pim pl-title"><h2>£2,500 <span>per month</span></h2></div>
              </div>
            </div>
            <div class="location-detail">
              <ul class="lic clearfix">
                <li><span>2 Beds</span></li>
                <li><span>1 Bath</span></li>
              </ul>
            </div>
          </div>
        </a>
      `;

      const result = parseOpenrentListings(html);

      expect(result).toHaveLength(1);
      const property = result[0];

      // Check all required fields exist
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('address');
      expect(property).toHaveProperty('price');
      expect(property).toHaveProperty('priceUnit');
      expect(property).toHaveProperty('bedrooms');
      expect(property).toHaveProperty('bathrooms');
      expect(property).toHaveProperty('propertyType');
      expect(property).toHaveProperty('description');
      expect(property).toHaveProperty('images');
      expect(property).toHaveProperty('listingUrl');
      expect(property).toHaveProperty('agent');
      expect(property).toHaveProperty('availableFrom');

      // Check data types
      expect(typeof property.id).toBe('string');
      expect(typeof property.title).toBe('string');
      expect(typeof property.address).toBe('string');
      expect(typeof property.price).toBe('number');
      expect(typeof property.priceUnit).toBe('string');
      expect(typeof property.bedrooms).toBe('number');
      expect(typeof property.bathrooms).toBe('number');
      expect(typeof property.propertyType).toBe('string');
      expect(typeof property.description).toBe('string');
      expect(Array.isArray(property.images)).toBe(true);
      expect(typeof property.listingUrl).toBe('string');
      expect(typeof property.agent).toBe('object');
      expect(typeof property.availableFrom).toBe('string');
    });

    it('should handle price parsing edge cases', () => {
      const testCases = [
        { input: '£2,500 <span>per month</span>', expected: 2500 },
        { input: '£1,234.56 <span>per month</span>', expected: 1234 },
        { input: '£500 <span>per week</span>', expected: 500 },
        { input: '£1,000 <span>pw</span>', expected: 1000 },
        { input: 'Price on application', expected: 0 },
        { input: '', expected: 0 },
      ];

      testCases.forEach(({ input, expected }) => {
        const html = `
          <a href="/property-to-rent/london/test-property/123456" class="pli clearfix">
            <div class="listing-info">
              <div class="location-description">
                <div class="ldc">
                  <span class="banda pt listing-title">Test Property</span>
                </div>
              </div>
              <div class="price-location clearfix">
                <div class="pl-cont">
                  <div class="pim pl-title"><h2>${input}</h2></div>
                </div>
              </div>
            </div>
          </a>
        `;

        const result = parseOpenrentListings(html);
        expect(result[0]?.price).toBe(expected);
      });
    });
  });
}); 