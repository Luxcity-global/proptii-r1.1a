/**
 * Vendor backend for the homeowner dashboard.
 * - POST /search: Google Places–based vendor search (postcode + category/query).
 * - GET /saved, POST /saved, DELETE /saved/:placeId: homeowner's saved vendors list.
 *
 * Expects env: GOOGLE_GEOCODING_API_KEY, GOOGLE_PLACES_API_KEY.
 * Saved vendors: in-memory store keyed by user (header X-User-Id or "anonymous").
 */

import express from 'express';

const router = express.Router();

// ----- In-memory saved vendors: userId -> array of saved vendor objects -----
const savedByUser = new Map();

function getUserId(req) {
  return req.get('X-User-Id') || req.query.userId || 'anonymous';
}

// ----- Search: Google Geocoding + Places (Text Search, Nearby, Details) -----

router.post('/search', async (req, res) => {
  try {
    const { query, location, type, page = 1, pageSize = 10 } = req.body;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10));

    if (!location) {
      return res.status(400).json({ error: 'Postcode is required' });
    }

    const GEOCODING_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;
    const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!GEOCODING_API_KEY || !PLACES_API_KEY) {
      return res.status(500).json({ error: 'Vendor search is not configured (missing API keys).' });
    }

    // 1) Geocode postcode
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&region=uk&key=${GEOCODING_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.length) {
      return res.status(400).json({ error: 'Invalid postcode' });
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // 2) Text search + nearby search
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=8000&region=uk&key=${PLACES_API_KEY}`;
    const textSearchResponse = await fetch(textSearchUrl);
    const textSearchData = await textSearchResponse.json();

    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=8000&type=establishment&key=${PLACES_API_KEY}`;
    const nearbySearchResponse = await fetch(nearbySearchUrl);
    const nearbySearchData = await nearbySearchResponse.json();

    const allPlaces = new Map();

    if (textSearchData.status === 'OK' && textSearchData.results) {
      textSearchData.results.forEach((place) => {
        allPlaces.set(place.place_id, { ...place, relevanceScore: 10 });
      });
    }
    if (nearbySearchData.status === 'OK' && nearbySearchData.results) {
      nearbySearchData.results.forEach((place) => {
        if (!allPlaces.has(place.place_id)) {
          allPlaces.set(place.place_id, { ...place, relevanceScore: 0 });
        }
      });
    }

    const queryLower = (query || '').toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

    const resultsWithDetails = await Promise.all(
      Array.from(allPlaces.values())
        .slice(0, 20)
        .map(async (place) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,international_phone_number,editorial_summary,types,business_status,formatted_address&key=${PLACES_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            const details = detailsData.result || {};

            const editorialSummary =
              (typeof details.editorial_summary === 'object' && details.editorial_summary?.overview) ||
              (typeof details.editorial_summary === 'string' && details.editorial_summary) ||
              '';

            const businessTypes = details.types || place.types || [];
            const businessName = place.name || '';
            const businessAddress = place.formatted_address || details.formatted_address || '';

            const searchableText = `${businessName} ${editorialSummary} ${businessTypes.join(' ')} ${businessAddress}`.toLowerCase();
            let relevanceScore = place.relevanceScore || 0;
            let matchesInDescription = false;

            if (editorialSummary) {
              const summaryLower = editorialSummary.toLowerCase();
              queryWords.forEach((word) => {
                if (summaryLower.includes(word)) {
                  relevanceScore += 5;
                  matchesInDescription = true;
                }
              });
              if (summaryLower.includes(queryLower)) {
                matchesInDescription = true;
                relevanceScore += 5;
              }
            }
            if (businessName.toLowerCase().includes(queryLower)) relevanceScore += 3;
            const typesString = businessTypes.join(' ').toLowerCase();
            if (typesString.includes(queryLower)) relevanceScore += 2;

            const isRelevant =
              businessName.toLowerCase().includes(queryLower) ||
              editorialSummary.toLowerCase().includes(queryLower) ||
              typesString.includes(queryLower) ||
              queryWords.some((word) => searchableText.includes(word));

            if (!isRelevant && place.relevanceScore === 0) return null;

            return {
              placeId: place.place_id,
              name: businessName,
              address: businessAddress,
              rating: place.rating,
              totalRatings: place.user_ratings_total,
              openNow: place.opening_hours?.open_now,
              phoneNumber: details.formatted_phone_number || details.international_phone_number,
              website: details.website,
              types: businessTypes,
              description: editorialSummary,
              matchesInDescription,
              relevanceScore,
            };
          } catch (err) {
            return {
              placeId: place.place_id,
              name: place.name,
              address: place.formatted_address,
              rating: place.rating,
              totalRatings: place.user_ratings_total,
              openNow: place.opening_hours?.open_now,
              types: place.types || [],
              description: '',
              matchesInDescription: false,
              relevanceScore: place.relevanceScore || 0,
            };
          }
        })
    );

    const allFilteredResults = resultsWithDetails
      .filter((r) => r !== null)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const totalResults = allFilteredResults.length;
    const totalPages = Math.ceil(totalResults / size);
    const startIndex = (pageNum - 1) * size;
    const paginatedResults = allFilteredResults.slice(startIndex, startIndex + size);

    res.json({
      results: paginatedResults,
      pagination: {
        currentPage: pageNum,
        pageSize: size,
        totalResults,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Vendor search error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ----- Saved vendors (homeowner's list) -----

/** GET /saved — list saved vendors for the current user */
router.get('/saved', (req, res) => {
  const userId = getUserId(req);
  const list = savedByUser.get(userId) || [];
  res.json({ results: list });
});

/** POST /saved — add a vendor to the user's saved list. Body: { placeId, name, address?, rating?, ... } */
router.post('/saved', (req, res) => {
  const userId = getUserId(req);
  const vendor = req.body;

  if (!vendor?.placeId || !vendor?.name) {
    return res.status(400).json({ error: 'placeId and name are required' });
  }

  let list = savedByUser.get(userId) || [];
  if (list.some((v) => v.placeId === vendor.placeId)) {
    return res.status(200).json({ message: 'Already saved', results: list });
  }

  const saved = {
    ...vendor,
    savedAt: new Date().toISOString(),
  };
  list = [...list, saved];
  savedByUser.set(userId, list);
  res.status(201).json({ results: list });
});

/** DELETE /saved/:placeId — remove a vendor from the user's saved list */
router.delete('/saved/:placeId', (req, res) => {
  const userId = getUserId(req);
  const { placeId } = req.params;

  let list = savedByUser.get(userId) || [];
  list = list.filter((v) => v.placeId !== placeId);
  savedByUser.set(userId, list);
  res.json({ results: list });
});

export default router;
