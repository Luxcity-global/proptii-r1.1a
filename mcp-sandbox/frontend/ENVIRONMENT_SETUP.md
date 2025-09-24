# Environment Setup for Map Integration

## Google Maps API Key Setup

To enable the map functionality, you need to configure a Google Maps API key:

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for area insights)
   - Geocoding API (for coordinates)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Create a `.env.local` file in the `mcp-sandbox/frontend/` directory with:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# MCP API URL (backend)
VITE_MCP_API_URL=http://localhost:3002/api/mcp
```

### 3. Restart Development Server

After adding the environment variables:

```bash
npm run dev
```

## Features Enabled with API Key

- ✅ Interactive Google Maps
- ✅ Property markers with pricing
- ✅ Area insights and analytics
- ✅ Search radius visualization
- ✅ Real-time property data

## Troubleshooting

- If maps don't load: Check API key is correct and enabled
- If area insights don't work: Ensure Places API is enabled
- If coordinates fail: Ensure Geocoding API is enabled
