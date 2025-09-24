import { Loader } from '@googlemaps/js-api-loader';

// Get API key from environment with proper validation
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [GOOGLE-MAPS-LOADER] VITE_GOOGLE_MAPS_API_KEY not found in environment, using fallback');
    return 'AIzaSyChXxNp1xBJtJB9pC5WxWoZw3__7nT3djU';
  }
  return apiKey;
};

// Google Maps API configuration
const GOOGLE_MAPS_CONFIG = {
  apiKey: getApiKey(),
  version: 'weekly',
  libraries: ['places', 'geometry'] as ['places', 'geometry'],
  language: 'en',
  region: 'GB'
};

class GoogleMapsLoader {
  private loader: Loader;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    console.log('🔧 [GOOGLE-MAPS-LOADER] Initializing with config:', {
      apiKey: GOOGLE_MAPS_CONFIG.apiKey.substring(0, 10) + '...',
      version: GOOGLE_MAPS_CONFIG.version,
      libraries: GOOGLE_MAPS_CONFIG.libraries,
      language: GOOGLE_MAPS_CONFIG.language,
      region: GOOGLE_MAPS_CONFIG.region
    });
    this.loader = new Loader(GOOGLE_MAPS_CONFIG);
  }

  /**
   * Load Google Maps API
   */
  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) {
      console.log('✅ [GOOGLE-MAPS] API already loaded, skipping...');
      return;
    }

    if (this.loadPromise) {
      console.log('⏳ [GOOGLE-MAPS] API loading in progress, waiting...');
      return this.loadPromise;
    }

    console.log('🚀 [GOOGLE-MAPS] Starting to load Google Maps API...');
    this.loadPromise = this.loader.load().then(async () => {
      console.log('📦 [GOOGLE-MAPS] API script loaded, waiting for libraries...');
      // Wait for all required libraries to be available
      await this.waitForLibraries();
      this.isLoaded = true;
      console.log('✅ [GOOGLE-MAPS] API and all libraries loaded successfully');
    }).catch((error) => {
      console.error('❌ [GOOGLE-MAPS] Failed to load API:', error);
      this.loadPromise = null;
      throw error;
    });

    return this.loadPromise;
  }

  /**
   * Wait for all required Google Maps libraries to be available
   */
  private async waitForLibraries(): Promise<void> {
    return new Promise((resolve) => {
      const checkLibraries = () => {
        if (window.google && 
            window.google.maps && 
            window.google.maps.Geocoder &&
            window.google.maps.Map &&
            window.google.maps.Marker &&
            window.google.maps.InfoWindow &&
            typeof window.google.maps.Geocoder === 'function') {
          console.log('✅ [GOOGLE-MAPS] All required libraries are available');
          resolve();
        } else {
          console.log('⏳ [GOOGLE-MAPS] Waiting for libraries to be available...');
          setTimeout(checkLibraries, 50);
        }
      };
      checkLibraries();
    });
  }

  /**
   * Check if Google Maps is loaded
   */
  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!(window.google && window.google.maps);
  }

  /**
   * Get Google Maps instance
   */
  getGoogleMaps(): typeof google.maps | null {
    if (this.isGoogleMapsLoaded()) {
      return window.google.maps;
    }
    return null;
  }

  /**
   * Reset loader state (for testing)
   */
  reset(): void {
    this.isLoaded = false;
    this.loadPromise = null;
  }
}

export default new GoogleMapsLoader();
