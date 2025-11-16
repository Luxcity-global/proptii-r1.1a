// Real-time Quality of Life Score Updates - Phase 3
// Implements live score calculation and historical tracking

// Real-time Score Manager class
class RealTimeScoreManager {
    constructor(qualityScorer, serviceDiscovery) {
        this.qualityScorer = qualityScorer;
        this.serviceDiscovery = serviceDiscovery;
        this.isRealTimeEnabled = false;
        this.updateInterval = null;
        this.lastCalculation = null;
        this.calculationQueue = [];
        this.isCalculating = false;
        
        // Configuration
        this.config = {
            updateIntervalMs: 2000,        // Update every 2 seconds
            maxQueueSize: 5,               // Maximum pending calculations
            debounceMs: 500,               // Debounce map movements
            enableMapMovement: true,       // Track map center changes
            enableZoomUpdates: false       // Track zoom level changes
        };
        
        // Event tracking
        this.lastMapCenter = null;
        this.lastMapZoom = null;
        this.mapMoveTimeout = null;
    }

    // Enable real-time score updates
    enableRealTimeUpdates(map) {
        if (this.isRealTimeEnabled) return;
        
        this.isRealTimeEnabled = true;
        this.map = map;
        
        // Set up map event listeners
        this.setupMapListeners();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        console.log('Real-time score updates enabled');
    }

    // Disable real-time score updates
    disableRealTimeUpdates() {
        if (!this.isRealTimeEnabled) return;
        
        this.isRealTimeEnabled = false;
        
        // Clear intervals and timeouts
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.mapMoveTimeout) {
            clearTimeout(this.mapMoveTimeout);
            this.mapMoveTimeout = null;
        }
        
        // Remove map listeners
        if (this.map) {
            google.maps.event.clearListeners(this.map, 'center_changed');
            google.maps.event.clearListeners(this.map, 'zoom_changed');
        }
        
