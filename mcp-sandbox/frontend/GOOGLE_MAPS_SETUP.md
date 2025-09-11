# Google Maps Integration Setup

## 🗺️ Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Features Included

✅ **Interactive Google Maps** - Full map with zoom, pan, and controls  
✅ **Property Geocoding** - Convert addresses to coordinates  
✅ **Smart Clustering** - Group nearby properties automatically  
✅ **Interactive Markers** - Click for property details  
✅ **Custom Styling** - Color-coded by price range  
✅ **Info Windows** - Rich property information popups  
✅ **Real-time Updates** - Map updates with search results  
✅ **Performance Optimized** - Efficient rendering and caching

### 4. Map Features

- **Zoom Controls**: Standard Google Maps zoom controls
- **Pan Navigation**: Drag to move around the map
- **Property Markers**: Color-coded by price range
  - 🟢 Green: Under £1,000
  - 🟣 Purple: £1,000 - £2,000
  - 🟠 Orange: £2,000 - £3,000
  - 🔴 Red: Over £3,000
- **Marker Clustering**: Groups nearby properties
- **Info Windows**: Click markers for property details
- **Auto-fit Bounds**: Map automatically shows all properties
- **Selection Highlighting**: Selected properties bounce and highlight

### 5. Geocoding Features

- **Batch Processing**: Efficiently geocodes multiple addresses
- **Confidence Scoring**: Only shows high-confidence results
- **Caching**: 24-hour cache to reduce API calls
- **Error Handling**: Graceful fallback for failed geocoding
- **Rate Limiting**: Respects Google API limits

### 6. Performance Optimizations

- **Lazy Loading**: Maps load only when needed
- **Marker Clustering**: Reduces visual clutter
- **Efficient Rendering**: Only renders visible markers
- **Smart Caching**: Reduces API calls
- **Debounced Updates**: Prevents excessive re-renders

### 7. Troubleshooting

**Map not loading?**

- Check your API key is correct
- Ensure required APIs are enabled
- Check browser console for errors

**No markers showing?**

- Verify addresses are valid
- Check geocoding API quota
- Review confidence thresholds

**Performance issues?**

- Reduce number of properties
- Check API rate limits
- Monitor cache usage

### 8. API Quotas

Google Maps APIs have usage limits:

- **Maps JavaScript API**: 25,000 map loads per day
- **Geocoding API**: 2,500 requests per day
- **Places API**: 1,000 requests per day

For production use, consider:

- Implementing usage monitoring
- Setting up billing alerts
- Using enterprise plans for higher limits

### 9. Security Best Practices

- Restrict API key to your domain
- Enable billing alerts
- Monitor API usage
- Use HTTPS in production
- Implement rate limiting

### 10. Customization

The map can be customized by modifying:

- `AreaMap.tsx` - Main map component
- `PropertyMarker.tsx` - Individual markers
- `geocodingService.ts` - Geocoding logic
- `googleMapsLoader.ts` - API configuration

