// Google Places API Integration for Vendor Search
// This file should be placed in your backend API directory

import { Request, Response } from 'express';

interface VendorSearchRequest {
    query: string;
    location: string;
    type: string;
}

interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
        open_now?: boolean;
    };
    types: string[];
}

/**
 * Google Places API Vendor Search Endpoint
 * 
 * Setup Instructions:
 * 1. Get a Google Places API key from: https://console.cloud.google.com/
 * 2. Enable the Places API in your Google Cloud Console
 * 3. Add the API key to your .env file as: GOOGLE_PLACES_API_KEY=your_key_here
 * 4. Free tier includes: 28,000 requests per month
 * 5. After free tier: £0.017 per request (very affordable)
 * 
 * Cost Estimate:
 * - First 28,000 searches/month: FREE
 * - Additional searches: ~£17 per 1,000 searches
 * - For 100 users doing 5 searches/month = 500 searches = FREE
 * - For 1,000 users doing 5 searches/month = 5,000 searches = FREE
 */

export async function searchVendors(req: Request, res: Response) {
    try {
        const { query, location, type }: VendorSearchRequest = req.body;

        // Validate input
        if (!query || !location) {
            return res.status(400).json({
                error: 'Missing required fields: query and location'
            });
        }

        // Get API key from environment
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_PLACES_API_KEY not configured');
            return res.status(500).json({
                error: 'Vendor search is not configured. Please contact support.'
            });
        }

        // Step 1: Geocode the postcode to get lat/lng
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&region=uk&key=${apiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
            return res.status(400).json({
                error: 'Invalid postcode. Please check and try again.'
            });
        }

        const { lat, lng } = geocodeData.results[0].geometry.location;

        // Step 2: Search for places near the location
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=8000&region=uk&key=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
            console.error('Places API error:', searchData.status, searchData.error_message);
            return res.status(500).json({
                error: 'Unable to search for vendors at this time.'
            });
        }

        // Step 3: Get detailed information for top results (limit to 5 to save API calls)
        const topResults = searchData.results.slice(0, 5);
        const detailedResults = await Promise.all(
            topResults.map(async (place: any) => {
                try {
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,types&key=${apiKey}`;
                    const detailsResponse = await fetch(detailsUrl);
                    const detailsData = await detailsResponse.json();

                    if (detailsData.status === 'OK') {
                        const result = detailsData.result;
                        return {
                            placeId: place.place_id,
                            name: result.name,
                            address: result.formatted_address,
                            rating: result.rating,
                            totalRatings: result.user_ratings_total,
                            phoneNumber: result.formatted_phone_number,
                            website: result.website,
                            openNow: result.opening_hours?.open_now,
                            types: result.types || []
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Error fetching place details:', error);
                    return null;
                }
            })
        );

        // Filter out null results
        const validResults = detailedResults.filter(result => result !== null);

        return res.status(200).json({
            results: validResults,
            location: {
                postcode: location,
                lat,
                lng
            }
        });

    } catch (error) {
        console.error('Vendor search error:', error);
        return res.status(500).json({
            error: 'An error occurred while searching for vendors.'
        });
    }
}

/**
 * Alternative: Simpler Text Search (uses fewer API calls)
 * This version uses only the Text Search API without detailed place info
 * Cost: 1 API call per search instead of 6 (1 geocode + 1 search + 5 details)
 */
export async function searchVendorsSimple(req: Request, res: Response) {
    try {
        const { query, location }: VendorSearchRequest = req.body;

        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'Vendor search is not configured.'
            });
        }

        // Single API call with location in query
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' near ' + location)}&region=uk&key=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
            return res.status(500).json({
                error: 'Unable to search for vendors at this time.'
            });
        }

        // Map results to our format (limited info but much cheaper)
        const results = searchData.results.slice(0, 10).map((place: any) => ({
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            openNow: place.opening_hours?.open_now,
            types: place.types || []
        }));

        return res.status(200).json({
            results
        });

    } catch (error) {
        console.error('Vendor search error:', error);
        return res.status(500).json({
            error: 'An error occurred while searching for vendors.'
        });
    }
}

// Export route handlers
export default {
    searchVendors,
    searchVendorsSimple
};
