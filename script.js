// Global variables for Quality of Life Map App
let map;
let markers = []; // Legacy marker array for compatibility
let clusterer; // Legacy clusterer for compatibility
let autocomplete;
let placesService;
let geocoder;
let currentLocation = null;

// New modular components
let serviceDiscovery;
let serviceMarkerManager; 
let qualityScorer;
let currentServices = {}; // Store discovered services by category
let currentScore = null; // Store current quality score
let serviceFilters = {}; // Store filter states

// Phase 3 components
let realTimeManager;
let historicalTracker;
let isRealTimeEnabled = false;
let comparisonMode = false;
let comparisonData = [];

// Phase 4 components
let serviceDensityHeatmap;
let interactiveChartManager;
let enhancedDashboardVisualizer;
let isHeatmapVisible = false;
let currentHeatmapCategory = null;

// Phase 5 components
let insightsGenerator;
let currentInsights = null;

// Initialize the map when the page loads
function initMap() {
    try {
        // Initialize map with configuration
        map = new google.maps.Map(document.getElementById('map'), {
            center: CONFIG.MAP_CONFIG.defaultCenter,
            zoom: CONFIG.MAP_CONFIG.defaultZoom,
            minZoom: CONFIG.MAP_CONFIG.minZoom,
            maxZoom: CONFIG.MAP_CONFIG.maxZoom,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            styles: CONFIG.MAP_CONFIG.styles
        });

        // Initialize Google Maps services
        placesService = new google.maps.places.PlacesService(map);
        geocoder = new google.maps.Geocoder();

        // Initialize new modular components
        serviceDiscovery = new ServiceDiscovery(placesService);
        serviceMarkerManager = new ServiceMarkerManager(map);
        qualityScorer = new QualityOfLifeScorer();

        // Initialize Phase 3 components
        realTimeManager = new RealTimeScoreManager(qualityScorer, serviceDiscovery);
        historicalTracker = new HistoricalScoreTracker();

        // Initialize Phase 4 components
        serviceDensityHeatmap = new ServiceDensityHeatmap(map);
        interactiveChartManager = new InteractiveChartManager();
        enhancedDashboardVisualizer = new EnhancedDashboardVisualizer();

        // Initialize Phase 5 components
        insightsGenerator = new InsightsGenerator();

        // Initialize legacy marker clustering (for backward compatibility)
        initializeMarkerClusterer();

        // Initialize autocomplete
        initializeAutocomplete();

        // Initialize UI components
        initializeTabbedInterface();
        initializeServiceFilters();
        initializeQualityDashboard();
        initializeAdvancedControls(); // Phase 3
        initializeVisualizationControls(); // Phase 4
        initializeEnhancedInsights(); // Phase 5
        initializeControls();

        // Add click listener to map
        map.addListener('click', (event) => {
            const clickedLocation = event.latLng;
            handleLocationSelection(clickedLocation);
        });

        console.log('Quality of Life Map initialized successfully');
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showError('Failed to initialize Google Maps. Please check your API key.');
    }
}

// Export initMap to global scope immediately for Google Maps callback
window.initMap = initMap;

// Initialize marker clustering
function initializeMarkerClusterer() {
    // Initialize the marker clusterer with default options
    // Using the @googlemaps/markerclusterer library syntax
    clusterer = new markerClusterer.MarkerClusterer({
        map: map,
        markers: []
    });
}

// Initialize tabbed interface
function initializeTabbedInterface() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            const targetContent = document.getElementById(`${targetTab}-tab`);
            const isCurrentlyActive = button.classList.contains('active');
            
            if (isCurrentlyActive) {
                // If clicking the active tab, close it
                button.classList.remove('active');
                if (targetContent) {
                    targetContent.classList.remove('active');
                }
            } else {
                // Close all other tabs first
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Open the clicked tab
                button.classList.add('active');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    });
}

// Initialize controls
function initializeControls() {
    // Clear markers button
    const clearButton = document.getElementById('clear-markers');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllMarkers);
    }
    
    // Toggle all services button
    const toggleButton = document.getElementById('toggle-all-services');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleAllServices);
    }
    
    updateMarkerCount();
}

// Initialize service filter UI components
function initializeServiceFilters() {
    const filterContainer = document.getElementById('filter-categories');
    if (!filterContainer) return;

    // Initialize filter states
    Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
        serviceFilters[category] = {
            enabled: true,
            radius: CONFIG.DEFAULT_SEARCH_RADIUS
        };
    });

    // Generate filter UI
    filterContainer.innerHTML = Object.entries(CONFIG.SERVICE_CATEGORIES)
        .map(([category, config]) => createServiceFilterHTML(category, config))
        .join('');

    // Add event listeners to filter controls
    Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
        const toggle = document.getElementById(`${category}-toggle`);
        const slider = document.getElementById(`${category}-radius`);
        const ratingSlider = document.getElementById(`${category}-min-rating`);
        const reviewsSlider = document.getElementById(`${category}-min-reviews`);
        
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                serviceFilters[category].enabled = e.target.checked;
                serviceMarkerManager.toggleCategory(category, e.target.checked);
                updateServiceCounts();
                if (currentLocation) {
                    debounceQualityAssessment();
                }
            });
        }
        
        if (slider) {
            slider.addEventListener('input', (e) => {
                const radius = parseInt(e.target.value);
                serviceFilters[category].radius = radius;
                updateRadiusDisplay(category, radius);
                if (currentLocation && serviceFilters[category].enabled) {
                    debounceQualityAssessment();
                }
            });
        }

        // Quality filter event listeners
        if (ratingSlider) {
            ratingSlider.addEventListener('input', (e) => {
                const rating = parseFloat(e.target.value);
                serviceFilters[category].minRating = rating;
                updateRatingDisplay(category, rating);
                if (currentLocation && serviceFilters[category].enabled) {
                    applyServiceFilters(category);
                }
            });
        }

        if (reviewsSlider) {
            reviewsSlider.addEventListener('input', (e) => {
                const reviews = parseInt(e.target.value);
                serviceFilters[category].minReviews = reviews;
                updateReviewsDisplay(category, reviews);
                if (currentLocation && serviceFilters[category].enabled) {
                    applyServiceFilters(category);
                }
            });
        }

        // Initialize advanced filters for subcategories
        initializeAdvancedFilters(category);
    });
}

