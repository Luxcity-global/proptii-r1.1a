import { describe, it, expect } from 'vitest';
import { 
  extractMonthlyPrice, 
  extractBedrooms, 
  categorizePropertyType,
  extractFurnishingStatus,
  hasParkingFeature,
  hasBalconyOrGardenFeature,
  hasPetFriendlyFeature,
  extractPetPolicy,
  hasBillsIncludedFeature,
  extractListingDateEpoch,
} from '../propertyParsers';
import { 
  matchPrice, 
  matchBedrooms, 
  matchPropertyType, 
  matchKeywords, 
  sortProperties,
  matchFurnishing,
  matchParking,
  matchBalconyOrGarden,
  matchPetFriendly,
  matchBillsIncluded,
} from '../filterPredicates';
import type { Property } from '../../types/property';

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  title: '2 bedroom flat to rent',
  price: '£2,000 pcm',
  location: 'Camden, London NW1',
  bedrooms: 2,
  propertyType: 'Flat',
  imageUrls: ['https://example.com/img1.jpg'],
  agent: {
    name: 'Test Agent',
    email: 'agent@example.com',
  },
  ...overrides,
});

describe('propertyParsers', () => {
  describe('extractMonthlyPrice', () => {
    it('extracts numeric amount from pcm string', () => {
      expect(extractMonthlyPrice('£2,500 pcm')).toBe(2500);
      expect(extractMonthlyPrice('£1,850pcm')).toBe(1850);
      expect(extractMonthlyPrice('£3,200 pcm (£738 pw)')).toBe(3200);
    });

    it('converts weekly price (pw) to monthly equivalent (pcm)', () => {
      // £500 pw * 52 / 12 = 2166.66 -> 2167
      expect(extractMonthlyPrice('£500 pw')).toBe(2167);
      expect(extractMonthlyPrice('(£600 pw)')).toBe(2600);
    });

    it('handles raw numeric strings without pcm or pw suffix', () => {
      expect(extractMonthlyPrice('£450,000')).toBe(450000);
      expect(extractMonthlyPrice('1500')).toBe(1500);
    });

    it('returns null for unpriced, POA, or invalid strings', () => {
      expect(extractMonthlyPrice('Price on application')).toBeNull();
      expect(extractMonthlyPrice('POA')).toBeNull();
      expect(extractMonthlyPrice('')).toBeNull();
      expect(extractMonthlyPrice(undefined)).toBeNull();
    });
  });

  describe('extractBedrooms', () => {
    it('handles numeric inputs directly', () => {
      expect(extractBedrooms(1)).toBe(1);
      expect(extractBedrooms(3)).toBe(3);
      expect(extractBedrooms(0)).toBe(0);
    });

    it('extracts number from strings', () => {
      expect(extractBedrooms('2')).toBe(2);
      expect(extractBedrooms('4 bed')).toBe(4);
      expect(extractBedrooms('3 bedroom flat')).toBe(3);
    });

    it('treats "Studio" as 0 bedrooms', () => {
      expect(extractBedrooms('Studio')).toBe(0);
      expect(extractBedrooms('studio flat')).toBe(0);
    });

    it('returns null for missing or invalid values', () => {
      expect(extractBedrooms(null)).toBeNull();
      expect(extractBedrooms(undefined)).toBeNull();
      expect(extractBedrooms('—')).toBeNull();
    });
  });

  describe('categorizePropertyType', () => {
    it('categorizes flats and apartments as "flat"', () => {
      expect(categorizePropertyType('Flat', 'Modern 2 bed')).toBe('flat');
      expect(categorizePropertyType('Apartment', 'Luxury penthouse')).toBe('flat');
      expect(categorizePropertyType('Maisonette', 'Split level')).toBe('flat');
    });

    it('categorizes houses as "house"', () => {
      expect(categorizePropertyType('Terraced house', '3 bed Victorian')).toBe('house');
      expect(categorizePropertyType('Detached', 'Family home')).toBe('house');
      expect(categorizePropertyType('Semi-detached', 'Garden house')).toBe('house');
      expect(categorizePropertyType('Townhouse', 'Townhouse in Islington')).toBe('house');
    });

    it('categorizes studios as "studio"', () => {
      expect(categorizePropertyType('Studio', 'Modern studio')).toBe('studio');
      expect(categorizePropertyType('', 'Self-contained studio flat')).toBe('studio');
    });

    it('categorizes bungalows as "bungalow"', () => {
      expect(categorizePropertyType('Bungalow', 'Detached bungalow')).toBe('bungalow');
    });
  });

  describe('extractFurnishingStatus', () => {
    it('detects furnished properties', () => {
      expect(extractFurnishingStatus('Modern furnished 2 bed flat')).toBe('furnished');
      expect(extractFurnishingStatus('Fully furnished apartment')).toBe('furnished');
    });

    it('detects unfurnished properties', () => {
      expect(extractFurnishingStatus('Unfurnished 3 bed house')).toBe('unfurnished');
      expect(extractFurnishingStatus('Offered un-furnished')).toBe('unfurnished');
    });

    it('returns unknown when not mentioned', () => {
      expect(extractFurnishingStatus('2 bed flat in Islington')).toBe('unknown');
      expect(extractFurnishingStatus(null)).toBe('unknown');
    });
  });

  describe('hasParkingFeature', () => {
    it('detects parking mentions', () => {
      expect(hasParkingFeature('Flat with allocated parking')).toBe(true);
      expect(hasParkingFeature('Garage and driveway')).toBe(true);
      expect(hasParkingFeature('Resident permit parking')).toBe(true);
    });

    it('returns false when parking is not mentioned', () => {
      expect(hasParkingFeature('Central heating only')).toBe(false);
      expect(hasParkingFeature(undefined)).toBe(false);
    });
  });

  describe('hasBalconyOrGardenFeature', () => {
    it('detects balcony or garden mentions', () => {
      expect(hasBalconyOrGardenFeature('Apartment with private balcony')).toBe(true);
      expect(hasBalconyOrGardenFeature('Rear garden and patio')).toBe(true);
      expect(hasBalconyOrGardenFeature('Roof terrace with views')).toBe(true);
    });

    it('returns false when outside space is not mentioned', () => {
      expect(hasBalconyOrGardenFeature('Close to tube station')).toBe(false);
      expect(hasBalconyOrGardenFeature(null)).toBe(false);
    });
  });

  describe('hasPetFriendlyFeature', () => {
    it('detects pet friendly from amenities array', () => {
      expect(hasPetFriendlyFeature('', ['Pets considered', 'Furnished'])).toBe(true);
      expect(hasPetFriendlyFeature('', ['Pet friendly'])).toBe(true);
      expect(hasPetFriendlyFeature('', ['Dogs allowed'])).toBe(true);
    });

    it('detects pet friendly from description or title', () => {
      expect(hasPetFriendlyFeature('Modern 1 bed flat, pets welcome!')).toBe(true);
      expect(hasPetFriendlyFeature('Cats and dogs permitted with landlord consent')).toBe(true);
      expect(hasPetFriendlyFeature('Pets accepted with additional deposit')).toBe(true);
    });

    it('correctly excludes negative pet mentions', () => {
      expect(hasPetFriendlyFeature('Strictly no pets allowed in this building')).toBe(false);
      expect(hasPetFriendlyFeature('Pets not permitted')).toBe(false);
      expect(hasPetFriendlyFeature('Sorry, no dogs or cats')).toBe(false);
    });

    it('returns false when pets are not mentioned', () => {
      expect(hasPetFriendlyFeature('Bright studio in central London')).toBe(false);
      expect(hasPetFriendlyFeature(undefined, [])).toBe(false);
    });
  });

  describe('extractPetPolicy', () => {
    it('returns allowed when pet friendly keywords are present', () => {
      expect(extractPetPolicy('Cats and dogs welcome')).toBe('allowed');
      expect(extractPetPolicy('', ['Pet friendly'])).toBe('allowed');
      expect(extractPetPolicy('Pets considered upon request')).toBe('allowed');
    });

    it('returns forbidden when negative phrases are present', () => {
      expect(extractPetPolicy('No pets allowed under any circumstances')).toBe('forbidden');
      expect(extractPetPolicy('Strictly no pets')).toBe('forbidden');
      expect(extractPetPolicy('', ['No pets'])).toBe('forbidden');
    });

    it('returns unknown when no pet mention exists', () => {
      expect(extractPetPolicy('Lovely modern studio flat')).toBe('unknown');
      expect(extractPetPolicy(undefined, [])).toBe('unknown');
    });
  });

  describe('hasBillsIncludedFeature', () => {
    it('detects bills included from amenities array', () => {
      expect(hasBillsIncludedFeature('', ['All bills included', 'Wifi'])).toBe(true);
      expect(hasBillsIncludedFeature('', ['Utilities included'])).toBe(true);
    });

    it('detects bills included from description text', () => {
      expect(hasBillsIncludedFeature('Rent includes electricity and water')).toBe(true);
      expect(hasBillsIncludedFeature('Bills inclusive studio flat')).toBe(true);
      expect(hasBillsIncludedFeature('All utility bills covered in monthly rent')).toBe(true);
    });

    it('returns false when bills are excluded or not mentioned', () => {
      expect(hasBillsIncludedFeature('Bills not included in monthly rent')).toBe(false);
      expect(hasBillsIncludedFeature('Standard unfurnished flat')).toBe(false);
    });
  });

  describe('extractListingDateEpoch', () => {
    it('extracts epoch from ISO publishedOn date', () => {
      const epoch = extractListingDateEpoch('2026-03-15T12:00:00Z');
      expect(epoch).toBe(new Date('2026-03-15T12:00:00Z').getTime());
    });

    it('parses UK date format in addedOrReduced', () => {
      const epoch = extractListingDateEpoch(undefined, 'Added on 15/03/2026');
      expect(epoch).toBeGreaterThan(0);
      const date = new Date(epoch);
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(2); // March is index 2
      expect(date.getUTCDate()).toBe(15);
    });

    it('parses relative "yesterday" and "today" strings', () => {
      const todayEpoch = extractListingDateEpoch(undefined, 'Added today');
      const yesterdayEpoch = extractListingDateEpoch(undefined, 'Reduced yesterday');
      expect(todayEpoch).toBeGreaterThan(yesterdayEpoch);
    });

    it('falls back to 0 for missing or unparseable dates', () => {
      expect(extractListingDateEpoch()).toBe(0);
      expect(extractListingDateEpoch(undefined, 'Available Now')).toBe(0);
    });
  });
});