        console.log('Real-time score updates disabled');
    }

    // Set up map event listeners for real-time updates
    setupMapListeners() {
        if (!this.map) return;

        // Listen for map center changes
        this.map.addListener('center_changed', () => {
            if (!this.config.enableMapMovement) return;
            
            const newCenter = this.map.getCenter();
            
            // Check if movement is significant enough
            if (this.lastMapCenter && this.isSignificantMovement(this.lastMapCenter, newCenter)) {
                this.queueRealTimeUpdate(newCenter);
            }
            
            this.lastMapCenter = newCenter;
        });

        // Listen for zoom changes
        if (this.config.enableZoomUpdates) {
            this.map.addListener('zoom_changed', () => {
                const newZoom = this.map.getZoom();
                if (newZoom !== this.lastMapZoom) {
                    this.queueRealTimeUpdate(this.map.getCenter());
                    this.lastMapZoom = newZoom;
                }
            });
        }

        // Listen for drag end for more responsive updates
        this.map.addListener('dragend', () => {
            const center = this.map.getCenter();
            this.queueRealTimeUpdate(center, true); // Priority update
        });
    }

    // Check if map movement is significant enough to trigger update
    isSignificantMovement(oldCenter, newCenter) {
        const distance = this.calculateDistance(oldCenter, newCenter);
        return distance > 200; // 200 meters minimum movement
    }

    // Queue a real-time score update
    queueRealTimeUpdate(location, priority = false) {
        // Clear existing timeout
        if (this.mapMoveTimeout) {
            clearTimeout(this.mapMoveTimeout);
        }

        // Debounce the update
        this.mapMoveTimeout = setTimeout(() => {
            this.performRealTimeUpdate(location, priority);
        }, priority ? 100 : this.config.debounceMs);
    }

    // Perform real-time score update
    async performRealTimeUpdate(location, priority = false) {
        if (this.isCalculating && !priority) {
            // Add to queue if not priority
            if (this.calculationQueue.length < this.config.maxQueueSize) {
                this.calculationQueue.push({ location, timestamp: Date.now() });
            }
            return;
        }

        this.isCalculating = true;

        try {
            // Show loading indicator
            this.showRealTimeLoading();

            // Discover services for the new location
            const services = await this.serviceDiscovery.discoverServices(location);
            
            // Calculate enhanced score with real-time options
            const scoreOptions = {
                demographic: this.getCurrentDemographic(),
                timeContext: this.getCurrentTimeContext(),
                includeAdvancedFactors: true
            };
            
            const score = this.qualityScorer.calculateAreaScore(services, location, scoreOptions);
            
            // Update UI with new score
            this.updateRealTimeUI(score, location);
            
            // Store for historical tracking
            this.storeScoreData(score, location);
            
            // Update insights with real-time data
            this.updateRealTimeInsights(score, services);
            
            this.lastCalculation = {
                score: score,
                location: location,
                timestamp: Date.now(),
                services: services
            };

        } catch (error) {
            console.error('Real-time update failed:', error);
            this.showRealTimeError();
        } finally {
            this.isCalculating = false;
            this.hideRealTimeLoading();
            
            // Process next in queue
            this.processCalculationQueue();
        }
    }

    // Process queued calculations
    processCalculationQueue() {
        if (this.calculationQueue.length > 0 && !this.isCalculating) {
            const next = this.calculationQueue.shift();
            // Only process if recent (within 10 seconds)
            if (Date.now() - next.timestamp < 10000) {
                this.performRealTimeUpdate(next.location);
            }
        }
    }

    // Start periodic updates for background refresh
    startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.lastCalculation && this.map) {
                const currentCenter = this.map.getCenter();
                const lastLocation = this.lastCalculation.location;
                
                // Only update if we haven't moved significantly
                if (!this.isSignificantMovement(lastLocation, currentCenter)) {
                    // Refresh current location data
                    this.performRealTimeUpdate(currentCenter);
                }
            }
        }, this.config.updateIntervalMs);
    }

    // Get current demographic setting
    getCurrentDemographic() {
        // Check if user has selected a demographic preference
        const demographicSelect = document.getElementById('demographic-selector');
        return demographicSelect ? demographicSelect.value : 'general';
    }

    // Get current time context
    getCurrentTimeContext() {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        if (day === 0 || day === 6) return 'weekend';
        if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) return 'peak_hours';
        return 'off_peak';
    }

    // Update UI with real-time score
    updateRealTimeUI(score, location) {
        // Update dashboard
        if (window.updateQualityDashboard) {
            window.updateQualityDashboard(score);
        }
        
        // Update location insights
        if (window.updateLocationInsights) {
            window.updateLocationInsights(score);
        }
        
        // Update location name with coordinates
        const locationName = `Live Assessment (${location.lat().toFixed(4)}, ${location.lng().toFixed(4)})`;
        if (window.updateLocationName) {
            window.updateLocationName(locationName);
        }

        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('realTimeScoreUpdate', {
            detail: { score, location, timestamp: Date.now() }
        }));
    }

    // Update insights with real-time context
    updateRealTimeInsights(score, services) {
        const insightsElement = document.getElementById('insights-summary');
        if (!insightsElement) return;

        const realTimeInsights = this.generateRealTimeInsights(score, services);
        
        // Add real-time badge
        const realTimeBadge = '<span class="real-time-badge">🔴 Live</span>';
        
        // Update insights with real-time indicator
        let insightsHTML = insightsElement.innerHTML;
        if (!insightsHTML.includes('real-time-badge')) {
            insightsHTML = realTimeBadge + insightsHTML;
            insightsElement.innerHTML = insightsHTML;
        }
    }

    // Generate real-time specific insights
    generateRealTimeInsights(score, services) {
        const insights = [];
        const timeContext = this.getCurrentTimeContext();
        
        insights.push(`Real-time assessment (${timeContext})`);
        
        if (timeContext === 'peak_hours') {
            insights.push('Peak hours - transport and essential services emphasized');
        } else if (timeContext === 'weekend') {
            insights.push('Weekend context - social and recreational venues emphasized');
        }
        
        return insights;
    }

    // Store score data for historical tracking
    storeScoreData(score, location) {
        try {
            const storageKey = 'qol_realtime_history';
            let history = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Add new score data
            const scoreData = {
                timestamp: Date.now(),
                score: score.overall,
                location: {
                    lat: location.lat(),
                    lng: location.lng()
                },
                categories: Object.fromEntries(
                    Object.entries(score.categories).map(([key, value]) => [key, value.score])
                ),
                demographic: this.getCurrentDemographic(),
                timeContext: this.getCurrentTimeContext()
            };
            
            history.push(scoreData);
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history = history.slice(-100);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(history));
        } catch (error) {
            console.warn('Failed to store score data:', error);
        }
    }

    // Show real-time loading indicator
    showRealTimeLoading() {
        const indicator = document.getElementById('real-time-indicator');
        if (indicator) {
            indicator.textContent = '🔄 Updating...';
            indicator.className = 'real-time-indicator loading';
        }
    }

    // Hide real-time loading indicator
    hideRealTimeLoading() {
        const indicator = document.getElementById('real-time-indicator');
        if (indicator) {
            indicator.textContent = '🔴 Live';
            indicator.className = 'real-time-indicator active';
        }
    }

    // Show real-time error
    showRealTimeError() {
        const indicator = document.getElementById('real-time-indicator');
        if (indicator) {
            indicator.textContent = '⚠️ Error';
            indicator.className = 'real-time-indicator error';
            
            setTimeout(() => {
                indicator.textContent = '🔴 Live';
                indicator.className = 'real-time-indicator active';
            }, 3000);
        }
    }

    // Calculate distance between two points
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

    // Get configuration
    getConfig() {
        return { ...this.config };
    }

    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current status
    getStatus() {
        return {
            isEnabled: this.isRealTimeEnabled,
            isCalculating: this.isCalculating,
            queueSize: this.calculationQueue.length,
            lastUpdate: this.lastCalculation?.timestamp || null
        };
    }
}