// Create HTML for service filter component with advanced controls
function createServiceFilterHTML(category, config) {
    return `
        <div class="filter-category" data-category="${category}">
            <div class="category-header">
                <div class="category-toggle">
                    <input type="checkbox" id="${category}-toggle" checked>
                    <div class="slider"></div>
                    <div class="track"></div>
                </div>
                <div class="category-info">
                    <div class="category-title">
                        <span class="category-icon">${config.icon}</span>
                        <span>${config.name}</span>
                    </div>
                    <div class="category-description">${config.description}</div>
                </div>
            </div>
            
            <div class="radius-control">
                <div class="radius-label">Search Radius</div>
                <div class="radius-slider">
                    <input type="range" id="${category}-radius" min="500" max="5000" value="${CONFIG.DEFAULT_SEARCH_RADIUS}" step="100">
                </div>
                <div class="radius-value" id="${category}-radius-value">${CONFIG.DEFAULT_SEARCH_RADIUS}m</div>
                <div class="service-count" id="${category}-count">0 services found</div>
            </div>

            <!-- Quality Filters -->
            <div class="quality-filters">
                <div class="quality-filter-header">
                    <span class="quality-filter-title">Quality Filters</span>
                </div>
                <div class="quality-controls">
                    <div class="rating-filter">
                        <label for="${category}-min-rating">Min Rating:</label>
                        <div class="rating-slider">
                            <input type="range" id="${category}-min-rating" min="0" max="5" value="0" step="0.5">
                        </div>
                        <span class="filter-value" id="${category}-rating-value">Any</span>
                    </div>
                    <div class="rating-filter">
                        <label for="${category}-min-reviews">Min Reviews:</label>
                        <div class="rating-slider">
                            <input type="range" id="${category}-min-reviews" min="0" max="50" value="0" step="5">
                        </div>
                        <span class="filter-value" id="${category}-reviews-value">0</span>
                    </div>
                </div>
            </div>

            <!-- Advanced Filters Toggle -->
            <div class="advanced-filters-toggle">
                <button class="toggle-advanced" onclick="toggleAdvancedFilters('${category}')">
                    Show Advanced Filters
                </button>
            </div>

            <!-- Advanced Filters Panel -->
            <div class="advanced-filters" id="${category}-advanced-filters">
                <div class="subcategory-filters">
                    <h6>Service Types</h6>
                    <div id="${category}-subcategory-filters">
                        <!-- Subcategory checkboxes will be populated by JavaScript -->
                    </div>
                </div>
                
                <div class="operating-hours-filter">
                    <h6>Operating Hours</h6>
                    <div class="subcategory-item">
                        <input type="checkbox" id="${category}-open-now" class="subcategory-checkbox">
                        <label for="${category}-open-now" class="subcategory-label">Open Now</label>
                    </div>
                    <div class="subcategory-item">
                        <input type="checkbox" id="${category}-open-24h" class="subcategory-checkbox">
                        <label for="${category}-open-24h" class="subcategory-label">24 Hour Service</label>
                    </div>
                </div>

                <div class="price-filter">
                    <h6>Price Level</h6>
                    <div class="price-checkboxes">
                        <div class="subcategory-item">
                            <input type="checkbox" id="${category}-price-free" class="subcategory-checkbox" checked>
                            <label for="${category}-price-free" class="subcategory-label">Free</label>
                        </div>
                        <div class="subcategory-item">
                            <input type="checkbox" id="${category}-price-1" class="subcategory-checkbox" checked>
                            <label for="${category}-price-1" class="subcategory-label">$ (Inexpensive)</label>
                        </div>
                        <div class="subcategory-item">
                            <input type="checkbox" id="${category}-price-2" class="subcategory-checkbox" checked>
                            <label for="${category}-price-2" class="subcategory-label">$$ (Moderate)</label>
                        </div>
                        <div class="subcategory-item">
                            <input type="checkbox" id="${category}-price-3" class="subcategory-checkbox" checked>
                            <label for="${category}-price-3" class="subcategory-label">$$$ (Expensive)</label>
                        </div>
                        <div class="subcategory-item">
                            <input type="checkbox" id="${category}-price-4" class="subcategory-checkbox" checked>
                            <label for="${category}-price-4" class="subcategory-label">$$$$ (Very Expensive)</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize quality dashboard UI
function initializeQualityDashboard() {
    const categoryScoresContainer = document.getElementById('category-scores');
    if (!categoryScoresContainer) return;

    // Generate category score bars
    categoryScoresContainer.innerHTML = Object.entries(CONFIG.SERVICE_CATEGORIES)
        .map(([category, config]) => createCategoryScoreHTML(category, config))
        .join('');
}

// Create HTML for category score bar
function createCategoryScoreHTML(category, config) {
    return `
        <div class="category-bar" data-category="${category}">
            <div class="category-name">
                <span class="category-icon">${config.icon}</span>
                <span>${config.name}</span>
            </div>
            <div class="score-bar">
                <div class="score-fill" id="${category}-score-fill"></div>
            </div>
            <div class="score-number" id="${category}-score-number">0</div>
        </div>
    `;
}

// Initialize autocomplete functionality
function initializeAutocomplete() {
    const input = document.getElementById('location-input');
    
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types', 'rating', 'opening_hours', 'photos', 'website', 'formatted_phone_number', 'business_status']
    });

    // Bind autocomplete to map bounds
    autocomplete.bindTo('bounds', map);

    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            showError('No details available for this location.');
            return;
        }

        handleLocationSelection(place.geometry.location, place);
    });
}

// Add marker from place (keeps existing markers)
function addMarkerFromPlace(place) {
    const location = place.geometry.location;
    
    // Center map on the location
    map.setCenter(location);
    map.setZoom(15);

    // Create new marker
    const marker = new google.maps.Marker({
        position: location,
        title: place.name || place.formatted_address,
        animation: google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="max-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px;">${place.name || 'Selected Location'}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">${place.formatted_address}</p>
                <button onclick="removeMarker('${markers.length}')" style="margin-top: 8px; padding: 4px 8px; font-size: 11px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Remove</button>
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // Add marker to arrays and clusterer
    markers.push(marker);
    clusterer.addMarker(marker);
    updateMarkerCount();
}

// Create marker for coordinate-based locations
function createMarkerFromCoordinates(location, title, address) {
    const marker = new google.maps.Marker({
        position: location,
        title: title,
        animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="max-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px;">${title}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
                <button onclick="removeMarker('${markers.length}')" style="margin-top: 8px; padding: 4px 8px; font-size: 11px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Remove</button>
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
    clusterer.addMarker(marker);
    updateMarkerCount();
}

// Add location from coordinates (for map clicks) - Updated for quality assessment
function addLocationFromCoordinates(lat, lng) {
    const location = new google.maps.LatLng(lat, lng);
    
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const place = results[0];
            
            // Update input field
            document.getElementById('location-input').value = place.formatted_address;
            
            // Use new location selection handler
            handleLocationSelection(location, {
                formatted_address: place.formatted_address,
                name: place.formatted_address,
                types: place.types,
                place_id: place.place_id
            });
            
        } else {
            showError('Unable to get location details for these coordinates.');
        }
    });
}

// Get detailed place information
function getPlaceDetails(placeId) {
    const request = {
        placeId: placeId,
        fields: ['name', 'rating', 'formatted_phone_number', 'opening_hours', 'website', 'photos', 'reviews', 'types', 'price_level', 'business_status']
    };

    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            updateLocationDetails(place);
        }
    });
}

// Update coordinate display
function updateCoordinates(location) {
    const lat = location.lat();
    const lng = location.lng();
    
    // Convert to pixel-like format as shown in screenshot
    const x = Math.abs(lng * 1000).toFixed(2);
    const y = Math.abs(lat * 1000).toFixed(2);
    
    document.getElementById('coordinates').innerHTML = `X: ${x} px<br>Y: ${y} px`;
}

// Update location insights panel
function updateLocationInsights(place) {
    const insightContent = document.getElementById('insight-content');
    
    const types = place.types ? place.types.join(', ').replace(/_/g, ' ') : 'Unknown';
    const address = place.formatted_address || 'Address not available';
    
    insightContent.innerHTML = `
        <div class="location-info">
            <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">${address}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Type</span>
                <span class="info-value">${types}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Coordinates</span>
                <span class="info-value">
                    ${place.geometry.location.lat().toFixed(6)}, ${place.geometry.location.lng().toFixed(6)}
                </span>
            </div>
        </div>
    `;
}

// Update detailed location information panel
function updateLocationDetails(place) {
    const infoContent = document.getElementById('info-content');
    let detailsHTML = '<h4>Location Details</h4><div class="location-info">';

    // Name
    if (place.name) {
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${place.name}</span>
            </div>
        `;
    }

    // Rating
    if (place.rating) {
        const stars = '★'.repeat(Math.floor(place.rating)) + '☆'.repeat(5 - Math.floor(place.rating));
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Rating</span>
                <div class="rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-value">${place.rating}/5</span>
                </div>
            </div>
        `;
    }

    // Phone
    if (place.formatted_phone_number) {
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${place.formatted_phone_number}</span>
            </div>
        `;
    }

    // Website
    if (place.website) {
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Website</span>
                <span class="info-value">
                    <a href="${place.website}" target="_blank" rel="noopener noreferrer">
                        ${place.website}
                    </a>
                </span>
            </div>
        `;
    }

    // Opening Hours
    if (place.opening_hours && place.opening_hours.weekday_text) {
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Opening Hours</span>
                <div class="opening-hours">
                    <div class="hours-list">
                        ${place.opening_hours.weekday_text.map(day => 
                            `<div class="hours-item">${day}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Price Level
    if (place.price_level !== undefined) {
        const priceSymbols = '$'.repeat(place.price_level + 1);
        detailsHTML += `
            <div class="info-item">
                <span class="info-label">Price Level</span>
                <span class="info-value">${priceSymbols}</span>
            </div>
        `;
    }

    detailsHTML += '</div>';
    infoContent.innerHTML = detailsHTML;
}

// Show error message
function showError(message) {
    const insightContent = document.getElementById('insights-summary');
    if (insightContent) {
        insightContent.innerHTML = `<div class="error">${message}</div>`;
    }
    
    const infoContent = document.getElementById('info-content');
    if (infoContent) {
        infoContent.innerHTML = `<h4>Location Details</h4><div class="error">${message}</div>`;
    }
}

// Handle API loading errors
window.gm_authFailure = function() {
    showError('Google Maps API authentication failed. Please check your API key.');
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add input event listener for real-time search
    const locationInput = document.getElementById('location-input');
    
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Trigger autocomplete if needed
            google.maps.event.trigger(autocomplete, 'place_changed');
        }
    });

    // Clear button functionality (if needed)
    locationInput.addEventListener('input', function(e) {
        if (e.target.value === '') {
            // Reset to default view
            document.getElementById('coordinates').innerHTML = 'X: 0 px<br>Y: 0 px';
            document.getElementById('insight-content').innerHTML = '<p class="no-location">Search for a location to see insights</p>';
            document.getElementById('info-content').innerHTML = '<h4>Location Details</h4><p class="no-info">Select a location to view detailed information</p>';
        }
    });

    console.log('DOM loaded, waiting for Google Maps API...');
});

// Clear all markers function - Updated for new system
function clearAllMarkers() {
    // Clear new service markers
    if (serviceMarkerManager) {
        serviceMarkerManager.clearAllMarkers();
    }
    
    // Clear legacy markers
    if (clusterer) {
        clusterer.clearMarkers();
    }
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
    
    // Reset location and services
    currentLocation = null;
    currentServices = {};
    currentScore = null;
    
    // Reset UI displays
    document.getElementById('coordinates').innerHTML = 'X: 0 px<br>Y: 0 px';
    document.getElementById('location-input').value = '';
    updateLocationName('Select a location to begin assessment');
    
    // Reset quality dashboard
    resetQualityDashboard();
    
    // Reset insights panel
    const summaryElement = document.getElementById('insights-summary');
    if (summaryElement) {
        summaryElement.innerHTML = '<p class="no-info">Search for a location to see quality of life insights</p>';
    }
    
    // Hide detail sections
    const detailSections = ['location-details', 'service-breakdown'];
    detailSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    });
    
    // Reset service counts
    Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
        updateServiceCount(category, 0);
    });
    
    updateMarkerCount();
}

// Remove individual marker function
function removeMarker(index) {
    if (index >= 0 && index < markers.length) {
        const marker = markers[index];
        marker.setMap(null);
        clusterer.removeMarker(marker);
        markers.splice(index, 1);
        updateMarkerCount();
    }
}

