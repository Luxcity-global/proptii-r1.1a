/**
 * Google Maps Debug Utility
 * Helps diagnose Google Maps API loading issues
 */

export const debugGoogleMaps = {
  /**
   * Test API key validity by making a simple request
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
      
      console.log('🔍 [DEBUG] Testing API key with URL:', testUrl);
      
      // Create a test script element
      const script = document.createElement('script');
      script.src = testUrl;
      script.async = true;
      script.defer = true;
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ [DEBUG] API key test timed out');
          document.head.removeChild(script);
          resolve(false);
        }, 10000);
        
        // @ts-ignore
        window.initMap = () => {
          clearTimeout(timeout);
          console.log('✅ [DEBUG] API key is valid');
          document.head.removeChild(script);
          // @ts-ignore
          delete window.initMap;
          resolve(true);
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          console.error('❌ [DEBUG] API key test failed - script failed to load');
          document.head.removeChild(script);
          resolve(false);
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('❌ [DEBUG] API key test error:', error);
      return false;
    }
  },

  /**
   * Check current Google Maps state
   */
  checkCurrentState(): void {
    console.log('🔍 [DEBUG] Current Google Maps state:');
    console.log('- window.google exists:', !!window.google);
    console.log('- window.google.maps exists:', !!(window.google && window.google.maps));
    console.log('- Geocoder available:', !!(window.google && window.google.maps && window.google.maps.Geocoder));
    console.log('- Map available:', !!(window.google && window.google.maps && window.google.maps.Map));
    console.log('- Marker available:', !!(window.google && window.google.maps && window.google.maps.Marker));
    console.log('- InfoWindow available:', !!(window.google && window.google.maps && window.google.maps.InfoWindow));
    
    if (window.google && window.google.maps) {
      console.log('- Maps version:', window.google.maps.version || 'unknown');
    }
  },

  /**
   * Test network connectivity to Google Maps
   */
  async testNetworkConnectivity(): Promise<boolean> {
    try {
      console.log('🔍 [DEBUG] Testing network connectivity to Google Maps...');
      
      await fetch('https://maps.googleapis.com/maps/api/js', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      console.log('✅ [DEBUG] Network connectivity test passed');
      return true;
    } catch (error) {
      console.error('❌ [DEBUG] Network connectivity test failed:', error);
      return false;
    }
  },

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics(apiKey: string): Promise<void> {
    console.log('🚀 [DEBUG] Starting Google Maps diagnostics...');
    
    // Check current state
    this.checkCurrentState();
    
    // Test network connectivity
    await this.testNetworkConnectivity();
    
    // Test API key
    const apiKeyValid = await this.testApiKey(apiKey);
    
    console.log('📊 [DEBUG] Diagnostics summary:');
    console.log('- API Key valid:', apiKeyValid);
    console.log('- Network connectivity:', await this.testNetworkConnectivity());
    console.log('- Current state checked above');
  }
};

export default debugGoogleMaps;
