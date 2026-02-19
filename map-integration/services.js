// Service discovery and API integration for Quality of Life Map Web App
// Phase 1: Google Places API service types mapping and service discovery functions

// Google Places API service types mapping to our service categories
const PLACE_TYPES = {
    transport: [
        'transit_station',
        'bus_station', 
        'subway_station',
        'train_station',
        'light_rail_station',
        'taxi_stand'
    ],
    education: [
        'school',
        'university',
        'library',
        'primary_school',
        'secondary_school'
    ],
    social: [
        'park',
        'gym',
        'museum',
        'library',
        'amusement_park',
        'zoo',
        'movie_theater',
        'bowling_alley',
        'night_club',
        'bar',
        'restaurant',
        'cafe'
    ],
    healthcare: [
        'hospital',
        'pharmacy',
        'dentist',
        'doctor',
        'physiotherapist',
        'veterinary_care'
    ],
    essential: [
        'police',
        'fire_station',
        'bank',
        'atm',
        'grocery_or_supermarket',
        'gas_station',
        'post_office',
        'local_government_office'
    ]
};

// Service discovery class for managing API calls and data aggregation
class ServiceDiscovery {
    constructor(placesService) {
        this.placesService = placesService;
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
    }

    // Main function to discover all services for a location
    async discoverServices(location, radius = CONFIG.DEFAULT_SEARCH_RADIUS) {
        const cacheKey = this.generateCacheKey(location, radius);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes cache
                return cached.data;
            }
        }

        try {
            const serviceResults = {};
            
            // Process each service category
            for (const [category, types] of Object.entries(PLACE_TYPES)) {
                serviceResults[category] = await this.discoverServiceCategory(
                    location, 
                    types, 
                    radius
                );
            }

            // Cache the results
            this.cache.set(cacheKey, {
                data: serviceResults,
                timestamp: Date.now()
            });

            return serviceResults;
        } catch (error) {
            console.error('Error discovering services:', error);
            throw error;
        }
    }

    // Discover services for a specific category
    async discoverServiceCategory(location, types, radius) {
        const categoryResults = [];
        
        for (const type of types) {
            try {
                const results = await this.searchNearbyPlaces(location, radius, type);
                categoryResults.push(...results);
            } catch (error) {
                console.warn(`Failed to search for ${type}:`, error);
            }
            
            // Add delay between requests to respect API limits
            await this.delay(CONFIG.API_CONFIG.placesRequestDelay);
        }

        // Remove duplicates based on place_id
        const uniqueResults = this.removeDuplicates(categoryResults);
        
        // Sort by rating and distance
        return this.sortByQuality(uniqueResults, location);
    }

    // Search for nearby places using Google Places API
    searchNearbyPlaces(location, radius, type) {
        return new Promise((resolve, reject) => {
            const request = {
                location: location,
                radius: radius,
                type: type
            };

            this.placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results || []);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(new Error(`Places API error: ${status}`));
                }
            });
        });
    }

    // Remove duplicate places based on place_id
    removeDuplicates(places) {
        const seen = new Set();
        return places.filter(place => {
            if (!place.place_id || seen.has(place.place_id)) {
                return false;
            }
            seen.add(place.place_id);
            return true;
        });
    }

    // Sort places by quality (rating and distance)
    sortByQuality(places, centerLocation) {
        return places
            .map(place => ({
                ...place,
                distance: this.calculateDistance(centerLocation, place.geometry.location),
                qualityScore: this.calculatePlaceQuality(place, centerLocation)
            }))
            .sort((a, b) => b.qualityScore - a.qualityScore)
            .slice(0, CONFIG.API_CONFIG.maxPlacesPerCategory);
    }

    // Calculate quality score for a place
    calculatePlaceQuality(place, centerLocation) {
        let score = 50; // Base score

        // Check business status - penalize permanently closed businesses
        if (place.business_status === 'CLOSED_PERMANENTLY') {
            return 0; // Permanently closed businesses get 0 score
        }
        
        // Bonus for operational businesses
        if (place.business_status === 'OPERATIONAL') {
            score += 5;
        }

        // Factor in rating
        if (place.rating) {
            score += (place.rating - 2.5) * 20; // Scale rating (1-5) to influence score
        }

        // Factor in distance (closer is better)
        const distance = this.calculateDistance(centerLocation, place.geometry.location);
        const distanceFactor = Math.max(0, 1 - (distance / 2000)); // Decay over 2km
        score += distanceFactor * 30;

        // Factor in user ratings total (popularity)
        if (place.user_ratings_total) {
            const popularityFactor = Math.min(1, place.user_ratings_total / 100);
            score += popularityFactor * 20;
        }

        return Math.max(0, Math.min(100, score));
    }

    // Calculate distance between two points in meters
    calculateDistance(location1, location2) {
        const lat1 = location1.lat();
        const lng1 = location1.lng();
        const lat2 = location2.lat();
        const lng2 = location2.lng();

        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // Generate cache key for location and radius
    generateCacheKey(location, radius) {
        const lat = Math.round(location.lat() * 1000) / 1000;
        const lng = Math.round(location.lng() * 1000) / 1000;
        return `${lat}_${lng}_${radius}`;
    }

    // Utility function to add delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Enhanced marker creation with service categories
class ServiceMarkerManager {
    constructor(map) {
        this.map = map;
        this.markers = {};
        this.clusterers = {};
        this.infoWindows = [];
        this.iconGenerator = new ServiceIconGenerator();
        
        // Initialize marker arrays for each category
        Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
            this.markers[category] = [];
            this.clusterers[category] = new markerClusterer.MarkerClusterer({
                map: this.map,
                markers: [],
                renderer: {
                    render: ({ count, position }, stats) => {
                        // Get services in this cluster to determine dominant category
                        const services = this.getServicesInCluster(position, category);
                        const iconURL = this.iconGenerator.getClusterIcon(services, this.getClusterSize(count));
                        
                        return new google.maps.Marker({
                            position,
                            icon: {
                                url: iconURL,
                                scaledSize: new google.maps.Size(this.getClusterSize(count), this.getClusterSize(count)),
                                anchor: new google.maps.Point(this.getClusterSize(count)/2, this.getClusterSize(count)/2)
                            },
                            label: {
                                text: count > 99 ? '99+' : count.toString(),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            },
                            title: `${count} ${category} services`,
                            zIndex: 1000 + count
                        });
                    }
                }
            });
        });
    }

    // Create service marker with category-specific styling
    createServiceMarker(place, category) {
        const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
        
        // Determine service type for specific icon
        const serviceType = this.getServiceType(place, category);
        
        // Calculate quality factor for dynamic sizing
        const qualityFactor = this.calculateQualityFactor(place);
        
        // Generate dynamic icon
        const iconURL = this.iconGenerator.generateIconURL(category, serviceType, {
            size: 32,
            quality: qualityFactor,
            color: categoryConfig.color
        });
        
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            title: place.name,
            animation: google.maps.Animation.DROP,
            icon: {
                url: iconURL,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            },
            optimized: false // Allow for custom SVG icons
        });

        // Store additional data on marker
        marker.serviceData = {
            category: category,
            serviceType: serviceType,
            quality: qualityFactor,
            place: place
        };

        // Create enhanced info window
        const infoWindow = new google.maps.InfoWindow({
            content: this.createEnhancedMarkerInfoContent(place, category, serviceType, qualityFactor),
            maxWidth: 300
        });

        // Add click listener with enhanced interaction
        marker.addListener('click', () => {
            this.closeAllInfoWindows();
            this.highlightMarker(marker, true);
            infoWindow.open(this.map, marker);
            this.infoWindows.push(infoWindow);
        });

        // Add hover effects
        marker.addListener('mouseover', () => {
            this.highlightMarker(marker, true);
        });

        marker.addListener('mouseout', () => {
            if (!this.infoWindows.some(iw => iw.anchor === marker)) {
                this.highlightMarker(marker, false);
            }
        });

        // Add to category-specific arrays
        this.markers[category].push(marker);
        this.clusterers[category].addMarker(marker);
        
        return marker;
    }

    // Determine service type based on place types
    getServiceType(place, category) {
        if (!place.types) return 'default';
        
        const placeTypes = place.types;
        const categoryTypes = PLACE_TYPES[category] || [];
        
        // Find the most specific match
        for (const type of categoryTypes) {
            if (placeTypes.includes(type)) {
                // Map Google Places types to our icon types
                switch (type) {
                    case 'bus_station': return 'bus';
                    case 'train_station': 
                    case 'transit_station': return 'train';
                    case 'subway_station': return 'subway';
                    case 'school':
                    case 'primary_school':
                    case 'secondary_school': return 'school';
                    case 'university': return 'university';
                    case 'library': return 'library';
                    case 'park': return 'park';
                    case 'gym': return 'gym';
                    case 'museum': return 'museum';
                    case 'hospital': return 'hospital';
                    case 'pharmacy': return 'pharmacy';
                    case 'dentist': return 'dentist';
                    case 'police': return 'police';
                    case 'fire_station': return 'fire_station';
                    case 'bank': return 'bank';
                    case 'grocery_or_supermarket': return 'grocery';
                    default: return 'default';
                }
            }
        }
        
        return 'default';
    }

    // Calculate quality factor for dynamic sizing (0-1)
    calculateQualityFactor(place) {
        let factor = 0.5; // Base factor
        
        // Rating contribution (40% of factor)
        if (place.rating) {
            factor += (place.rating - 2.5) / 2.5 * 0.4;
        }
        
        // Popularity contribution (30% of factor)
        if (place.user_ratings_total) {
            const popularityScore = Math.min(1, place.user_ratings_total / 100);
            factor += popularityScore * 0.3;
        }
        
        // Price level contribution (20% of factor - lower is better for accessibility)
        if (place.price_level !== undefined) {
            factor += (4 - place.price_level) / 4 * 0.2;
        }
        
        // Opening hours contribution (10% of factor)
        if (place.opening_hours) {
            // Use isOpen() method if available, fall back to open_now for compatibility
            const isCurrentlyOpen = typeof place.opening_hours.isOpen === 'function' 
                ? place.opening_hours.isOpen() 
                : place.opening_hours.open_now;
            if (isCurrentlyOpen) {
                factor += 0.1;
            }
        }
        
        return Math.max(0.3, Math.min(1.0, factor));
    }

    // Highlight marker with enhanced icon
    highlightMarker(marker, highlight) {
        if (!marker.serviceData) return;
        
        const { category, serviceType, quality } = marker.serviceData;
        const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
        
        const iconURL = this.iconGenerator.generateIconURL(category, serviceType, {
            size: highlight ? 40 : 32,
            quality: quality,
            color: categoryConfig.color,
            selected: highlight
        });
        
        marker.setIcon({
            url: iconURL,
            scaledSize: new google.maps.Size(highlight ? 40 : 32, highlight ? 40 : 32),
            anchor: new google.maps.Point(highlight ? 20 : 16, highlight ? 20 : 16)
        });
        
        marker.setZIndex(highlight ? 1000 : 100);
    }

    // Get cluster size based on number of markers
    getClusterSize(count) {
        if (count < 5) return 30;
        if (count < 10) return 40;
        if (count < 20) return 50;
        return 60;
    }

    // Get services in cluster (simplified for now)
    getServicesInCluster(position, category) {
        return [{ category }]; // Simplified - would need more complex logic for mixed clusters
    }

    // Get marker scale based on rating (legacy method)
    getMarkerScale(rating) {
        if (!rating) return 6;
        return Math.max(4, Math.min(10, rating * 2));
    }

    // Create enhanced info window content
    createEnhancedMarkerInfoContent(place, category, serviceType, qualityFactor) {
        const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
        const qualityStars = this.getQualityStars(qualityFactor);
        const rating = place.rating ? 
            `<div class="marker-rating">
                <span class="stars">${'★'.repeat(Math.floor(place.rating))}</span>
                <span class="rating-value">${place.rating}/5</span>
                <span class="rating-count">(${place.user_ratings_total || 0} reviews)</span>
            </div>` : '';

        const priceLevel = place.price_level !== undefined ?
            `<div class="price-level">
                <span class="price-label">Price: </span>
                <span class="price-value">${'$'.repeat(place.price_level + 1)}</span>
            </div>` : '';

        const openNow = place.opening_hours ? (() => {
            // Use isOpen() method if available, fall back to open_now for compatibility
            const isCurrentlyOpen = typeof place.opening_hours.isOpen === 'function' 
                ? place.opening_hours.isOpen() 
                : place.opening_hours.open_now;
            return `<div class="opening-status ${isCurrentlyOpen ? 'open' : 'closed'}">
                ${isCurrentlyOpen ? '● Open now' : '● Closed'}
            </div>`;
        })() : '';

        return `
            <div class="enhanced-service-marker-info">
                <div class="marker-header">
                    <span class="category-icon" style="color: ${categoryConfig.color}">${categoryConfig.icon}</span>
                    <div class="marker-title-section">
                        <h4 class="marker-title">${place.name}</h4>
                        <span class="marker-service-type">${this.formatServiceType(serviceType)}</span>
                    </div>
                </div>
                
                <div class="marker-details">
                    <p class="marker-address">${place.vicinity || place.formatted_address || ''}</p>
                    
                    <div class="marker-metrics">
                        ${rating}
                        ${priceLevel}
                        <div class="quality-indicator">
                            <span class="quality-label">Quality: </span>
                            <span class="quality-stars">${qualityStars}</span>
                            <span class="quality-score">${Math.round(qualityFactor * 100)}%</span>
                        </div>
                    </div>
                    
                    ${openNow}
                    
                    <div class="marker-category">
                        <span class="category-label" style="background-color: ${categoryConfig.color}">
                            ${categoryConfig.name}
                        </span>
                    </div>
                </div>
                
                <div class="marker-actions">
                    <button onclick="this.getDirections('${place.place_id}')" class="action-btn">
                        Directions
                    </button>
                    <button onclick="this.showMoreInfo('${place.place_id}')" class="action-btn secondary">
                        More Info
                    </button>
                </div>
            </div>
        `;
    }

    // Create info window content (legacy method for compatibility)
    createMarkerInfoContent(place, category) {
        const categoryConfig = CONFIG.SERVICE_CATEGORIES[category];
        const rating = place.rating ? 
            `<div class="marker-rating">
                <span class="stars">${'★'.repeat(Math.floor(place.rating))}</span>
                <span class="rating-value">${place.rating}/5</span>
            </div>` : '';

        return `
            <div class="service-marker-info">
                <div class="marker-header">
                    <span class="category-icon">${categoryConfig.icon}</span>
                    <h4>${place.name}</h4>
                </div>
                <p class="marker-address">${place.vicinity || place.formatted_address || ''}</p>
                ${rating}
                <div class="marker-category">
                    <span class="category-label" style="background-color: ${categoryConfig.color}">
                        ${categoryConfig.name}
                    </span>
                </div>
                ${place.opening_hours ? 
                    `<div class="marker-hours">
                        ${place.opening_hours.open_now ? 
                            '<span class="open">Open now</span>' : 
                            '<span class="closed">Closed</span>'
                        }
                    </div>` : ''
                }
            </div>
        `;
    }

    // Toggle category visibility
    toggleCategory(category, visible) {
        this.markers[category].forEach(marker => {
            marker.setVisible(visible);
        });
        
        if (visible) {
            this.clusterers[category].addMarkers(this.markers[category]);
        } else {
            this.clusterers[category].clearMarkers();
        }
    }

    // Clear markers for specific category
    clearCategory(category) {
        this.markers[category].forEach(marker => {
            marker.setMap(null);
        });
        this.clusterers[category].clearMarkers();
        this.markers[category] = [];
    }

    // Clear all markers
    clearAllMarkers() {
        Object.keys(this.markers).forEach(category => {
            this.clearCategory(category);
        });
        this.closeAllInfoWindows();
    }

    // Get quality stars display
    getQualityStars(qualityFactor) {
        const starCount = Math.round(qualityFactor * 5);
        return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
    }

    // Format service type for display
    formatServiceType(serviceType) {
        return serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Close all info windows and reset highlights
    closeAllInfoWindows() {
        this.infoWindows.forEach(infoWindow => {
            // Reset highlight for marker if it has one
            if (infoWindow.anchor && infoWindow.anchor.serviceData) {
                this.highlightMarker(infoWindow.anchor, false);
            }
            infoWindow.close();
        });
        this.infoWindows = [];
    }

    // Get marker count for category
    getCategoryCount(category) {
        return this.markers[category].length;
    }

    // Get total marker count
    getTotalCount() {
        return Object.values(this.markers)
            .reduce((total, categoryMarkers) => total + categoryMarkers.length, 0);
    }
}

// Export classes and constants
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        PLACE_TYPES,
        ServiceDiscovery,
        ServiceMarkerManager
    };
} else {
    // Browser environment - make available globally
    window.PLACE_TYPES = PLACE_TYPES;
    window.ServiceDiscovery = ServiceDiscovery;
    window.ServiceMarkerManager = ServiceMarkerManager;
}
