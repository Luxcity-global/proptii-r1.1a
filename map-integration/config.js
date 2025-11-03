// Configuration constants for Quality of Life Map Web App
// Phase 1: Service definitions and constants

// Service categories with colors and weights for quality of life scoring
const SERVICE_CATEGORIES = {
    transport: { 
        color: '#2196F3', 
        weight: 0.20,
        name: 'Transport',
        icon: '🚇',
        description: 'Public transport and mobility options'
    },
    education: { 
        color: '#4CAF50', 
        weight: 0.25,
        name: 'Education',
        icon: '🎓',
        description: 'Schools, universities and learning facilities'
    },
    social: { 
        color: '#FF9800', 
        weight: 0.20,
        name: 'Social & Recreation',
        icon: '🏛️',
        description: 'Parks, museums, gyms and social venues'
    },
    healthcare: { 
        color: '#F44336', 
        weight: 0.25,
        name: 'Healthcare',
        icon: '🏥',
        description: 'Medical facilities and healthcare services'
    },
    essential: { 
        color: '#9C27B0', 
        weight: 0.10,
        name: 'Essential Services',
        icon: '🏪',
        description: 'Banks, police, fire stations and grocery stores'
    }
};

// Default search radius options (in meters)
const SEARCH_RADIUS_OPTIONS = {
    walking: { value: 500, label: '500m (5 min walk)', color: '#4CAF50' },
    short: { value: 1000, label: '1km (10 min walk)', color: '#2196F3' },
    medium: { value: 2000, label: '2km (20 min walk)', color: '#FF9800' },
    long: { value: 5000, label: '5km (driving)', color: '#F44336' }
};

// Default radius for each service category
const DEFAULT_SEARCH_RADIUS = 2000; // 2km

// Quality score ranges and labels
const QUALITY_SCORE_RANGES = {
    excellent: { min: 85, max: 100, label: 'Excellent', color: '#4CAF50' },
    good: { min: 70, max: 84, label: 'Good', color: '#8BC34A' },
    average: { min: 55, max: 69, label: 'Average', color: '#FF9800' },
    poor: { min: 40, max: 54, label: 'Poor', color: '#FF5722' },
    very_poor: { min: 0, max: 39, label: 'Very Poor', color: '#F44336' }
};

// Distance decay factors for scoring
const DISTANCE_DECAY_FACTORS = {
    500: 1.0,   // Full score within 500m
    1000: 0.8,  // 80% score within 1km
    2000: 0.6,  // 60% score within 2km
    5000: 0.3   // 30% score within 5km
};

// Map configuration
const MAP_CONFIG = {
    defaultCenter: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    defaultZoom: 13,
    minZoom: 10,
    maxZoom: 18,
    styles: [
        // Custom map styling can be added here
    ]
};

// API configuration
const API_CONFIG = {
    placesRequestDelay: 100, // Delay between API requests (ms)
    maxPlacesPerCategory: 20, // Maximum places to fetch per category
    requestTimeout: 10000, // Request timeout in milliseconds
    maxRetries: 3 // Maximum number of retry attempts
};

// UI configuration
const UI_CONFIG = {
    animationDuration: 300, // CSS animation duration (ms)
    debounceDelay: 500, // Debounce delay for user interactions (ms)
    tooltipDelay: 1000, // Tooltip show delay (ms)
    markerClusterMinZoom: 12, // Minimum zoom level for marker clustering
    heatmapOpacity: 0.6 // Default heatmap opacity
};

// Export configuration objects
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        SERVICE_CATEGORIES,
        SEARCH_RADIUS_OPTIONS,
        DEFAULT_SEARCH_RADIUS,
        QUALITY_SCORE_RANGES,
        DISTANCE_DECAY_FACTORS,
        MAP_CONFIG,
        API_CONFIG,
        UI_CONFIG
    };
} else {
    // Browser environment - make available globally
    window.CONFIG = {
        SERVICE_CATEGORIES,
        SEARCH_RADIUS_OPTIONS,
        DEFAULT_SEARCH_RADIUS,
        QUALITY_SCORE_RANGES,
        DISTANCE_DECAY_FACTORS,
        MAP_CONFIG,
        API_CONFIG,
        UI_CONFIG
    };
}