// Update marker count display
function updateMarkerCount() {
    const count = markers.length;
    const insightContent = document.getElementById('insights-summary');
    
    // Add or update marker count display
    let countElement = document.querySelector('.marker-count');
    if (!countElement && insightContent) {
        countElement = document.createElement('div');
        countElement.className = 'marker-count';
        insightContent.appendChild(countElement);
    }
    
    if (countElement) {
        countElement.textContent = `${count} marker${count !== 1 ? 's' : ''} on map`;
    }
    
    // Enable/disable clear button
    const clearButton = document.getElementById('clear-markers');
    if (clearButton) {
        clearButton.disabled = count === 0;
    }
}

// Search for nearby places
function searchNearbyPlaces(type) {
    if (!currentLocation) {
        showError('Please search for a location first to find nearby places.');
        return;
    }

    const request = {
        location: currentLocation,
        radius: 2000, // 2km radius
        type: type
    };

    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Add markers for nearby places (limit to 10 to avoid clutter)
            const limitedResults = results.slice(0, 10);
            
            limitedResults.forEach(place => {
                if (place.geometry && place.geometry.location) {
                    const marker = new google.maps.Marker({
                        position: place.geometry.location,
                        title: place.name,
                        animation: google.maps.Animation.DROP,
                        icon: {
                            url: place.icon,
                            scaledSize: new google.maps.Size(20, 20)
                        }
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="max-width: 200px;">
                                <h4 style="margin: 0 0 8px 0; font-size: 14px;">${place.name}</h4>
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${place.vicinity}</p>
                                ${place.rating ? `<p style="margin: 0 0 8px 0; font-size: 12px;">Rating: ${'★'.repeat(Math.floor(place.rating))} ${place.rating}/5</p>` : ''}
                                <button onclick="removeMarker('${markers.length}')" style="margin-top: 8px; padding: 4px 8px; font-size: 11px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Remove</button>
                            </div>
                        `
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });

                    markers.push(marker);
                    clusterer.addMarker(marker);
                }
            });
            
            updateMarkerCount();
            
            // Update insight panel
            const typeFormatted = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const insightContent = document.getElementById('insight-content');
            insightContent.innerHTML = `
                <div class="location-info">
                    <div class="info-item">
                        <span class="info-label">Nearby Search</span>
                        <span class="info-value">Found ${limitedResults.length} ${typeFormatted} within 2km</span>
                    </div>
                </div>
            `;
        } else {
            showError(`No ${type.replace(/_/g, ' ')} found nearby.`);
        }
    });
}

// Make removeMarker globally accessible
window.removeMarker = removeMarker;

// ========================================
// NEW QUALITY OF LIFE ASSESSMENT FUNCTIONS
// ========================================

// Handle location selection (main entry point for quality assessment)
async function handleLocationSelection(location, place = null) {
    try {
        currentLocation = location;
        
        // Update map view
        map.setCenter(location);
        map.setZoom(15);
        
        // Update coordinate display
        updateCoordinates(location);
        
        // Update location name
        const locationName = place ? (place.name || place.formatted_address) : 'Selected Location';
        updateLocationName(locationName);
        
        // Clear previous markers and reset UI
        serviceMarkerManager.clearAllMarkers();
        resetQualityDashboard();
        
        // Show loading state
        showLoadingState();
        
        // Discover services and calculate quality score
        await performQualityAssessment(location);
        
    } catch (error) {
        console.error('Error handling location selection:', error);
        showError('Failed to assess location quality. Please try again.');
    }
}

// Perform comprehensive quality of life assessment
async function performQualityAssessment(location) {
    try {
        // Discover services for all enabled categories
        const enabledCategories = Object.keys(serviceFilters).filter(
            category => serviceFilters[category].enabled
        );
        
        currentServices = {};
        
        // Fetch services for each enabled category with custom radius
        for (const category of enabledCategories) {
            const radius = serviceFilters[category].radius;
            currentServices[category] = await serviceDiscovery.discoverServiceCategory(
                location,
                PLACE_TYPES[category],
                radius
            );
            
            // Create markers for this category
            currentServices[category].forEach(service => {
                serviceMarkerManager.createServiceMarker(service, category);
            });
            
            // Update service count display
            updateServiceCount(category, currentServices[category].length);
        }
        
        // Calculate enhanced quality score with Phase 3 features
        const scoreOptions = {
            demographic: getCurrentDemographic(),
            timeContext: getCurrentTimeContext(),
            includeAdvancedFactors: true
        };
        currentScore = qualityScorer.calculateAreaScore(currentServices, location, scoreOptions);
        
        // Update UI with results
        updateQualityDashboard(currentScore);
        updateLocationInsights(currentScore);
        updateServiceBreakdown(currentServices);
        
        console.log('Quality assessment completed:', currentScore);
        
    } catch (error) {
        console.error('Error performing quality assessment:', error);
        showError('Failed to complete quality assessment.');
    }
}

// Debounced quality assessment for real-time updates
let assessmentTimeout;
function debounceQualityAssessment() {
    if (assessmentTimeout) {
        clearTimeout(assessmentTimeout);
    }
    
    assessmentTimeout = setTimeout(() => {
        if (currentLocation) {
            performQualityAssessment(currentLocation);
        }
    }, CONFIG.UI_CONFIG.debounceDelay);
}

// Update location name display
function updateLocationName(name) {
    const locationNameElement = document.getElementById('location-name');
    if (locationNameElement) {
        locationNameElement.textContent = name;
    }
}

// Update quality dashboard with score data - Enhanced for Phase 3
function updateQualityDashboard(scoreData) {
    if (!scoreData) return;
    
    // Update overall score circle
    const scoreValueElement = document.getElementById('overall-score-value');
    const scoreGradeElement = document.getElementById('score-grade');
    const scoreCircleElement = document.getElementById('score-circle');
    
    if (scoreValueElement) {
        scoreValueElement.textContent = Math.round(scoreData.overall * 100);
    }
    
    if (scoreGradeElement) {
        let gradeText = scoreData.grade.label;
        
        // Add percentile ranking if available
        if (scoreData.percentile) {
            gradeText += ` (${scoreData.percentile.value}th percentile)`;
        }
        
        scoreGradeElement.textContent = gradeText;
        scoreGradeElement.style.backgroundColor = scoreData.grade.color;
        scoreGradeElement.style.color = 'white';
        
        // Add tooltip with percentile description
        if (scoreData.percentile) {
            scoreGradeElement.title = scoreData.percentile.description;
        }
    }
    
    if (scoreCircleElement) {
        const percentage = scoreData.overall * 100;
        const color = ScoringUtils.getScoreColor(scoreData.overall);
        scoreCircleElement.style.background = 
            `conic-gradient(${color} ${percentage * 3.6}deg, var(--bg-secondary) ${percentage * 3.6}deg)`;
    }
    
    // Update category score bars
    Object.entries(scoreData.categories).forEach(([category, categoryData]) => {
        updateCategoryScoreBar(category, categoryData);
    });
}

// Update individual category score bar
function updateCategoryScoreBar(category, categoryData) {
    const fillElement = document.getElementById(`${category}-score-fill`);
    const numberElement = document.getElementById(`${category}-score-number`);
    
    if (fillElement) {
        const percentage = categoryData.score * 100;
        fillElement.style.transform = `scaleX(${categoryData.score})`;
        fillElement.style.background = ScoringUtils.getScoreColor(categoryData.score);
    }
    
    if (numberElement) {
        numberElement.textContent = Math.round(categoryData.score * 100);
    }
}

// Update location insights panel
function updateLocationInsights(scoreData) {
    const summaryElement = document.getElementById('insights-summary');
    if (!summaryElement || !scoreData) return;
    
    const insights = scoreData.insights;
    
    summaryElement.innerHTML = `
        <div class="insight-item">
            <h5>Quality Assessment</h5>
            <p>${insights.summary}</p>
            ${scoreData.percentile ? `
                <div class="percentile-badge">
                    <span class="percentile-rank">${scoreData.percentile.value}th percentile</span>
                    <span class="percentile-description">${scoreData.percentile.description}</span>
                </div>
            ` : ''}
        </div>
        
        ${insights.strengths.length > 0 ? `
            <div class="insight-item">
                <h6>Strengths</h6>
                <ul>
                    ${insights.strengths.map(strength => 
                        `<li>${strength.category}: ${Math.round(strength.score)}% (${strength.serviceCount} services)</li>`
                    ).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${insights.weaknesses.length > 0 ? `
            <div class="insight-item">
                <h6>Areas for Improvement</h6>
                <ul>
                    ${insights.weaknesses.map(weakness => 
                        `<li>${weakness.category}: ${Math.round(weakness.score)}% (${weakness.serviceCount} services)</li>`
                    ).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${insights.recommendations.length > 0 ? `
            <div class="insight-item">
                <h6>Recommendations</h6>
                <ul>
                    ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    // Show the insights section
    summaryElement.style.display = 'block';
}

// Update service breakdown panel
function updateServiceBreakdown(services) {
    const breakdownElement = document.getElementById('service-breakdown');
    const itemsElement = document.getElementById('breakdown-items');
    
    if (!breakdownElement || !itemsElement) return;
    
    itemsElement.innerHTML = Object.entries(services)
        .map(([category, serviceList]) => {
            const config = CONFIG.SERVICE_CATEGORIES[category];
            return `
                <div class="breakdown-item">
                    <div class="breakdown-category">
                        <span class="category-icon">${config.icon}</span>
                        <span>${config.name}</span>
                    </div>
                    <div class="breakdown-count">${serviceList.length}</div>
                </div>
            `;
        })
        .join('');
    
    breakdownElement.style.display = 'block';
}

// Update service count display for a category
function updateServiceCount(category, count) {
    const countElement = document.getElementById(`${category}-count`);
    if (countElement) {
        countElement.textContent = `${count} service${count !== 1 ? 's' : ''} found`;
    }
}

// Update radius display for a category
function updateRadiusDisplay(category, radius) {
    const valueElement = document.getElementById(`${category}-radius-value`);
    if (valueElement) {
        if (radius >= 1000) {
            valueElement.textContent = `${(radius / 1000).toFixed(1)}km`;
        } else {
            valueElement.textContent = `${radius}m`;
        }
    }
}

// Update service counts for all categories
function updateServiceCounts() {
    Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
        const count = serviceMarkerManager.getCategoryCount(category);
        updateServiceCount(category, count);
    });
}

// Toggle all services on/off
function toggleAllServices() {
    const anyEnabled = Object.values(serviceFilters).some(filter => filter.enabled);
    const newState = !anyEnabled;
    
    Object.keys(serviceFilters).forEach(category => {
        serviceFilters[category].enabled = newState;
        const toggle = document.getElementById(`${category}-toggle`);
        if (toggle) {
            toggle.checked = newState;
        }
        serviceMarkerManager.toggleCategory(category, newState);
    });
    
    updateServiceCounts();
    
    if (currentLocation) {
        debounceQualityAssessment();
    }
}

// Reset quality dashboard to initial state
function resetQualityDashboard() {
    const scoreValueElement = document.getElementById('overall-score-value');
    const scoreGradeElement = document.getElementById('score-grade');
    const scoreCircleElement = document.getElementById('score-circle');
    
    if (scoreValueElement) scoreValueElement.textContent = '0';
    if (scoreGradeElement) {
        scoreGradeElement.textContent = 'Not assessed';
        scoreGradeElement.style.backgroundColor = '';
        scoreGradeElement.style.color = '';
    }
    if (scoreCircleElement) {
        scoreCircleElement.style.background = 'conic-gradient(var(--success-color) 0deg, var(--bg-secondary) 0deg)';
    }
    
    // Reset category score bars
    Object.keys(CONFIG.SERVICE_CATEGORIES).forEach(category => {
        const fillElement = document.getElementById(`${category}-score-fill`);
        const numberElement = document.getElementById(`${category}-score-number`);
        
        if (fillElement) fillElement.style.transform = 'scaleX(0)';
        if (numberElement) numberElement.textContent = '0';
    });
}

// Show loading state
function showLoadingState() {
    const summaryElement = document.getElementById('insights-summary');
    if (summaryElement) {
        summaryElement.innerHTML = '<div class="loading">Analyzing location quality...</div>';
    }
    
    // Update location name to show loading
    updateLocationName('Analyzing location...');
}

// ========================================
// ADVANCED FILTER FUNCTIONS (Phase 2)
// ========================================

// Initialize advanced filters for a category
function initializeAdvancedFilters(category) {
    // Initialize filter state
    if (!serviceFilters[category]) {
        serviceFilters[category] = {};
    }
    
    // Set default advanced filter values
    serviceFilters[category] = {
        ...serviceFilters[category],
        minRating: 0,
        minReviews: 0,
        openNow: false,
        open24h: false,
        priceLevel: [true, true, true, true, true], // free, $, $$, $$$, $$$$
        subcategories: {}
    };

    // Populate subcategory filters
    populateSubcategoryFilters(category);
    
    // Add event listeners for advanced filters
    addAdvancedFilterListeners(category);
}

// Populate subcategory filters based on service types
function populateSubcategoryFilters(category) {
    const container = document.getElementById(`${category}-subcategory-filters`);
    if (!container) return;

    const serviceTypes = PLACE_TYPES[category] || [];
    
    container.innerHTML = serviceTypes.map(type => {
        const formattedType = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
            <div class="subcategory-item">
                <input type="checkbox" id="${category}-${type}" class="subcategory-checkbox" checked 
                       data-category="${category}" data-type="${type}">
                <label for="${category}-${type}" class="subcategory-label">${formattedType}</label>
                <span class="subcategory-count" id="${category}-${type}-count">0</span>
            </div>
        `;
    }).join('');

    // Initialize subcategory states
    serviceTypes.forEach(type => {
        serviceFilters[category].subcategories[type] = true;
    });
}

// Add event listeners for advanced filter controls
function addAdvancedFilterListeners(category) {
    // Operating hours filters
    const openNowFilter = document.getElementById(`${category}-open-now`);
    const open24hFilter = document.getElementById(`${category}-open-24h`);
    
    if (openNowFilter) {
        openNowFilter.addEventListener('change', (e) => {
            serviceFilters[category].openNow = e.target.checked;
            applyServiceFilters(category);
        });
    }
    
    if (open24hFilter) {
        open24hFilter.addEventListener('change', (e) => {
            serviceFilters[category].open24h = e.target.checked;
            applyServiceFilters(category);
        });
    }

    // Price level filters
    for (let i = 0; i <= 4; i++) {
        const priceFilter = document.getElementById(`${category}-price-${i === 0 ? 'free' : i}`);
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                serviceFilters[category].priceLevel[i] = e.target.checked;
                applyServiceFilters(category);
            });
        }
    }

    // Subcategory filters
    const subcategoryFilters = document.querySelectorAll(`[data-category="${category}"][data-type]`);
    subcategoryFilters.forEach(filter => {
        filter.addEventListener('change', (e) => {
            const type = e.target.dataset.type;
            serviceFilters[category].subcategories[type] = e.target.checked;
            applyServiceFilters(category);
        });
    });
}

// Toggle advanced filters panel
function toggleAdvancedFilters(category) {
    const panel = document.getElementById(`${category}-advanced-filters`);
    const button = panel.previousElementSibling.querySelector('.toggle-advanced');
    
    if (panel.classList.contains('expanded')) {
        panel.classList.remove('expanded');
        button.textContent = 'Show Advanced Filters';
    } else {
        panel.classList.add('expanded');
        button.textContent = 'Hide Advanced Filters';
    }
}

// Apply service filters to existing markers
function applyServiceFilters(category) {
    if (!serviceMarkerManager || !currentServices[category]) return;

    // Clear existing markers for this category
    serviceMarkerManager.clearCategory(category);

    // Filter services based on current filter settings
    const filteredServices = currentServices[category].filter(service => 
        passesServiceFilters(service, category)
    );

    // Re-create markers for filtered services
    filteredServices.forEach(service => {
        serviceMarkerManager.createServiceMarker(service, category);
    });

    // Update service count
    updateServiceCount(category, filteredServices.length);
    updateSubcategoryCounts(category, filteredServices);
}

// Check if a service passes current filters
function passesServiceFilters(service, category) {
    const filters = serviceFilters[category];
    
    // Rating filter
    if (filters.minRating > 0 && (!service.rating || service.rating < filters.minRating)) {
        return false;
    }
    
    // Reviews filter
    if (filters.minReviews > 0 && (!service.user_ratings_total || service.user_ratings_total < filters.minReviews)) {
        return false;
    }
    
    // Open now filter - Updated to handle business_status
    if (filters.openNow) {
        // Check if business is permanently closed using business_status
        if (service.business_status === 'CLOSED_PERMANENTLY') {
            return false;
        }
        
        // Check opening hours
        if (!service.opening_hours) {
            return false;
        }
        
        // Use isOpen() method if available, fall back to open_now for compatibility
        const isCurrentlyOpen = typeof service.opening_hours.isOpen === 'function' 
            ? service.opening_hours.isOpen() 
            : service.opening_hours.open_now;
            
        if (!isCurrentlyOpen) {
            return false;
        }
    }
    
    // Price level filter
    if (service.price_level !== undefined) {
        if (!filters.priceLevel[service.price_level]) {
            return false;
        }
    } else if (!filters.priceLevel[0]) { // No price level = free
        return false;
    }
    
    // Subcategory filter
    if (service.types) {
        const hasMatchingType = service.types.some(type => 
            filters.subcategories[type] !== false
        );
        if (!hasMatchingType) {
            return false;
        }
    }
    
    return true;
}

// Update subcategory counts
function updateSubcategoryCounts(category, services) {
    const typeCounts = {};
    
    services.forEach(service => {
        if (service.types) {
            service.types.forEach(type => {
                if (PLACE_TYPES[category] && PLACE_TYPES[category].includes(type)) {
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                }
            });
        }
    });
    
    Object.keys(serviceFilters[category].subcategories).forEach(type => {
        const countElement = document.getElementById(`${category}-${type}-count`);
        if (countElement) {
            countElement.textContent = typeCounts[type] || 0;
        }
    });
}

// Update rating display
function updateRatingDisplay(category, rating) {
    const valueElement = document.getElementById(`${category}-rating-value`);
    if (valueElement) {
        valueElement.textContent = rating === 0 ? 'Any' : `${rating}+`;
    }
}

// Update reviews display
function updateReviewsDisplay(category, reviews) {
    const valueElement = document.getElementById(`${category}-reviews-value`);
    if (valueElement) {
        valueElement.textContent = reviews;
    }
}

// Make toggle function globally accessible
window.toggleAdvancedFilters = toggleAdvancedFilters;

// ========================================
// PHASE 3 ADVANCED CONTROLS AND REAL-TIME FEATURES
// ========================================

// Initialize advanced controls for Phase 3
function initializeAdvancedControls() {
    // Real-time toggle
    const realTimeToggle = document.getElementById('toggle-realtime');
    if (realTimeToggle) {
        realTimeToggle.addEventListener('click', toggleRealTimeUpdates);
    }

    // Demographic selector
    const demographicSelector = document.getElementById('demographic-selector');
    if (demographicSelector) {
        demographicSelector.addEventListener('change', (e) => {
            if (currentLocation) {
                // Trigger re-assessment with new demographic
                debounceQualityAssessment();
            }
        });
    }

    // Area comparison
    const compareButton = document.getElementById('compare-areas');
    if (compareButton) {
        compareButton.addEventListener('click', toggleComparisonMode);
    }

    // Export data
    const exportButton = document.getElementById('export-data');
    if (exportButton) {
        exportButton.addEventListener('click', exportScoreData);
    }

    // Reset filters
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetAllFilters);
    }

    // Initialize real-time indicator
    updateRealTimeIndicator();
}

// Toggle real-time updates
function toggleRealTimeUpdates() {
    const button = document.getElementById('toggle-realtime');
    const indicator = document.getElementById('real-time-indicator');
    
    if (!isRealTimeEnabled) {
        // Enable real-time updates
        realTimeManager.enableRealTimeUpdates(map);
        isRealTimeEnabled = true;
        
        // Update UI
        button.textContent = 'Disable Live Updates';
        button.classList.add('active');
        
        // Add real-time class to dashboard
        const dashboard = document.querySelector('.quality-dashboard');
        if (dashboard) {
            dashboard.classList.add('real-time');
        }
        
        // Enable real-time scoring for current location
        if (currentLocation) {
            realTimeManager.queueRealTimeUpdate(currentLocation, true);
        }
        
    } else {
        // Disable real-time updates
        realTimeManager.disableRealTimeUpdates();
        isRealTimeEnabled = false;
        
        // Update UI
        button.textContent = 'Enable Live Updates';
        button.classList.remove('active');
        
        // Remove real-time class from dashboard
        const dashboard = document.querySelector('.quality-dashboard');
        if (dashboard) {
            dashboard.classList.remove('real-time');
        }
    }
    
    updateRealTimeIndicator();
}

// Update real-time indicator
function updateRealTimeIndicator() {
    const indicator = document.getElementById('real-time-indicator');
    if (!indicator) return;
    
    if (isRealTimeEnabled) {
        indicator.textContent = '🔴 Live';
        indicator.className = 'real-time-indicator active';
    } else {
        indicator.textContent = '⚪ Off';
        indicator.className = 'real-time-indicator inactive';
    }
}

// Toggle comparison mode
function toggleComparisonMode() {
    const button = document.getElementById('compare-areas');
    
    if (!comparisonMode) {
        // Enable comparison mode
        comparisonMode = true;
        button.textContent = 'Exit Comparison';
        button.classList.add('active');
        
        // Add visual indicator to dashboard
        document.body.classList.add('comparison-mode');
        
        // Show instruction
        showComparisonInstructions();
        
    } else {
        // Disable comparison mode
        comparisonMode = false;
        button.textContent = 'Compare Areas';
        button.classList.remove('active');
        
        // Remove visual indicators
        document.body.classList.remove('comparison-mode');
        
        // Show comparison results if we have data
        if (comparisonData.length >= 2) {
            showComparisonResults();
        }
        
        // Reset comparison data
        comparisonData = [];
    }
}

// Show comparison instructions
function showComparisonInstructions() {
    const summaryElement = document.getElementById('insights-summary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <div class="comparison-instructions">
                <h5>📊 Area Comparison Mode</h5>
                <p>Click on different locations on the map to compare their quality of life scores.</p>
                <p>You can compare up to 3 areas. Click "Exit Comparison" when done.</p>
                <div class="comparison-counter">
                    <span>Areas selected: <strong>${comparisonData.length}</strong></span>
                </div>
            </div>
        `;
    }
}

// Enhanced location selection for comparison mode
function handleLocationSelectionEnhanced(location, place = null) {
    if (comparisonMode) {
        // Add to comparison data
        if (comparisonData.length < 3) {
            addToComparison(location, place);
        } else {
            showToast('Maximum 3 areas can be compared. Please exit comparison mode first.');
        }
    } else {
        // Normal location selection - call the original function
        originalHandleLocationSelection(location, place);
    }
}

// Add location to comparison
async function addToComparison(location, place = null) {
    try {
        // Show loading
        showLoadingState();
        
        // Discover services and calculate score
        const services = await serviceDiscovery.discoverServices(location);
        const scoreOptions = {
            demographic: getCurrentDemographic(),
            timeContext: getCurrentTimeContext(),
            includeAdvancedFactors: true
        };
        const score = qualityScorer.calculateAreaScore(services, location, scoreOptions);
        
        // Add to comparison data
        const areaData = {
            id: Date.now(),
            location: location,
            place: place,
            score: score,
            services: services,
            name: place ? (place.name || place.formatted_address) : `Area ${comparisonData.length + 1}`
        };
        
        comparisonData.push(areaData);
        
        // Update comparison UI
        updateComparisonDisplay();
        
        // Store in historical tracker
        historicalTracker.addScore(score, location, {
            demographic: getCurrentDemographic(),
            comparison: true
        });
        
    } catch (error) {
        console.error('Error adding to comparison:', error);
        showError('Failed to analyze area for comparison.');
    }
}

// Update comparison display
function updateComparisonDisplay() {
    const summaryElement = document.getElementById('insights-summary');
    if (!summaryElement) return;
    
    let html = `
        <div class="comparison-progress">
            <h5>📊 Area Comparison (${comparisonData.length}/3)</h5>
    `;
    
    comparisonData.forEach((area, index) => {
        html += `
            <div class="comparison-item">
                <strong>${area.name}</strong>
                <span class="comparison-score">Score: ${Math.round(area.score.overall * 100)}</span>
            </div>
        `;
    });
    
    if (comparisonData.length >= 2) {
        html += `<p><em>You can add one more area or exit comparison to see detailed results.</em></p>`;
    } else {
        html += `<p><em>Click on the map to add more areas for comparison.</em></p>`;
    }
    
    html += '</div>';
    summaryElement.innerHTML = html;
}

// Show comparison results
function showComparisonResults() {
    if (comparisonData.length < 2) return;
    
    // Create comparison modal
    const modal = createComparisonModal();
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
}

// Create comparison modal
function createComparisonModal() {
    const modal = document.createElement('div');
    modal.className = 'area-comparison';
    modal.innerHTML = `
        <div class="comparison-header">
            <h3>Area Comparison Results</h3>
            <button class="close-comparison" onclick="closeComparisonModal()">&times;</button>
        </div>
        <div class="comparison-content">
            <div class="comparison-areas">
                ${comparisonData.map(area => createComparisonAreaHTML(area)).join('')}
            </div>
            <div class="comparison-summary">
                ${createComparisonSummary()}
            </div>
        </div>
    `;
    
    return modal;
}

// Create comparison area HTML
function createComparisonAreaHTML(area) {
    const categoryScores = Object.entries(area.score.categories)
        .map(([category, data]) => {
            const config = CONFIG.SERVICE_CATEGORIES[category];
            return `
                <div class="category-comparison">
                    <span class="category-icon">${config.icon}</span>
                    <span class="category-name">${config.name}</span>
                    <span class="category-score">${Math.round(data.score * 100)}</span>
                </div>
            `;
        }).join('');
    
    return `
        <div class="comparison-area">
            <h4>${area.name}</h4>
            <div class="overall-score-large">
                <span class="score-number">${Math.round(area.score.overall * 100)}</span>
                <span class="score-grade">${area.score.grade.label}</span>
            </div>
            <div class="category-scores-list">
                ${categoryScores}
            </div>
            <div class="area-metrics">
                <div class="metric">
                    <span>Total Services:</span>
                    <span>${area.score.metrics?.totalServices || 0}</span>
                </div>
                <div class="metric">
                    <span>Walkability:</span>
                    <span>${Math.round((area.score.metrics?.walkabilityScore || 0) * 100)}%</span>
                </div>
            </div>
        </div>
    `;
}

// Create comparison summary
function createComparisonSummary() {
    const sortedAreas = [...comparisonData].sort((a, b) => b.score.overall - a.score.overall);
    const winner = sortedAreas[0];
    const categories = Object.keys(CONFIG.SERVICE_CATEGORIES);
    
    let summary = `
        <h4>Summary</h4>
        <p><strong>Best Overall:</strong> ${winner.name} (${Math.round(winner.score.overall * 100)} points)</p>
        <h5>Category Leaders:</h5>
        <ul>
    `;
    
    categories.forEach(category => {
        const leader = comparisonData.reduce((best, area) => 
            (area.score.categories[category]?.score || 0) > (best.score.categories[category]?.score || 0) ? area : best
        );
        const categoryName = CONFIG.SERVICE_CATEGORIES[category].name;
        const score = Math.round((leader.score.categories[category]?.score || 0) * 100);
        summary += `<li><strong>${categoryName}:</strong> ${leader.name} (${score})</li>`;
    });
    
    summary += '</ul>';
    return summary;
}

// Close comparison modal
function closeComparisonModal() {
    const modal = document.querySelector('.area-comparison');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Export score data
function exportScoreData() {
    try {
        const exportData = {
            currentScore: currentScore,
            currentLocation: currentLocation ? {
                lat: currentLocation.lat(),
                lng: currentLocation.lng()
            } : null,
            historicalData: historicalTracker.getHistory(),
            statistics: historicalTracker.getStatistics(),
            exportDate: new Date().toISOString(),
            version: '3.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-of-life-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Quality of life data exported successfully!');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data. Please try again.');
    }
}

// Reset all filters
function resetAllFilters() {
    // Reset service filters
    Object.keys(serviceFilters).forEach(category => {
        serviceFilters[category] = {
            enabled: true,
            radius: CONFIG.DEFAULT_SEARCH_RADIUS,
            minRating: 0,
            minReviews: 0,
            openNow: false,
            open24h: false,
            priceLevel: [true, true, true, true, true],
            subcategories: {}
        };
        
        // Update UI controls
        const toggle = document.getElementById(`${category}-toggle`);
        const radiusSlider = document.getElementById(`${category}-radius`);
        const ratingSlider = document.getElementById(`${category}-min-rating`);
        const reviewsSlider = document.getElementById(`${category}-min-reviews`);
        
        if (toggle) toggle.checked = true;
        if (radiusSlider) radiusSlider.value = CONFIG.DEFAULT_SEARCH_RADIUS;
        if (ratingSlider) ratingSlider.value = 0;
        if (reviewsSlider) reviewsSlider.value = 0;
        
        // Update displays
        updateRadiusDisplay(category, CONFIG.DEFAULT_SEARCH_RADIUS);
        updateRatingDisplay(category, 0);
        updateReviewsDisplay(category, 0);
    });
    
    // Reset demographic selector
    const demographicSelector = document.getElementById('demographic-selector');
    if (demographicSelector) {
        demographicSelector.value = 'general';
    }
    
    // Trigger re-assessment if location is selected
    if (currentLocation) {
        debounceQualityAssessment();
    }
    
    showToast('All filters reset to default values');
}

// Utility functions
function getCurrentDemographic() {
    const selector = document.getElementById('demographic-selector');
    return selector ? selector.value : 'general';
}

function getCurrentTimeContext() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (day === 0 || day === 6) return 'weekend';
    if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) return 'peak_hours';
    return 'off_peak';
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: var(--primary-color);
        color: white;
        border-radius: 6px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Update total services count
function updateTotalServicesCount() {
    const totalElement = document.getElementById('total-services-count');
    if (totalElement) {
        const total = Object.values(currentServices).reduce((sum, services) => sum + services.length, 0);
        totalElement.textContent = `${total} total services`;
    }
}

// Enhanced quality assessment with Phase 3 features
async function performQualityAssessmentEnhanced(location) {
    try {
        // Use enhanced scoring options
        const scoreOptions = {
            demographic: getCurrentDemographic(),
            timeContext: getCurrentTimeContext(),
            includeAdvancedFactors: true
        };
        
        // Perform the assessment
        await performQualityAssessment(location);
        
        // Store in historical tracker
        if (currentScore) {
            historicalTracker.addScore(currentScore, location, {
                demographic: scoreOptions.demographic,
                timeContext: scoreOptions.timeContext,
                realTime: isRealTimeEnabled
            });
        }
        
        // Update total services count
        updateTotalServicesCount();
        
    } catch (error) {
        console.error('Enhanced quality assessment failed:', error);
        showError('Quality assessment failed. Please try again.');
    }
}

// Save reference to original location selection handler before overriding
const originalHandleLocationSelection = handleLocationSelection;

// Override the original location selection handler
window.handleLocationSelection = handleLocationSelectionEnhanced;

// Make new functions globally accessible
window.closeComparisonModal = closeComparisonModal;
window.toggleRealTimeUpdates = toggleRealTimeUpdates;

// ========================================
// PHASE 4 VISUALIZATION CONTROLS AND FEATURES
// ========================================

// Initialize visualization controls for Phase 4
function initializeVisualizationControls() {
    // Heatmap toggle
    const heatmapToggle = document.getElementById('toggle-heatmap');
    if (heatmapToggle) {
        heatmapToggle.addEventListener('click', toggleHeatmap);
    }

    // Charts panel toggle
    const chartsToggle = document.getElementById('show-charts');
    if (chartsToggle) {
        chartsToggle.addEventListener('click', toggleChartsPanel);
    }

    // Heatmap category selector
    const heatmapCategory = document.getElementById('heatmap-category');
    if (heatmapCategory) {
        heatmapCategory.addEventListener('change', changeHeatmapCategory);
    }

    // Heatmap color scheme selector
    const heatmapColorScheme = document.getElementById('heatmap-color-scheme');
    if (heatmapColorScheme) {
        heatmapColorScheme.addEventListener('change', changeHeatmapColorScheme);
    }

    // Report generation
    const generateReport = document.getElementById('generate-report');
    if (generateReport) {
        generateReport.addEventListener('click', generateQualityReport);
    }

    // Chart tab switching
    const chartTabs = document.querySelectorAll('.chart-tab');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchChartTab(e.target.dataset.chart);
        });
    });

    // Initialize chart panels as hidden
    const visualizationPanel = document.getElementById('data-visualization');
    if (visualizationPanel) {
        visualizationPanel.style.display = 'none';
    }
}

// Toggle heatmap display
function toggleHeatmap() {
    const button = document.getElementById('toggle-heatmap');
    const categorySelect = document.getElementById('heatmap-category');
    const colorSchemeSelect = document.getElementById('heatmap-color-scheme');

    if (!isHeatmapVisible) {
        // Enable heatmap
        const selectedCategory = categorySelect.value;
        if (selectedCategory && currentServices[selectedCategory]) {
            serviceDensityHeatmap.showHeatmap(selectedCategory, currentServices[selectedCategory]);
            isHeatmapVisible = true;
            currentHeatmapCategory = selectedCategory;
            
            // Update UI
            button.textContent = 'Hide Heatmap';
            button.classList.add('active');
            categorySelect.disabled = false;
            colorSchemeSelect.disabled = false;
            
            // Show heatmap legend
            showHeatmapLegend(selectedCategory);
        } else {
            showToast('Please select a service category and ensure services are loaded');
        }
    } else {
        // Disable heatmap
        serviceDensityHeatmap.hideHeatmap();
        isHeatmapVisible = false;
        currentHeatmapCategory = null;
        
        // Update UI
        button.textContent = 'Service Heatmap';
        button.classList.remove('active');
        categorySelect.disabled = true;
        colorSchemeSelect.disabled = true;
        
        // Hide heatmap legend
        hideHeatmapLegend();
    }
}

// Change heatmap category
function changeHeatmapCategory() {
    const categorySelect = document.getElementById('heatmap-category');
    const selectedCategory = categorySelect.value;
    
    if (isHeatmapVisible && selectedCategory && currentServices[selectedCategory]) {
        serviceDensityHeatmap.showHeatmap(selectedCategory, currentServices[selectedCategory]);
        currentHeatmapCategory = selectedCategory;
        updateHeatmapLegend(selectedCategory);
    }
}

// Change heatmap color scheme
function changeHeatmapColorScheme() {
    const colorSchemeSelect = document.getElementById('heatmap-color-scheme');
    const selectedScheme = colorSchemeSelect.value;
    
    if (isHeatmapVisible) {
        serviceDensityHeatmap.setColorScheme(selectedScheme);
        updateHeatmapLegend(currentHeatmapCategory, selectedScheme);
    }
}

// Toggle charts panel
function toggleChartsPanel() {
    const button = document.getElementById('show-charts');
    const panel = document.getElementById('data-visualization');
    
    if (panel.style.display === 'none') {
        // Show charts panel
        panel.style.display = 'block';
        panel.style.animation = 'slideIn 0.3s ease';
        button.textContent = 'Hide Charts';
        button.classList.add('active');
        
        // Generate charts with current data
        generateCharts();
    } else {
        // Hide charts panel
        panel.style.display = 'none';
        button.textContent = 'Show Charts';
        button.classList.remove('active');
    }
}

// Switch chart tab
function switchChartTab(chartType) {
    // Update tab states
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');
    
    // Update panel states
    document.querySelectorAll('.chart-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${chartType}-panel`).classList.add('active');
    
    // Generate specific chart if needed
    generateSpecificChart(chartType);
}

// Generate all charts
function generateCharts() {
    if (currentScore) {
        // Category breakdown chart
        interactiveChartManager.createCategoryBreakdownChart(currentScore);
        
        // Service distribution chart
        if (Object.keys(currentServices).length > 0) {
            interactiveChartManager.createServiceDistributionChart(currentServices);
        }
        
        // Historical trend chart
        const historicalData = historicalTracker.getHistory();
        if (historicalData.length > 1) {
            interactiveChartManager.createHistoricalTrendChart(historicalData);
        }
        
        // Score comparison chart (if comparison data exists)
        if (comparisonData.length > 1) {
            interactiveChartManager.createScoreComparisonChart(comparisonData);
        }
    }
}

// Generate specific chart
function generateSpecificChart(chartType) {
    switch (chartType) {
        case 'category-breakdown':
            if (currentScore) {
                interactiveChartManager.createCategoryBreakdownChart(currentScore);
            }
            break;
        case 'score-comparison':
            if (comparisonData.length > 1) {
                interactiveChartManager.createScoreComparisonChart(comparisonData);
            } else {
                showChartMessage('score-comparison-chart', 'No comparison data available. Use comparison mode to compare areas.');
            }
            break;
        case 'historical-trend':
            const historicalData = historicalTracker.getHistory();
            if (historicalData.length > 1) {
                interactiveChartManager.createHistoricalTrendChart(historicalData);
            } else {
                showChartMessage('historical-trend-chart', 'Insufficient historical data. Continue using the app to build trends.');
            }
            break;
        case 'service-distribution':
            if (Object.keys(currentServices).length > 0) {
                interactiveChartManager.createServiceDistributionChart(currentServices);
            } else {
                showChartMessage('service-distribution-chart', 'No service data available. Select a location to analyze services.');
            }
            break;
    }
}

// Show message on chart canvas
function showChartMessage(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = message.split('. ');
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - 0.5) * 20);
        });
    }
}

