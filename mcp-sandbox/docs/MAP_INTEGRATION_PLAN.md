# Map Integration Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for integrating a map section with area insights into the MCP Sandbox property search application. The map integration will appear between the search input and property results, providing geographical context and area intelligence.

## Architecture Overview

### Component Structure

```
MapIntegrationSection/
├── MapIntegrationSection.tsx     # Main container component
├── AreaInsightPanel.tsx          # Left side - Area insights
├── PropertyMap.tsx              # Right side - Google Maps
├── types.ts                     # TypeScript interfaces
└── hooks/
    ├── useAreaInsights.ts       # Custom hook for area data
    └── useMapMarkers.ts         # Custom hook for map markers
```

### Data Flow

```
Search Query → NeighborhoodMCP → Area Insights + Property Coordinates (within radius) → Map Integration Section
```

**Key Implementation Note**: Map markers will display properties within a defined radius of the search location, not all properties from the search results.

## Technical Implementation

### 1. Environment Setup

#### Google Maps API Key Configuration

- **File**: `mcp-sandbox/.env`
- **Variable**: `VITE_GOOGLE_MAPS_API_KEY`
- **API Key**: `AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU`
- **Usage**: Frontend environment variable for Google Maps integration
- **Security**: API key restrictions for domain/IP whitelisting

#### Dependencies

```json
{
  "@vis.gl/react-google-maps": "^1.3.0",
  "@types/google.maps": "^3.54.0"
}
```

### 2. Backend Extensions

#### NeighborhoodMCP Enhancements

**File**: `src/mcp/neighborhood/NeighborhoodMCP.ts`

**New Methods**:

```typescript
interface AreaInsights {
  areaName: string;
  averageRent: {
    oneBedroom: number;
    twoBedroom: number;
    threeBedroom: number;
  };
  localAmenities: string[];
  transportLinks: string[];
  walkabilityScore: number;
  safetyScore: number;
  schoolScore: number;
}

interface PropertyWithCoordinates extends Property {
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromCenter: number; // Distance in km from search center
}

async getAreaInsights(location: string): Promise<AreaInsights>
async getPropertyCoordinates(properties: Property[], searchLocation: string, radiusKm: number = 5): Promise<PropertyWithCoordinates[]>
async getPropertiesWithinRadius(properties: Property[], centerLat: number, centerLng: number, radiusKm: number): Promise<PropertyWithCoordinates[]>
```

**Enhanced Response Structure**:

```typescript
interface EnhancedNeighborhoodData {
  // Existing fields...
  areaInsights: AreaInsights;
  propertyCoordinates: PropertyWithCoordinates[];
}
```

#### API Endpoint Extensions

**File**: `src/controllers/mcpRoutes.ts`

**New Endpoints**:

```typescript
// GET /api/mcp/area-insights/:location
// GET /api/mcp/property-coordinates
// POST /api/mcp/map-data (combined area insights + coordinates)
// GET /api/mcp/properties-within-radius?lat=:lat&lng=:lng&radius=:radius
```

### 3. Frontend Components

#### MapIntegrationSection.tsx

**Purpose**: Main container component that orchestrates area insights and map display

**Features**:

- Responsive layout (side-by-side on desktop, stacked on mobile)
- Loading states for both panels
- Error handling and fallbacks
- Integration with search results

**Props**:

```typescript
interface MapIntegrationSectionProps {
  searchQuery: string;
  properties: Property[];
  searchLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  radiusKm: number; // Default: 5km radius
  isLoading: boolean;
  onMarkerClick: (property: Property) => void;
}
```

#### AreaInsightPanel.tsx

**Purpose**: Display area intelligence and insights

**Content Structure** (matching image design):

```typescript
interface AreaInsightData {
  areaName: string;
  averageRent: {
    oneBedroom: string; // "Around $3,200/month"
    twoBedroom: string;
    threeBedroom: string;
  };
  localAmenities: string; // "Known for its world-class dining, vibrant arts scene..."
  transportScore: number;
  walkabilityScore: number;
  safetyScore: number;
}
```

**UI Elements**:

- Area name with information icon
- Average rent information with bedroom breakdown
- Local amenities description
- Additional area-specific insights
- Loading skeleton
- Error state

#### PropertyMap.tsx

**Purpose**: Google Maps integration with property markers

**Features**:

- Google Maps integration using `@vis.gl/react-google-maps`
- Property markers with price labels
- Clickable markers for property details
- Map controls and zoom functionality
- Responsive sizing

**Implementation**:

```typescript
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface PropertyMapProps {
  properties: PropertyWithCoordinates[]; // Properties within radius
  center: { lat: number; lng: number }; // Search location center
  radiusKm: number; // Search radius
  zoom: number;
  onMarkerClick: (property: Property) => void;
  showRadiusCircle?: boolean; // Optional: Show radius circle on map
}
```

### 4. Google Maps Best Practices Implementation

#### API Key Management

- Environment variable configuration
- API key restrictions (HTTP referrers, IP addresses)
- Usage monitoring and quotas

#### Performance Optimization

- Lazy loading of map component
- Marker clustering for large datasets
- Efficient re-rendering with React.memo
- Debounced search updates

#### Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

#### Security

- API key protection
- CORS configuration
- Rate limiting
- Input validation

### 5. Responsive Design

#### Desktop Layout (≥768px)

```css
.map-integration-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  margin: 2rem 0;
}
```

