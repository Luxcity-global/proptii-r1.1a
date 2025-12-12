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
        const { query, location, type } = req.body;

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

        // Step 2: Search for places
        console.log('🔍 Searching for places...');
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=8000&region=uk&key=${PLACES_API_KEY}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        console.log('🔍 Places search status:', searchData.status);

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
            console.log('❌ Search failed:', searchData.status);
            return res.status(500).json({ error: 'Search failed', details: searchData.status });
        }

        // Format results and fetch additional details (phone, website)
        console.log(`📞 Fetching details for ${searchData.results.length} places...`);
        const resultsWithDetails = await Promise.all(
            searchData.results.slice(0, 10).map(async (place) => {
                try {
                    // Get Place Details for phone number and website
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,international_phone_number&key=${PLACES_API_KEY}`;
                    const detailsResponse = await fetch(detailsUrl);
                    const detailsData = await detailsResponse.json();

                    return {
                        placeId: place.place_id,
                        name: place.name,
                        address: place.formatted_address,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        openNow: place.opening_hours?.open_now,
                        phoneNumber: detailsData.result?.formatted_phone_number || detailsData.result?.international_phone_number,
                        website: detailsData.result?.website,
                        types: place.types || []
                    };
                } catch (err) {
                    console.error('Error fetching details for place:', place.name, err);
                    // Return basic info if details fetch fails
                    return {
                        placeId: place.place_id,
                        name: place.name,
                        address: place.formatted_address,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        openNow: place.opening_hours?.open_now,
                        types: place.types || []
                    };
                }
            })
        );

        console.log(`✅ Found ${resultsWithDetails.length} results with contact details`);
        res.json({ results: resultsWithDetails });
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