// Show heatmap legend
function showHeatmapLegend(category) {
    const mapDiv = map.getDiv();
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    legend.id = 'heatmap-legend';
    
    const categoryName = CONFIG.SERVICE_CATEGORIES[category]?.name || category;
    const colorScheme = document.getElementById('heatmap-color-scheme').value;
    
    legend.innerHTML = `
        <h6>${categoryName} Density</h6>
        <div class="legend-gradient ${colorScheme}"></div>
        <div class="legend-labels">
            <span>Low</span>
            <span>High</span>
        </div>
    `;
    
    mapDiv.appendChild(legend);
}

// Hide heatmap legend
function hideHeatmapLegend() {
    const legend = document.getElementById('heatmap-legend');
    if (legend) {
        legend.remove();
    }
}

// Update heatmap legend
function updateHeatmapLegend(category, colorScheme = null) {
    const legend = document.getElementById('heatmap-legend');
    if (legend && category) {
        const categoryName = CONFIG.SERVICE_CATEGORIES[category]?.name || category;
        const scheme = colorScheme || document.getElementById('heatmap-color-scheme').value;
        
        legend.innerHTML = `
            <h6>${categoryName} Density</h6>
            <div class="legend-gradient ${scheme}"></div>
            <div class="legend-labels">
                <span>Low</span>
                <span>High</span>
            </div>
        `;
    }
}