#### Mobile Layout (<768px)

```css
.map-integration-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}
```

#### Component Sizing

- **Area Insight Panel**: Fixed width on desktop, full width on mobile
- **Map Component**: Responsive height (400px desktop, 300px mobile)
- **Markers**: Responsive sizing based on zoom level

### 6. Radius-Based Property Filtering

#### Geocoding and Distance Calculation

**Geocoding Service**: Convert search location to coordinates

```typescript
interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
  formattedAddress: string;
}

async geocodeLocation(location: string): Promise<GeocodingResult>
```

**Distance Calculation**: Haversine formula for accurate distance calculation

```typescript
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number; // Returns distance in kilometers

function filterPropertiesWithinRadius(
  properties: Property[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): PropertyWithCoordinates[];
```

#### Radius Configuration

**Default Settings**:

- Default radius: 5km
- Configurable radius: 1km, 3km, 5km, 10km, 15km
- Maximum radius: 25km (to prevent performance issues)

**Radius Circle Visualization**:

- Optional radius circle overlay on map
- Toggle visibility for user control
- Color-coded based on radius size

### 7. Data Integration

#### Search Flow Integration

1. User enters search query
2. Search triggers property data fetching
3. Extract search location coordinates (geocoding)
4. Filter properties within specified radius of search location
5. Simultaneously fetch area insights from NeighborhoodMCP
6. Combine filtered property coordinates with area data
7. Display MapIntegrationSection with both panels (showing radius-based results)
8. Show property results below (may include properties outside radius)

#### Data Caching

- Cache area insights by location
- Cache property coordinates
- Implement cache invalidation strategy
- Use React Query for data management

### 8. State Management

#### Component State

```typescript
interface MapIntegrationState {
  areaInsights: AreaInsightData | null;
  propertyCoordinates: PropertyWithCoordinates[]; // Properties within radius
  mapCenter: { lat: number; lng: number }; // Search location center
  radiusKm: number; // Search radius
  mapZoom: number;
  selectedProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  showRadiusCircle: boolean; // Toggle radius circle visibility
}
```

#### Global State Integration

- Integrate with existing search state
- Coordinate with property results state
- Handle loading states across components

### 9. Error Handling

#### Error Scenarios

- Google Maps API key invalid/missing
- Network failures for area data
- Invalid coordinates
- Map rendering failures

#### Fallback Strategies

- Static map image fallback
- Simplified area insights display
- Error boundaries for component isolation
- User-friendly error messages

### 10. Testing Strategy

#### Unit Tests

- Component rendering tests
- Hook functionality tests
- Error handling tests
- Responsive behavior tests

#### Integration Tests

- API integration tests
- Map marker interaction tests
- Search flow integration tests
- Cross-browser compatibility tests

#### Performance Tests

- Map loading performance
- Marker rendering performance
- Memory usage monitoring
- Network request optimization

### 11. Implementation Phases

#### Phase 1: Foundation (Week 1)

- [x] Environment setup and API key configuration (API Key: `AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU`)
- [ ] Backend NeighborhoodMCP extensions
- [ ] Basic component structure
- [ ] Google Maps integration setup

#### Phase 2: Core Features (Week 2)

- [ ] AreaInsightPanel implementation
- [ ] PropertyMap with markers
- [ ] Basic responsive design
- [ ] Data integration with search flow

#### Phase 3: Enhancement (Week 3)

- [ ] Advanced map features (clustering, controls)
- [ ] Performance optimization
- [ ] Error handling and fallbacks
- [ ] Accessibility improvements

#### Phase 4: Polish (Week 4)

- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Production deployment

### 12. File Structure

```
mcp-sandbox/
├── .env                                    # Environment variables (Google Maps API Key: AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU)
├── src/
│   ├── components/
│   │   └── MapIntegration/
│   │       ├── MapIntegrationSection.tsx
│   │       ├── AreaInsightPanel.tsx
│   │       ├── PropertyMap.tsx
│   │       ├── types.ts
│   │       └── hooks/
│   │           ├── useAreaInsights.ts
│   │           └── useMapMarkers.ts
│   ├── mcp/
│   │   └── neighborhood/
│   │       └── NeighborhoodMCP.ts          # Enhanced
│   └── controllers/
│       └── mcpRoutes.ts                   # Enhanced
└── docs/
    └── MAP_INTEGRATION_PLAN.md            # This document
```

### 13. Success Criteria

#### Functional Requirements

- ✅ Map displays with property markers within search radius
- ✅ Area insights show relevant information for search location
- ✅ Markers are clickable and show property details
- ✅ Radius-based filtering works correctly
- ✅ Optional radius circle visualization
- ✅ Responsive design works on all devices
- ✅ Integration with existing search flow

#### Performance Requirements

- ✅ Map loads within 2 seconds
- ✅ Markers render smoothly (60fps)
- ✅ No memory leaks during navigation
- ✅ API calls are optimized and cached

#### User Experience Requirements

- ✅ Intuitive map interaction
- ✅ Clear area insights presentation
- ✅ Smooth transitions between states
- ✅ Accessible to all users

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating map functionality with area insights into the MCP Sandbox application. The plan follows Google Maps best practices, ensures responsive design, and maintains integration with the existing architecture.

The implementation will enhance the user experience by providing geographical context and area intelligence before displaying detailed property results, making the property search more informative and user-friendly.
