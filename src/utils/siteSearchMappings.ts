// siteSearchMappings.ts

/**
 * Standardized search/filter object for property search.
 * @typedef {Object} PropertySearchParams
 * @property {string} location - The location to search (e.g., 'Walthamstow, London')
 * @property {number} [beds] - Maximum number of bedrooms
 * @property {number[]} [priceRange] - [min, max] price in GBP
 * @property {string} [type] - Property type (e.g., 'House', 'Flat')
 * @property {boolean} [petFriendly]
 * @property {boolean} [furnished]
 */

/**
 * Build Zoopla search URL and params.
 * @param {PropertySearchParams} params
 * @returns {string} Full Zoopla search URL
 */
export function buildZooplaUrl(params) {
  const base = 'https://www.zoopla.co.uk/to-rent/property/';
  const loc = encodeURIComponent(params.location || '');
  const bedsMin = params.minBeds ? `&beds_min=${params.minBeds}` : '';
  const bedsMax = params.maxBeds ? `&beds_max=${params.maxBeds}` : '';
  const priceMin = params.minPrice ? `&price_min=${params.minPrice}` : '';
  const priceMax = params.maxPrice ? `&price_max=${params.maxPrice}` : '';
  const type = params.propertyType ? `&property_type=${encodeURIComponent(params.propertyType)}` : '';
  return `${base}${loc}/?q=${loc}${bedsMin}${bedsMax}${priceMin}${priceMax}${type}&price_frequency=per_month&search_source=to-rent`;
}

/**
 * Build OpenRent search URL and params.
 * @param {PropertySearchParams} params
 * @returns {string} Full OpenRent search URL
 */
export function buildOpenRentUrl(params) {
  const base = 'https://www.openrent.co.uk/properties-to-rent/';
  const loc = encodeURIComponent(params.location || '');
  const priceMin = params.minPrice ? `&prices_min=${params.minPrice}` : '';
  const priceMax = params.maxPrice ? `&prices_max=${params.maxPrice}` : '';
  // OpenRent does not use beds/type in URL directly
  return `${base}${loc}?term=${loc}${priceMin}${priceMax}`;
}

/**
 * Build OnTheMarket search URL and params.
 * @param {PropertySearchParams} params
 * @returns {string} Full OnTheMarket search URL
 */
export function buildOnTheMarketUrl(params) {
  const base = 'https://www.onthemarket.com/to-rent/property/';
  const loc = encodeURIComponent(params.location || '');
  const bedsMin = params.minBeds ? `&min-bedrooms=${params.minBeds}` : '';
  const bedsMax = params.maxBeds ? `&max-bedrooms=${params.maxBeds}` : '';
  const priceMin = params.minPrice ? `&price-min=${params.minPrice}` : '';
  const priceMax = params.maxPrice ? `&price-max=${params.maxPrice}` : '';
  return `${base}${loc}/?view=map-list${bedsMin}${bedsMax}${priceMin}${priceMax}`;
}

/**
 * Build Rightmove search URL and params.
 * @param {PropertySearchParams} params
 * @returns {string} Full Rightmove search URL
 */
export function buildRightmoveUrl(params) {
  const base = 'https://www.rightmove.co.uk/property-to-rent/find.html';
  const loc = encodeURIComponent(params.location || '');
  const bedsMin = params.minBeds ? `&minBedrooms=${params.minBeds}` : '';
  const bedsMax = params.maxBeds ? `&maxBedrooms=${params.maxBeds}` : '';
  const priceMin = params.minPrice ? `&minPrice=${params.minPrice}` : '';
  const priceMax = params.maxPrice ? `&maxPrice=${params.maxPrice}` : '';
  // Rightmove may require a locationIdentifier for best results
  return `${base}?searchLocation=${loc}${bedsMin}${bedsMax}${priceMin}${priceMax}&useLocationIdentifier=true`;
} 