// Enhanced dashboard update with animations - REMOVED to prevent infinite recursion
// Functionality integrated directly into the window.updateQualityDashboard override

// Generate comprehensive quality report
function generateQualityReport() {
    if (!currentScore || !currentLocation) {
        showToast('Please assess a location first to generate a report');
        return;
    }
    
    const reportData = {
        score: currentScore,
        location: {
            lat: currentLocation.lat(),
            lng: currentLocation.lng()
        },
        services: currentServices,
        historicalData: historicalTracker.getHistory(),
        timestamp: new Date().toISOString(),
        demographic: getCurrentDemographic()
    };
    
    // Create report modal
    const modal = createReportModal(reportData);
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => modal.classList.add('active'), 10);
}

// Create report modal
function createReportModal(reportData) {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = createReportHTML(reportData);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.close-report');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Add export functionality
    const exportBtn = modal.querySelector('.export-report');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportReport(reportData));
    }
    
    return modal;
}

// Create report HTML
function createReportHTML(reportData) {
    const location = reportData.location;
    const score = reportData.score;
    const services = reportData.services;
    const timestamp = new Date(reportData.timestamp).toLocaleString();
    
    return `
        <div class="report-content">
            <div class="report-header">
                <h3>Quality of Life Assessment Report</h3>
                <button class="close-report">&times;</button>
            </div>
            
            <div class="report-summary">
                <h4>Executive Summary</h4>
                <div class="summary-stats">
                    <div class="stat-item">
                        <strong>Overall Score:</strong> ${Math.round(score.overall * 100)}/100
                    </div>
                    <div class="stat-item">
                        <strong>Quality Grade:</strong> ${score.grade.label}
                    </div>
                    ${score.percentile ? `
                        <div class="stat-item">
                            <strong>Percentile Ranking:</strong> ${score.percentile.value}th percentile
                        </div>
                    ` : ''}
                    <div class="stat-item">
                        <strong>Assessment Date:</strong> ${timestamp}
                    </div>
                    <div class="stat-item">
                        <strong>Location:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
                    </div>
                </div>
            </div>
            
            <div class="report-categories">
                <h4>Category Analysis</h4>
                ${Object.entries(score.categories).map(([category, data]) => {
                    const config = CONFIG.SERVICE_CATEGORIES[category];
                    return `
                        <div class="category-report">
                            <h5>${config.icon} ${config.name}</h5>
                            <div class="category-details">
                                <div><strong>Score:</strong> ${Math.round(data.score * 100)}/100</div>
                                <div><strong>Services Found:</strong> ${data.serviceCount}</div>
                                ${data.averageDistance ? `
                                    <div><strong>Average Distance:</strong> ${data.averageDistance}m</div>
                                ` : ''}
                                ${data.accessibilityScore ? `
                                    <div><strong>Accessibility:</strong> ${Math.round(data.accessibilityScore * 100)}%</div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="report-insights">
                <h4>Key Insights</h4>
                <div class="insights-content">
                    <p>${score.insights.summary}</p>
                    
                    ${score.insights.demographic && score.insights.demographic.length > 0 ? `
                        <div class="insight-section">
                            <h6>Demographic Analysis</h6>
                            <ul>
                                ${score.insights.demographic.map(insight => `<li>${insight}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${score.insights.recommendations && score.insights.recommendations.length > 0 ? `
                        <div class="insight-section">
                            <h6>Recommendations</h6>
                            <ul>
                                ${score.insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="report-actions">
                <button class="control-btn secondary export-report">Export as JSON</button>
                <button class="control-btn" onclick="window.print()">Print Report</button>
            </div>
        </div>
    `;
}

// Export report as JSON
function exportReport(reportData) {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-of-life-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Report exported successfully!');
}

// Override original dashboard update function - Fixed infinite recursion
const originalUpdateQualityDashboard = updateQualityDashboard;
window.updateQualityDashboard = function(scoreData) {
    // Call original function directly without recursion
    originalUpdateQualityDashboard.call(this, scoreData);
    
    // Add enhanced animations without calling updateQualityDashboard again
    const scoreCircle = document.getElementById('score-circle');
    if (scoreCircle) {
        scoreCircle.classList.add('updating');
        if (typeof enhancedDashboardVisualizer !== 'undefined') {
            enhancedDashboardVisualizer.animateScoreCircle(scoreCircle, scoreData.overall * 100);
        }
        
        setTimeout(() => {
            scoreCircle.classList.remove('updating');
        }, 1000);
    }
    
    // Animate category bars with stagger
    if (scoreData.categories && typeof enhancedDashboardVisualizer !== 'undefined') {
        enhancedDashboardVisualizer.animateCategoryBars(scoreData.categories);
    }
    
    // Update charts if panel is visible
    const chartPanel = document.getElementById('data-visualization');
    if (chartPanel && chartPanel.style.display !== 'none') {
        generateCharts();
    }
};

// Make Phase 4 functions globally accessible
window.toggleHeatmap = toggleHeatmap;
window.generateQualityReport = generateQualityReport;

// ========================================
// PHASE 5 ENHANCED INSIGHTS FUNCTIONS
// ========================================

// Initialize enhanced insights UI components
function initializeEnhancedInsights() {
    // Initialize insight tab navigation
    const insightTabs = document.querySelectorAll('.insight-tab');
    insightTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchInsightTab(e.target.dataset.insight);
        });
    });
}

// Switch between insight tabs
function switchInsightTab(tabType) {
    // Update tab states
    document.querySelectorAll('.insight-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-insight="${tabType}"]`).classList.add('active');
    
    // Update panel states
    document.querySelectorAll('.insight-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabType}-panel`).classList.add('active');
    
    // Generate specific insight content if needed
    if (currentInsights) {
        updateInsightPanel(tabType, currentInsights);
    }
}

// Enhanced location insights update with Phase 5 insights generation
function updateLocationInsightsEnhanced(scoreData, services) {
    if (!scoreData || !insightsGenerator) return;
    
    try {
        // Generate comprehensive insights using Phase 5 system
        const insightOptions = {
            demographic: getCurrentDemographic(),
            timeContext: getCurrentTimeContext(),
            includeComparison: comparisonData.length > 0,
            comparisonData: comparisonData,
            verbosity: 'balanced',
            tone: 'professional'
        };
        
        currentInsights = insightsGenerator.generateAreaInsights(
            scoreData, 
            services, 
            insightOptions
        );
        
        // Update basic insights summary (backward compatibility)
        updateBasicInsightsSummary(currentInsights);
        
        // Show enhanced insights panel
        const enhancedInsightsPanel = document.getElementById('enhanced-insights');
        if (enhancedInsightsPanel) {
            enhancedInsightsPanel.style.display = 'block';
            
            // Update all insight panels
            updateInsightPanel('overview', currentInsights);
            updateInsightPanel('strengths', currentInsights);
            updateInsightPanel('recommendations', currentInsights);
            updateInsightPanel('demographic', currentInsights);
        }
        
        console.log('Enhanced insights generated:', currentInsights);
        
    } catch (error) {
        console.error('Error generating enhanced insights:', error);
        // Fallback to basic insights
        updateLocationInsights(scoreData);
    }
}

// Update basic insights summary for backward compatibility
function updateBasicInsightsSummary(insights) {
    const summaryElement = document.getElementById('insights-summary');
    if (!summaryElement || !insights) return;
    
    summaryElement.innerHTML = `
        <div class="insight-item">
            <h5>Quality Assessment Summary</h5>
            <p>${insights.summary}</p>
        </div>
    `;
}

// Update specific insight panel content
function updateInsightPanel(panelType, insights) {
    if (!insights) return;
    
    switch (panelType) {
        case 'overview':
            updateOverviewPanel(insights);
            break;
        case 'strengths':
            updateStrengthsPanel(insights);
            break;
        case 'recommendations':
            updateRecommendationsPanel(insights);
            break;
        case 'demographic':
            updateDemographicPanel(insights);
            break;
    }
}

// Update overview panel
function updateOverviewPanel(insights) {
    const overallAssessment = document.getElementById('overall-assessment');
    const keyMetrics = document.getElementById('key-metrics');
    
    if (overallAssessment && insights.overallAssessment) {
        const assessment = insights.overallAssessment;
        overallAssessment.innerHTML = `
            <div class="assessment-header">
                <h4 class="assessment-title">${assessment.title}</h4>
                <span class="assessment-score">${assessment.score}/100</span>
            </div>
            <p class="assessment-description">${assessment.description}</p>
            
            ${assessment.highlights && assessment.highlights.length > 0 ? `
                <div class="assessment-highlights">
                    <div class="highlight-item">
                        <h6>Strengths</h6>
                        <ul>
                            ${assessment.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                        </ul>
                    </div>
                    ${assessment.concerns && assessment.concerns.length > 0 ? `
                        <div class="concern-item">
                            <h6>Areas for Attention</h6>
                            <ul>
                                ${assessment.concerns.map(concern => `<li>${concern}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
    }
    
    if (keyMetrics && insights.metadata) {
        const metrics = InsightsUtils.extractKeyMetrics(insights);
        keyMetrics.innerHTML = `
            <div class="metric-card">
                <span class="metric-value">${metrics.overallScore}</span>
                <span class="metric-label">Overall Score</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${metrics.strengthCount}</span>
                <span class="metric-label">Strengths</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${metrics.weaknessCount}</span>
                <span class="metric-label">Areas to Improve</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${metrics.recommendationCount}</span>
                <span class="metric-label">Recommendations</span>
            </div>
        `;
    }
}

// Update strengths panel
function updateStrengthsPanel(insights) {
    const strengthsList = document.getElementById('strengths-list');
    const opportunitiesList = document.getElementById('opportunities-list');
    
    if (strengthsList && insights.strengths) {
        strengthsList.innerHTML = `
            <div class="section-header">
                <span class="section-icon">💪</span>
                <h4 class="section-title">Area Strengths</h4>
            </div>
            ${insights.strengths.map(strength => `
                <div class="strength-item">
                    <div class="item-header">
                        <span class="item-title">${strength.category}</span>
                        <span class="item-score">${strength.score}%</span>
                    </div>
                    <div class="item-details">
                        <strong>Impact:</strong> ${strength.impact}
                    </div>
                    ${strength.reasons && strength.reasons.length > 0 ? `
                        <div class="item-reasons">
                            <ul>
                                ${strength.reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        `;
    }
    
    if (opportunitiesList && insights.opportunities) {
        opportunitiesList.innerHTML = `
            <div class="section-header">
                <span class="section-icon">🎯</span>
                <h4 class="section-title">Improvement Opportunities</h4>
            </div>
            ${insights.opportunities.map(opportunity => `
                <div class="opportunity-item">
                    <div class="item-header">
                        <span class="item-title">${opportunity.category}</span>
                        <span class="item-score">${opportunity.score}%</span>
                    </div>
                    <div class="item-details">
                        <strong>Potential:</strong> ${opportunity.potential}% improvement possible
                    </div>
                    ${opportunity.quickWins && opportunity.quickWins.length > 0 ? `
                        <div class="item-suggestions">
                            <strong>Quick Wins:</strong>
                            <ul>
                                ${opportunity.quickWins.map(win => `<li>${win}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        `;
    }
}

// Update recommendations panel
function updateRecommendationsPanel(insights) {
    const recommendationsList = document.getElementById('recommendations-list');
    const actionableInsights = document.getElementById('actionable-insights');
    
    if (recommendationsList && insights.recommendations) {
        recommendationsList.innerHTML = `
            <div class="section-header">
                <span class="section-icon">💡</span>
                <h4 class="section-title">Recommendations</h4>
            </div>
            ${insights.recommendations.map(rec => `
                <div class="recommendation-item">
                    <div class="recommendation-header">
                        <span class="recommendation-category">${rec.category || 'General'}</span>
                        <span class="recommendation-priority priority-${rec.priority || 'medium'}">${rec.priority || 'medium'}</span>
                    </div>
                    <div class="recommendation-content">${rec.content || rec}</div>
                </div>
            `).join('')}
        `;
    }
    
    if (actionableInsights && insights.actionableInsights) {
        actionableInsights.innerHTML = `
            <div class="section-header">
                <span class="section-icon">⚡</span>
                <h4 class="section-title">Actionable Steps</h4>
            </div>
            ${insights.actionableInsights.map(action => `
                <div class="action-item">
                    <div class="action-header">
                        <span class="action-title">${action.category}</span>
                        <span class="action-timeframe">${action.timeframe}</span>
                    </div>
                    <ul class="action-list">
                        ${action.actions.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        `;
    }
}

// Update demographic panel
function updateDemographicPanel(insights) {
    const demographicInsights = document.getElementById('demographic-insights');
    const lifestyleCompatibility = document.getElementById('lifestyle-compatibility');
    
    if (demographicInsights && insights.demographicInsights) {
        demographicInsights.innerHTML = `
            <div class="section-header">
                <span class="section-icon">👥</span>
                <h4 class="section-title">Demographic Analysis</h4>
            </div>
            ${insights.demographicInsights.map(insight => `
                <div class="demographic-item">
                    <div class="demographic-title">${insight.title || 'Demographic Insight'}</div>
                    <div class="demographic-content">
                        ${Array.isArray(insight.items) ? 
                            insight.items.map(item => `<p>${item}</p>`).join('') : 
                            insight.content || insight
                        }
                    </div>
                </div>
            `).join('')}
        `;
    }
    
    if (lifestyleCompatibility) {
        const demographic = getCurrentDemographic();
        const demographicProfile = insightsGenerator.demographicProfiles[demographic];
        
        if (demographicProfile) {
            // Calculate compatibility score based on current insights
            const compatibilityScore = calculateLifestyleCompatibility(insights, demographic);
            
            lifestyleCompatibility.innerHTML = `
                <div class="section-header">
                    <span class="section-icon">🎯</span>
                    <h4 class="section-title">Lifestyle Compatibility</h4>
                </div>
                <div class="compatibility-score">
                    <span class="compatibility-label">${demographicProfile.name} Fit:</span>
                    <div class="compatibility-meter">
                        <div class="compatibility-fill" style="width: ${compatibilityScore}%"></div>
                    </div>
                    <span class="compatibility-value">${compatibilityScore}%</span>
                </div>
                <div class="demographic-item">
                    <div class="demographic-title">Key Factors for ${demographicProfile.name}</div>
                    <div class="demographic-content">
                        <ul>
                            ${demographicProfile.keyFactors.map(factor => `<li>${factor}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
    }
}

// Calculate lifestyle compatibility score
function calculateLifestyleCompatibility(insights, demographic) {
    if (!insights.overallAssessment) return 50;
    
    // Base score from overall assessment
    let compatibilityScore = insights.overallAssessment.score || 50;
    
    // Adjust based on demographic-specific strengths and weaknesses
    const demographicProfile = insightsGenerator.demographicProfiles[demographic];
    if (demographicProfile && insights.strengths && insights.weaknesses) {
        // Bonus for strengths in priority categories
        insights.strengths.forEach(strength => {
            const priority = demographicProfile.priorities.find(p => p.category === strength.categoryKey);
            if (priority && priority.importance === 'critical') {
                compatibilityScore += 10;
            } else if (priority && priority.importance === 'high') {
                compatibilityScore += 5;
            }
        });
        
        // Penalty for weaknesses in priority categories
        insights.weaknesses.forEach(weakness => {
            const priority = demographicProfile.priorities.find(p => p.category === weakness.categoryKey);
            if (priority && priority.importance === 'critical') {
                compatibilityScore -= 15;
            } else if (priority && priority.importance === 'high') {
                compatibilityScore -= 10;
            }
        });
    }
    
    return Math.max(0, Math.min(100, Math.round(compatibilityScore)));
}

// Override the original location insights function to use enhanced insights
const originalUpdateLocationInsights = updateLocationInsights;
window.updateLocationInsights = function(scoreData, services = null) {
    // Use enhanced insights if available, otherwise fall back to original
    if (insightsGenerator && services) {
        updateLocationInsightsEnhanced(scoreData, services);
    } else {
        originalUpdateLocationInsights.call(this, scoreData);
    }
};

// Update the quality assessment function to pass services to insights
const originalPerformQualityAssessment = performQualityAssessment;
window.performQualityAssessment = async function(location) {
    try {
        // Call original assessment
        await originalPerformQualityAssessment.call(this, location);
        
        // Generate enhanced insights with services data
        if (currentScore && currentServices && insightsGenerator) {
            updateLocationInsightsEnhanced(currentScore, currentServices);
        }
        
    } catch (error) {
        console.error('Enhanced quality assessment failed:', error);
        throw error;
    }
};

// Make Phase 5 functions globally accessible
window.switchInsightTab = switchInsightTab;
window.updateLocationInsightsEnhanced = updateLocationInsightsEnhanced;