describe('filterPredicates', () => {
  describe('matchPrice', () => {
    const prop = createMockProperty({ price: '£2,000 pcm' });

    it('returns true when no min or max is set', () => {
      expect(matchPrice(prop, null, null)).toBe(true);
    });

    it('correctly filters by min price', () => {
      expect(matchPrice(prop, 1500, null)).toBe(true);
      expect(matchPrice(prop, 2500, null)).toBe(false);
    });

    it('correctly filters by max price', () => {
      expect(matchPrice(prop, null, 2500)).toBe(true);
      expect(matchPrice(prop, null, 1500)).toBe(false);
    });

    it('correctly filters within a range', () => {
      expect(matchPrice(prop, 1500, 2500)).toBe(true);
      expect(matchPrice(prop, 2200, 2500)).toBe(false);
    });
  });

  describe('matchBedrooms', () => {
    it('returns true when bedrooms is "any"', () => {
      const prop = createMockProperty({ bedrooms: 2 });
      expect(matchBedrooms(prop, 'any')).toBe(true);
    });

    it('matches exact bedrooms in selected array', () => {
      const prop2 = createMockProperty({ bedrooms: 2 });
      const prop3 = createMockProperty({ bedrooms: 3 });

      expect(matchBedrooms(prop2, [2])).toBe(true);
      expect(matchBedrooms(prop2, [1, 3])).toBe(false);
      expect(matchBedrooms(prop3, [1, 2, 3])).toBe(true);
    });

    it('matches when filter array contains string values (e.g. from query params or classifier)', () => {
      const prop3 = createMockProperty({ bedrooms: 3 });
      expect(matchBedrooms(prop3, ['3'] as any)).toBe(true);
      expect(matchBedrooms(prop3, ['2', '3'] as any)).toBe(true);
      expect(matchBedrooms(prop3, ['1', '2'] as any)).toBe(false);
    });

    it('extracts bedrooms from title or description if property.bedrooms is null or undefined', () => {
      const propFromTitle = createMockProperty({
        bedrooms: undefined,
        title: '3 bedroom semi-detached house to rent',
      });
      const propFromDesc = createMockProperty({
        bedrooms: null as any,
        title: 'Lovely home in Bristol',
        description: 'A spacious 2 bed apartment with high ceilings',
      });

      expect(matchBedrooms(propFromTitle, [3])).toBe(true);
      expect(matchBedrooms(propFromTitle, [2])).toBe(false);
      expect(matchBedrooms(propFromDesc, [2])).toBe(true);
      expect(matchBedrooms(propFromDesc, [3])).toBe(false);
    });

    it('matches 4+ for properties with 4 or more bedrooms', () => {
      const prop4 = createMockProperty({ bedrooms: 4 });
      const prop5 = createMockProperty({ bedrooms: 5 });

      expect(matchBedrooms(prop4, [4])).toBe(true);
      expect(matchBedrooms(prop5, [4])).toBe(true);
      expect(matchBedrooms(prop4, [1, 2, 3])).toBe(false);
    });

    it('matches studio when 0 is in the array', () => {
      const studio = createMockProperty({ bedrooms: 'Studio' });
      expect(matchBedrooms(studio, [0])).toBe(true);
      expect(matchBedrooms(studio, [1, 2])).toBe(false);
    });
  });

  describe('matchPropertyType', () => {
    const flat = createMockProperty({ propertyType: 'Flat' });
    const house = createMockProperty({ propertyType: 'Terraced house' });

    it('returns true when types array is empty', () => {
      expect(matchPropertyType(flat, [])).toBe(true);
    });

    it('filters by selected property types', () => {
      expect(matchPropertyType(flat, ['flat'])).toBe(true);
      expect(matchPropertyType(flat, ['house'])).toBe(false);
      expect(matchPropertyType(house, ['house', 'studio'])).toBe(true);
    });

    it('harmonizes studio: matches 0-bedroom properties even if propertyType is Flat', () => {
      const zeroBedFlat = createMockProperty({ bedrooms: 0, propertyType: 'Flat' });
      expect(matchPropertyType(zeroBedFlat, ['studio'])).toBe(true);
    });
  });

  describe('matchKeywords', () => {
    const prop = createMockProperty({
      title: 'Beautiful flat with balcony',
      description: 'Bright apartment featuring private parking and concierge',
      location: 'Islington, London',
    });

    it('returns true when keyword is empty', () => {
      expect(matchKeywords(prop, '')).toBe(true);
      expect(matchKeywords(prop, '   ')).toBe(true);
    });

    it('matches words found in title, description, or location', () => {
      expect(matchKeywords(prop, 'balcony')).toBe(true);
      expect(matchKeywords(prop, 'parking')).toBe(true);
      expect(matchKeywords(prop, 'islington')).toBe(true);
      expect(matchKeywords(prop, 'garden')).toBe(false);
    });
  });

  describe('matchFurnishing', () => {
    const furnishedProp = createMockProperty({ description: 'Fully furnished 2 bed flat' });
    const unfurnishedProp = createMockProperty({ description: 'Spacious unfurnished maisonette' });
    const unstatedProp = createMockProperty({ description: '2 bed flat to rent' });

    it('returns true when furnishing is "any"', () => {
      expect(matchFurnishing(furnishedProp, 'any')).toBe(true);
      expect(matchFurnishing(unfurnishedProp, 'any')).toBe(true);
    });

    it('matches furnished preference correctly', () => {
      expect(matchFurnishing(furnishedProp, 'furnished')).toBe(true);
      expect(matchFurnishing(unfurnishedProp, 'furnished')).toBe(false);
      expect(matchFurnishing(unstatedProp, 'furnished')).toBe(true); // Graceful fallback
    });

    it('matches unfurnished preference correctly', () => {
      expect(matchFurnishing(unfurnishedProp, 'unfurnished')).toBe(true);
      expect(matchFurnishing(furnishedProp, 'unfurnished')).toBe(false);
    });
  });

  describe('matchParking', () => {
    const withParking = createMockProperty({ description: 'Includes allocated parking space' });
    const noParking = createMockProperty({ description: 'Central apartment' });

    it('returns true when parking is not required', () => {
      expect(matchParking(withParking, false)).toBe(true);
      expect(matchParking(noParking, false)).toBe(true);
    });

    it('matches parking requirement only when mentioned', () => {
      expect(matchParking(withParking, true)).toBe(true);
      expect(matchParking(noParking, true)).toBe(false);
    });
  });

  describe('matchBalconyOrGarden', () => {
    const withBalcony = createMockProperty({ description: 'Private balcony overlooking river' });
    const withoutOutside = createMockProperty({ description: 'High floor apartment' });

    it('returns true when outside space is not required', () => {
      expect(matchBalconyOrGarden(withBalcony, false)).toBe(true);
      expect(matchBalconyOrGarden(withoutOutside, false)).toBe(true);
    });

    it('matches outside space requirement only when mentioned', () => {
      expect(matchBalconyOrGarden(withBalcony, true)).toBe(true);
      expect(matchBalconyOrGarden(withoutOutside, true)).toBe(false);
    });
  });

  describe('matchPetFriendly', () => {
    const petFriendlyProp = createMockProperty({ amenities: ['Pet friendly'] });
    const regularProp = createMockProperty({ description: 'No pets allowed' });

    it('returns true when pet friendly is not required', () => {
      expect(matchPetFriendly(petFriendlyProp, false)).toBe(true);
      expect(matchPetFriendly(regularProp, false)).toBe(true);
    });

    it('matches only pet friendly properties when required', () => {
      expect(matchPetFriendly(petFriendlyProp, true)).toBe(true);
      expect(matchPetFriendly(regularProp, true)).toBe(false);
    });

    it('supports allowUnconfirmed parameter for unstated properties', () => {
      const unstatedProp = createMockProperty({ description: 'Studio apartment with kitchen' });
      // When allowUnconfirmed is false (default): unstated is rejected
      expect(matchPetFriendly(unstatedProp, true, false)).toBe(false);
      // When allowUnconfirmed is true (relaxed mode): unstated is accepted
      expect(matchPetFriendly(unstatedProp, true, true)).toBe(true);
      // Explicit negative is ALWAYS rejected even in relaxed mode
      expect(matchPetFriendly(regularProp, true, true)).toBe(false);
    });
  });

  describe('matchBillsIncluded', () => {
    const billsIncludedProp = createMockProperty({ description: 'All bills included in rent' });
    const standardProp = createMockProperty({ description: 'Exclusive of utility bills' });

    it('returns true when bills included is not required', () => {
      expect(matchBillsIncluded(billsIncludedProp, false)).toBe(true);
      expect(matchBillsIncluded(standardProp, false)).toBe(true);
    });

    it('matches only bills included properties when required', () => {
      expect(matchBillsIncluded(billsIncludedProp, true)).toBe(true);
      expect(matchBillsIncluded(standardProp, true)).toBe(false);
    });
  });

  describe('sortProperties', () => {
    const propLow = createMockProperty({ price: '£1,500 pcm', bedrooms: 1, addedOrReduced: 'Added today' });
    const propMid = createMockProperty({ price: '£2,000 pcm', bedrooms: 3, publishedOn: '2026-03-01T00:00:00Z' });
    const propHigh = createMockProperty({ price: '£3,000 pcm', bedrooms: 2, publishedOn: '2026-03-10T00:00:00Z' });
    const list = [propMid, propHigh, propLow];

    it('sorts price ascending (low to high)', () => {
      const sorted = [...list].sort((a, b) => sortProperties(a, b, 'price_asc'));
      expect(sorted[0].price).toBe('£1,500 pcm');
      expect(sorted[1].price).toBe('£2,000 pcm');
      expect(sorted[2].price).toBe('£3,000 pcm');
    });

    it('sorts price descending (high to low)', () => {
      const sorted = [...list].sort((a, b) => sortProperties(a, b, 'price_desc'));
      expect(sorted[0].price).toBe('£3,000 pcm');
      expect(sorted[1].price).toBe('£2,000 pcm');
      expect(sorted[2].price).toBe('£1,500 pcm');
    });

    it('sorts by most bedrooms descending', () => {
      const sorted = [...list].sort((a, b) => sortProperties(a, b, 'beds_desc'));
      expect(sorted[0].bedrooms).toBe(3);
      expect(sorted[1].bedrooms).toBe(2);
      expect(sorted[2].bedrooms).toBe(1);
    });

    it('sorts by newest listed descending', () => {
      const sorted = [...list].sort((a, b) => sortProperties(a, b, 'newest'));
      // 'Added today' is newest, then March 10, then March 1
      expect(sorted[0].addedOrReduced).toBe('Added today');
      expect(sorted[1].publishedOn).toBe('2026-03-10T00:00:00Z');
      expect(sorted[2].publishedOn).toBe('2026-03-01T00:00:00Z');
    });
  });
});