// Historical Score Tracker class
class HistoricalScoreTracker {
    constructor() {
        this.storageKey = 'qol_score_history';
        this.maxEntries = 1000;
    }

    // Add score to history
    addScore(score, location, metadata = {}) {
        try {
            const history = this.getHistory();
            
            const entry = {
                id: this.generateId(),
                timestamp: Date.now(),
                score: score.overall,
                categories: Object.fromEntries(
                    Object.entries(score.categories).map(([key, value]) => [key, value.score])
                ),
                location: {
                    lat: location.lat(),
                    lng: location.lng()
                },
                metadata: {
                    version: score.metadata?.version || '3.0',
                    demographic: metadata.demographic || 'general',
                    timeContext: metadata.timeContext || 'general',
                    ...metadata
                }
            };
            
            history.push(entry);
            
            // Maintain size limit
            if (history.length > this.maxEntries) {
                history.splice(0, history.length - this.maxEntries);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(history));
            
            return entry.id;
        } catch (error) {
            console.error('Failed to add score to history:', error);
            return null;
        }
    }

    // Get full history
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Failed to load score history:', error);
            return [];
        }
    }

    // Get recent scores (last N entries)
    getRecentScores(count = 10) {
        const history = this.getHistory();
        return history.slice(-count);
    }

    // Get scores for specific location (within radius)
    getScoresNearLocation(location, radiusMeters = 1000) {
        const history = this.getHistory();
        
        return history.filter(entry => {
            const distance = this.calculateDistance(
                location,
                { lat: () => entry.location.lat, lng: () => entry.location.lng }
            );
            return distance <= radiusMeters;
        });
    }

    // Get score statistics
    getStatistics() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            return {
                count: 0,
                averageScore: 0,
                maxScore: 0,
                minScore: 0,
                scoreDistribution: {},
                timeRange: null
            };
        }

        const scores = history.map(entry => entry.score);
        const sortedScores = [...scores].sort((a, b) => a - b);
        
        return {
            count: history.length,
            averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            medianScore: sortedScores[Math.floor(sortedScores.length / 2)],
            scoreDistribution: this.calculateScoreDistribution(scores),
            timeRange: {
                earliest: Math.min(...history.map(entry => entry.timestamp)),
                latest: Math.max(...history.map(entry => entry.timestamp))
            }
        };
    }

    // Calculate percentile ranking for a score
    calculatePercentile(score) {
        const history = this.getHistory();
        
        if (history.length === 0) return 50; // Default to 50th percentile
        
        const scores = history.map(entry => entry.score).sort((a, b) => a - b);
        const index = scores.findIndex(s => s >= score);
        
        if (index === -1) return 100; // Higher than all recorded scores
        
        return Math.round((index / scores.length) * 100);
    }

    // Calculate score distribution
    calculateScoreDistribution(scores) {
        const distribution = {
            excellent: 0, // 85-100
            good: 0,      // 70-84
            average: 0,   // 55-69
            poor: 0,      // 40-54
            very_poor: 0  // 0-39
        };

        scores.forEach(score => {
            if (score >= 85) distribution.excellent++;
            else if (score >= 70) distribution.good++;
            else if (score >= 55) distribution.average++;
            else if (score >= 40) distribution.poor++;
            else distribution.very_poor++;
        });

        return distribution;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calculate distance (reused utility)
    calculateDistance(location1, location2) {
        const lat1 = location1.lat();
        const lng1 = location1.lng();
        const lat2 = location2.lat();
        const lng2 = location2.lng();

        const R = 6371e3;
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

    // Clear history
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    // Export history as JSON
    exportHistory() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(dataBlob);
    }
}

// Export classes for browser environment
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        RealTimeScoreManager,
        HistoricalScoreTracker
    };
} else {
    // Browser environment - make available globally
    window.RealTimeScoreManager = RealTimeScoreManager;
    window.HistoricalScoreTracker = HistoricalScoreTracker;
}
