import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Google Places API endpoint
app.post('/api/vendors/search', async (req, res) => {
    console.log('📥 Received search request:', req.body);
    try {
        const { query, location, type, page = 1, pageSize = 10 } = req.body;
        
        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page) || 1);
        const size = Math.min(50, Math.max(1, parseInt(pageSize) || 10)); // Max 50 per page

        if (!location) {
            console.log('❌ No postcode provided');
            return res.status(400).json({ error: 'Postcode is required' });
        }

        const GEOCODING_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;
        const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

        console.log('🔑 API Keys loaded:', {
            geocoding: GEOCODING_API_KEY ? 'YES' : 'NO',
            places: PLACES_API_KEY ? 'YES' : 'NO'
        });

        if (!GEOCODING_API_KEY || !PLACES_API_KEY) {
            console.log('❌ API keys not configured');
            return res.status(500).json({ error: 'API keys not configured' });
        }

        // Step 1: Geocode the postcode
        console.log('📍 Geocoding postcode:', location);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&region=uk&key=${GEOCODING_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        console.log('📍 Geocode response status:', geocodeData.status);

        if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
            console.log('❌ Invalid postcode or geocoding failed');
            return res.status(400).json({ error: 'Invalid postcode' });
        }

        const { lat, lng } = geocodeData.results[0].geometry.location;
        console.log('✅ Geocoded to:', { lat, lng });

        // Step 2: Multi-strategy search for places
        console.log('🔍 Searching for places with multiple strategies...');
        
        // Strategy 1: Text Search (searches names, types, and some descriptions)
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=8000&region=uk&key=${PLACES_API_KEY}`;
        const textSearchResponse = await fetch(textSearchUrl);
        const textSearchData = await textSearchResponse.json();
        console.log('🔍 Text search status:', textSearchData.status, `(${textSearchData.results?.length || 0} results)`);

        // Strategy 2: Nearby Search with broader types to catch businesses that might offer the service
        // Use general establishment types that might include the service in their description
        const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=8000&type=establishment&key=${PLACES_API_KEY}`;
        const nearbySearchResponse = await fetch(nearbySearchUrl);
        const nearbySearchData = await nearbySearchResponse.json();
        console.log('🔍 Nearby search status:', nearbySearchData.status, `(${nearbySearchData.results?.length || 0} results)`);

        // Combine and deduplicate results by place_id
        const allPlaces = new Map();
        
        // Add text search results (these are likely more relevant)
        if (textSearchData.status === 'OK' && textSearchData.results) {
            textSearchData.results.forEach(place => {
                allPlaces.set(place.place_id, { ...place, relevanceScore: 10 }); // Higher score for text search matches
            });
        }

        // Add nearby search results (we'll filter by description later)
        if (nearbySearchData.status === 'OK' && nearbySearchData.results) {
            nearbySearchData.results.forEach(place => {
                if (!allPlaces.has(place.place_id)) {
                    allPlaces.set(place.place_id, { ...place, relevanceScore: 0 }); // Lower initial score
                }
            });
        }

        console.log(`📋 Total unique places found: ${allPlaces.size}`);

        // Step 3: Fetch detailed information including descriptions
        console.log(`📞 Fetching details and descriptions for ${allPlaces.size} places...`);
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2); // Filter out short words
        
        const resultsWithDetails = await Promise.all(
            Array.from(allPlaces.values()).slice(0, 20).map(async (place) => {
                try {
                    // Get Place Details including description/editorial_summary
                    // Request more fields that might contain descriptive text
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,international_phone_number,editorial_summary,types,business_status,reviews,formatted_address&key=${PLACES_API_KEY}`;
                    const detailsResponse = await fetch(detailsUrl);
                    const detailsData = await detailsResponse.json();

                    // Log API response for debugging
                    if (detailsData.status !== 'OK') {
                        console.log(`⚠️ Place details API status for ${place.name}: ${detailsData.status}`);
                        console.log(`⚠️ Error message: ${detailsData.error_message || 'No error message'}`);
                    }

                    const details = detailsData.result || {};
                    
                    // Log what fields we got back
                    console.log(`📋 Fields returned for ${place.name}:`, Object.keys(details));
                    if (details.editorial_summary) {
                        console.log(`✅ Has editorial_summary:`, details.editorial_summary);
                    } else {
                        console.log(`❌ No editorial_summary for ${place.name}`);
                    }
                    // Try multiple possible fields for ACTUAL business description
                    // Only use editorial_summary - this is the official business description from Google
                    // Do NOT use reviews as they are customer reviews, not business descriptions
                    let editorialSummary = details.editorial_summary?.overview || 
                                          details.editorial_summary || 
                                          '';
                    
                    // Note: We intentionally do NOT use reviews as descriptions
                    // Reviews are customer feedback, not business descriptions
                    
                    const businessTypes = details.types || place.types || [];
                    const businessName = place.name || '';
                    const businessAddress = place.formatted_address || details.formatted_address || '';

                    // Check if search term appears in description, name, types, or address
                    const searchableText = `${businessName} ${editorialSummary} ${businessTypes.join(' ')} ${businessAddress}`.toLowerCase();
                    
                    let relevanceScore = place.relevanceScore || 0;
                    let matchesInDescription = false;

                    // Boost score if search term appears in description
                    if (editorialSummary) {
                        const summaryLower = editorialSummary.toLowerCase();
                        queryWords.forEach(word => {
                            if (summaryLower.includes(word)) {
                                relevanceScore += 5; // Significant boost for description match
                                matchesInDescription = true;
                            }
                        });
                        // Also check if full query appears in description
                        if (summaryLower.includes(queryLower)) {
                            matchesInDescription = true;
                            relevanceScore += 5;
                        }
                    }
                    
                    // Log for debugging
                    if (editorialSummary) {
                        console.log(`📝 Business: ${businessName}, Has OFFICIAL description: YES (${editorialSummary.length} chars), Matches: ${matchesInDescription}`);
                    } else {
                        console.log(`📝 Business: ${businessName}, Has OFFICIAL description: NO (Google Places API did not provide editorial_summary)`);
                    }

                    // Boost score if search term appears in name
                    if (businessName.toLowerCase().includes(queryLower)) {
                        relevanceScore += 3;
                    }

                    // Boost score if search term appears in types
                    const typesString = businessTypes.join(' ').toLowerCase();
                    if (typesString.includes(queryLower)) {
                        relevanceScore += 2;
                    }

                    // Only include if it matches the search term somewhere (name, description, or types)
                    const isRelevant = businessName.toLowerCase().includes(queryLower) ||
                                     editorialSummary.toLowerCase().includes(queryLower) ||
                                     typesString.includes(queryLower) ||
                                     queryWords.some(word => searchableText.includes(word));

                    if (!isRelevant && place.relevanceScore === 0) {
                        return null; // Skip nearby search results that don't match
                    }

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
                        matchesInDescription: matchesInDescription,
                        relevanceScore: relevanceScore
                    };
                } catch (err) {
                    console.error('Error fetching details for place:', place.name, err);
                    console.error('Error details:', err.message, err.stack);
                    // Return basic info if details fetch fails, but still include description fields
                    return {
                        placeId: place.place_id,
                        name: place.name,
                        address: place.formatted_address,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        openNow: place.opening_hours?.open_now,
                        types: place.types || [],
                        description: '', // Always include, even if empty
                        matchesInDescription: false, // Always include
                        relevanceScore: place.relevanceScore || 0
                    };
                }
            })
        );

        // Filter out null results and sort by relevance score
        const allFilteredResults = resultsWithDetails
            .filter(result => result !== null)
            .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

        // Calculate pagination
        const totalResults = allFilteredResults.length;
        const totalPages = Math.ceil(totalResults / size);
        const startIndex = (pageNum - 1) * size;
        const endIndex = startIndex + size;
        const paginatedResults = allFilteredResults.slice(startIndex, endIndex);

        console.log(`✅ Found ${totalResults} total results, showing page ${pageNum} of ${totalPages} (${paginatedResults.length} results)`);
        
        res.json({ 
            results: paginatedResults,
            pagination: {
                currentPage: pageNum,
                pageSize: size,
                totalResults: totalResults,
                totalPages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPreviousPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('❌ Vendor search error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api/vendors/search`);
});
